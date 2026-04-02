import fs from 'fs';
import { sanitizeHTS } from './src/services/htsProcessor.js';

const runTest = () => {
    try {
        console.log('--- HTS Processor Test ---');
        const rawData = JSON.parse(fs.readFileSync('./data/master.json', 'utf8'));
        console.log(`Loaded ${rawData.length} records.`);

        const cleanData = sanitizeHTS(rawData);
        console.log(`Processed into ${cleanData.length} records.`);

        // Test cases verification
        const sampleRecord = cleanData.find(r => r.code === '6201.20.11.10');
        if (sampleRecord) {
            console.log('\nSample Record (6201.20.11.10):');
            console.log(JSON.stringify(sampleRecord, null, 2));
        }

        const bracketedRecord = cleanData.find(r => r.description.includes('('));
        if (bracketedRecord) {
            console.log('\nPotential bracketed description issue (check if numbers are gone):');
            console.log(`- Original: ${rawData.find(r => r.htsno === bracketedRecord.code).description}`);
            console.log(`- Cleaned:  ${bracketedRecord.description}`);
        } else {
            console.log('\nNo descriptions with brackets found in clean data (Good!).');
        }

        const superiorRowSearch = cleanData.find(r => r.superior === "true" || r.superior === true);
        if (superiorRowSearch) {
            console.log('\nFAIL: Superior row found in clean data.');
        } else {
            console.log('\nPASS: No superior rows found in clean data.');
        }

        const emptyCodeSearch = cleanData.find(r => !r.code);
        if (emptyCodeSearch) {
          console.log('\nFAIL: Empty code found in clean data.');
        } else {
          console.log('\nPASS: No empty codes found in clean data.');
        }

        // Test Inheritance
        // Find a record that likely has inherited rates
        const leafNode = cleanData.find(r => r.level > 0 && r.general_rate !== "");
        if (leafNode) {
            console.log('\nInheritance Check:');
            console.log(`Code: ${leafNode.code} (Level ${leafNode.level})`);
            console.log(`General Rate: ${leafNode.general_rate}`);
        }

    } catch (error) {
        console.error('Test Failed:', error);
    }
};

runTest();
