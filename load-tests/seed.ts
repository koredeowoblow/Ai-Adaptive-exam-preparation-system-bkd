import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import mongoose from "mongoose";
import { logger } from "../src/utils/logger";
import { connectDatabase } from "../src/config/db";
import { Achievement } from "../src/models/achievement.model";
import { Role } from "../src/models/role.model";
import { Student } from "../src/models/student.model";
import { Department } from "../src/models/department.model";
import { Course } from "../src/models/course.model";
import { Topic } from "../src/models/topic.model";
import { Question } from "../src/models/question.model";
import bcrypt from "bcrypt";

async function seedLoadTest() {
  try {
    logger.info("Connecting to MongoDB...");
    await connectDatabase();
    logger.info("Connected to MongoDB for load testing");

    // Optional: Only clear if you want a fresh run. We'll drop database here for consistency.
    logger.info("Clearing old data...");
    await mongoose.connection.db?.dropDatabase();
    try {
      const { redisClient } = require("../src/config/redis");
      if (redisClient.status !== 'ready') await redisClient.connect().catch(() => {});
      await redisClient.flushdb().catch(() => {});
    } catch {}

    // Base Role
    const defaultRole = await Role.create({
      name: "Student",
      slug: "student",
      description: "Default student role",
      isSystem: true,
      permissionIds: [],
    });

    // Create 50 students
    logger.info("Creating 50 test students...");
    const studentsToCreate = [];
    const passwordHash = await bcrypt.hash("password123!", 10);
    
    for (let i = 1; i <= 50; i++) {
      studentsToCreate.push({
        name: `Test Student ${i}`,
        email: `student${i}@loadtest.com`,
        passwordHash: passwordHash,
        roleIds: [defaultRole._id],
      });
    }
    const students = await Student.insertMany(studentsToCreate);

    // Create Admin Role
    const adminRole = await Role.create({
      name: "Admin",
      slug: "admin",
      description: "Admin role",
      isSystem: true,
      permissionIds: [],
    });

    // Create Admin user for createdBy fields
    const admin: any = await Student.create({
      name: "Admin User",
      email: "admin@loadtest.com",
      passwordHash: passwordHash,
      roleIds: [adminRole._id],
    });

    // Create Department
    const dept: any = await Department.create({
      name: "Load Test Department",
      description: "Department for load testing",
      createdBy: admin._id,
    });

    let course: any = await Course.findOne({ code: "LTC101" });
    if (!course) {
      course = await Course.create({
        _id: "64e8b3b4f3b4b4b4b4b4b4b4", // Deterministic ID for load test YAMLs
        departmentId: dept._id,
        title: "Load Test Course 101",
        code: "LTC101",
        description: "Course for load testing",
      });
    }

    // Assign students to department and course
    await Student.updateMany({}, { 
      $set: { 
        departmentId: dept._id, 
        enrolledCourseIds: [course._id] 
      } 
    });

    // Create Topics
    const topics = await Topic.insertMany([
      { courseId: course._id, name: "Topic A", description: "Topic A", order: 1 },
      { courseId: course._id, name: "Topic B", description: "Topic B", order: 2 },
      { courseId: course._id, name: "Topic C", description: "Topic C", order: 3 },
    ]);

    // Create 120 Questions (40 per topic, 30 MCQ, 10 Theory)
    logger.info("Creating 120 questions...");
    const questionsToCreate = [];
    let eloBase = 800;

    for (const topic of topics) {
      // 30 MCQs
      for (let i = 0; i < 30; i++) {
        questionsToCreate.push({
          topicId: topic._id,
          questionText: `Load Test MCQ Question ${i} for ${topic.name}`,
          type: "MULTIPLE_CHOICE",
          explanation: "This is a general explanation for the MCQ question.",
          options: [
            { id: "A", text: "Option A", explanation: "Correct!" },
            { id: "B", text: "Option B", explanation: "Wrong." },
            { id: "C", text: "Option C", explanation: "Wrong." },
            { id: "D", text: "Option D", explanation: "Wrong." },
          ],
          correctAnswer: "A",
          eloRating: eloBase + (i * 10), // Spread out elos
        });
      }
      
      // 10 Theory
      for (let i = 0; i < 10; i++) {
        questionsToCreate.push({
          topicId: topic._id,
          questionText: `Load Test Theory Question ${i} for ${topic.name}. Explain the concept.`,
          type: "THEORY",
          explanation: "This is the expected model answer for the theory question.",
          modelAnswer: "The concept relies on understanding the core principles.",
          rubric: [
            { criterion: "Clarity", weight: 0.5, point: 5 },
            { criterion: "Accuracy", weight: 0.5, point: 5 }
          ],
          eloRating: eloBase + 100 + (i * 10),
        });
      }
    }
    await Question.insertMany(questionsToCreate);
    
    // Seed Base Achievement
    await Achievement.create({
      name: "Load Test Achievement",
      description: "Complete a load test session.",
      icon: "star",
      requirement: "Complete 1 session",
    });

    logger.info("✅ Load test data seeded successfully!");
    logger.info("You can log in with student1@loadtest.com to student50@loadtest.com, password: password123!");
    process.exit(0);
  } catch (error) {
    logger.error("Seeding failed", error);
    process.exit(1);
  }
}

seedLoadTest();
