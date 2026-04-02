import { COUNTRY_CODE_MAP } from '../countries/usa/countryCodes';

// Column 2 Countries (Subject to highest duties)
const COLUMN_2_ISO = ['CU', 'KP', 'RU', 'BY']; // Cuba, North Korea, Russia, Belarus

/**
 * Parses and determines the effective duty rate based on country of origin
 */
export const getEffectiveDuty = (item, countryName) => {
  if (!item) return { rate: 'N/A', type: 'General', section301: 0 };

  const iso = COUNTRY_CODE_MAP[countryName];
  const section301 = (iso === 'CN') ? (item.section301_rate || 0) : 0;
  
  // 1️⃣ Column 2 Check
  if (iso && COLUMN_2_ISO.includes(iso)) {
    return {
      rate: item.other_rate || item.general_rate,
      type: 'Column 2 (Other)',
      isMatch: true,
      section301
    };
  }

  // 2️⃣ Special Rate Check (FTA/Programs)
  if (iso && item.special_rate) {
    const isoRegex = new RegExp(`(?<=[^A-Z]|^)${iso}(?=[^A-Z]|$)`, 'i');
    
    if (isoRegex.test(item.special_rate)) {
      const specialRateValue = item.special_rate.split('(')[0].trim();
      return {
        rate: specialRateValue || 'Free',
        type: `Special (FTA: ${iso})`,
        isMatch: true,
        section301
      };
    }
  }

  // 3️⃣ Fallback to General Rate
  return {
    rate: item.general_rate || 'Free',
    type: 'General',
    isMatch: false,
    section301
  };
};

/**
 * Extract all unique ISO codes from a special_rate string for the legend
 */
export const extractSpecialCodes = (records) => {
  const codes = new Set();
  records.forEach(r => {
    if (r.special_rate) {
      const match = r.special_rate.match(/\((.*?)\)/);
      if (match && match[1]) {
        match[1].split(',').forEach(c => codes.add(c.trim().toUpperCase()));
      }
    }
  });
  return Array.from(codes).sort();
};
