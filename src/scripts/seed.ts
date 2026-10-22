import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import dotenv from 'dotenv';
dotenv.config();

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
import { getExpandedQuestionsForCourse } from "./seed-expansions";
import { SeedDiagrams } from "./seed-diagrams";

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

  cookie(name: string, val: string, options?: any) {
    return this;
  }
}

export async function seed() {
  if (process.env.NODE_ENV === 'production') {
    logger.error("Refusing to run seed script in production environment.");
    throw new Error("Refusing to run seed script in production environment.");
  }

  const adminPassword = process.env.DEMO_ADMIN_PASSWORD;
  const studentPassword = process.env.DEMO_STUDENT_PASSWORD;

  if (!adminPassword || !studentPassword) {
    logger.error("Refusing to seed: DEMO_ADMIN_PASSWORD and DEMO_STUDENT_PASSWORD environment variables must be configured.");
    throw new Error("DEMO_ADMIN_PASSWORD and DEMO_STUDENT_PASSWORD environment variables must be configured.");
  }

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
        password: adminPassword,
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
        password: studentPassword,
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

        // Seed unique Questions using dedicated CS banks and expanded course pools
        const questionsToSeed = getExpandedQuestionsForCourse(cData);

        logger.info(`Seeding ${questionsToSeed.length} unique questions for ${course.title}...`);
        for (let i = 0; i < questionsToSeed.length; i++) {
          const qTemplate = questionsToSeed[i];
          const isExplicitTheory = qTemplate.type === "THEORY" || qTemplate.hasSubParts;
          const isTheory = isExplicitTheory || !qTemplate.a || i % 4 === 3; // Theory template or 1 out of 4
          const qRes = new MockRes();
          const questionData: any = {
            topicId: topic._id,
            questionText: qTemplate.q,
            explanation: qTemplate.exp,
            explanationSource: "manual",
            eloRating: 1000 + Math.floor(Math.random() * 800), // Random elo 1000-1800
            createdBy: adminActor.id,
            diagramUrl: qTemplate.diagramUrl,
            diagramCaption: qTemplate.diagramCaption,
          };

          if (isTheory) {
            questionData.type = "THEORY";
            if (qTemplate.hasSubParts && qTemplate.subParts && qTemplate.subParts.length > 0) {
              questionData.hasSubParts = true;
              questionData.subParts = qTemplate.subParts;
              questionData.diagramUrl = qTemplate.diagramUrl || questionData.diagramUrl;
              questionData.diagramCaption = qTemplate.diagramCaption || questionData.diagramCaption;
            } else if (i % 4 === 3) {
              questionData.hasSubParts = true;
              const concept = qTemplate.q.replace(/^(Regarding|True or False|\(?Theory Analysis[^\]]*\)?|\s*\[[^\]]+\])\s*/i, '').replace(/\?$/, '').trim();

              if (i % 8 === 3) {
                // Style 1: 1a, ai, aii, aiii, 1b, bi, bii, 1c with diagram
                questionData.diagramUrl = questionData.diagramUrl || SeedDiagrams.fullAdderCircuit;
                questionData.diagramCaption = questionData.diagramCaption || `Figure 1.1: Functional schematic and system architecture for ${concept.slice(0, 45)}`;
                questionData.subParts = [
                  {
                    id: "part-1a",
                    label: "1a",
                    prompt: `State the theoretical principles, operational axioms, and mathematical foundations of ${concept}.`,
                    maxMarks: 4,
                    modelAnswer: `Fundamental definition and properties: ${qTemplate.exp}`,
                    rubric: [
                      { point: "Accurate statement of core definition and axioms", weight: 2 },
                      { point: "Mathematical and theoretical formulation", weight: 2 }
                    ],
                    order: 1
                  },
                  {
                    id: "part-ai",
                    label: "ai",
                    prompt: `Derive the governing equations and evaluate how intermediate state transitions affect performance under nominal conditions.`,
                    maxMarks: 3,
                    modelAnswer: `Step-by-step derivation: Operating characteristics derive directly from ${qTemplate.exp}`,
                    rubric: [
                      { point: "Proper derivation steps and algebraic formulations", weight: 1.5 },
                      { point: "Evaluation of nominal operating conditions", weight: 1.5 }
                    ],
                    order: 2
                  },
                  {
                    id: "part-aii",
                    label: "aii",
                    prompt: `Identify the critical path latency and compute the asymptotic time/resource bounds for this system.`,
                    maxMarks: 3,
                    modelAnswer: `Asymptotic complexity analysis: Resource bounds conform to standard theoretical constraints established in: ${qTemplate.exp}`,
                    rubric: [
                      { point: "Correct asymptotic bounds specification", weight: 1.5 },
                      { point: "Justification of critical path latency", weight: 1.5 }
                    ],
                    order: 3
                  },
                  {
                    id: "part-aiii",
                    label: "aiii",
                    prompt: `Analyze failure modes, race conditions, or edge cases that arise when boundary inputs are supplied.`,
                    maxMarks: 4,
                    modelAnswer: `Edge-case analysis: When boundary extremes occur, safety invariants must be preserved as detailed in: ${qTemplate.exp}`,
                    rubric: [
                      { point: "Identification of boundary condition edge cases", weight: 2 },
                      { point: "Analysis of system stability and recovery", weight: 2 }
                    ],
                    order: 4
                  },
                  {
                    id: "part-1b",
                    label: "1b",
                    prompt: `Refer to the provided schematic diagram. Discuss how the internal subsystem interconnects coordinate execution.`,
                    diagramUrl: SeedDiagrams.timingWaveform,
                    diagramCaption: `Figure 1.2: Waveform propagation and timing characteristics`,
                    maxMarks: 4,
                    modelAnswer: `Architectural coordination: Interconnect signals synchronize data flow between functional stages: ${qTemplate.exp}`,
                    rubric: [
                      { point: "Interpretation of schematic subsystem connections", weight: 2 },
                      { point: "Correlation between diagram components and runtime behavior", weight: 2 }
                    ],
                    order: 5
                  },
                  {
                    id: "part-bi",
                    label: "bi",
                    prompt: `Formulate a practical implementation optimization to reduce computational or memory overhead by at least 25%.`,
                    maxMarks: 4,
                    modelAnswer: `Optimization strategy: Implementing pipelined caching or pruned representation based on: ${qTemplate.exp}`,
                    rubric: [
                      { point: "Sound technical optimization mechanism", weight: 2 },
                      { point: "Quantifiable reduction in computational or space overhead", weight: 2 }
                    ],
                    order: 6
                  },
                  {
                    id: "part-bii",
                    label: "bii",
                    prompt: `Propose an error detection and mitigation scheme to maintain integrity across high-concurrency workloads.`,
                    maxMarks: 4,
                    modelAnswer: `Concurrency mitigation: Transactional locks, idempotent tokens, or atomic compare-and-swap primitives guarantee consistency.`,
                    rubric: [
                      { point: "Feasible fault-tolerant mitigation design", weight: 2 },
                      { point: "Guarantees under high concurrency or packet loss", weight: 2 }
                    ],
                    order: 7
                  },
                  {
                    id: "part-1c",
                    label: "1c",
                    prompt: `Synthesize industrial best practices and modern architectural trade-offs when deploying this solution at scale.`,
                    maxMarks: 4,
                    modelAnswer: `Industrial synthesis: Distributed scalability requires horizontal partitioning, telemetry logging, and automated failover.`,
                    rubric: [
                      { point: "Articulation of real-world scalability trade-offs", weight: 2 },
                      { point: "Comprehensive conclusion adhering to engineering standards", weight: 2 }
                    ],
                    order: 8
                  }
                ];
              } else {
                // Style 2: 1(a), 1(a)(i), 1(a)(ii), 1(a)(iii), 1(b)(i), 1(b)(ii), 1(b)(iii), 1(c) with diagram
                questionData.diagramUrl = questionData.diagramUrl || SeedDiagrams.cpuPipeline;
                questionData.diagramCaption = questionData.diagramCaption || `Figure 2.1: Structural topology and data flow pipeline for ${concept.slice(0, 45)}`;
                questionData.subParts = [
                  {
                    id: "part-1a",
                    label: "1(a)",
                    prompt: `Provide a rigorous theoretical overview and state the primary operational taxonomy of ${concept}.`,
                    maxMarks: 4,
                    modelAnswer: `Taxonomy and definition: ${qTemplate.exp}`,
                    rubric: [
                      { point: "Comprehensive theoretical overview", weight: 2 },
                      { point: "Correct taxonomic classification and terminology", weight: 2 }
                    ],
                    order: 1
                  },
                  {
                    id: "part-1a-i",
                    label: "1(a)(i)",
                    prompt: `Formulate the mathematical or formal logic relations governing state changes in this model.`,
                    maxMarks: 3,
                    modelAnswer: `Formal state model: Based on ${qTemplate.exp}`,
                    rubric: [
                      { point: "Formal mathematical or logic notation", weight: 1.5 },
                      { point: "Accurate state transition rules", weight: 1.5 }
                    ],
                    order: 2
                  },
                  {
                    id: "part-1a-ii",
                    label: "1(a)(ii)",
                    prompt: `Evaluate algorithmic complexity and memory utilization under worst-case input permutations.`,
                    maxMarks: 3,
                    modelAnswer: `Worst-case complexity: Evaluated from foundational theorems in ${qTemplate.exp}`,
                    rubric: [
                      { point: "Accurate worst-case Big-O time complexity", weight: 1.5 },
                      { point: "Memory footprint and space bounds analysis", weight: 1.5 }
                    ],
                    order: 3
                  },
                  {
                    id: "part-1a-iii",
                    label: "1(a)(iii)",
                    prompt: `Identify key failure conditions or data inconsistencies that occur if synchronization invariants are violated.`,
                    maxMarks: 4,
                    modelAnswer: `Invariant violations: Race conditions or deadlock emerge if mutual exclusion or atomic commit fails: ${qTemplate.exp}`,
                    rubric: [
                      { point: "Accurate identification of synchronization breakdown", weight: 2 },
                      { point: "Impact on data integrity and consistency", weight: 2 }
                    ],
                    order: 4
                  },
                  {
                    id: "part-1b-i",
                    label: "1(b)(i)",
                    prompt: `Refer to the pipeline and architecture diagram. Trace how an incoming data token progresses through each sequential stage.`,
                    maxMarks: 4,
                    modelAnswer: `Pipeline trace: The token is fetched, decoded, executed, checked against memory, and retired according to the stage flow.`,
                    rubric: [
                      { point: "Clear stage-by-stage data traversal explanation", weight: 2 },
                      { point: "Reference to architectural diagram components", weight: 2 }
                    ],
                    order: 5
                  },
                  {
                    id: "part-1b-ii",
                    label: "1(b)(ii)",
                    prompt: `Propose an architectural refactoring to eliminate pipeline stall bubbles or structural bottlenecks.`,
                    maxMarks: 4,
                    modelAnswer: `Bypass forwarding or multi-port buffering eliminates stalls: ${qTemplate.exp}`,
                    rubric: [
                      { point: "Viable architectural refactoring solution", weight: 2 },
                      { point: "Elimination of stall cycles or resource contention", weight: 2 }
                    ],
                    order: 6
                  },
                  {
                    id: "part-1b-iii",
                    label: "1(b)(iii)",
                    prompt: `Evaluate the trade-off between increased hardware complexity (area and power) versus execution speedup.`,
                    maxMarks: 4,
                    modelAnswer: `Cost-benefit evaluation: Additional bypass multiplexers increase silicon area and dynamic power consumption, which must be offset by sustained throughput gains.`,
                    rubric: [
                      { point: "Sound analysis of hardware area/power costs", weight: 2 },
                      { point: "Quantitative or qualitative throughput justification", weight: 2 }
                    ],
                    order: 7
                  },
                  {
                    id: "part-1c",
                    label: "1c",
                    prompt: `Summarize the broader impact of this technological design in modern distributed or mission-critical computing environments.`,
                    maxMarks: 4,
                    modelAnswer: `Broader synthesis: Provides the foundational reliability and low-latency response required in cloud computing and enterprise applications.`,
                    rubric: [
                      { point: "Contextualization within distributed/enterprise computing", weight: 2 },
                      { point: "Clear synthesis and concluding evaluation", weight: 2 }
                    ],
                    order: 8
                  }
                ];
              }
            } else {
              questionData.hasSubParts = false;
              questionData.modelAnswer = qTemplate.modelAnswer || ("This is a detailed model answer for the concept: " + qTemplate.exp);
              questionData.rubric = qTemplate.rubric || [
                { point: "Identifies core concept", weight: 0.5 },
                { point: "Provides accurate reasoning", weight: 0.5 }
              ];
            }
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
        logger.info(`Successfully seeded ${questionsToSeed.length} unique questions for ${course.title}`);
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

