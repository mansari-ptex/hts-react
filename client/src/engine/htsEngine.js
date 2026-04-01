import { appState, selectedFilters } from "../state/appState.js";
import { CATEGORY_KEYWORDS } from "../constants/categories.js";
import {
  CATEGORY_SYNONYMS,
  CATEGORY_EXCLUSIONS,
  SINGLE_NODE_STRONG_CATEGORIES
} from "../constants/searchRules.js";

import {GENDER_TERMS,MATERIAL_NEUTRAL_CATEGORIES} from "../constants/genderRules.js";

let callbacks = {};
let COUNTRY_ENGINE = null;

export function initHTSEngine(engine, cb = {}) {
  COUNTRY_ENGINE = engine;
  callbacks = cb;
}

function findParentWithRate(item, rateField) {
    const currentIndex = appState.masterData.indexOf(item) == -1 ? appState.masterData.findIndex(InnerItem => InnerItem.htsno === item.htsno && InnerItem.description === item.description) : appState.masterData.indexOf(item);
    const currentIndent = parseInt(item.indent);

    for (let i = currentIndex - 1; i >= 0; i--) {
        const checkItem = appState.masterData[i];
        const checkIndent = parseInt(checkItem.indent);
        if (checkIndent < currentIndent) {
            if (checkItem[rateField] && checkItem[rateField] !== '' && checkItem[rateField] !== 'N/A') {
                return checkItem;
            }
        }
        if (checkIndent === 0 && i !== currentIndex - 1) break;
    }
    return null;
}

function matchesWordBoundary(text, searchWord) {
    const regex = new RegExp(`\\b${searchWord}\\b`, 'i');
    return regex.test(text);
}

function isExactProductAtLeaf(item, productCategory) {
    const path = getHierarchyPath(item);

    if (!path.length) return false;

    const last = normalizeText(path[path.length - 1].description);
    const parent =
        path.length > 1
            ? normalizeText(path[path.length - 2].description)
            : '';

    const normalizedCategory = normalizeText(productCategory);

    return (
        last.includes(normalizedCategory) ||
        parent.includes(normalizedCategory)
    );
}

function getHierarchyPath(item) {
    const hierarchyItems = [];
    let currentIndent = parseInt(item.indent);
    let currentIndex = appState.masterData.indexOf(item);

    for (let i = currentIndex; i >= 0; i--) {
        const checkItem = appState.masterData[i];
        const checkIndent = parseInt(checkItem.indent);
        if (checkIndent < currentIndent || i === currentIndex) {
            hierarchyItems.unshift(checkItem);
            currentIndent = checkIndent;
        }
        if (currentIndent === 0) break;
    }
    return hierarchyItems;
}

function getFullDescription(item) {
    if (!item) return '';
    let descriptions = [item.description || ''];
    let currentIndent = parseInt(item.indent || 0);
    
    let currentIndex = appState.masterData.indexOf(item);
    if (currentIndex === -1) {
        currentIndex = appState.masterData.findIndex(i => i.htsno === item.htsno && i.description === item.description);
    }

    if (currentIndex !== -1) {
        for (let i = currentIndex - 1; i >= 0; i--) {
            const prevItem = appState.masterData[i];
            const prevIndent = parseInt(prevItem.indent);

            if (prevIndent < currentIndent) {
                descriptions.unshift(prevItem.description);
                currentIndent = prevIndent;
            }

            if (currentIndent === 0) break;
        }
    }

    return descriptions.join(' > ');
}

