import { USA_TRADE_CONFIG } from "./config.js";
import { COUNTRY_CODE_MAP } from "./countryCodes.js";
import { USA_PROGRAM_COUNTRIES } from "./programCountries.js";
import { getCountryOverrides } from "./countryDutyOverrides.js";


export const USA_ENGINE = {
    name: "USA",

    getImportingCountry() {
        return "USA";
    },

    getTradeConfig() {
        return USA_TRADE_CONFIG;
    },

    getRateColumn(countryName, item, findParentWithRateFn) {

        if (!item) return "general";
    
        const trade = this.getTradeConfig();
    
        // 1️⃣ Column 2 sanctions (highest priority)
        if (trade.column2Countries.includes(countryName)) {
            return "other";
        }
    
        // ISO code (AF, JO, AU etc)
        const iso = COUNTRY_CODE_MAP[countryName];
        if (!iso) return "general";
    
        // 2️⃣ Get SPECIAL column text (inherit if empty)
        let specialText = item.special || "";
    
        if (!specialText || specialText === "N/A") {
            const parent = findParentWithRateFn?.(item, "special");
            if (parent?.special) specialText = parent.special;
        }
    
        if (!specialText) return "general";
    
        specialText = specialText.toUpperCase();
    
        // 3️⃣ Direct FTA match (JO, AU, SG, S, P etc)
        const isoRegex = new RegExp(`\\b${iso}\\b`, "i");
        if (isoRegex.test(specialText)) {
            return "special";
        }
    
        // 4️⃣ Program match (loop through USA_PROGRAM_COUNTRIES)
        for (const [programCode, countries] of Object.entries(USA_PROGRAM_COUNTRIES)) {
    
            // is this country part of this program?
            if (!countries.includes(countryName)) continue;
    
            // does the HS row allow this program?
            const progRegex = new RegExp(`\\b${programCode}\\b`, "i");
            if (progRegex.test(specialText)) {
                return "special";
            }
        }
    
        // 5️⃣ fallback → General column
        return "general";
    },
    

    // ⭐ PRIVATE — inherit rate from parent nodes
    inheritRate(item, rateField, findParentWithRateFn) {
        const parent = findParentWithRateFn(item, rateField);

        if (!parent) return null;

        return parent[rateField] || null;
    },

    // ⭐ MAIN ENGINE FUNCTION (UI will call ONLY this)
    getDutyRate(item, exportingCountry, findParentWithRateFn) {

        if (!item) {
            return {
                value: "N/A",
                inherited: false,
                column: "general",
                additionalDuty1: null,
                additionalDuty2: null,
                totalDuty: "N/A"
            };
        }
    
        const rateField = this.getRateColumn(exportingCountry, item, findParentWithRateFn);
        let rate = item[rateField];
    
        const overrides = getCountryOverrides(exportingCountry) || {};
        const additional1 = overrides.additionalDuty1 ?? null;
        const additional2 = overrides.additionalDuty2 ?? null;
    
        const parseNum = (v) => {
            if (v === null || v === undefined) return NaN;
            if (typeof v === "number") return v;
            const m = String(v).match(/-?\d+(?:\.\d+)?/);
            return m ? parseFloat(m[0]) : NaN;
        };
    
        const formatTwoDecimals = (num) => num.toFixed(2);

        const computeTotalDisplay = (baseRate, additional1, additional2) => {
            const baseNum = parseNum(baseRate);
            const add1Num = parseNum(additional1);
            const add2Num = parseNum(additional2);
        
            if (!Number.isFinite(baseNum)) return "N/A";
        
            const finalTotal =
                baseNum +
                (Number.isFinite(add1Num) ? add1Num : 0) +
                (Number.isFinite(add2Num) ? add2Num : 0);
        
            return finalTotal.toFixed(2) + "%";
        };
    
if (!rate || rate === "" || rate === "N/A") {
    const inheritedRate = this.inheritRate(item, rateField, findParentWithRateFn);

    if (inheritedRate) {
        return {
            value: inheritedRate,
            inherited: true,
            column: rateField,
            additionalDuty1: additional1,
            additionalDuty2: additional2,
            totalDuty: computeTotalDisplay(inheritedRate, additional1, additional2)
        };
    }

    return {
        value: "N/A",
        inherited: false,
        column: rateField,
        additionalDuty1: null,
        additionalDuty2: null,
        totalDuty: "N/A"
    };
}

return {
    value: rate,
    inherited: false,
    column: rateField,
    additionalDuty1: additional1,
    additionalDuty2: additional2,
    totalDuty: computeTotalDisplay(rate, additional1, additional2)
};
    }
};