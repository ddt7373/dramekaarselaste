/**
 * Client-side Moodle MBZ import: read .mbz in browser, parse, insert into Supabase.
 * No PHP/server upload – alles loop in die leser en skryf direk na die databasis.
 */

import { supabase } from '@/lib/supabase';

const decoder = new TextDecoder('utf-8');

/** Read file as ArrayBuffer */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as ArrayBuffer);
    r.onerror = () => reject(new Error('Kon lêer nie lees nie'));
    r.readAsArrayBuffer(file);
  });
}

/** Decompress gzip (MBZ is gzipped tar) using browser API */
async function gunzip(ab: ArrayBuffer): Promise<Uint8Array> {
  const ds = new DecompressionStream('gzip');
  const out: Uint8Array[] = [];
  const reader = new Response(ab).body!.pipeThrough(ds).getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    out.push(value);
  }
  const len = out.reduce((a, b) => a + b.length, 0);
  const result = new Uint8Array(len);
  let off = 0;
  for (const chunk of out) {
    result.set(chunk, off);
    off += chunk.length;
  }
  return result;
}

/** Parse tar (simplified: normal files only) -> map path -> text content for .xml */
function parseTarToMap(data: Uint8Array): Map<string, string> {
  const map = new Map<string, string>();
  let pos = 0;
  const readStr = (start: number, len: number) =>
    decoder.decode(data.subarray(start, start + len)).replace(/\0+$/, '').trim();
  const readOctal = (start: number, len: number) => {
    const s = readStr(start, len);
    return parseInt(s || '0', 8) || 0;
  };

  while (pos + 512 <= data.length) {
    const name = readStr(pos, 100);
    if (!name) break;
    const size = readOctal(pos + 124, 12);
    const typeflag = data[pos + 156];
    pos += 512;
    if (typeflag === 0 || typeflag === 0x30) {
      const content = data.subarray(pos, pos + size);
      const path = name.replace(/^\.\//, '');
      if (path.endsWith('.xml') || path.endsWith('.XML')) {
        try {
          map.set(path, decoder.decode(content));
        } catch {
          // skip binary or bad encoding
        }
      }
      pos += Math.ceil(size / 512) * 512;
    } else {
      pos += Math.ceil(size / 512) * 512;
    }
  }
  return map;
}

/** Parse moodle_backup.xml and insert into Supabase */
async function parseAndInsert(
  files: Map<string, string>,
  opts: { courseId?: string; moduleId?: string }
): Promise<{ success: boolean; courseId?: string; message?: string }> {
  const mainXml = files.get('moodle_backup.xml');
  if (!mainXml) return { success: false, message: "Ongeldige MBZ: moodle_backup.xml ontbreek." };

  const parser = new DOMParser();
  const doc = parser.parseFromString(mainXml, 'text/xml');
  const info = doc.querySelector('information');
  if (!info) return { success: false, message: "Ongeldige moodle_backup.xml." };

  const courseName = (info.querySelector('original_course_fullname')?.textContent || '').trim() || 'Ingevoerde kursus';
  const courseShort = (info.querySelector('original_course_shortname')?.textContent || '').trim() || courseName;

  let courseId: string;
  const sectionMap = new Map<string, string>();
  const contents = info.querySelector('contents');
  const sections = contents?.querySelectorAll('sections section') || [];
  const activitiesList = contents?.querySelectorAll('activities activity') || [];

  const getSectionId = (el: Element) => el.getAttribute('sectionid') || el.querySelector('sectionid')?.textContent?.trim() || '';

  if (opts.courseId && opts.courseId !== '') {
    courseId = opts.courseId;
    let targetModuleId = opts.moduleId && opts.moduleId !== '' ? opts.moduleId : null;
    if (!targetModuleId) {
      const { data: mod, error: modErr } = await supabase
        .from('lms_modules')
        .insert({
          kursus_id: courseId,
          titel: `Ingevoer vanaf MBZ - ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
          volgorde: 999,
          is_aktief: true,
        })
        .select('id')
        .single();
      if (modErr || !mod) return { success: false, message: 'Kon nie nuwe module skep nie.' };
      targetModuleId = mod.id;
    }
    sections.forEach(sec => sectionMap.set(getSectionId(sec as Element), targetModuleId!));
    activitiesList.forEach(act => sectionMap.set(getSectionId(act as Element), targetModuleId!));
  } else {
    const { data: course, error: courseErr } = await supabase
      .from('lms_kursusse')
      .insert({
        titel: courseName,
        beskrywing: `Ingevoer vanaf Moodle (.mbz) - ${courseShort}`,
        kategorie: 'Ander',
        vlak: 'beginner',
        prys: 0,
        is_gratis: true,
        duur_minute: 0,
        is_aktief: true,
        is_gepubliseer: true,
      })
      .select('id')
      .single();
    if (courseErr || !course) return { success: false, message: 'Kon nie kursus skep nie.' };
    courseId = course.id;

    for (const sec of sections) {
      const el = sec as Element;
      const sid = getSectionId(el);
      let title = el.querySelector('title')?.textContent?.trim() || `Afdeling ${sid}`;
      const sectionPath = `sections/section_${sid}/section.xml`;
      const sectionXml = files.get(sectionPath);
      if (sectionXml) {
        const sDoc = parser.parseFromString(sectionXml, 'text/xml');
        const n = sDoc.querySelector('name')?.textContent?.trim();
        if (n) title = n;
      }
      const { data: mod, error: modErr } = await supabase
        .from('lms_modules')
        .insert({ kursus_id: courseId, titel: title, volgorde: parseInt(sid, 10) || 0, is_aktief: true })
        .select('id')
        .single();
      if (!modErr && mod) sectionMap.set(sid, mod.id);
    }
  }

  const questionBank = parseQuestionBank(files);
  let order = 0;

  for (const act of activitiesList) {
    const a = act as Element;
    const mod = (a.querySelector('modulename')?.textContent || '').trim();
    const sid = getSectionId(a);
    const title = (a.querySelector('title')?.textContent || '').trim();
    const dirPath = (a.querySelector('directory')?.textContent || '').trim();
    const mid = sectionMap.get(sid);
    if (!mid) continue;

    const getActPath = (file: string) => (dirPath ? `${dirPath}/${file}` : file);
    let content = '';
    let type: string = 'teks';

    if (mod === 'page' || mod === 'resource') {
      const xml = files.get(getActPath(`${mod}.xml`));
      if (xml) {
        const aDoc = parser.parseFromString(xml, 'text/xml');
        const page = aDoc.querySelector('page content');
        const cont = aDoc.querySelector('content');
        const intro = aDoc.querySelector('intro');
        content = (page?.textContent || cont?.textContent || intro?.textContent || '').trim();
        content = decodeHtml(content);
      }
    } else if (mod === 'url') {
      const xml = files.get(getActPath('url.xml'));
      if (xml) {
        const aDoc = parser.parseFromString(xml, 'text/xml');
        const u = aDoc.querySelector('externalurl')?.textContent?.trim() || aDoc.querySelector('url externalurl')?.textContent?.trim() || '';
        const intro = aDoc.querySelector('intro')?.textContent?.trim() || '';
        content = u ? `Link: <a href='${u}' target='_blank'>${u}</a><br/>${intro}` : intro;
      }
    } else if (mod === 'lesson') {
      const lessonXml = files.get(getActPath('lesson.xml'));
      if (lessonXml) {
        const lDoc = parser.parseFromString(lessonXml, 'text/xml');
        const pages = lDoc.querySelector('pages')?.querySelectorAll('page') || lDoc.querySelector('lesson pages')?.querySelectorAll('page') || [];
        for (const page of pages) {
          const p = page as Element;
          const pageTitle = p.querySelector('title')?.textContent?.trim() || 'Bladsy';
          let pageContent = (p.querySelector('contents content')?.textContent || p.querySelector('contents')?.textContent || '').trim();
          pageContent = decodeHtml(decodeHtml(pageContent));
          pageContent = pageContent.replace(/class="Mso[^"]*"/g, '').replace(/style="[^"]*"/g, '').trim();
          const { error: lesErr } = await supabase.from('lms_lesse').insert({
            kursus_id: courseId,
            module_id: mid,
            titel: pageTitle,
            tipe: 'teks',
            inhoud: pageContent,
            volgorde: ++order,
            duur_minute: 10,
            is_aktief: true,
            slaag_persentasie: 50,
          });
          if (lesErr) console.warn('Lesson insert error', lesErr);
        }
      } else {
        await supabase.from('lms_lesse').insert({
          kursus_id: courseId,
          module_id: mid,
          titel: title + ' (Inhoud)',
          tipe: 'teks',
          inhoud: 'Inhoud kon nie gelaai word nie.',
          volgorde: ++order,
          duur_minute: 10,
          is_aktief: true,
          slaag_persentasie: 50,
        });
      }
      continue;
    } else if (mod === 'quiz') {
      type = 'toets';
      const xml = files.get(getActPath('quiz.xml'));
      if (xml) {
        const aDoc = parser.parseFromString(xml, 'text/xml');
        content = (aDoc.querySelector('intro')?.textContent || '').trim() || 'Voltooi die toets.';
      }
    } else {
      continue;
    }

    const { data: les, error: lesErr } = await supabase
      .from('lms_lesse')
      .insert({
        kursus_id: courseId,
        module_id: mid,
        titel: title,
        tipe: type,
        inhoud: content,
        volgorde: ++order,
        duur_minute: 10,
        is_aktief: true,
        slaag_persentasie: 50,
      })
      .select('id')
      .single();

    if (type === 'toets' && les?.id) {
      const quizXml = files.get(getActPath('quiz.xml'));
      if (quizXml) {
        const qDoc = parser.parseFromString(quizXml, 'text/xml');
        const instances = qDoc.querySelectorAll('question_instance');
        let qOrder = 0;
        for (const inst of instances) {
          const qid = (inst as Element).querySelector('question')?.textContent?.trim() || '';
          const qData = questionBank[qid];
          if (qData) {
            await supabase.from('lms_questions').insert({
              les_id: les.id,
              vraag_teks: qData.text,
              vraag_tipe: qData.type,
              opsies: qData.options ? JSON.stringify(qData.options) : null,
              korrekte_antwoord: qData.answer,
              punte: qData.points || 1,
              volgorde: qOrder++,
            });
          }
        }
        if (qOrder === 0) {
          await supabase.from('lms_questions').insert({
            les_id: les.id,
            vraag_teks: 'Geen vrae gevind in invoer',
            vraag_tipe: 'text',
            punte: 0,
            volgorde: 0,
          });
        }
      }
    }
    if (lesErr) console.warn('Les insert error', lesErr);
  }

  return { success: true, courseId };
}

function decodeHtml(s: string): string {
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (div) {
    div.innerHTML = s;
    return div.textContent || div.innerText || s;
  }
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
}

type QData = { text: string; type: string; options: unknown; answer: string; points: number };

function parseQuestionBank(files: Map<string, string>): Record<string, QData> {
  const bank: Record<string, QData> = {};
  const qPath = files.has('questions.xml') ? 'questions.xml' : 'course/questions.xml';
  const xml = files.get(qPath);
  if (!xml) return bank;
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const questions = doc.querySelectorAll('question');
  questions.forEach(q => {
    const el = q as Element;
    const id = el.getAttribute('id') || el.querySelector('id')?.textContent?.trim() || '';
    const qtype = (el.querySelector('qtype')?.textContent || '').trim();
    if (qtype === 'category') return;
    const textEl = el.querySelector('questiontext text') || el.querySelector('questiontext');
    const text = (textEl?.textContent || '').trim() || `Vraag ${id}`;
    const points = parseInt((el.querySelector('defaultmark')?.textContent || '1').trim(), 10) || 1;
    const data: QData = { text, type: 'text', options: null, answer: '', points };

    if (qtype === 'multichoice') {
      const answers = el.querySelectorAll('answers answer');
      const choices: string[] = [];
      let correctIndex = 0;
      answers.forEach((ans, idx) => {
        const t = (ans as Element).querySelector('answertext text')?.textContent || (ans as Element).querySelector('answertext')?.textContent || '';
        choices.push(t.trim());
        const frac = parseFloat((ans as Element).querySelector('fraction')?.textContent || '0');
        if (frac > 0.9) correctIndex = idx;
      });
      data.type = 'mcq';
      data.options = { choices };
      data.answer = String(correctIndex);
    } else if (qtype === 'truefalse') {
      const answers = el.querySelectorAll('answers answer');
      answers.forEach(ans => {
        const frac = parseFloat((ans as Element).querySelector('fraction')?.textContent || '0');
        if (frac > 0.9) {
          const t = ((ans as Element).querySelector('answertext text')?.textContent || (ans as Element).querySelector('answertext')?.textContent || '').toLowerCase();
          data.answer = t.includes('true') || t.includes('waar') ? 'true' : 'false';
        }
      });
      data.type = 'true_false';
    }
    bank[id] = data;
  });
  return bank;
}

/** Check if file looks like MBZ (gzip magic) */
function isGzip(ab: ArrayBuffer): boolean {
  const v = new Uint8Array(ab, 0, 2);
  return v[0] === 0x1f && v[1] === 0x8b;
}

/**
 * Import MBZ from a File (client-side). Writes directly to Supabase.
 * Use this when user selects a file – no server upload.
 */
export async function importMoodleFromFile(
  file: File,
  opts: { courseId?: string; moduleId?: string } = {}
): Promise<{ success: boolean; courseId?: string; message?: string }> {
  if (!file.name.toLowerCase().endsWith('.mbz') && !file.name.toLowerCase().endsWith('.mbz.gz')) {
    return { success: false, message: 'Lêer moet .mbz wees.' };
  }

  const ab = await readFileAsArrayBuffer(file);
  if (!isGzip(ab)) return { success: false, message: 'Ongeldige MBZ (verwag gzip).' };

  const tarBytes = await gunzip(ab);
  const files = parseTarToMap(tarBytes);
  return parseAndInsert(files, opts);
}
