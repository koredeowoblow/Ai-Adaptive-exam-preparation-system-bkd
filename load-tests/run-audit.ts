import { generateReport } from './audit-utils';
import runAdaptationAudit from './audit-adaptation-logic';
import runEdgeCasesAudit from './audit-edge-cases';
import runScoringIntegrityAudit from './audit-scoring-integrity';
import runPayloadCacheAudit from './audit-payload-cache';
const runConcurrencyAudit = require('./audit-concurrency'); // because it uses module.exports due to worker_threads

async function main() {
    console.log("Starting Full Audit Suite...");
    
    const results: any = {
        timestamp: new Date().toISOString(),
        summary: {
            total: 5,
            passed: 0,
            failed: 0,
            passRate: '0.0'
        },
        tests: []
    };

    try {
        const t1 = await runAdaptationAudit();
        results.tests.push(t1);

        const t2 = await runEdgeCasesAudit();
        results.tests.push(t2);

        const t3 = await runScoringIntegrityAudit();
        results.tests.push(t3);

        const t4 = await runPayloadCacheAudit();
        results.tests.push(t4);

        const t5 = await runConcurrencyAudit();
        results.tests.push(t5);

    } catch (e: any) {
        console.error("Audit suite encountered a fatal error:", e.message);
    }

    results.summary.passed = results.tests.filter((t: any) => t.passed).length;
    results.summary.failed = results.tests.filter((t: any) => !t.passed).length;
    results.summary.total = results.tests.length;
    results.summary.passRate = ((results.summary.passed / results.summary.total) * 100).toFixed(1);

    generateReport(results);
    console.log(`Audit Complete. Pass Rate: ${results.summary.passRate}%`);
    process.exit(results.summary.failed > 0 ? 1 : 0);
}

if (require.main === module) {
    main();
}
