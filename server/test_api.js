// Using built-in fetch (Node 18+)
const BASE_URL = 'http://localhost:5000/api';

const runApiTest = async () => {
    try {
        console.log('--- API Refactor Verification ---');
        
        // 1. Check Status
        const statusRes = await fetch(`${BASE_URL}/status`);
        const statusData = await statusRes.json();
        console.log(`Status Check: ${statusData.message} (${statusData.recordsLoaded} records)`);

        // 2. Test Search
        const query = '6101';
        const searchRes = await fetch(`${BASE_URL}/search?q=${query}`);
        const searchData = await searchRes.json();
        console.log(`Search for "${query}": Found ${searchData.length} records.`);
        if (searchData.length > 0) {
            console.log(`First Match: ${searchData[0].code} - ${searchData[0].description}`);
        }

        // 3. Test Exact Lookup
        const code = '6101.20.00.10';
        const lookupRes = await fetch(`${BASE_URL}/code/${code}`);
        const lookupData = await lookupRes.json();
        if (lookupData.code) {
           console.log(`Lookup for "${code}": SUCCESS`);
           console.log(`Resolved Parent: ${lookupData.parent}`);
        } else {
           console.error(`Lookup for "${code}": FAILED`);
        }

    } catch (error) {
        console.error('API Verification Failed (Is the server running?):', error);
    }
};

runApiTest();
