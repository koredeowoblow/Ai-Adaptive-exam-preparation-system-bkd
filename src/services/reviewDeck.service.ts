import { Types } from 'mongoose';
import { ReviewCard } from '../models/reviewDeck.model';
import { Question } from '../models/question.model';
import { LeitnerBox, ReviewDeckSummary, ReviewRating } from '../types/reviewDeck.types';
import { AppError } from '../utils/AppError';

export const LEITNER_INTERVALS: Record<number, number> = {
  1: 1,   // 1 day
  2: 3,   // 3 days
  3: 7,   // 7 days
  4: 14,  // 14 days
  5: 30,  // 30 days (Mastered)
};

export class ReviewDeckService {
  /**
   * Automatically queues or resets a question to Box 1 when answered incorrectly
   */
  async recordIncorrectAnswer(
    studentId: string | Types.ObjectId,
    questionId: string | Types.ObjectId,
    courseId?: string | Types.ObjectId,
    topicId?: string | Types.ObjectId
  ): Promise<void> {
    try {
      const sId = new Types.ObjectId(studentId.toString());
      const qId = new Types.ObjectId(questionId.toString());

      // If course or topic wasn't supplied, look up the question
      let cId = courseId ? new Types.ObjectId(courseId.toString()) : undefined;
      let tId = topicId ? new Types.ObjectId(topicId.toString()) : undefined;

      if (!cId || !tId) {
        const question = await Question.findById(qId).populate<{ topicId: any }>('topicId');
        if (!question) return;
        tId = (question.topicId as any)?._id || question.topicId;
        cId = (question.topicId as any)?.courseId;
      }

      const existingCard = await ReviewCard.findOne({ studentId: sId, questionId: qId });

      if (existingCard) {
        const wasInHigherBox = existingCard.box > 1;
        existingCard.box = 1;
        existingCard.intervalDays = LEITNER_INTERVALS[1];
        existingCard.consecutiveCorrect = 0;
        if (wasInHigherBox) {
          existingCard.totalLapses = (existingCard.totalLapses || 0) + 1;
        }
        existingCard.nextReviewDate = new Date(); // Due immediately for review
        await existingCard.save();
      } else {
        await ReviewCard.create({
          studentId: sId,
          questionId: qId,
          courseId: cId,
          topicId: tId,
          box: 1,
          intervalDays: LEITNER_INTERVALS[1],
          consecutiveCorrect: 0,
          totalReviews: 0,
          totalLapses: 0,
          nextReviewDate: new Date(),
        });
      }
    } catch (err) {
      console.warn(`[REVIEW_DECK_WARN] Failed to record incorrect answer for question ${questionId}:`, err);
    }
  }

  /**
   * Manually adds a question into the student's review deck
   */
  async addCardManually(
    studentId: string,
    questionId: string
  ) {
    const sId = new Types.ObjectId(studentId);
    const qId = new Types.ObjectId(questionId);

    const question = await Question.findById(qId).populate<{ topicId: any }>('topicId');
    if (!question) {
      throw new AppError('Question not found', 404);
    }

    const existing = await ReviewCard.findOne({ studentId: sId, questionId: qId });
    if (existing) {
      return existing;
    }

    const tId = (question.topicId as any)?._id || question.topicId;
    const cId = (question.topicId as any)?.courseId;

    return await ReviewCard.create({
      studentId: sId,
      questionId: qId,
      courseId: cId,
      topicId: tId,
      box: 1,
      intervalDays: LEITNER_INTERVALS[1],
      consecutiveCorrect: 0,
      totalReviews: 0,
      totalLapses: 0,
      nextReviewDate: new Date(),
    });
  }

