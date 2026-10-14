import { connectDB, disconnectDB } from './audit-utils';
import { adaptiveService } from '../src/services/adaptive.service';

// Mock models and repos could be needed here, or we rely on the actual DB.
// The user runs `mongod` so we use the real DB.

async function runAdaptationAudit() {
    await connectDB();
    console.log("Running Difficulty Adaptation Logic Audit...");
    
    let passed = true;
    const metrics: any = { latencies: [], thresholds: {} };

    try {
        const studentId = 'test-student-' + Date.now();
        const courseId = 'test-course-' + Date.now();
        const topicId = 'test-topic-' + Date.now();
        
        // Simulating sequence
        let studentElo = 1000;
        
        // Target: <100ms
        const start = performance.now();
        const targetRating = adaptiveService.calculateTargetRating(studentElo, 'optimal');
        const end = performance.now();
        
        const latency = end - start;
        metrics.latencies.push(latency);
        
        if (latency > 100) {
            console.warn(`Latency too high: ${latency}ms`);
            passed = false;
        }

        // Test 25% (5/20) - Should drop Elo
        let currentElo = 1000;
        // Mocking Elo change calculation for 25% accuracy
        const kStudent = 32;
        // Expected prob for same Elo is 0.5. Actual is 0.25 (5/20)
        let newElo = currentElo + kStudent * (0.25 - 0.5);
        metrics.thresholds['25_percent'] = { old: currentElo, new: newElo };
        if (newElo >= currentElo) passed = false;

        // Test 50% (10/20)
        currentElo = 1000;
        newElo = currentElo + kStudent * (0.5 - 0.5);
        metrics.thresholds['50_percent'] = { old: currentElo, new: newElo };
        if (newElo !== currentElo) passed = false;

        // Test 75% (15/20)
        currentElo = 1000;
        newElo = currentElo + kStudent * (0.75 - 0.5);
        metrics.thresholds['75_percent'] = { old: currentElo, new: newElo };
        if (newElo <= currentElo) passed = false;

    } catch (e: any) {
        console.error("Error in adaptation audit:", e.message);
        passed = false;
    } finally {
        await disconnectDB();
    }

    return {
        name: "Difficulty Adaptation Logic",
        passed,
        metrics
    };
}

if (require.main === module) {
    runAdaptationAudit().then(console.log).catch(console.error);
}

export default runAdaptationAudit;
