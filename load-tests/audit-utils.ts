import mongoose from 'mongoose';
import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';

import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

export const API_URL = process.env.API_URL || 'http://localhost:5000/api/v1';

export async function connectDB() {
    let mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
        mongoServer = await MongoMemoryServer.create();
        mongoUri = mongoServer.getUri();
    }

    if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(mongoUri);
    }
}

export async function disconnectDB() {
    if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
}

export function getRedisClient() {
    if (process.env.REDIS_URL) {
        return new Redis(process.env.REDIS_URL);
    }
    const RedisMock = require('ioredis-mock');
    return new RedisMock();
}

export function generateReport(results: any, name?: string) {
    const timestamp = Date.now();
    const jsonPath = path.join(__dirname, `audit-report-${timestamp}.json`);
    const mdPath = path.join(__dirname, `audit-report-${timestamp}.md`);

    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));

    const mdContent = `# Pillar Adaptive Exam System - Comprehensive Audit Report

**Report Generated:** ${new Date().toISOString()}

## Executive Summary
- **Total Tests:** ${results.summary.total}
- **Passed:** ${results.summary.passed} ✓
- **Failed:** ${results.summary.failed} ✗
- **Pass Rate:** ${results.summary.passRate}%
- **Status:** ${results.summary.failed === 0 ? '🟢 ALL SYSTEMS GO' : '🔴 ACTION REQUIRED'}

${results.tests.map((test: any) => `## ${test.passed ? '✓' : '✗'} ${test.name} — ${test.passed ? 'PASS' : 'FAIL'}
\`\`\`json
${JSON.stringify(test.metrics, null, 2)}
\`\`\`
`).join('\n')}
    `;
    fs.writeFileSync(mdPath, mdContent);
    console.log(`Reports generated:\n- ${jsonPath}\n- ${mdPath}`);
}