  /**
   * Gets cards currently due for spaced review
   */
  async getDueCards(studentId: string, courseId?: string, limit = 50) {
    const filter: any = {
      studentId: new Types.ObjectId(studentId),
      nextReviewDate: { $lte: new Date() },
    };

    if (courseId) {
      filter.courseId = new Types.ObjectId(courseId);
    }

    return await ReviewCard.find(filter)
      .populate('questionId', 'questionText text options type difficulty explanation tags metadata imageUrl subParts rubric')
      .populate('topicId', 'name')
      .populate('courseId', 'title code')
      .sort({ box: 1, nextReviewDate: 1 })
      .limit(limit);
  }

  /**
   * Submits a spaced repetition recall review result using the Leitner algorithm
   */
  async submitReview(
    studentId: string,
    cardId: string,
    rating: ReviewRating
  ) {
    const card = await ReviewCard.findOne({
      _id: new Types.ObjectId(cardId),
      studentId: new Types.ObjectId(studentId),
    });

    if (!card) {
      throw new AppError('Review card not found', 404);
    }

    card.totalReviews = (card.totalReviews || 0) + 1;
    card.lastReviewedAt = new Date();

    if (rating === 'again') {
      // Demote to Box 1, due again in 1 day
      if (card.box > 1) {
        card.totalLapses = (card.totalLapses || 0) + 1;
      }
      card.box = 1;
      card.intervalDays = LEITNER_INTERVALS[1];
      card.consecutiveCorrect = 0;
      card.nextReviewDate = new Date(Date.now() + LEITNER_INTERVALS[1] * 86400000);
    } else if (rating === 'good') {
      // Advance by 1 Box (up to Box 5)
      card.box = Math.min(5, (card.box || 1) + 1) as LeitnerBox;
      card.intervalDays = LEITNER_INTERVALS[card.box];
      card.consecutiveCorrect = (card.consecutiveCorrect || 0) + 1;
      card.nextReviewDate = new Date(Date.now() + card.intervalDays * 86400000);
    } else if (rating === 'easy') {
      // Advance by 2 Boxes (up to Box 5)
      card.box = Math.min(5, (card.box || 1) + 2) as LeitnerBox;
      card.intervalDays = LEITNER_INTERVALS[card.box];
      card.consecutiveCorrect = (card.consecutiveCorrect || 0) + 1;
      card.nextReviewDate = new Date(Date.now() + card.intervalDays * 86400000);
    }

    await card.save();
    return card;
  }

  /**
   * Retrieves summary statistics for the student's review deck
   */
  async getDeckSummary(studentId: string, courseId?: string): Promise<ReviewDeckSummary> {
    const sId = new Types.ObjectId(studentId);
    const matchStage: any = { studentId: sId };
    if (courseId) {
      matchStage.courseId = new Types.ObjectId(courseId);
    }

    const cards = await ReviewCard.find(matchStage).select('box nextReviewDate totalReviews totalLapses');
    const now = new Date();

    const boxes = {
      box1: 0,
      box2: 0,
      box3: 0,
      box4: 0,
      box5: 0,
    };

    let dueToday = 0;
    let totalReviews = 0;
    let totalLapses = 0;

    for (const c of cards) {
      const boxKey = `box${c.box}` as keyof typeof boxes;
      if (boxes[boxKey] !== undefined) {
        boxes[boxKey]++;
      }
      if (c.nextReviewDate <= now) {
        dueToday++;
      }
      totalReviews += c.totalReviews || 0;
      totalLapses += c.totalLapses || 0;
    }

    const retentionRate = totalReviews > 0
      ? Math.max(0, Math.round(((totalReviews - totalLapses) / totalReviews) * 100))
      : 100;

    return {
      totalCards: cards.length,
      dueToday,
      boxes,
      retentionRate,
    };
  }

  /**
   * Removes a card from the deck
   */
  async removeCard(studentId: string, cardId: string): Promise<boolean> {
    const result = await ReviewCard.deleteOne({
      _id: new Types.ObjectId(cardId),
      studentId: new Types.ObjectId(studentId),
    });
    return result.deletedCount > 0;
  }
}

export const reviewDeckService = new ReviewDeckService();
