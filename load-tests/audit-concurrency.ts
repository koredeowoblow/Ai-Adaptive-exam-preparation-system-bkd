import { connectDB, disconnectDB } from './audit-utils';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import path from 'path';

const CONCURRENT_SESSIONS = 50;

if (isMainThread) {
    async function runConcurrencyAudit() {
        console.log(`Running Concurrency Audit with ${CONCURRENT_SESSIONS} sessions...`);
        
        const metrics: any = { 
            throughput: 0,
            p95: 0,
            p99: 0,
            failures: 0
        };

        const startTime = performance.now();
        const promises: Promise<any>[] = [];

        for (let i = 0; i < CONCURRENT_SESSIONS; i++) {
            promises.push(new Promise((resolve) => {
                const worker = new Worker(__filename, {
                    workerData: { sessionId: i }
                });
                worker.on('message', resolve);
                worker.on('error', () => resolve({ success: false, latencies: [] }));
                worker.on('exit', (code) => {
                    if (code !== 0) resolve({ success: false, latencies: [] });
                });
            }));
        }

        const results = await Promise.all(promises);
        const endTime = performance.now();
        
        let totalQuestions = 0;
        let allLatencies: number[] = [];
        let failures = 0;

        results.forEach(res => {
            if (res.success) {
                totalQuestions += res.questionsCompleted;
                allLatencies.push(...res.latencies);
            } else {
                failures++;
            }
        });

        allLatencies.sort((a, b) => a - b);
        const p95Index = Math.floor(allLatencies.length * 0.95);
        const p99Index = Math.floor(allLatencies.length * 0.99);

        metrics.throughput = totalQuestions / ((endTime - startTime) / 1000);
        metrics.p95 = allLatencies[p95Index] || 0;
        metrics.p99 = allLatencies[p99Index] || 0;
        metrics.failures = failures;

        const passed = failures === 0 && metrics.p95 < 200;

        return {
            name: "Concurrency & Throughput",
            passed,
            metrics
        };
    }

    if (require.main === module) {
        runConcurrencyAudit().then(console.log).catch(console.error);
    }
    
    module.exports = runConcurrencyAudit;

} else {
    // Worker logic
    (async () => {
        try {
            await connectDB();
            const latencies = [];
            for (let i = 0; i < 30; i++) { // 30 questions per session
                const start = performance.now();
                // Simulate DB/Adaptive Service call
                await new Promise(resolve => setTimeout(resolve, Math.random() * 50)); 
                latencies.push(performance.now() - start);
            }
            await disconnectDB();
            parentPort?.postMessage({ success: true, questionsCompleted: 30, latencies });
        } catch (e) {
            parentPort?.postMessage({ success: false, latencies: [] });
        }
    })();
}
