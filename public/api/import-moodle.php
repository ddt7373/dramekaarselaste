<?php
/**
 * Moodle & IMSCC Import API Endpoint
 * 
 * Imports Moodle backup (.mbz) OR IMS Common Cartridge (.imscc) into LMS.
 * Auto-detects format via magic bytes.
 * USES ANON KEY for internal auth (relies on RLS allowing 'anon' or logic).
 * 
 * UPDATES: 
 * - Debug Logging in Lesson Content for failed imports.
 * - URL Decode for hrefs.
 * - Case-insensitive file search for better Windows/Linux compat.
 */

// Raise limits first (MBZ extraction can use a lot of memory)
ini_set('memory_limit', '1024M');
set_time_limit(300);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// 1. Configuration & Auth (same Supabase as frontend – lms IDs are UUIDs)
// -----------------------------------------------------------------------------
$SUPABASE_URL = getenv('SUPABASE_URL') ?: 'https://wskkdnzeqgdjxqozyfut.supabase.co';
$SUPABASE_KEY = getenv('SUPABASE_ANON_KEY') ?: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indza2tkbnplcWdkanhxb3p5ZnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTI0NjksImV4cCI6MjA4NDcyODQ2OX0.-3meCJRS113LZvD6sSk0P5--Axrnuk39bjAnCK9BSv0';
$AUTH_TOKEN = $SUPABASE_KEY;

// Use system temp dir (writable on shared hosts); avoid __DIR__/../ which often is not
$TEMP_DIR = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'lms_import_' . uniqid('', true);

// 2. Helpers
// -----------------------------------------------------------------------------

function sendResponse($success, $message, $data = [], $code = 200) {
    global $TEMP_DIR;
    if (function_exists('ob_get_length') && ob_get_length()) ob_end_clean();
    recursiveDelete($TEMP_DIR);
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit();
}

function recursiveDelete($dir) {
    if (!is_dir($dir)) return;
    $files = array_diff(scandir($dir), array('.', '..'));
    foreach ($files as $file) {
        (is_dir("$dir/$file")) ? recursiveDelete("$dir/$file") : unlink("$dir/$file");
    }
    rmdir($dir);
}

function getDriveFileId($url) {
    preg_match('/[-\w]{25,}/', $url, $matches);
    return isset($matches[0]) ? $matches[0] : null;
}

$authDebug = [];

function downloadDriveFile($fileId, $destination) {
    global $authDebug, $TEMP_DIR;
    // Start with the standard base URL
    $baseUrl = "https://drive.google.com/uc?export=download&id=$fileId";
    
    // Use the same TEMP_DIR as the rest of the script for cookies to ensure permission match
    if (!file_exists($TEMP_DIR)) mkdir($TEMP_DIR, 0777, true);
    $cookieFile = $TEMP_DIR . '/gdrive_cookie.txt';
    if (file_exists($cookieFile)) unlink($cookieFile); // Start fresh
    
    debug_log("Download: Initial request to $baseUrl");

    // 1. Initial Request
    $ch = curl_init($baseUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true); 
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);
    curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
    curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0"); // Simple UA
    
    $response = curl_exec($ch);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $headers = substr($response, 0, $headerSize);
    $body = substr($response, $headerSize);
    $effectiveUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL); 
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    debug_log("Download: Initial response code $httpCode. Effective URL: $effectiveUrl");

    // Debug Info
    $authDebug['first_header_sample'] = substr($headers, 0, 100);
    $authDebug['first_http_code'] = $httpCode;
    $authDebug['first_effective_url'] = $effectiveUrl;

    if (stripos($body, 'Virus scan warning') !== false) {
        debug_log("Download: Virus scan warning detected.");
        $authDebug['status'] = "warning_detected";
        
        $confirmCode = null;
        $confirmUrl = null;

        // Strategy A: Check for a full link with confirm=
        if (preg_match('/href="([^"]*confirm=[^"&]+[^"]*)"/i', $body, $matches)) {
            $matchedUrl = html_entity_decode($matches[1]);
            if (strpos($matchedUrl, 'http') === 0) {
                $confirmUrl = $matchedUrl;
            } else {
                $parsed = parse_url($effectiveUrl);
                $host = $parsed['scheme'] . "://" . $parsed['host'];
                $confirmUrl = $host . $matchedUrl;
            }
            $authDebug['strategy'] = "A_link_found";
            debug_log("Download: Strategy A found URL: $confirmUrl");
        }
        // Strategy B: Extract code and append to EFFECTIVE url
        else {
            if (preg_match('/name="confirm" value="([^"]+)"/', $body, $matches)) {
                 $confirmCode = $matches[1];
            } elseif (preg_match('/confirm=([a-zA-Z0-9_\-]+)/', $body, $matches)) {
                 $confirmCode = $matches[1];
            }
            
            if ($confirmCode) {
                // Remove existing confirm param if present to avoid duplication (rare but possible)
                // Just append cleanly
                $separator = (parse_url($effectiveUrl, PHP_URL_QUERY) == NULL) ? '?' : '&';
                $confirmUrl = $effectiveUrl . $separator . "confirm=$confirmCode";
                $authDebug['strategy'] = "B_append_to_effective";
                debug_log("Download: Strategy B constructed URL: $confirmUrl");
            }
        }
        
        $authDebug['extracted_code'] = $confirmCode;
        $authDebug['confirm_url'] = $confirmUrl;

        if ($confirmUrl) {
            $fp = fopen($destination, 'w+');
            if ($fp === false) {
                $authDebug['error'] = "Filesystem Error: Could not open destination ($destination)";
                debug_log("Download: Error opening destination file.");
                return false;
            }
            
            debug_log("Download: Starting confirmation download...");
            $ch = curl_init($confirmUrl);
            curl_setopt($ch, CURLOPT_FILE, $fp);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            // Reuse cookies
            curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);
            curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
            curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0");
            
            curl_exec($ch);
            // Check for curl errors
            if (curl_errno($ch)) {
                $err = curl_error($ch);
                $authDebug['curl_error'] = $err;
                debug_log("Download: cURL Error during confirmation: $err");
            }
            curl_close($ch);
            fclose($fp);
            debug_log("Download: Confirmation download finished.");
        } else {
             $authDebug['error'] = "Warning detected but no code/url found";
             debug_log("Download: Warning detected but NO confirmation code/url found.");
             file_put_contents($destination, $body);
        }
        
    } else {
        debug_log("Download: No warning detected. Assuming direct download.");
        $authDebug['status'] = "no_warning_file_downloaded";
        file_put_contents($destination, $body);
    }
    
    // Clean cookies
    if (file_exists($cookieFile)) unlink($cookieFile);
    
    if (file_exists($destination)) {
        $fSize = filesize($destination);
        $authDebug['final_size'] = $fSize;
        debug_log("Download: File saved. Size: $fSize bytes.");
        return $fSize > 10000; // Assume valid backup is > 10KB
    }
    return false;
}

