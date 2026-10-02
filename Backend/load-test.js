const TOTAL_REQUESTS = 100;
const CONCURRENT_REQUESTS = 10;

let completed = 0;
let failed = 0;

async function makeRequest() {
    try {
        const response = await fetch("http://localhost:5000/api/health");

        if (response.ok) {
            completed++;
        } else {
            failed++;
        }
    } catch (error) {
        failed++;
    }
}

async function runTest() {
    const start = Date.now();

    for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENT_REQUESTS) {
        const batch = [];

        for (
            let j = 0;
            j < CONCURRENT_REQUESTS && i + j < TOTAL_REQUESTS;
            j++
        ) {
            batch.push(makeRequest());
        }

        await Promise.all(batch);
    }

    const duration = Date.now() - start;

    console.log("\n========== LOAD TEST ==========");
    console.log(`Total requests: ${TOTAL_REQUESTS}`);
    console.log(`Concurrent requests: ${CONCURRENT_REQUESTS}`);
    console.log(`Successful: ${completed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Duration: ${duration} ms`);
    console.log(`Requests/sec: ${(TOTAL_REQUESTS / (duration / 1000)).toFixed(2)}`);
    console.log("================================\n");
}

runTest();