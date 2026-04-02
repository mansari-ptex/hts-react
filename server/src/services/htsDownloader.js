import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadAndSyncData } from './dataSyncService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(__dirname, '../../data/raw');
const HTS_DIR = path.join(RAW_DIR, 'schedule6162');
const CH99_DIR = path.join(RAW_DIR, 'schedule99');

// --- USITC SOURCE URLS (JSON FORMAT) ---
const SOURCES = [
  {
    name: 'chapter_61.json',
    url: 'https://hts.usitc.gov/reststop/exportList?from=6101&to=6117.90.90.95&format=JSON&styles=false',
    dest: HTS_DIR
  },
  {
    name: 'chapter_62.json',
    url: 'https://hts.usitc.gov/reststop/exportList?from=6201&to=6217.90.90.95&format=JSON&styles=false',
    dest: HTS_DIR
  },
  {
    name: 'schedule99.json',
    url: 'https://hts.usitc.gov/reststop/exportList?from=9901.00.50&to=9922.52.12&format=JSON&styles=false',
    dest: CH99_DIR
  }
];

/**
 * Downloads a single file from USITC
 */
async function downloadFile(source) {
  console.log(`[Downloader] Starting download for ${source.name}...`);
  try {
    const response = await axios({
      method: 'GET',
      url: source.url,
      responseType: 'stream',
      timeout: 60000 // Increased to 60 seconds for large JSON files
    });

    const filePath = path.join(source.dest, source.name);
    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`[Downloader] Successfully saved ${source.name}`);
        resolve();
      });
      writer.on('error', (err) => {
        console.error(`[Downloader] Error writing ${source.name}:`, err);
        reject(err);
      });
    });
  } catch (error) {
    console.error(`[Downloader] Failed to fetch ${source.name}:`, error.message);
    throw error;
  }
}

/**
 * Public method to sync all data from USITC
 */
export async function syncAll() {
  console.log('--- GLOBAL SYNC STARTED ---');
  
  if (!fs.existsSync(HTS_DIR)) fs.mkdirSync(HTS_DIR, { recursive: true });
  if (!fs.existsSync(CH99_DIR)) fs.mkdirSync(CH99_DIR, { recursive: true });

  try {
    for (const source of SOURCES) {
      console.log(`[Sync] ⏳ Next: ${source.name}...`);
      await downloadFile(source);
      console.log(`[Sync] ✅ Finished: ${source.name}`);
    }
    
    console.log('[Sync] 🔄 All downloads successful.');
    console.log('--- GLOBAL SYNC COMPLETE ---');
    
    return { success: true, timestamp: new Date() };
  } catch (error) {
    console.error('[Sync] ❌ CRITICAL FAILURE:', error.message);
    return { success: false, error: error.message };
  }
}