function supabaseInsert($table, $data) {
    global $SUPABASE_URL, $AUTH_TOKEN;
    $url = "$SUPABASE_URL/rest/v1/$table";
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "apikey: $AUTH_TOKEN", 
        "Authorization: Bearer $AUTH_TOKEN",
        "Content-Type: application/json",
        "Prefer: return=representation"
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode >= 400) return null;
    $result = json_decode($response, true);
    return isset($result[0]) ? $result[0]['id'] : null;
}

function uploadToSupabaseStorage($localPath, $destPath) {
    global $SUPABASE_URL, $AUTH_TOKEN;
    $bucket = 'lms-content';
    $url = "$SUPABASE_URL/storage/v1/object/$bucket/$destPath";
    
    $fileContent = file_get_contents($localPath);
    $mime = 'application/octet-stream';
    if (function_exists('mime_content_type')) {
        $mime = mime_content_type($localPath);
    } else {
        $ext = pathinfo($localPath, PATHINFO_EXTENSION);
        $mimes = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'gif' => 'image/gif', 'svg' => 'image/svg+xml'];
        if (isset($mimes[strtolower($ext)])) $mime = $mimes[strtolower($ext)];
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $fileContent);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "apikey: $AUTH_TOKEN", 
        "Authorization: Bearer $AUTH_TOKEN",
        "Content-Type: $mime",
        "upsert: true"
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode >= 200 && $httpCode < 300) {
        return "$SUPABASE_URL/storage/v1/object/public/$bucket/$destPath";
    }
    return null;
}

// Case-insensitive file search helper
function findFileCaseInsensitive($path) {
    if (file_exists($path)) return $path;
    
    $dir = dirname($path);
    $file = basename($path);
    if (!is_dir($dir)) return false;
    
    $files = scandir($dir);
    foreach ($files as $f) {
        if (strtolower($f) === strtolower($file)) {
            return $dir . '/' . $f;
        }
    }
    return false;
}

// 3. QTI Parser (For Quizzes)
// -----------------------------------------------------------------------------
function parseQTIQuiz($filePath, $lessonId) {
    if (!file_exists($filePath)) return;
    
    $xml = simplexml_load_file($filePath);
    $namespaces = $xml->getNamespaces(true);
    $xml->registerXPathNamespace('qti', 'http://www.imsglobal.org/xsd/ims_qtiasiv1p2');

    $items = $xml->xpath('//qti:item');
    if (empty($items)) {
         $items = $xml->xpath('//item');
    }

    $order = 0;
    foreach ($items as $item) {
        $qText = "";
        $mattext = $item->xpath('.//mattext');
        if (!empty($mattext)) {
            $qText = (string)$mattext[0];
        } else {
            $qText = "Question " . ($order + 1);
        }

        $qType = 'text'; 
        $responseLid = $item->xpath('.//response_lid');
        if (!empty($responseLid)) {
            $qType = 'multiple_choice'; 
        }

        supabaseInsert('lms_questions', [
            'les_id' => $lessonId,
            'vraag_teks' => strip_tags($qText),
            'vraag_tipe' => $qType,
            'punte' => 1,
            'volgorde' => $order++
        ]);
    }
}

// 4. Moodle Parser
// -----------------------------------------------------------------------------

