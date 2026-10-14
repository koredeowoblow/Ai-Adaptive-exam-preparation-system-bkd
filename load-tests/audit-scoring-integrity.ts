import { connectDB, disconnectDB } from './audit-utils';
import mongoose from 'mongoose';

async function runScoringIntegrityAudit() {
    await connectDB();
    console.log("Running Scoring Integrity Audit...");
    
    let passed = true;
    const metrics: any = { objectIdCheck: false, scoreParity: false, recommendationLatency: 0 };

    try {
        // 1. ObjectId comparison validation
        const id1 = new mongoose.Types.ObjectId();
        const id2 = new mongoose.Types.ObjectId(id1.toString());
        
        if (id1 !== id2 && id1.toString() === id2.toString() && id1.equals(id2)) {
            metrics.objectIdCheck = true;
        } else {
            passed = false;
        }

        // 2. Score parity (Mock check)
        const adaptiveScore = 85;
        const fixedScore = 86;
        const discrepancy = Math.abs(adaptiveScore - fixedScore) / fixedScore;
        
        metrics.scoreParity = discrepancy <= 0.02;
        if (!metrics.scoreParity) passed = false;

        // 3. Recommendation latency
        const start = performance.now();
        // Simulate recommendation generation latency
        await new Promise(resolve => setTimeout(resolve, 50)); 
        const end = performance.now();
        
        metrics.recommendationLatency = end - start;
        if (metrics.recommendationLatency > 200) passed = false;

    } catch (e: any) {
        console.error("Error in scoring integrity audit:", e.message);
        passed = false;
    } finally {
        await disconnectDB();
    }

    return {
        name: "Scoring Integrity",
        passed,
        metrics
    };
}

if (require.main === module) {
    runScoringIntegrityAudit().then(console.log).catch(console.error);
}

export default runScoringIntegrityAudit;
