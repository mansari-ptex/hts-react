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
    if (row.htsno && row.htsno.startsWith('99')) {
      const code = row.htsno.replace(/\./g, '').trim();
      // Improved regex to find any percentage in general or other columns
      const rateString = [row.general, row.other].filter(Boolean).join(" ");
      const match = rateString.match(/(\d+\.?\d*)%/);
      if (match) {
        map[code] = parseFloat(match[1]);
      }
    }
  });
  return map;
};

export const sanitizeHTS = (rawData, ch99Map = {}) => {
  if (!Array.isArray(rawData)) return [];

  // --- STAGE 1: HIERARCHY BUILDING ---
  const validRecordsMapped = new Map();
  const rawList = [];
  const indentStack = []; 

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row.description) continue;

    let code = (row.htsno || "").trim();
    if (!code) {
      code = `sys_group_${i}`; 
    }

    const indent = parseInt(row.indent || "0", 10);
    const cleanDesc = stripHtml(row.description);
    const extracted = extractCategories(cleanDesc);
    
    const units = Array.isArray(row.units) ? row.units : (row.units ? [row.units] : []);
    const cleanUnits = [...new Set(units.map(u => stripHtml(u)))].filter(Boolean);

    // Extraction of Multiple Additional Duties (Section 301, 122, etc.)
    let section301Rate = 0;
    let section122Rate = 0;
    let sanctionRate = 0;
    let hasExclusions = false;

    if (row.footnotes && row.footnotes.length > 0) {
      row.footnotes.forEach(fn => {
        // Look for any 9903 code in the footnote
        const codesInNote = (fn.value || "").match(/9903\.?\d{2}\.?\d{2}/g);
        if (codesInNote) {
          codesInNote.forEach(rawCode => {
             const cleanRefCode = rawCode.replace(/\./g, '');
             const rate = ch99Map[cleanRefCode] || 0;
             
             // Detect Exclusions (e.g. 9903.88.25 through 9903.88.67 are exclusion lists)
             if (cleanRefCode.match(/^990388(2[5-9]|[3-6]\d)$/)) {
                 hasExclusions = true;
             }

             if (rate > 0) {
                if (cleanRefCode.startsWith('990388')) {
                  section301Rate = rate + 10;
                } else if (cleanRefCode.startsWith('990303')) {
                  section122Rate = rate;
                } else if (cleanRefCode.startsWith('990390')) {
                  sanctionRate = rate;
                } else {
                  if (section301Rate === 0) section301Rate = rate + 10;
                }
             }
          });
        }
      });
    }

    // Determine accurate parent using the indent stack
    while (indentStack.length > 0 && indentStack[indentStack.length - 1].indent >= indent) {
      indentStack.pop();
    }
    const parentCode = indentStack.length > 0 ? indentStack[indentStack.length - 1].code : null;

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
      section122_rate: section122Rate,
      sanction_rate: sanctionRate,
      has_exclusions: hasExclusions,
      level: indent,
      parent: parentCode,
      is_leaf: false
    };

    indentStack.push({ code, indent });

    if (!validRecordsMapped.has(code)) {
      validRecordsMapped.set(code, record);
      rawList.push(record);
    }
  }

  // --- STAGE 2: INHERITANCE AND CONTEXT ---
  const findInheritedField = (record, field) => {
    const isAdditiveDuty = ['section301_rate', 'section122_rate', 'sanction_rate'].includes(field);
    
    if (isAdditiveDuty) {
      if (record[field] !== 0 && record[field] !== undefined) return record[field];
    } else if (field === 'has_exclusions') {
      if (record[field] === true) return true;
    } else {
      if (record[field] !== undefined && record[field] !== "N/A" && record[field] !== "") {
        return record[field];
      }
    }
    
    let currentParent = record.parent;
    while (currentParent) {
      const ancestor = validRecordsMapped.get(currentParent);
      if (ancestor) {
        if (isAdditiveDuty) {
          if (ancestor[field] !== 0 && ancestor[field] !== undefined) return ancestor[field];
        } else if (field === 'has_exclusions') {
          if (ancestor[field] === true) return true;
        } else {
          if (ancestor[field] !== undefined && ancestor[field] !== "N/A" && ancestor[field] !== "") {
            return ancestor[field];
          }
        }
        currentParent = ancestor.parent;
      } else {
        currentParent = null;
      }
    }
    return isAdditiveDuty ? 0 : (field === 'has_exclusions' ? false : "");
  };

  const getAncestors = (record) => {
    const ancestors = [];
    let currentParent = record.parent;
    while (currentParent) {
      const ancestor = validRecordsMapped.get(currentParent);
      if (ancestor) {
        ancestors.unshift({
          code: ancestor.code,
          description: ancestor.description
        });
        currentParent = ancestor.parent;
      } else {
        currentParent = null; 
      }
    }
    return ancestors;
  };

  // Identify true structural parents
  const parentSet = new Set(rawList.map(r => r.parent).filter(Boolean));

  const finalResults = rawList.map(record => {
    record.is_leaf = !parentSet.has(record.code);
    record.ancestors = getAncestors(record);
    
    // Create the full description path for search and UI display
    const descParts = record.ancestors.map(a => a.description);
    descParts.push(record.description);
    record.full_description = descParts.join(" > ");

    // Inherit properties
    record.general_rate = findInheritedField(record, "general_rate");
    record.special_rate = findInheritedField(record, "special_rate");
    record.other_rate = findInheritedField(record, "other_rate");
    record.gender = findInheritedField(record, "gender");
    record.material = findInheritedField(record, "material");
    record.fabric = findInheritedField(record, "fabric");
    record.feature = findInheritedField(record, "feature");
    record.section301_rate = findInheritedField(record, "section301_rate");
    record.section122_rate = findInheritedField(record, "section122_rate");
    record.sanction_rate = findInheritedField(record, "sanction_rate");
    record.has_exclusions = findInheritedField(record, "has_exclusions");

    return record;
  });

  return finalResults;
};