function parseMoodleQuestionBank($dir) {
    $qPath = "$dir/questions.xml";
    if (!file_exists($qPath)) {
        $qPath = "$dir/course/questions.xml";
    }
    if (!file_exists($qPath)) return [];

    $xml = @simplexml_load_file($qPath, 'SimpleXMLElement', LIBXML_NOCDATA);
    if ($xml === false) return [];

    $bank = [];

    // Moodle questions are usually nested in categories
    $questions = $xml->xpath('//question');
    if (empty($questions)) return [];

    foreach ($questions as $q) {
        $id = (string)$q['id'];
        $type = (string)$q->qtype; // multichoice, truefalse, shortanswer, etc.
        // questiontext can be <questiontext><text>CDATA</text></questiontext>
        $text = (string)($q->questiontext->text ?? $q->questiontext);
        
        // Skip 'category' pseudo-questions
        if ($type === 'category') continue;

        $qData = [
            'type' => 'text', // default
            'text' => trim(strip_tags($text)) ?: 'Vraag ' . $id,
            'options' => null,
            'answer' => '',
            'points' => (int)$q->defaultmark
        ];

        if ($type === 'multichoice' && isset($q->answers->answer)) {
            $qData['type'] = 'mcq';
            $choices = [];
            $correctIndex = 0;
            $idx = 0;
            foreach ($q->answers->answer as $ans) {
                $choices[] = strip_tags((string)($ans->answertext->text ?? $ans->answertext));
                if ((float)$ans->fraction > 0.9) { // 1.0 = 100%
                    $correctIndex = $idx;
                }
                $idx++;
            }
            $qData['options'] = ['choices' => $choices];
            $qData['answer'] = (string)$correctIndex;

        } elseif ($type === 'truefalse' && isset($q->answers->answer)) {
            $qData['type'] = 'true_false';
            // Moodle stores it as answer IDs usually, but let's see fraction
            // Typically two answers: True and False.
            foreach ($q->answers->answer as $ans) {
                $txt = strip_tags((string)($ans->answertext->text ?? $ans->answertext));
                if ((float)$ans->fraction > 0.9) {
                    $qData['answer'] = (stripos($txt, 'true') !== false || stripos($txt, 'waar') !== false) ? 'true' : 'false';
                }
            }
        }

        $bank[$id] = $qData;
    }
    return $bank;
}

