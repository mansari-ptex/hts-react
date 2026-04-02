/**
 * HTS Data Processor Service (Enhanced Version)
 * Implements category extraction (Gender, Material, Fabric), recursive orphan handling, and full inheritance.
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

/**
 * CATEGORY EXTRACTION RULES
 */
const extractCategories = (description) => {
  const norm = description.toLowerCase();
  const categories = {
    gender: "",
    material: "",
    fabric: "",
    feature: ""
  };

  // 1. Gender Extraction (Ordered specifically to avoid substring collisions)
  if (norm.includes("babies'")) categories.gender = "Babies";
  else if (norm.includes("women's")) categories.gender = "Women";
  else if (norm.includes("girls'")) categories.gender = "Girls";
  else if (norm.includes("men's")) categories.gender = "Men";
  else if (norm.includes("boys'")) categories.gender = "Boys";

  // 2. Material (Construction)
  if (norm.includes("knitted or crocheted")) categories.material = "Knitted";
  else if (norm.includes("other than knitted or crocheted") || norm.includes("woven")) categories.material = "Woven";

  // 3. Fabric Type
  const fabricKeywords = {
    "Cotton": ["cotton"],
    "Wool": ["wool", "fine animal hair"],
    "Silk": ["silk", "silk waste"],
    "Synthetic fibers": ["synthetic fibers"],
    "Artificial fibers": ["artificial fibers"],
    "Man-made fibers": ["man-made fibers"],
    "Vegetable fibers": ["vegetable fibers", "flax"]
  };

  for (const [key, keywords] of Object.entries(fabricKeywords)) {
    if (keywords.some(kw => norm.includes(kw))) {
      categories.fabric = key;
      break;
    }
  }

  // 4. Features
  if (norm.includes("recreational performance outerwear")) categories.feature = "Recreational Performance Outerwear";
  else if (norm.includes("water resistant") || norm.includes("water-resistant")) categories.feature = "Water resistant";
  else if (norm.includes("knit to shape") || norm.includes("knit-to-shape")) categories.feature = "Knit to Shape";

  return categories;
};

/**
 * Build a lookup map for Chapter 99 additional duties
 */
export const buildChapter99Map = (rawData) => {
  if (!Array.isArray(rawData)) return {};
  const map = {};
  rawData.forEach(row => {
    if (row.htsno && row.htsno.startsWith('99') && row.general) {
      const code = row.htsno.replace(/\./g, '').trim();
      const match = row.general.match(/(\d+\.?\d*)%/);
      if (match) {
        map[code] = parseFloat(match[1]);
      }
    }
  });
  return map;
};

export const sanitizeHTS = (rawData, ch99Map = {}) => {
  if (!Array.isArray(rawData)) return [];

  // --- STAGE 1: FILTERING & BASIC SANITIZATION ---
  const validRecordsMapped = new Map();
  const rawList = [];

  for (const row of rawData) {
    if (
      !row.htsno || 
      row.htsno.trim() === "" || 
      row.superior === "true" || 
      row.superior === true
    ) {
      continue;
    }

    const code = row.htsno.trim();
    const cleanDesc = stripHtml(row.description);
    const extracted = extractCategories(cleanDesc);
    
    // Clean units array
    const units = Array.isArray(row.units) ? row.units : (row.units ? [row.units] : []);
    const cleanUnits = [...new Set(units.map(u => stripHtml(u)))].filter(Boolean);

    // Extract Section 301 Rate from Footnotes
    let section301Rate = 0;
    if (row.footnotes && row.footnotes.length > 0) {
      row.footnotes.forEach(fn => {
        // Look for Chapter 99 codes in the note (e.g., 9903.88.15)
        const match = fn.value?.match(/9903\.?88\.?\d{2}/);
        if (match) {
          const refCode = match[0].replace(/\./g, '');
          if (ch99Map[refCode]) {
            section301Rate = ch99Map[refCode];
          }
        }
      });
    }

    const record = {
      code,
      description: cleanDesc,
      gender: extracted.gender,
      material: extracted.material,
      fabric: extracted.fabric,
      feature: extracted.feature,
      general_rate: row.general || "",
      special_rate: normalizeRateSpacing(row.special),
      other_rate: row.other || "",
      unit: cleanUnits,
      section301_rate: section301Rate,
      _raw: row 
    };

    if (!validRecordsMapped.has(code)) {
      validRecordsMapped.set(code, record);
      rawList.push(record);
    }
  }

  // --- STAGE 2: HIERARCHY & ORPHAN HANDLING ---
  rawList.forEach(record => {
    const code = record.code;
    const parts = code.split(".");
    record.level = parts.length - 1;

    let parentResolved = null;
    let tempParts = [...parts];

    while (tempParts.length > 1) {
      tempParts.pop();
      const potentialParentCode = tempParts.join(".");
      if (validRecordsMapped.has(potentialParentCode)) {
        parentResolved = potentialParentCode;
        break; 
      }
    }
    record.parent = parentResolved;
  });

  // --- STAGE 3: INHERITANCE ---
  const findInheritedField = (record, field) => {
    if (record[field] && record[field] !== "N/A" && record[field] !== "") {
      return record[field];
    }
    
    let currentParent = record.parent;
    while (currentParent) {
      const ancestor = validRecordsMapped.get(currentParent);
      if (ancestor && ancestor[field] && ancestor[field] !== "N/A" && ancestor[field] !== "") {
        if (field === 'section301_rate' && ancestor[field] === 0) {
          // keep searching
        } else {
          return ancestor[field];
        }
      }
      currentParent = ancestor ? ancestor.parent : null;
    }
    return (field === 'section301_rate') ? 0 : "";
  };

  const findHierarchyDescription = (record) => {
    let parts = [record.description];
    let currentParent = record.parent;
    while (currentParent) {
      const ancestor = validRecordsMapped.get(currentParent);
      if (ancestor) {
        parts.unshift(ancestor.description);
        currentParent = ancestor.parent;
      } else {
        currentParent = null; 
      }
    }
    return parts.join(" > ");
  };

  const finalResults = rawList.map(record => {
    const { _raw, ...cleanRecord } = record;
    cleanRecord.description = findHierarchyDescription(record);

    cleanRecord.general_rate = findInheritedField(record, "general_rate");
    cleanRecord.special_rate = findInheritedField(record, "special_rate");
    cleanRecord.other_rate = findInheritedField(record, "other_rate");
    cleanRecord.gender = findInheritedField(record, "gender");
    cleanRecord.material = findInheritedField(record, "material");
    cleanRecord.fabric = findInheritedField(record, "fabric");
    cleanRecord.feature = findInheritedField(record, "feature");
    cleanRecord.section301_rate = findInheritedField(record, "section301_rate");

    return cleanRecord;
  });

  return finalResults;
};

