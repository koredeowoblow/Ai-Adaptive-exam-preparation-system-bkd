import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import mongoose from "mongoose";
import { logger } from "../utils/logger";
import { connectDatabase } from "../config/db";
import { departmentController } from "../controllers/department.controller";
import { courseController } from "../controllers/course.controller";
import { topicController } from "../controllers/topic.controller";
import { questionController } from "../controllers/question.controller";
import { authController } from "../controllers/auth.controller";
import { practiceController } from "../controllers/practice.controller";
import { integrityController } from "../controllers/integrity.controller";
import { Achievement } from "../models/achievement.model";
import { Role } from "../models/role.model";
import { Student } from "../models/student.model";
import { Request, Response } from "express";
import { cacheService } from "../utils/cache";
import { redisClient } from "../config/redis";
import { lasustechSeedData } from "./lasustech-data";

// Mock Express Request and Response
const mockReq = (user: any, body: any = {}, params: any = {}): any => ({
  user,
  body,
  params,
  query: {},
  headers: {},
});

class MockRes {
  statusCode: number = 200;
  responseData: any = null;

  status(code: number) {
    this.statusCode = code;
    return this;
  }

  json(data: any) {
    this.responseData = data;
    return this;
  }
}

async function seed() {
  try {
    logger.info("Connecting to MongoDB...");
    await connectDatabase();
    logger.info("Connected to MongoDB");

    // Clear existing collections
    logger.info("Clearing old data...");
    await mongoose.connection.db?.dropDatabase();
    logger.info("Database dropped for a fresh seed.");

    try {
      if (redisClient.status !== 'ready') {
        await redisClient.connect().catch(() => { });
      }
      await redisClient.flushdb();
      logger.info("Flushed Redis cache for a fresh seed.");
    } catch {
      await cacheService.deleteByPattern('*').catch(() => { });
    }

    // 1. Base Achievements
    logger.info("--- SEEDING BASE ACHIEVEMENTS ---");
    await Achievement.create([
      {
        name: "First Steps",
        description: "Complete your first practice session.",
        icon: "star",
        requirement: "Complete 1 session",
      },
      {
        name: "On Fire",
        description: "Achieve a 3-day streak.",
        icon: "flame",
        requirement: "3 day streak",
      },
      {
        name: "Subject Master",
        description: "Reach 80% mastery in a topic.",
        icon: "crown",
        requirement: "80% mastery",
      },
    ]);
    logger.info("Seeded base achievements.");

    // 2. Base Admin Roles
    logger.info("--- SEEDING ADMIN ROLE ---");
    const adminRole = await Role.create({
      name: "Administrator",
      slug: "admin",
      description: "System administrator with full access",
      isSystem: true,
      permissionIds: [],
    });

    // 3. Admin User
    logger.info("--- SEEDING ADMIN USER ---");
    const adminAuthRes = new MockRes();
    await authController.register(
      mockReq(null, {
        email: "admin@eduadapt.com",
        password: "AdminPassword123!",
        name: "System Administrator",
      }) as Request,
      adminAuthRes as unknown as Response,
    );
    const admin = adminAuthRes.responseData?.data?.user;
    if (!admin) throw new Error("Failed to create admin user");

    // Assign Admin Role manually
    await Student.findByIdAndUpdate(admin.id, {
      $push: { roleIds: adminRole._id },
    });
    logger.info(`Registered Admin User: ${admin.email}`);

    const adminActor = { id: admin.id };

    // 4. Normal Student User
    logger.info("--- SEEDING STUDENT USER ---");
    const studentAuthRes = new MockRes();
    await authController.register(
      mockReq(null, {
        email: "student@eduadapt.com",
        password: "StudentPassword123!",
        name: "Demo Student",
      }) as Request,
      studentAuthRes as unknown as Response,
    );
    const student = studentAuthRes.responseData?.data?.user;
    if (!student) throw new Error("Failed to create student user");
    logger.info(`Registered Student User: ${student.email}`);

    const studentActor = { id: student.id };

    // 5. Authentic LASUSTECH Departments, Courses by Level, Topics, and Questions
    logger.info("--- SEEDING AUTHENTIC LASUSTECH DEPARTMENTS & LEVEL COURSES ---");

    const seedData = lasustechSeedData;
    const createdDepartments: any = {};
    const createdCourses: any = {};

    for (const dData of seedData) {
      const res = new MockRes();
      await departmentController.create(
        mockReq(adminActor, { name: dData.dept, description: dData.desc, createdBy: adminActor.id }) as Request,
        res as unknown as Response,
      );
      const dept = res.responseData?.data;
      createdDepartments[dept.name] = dept;
      logger.info(`Created Department: ${dept.name} (${dData.faculty})`);

      for (const cData of dData.courses) {
        const cRes = new MockRes();
        await courseController.create(
          mockReq(adminActor, {
            title: cData.title,
            code: cData.code,
            departmentId: dept._id,
            description: `${cData.title} curriculum for ${cData.level} Level students at LASUSTECH`,
            level: cData.level,
            topics: cData.qs.map((q: any) => q.q.split(' ').slice(0, 3).join(' ')),
            createdBy: adminActor.id,
          }) as Request,
          cRes as unknown as Response,
        );
        const course = cRes.responseData?.data;
        if (!createdCourses[dept.name]) {
          createdCourses[dept.name] = [];
        }
        createdCourses[dept.name].push(course);
        logger.info(`  [${cData.level}L] Created Course: ${course.code} - ${course.title}`);

        // Create Topic
        const topicRes = new MockRes();
        await topicController.create(
          mockReq(adminActor, {
            name: `Fundamentals of ${course.title}`,
            courseId: course._id,
            order: 1,
            createdBy: adminActor.id,
          }) as Request,
          topicRes as unknown as Response,
        );
        const topic = topicRes.responseData?.data;

        // Seed unique Questions using real templates
        logger.info(`Seeding ${cData.qs.length} unique questions for ${course.title}...`);
        for (let i = 0; i < cData.qs.length; i++) {
          const qTemplate = cData.qs[i];
          const isTheory = !qTemplate.a || i % 4 === 3; // Theory template or 1 out of 4
          const qRes = new MockRes();
          const questionData: any = {
            topicId: topic._id,
            questionText: qTemplate.q,
            explanation: qTemplate.exp,
            explanationSource: "manual",
            eloRating: 1000 + Math.floor(Math.random() * 800), // Random elo 1000-1800
            createdBy: adminActor.id,
          };

          if (isTheory) {
            questionData.type = "THEORY";
            questionData.modelAnswer = "This is a detailed model answer for the concept: " + qTemplate.exp;
            questionData.rubric = [
              { point: "Identifies core concept", weight: 0.5 },
              { point: "Provides accurate reasoning", weight: 0.5 }
            ];
          } else {
            questionData.type = "MULTIPLE_CHOICE";
            questionData.options = [
              { id: "A", text: qTemplate.a },
              { id: "B", text: qTemplate.b },
              { id: "C", text: qTemplate.c },
              { id: "D", text: qTemplate.d },
            ];
            questionData.correctAnswer = qTemplate.ans;
          }

          await questionController.create(
            mockReq(adminActor, questionData) as Request,
            qRes as unknown as Response,
          );
        }
        logger.info(`Successfully seeded ${cData.qs.length} unique questions for ${course.title}`);
      }
    }

    // Assign Computer Science department and courses to demo student, mark isOnboarded: true
    const csDept = createdDepartments["Computer Science"];
    const csCourseIds = (createdCourses["Computer Science"] || []).map((c: any) => c._id);
    if (csDept && student) {
      await Student.findByIdAndUpdate(student.id, {
        departmentId: csDept._id,
        level: '100L',
        isOnboarded: true,
        $addToSet: { enrolledCourseIds: { $each: csCourseIds } }
      });
      logger.info(`Assigned demo student to ${csDept.name} with ${csCourseIds.length} courses (isOnboarded: true).`);
    }

    logger.info("Seeding completed successfully!");

  } catch (error) {
    logger.error("Error during seeding:", error);
    process.exit(1);
  } finally {
    try {
      if (redisClient && typeof redisClient.disconnect === 'function') {
        redisClient.disconnect();
      }
    } catch (_) { }
    await mongoose.disconnect();
    process.exit(0);
  }
}

if (require.main === module) {
  seed();
}