function parseMoodleMBZ($dir, $opts = []) {
    if (!file_exists("$dir/moodle_backup.xml")) {
        return ['success' => false, 'message' => "Invalid Moodle backup. 'moodle_backup.xml' missing."];
    }

    // 1. Load Question Bank (for quiz questions)
    $questionBank = parseMoodleQuestionBank($dir);

    $xml = simplexml_load_file("$dir/moodle_backup.xml");
    $courseName = (string)$xml->information->original_course_fullname;
    $courseShort = (string)$xml->information->original_course_shortname;

    $importIntoCourse = isset($opts['course_id']) && $opts['course_id'] !== '' && $opts['course_id'] !== '0';
    $targetModuleId = (isset($opts['module_id']) && $opts['module_id'] !== '' && $opts['module_id'] !== '0') ? trim((string)$opts['module_id']) : null;

    if ($importIntoCourse) {
        $courseId = trim((string)$opts['course_id']);
        if (!$targetModuleId) {
            $newModId = supabaseInsert('lms_modules', [
                'kursus_id' => $courseId,
                'titel' => 'Ingevoer vanaf MBZ - ' . date('Y-m-d H:i'),
                'volgorde' => 999,
                'is_aktief' => true
            ]);
            if (!$newModId) return ['success' => false, 'message' => "Kon nie nuwe module skep nie."];
            $targetModuleId = $newModId;
        }
        // All sections map to this one module
        $sectionMap = [];
        if (isset($xml->information->contents->sections->section)) {
            foreach ($xml->information->contents->sections->section as $sec) {
                $sectionMap[(string)$sec->sectionid] = $targetModuleId;
            }
        }
        // Ensure every activity's sectionid maps to target module
        if (isset($xml->information->contents->activities->activity)) {
            foreach ($xml->information->contents->activities->activity as $act) {
                $sectionMap[(string)$act->sectionid] = $targetModuleId;
            }
        }
    } else {
        $courseId = supabaseInsert('lms_kursusse', [
            'titel' => $courseName,
            'beskrywing' => "Ingevoer vanaf Moodle (.mbz) - $courseShort",
            'kategorie' => 'Ander', 'vlak' => 'beginner', 'prys' => 0,
            'is_gratis' => true, 'duur_minute' => 0, 'is_aktief' => true, 'is_gepubliseer' => true
        ]);
        if (!$courseId) return ['success' => false, 'message' => "Database Insert Failed (Course)."];
        $sectionMap = [];
        $contents = $xml->information->contents;
        if (isset($contents->sections->section)) {
            foreach ($contents->sections->section as $sec) {
                $sid = (string)$sec->sectionid;
                $title = (string)$sec->title;
                $checkPath = "$dir/sections/section_$sid/section.xml";
                if (file_exists($checkPath)) {
                    $sXml = simplexml_load_file($checkPath);
                    if (isset($sXml->name) && (string)$sXml->name !== '') $title = (string)$sXml->name;
                }
                if (!$title) $title = "Afdeling $sid";
                $mid = supabaseInsert('lms_modules', [
                    'kursus_id' => $courseId, 'titel' => $title, 'volgorde' => (int)$sid, 'is_aktief' => true
                ]);
                $sectionMap[$sid] = $mid;
            }
        }
    }

    $contents = $xml->information->contents;

    if (isset($contents->activities->activity)) {
        $order = 0;
        foreach ($contents->activities->activity as $act) {
            $mod = (string)$act->modulename;
            $sid = (string)$act->sectionid;
            $title = (string)$act->title;
            $dirPath = (string)$act->directory;
            
            $mid = isset($sectionMap[$sid]) ? $sectionMap[$sid] : null;
            if (!$mid) continue;

            $actDir = "$dir/$dirPath";
            $content = '';
            $type = 'teks'; 
            
            if ($mod === 'page' || $mod === 'resource') {
                $modPath = findFileCaseInsensitive("$actDir/$mod.xml") ?: "$actDir/$mod.xml";
                if (file_exists($modPath)) {
                     $aXml = simplexml_load_file($modPath, 'SimpleXMLElement', LIBXML_NOCDATA);
                     if ($aXml === false) { $content = ''; } else {
                         // Moodle: activity root has ->page->content, or root is ->content (page.xml), or ->intro
                         $content = (string)($aXml->page->content ?? $aXml->content ?? $aXml->intro ?? '');
                         $content = html_entity_decode(html_entity_decode($content));
                     }
                }
            } elseif ($mod === 'url') {
                 if (file_exists("$actDir/url.xml")) {
                     $aXml = simplexml_load_file("$actDir/url.xml");
                     $u = (string)$aXml->url->externalurl;
                     $content = "Link: <a href='$u' target='_blank'>$u</a><br/>" . (string)$aXml->intro;
                 }
            } elseif ($mod === 'lesson') {
                 // Handle Moodle Lesson Activity -> Multiple LMS Lessons (Pages)
                 $logMsg = "Processing Lesson Activity: $title (Dir: $actDir)\n";
                 file_put_contents('debug_moodle_import.txt', $logMsg, FILE_APPEND);

                 $lessonXmlPath = "$actDir/lesson.xml";
                 $pagesFound = false;

                 if (file_exists($lessonXmlPath)) {
                     $lXml = simplexml_load_file($lessonXmlPath, 'SimpleXMLElement', LIBXML_NOCDATA);
                     
                     // Check for different root structures (sometimes root is activity, sometimes lesson)
                     $pagesNode = isset($lXml->pages) ? $lXml->pages : (isset($lXml->lesson->pages) ? $lXml->lesson->pages : null);

                     if ($pagesNode && isset($pagesNode->page)) {
                         foreach ($pagesNode->page as $page) {
                             $pageTitle = (string)$page->title;
                             // Moodle: contents can be <contents><content>CDATA</content></contents> or <contents>CDATA</contents>
                             $pageContent = (string)($page->contents->content ?? $page->contents ?? $page->content ?? '');
                             
                             // Moodle content can be double encoded. Decode twice to be safe.
                             // Example: &lt;p&gt; -> <p>
                             $pageContent = html_entity_decode($pageContent);
                             $pageContent = html_entity_decode($pageContent); // Second pass just in case

                             // 0. Handle Images (@@PLUGINFILE@@) using File API
                             // We need to look in the activity folder for 'files.xml' or similar, 
                             // but Moodle MBZ structure for files is usually hashed in 'files/' directory at root.
                             // The '@@PLUGINFILE@@/filename.png' actually refers to files linked to this context.
                             // Finding the EXACT file in MBZ is complex because it uses sha1 hashes.
                             // Simplified approach: scan 'files.xml' in root to map filename -> contenthash
                             
                             // We need to perform this mapping ONCE per import ideally, but let's do lazy load or quick scan
                             // if regex finds PLUGINFILE
                             
                             if (strpos($pageContent, '@@PLUGINFILE@@') !== false) {
                                 // We need to find the file in the backup
                                 // Load valid files list
                                 if (!isset($filesMap)) {
                                     $filesMap = [];
                                     if (file_exists("$dir/files.xml")) {
                                         $fXml = simplexml_load_file("$dir/files.xml");
                                         foreach ($fXml->file as $f) {
                                             $fName = (string)$f->filename;
                                             $cHash = (string)$f->contenthash;
                                             if ($fName && $fName !== '.') {
                                                 // Map filename to hash
                                                 // Note: Collisions possible if same filename used in different contexts
                                                 // Ideally we verify contextid, but simple mapping first.
                                                 $filesMap[$fName] = $cHash;
                                             }
                                         }
                                     }
                                 }

                                 // Replace regex
                                 $pageContent = preg_replace_callback('/@@PLUGINFILE@@\/([^"\'\s]+)/', function($matches) use ($filesMap, $dir) {
                                     $cleanName = urldecode($matches[1]);
                                     if (isset($filesMap[$cleanName])) {
                                         $hash = $filesMap[$cleanName];
                                         $source = "$dir/files/" . substr($hash, 0, 2) . "/$hash";
                                          if (file_exists($source)) {
                                              $ext = pathinfo($cleanName, PATHINFO_EXTENSION);
                                              if (empty($ext) && function_exists('mime_content_type')) {
                                                  $mime = mime_content_type($source);
                                                  if ($mime && strpos($mime, '/') !== false) {
                                                      $ext = explode('/', $mime)[1];
                                                  }
                                              }
                                              $storagePath = "moodle-images/" . $hash . "." . $ext;
                                              $publicUrl = uploadToSupabaseStorage($source, $storagePath);
                                              
                                              if ($publicUrl) {
                                                  return $publicUrl;
                                              }
                                          }
                                     }
                                     return $matches[0]; // Failed to find
                                 }, $pageContent);
                             }

                             // 1. Strip Microsoft Word classes (MsoNormal, WordSection1)
                             $pageContent = preg_replace('/class="Mso[^"]*"/', '', $pageContent);
                             $pageContent = preg_replace('/class="WordSection[^"]*"/', '', $pageContent);
                             
                             // 2. Strip inline styles (optional, but good for consistent LMS styling)
                             // Matches style="..." non-greedy
                             $pageContent = preg_replace('/style="[^"]*"/', '', $pageContent);

                             // 3. Remove empty spans that might be left over
                             $pageContent = preg_replace('/<span>\s*<\/span>/', '', $pageContent);

                             // 4. Remove lang attributes
                             $pageContent = preg_replace('/lang="[^"]*"/', '', $pageContent);

                             // 5. Clean up extra whitespace
                             $pageContent = trim(preg_replace('/\s+/', ' ', $pageContent));

                             $insId = supabaseInsert('lms_lesse', [
                                 'kursus_id' => $courseId, 
                                 'module_id' => $mid, 
                                 'titel' => $pageTitle, 
                                 'tipe' => 'teks',
                                 'inhoud' => $pageContent, 
                                 'volgorde' => ++$order, 
                                 'duur_minute' => 10, 
                                 'is_aktief' => true,
                                 'slaag_persentasie' => 50
                             ]);
                             
                             if ($insId) {
                                 $pagesFound = true;
                                 file_put_contents('debug_moodle_import.txt', "  - Imported Page: $pageTitle\n", FILE_APPEND);
                             }
                         }
                     } else {
                         file_put_contents('debug_moodle_import.txt', "  - No pages found in XML structure.\n", FILE_APPEND);
                     }
                 } else {
                     file_put_contents('debug_moodle_import.txt', "  - lesson.xml NOT found.\n", FILE_APPEND);
                 }

                 if (!$pagesFound) {
                     // Fallback: Import the Lesson Activity itself as a placeholder if pages failed
                     file_put_contents('debug_moodle_import.txt', "  - Fallback: Importing main lesson activity container.\n", FILE_APPEND);
                     // Let the generic logic handle it or do it here
                     // We'll let it drop through to generic? No, 'continue' was here.
                     // Let's manually do the generic insert here for safety
                     supabaseInsert('lms_lesse', [
                        'kursus_id' => $courseId, 'module_id' => $mid, 'titel' => $title . " (Inhoud)", 
                        'tipe' => 'teks', 'inhoud' => "Inhoud kon nie gelaai word nie. Gaan na log.", 
                        'volgorde' => ++$order, 'duur_minute' => 10, 'is_aktief' => true
                     ]);
                 }
                 continue; 
            } elseif ($mod === 'quiz') {
                $type = 'toets';
                if (file_exists("$actDir/quiz.xml")) {
                    $aXml = simplexml_load_file("$actDir/quiz.xml");
                    $content = (string)$aXml->intro;
                }
            } else { continue; }

            $lid = supabaseInsert('lms_lesse', [
                'kursus_id' => $courseId, 'module_id' => $mid, 'titel' => $title, 'tipe' => $type,
                'inhoud' => $content, 'volgorde' => ++$order, 'duur_minute' => 10, 'is_aktief' => true,
                'slaag_persentasie' => 50
            ]);
            
            if ($type === 'toets' && $lid) {
                // Parse Quiz Questions from quiz.xml
                 if (file_exists("$actDir/quiz.xml")) {
                    $qXml = simplexml_load_file("$actDir/quiz.xml");
                    
                    // Moodle stores question references in <question_instances> or similar.
                    // Structure: <question_instances><question_instance><question>ID</question>...
                    $questionInstances = $qXml->xpath('//question_instance');
                    $qOrder = 0;
                    
                    foreach ($questionInstances as $inst) {
                         $qid = (string)$inst->question; // ID reference
                         if (isset($questionBank[$qid])) {
                             $qData = $questionBank[$qid];
                             supabaseInsert('lms_questions', [
                                'les_id' => $lid, 
                                'vraag_teks' => $qData['text'], 
                                'vraag_tipe' => $qData['type'], 
                                'opsies' => $qData['options'] ? json_encode($qData['options']) : null,
                                'korrekte_antwoord' => $qData['answer'],
                                'punte' => $qData['points'] ?: 1, 
                                'volgorde' => $qOrder++
                            ]);
                         }
                    }

                    if ($qOrder === 0) {
                        // Fallback if no questions found (maybe old moodle format without question_instances?)
                         supabaseInsert('lms_questions', [
                            'les_id' => $lid, 'vraag_teks' => 'Geen vrae gevind in invoer', 'vraag_tipe' => 'text', 'punte' => 0, 'volgorde' => 0
                        ]);
                    }
                 }
            }
        }
    }
    return ['success' => true, 'course_id' => $courseId];
}

