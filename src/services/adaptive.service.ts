import { masteryRepository } from "../repositories/mastery.repository";
import { questionRepository } from "../repositories/question.repository";
import { topicRepository } from "../repositories/topic.repository";
import { masteryService } from './mastery.service';
import { IMasteryRecordDocument } from "../types/mastery.types";
import { IQuestionDocument } from "../types/question.types";

export class AdaptiveService {

  /**
   * Entry point to process an answer and update Elos safely with bounded retries
   */
  async processAnswer(
    studentId: string,
    courseId: string,
    topicId: string,
    questionId: string,
    isCorrect: boolean,
  ) {
    try {
      // 1. Atomic counters for question statistics - always guaranteed (fire-and-forget safe)
      await this.updateQuestionStatistics(questionId, isCorrect).catch((err) => {
        console.warn(`[ELO_WARN] Failed to update question statistics for ${questionId}:`, err);
      });

      // 2. Unconditional atomic update of answer counters on MasteryRecord
      //    These MUST succeed regardless of Elo contention. Separated from the Elo CAS loop.
      const masteryRecord = await masteryService.getOrCreateRecord(studentId, courseId, topicId);
      if (!masteryRecord) {
        console.warn(`[ELO_WARN] Mastery record not found for student ${studentId}, topic ${topicId}. Skipping Elo.`);
        return;
      }

      await this.incrementAnswerCounters(masteryRecord._id.toString(), isCorrect).catch((err) => {
        console.warn(`[ELO_WARN] Failed to increment mastery counters:`, err);
      });

      // 3. Elo Conditional Updates - bounded to 3 retries with exponential backoff
      const MAX_RETRIES = 3;
      let masteryDone = false;
      let questionDone = false;

      // Tracking masteryDone and questionDone independently ensures that if 
      // one operation succeeds while the other fails (due to contention), we do not 
      // re-calculate and re-apply a delta against an already-updated value.
      for (let i = 0; i < MAX_RETRIES; i++) {
        // Re-read current state to ensure fresh Elo
        const freshRecord = await masteryService.getOrCreateRecord(studentId, courseId, topicId);
        if (!freshRecord) continue;
        const question = await questionRepository.findByIdDirect(questionId);

        if (!question) {
          console.warn(`[ELO_WARN] Question ${questionId} not found during Elo calculation. Skipping.`);
          return;
        }

        const expectedProb = this.calculateExpectedProbability(
          freshRecord.eloRating,
          question.eloRating,
        );

        const kStudent = freshRecord.confidence < 0.3 ? 64 : 32;
        const kQuestion = question.exposureCount < 20 ? 64 : 16;
        const actualResult = isCorrect ? 1 : 0;

        if (!masteryDone) {
          const newStudentElo = this.calculateEloChange(
            freshRecord.eloRating,
            expectedProb,
            actualResult,
            kStudent,
          );
          masteryDone = await this.updateStudentEloConditionally(freshRecord, newStudentElo);
        }

        if (!questionDone) {
          const newQuestionElo = this.calculateEloChange(
            question.eloRating,
            1 - expectedProb,
            1 - actualResult,
            kQuestion,
          );
          questionDone = await this.updateQuestionEloConditionally(question, newQuestionElo);
        }

        if (masteryDone && questionDone) {
          return; // Both Elo updates succeeded
        }

        // Contention detected. Exponential backoff with jitter before retrying
        const backoff = Math.min(10 * Math.pow(2, i), 100);
        await new Promise((resolve) =>
          setTimeout(resolve, backoff + Math.random() * 20),
        );
      }

      // Elo collided after MAX_RETRIES (3). Skip update and log it gracefully.
      console.warn(
        `[ELO_CONTENTION_WARN] Failed to update Elo completely for student ${studentId} after ${MAX_RETRIES} retries. Mastery updated: ${masteryDone}, Question updated: ${questionDone}. Skipping update.`,
      );
    } catch (err) {
      // Never fail the student's request because of an Elo update
      console.warn(`[ELO_UPDATE_ERROR] Non-fatal error during Elo calculation for question ${questionId}:`, err);
    }
  }

