import mongoose from "mongoose";
import { connectDatabase } from "../src/config/db";
import { Student } from "../src/models/student.model";
import jwt from "jsonwebtoken";
import { env } from "../src/config/env";
import fs from "fs";
import path from "path";
import { logger } from "../src/utils/logger";

async function generateTokens() {
  try {
    logger.info("Connecting to MongoDB...");
    await connectDatabase();
    logger.info("Connected to MongoDB");

    logger.info("Fetching seeded test students...");
    const students = await Student.find({ email: /@loadtest\.com$/ }).limit(50);
    
    if (students.length === 0) {
      logger.error("No test students found. Have you run 'npm run seed:load-test'?");
      process.exit(1);
    }

    logger.info(`Found ${students.length} test students. Generating tokens...`);
    
    let csvContent = "email,token\n";
    
    for (const student of students) {
      const token = jwt.sign({ id: student.id, type: 'student' }, env.JWT_SECRET, {
        expiresIn: '1h',
      });
      csvContent += `${student.email},${token}\n`;
    }

    const outputPath = path.join(__dirname, "tokens.csv");
    fs.writeFileSync(outputPath, csvContent);
    
    logger.info(`✅ Successfully generated tokens and saved to ${outputPath}`);
    process.exit(0);
  } catch (error) {
    logger.error("Token generation failed", error);
    process.exit(1);
  }
}

generateTokens();
