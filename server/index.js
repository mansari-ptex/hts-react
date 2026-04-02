import app from './src/app.js';
import cron from 'node-cron';
import { syncAll } from './src/services/htsDownloader.js';

const PORT = process.env.PORT || 5000;

// Schedule HTS Sync: Every Monday at 3:00 AM
cron.schedule('0 3 * * 1', () => {
  console.log('[Cron] Weekly HTS sync started...');
  syncAll().catch(err => console.error('[Cron] Weekly sync failed:', err));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
