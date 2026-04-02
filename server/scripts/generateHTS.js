import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sanitizeHTS } from '../src/services/htsProcessor.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(__dirname, '../data/raw');
const CLEAN_DATA_PATH = path.join(__dirname, '../data/clean_hts.json');

const generateData = () => {
  try {
    console.log('Generating clean HTS data from all raw files...');

    if (!fs.existsSync(RAW_DIR)) {
      console.error(`Raw directory not found at ${RAW_DIR}`);
      process.exit(1);
    }

    const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.json'));
    console.log(`Found ${files.length} raw files: ${files.join(', ')}`);

    let allRawData = [];

    files.forEach(file => {
      const filePath = path.join(RAW_DIR, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(data)) {
        allRawData = allRawData.concat(data);
      } else {
        console.warn(`File ${file} does not contain an array at root. Skipping.`);
      }
    });

    console.log(`Loaded ${allRawData.length} records total.`);

    const cleanData = sanitizeHTS(allRawData);
    console.log(`Processed into ${cleanData.length} clean records.`);

    // --- ENFORCED VALIDATION ---
    console.log('Validating dataset...');
    const hasOrphans = cleanData.some(r => r.parent && !cleanData.find(p => p.code === r.parent));
    const hasHtml = cleanData.some(r => /<[^>]*>?/gm.test(r.description) || r.unit.some(u => /<[^>]*>?/gm.test(u)));
    const hasEmptyCode = cleanData.some(r => !r.code);
    const hasLevelMismatch = cleanData.some(r => r.level !== (r.code.split('.').length - 1));

    if (hasOrphans) console.error('❌ VALIDATION FAILED: Orphans detected!');
    else console.log('✅ PASS: No orphans detected.');

    if (hasHtml) console.error('❌ VALIDATION FAILED: HTML tags detected!');
    else console.log('✅ PASS: No HTML tags detected.');

    if (hasEmptyCode) console.error('❌ VALIDATION FAILED: Empty codes detected!');
    else console.log('✅ PASS: No empty codes detected.');

    if (hasLevelMismatch) console.error('❌ VALIDATION FAILED: Level mismatch detected!');
    else console.log('✅ PASS: All levels match code depth.');

    fs.writeFileSync(CLEAN_DATA_PATH, JSON.stringify(cleanData, null, 2));
    console.log(`Clean data saved to ${CLEAN_DATA_PATH}`);

  } catch (error) {
    console.error('Error generating HTS data:', error);
    process.exit(1);
  }
};

generateData();
