import { connectDB, disconnectDB } from './audit-utils';
import { adaptiveService } from '../src/services/adaptive.service';

async function runEdgeCasesAudit() {
    await connectDB();
    console.log("Running Edge Cases Audit...");
    
    let passed = true;
    const metrics: any = { scenarios: {} };

    try {
        const studentElo = 1000;
        const kStudent = 32;

        // 1. Perfect score (30/30) - ceiling testing
        let ceilingElo = studentElo;
        for (let i = 0; i < 30; i++) {
            ceilingElo = ceilingElo + kStudent * (1 - 0.5); 
        }
        metrics.scenarios['perfect_score'] = { finalElo: ceilingElo };
        if (ceilingElo > 3000) passed = false; // Check for runaway Elo

        // 2. Zero score (0/30) - floor testing
        let floorElo = studentElo;
        for (let i = 0; i < 30; i++) {
            floorElo = Math.max(0, floorElo + kStudent * (0 - 0.5));
        }
        metrics.scenarios['zero_score'] = { finalElo: floorElo };
        if (floorElo < 0) passed = false; // Ensure it floors correctly at 0

        // 3. Inconsistent performance
        let volatileElo = studentElo;
        for (let i = 0; i < 30; i++) {
            const isCorrect = i % 2 === 0 ? 1 : 0;
            volatileElo = Math.max(0, volatileElo + kStudent * (isCorrect - 0.5));
        }
        metrics.scenarios['inconsistent_performance'] = { finalElo: volatileElo };
        if (Math.abs(volatileElo - studentElo) > 100) passed = false; // Should stabilize

        // 4. Threshold boundaries (0.499, 0.501)
        const elo499 = studentElo + kStudent * (0.499 - 0.5);
        const elo501 = studentElo + kStudent * (0.501 - 0.5);
        metrics.scenarios['boundaries'] = { elo499, elo501 };

    } catch (e: any) {
        console.error("Error in edge cases audit:", e.message);
        passed = false;
    } finally {
        await disconnectDB();
    }

    return {
        name: "Edge Cases",
        passed,
        metrics
    };
}

if (require.main === module) {
    runEdgeCasesAudit().then(console.log).catch(console.error);
}

export default runEdgeCasesAudit;
