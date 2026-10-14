import { MasteryRecord } from '../models/mastery.model';

export class MasteryRepository {
  async findByStudentAndTopic(studentId: string, topicId: string) {
    return MasteryRecord.findOne({ studentId, topicId });
  }

  async findByStudentAndCourse(studentId: string, courseId: string, limit: number = 20, cursor?: string) {
    const filter: any = { studentId, courseId };
    if (cursor) filter._id = { $lt: cursor };
    return MasteryRecord.find(filter).sort({ _id: -1 }).limit(limit).populate('topicId', 'name');
  }

  async findAllByStudent(studentId: string, limit: number = 20, cursor?: string) {
    const filter: any = { studentId };
    if (cursor) filter._id = { $lt: cursor };
    return MasteryRecord.find(filter).sort({ _id: -1 }).limit(limit).populate('courseId', 'title code').populate('topicId', 'name');
  }

  async create(studentId: string, courseId: string, topicId: string) {
    return MasteryRecord.create({
      studentId,
      courseId,
      topicId,
      eloRating: 1000,
      questionsAttempted: 0,
      questionsCorrect: 0,
    });
  }

  /**
   * Atomically find or create a MasteryRecord.
   * Uses upsert to prevent duplicate key errors under concurrent load.
   */
  async findOrCreate(studentId: string, courseId: string, topicId: string) {
    try {
      const doc = await MasteryRecord.findOneAndUpdate(
        { studentId, topicId },
        {
          $setOnInsert: {
            courseId,
            eloRating: 1000,
            questionsAttempted: 0,
            questionsCorrect: 0,
          },
        },
        { upsert: true, returnDocument: 'after' },
      );
      if (doc) return doc;
      const found = await MasteryRecord.findOne({ studentId, topicId });
      if (!found) throw new Error('Failed to find or create mastery record');
      return found;
    } catch (err: any) {
      if (err.code === 11000) {
        const found = await MasteryRecord.findOne({ studentId, topicId });
        if (found) return found;
      }
      throw err;
    }
  }

  async updateMastery(id: string, updates: Partial<any>) {
    return MasteryRecord.findByIdAndUpdate(id, updates, { new: true });
  }

  async bulkUpdateStats(operations: any[]) {
    return MasteryRecord.bulkWrite(operations);
  }

  async incrementAnswerCounters(masteryId: string, isCorrect: boolean) {
    return MasteryRecord.updateOne(
      { _id: masteryId },
      {
        $inc: { questionsAttempted: 1, questionsCorrect: isCorrect ? 1 : 0 },
        $set: { lastAttemptedAt: new Date() },
        $push: { recentAnswers: { $each: [isCorrect], $slice: -10 } },
      }
    );
  }

  async updateEloConditionally(recordId: any, currentElo: number, newElo: number, confidence: number) {
    return MasteryRecord.updateOne(
      { _id: recordId, eloRating: currentElo },
      {
        $set: {
          eloRating: Math.max(0, newElo),
          confidence,
        },
      }
    );
  }
}

export const masteryRepository = new MasteryRepository();
