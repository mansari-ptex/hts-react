import fs from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');

export const fileService = {
  readJsonFile: async (filename) => {
    try {
      const filePath = join(DATA_DIR, filename);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`FileService Error reading ${filename}:`, error);
      throw error;
    }
  },

  isValidFilename: (filename) => {
    return filename.endsWith('.json') && !filename.includes('..');
  }
};
