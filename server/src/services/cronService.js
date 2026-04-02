import cron from 'node-cron';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const CH99_URL = "https://hts.usitc.gov/reststop/exportList?from=9901.00.50&to=9922.52.12&format=JSON&styles=false";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CH99_DIR = path.join(__dirname, '../../data/raw/schedule99');

/**
 * Downloads the official Schedule 99 data from the USITC HTS RestStop.
 * File is timestamped so we can keep a history.
 */
export const downloadSchedule99 = async () => {
  try {
    console.log('[Cron Service] Fetching latest Schedule 99 data from USITC...');
    
    // Ensure directory exists
    if (!fs.existsSync(CH99_DIR)) {
      fs.mkdirSync(CH99_DIR, { recursive: true });
    }

    const response = await axios.get(CH99_URL);
    if (!response.data) throw new Error('Empty response from USITC');

    // Generate accurate timestamp for filename
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const filename = `schedule99_${timestamp}.json`;
    const filePath = path.join(CH99_DIR, filename);

    // Save JSON data
    fs.writeFileSync(filePath, JSON.stringify(response.data, null, 2));
    console.log(`[Cron Service] Successfully archived new 301 Schedule: ${filename}`);

    return filename;
  } catch (err) {
    console.error('[Cron Service] CRITICAL: USITC Update Failed:', err.message);
    return null;
  }
};

/**
 * Weekly Schedule (Midnight Monday)
 * 0 0 * * 1
 */
export const initCrons = () => {
  console.log('[Cron Service] Initializing weekly tariff update (Mon 00:00)...');
  
  // Weekly Job
  cron.schedule('0 0 * * 1', () => {
    downloadSchedule99();
  });
  
  // Also run once synchronously if the folder is empty (initial setup)
  const files = fs.readdirSync(CH99_DIR).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.log('[Cron Service] No Schedule 99 files found. Performing initial download...');
    downloadSchedule99();
  }
};