function isTenDigitHTS(htsno) {
    if (!htsno) return false;
    const digitsOnly = htsno.replace(/\D/g, '');
    return digitsOnly.length === 10;
}

                function getFullHierarchyText(item) {
                        const path = getHierarchyPath(item);
                        return path.map(n => n.description.toLowerCase()).join(' ');
                    }

                function getGenderScope(item) {
                        const path = getHierarchyPath(item);
                        const found = new Set();

                        path.forEach(node => {
                            const text = normalizeText(node.description);

                            for (const [gender, terms] of Object.entries(GENDER_TERMS)) {
                                if (terms.some(t => new RegExp(`\\b${t}\\b`, 'i').test(text))) {
                                    found.add(gender);
                                }
                            }
                        });

                        return found.size ? Array.from(found) : null;
                    }

                function extractGendersFromText(text) {
                    const found = new Set();
                    const normalized = normalizeText(text);

                    for (const [gender, terms] of Object.entries(GENDER_TERMS)) {
                        terms.forEach(term => {
                            const regex = new RegExp(
                                `\\b${term}(?:'s|’s|s)?(?:\\s+or\\s+\\w+)?\\b`,
                                'i'
                            );
                            if (regex.test(normalized)) {
                                found.add(gender);
                            }
                        });
                    }

                    return found.size ? Array.from(found) : null;
                }

                function getGenderFromLeafAndParent(item) {
                    const path = getHierarchyPath(item);
                    if (!path.length) return null;

                    const gendersInLeaf = extractGendersFromText(path[path.length - 1].description) || [];
                    const genders = new Set(gendersInLeaf);

                    // parent node
                    if (path.length > 1) {
                        const parentGenders = extractGendersFromText(path[path.length - 2].description) || [];
                        parentGenders.forEach(g => {
                            if (!gendersInLeaf.includes(g)) genders.add(g); // avoid duplicate
                        });
                    }

                    return genders.size ? Array.from(genders) : null;
                }

                function matchesCategoryHierarchy(item, keywords) {
                    const path = getHierarchyPath(item);

                    if (!path.length) return false;

                    // ✅ Check parent nodes first
                    for (let i = 0; i < path.length - 1; i++) {
                        const node = normalizeText(path[i].description);
                        if (keywords.some(k => matchesWordBoundary(node, k))) return true;
                    }

                    // ✅ Then check leaf node
                    const leaf = normalizeText(path[path.length - 1].description);
                    if (keywords.some(k => matchesWordBoundary(leaf, k))) return true;

                    return false;
                }

                function getCategoryScope(category) {
                                    const text = normalizeText(category);
                
                                    if (text.includes("babies") || text.includes("infant")) return "babies";
                                    if (text.includes("girls")) return "girls";
                                    if (text.includes("boys")) return "boys";
                                    if (text.includes("women")) return "women";
                                    if (text.includes("men")) return "men";
                
                                    return null;
                                }
                
                                function isMatchInParent(item, productCategoryNormalized) {
                                    const path = getHierarchyPath(item);
                                    for (let i = 0; i < path.length - 1; i++) {
                                        if (matchesWordBoundary(normalizeText(path[i].description), productCategoryNormalized)) {
                                            return true;
                                        }
                                    }
                                    return false;
                                }
                
                                function getCategoryLeaf(category) {
                                    if (!category) return "";
                                    return normalizeText(category.split(">").pop().trim());
                                }
                
                                function hasScopeInHierarchy(item, scope) {
                                    const path = getHierarchyPath(item);
                                    const scopeRegex = new RegExp(`\\b${scope}\\b`, "i");
                
                                    return path.some(p =>
                                        scopeRegex.test(normalizeText(p.description))
                                    );
                                }
                
                                function isSingleNodeStrongCategory(category) {
                                    return SINGLE_NODE_STRONG_CATEGORIES.has(
                                        normalizeText(category)
                                    );
                                }

                                function normalizeText(str) {
                                    return str
                                        .toLowerCase()
                                        .replace(/[\(\)\d]/g, '')  // remove parentheses and numbers
                                        .replace(/\s+/g, ' ')       // collapse multiple spaces
                                        .trim();
                                        }
                    
                                    function escapeRegExp(string) {
                                        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                    }
                                    
                                    function getRateLabel(column){
                                        if(column === "other") return "Column 2";
                                        if(column === "special") return "Special";
                                        return "General";
                                    }

