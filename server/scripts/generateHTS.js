import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sanitizeHTS, buildChapter99Map } from '../src/services/htsProcessor.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(__dirname, '../data/raw');
const CLEAN_DATA_PATH = path.join(__dirname, '../data/clean_hts.json');

const generateData = () => {
  try {
    console.log('Generating clean HTS data from all raw files...');

    // 1. Build Chapter 99 Map
    const CH99_DIR = path.join(RAW_DIR, 'schedule99');
    let ch99Map = {};
    if (fs.existsSync(CH99_DIR)) {
      const ch99Files = fs.readdirSync(CH99_DIR).filter(f => f.endsWith('.json'));
      if (ch99Files.length > 0) {
        const latestFile = ch99Files.sort((a, b) => b.localeCompare(a))[0];
        console.log(`Loading Chapter 99 from ${latestFile}`);
        const ch99Raw = JSON.parse(fs.readFileSync(path.join(CH99_DIR, latestFile), 'utf8'));
        ch99Map = buildChapter99Map(ch99Raw);
      }
    }

    // 2. Load HTS Chapters
    const HTS_DIR = path.join(RAW_DIR, 'schedule6162');
    let allRawData = [];
    if (fs.existsSync(HTS_DIR)) {
      const htsFiles = fs.readdirSync(HTS_DIR).filter(f => f.endsWith('.json'));
      htsFiles.forEach(file => {
        const filePath = path.join(HTS_DIR, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (Array.isArray(data)) {
          allRawData = allRawData.concat(data);
        }
      });
    }

    console.log(`Loaded ${allRawData.length} HTS records total.`);

    const cleanData = sanitizeHTS(allRawData, ch99Map);
    console.log(`Processed into ${cleanData.length} clean records.`);

    // --- ENFORCED VALIDATION ---
    console.log('Validating dataset...');
    const hasOrphans = cleanData.some(r => r.parent && !cleanData.find(p => p.code === r.parent));
    const hasHtml = cleanData.some(r => /<[^>]*>?/gm.test(r.description) || r.unit.some(u => /<[^>]*>?/gm.test(u)));
    const hasEmptyCode = cleanData.some(r => !r.code);

    if (hasOrphans) console.error('❌ VALIDATION FAILED: Orphans detected!');
    else console.log('✅ PASS: No orphans detected.');

    if (hasHtml) console.error('❌ VALIDATION FAILED: HTML tags detected!');
    else console.log('✅ PASS: No HTML tags detected.');

    if (hasEmptyCode) console.error('❌ VALIDATION FAILED: Empty codes detected!');
    else console.log('✅ PASS: No empty codes detected.');

    fs.writeFileSync(CLEAN_DATA_PATH, JSON.stringify(cleanData, null, 2));
    console.log(`Clean data saved to ${CLEAN_DATA_PATH}`);

  } catch (error) {
    console.error('Error generating HTS data:', error);
    process.exit(1);
  }
};

generateData();
