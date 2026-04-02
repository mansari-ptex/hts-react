import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sanitizeHTS, buildChapter99Map } from './htsProcessor.js';
import { syncAll } from './htsDownloader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(__dirname, '../../data/raw');
const CH99_DIR = path.join(RAW_DIR, 'schedule99');
const HTS_DIR = path.join(RAW_DIR, 'schedule6162');
const CLEAN_DATA_PATH = path.join(__dirname, '../../data/clean_hts.json');

// This holds the actual in-memory data that the controller will read
let cachedHTSRecords = [];
let lastSyncTimestamp = null;

// Helper to initialize timestamp from the existing snapshot if available
try {
  if (fs.existsSync(CLEAN_DATA_PATH)) {
    const stats = fs.statSync(CLEAN_DATA_PATH);
    lastSyncTimestamp = stats.mtime;
  }
} catch (e) {
  console.error("Failed to read last update timestamp:", e);
}

/**
 * CORE DATA SYNCHRONIZATION
 */
export const loadAndSyncData = async () => {
    try {
        console.log('[SyncService] Starting data synchronization...');

        // 1. Gather main HTS data (Chapters 61 & 62)
        // Check if raw data exists
        if (!fs.existsSync(HTS_DIR)) fs.mkdirSync(HTS_DIR, { recursive: true });
        if (!fs.existsSync(CH99_DIR)) fs.mkdirSync(CH99_DIR, { recursive: true });

        let htsFiles = fs.readdirSync(HTS_DIR).filter(f => f.endsWith('.json'));

        // AUTOMATED INITIAL DOWNLOAD:
        // If no HTS files AND no clean cache exist, trigger full download
        if (htsFiles.length === 0 && !fs.existsSync(CLEAN_DATA_PATH)) {
            console.log('[SyncService] 🛑 No data found. Triggering automated initial download from USITC...');
            const syncResult = await syncAll();
            if (!syncResult.success) {
                throw new Error('[SyncService] Initial download failed: ' + syncResult.error);
            }
            // Refresh file list after download
            htsFiles = fs.readdirSync(HTS_DIR).filter(f => f.endsWith('.json'));
        }

        lastSyncTimestamp = new Date(); // Update on every successful run

        // Now proceed with normal gathering and mapping
        const ch99Files = fs.readdirSync(CH99_DIR)
          .filter(f => f.endsWith('.json'))
          .sort((a, b) => b.localeCompare(a));

        let ch99Map = {};
        if (ch99Files.length > 0) {
          const latestFile = ch99Files[0];
          console.log(`[SyncService] Using latest Schedule 99 update: ${latestFile}`);
          const ch99Raw = JSON.parse(fs.readFileSync(path.join(CH99_DIR, latestFile), 'utf8'));
          ch99Map = buildChapter99Map(ch99Raw);
        } else {
          console.warn('[SyncService] No Schedule 99 files found.');
        }

        // 2. Gather main HTS data (Chapters 61 & 62)
        htsFiles = fs.readdirSync(HTS_DIR).filter(f => f.endsWith('.json'));
        let htsRaw = [];
        htsFiles.forEach(file => {
          const data = JSON.parse(fs.readFileSync(path.join(HTS_DIR, file), 'utf8'));
          if (Array.isArray(data)) htsRaw = htsRaw.concat(data);
        });

        if (htsRaw.length > 0) {
            // 3. Process through engine
            console.log(`[SyncService] Processing ${htsRaw.length} total HTS records...`);
            cachedHTSRecords = sanitizeHTS(htsRaw, ch99Map);
            
            // 4. Save clean snapshot
            fs.writeFileSync(CLEAN_DATA_PATH, JSON.stringify(cachedHTSRecords, null, 2));
            console.log(`[SyncService] Sync Complete: ${cachedHTSRecords.length} records ready.`);
        } else if (fs.existsSync(CLEAN_DATA_PATH)) {
            // Fallback to existing clean data
            const data = fs.readFileSync(CLEAN_DATA_PATH, 'utf8');
            cachedHTSRecords = JSON.parse(data);
            console.log(`[SyncService] No raw data found. Loaded existing cache: ${cachedHTSRecords.length} records.`);
        } else {
            console.warn('[SyncService] No data found (Raw or Clean).');
        }
        
        return cachedHTSRecords;
    } catch (error) {
        console.error('[SyncService] CRITICAL: Synchronization failed:', error);
        throw error;
    }
};

export const getHTSRecords = () => cachedHTSRecords;
export const getLastSyncTimestamp = () => lastSyncTimestamp;