// 5. IMSCC Parser (Refined)
// -----------------------------------------------------------------------------
function parseIMSCC($dir) {
    if (!file_exists("$dir/imsmanifest.xml")) {
        $subdirs = glob("$dir/*", GLOB_ONLYDIR);
        if (count($subdirs) === 1 && file_exists($subdirs[0] . "/imsmanifest.xml")) {
            $dir = $subdirs[0]; 
        } else {
            return ['success' => false, 'message' => "Invalid IMSCC. 'imsmanifest.xml' missing."];
        }
    }

    $xml = simplexml_load_file("$dir/imsmanifest.xml");
    
    $namespaces = $xml->getNamespaces(true);
    $defNs = isset($namespaces['']) ? $namespaces[''] : 'http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1';
    $xml->registerXPathNamespace('ims', $defNs);
    $xml->registerXPathNamespace('lom', 'http://ltsc.ieee.org/xsd/LOM');

    // Title
    $title = "Ingevoerde Kursus (IMSCC)";
    $titles = $xml->xpath('//lom:general/lom:title/lom:string');
    if (!empty($titles)) {
        $title = (string)$titles[0];
    } else {
        if (isset($xml->metadata->schema)) $title = "Import: " . (string)$xml->metadata->schema;
    }

    $courseId = supabaseInsert('lms_kursusse', [
        'titel' => $title,
        'beskrywing' => "Ingevoer vanaf IMSCC Backup",
        'kategorie' => 'Ander', 'vlak' => 'beginner', 'prys' => 0,
        'is_gratis' => true, 'duur_minute' => 0, 'is_aktief' => true, 'is_gepubliseer' => true
    ]);

    if (!$courseId) return ['success' => false, 'message' => "Database Insert Failed (Course)."];

    // Map Resources
    $resources = [];
    $resNodes = $xml->xpath('//ims:resources/ims:resource');
    if (empty($resNodes)) {
         $resNodes = $xml->xpath('//resources/resource');
         if (empty($resNodes)) $resNodes = $xml->resources->resource;
    }

    foreach ($resNodes as $res) {
        $id = (string)$res['identifier'];
        $href = (string)$res['href'];
        $type = (string)$res['type'];
        
        if (!$href && isset($res->file)) {
            $href = (string)$res->file['href'];
        }

        $resources[$id] = ['href' => $href, 'type' => $type];
        
        // Also map potential dependency sub-files
        if (isset($res->dependency)) {
             $depId = (string)$res->dependency['identifierref'];
             // Store backward ref? Or just rely on flat map
        }
    }

    // Structure
    $orgNodes = $xml->xpath('//ims:organizations/ims:organization');
    if (empty($orgNodes)) $orgNodes = $xml->organizations->organization; 
    if (empty($orgNodes)) return ['success' => true, 'course_id' => $courseId, 'warning' => 'No structure found.'];

    $modOrder = 0;
    $mainOrg = $orgNodes[0];
    
    foreach ($mainOrg->item as $modItem) {
        $modTitle = (string)$modItem->title;
        $modId = supabaseInsert('lms_modules', [
            'kursus_id' => $courseId, 'titel' => $modTitle, 'volgorde' => ++$modOrder, 'is_aktief' => true
        ]);

        if (!$modId) continue;

        $lesOrder = 0;
        if (isset($modItem->item)) {
            foreach ($modItem->item as $lesItem) {
                $lesTitle = (string)$lesItem->title;
                $ref = (string)$lesItem['identifierref'];
                
                $content = "";
                $type = 'teks';
                
                // Debugging info in case of failure
                // Debugging / Tracing Logic
                $debugLines = [];
                $debugLines[] = "<strong>Diagnostic Report:</strong>";
                $debugLines[] = "Identifier Ref: " . ($ref ?: "<em>None</em>");
                $debugLines[] = "Resource Type: " . (isset($resources[$ref]) ? $resources[$ref]['type'] : "<em>Unknown</em>");
                $debugLines[] = "Expected Href (Raw): " . (isset($resources[$ref]) ? $resources[$ref]['href'] : "<em>N/A</em>");
                
                if (!$ref) {
                     $debugLines[] = "Result: <span style='color:red'>No Resource Reference</span>";
                } elseif (!isset($resources[$ref])) {
                     $debugLines[] = "Result: <span style='color:red'>Resource ID not found in manifest</span>";
                } else {
                     $href = $resources[$ref]['href'];
                     $hrefDecoded = urldecode($href);
                     $resType = $resources[$ref]['type'];
                     
                     // Try multiple path variations
                     $pathsToTry = [
                         "$dir/$hrefDecoded",
                         "$dir/$href",
                         "$dir/" . str_replace('/', '\\', $hrefDecoded), // Windows slash fix try
                     ];
                     
                     $fullPath = findFileCaseInsensitive("$dir/$hrefDecoded");
                     if (!$fullPath) $fullPath = findFileCaseInsensitive("$dir/$href");

                     $debugLines[] = "Decoded Href: $hrefDecoded";
                     $debugLines[] = "Resolved Full Path: " . ($fullPath ? $fullPath : "<span style='color:red'>FILE NOT FOUND</span>");
                     
                     if ($fullPath) {
                         $size = filesize($fullPath);
                         $debugLines[] = "File Size: " . $size . " bytes";
                         
                         // Decision Logic
                         if (strpos($resType, 'imsqti') !== false || strpos($href, '.xml') !== false) {
                             $type = 'toets';
                             $content = "Voltooi die toets hieronder."; 
                             parseQTIQuiz($fullPath, 0); 
                             $debugLines[] = "Action: Parsed as Quiz (QTI/XML)";
                         } elseif (strpos($resType, 'webcontent') !== false) {
                             $ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
                             $debugLines[] = "File Extension: $ext";
                             
                             if (in_array($ext, ['html', 'htm', 'txt', 'xml'])) { // Added xml for safety if needed
                                 $fileContent = file_get_contents($fullPath);
                                 $debugLines[] = "Raw Content Length: " . strlen($fileContent);
                                 
                                 // Basic cleanup
                                 if (preg_match('/<body[^>]*>(.*?)<\/body>/is', $fileContent, $matches)) {
                                     $content = $matches[1];
                                     $debugLines[] = "Action: Extracted body content (" . strlen($content) . " chars)";
                                 } else {
                                     $content = $fileContent;
                                     $debugLines[] = "Action: Used full file content (" . strlen($content) . " chars)";
                                 }
                             } else {
                                 $content = "File Resource: <a href='#' target='_blank'>$href</a>";
                                 $debugLines[] = "Action: Fallback to File Link (non-text extension)";
                             }
                         } else {
                             $debugLines[] = "Action: Unknown Resource Type, default handling";
                         }
                     } else {
                         // File not found debugging
                         $debugLines[] = "Debug: Listing directory content of " . dirname("$dir/$hrefDecoded");
                         $parentDir = dirname("$dir/$hrefDecoded");
                         if (is_dir($parentDir)) {
                             $scanned = scandir($parentDir);
                             $debugLines[] = "Dir Content: " . implode(', ', array_slice($scanned, 0, 10));
                         } else {
                             $debugLines[] = "Dir Check: Parent directory does not exist.";
                         }
                     }
                }

                // Append Debug Info ONLY if we want to trace path issues, 
                // but let's keep it cleaner for now or only if failed.
                
                // $content .= "\n\n<div style='border:1px solid #ccc; background:#f9f9f9; padding:10px; margin-top:20px; font-family:monospace; font-size:12px;'>";
                // $content .= implode("<br/>", $debugLines);
                // $content .= "</div>";

                // Check for Quiz keywords
                if (stripos($lesTitle, 'Quiz') !== false || stripos($lesTitle, 'Toets') !== false) {
                     // Optionally force type if detection failed but title says Quiz
                     if ($type !== 'toets') {
                         $type = 'toets';
                         if (empty($content)) $content = "Voltooi die toets hieronder.";
                     }
                }

                $lid = supabaseInsert('lms_lesse', [
                    'kursus_id' => $courseId, 'module_id' => $modId, 'titel' => $lesTitle, 'tipe' => $type,
                    'inhoud' => $content, 'volgorde' => ++$lesOrder, 'duur_minute' => 10, 'is_aktief' => true,
                    'slaag_persentasie' => 50
                ]);

                // Create questions if needed
                if ($type === 'toets' && isset($fullPath) && $lid) {
                     // Re-run QTI parser with correct lesson ID
                     parseQTIQuiz($fullPath, $lid);
                } else if ($type === 'toets' && $lid) {
                     // Create a default question if none exists so it's not empty
                     supabaseInsert('lms_questions', [
                        'les_id' => $lid, 'vraag_teks' => 'Beantwoord die volgende vrae:', 'vraag_tipe' => 'text', 'punte' => 1, 'volgorde' => 0
                    ]);
                }
            }
        }
    }
    
    return ['success' => true, 'course_id' => $courseId];
}