  /**
   * Processes a batch of answers simultaneously.
   * Calculates Elo changes based on the student's initial Elo rating for the batch.
   */
  async processBatchAnswers(
    studentId: string,
    courseId: string,
    answers: { topicId: string; questionId: string; isCorrect: boolean }[],
  ) {
    if (answers.length === 0) return;

    try {
      // 1. Fetch all involved questions
      const questionIds = answers.map((a) => a.questionId);
      const questions = await questionRepository.findManyByIds(questionIds);
      const questionMap = new Map(questions.map((q: any) => [q._id.toString(), q]));

      // 2. Fetch all involved mastery records (topics)
      const topicIds = Array.from(new Set(answers.map((a) => a.topicId)));
      const masteryRecords = await Promise.all(
        topicIds.map((topicId) => masteryService.getOrCreateRecord(studentId, courseId, topicId))
      );
      const masteryMap = new Map(masteryRecords.map((m: any) => [m.topicId._id.toString(), m]));

      // 3. Accumulate changes
      const masteryUpdates = new Map<string, any>(); // topicId -> changes
      const questionUpdates = new Map<string, any>(); // questionId -> changes

      for (const ans of answers) {
        const q: any = questionMap.get(ans.questionId);
        const m: any = masteryMap.get(ans.topicId);

        if (!q || !m) continue;

        // Question stats increment
        let qStats = questionUpdates.get(ans.questionId) || { timesAnswered: 0, exposureCount: 0, timesCorrect: 0, eloDelta: 0 };
        qStats.timesAnswered++;
        qStats.exposureCount++;
        if (ans.isCorrect) qStats.timesCorrect++;

        // Mastery stats increment
        let mStats = masteryUpdates.get(ans.topicId) || { questionsAttempted: 0, questionsCorrect: 0, eloDelta: 0, recentAnswers: [] };
        mStats.questionsAttempted++;
        if (ans.isCorrect) mStats.questionsCorrect++;
        mStats.recentAnswers.push(ans.isCorrect);

        // Elo Math
        const expectedProb = this.calculateExpectedProbability(m.eloRating, q.eloRating);
        const kStudent = m.confidence < 0.3 ? 64 : 32;
        const kQuestion = q.exposureCount < 20 ? 64 : 16;
        const actualResult = ans.isCorrect ? 1 : 0;

        const studentEloDelta = kStudent * (actualResult - expectedProb);
        const questionEloDelta = kQuestion * ((1 - actualResult) - (1 - expectedProb));

        mStats.eloDelta += studentEloDelta;
        qStats.eloDelta += questionEloDelta;

        questionUpdates.set(ans.questionId, qStats);
        masteryUpdates.set(ans.topicId, mStats);
      }

      // 4. Execute Bulk Writes
      const questionBulkOps = Array.from(questionUpdates.entries()).map(([qId, stats]) => ({
        updateOne: {
          filter: { _id: qId },
          update: {
            $inc: {
              timesAnswered: stats.timesAnswered,
              exposureCount: stats.exposureCount,
              timesCorrect: stats.timesCorrect,
              eloRating: stats.eloDelta,
            },
          },
        },
      }));

      if (questionBulkOps.length > 0) {
        await questionRepository.bulkUpdateStats(questionBulkOps);
      }

      const masteryBulkOps = Array.from(masteryUpdates.entries()).map(([tId, stats]) => {
        const m: any = masteryMap.get(tId);
        const newConfidence = this.calculateConfidence(m.questionsAttempted + stats.questionsAttempted);
        return {
          updateOne: {
            filter: { _id: m._id },
            update: {
              $inc: {
                questionsAttempted: stats.questionsAttempted,
                questionsCorrect: stats.questionsCorrect,
                eloRating: stats.eloDelta,
              },
              $set: {
                lastAttemptedAt: new Date(),
                confidence: newConfidence,
              },
              $push: {
                recentAnswers: { $each: stats.recentAnswers, $slice: -10 },
              },
            },
          },
        };
      });

      if (masteryBulkOps.length > 0) {
        await masteryRepository.bulkUpdateStats(masteryBulkOps);
      }
    } catch (err) {
      console.warn(`[ELO_BATCH_ERROR] Non-fatal error during batch Elo calculation for student ${studentId}:`, err);
    }
  }

  // --- INTERNAL ORCHESTRATION ---

  async getStudentTopicRatings(studentId: string, courseId: string) {
    const masteryRecords = await masteryRepository.findByStudentAndCourse(
      studentId,
      courseId,
    );
    const allCourseTopics = await topicRepository.findByCourseId(courseId);

    const mapped = allCourseTopics.map((topic: any) => {
      const record = masteryRecords.find(
        (r) => r.topicId._id.toString() === topic._id.toString(),
      );
      if (record) {
        return {
          topicId: topic._id.toString(),
          eloRating: record.eloRating,
          confidence: record.confidence,
          lastAttemptedAt: record.lastAttemptedAt,
        };
      }
      return {
        topicId: topic._id.toString(),
        eloRating: 1000, // Baseline Elo for unstarted
        confidence: 0,
        lastAttemptedAt: new Date(0), // Never attempted
      };
    });

    return mapped;
  }

  selectPriorityTopic(ratings: any[]) {
    // Priority = weakness + uncertainty + timeSinceLastPractice
    let maxPriority = -Infinity;
    let selected = ratings[0];

    const now = Date.now();

    for (const r of ratings) {
      const weakness = Math.max(2000 - r.eloRating, 0); // lower Elo = higher weakness score
      const uncertainty = (1 - r.confidence) * 500; // max 500 points for uncertainty

      const hoursSinceLast =
        (now - new Date(r.lastAttemptedAt).getTime()) / (1000 * 60 * 60);
      const timeFactor = Math.min(hoursSinceLast * 10, 300); // Caps at 300 points

      const priority = weakness + uncertainty + timeFactor;

      if (priority > maxPriority) {
        maxPriority = priority;
        selected = r;
      }
    }

    return selected;
  }

