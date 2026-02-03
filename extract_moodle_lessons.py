import sys
import os
import tarfile
import zipfile
import shutil
import json
import uuid
from typing import List, Dict, Any
from xml.etree import ElementTree as ET
import html

def extract_mbz(file_path: str, extract_path: str) -> bool:
    """
    Extracts a .mbz file (which can be tar.gz or zip) to the specified path.
    """
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        return False

    try:
        # Try opening as tar (gzip) first
        if tarfile.is_tarfile(file_path):
            with tarfile.open(file_path, "r:gz") as tar:
                tar.extractall(path=extract_path)
            return True
    except tarfile.ReadError:
        pass # Not a tar file

    try:
        # Try opening as zip
        if zipfile.is_zipfile(file_path):
            with zipfile.ZipFile(file_path, 'r') as zip_ref:
                zip_ref.extractall(extract_path)
            return True
    except zipfile.BadZipFile:
        pass

    print(f"Error: Could not determine archive format for {file_path}")
    return False

def parse_lesson_xml(xml_path: str) -> Dict[str, Any]:
    """
    Parses a single lesson.xml file.
    Returns a dictionary structure of the module and its units.
    """
    try:
        tree = ET.parse(xml_path)
        root = tree.getroot()

        # Activity/Module Name
        module_name = root.get('name') or root.findtext('name') or "Untitled Lesson"

        units = []
        
        # Iterate through pages
        # Structure is usually: <pages> <page> ... </page> </pages>
        pages = root.find('pages')
        if pages is not None:
            for page in pages.findall('page'):
                title = page.findtext('title') or "Untitled Unit"
                contents_raw = page.findtext('contents') or ""
                
                # HTML Entity Decoding
                contents_decoded = html.unescape(contents_raw)

                units.append({
                    "title": title,
                    "html_content": contents_decoded
                })

        return {
            "module_name": module_name,
            "units": units
        }

    except ET.ParseError as e:
        print(f"Warning: Failed to parse XML at {xml_path}: {e}")
        return None
    except Exception as e:
        print(f"Warning: Unexpected error parsing {xml_path}: {e}")
        return None

def main():
    if len(sys.argv) < 2:
        print("Usage: python extract_moodle_lessons.py <path_to_mbz_file>")
        return

    mbz_path = sys.argv[1]
    
    # Create a unique temp folder
    temp_dir = os.path.join(os.getcwd(), f"temp_extract_{uuid.uuid4().hex[:8]}")
    os.makedirs(temp_dir, exist_ok=True)

    print(f"Extracting {mbz_path} to temporary directory...")
    
    if extract_mbz(mbz_path, temp_dir):
        print("Extraction complete. Scanning for lessons...")
        
        extracted_modules = []
        activities_dir = os.path.join(temp_dir, 'activities')

        if os.path.exists(activities_dir):
            # Walk through activities directory
            for root, dirs, files in os.walk(activities_dir):
                if 'lesson.xml' in files:
                    full_path = os.path.join(root, 'lesson.xml')
                    print(f"Found lesson: {full_path}")
                    
                    lesson_data = parse_lesson_xml(full_path)
                    if lesson_data and lesson_data['units']:
                        extracted_modules.append(lesson_data)
        else:
            print("Warning: 'activities' directory not found in backup. Structure might be different.")

        # Output Results
        output_file = 'extracted_content.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(extracted_modules, f, indent=4, ensure_ascii=False)
        
        print(f"\nSuccess! Extracted {len(extracted_modules)} modules.")
        print(f"Content saved to: {os.path.abspath(output_file)}")

    else:
        print("Extraction failed.")

    # Cleanup
    try:
        shutil.rmtree(temp_dir)
        print("Temporary files cleaned up.")
    except Exception as e:
        print(f"Warning: Could not remove temp dir {temp_dir}: {e}")

if __name__ == "__main__":
    main()
