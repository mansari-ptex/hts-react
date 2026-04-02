import { loadAndSyncData, getHTSRecords, getLastSyncTimestamp } from '../services/dataSyncService.js';
import { syncAll } from '../services/htsDownloader.js';

/**
 * DATA CONTROLLER
 * Exposes API endpoints for searching and managing HTS data.
 */
export const dataController = {
  // Initialize data on server startup
  init: async () => {
    await loadAndSyncData();
  },

  getStatus: (req, res) => {
    const htsRecords = getHTSRecords();
    res.json({ 
        message: 'HTS Backend is healthy', 
        recordsLoaded: htsRecords.length,
        lastUpdated: getLastSyncTimestamp(),
        timestamp: new Date() 
    });
  },

  searchHTS: (req, res) => {
    try {
      const htsRecords = getHTSRecords();
      const { q, gender, material, fabric, feature } = req.query;
      const query = q ? q.toLowerCase().trim() : "";
      
      const activeFilters = [];
      if (gender && gender !== 'All') activeFilters.push({ field: 'gender', value: gender });
      if (material && material !== 'All') activeFilters.push({ field: 'material', value: material });
      if (fabric && fabric !== 'All') activeFilters.push({ field: 'fabric', value: fabric });
      if (feature && feature !== 'All') activeFilters.push({ field: 'feature', value: feature });

      const allTenDigits = htsRecords.filter(item => item.code.replace(/\./g, "").length === 10);

      const primary = [];
      const related = [];

      allTenDigits.forEach(item => {
        let textMatch = true;
        if (query) {
          const codeMatch = item.code.replace(/\./g, "").includes(query.replace(/\./g, ""));
          const descMatch = item.description.toLowerCase().includes(query) || (item.full_description && item.full_description.toLowerCase().includes(query));
          textMatch = codeMatch || descMatch;
        }

        if (!textMatch) return;

        let matchCount = 0;
        activeFilters.forEach(f => {
          if (item[f.field] === f.value) matchCount++;
        });

        if (activeFilters.length > 0) {
          if (matchCount === activeFilters.length) {
            primary.push(item);
          } else if (matchCount > 0) {
            related.push(item);
          }
        } else {
          primary.push(item);
        }
      });

      const sortBySearchRelevance = (a, b) => {
          if (query) {
             const aExact = a.code.replace(/\./g, "") === query.replace(/\./g, "");
             const bExact = b.code.replace(/\./g, "") === query.replace(/\./g, "");
             if (aExact && !bExact) return -1;
             if (!aExact && bExact) return 1;
          }

          const levelDiff = (b.level || 0) - (a.level || 0);
          if (levelDiff !== 0) return levelDiff;
          
          return a.code.localeCompare(b.code);
      };

      res.json({
        primary: primary.sort(sortBySearchRelevance).slice(0, 500),
        related: related.sort(sortBySearchRelevance).slice(0, 100)
      });
    } catch (error) {
      console.error(`Search Error:`, error);
      res.status(500).json({ error: 'Search failed' });
    }
  },

  getMetadata: (req, res) => {
    try {
      const htsRecords = getHTSRecords();
      const getUnique = (field) => {
        const values = htsRecords
          .map(item => item[field])
          .filter(val => val && val !== '');
        return [...new Set(values)].sort();
      };

      res.json({
        genders: getUnique('gender'),
        materials: getUnique('material'),
        fabrics: getUnique('fabric'),
        features: getUnique('feature')
      });
    } catch (error) {
      console.error('Metadata Error:', error);
      res.status(500).json({ error: 'Failed to fetch metadata' });
    }
  },

  getByCode: (req, res) => {
    try {
      const htsRecords = getHTSRecords();
      const { code } = req.params;
      const record = htsRecords.find(r => r.code === code);

      if (!record) {
        return res.status(404).json({ error: 'HTS Code not found' });
      }

      res.json(record);
    } catch (error) {
      console.error(`Lookup Error:`, error);
      res.status(500).json({ error: 'Lookup failed' });
    }
  },

  getHierarchy: (req, res) => {
    try {
      const htsRecords = getHTSRecords();
      const { code } = req.params;
      const target = htsRecords.find(r => r.code === code);
      if (!target) return res.status(404).json({ error: 'Code not found' });

      const hierarchy = [];
      let currentCode = code;
      while (currentCode) {
        const currentRecord = htsRecords.find(r => r.code === currentCode);
        if (!currentRecord) break;

        const siblings = htsRecords.filter(r => r.parent === currentRecord.parent);

        hierarchy.unshift({
          level: currentRecord.level,
          selectedCode: currentRecord.code,
          siblings: siblings.map(s => ({ 
              code: s.code, 
              description: s.description,
              isDirectAncestor: code.startsWith(s.code) || s.code === code
          }))
        });

        currentCode = currentRecord.parent;
      }

      res.json({
        target,
        tree: hierarchy
      });
    } catch (error) {
      console.error('Hierarchy Error:', error);
      res.status(500).json({ error: 'Failed to fetch hierarchy' });
    }
  },

  syncData: async (req, res) => {
    try {
      console.log('[Backend] Manual sync triggered via API');
      const result = await syncAll();
      
      if (result.success) {
        const htsRecords = getHTSRecords();
        res.json({ 
          success: true, 
          message: 'USITC Synchronization complete',
          records: htsRecords.length,
          timestamp: new Date()
        });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error) {
      console.error('Sync Error:', error);
      res.status(500).json({ error: 'Sync failed: ' + error.message });
    }
  }
};