  determineExploration(): "optimal" | "above" | "explore" {
    const rand = Math.random();
    if (rand < 0.7) return "optimal";
    if (rand < 0.9) return "above";
    return "explore";
  }

  calculateTargetRating(studentElo: number, strategy: string): number {
    switch (strategy) {
      case "above":
        return studentElo + 150; // Slightly harder
      case "explore":
        return studentElo + (Math.random() * 600 - 300); // Curveball (-300 to +300)
      case "optimal":
      default:
        return studentElo; // Exact match for 50% probability
    }
  }


  /**
   * Selects a batch of questions for a session topic, respecting separate MCQ and theory limits.
   *
   * @param objectiveLimit - Number of MULTIPLE_CHOICE questions to fetch (Elo-optimal).
   * @param theoryLimit    - Number of THEORY questions to fetch (Elo-optimal).
   *
   * The two halves are merged and shuffled after selection so their order isn't predictable.
   * The Elo-based selection logic inside findManyOptimalQuestions is unchanged -
   * these limits only constrain which question TYPE is eligible before Elo ranking.
   */
  async selectBatchQuestions(
    topicId: string,
    targetElo: number,
    excludedIds: string[],
    objectiveLimit: number,
    theoryLimit: number,
    excludedTexts: string[] = [],
  ) {
    const mcqs = objectiveLimit > 0
      ? await questionRepository.findManyOptimalQuestions(
          topicId,
          targetElo,
          excludedIds,
          objectiveLimit,
          'MULTIPLE_CHOICE',
          excludedTexts,
        )
      : [];

    const mcqTexts = mcqs.map(q => q.questionText).filter(Boolean);
    const combinedExcludedTexts = [...excludedTexts, ...mcqTexts];
    const combinedExcludedIds = [...excludedIds, ...mcqs.map(q => q._id.toString())];

    const theories = theoryLimit > 0
      ? await questionRepository.findManyOptimalQuestions(
          topicId,
          targetElo,
          combinedExcludedIds,
          theoryLimit,
          'THEORY',
          combinedExcludedTexts,
        )
      : [];

    const combined = [...mcqs, ...theories];

    // Final deduplication guard across both question types
    const seenIds = new Set<string>();
    const seenPrompts = new Set<string>(
      excludedTexts.map(t => (t || '').trim().toLowerCase()).filter(Boolean)
    );
    const uniqueCombined: any[] = [];

    for (const q of combined) {
      const idStr = q._id.toString();
      const norm = (q.questionText || '').trim().toLowerCase();
      const isDuplicatePrompt = norm ? seenPrompts.has(norm) : false;
      if (!seenIds.has(idStr) && !isDuplicatePrompt) {
        seenIds.add(idStr);
        if (norm) seenPrompts.add(norm);
        uniqueCombined.push(q);
      }
    }

    // Shuffle combined list so MCQs and theory items are interleaved
    for (let i = uniqueCombined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniqueCombined[i], uniqueCombined[j]] = [uniqueCombined[j], uniqueCombined[i]];
    }
    return uniqueCombined;
  }

  private calculateExpectedProbability(
    playerElo: number,
    opponentElo: number,
  ): number {
    return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  }

  private calculateEloChange(
    oldElo: number,
    expected: number,
    actual: number,
    k: number,
  ): number {
    return oldElo + k * (actual - expected);
  }

  /**
   * Unconditional atomic increment of answer counters.
   * Runs once per answer regardless of Elo contention outcome.
   */
  private async incrementAnswerCounters(masteryId: string, isCorrect: boolean): Promise<void> {

    await masteryRepository.incrementAnswerCounters(masteryId, isCorrect);
  }

  /**
   * Conditional Elo-only update using optimistic concurrency.
   * Returns true if the update succeeded (no concurrent modification).
   */
  private async updateStudentEloConditionally(
    record: IMasteryRecordDocument,
    newElo: number,
  ): Promise<boolean> {
    const questionsAttempted = record.questionsAttempted + 1;
    const confidence = this.calculateConfidence(questionsAttempted);
    const result = await masteryRepository.updateEloConditionally(record._id, record.eloRating, newElo, confidence);
    return result.modifiedCount > 0;
  }

  private async updateQuestionEloConditionally(
    question: IQuestionDocument,
    newElo: number,
  ): Promise<boolean> {
    const result = await questionRepository.updateEloConditionally(question._id, question.eloRating, newElo);
    return result.modifiedCount > 0;
  }

  private async updateQuestionStatistics(
    questionId: string,
    isCorrect: boolean,
  ) {
    // Pure $inc atomicity. Guaranteed not to lose updates under concurrency.
    await questionRepository.incrementAnswerCounters(questionId, isCorrect);
  }

  private calculateConfidence(questionsAttempted: number): number {
    return 1 - Math.exp(-questionsAttempted / 10);
  }
}

export const adaptiveService = new AdaptiveService();
