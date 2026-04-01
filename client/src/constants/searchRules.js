export const SINGLE_NODE_STRONG_CATEGORIES = new Set([
                    "handkerchiefs",
                    "braces",
                    "suspenders",
                    "negligees",
                    "night dresses",
                    "shawls",
                    "shirts",
                    "garters",
                    "scarves",
                    "socks",
                    "bow ties",
                    "cravats",
                    "mantillas",
                    "mittens",
                    "mitts",
                    "mufflers",
                    "veils",
                    "bodysuits",
                    "sweaters",
                    "sweatshirts",
                    "bodyshirts",
                    "shirt-blouses",
                    "undershirts",
                    "coats",
                ]);

export const SCOPE_CATEGORIES = new Set([
    "babies",
    "infants",
    "toddlers",
    "girls",
    "boys",
    "women",
    "men",
    "blouses",
    "sets"
]);

export const CATEGORY_SYNONYMS = {
    "Pullovers": ["pullovers", "pullover"],
    "Sweaters": ["sweaters", "sweater"],
};

export const CATEGORY_EXCLUSIONS = {
    "Suits": {
        excludeKeywords: ["track suits", "ski suits", "ski-suits"],
        allowedChapters: ["61", "62"] // tailored garments only
    },
    "Socks": {
        excludeParentKeywords: ["babies", "infants"],
        allowedChapters: ["61"]
    },
    "Pullovers":{
        excludeParentKeywords: ["babies", "infants"],
        allowedChapters: ["61"]
    },
    "Coats": {
        excludeParentKeywords: ["raincoats", "poncho","over","carcoats"], // example: skip these if needed
        allowedChapters: ["61", "62"]             // limit to knitted/woven chapters
    },
    "Jackets": {
        excludeParentKeywords: ["ski-jackets"], // example: skip these if needed
        allowedChapters: ["61", "62"]             // limit to knitted/woven chapters
    },
    "Shirt-Blouses": {
        excludeParentKeywords:["Track suits", "Ski suits"],
        allowedChapters: ["61", "62"]
    },
    "Tops": {
        excludeParentKeywords: ["tank tops"],
        allowedChapters: ["61", "62"]
    },
    "Undershirts": {
        excludeParentKeywords: ["Thermal undershirts"],
        allowedChapters: ["61", "62"]
    },
    "Shirts":{
        excludeParentKeywords:["T-shirts"],
        allowedChapters: ["61","62"]
    },
    "Plastic or Rubber Coated Garments":{
        excludeParentKeywords: ["overcoats","ensembles","sweaters","loomed","wool","dress","warp","silk","tracksuits","pajamas","swimwear","jumpsuits","T-shirts","knitted","textile","playsuits",],
        excludeKeywords:["cotton"],
        allowedChapters: ["61", "62"]
    }
};