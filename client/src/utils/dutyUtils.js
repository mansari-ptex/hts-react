import { COUNTRY_CODE_MAP } from '../countries/usa/countryCodes';

// Column 2 Countries (Subject to highest duties)
const COLUMN_2_ISO = ['CU', 'KP', 'RU', 'BY']; // Cuba, North Korea, Russia, Belarus

/**
 * Parses and determines the effective duty rate based on country of origin
 */
export const getEffectiveDuty = (item, countryName) => {
  if (!item) return { rate: 'N/A', type: 'General' };

  const iso = COUNTRY_CODE_MAP[countryName];
  
  // 1️⃣ Column 2 Check
  if (iso && COLUMN_2_ISO.includes(iso)) {
    return {
      rate: item.other_rate || item.general_rate,
      type: 'Column 2 (Other)',
      isMatch: true
    };
  }

  // 2️⃣ Special Rate Check (FTA/Programs)
  if (iso && item.special_rate) {
    // Regex to match ISO inside parentheses, e.g., "Free (AU,BH,CL,KR)"
    // We look for the ISO code bounded by non-alphanumeric chars or start/end
    const isoRegex = new RegExp(`(?<=[^A-Z]|^)${iso}(?=[^A-Z]|$)`, 'i');
    
    if (isoRegex.test(item.special_rate)) {
      // Extract the rate part (everything before the first parenthesis)
      const specialRateValue = item.special_rate.split('(')[0].trim();
      return {
        rate: specialRateValue || 'Free',
        type: `Special (FTA: ${iso})`,
        isMatch: true
      };
    }
  }

  // 3️⃣ Fallback to General Rate
  return {
    rate: item.general_rate || 'Free',
    type: 'General',
    isMatch: false
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