function searchHTSByFilters() {

                    if (appState.isResetting) return;
                    if (!selectedFilters.category || !selectedFilters.exportingCountry) {
                        callbacks.clearResults?.();
                        return;
                    }
                    
                
                    const productCategory = selectedFilters.category;
                    const gender = selectedFilters.gender;
                    const material = selectedFilters.material;
                    const fabric = selectedFilters.fabric;
                    const exportingCountry = selectedFilters.exportingCountry;
                
                    if (!productCategory || !exportingCountry) {
                        callbacks.clearResults?.("Please select Product Category and Country");
                        return;

                    }
                
                    /* 🔑 STEP 1: derive HTS keywords ONLY from PRODUCT CATEGORY */
                    let keywordList = CATEGORY_KEYWORDS[productCategory] || [];
                
                    // Fallback: sub-item → grouped keyword set
                    if (!keywordList.length) {
                        const normalizedProduct = normalizeText(productCategory);
                        for (const kws of Object.values(CATEGORY_KEYWORDS)) {
                            if (kws.some(kw => normalizeText(kw) === normalizedProduct)) {
                                keywordList = kws;
                                break;
                            }
                        }
                    }
                
                    if (!keywordList.length) return;
                
                    const productCategoryNormalized = normalizeText(productCategory);
                
                    /* 🔑 STEP 2: FILTER appState.masterData */
                    let filtered = appState.masterData
                        .filter(item => {
                
                            if (!item.htsno || !isTenDigitHTS(item.htsno)) return false;
                
                            const chapter = item.htsno.substring(0, 2);
                            const normalizedDesc = normalizeText(getFullHierarchyText(item));
                
                            /* 🚫 CATEGORY-SPECIFIC HARD EXCLUSIONS */
                            const rule = CATEGORY_EXCLUSIONS[productCategory];
                            if (rule) {
                
                                if (
                                    rule.excludeParentKeywords &&
                                    selectedFilters.gender !== "Babies" &&
                                    rule.excludeParentKeywords.some(k =>
                                        new RegExp(`\\b${k}\\b`, "i").test(normalizedDesc)
                                    )
                                ) return false;
                
                                if (
                                    rule.excludeKeywords &&
                                    rule.excludeKeywords.some(kw =>
                                        new RegExp(`\\b${kw}\\b`, "i").test(normalizedDesc)
                                    )
                                ) return false;
                
                                if (
                                    rule.allowedChapters &&
                                    !rule.allowedChapters.includes(chapter)
                                ) return false;
                            }
                
                            /* 🔓 CATEGORY MATCH (old behavior restored) */
                            const derivedScope = getCategoryScope(productCategory);
                            const isScopeCategory = !!derivedScope;
                
                            if (
                                !isScopeCategory &&
                                !matchesCategoryHierarchy(item, keywordList)
                            ) {
                                return false;
                            }
                
                            if (
                                isScopeCategory &&
                                !hasScopeInHierarchy(item, derivedScope)
                            ) {
                                return false;
                            }
                
                            /* ✅ GENDER */
                            if (gender !== "All") {
                                const leafGenders = getGenderFromLeafAndParent(item);
                
                                if (gender === "Babies") {
                                    if (!leafGenders?.includes("Babies")) {
                                        const scope = getGenderScope(item);
                                        if (!scope?.includes("Babies")) return false;
                                    }
                                } else {
                                    if (leafGenders) {
                                        if (!leafGenders.includes(gender)) return false;
                                    } else {
                                        const scope = getGenderScope(item);
                                        if (!scope?.includes(gender)) return false;
                                    }
                                }
                            }
                
                            /* ✅ FABRIC */
                            if (fabric !== "All" &&
                                !normalizedDesc.includes(normalizeText(fabric))) {
                                return false;
                            }
                
                            /* ✅ FEATURE */
                            if (selectedFilters.feature !== "All") {
                                if (!normalizedDesc.includes(
                                    normalizeText(selectedFilters.feature)
                                )) {
                                    return false;
                                }
                            }
                
                            /* ✅ MATERIAL */
                            const isMaterialNeutral =
                                MATERIAL_NEUTRAL_CATEGORIES.has(productCategoryNormalized);
                
                            if (!isMaterialNeutral) {
                                if (material === "Knitted" && chapter !== "61") return false;
                                if (material === "Woven" && chapter !== "62") return false;
                            }
                
                            return true;
                        })
                
                        /* 🔑 STEP 3: SCORE */
                        .map(item => {
                
                            const fullDesc = normalizeText(getFullHierarchyText(item));
                
                            let keywordHits = 0;
                            let uniqueHits = 0;
                
                            keywordList.forEach(kw => {
                                const normalizedKw = normalizeText(kw);
                                const escapedKw = normalizedKw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                                const matches = fullDesc.match(new RegExp(escapedKw, "g"));
                
                                if (matches) {
                                    keywordHits += matches.length;   // old behavior
                                    uniqueHits += 1;
                                }
                            });
                
                            const synonyms = CATEGORY_SYNONYMS[productCategory] || [];
                
                            return {
                                item,
                                keywordHits,
                                uniqueHits,
                
                                isLeaf:
                                    isExactProductAtLeaf(item, productCategoryNormalized) ||
                                    synonyms.some(s =>
                                        isExactProductAtLeaf(item, normalizeText(s))
                                    ),
                
                                isParent: isMatchInParent(item, productCategoryNormalized)
                            };
                        });
                
                    if (!filtered.length) {
                        callbacks.clearResults?.("No matching HTS found");
                        return;

                    }
                
                    /* 🔑 STEP 4: SPLIT RESULTS (old logic) */
                    const primaryResults = [];
                    const relatedResults = [];
                
                    filtered.forEach(r => {
                
                        const derivedScope = getCategoryScope(productCategory);
                
                        const isStrongSingleNodeCategory =
                            isSingleNodeStrongCategory(productCategory) &&
                            (r.isLeaf || r.isParent);
                
                        const isScopeStrong =
                            derivedScope &&
                            hasScopeInHierarchy(r.item, derivedScope);
                
                        if (
                            isScopeStrong ||
                            r.keywordHits >= 2 ||
                            r.uniqueHits >= 2 ||
                            r.isLeaf ||
                            isStrongSingleNodeCategory
                        ) {
                            primaryResults.push(r);
                        } else {
                            relatedResults.push(r);
                        }
                    });
                
                    /* 🔑 STEP 5: SORT (old priority) */
                    primaryResults.sort((a, b) => {
                
                        if (b.keywordHits !== a.keywordHits) {
                            return b.keywordHits - a.keywordHits;
                        }
                
                        if (b.uniqueHits !== a.uniqueHits) {
                            return b.uniqueHits - a.uniqueHits;
                        }
                
                        const rank = r => r.isLeaf ? 1 : r.isParent ? 2 : 3;
                        return rank(a) - rank(b);
                    });
                
                    /* 🔑 STEP 6: DISPLAY */
                    callbacks.displayResults?.(
                        primaryResults.map(r => r.item),
                        relatedResults.map(r => r.item),
                        exportingCountry,
                        keywordList
                      );
                      
                }
                export {
                    searchHTSByFilters,
                    normalizeText,
                    getFullDescription,
                    getGenderFromLeafAndParent,
                    findParentWithRate,
                    getRateLabel,
                    escapeRegExp,
                    getHierarchyPath   // ⭐ ADD THIS
                  };
                  
                  
                  
                  
  


