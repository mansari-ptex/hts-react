import { USA_ENGINE } from '../countries/usa/engine';

/**
 * Parses and determines the effective duty rate using the unified USA_ENGINE
 */
export const getEffectiveDuty = (item, countryName) => {
  if (!item) return { rate: 'N/A', type: 'General', section301: 0, total: 'N/A' };

  // Call the robust engine
  // Note: We pass null for findParentWithRateFn for now, 
  // as deep inheritance is usually pre-calculated or handled in the modal.
  const engineResult = USA_ENGINE.getDutyRate(item, countryName, null);

  return {
    rate: engineResult.value,
    type: engineResult.column === 'other' ? 'Column 2 (Other)' : 
          engineResult.column === 'special' ? 'Special (FTA)' : 'General',
    isMatch: engineResult.column !== 'general',
    section301: parseFloat(engineResult.additionalDuty1) || 0,
    total: engineResult.totalDuty,
    inherited: engineResult.inherited
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