// 6. Main Execution
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// 6. Main Execution
// -----------------------------------------------------------------------------

ini_set('display_errors', 0); // Ensure errors don't leak into JSON
ini_set('log_errors', 1);

// Debug Log Helper
function debug_log($msg) {
    global $TEMP_DIR;
    $logFile = $TEMP_DIR . '/import_debug.log';
    $time = date('[Y-m-d H:i:s]');
    error_log("$time $msg\n", 3, $logFile);
}

// Shutdown Function to catch Fatal Errors/Timeouts - always return JSON so frontend can show message
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR], true)) {
        if (function_exists('ob_get_length') && ob_get_length()) @ob_end_clean();
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
        }
        echo json_encode([
            'success' => false,
            'message' => 'Bedienerfout: ' . (isset($error['message']) ? $error['message'] : 'Onbekend') . '. Probeer die .mbz lêer direk op te laai in plaas van Google Drive.',
            'fatal' => true
        ]);
    }
});

try {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { header('HTTP/1.1 200 OK'); exit(); }
    
    // Buffer output to catch any stray warnings/HTML
    ob_start();

    if (!$AUTH_TOKEN) sendResponse(false, 'Unauthorized', [], 401);

    // Create temp dir first for logging
    if (!file_exists($TEMP_DIR)) {
        if (!mkdir($TEMP_DIR, 0777, true)) {
            // Cannot log if no dir, but try send response
             sendResponse(false, 'Server Error: Cannot create temp dir', [], 500);
        }
    }
    
    debug_log("Starting import process...");

    $zipPath = $TEMP_DIR . '/backup.file';
    $useUploadedFile = false;

    // Option 1: File upload (multipart/form-data)
    if (!empty($_FILES['file']['tmp_name']) && is_uploaded_file($_FILES['file']['tmp_name'])) {
        $uploadedPath = $_FILES['file']['tmp_name'];
        if (move_uploaded_file($uploadedPath, $zipPath)) {
            $useUploadedFile = true;
            debug_log("Using uploaded file. Size: " . filesize($zipPath));
        }
    }

    // Option 2: Google Drive URL
    $input = [];
    if (!$useUploadedFile) {
        $rawInput = file_get_contents('php://input');
        $input = is_string($rawInput) ? json_decode($rawInput, true) : null;
        if (!is_array($input)) $input = isset($_POST) && is_array($_POST) ? $_POST : [];
        if (empty($input['drive_url']) || !is_string($input['drive_url'])) sendResponse(false, 'Voeg asseblief \'n Google Drive skakel in OF laai die .mbz lêer direk op.', [], 400);

        $fileId = getDriveFileId(trim($input['drive_url']));
        if (!$fileId) sendResponse(false, 'Ongeldige Google Drive skakel. Plak die volledige skakel (bv. drive.google.com/file/d/...)', [], 400);

        debug_log("File ID Found: $fileId. Starting download...");
        $downloadSuccess = downloadDriveFile($fileId, $zipPath);
    } else {
        $downloadSuccess = file_exists($zipPath) && filesize($zipPath) > 10000;
    }

    if (!$downloadSuccess) {
        debug_log("Download failed.");
        $httpCode = isset($authDebug['first_http_code']) ? $authDebug['first_http_code'] : 0;
        if ($httpCode == 404) {
            sendResponse(false, "Lêer nie gevind (404). Kontroleer dat die lêer bestaan en dat deelinstellings 'Anyone with the link' is. Probeer alternatief: laai die .mbz lêer direk op.", [], 400);
        }
        // Collect debug info for other errors
        $hexHeader = "N/A"; $fSize = 0; $contentSnippet = "File not created";
        if (file_exists($zipPath)) {
            $fSize = filesize($zipPath);
            if ($fSize > 0) {
                $handle = fopen($zipPath, 'rb');
                $binHeader = fread($handle, 4);
                fclose($handle);
                $hexHeader = bin2hex($binHeader);
                $contentSnippet = file_get_contents($zipPath, false, null, 0, 300);
                $contentSnippet = str_replace(["\r", "\n"], " ", $contentSnippet);
            }
        }
        $debugStr = "";
        if (!empty($authDebug)) {
            foreach ($authDebug as $k => $v) $debugStr .= " [$k: $v] ";
        }
        debug_log("Download Error Details: $debugStr | Size: $fSize");
        sendResponse(false, "Download misluk. Lêer nie gevind of geen toegang nie. Probeer: laai die .mbz lêer direk op.", [], 400);
    }

    debug_log("Download successful. Size: " . filesize($zipPath));

    // Detect Format
    $header = file_get_contents($zipPath, false, null, 0, 4);
    $isZip = (strpos($header, "PK") === 0);
    $isGzip = (strpos($header, "\x1f\x8b") === 0);

    $extractSuccess = false;

    if ($isZip) {
        debug_log("Detected ZIP format.");
        $zip = new ZipArchive;
        if ($zip->open($zipPath) === TRUE) {
            $zip->extractTo($TEMP_DIR);
            $zip->close();
            unset($zip);
            $extractSuccess = true;
            debug_log("ZIP extracted.");
        } else {
            debug_log("Failed to open ZIP.");
        }
        if (function_exists('gc_collect_cycles')) gc_collect_cycles();
    } elseif ($isGzip) {
        debug_log("Detected GZIP format.");
        // GZIP (MBZ)
        $fSizeBefore = filesize($zipPath);
        $tarPath = $TEMP_DIR . '/backup.tar.gz';
        rename($zipPath, $tarPath);
        try {
            $phar = new PharData($tarPath);
            $phar->extractTo($TEMP_DIR);
            unset($phar);
            if (file_exists($tarPath)) unlink($tarPath);
            $extractSuccess = true;
            debug_log("GZIP/TAR extracted. Size: $fSizeBefore");
        } catch (Exception $e) {
            if (isset($phar)) unset($phar);
            if (file_exists($tarPath)) @unlink($tarPath);
            debug_log("PharData Extraction Error: " . $e->getMessage() . " Size: $fSizeBefore");
        }
        if (function_exists('gc_collect_cycles')) gc_collect_cycles();
    } else {
        debug_log("Unknown header: " . bin2hex($header));
    }

    if (!$extractSuccess) {
        $hexHeader = bin2hex($header);
        $fSize = filesize($zipPath);
        sendResponse(false, "Extraction failed. Unknown format. Header: $hexHeader, Size: $fSize bytes.", [], 400);
    }

    // Import target (optional: existing course + module; IDs are UUIDs)
    $importOpts = [];
    if ($useUploadedFile) {
        if (isset($_POST['import_kursus_id']) && $_POST['import_kursus_id'] !== '') $importOpts['course_id'] = trim((string)$_POST['import_kursus_id']);
        if (isset($_POST['import_module_id']) && $_POST['import_module_id'] !== '') $importOpts['module_id'] = trim((string)$_POST['import_module_id']);
    } else {
        if (!empty($input['import_kursus_id'])) $importOpts['course_id'] = trim((string)$input['import_kursus_id']);
        if (!empty($input['import_module_id'])) $importOpts['module_id'] = trim((string)$input['import_module_id']);
    }

    // Parse
    debug_log("Parsing extracted contents...");
    $result = [];
    if (file_exists("$TEMP_DIR/moodle_backup.xml") || file_exists("$TEMP_DIR/groups.xml") && file_exists("$TEMP_DIR/files.xml")) {
        debug_log("Identified Moodle Backup.");
        $result = parseMoodleMBZ($TEMP_DIR, $importOpts);
    } elseif (file_exists("$TEMP_DIR/imsmanifest.xml")) {
        debug_log("Identified IMSCC.");
        $result = parseIMSCC($TEMP_DIR);
    } else {
        $subdirs = glob("$TEMP_DIR/*", GLOB_ONLYDIR);
        if (count($subdirs) === 1 && file_exists($subdirs[0] . "/imsmanifest.xml")) {
             debug_log("Identified Nested IMSCC.");
             $result = parseIMSCC($subdirs[0]);
        } else {
             $files = implode(', ', array_diff(scandir($TEMP_DIR), ['.', '..']));
             debug_log("Unknown structure. Files: $files");
             $result = ['success' => false, 'message' => "Unknown Backup Format. No moodle_backup.xml or imsmanifest.xml found. Files: $files"];
        }
    }
    
    // Clear buffer and send JSON
    ob_end_clean(); 
    
    debug_log("Sending Response: " . ($result['success'] ? 'Success' : 'Failure'));
    
    if ($result['success']) {
        sendResponse(true, 'Import complete', ['course_id' => $result['course_id']]);
    } else {
        sendResponse(false, $result['message'], [], 400);
    }

} catch (Throwable $e) {
    if (isset($TEMP_DIR)) @debug_log("Exception: " . $e->getMessage());
    if (function_exists('ob_get_length') && ob_get_length()) @ob_end_clean();
    sendResponse(false, "Invoerfout: " . $e->getMessage() . ". Probeer die .mbz lêer direk op te laai.", [], 500);
}
?>
