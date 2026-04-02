/**
 * HTS Data Processor Service (Robust Version)
 * Implements strict code-based levels, recursive orphan handling, and full sanitization.
 */

/**
 * Remove ALL HTML tags from a string
 */
const stripHtml = (html) => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").trim();
};

/**
 * Normalize special rate spacing (e.g. "KR, MA, OM" -> "KR,MA,OM")
 */
const normalizeRateSpacing = (rate) => {
  if (!rate) return "";
  return rate.replace(/,\s*/g, ",").trim();
};

export const sanitizeHTS = (rawData) => {
  if (!Array.isArray(rawData)) return [];

  // --- STAGE 1: FILTERING & BASIC SANITIZATION ---
  const validRecordsMapped = new Map();
  const rawList = [];

  for (const row of rawData) {
    // Rule 1: Skip if htsno is empty or superior is true
    if (
      !row.htsno || 
      row.htsno.trim() === "" || 
      row.superior === "true" || 
      row.superior === true
    ) {
      continue;
    }

    const code = row.htsno.trim();
    
    // Clean units array
    const units = Array.isArray(row.units) ? row.units : (row.units ? [row.units] : []);
    const cleanUnits = [...new Set(units.map(u => stripHtml(u)))].filter(Boolean);

    const record = {
      code,
      description: stripHtml(row.description),
      general_rate: row.general || "",
      special_rate: normalizeRateSpacing(row.special),
      other_rate: row.other || "",
      unit: cleanUnits,
      // Temporarily store original row fields for level/parent calculations
      _raw: row 
    };

    // Deduplication check: Keep first occurrence of a code in the raw list
    if (!validRecordsMapped.has(code)) {
      validRecordsMapped.set(code, record);
      rawList.push(record);
    }
  }

  // --- STAGE 2: HIERARCHY & ORPHAN HANDLING ---
  rawList.forEach(record => {
    const code = record.code;
    const parts = code.split(".");
    
    // Rule 2: Level calculation (STRICT)
    record.level = parts.length - 1;

    // Rule 3: Recursive Parent Derivation
    let parentResolved = null;
    let tempParts = [...parts];

    while (tempParts.length > 1) {
      tempParts.pop(); // Remove last segment
      const potentialParentCode = tempParts.join(".");
      
      if (validRecordsMapped.has(potentialParentCode)) {
        parentResolved = potentialParentCode;
        break; 
      }
      // If direct parent doesn't exist, loop continues up the tree
    }

    record.parent = parentResolved;
  });

  // --- STAGE 3: INHERITANCE ---
  // We use a function to find the nearest ancestor with a specific rate field
  const findInheritedRate = (record, field) => {
    if (record[field] && record[field] !== "N/A" && record[field] !== "") {
      return record[field];
    }
    
    let currentParent = record.parent;
    while (currentParent) {
      const ancestor = validRecordsMapped.get(currentParent);
      if (ancestor && ancestor[field] && ancestor[field] !== "N/A" && ancestor[field] !== "") {
        return ancestor[field];
      }
      currentParent = ancestor ? ancestor.parent : null;
    }
    return "";
  };

  const finalResults = rawList.map(record => {
    const { _raw, ...cleanRecord } = record;
    
    // Apply inheritance for all rate fields
    cleanRecord.general_rate = findInheritedRate(record, "general_rate");
    cleanRecord.special_rate = findInheritedRate(record, "special_rate");
    cleanRecord.other_rate = findInheritedRate(record, "other_rate");

    // Final safety defaults
    cleanRecord.general_rate = cleanRecord.general_rate || "";
    cleanRecord.special_rate = cleanRecord.special_rate || "";
    cleanRecord.other_rate = cleanRecord.other_rate || "";
    cleanRecord.unit = cleanRecord.unit || [];

    return cleanRecord;
  });

  return finalResults;
};
