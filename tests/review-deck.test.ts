import mongoose from 'mongoose';
import { reviewDeckService, LEITNER_INTERVALS } from '../src/services/reviewDeck.service';
import { ReviewCard } from '../src/models/reviewDeck.model';
import { Question } from '../src/models/question.model';
import { Course } from '../src/models/course.model';
import { Topic } from '../src/models/topic.model';
import { env } from '../src/config/env';

describe('Spaced Repetition Review Deck (Leitner System) Tests', () => {
  const studentId = new mongoose.Types.ObjectId().toString();
  let courseId: string;
  let topicId: string;
  let question1: any;
  let question2: any;

  beforeAll(async () => {
    await mongoose.connect(env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await ReviewCard.deleteMany({});
    await Question.deleteMany({});
    await Topic.deleteMany({});
    await Course.deleteMany({});

    const course = await Course.create({
      code: 'CSC201',
      title: 'Computer Architecture',
      departmentId: new mongoose.Types.ObjectId(),
    });
    courseId = course._id.toString();

    const topic = await Topic.create({
      name: 'Memory Hierarchy',
      courseId: course._id,
    });
    topicId = topic._id.toString();

    question1 = await Question.create({
      topicId: topic._id,
      questionText: 'What is the fastest memory in the hierarchy?',
      type: 'MULTIPLE_CHOICE',
      options: [
        { id: 'a', text: 'Registers' },
        { id: 'b', text: 'L1 Cache' },
        { id: 'c', text: 'RAM' },
        { id: 'd', text: 'SSD' },
      ],
      correctAnswer: 'a',
      eloRating: 1200,
      explanation: 'Registers are on-chip and have the lowest latency.',
      explanationSource: 'manual',
    });

    question2 = await Question.create({
      topicId: topic._id,
      questionText: 'What is cache hit ratio?',
      type: 'MULTIPLE_CHOICE',
      options: [
        { id: 'a', text: 'Hits / Total' },
        { id: 'b', text: 'Misses / Total' },
        { id: 'c', text: 'Hits / Misses' },
        { id: 'd', text: 'None' },
      ],
      correctAnswer: 'a',
      eloRating: 1350,
      explanation: 'Hit ratio is total hits divided by total attempts.',
      explanationSource: 'manual',
    });
  });

  it('automatically queues a newly missed question into Box 1 (due immediately)', async () => {
    await reviewDeckService.recordIncorrectAnswer(studentId, question1._id.toString(), courseId, topicId);

    const card = await ReviewCard.findOne({ studentId, questionId: question1._id });
    expect(card).toBeDefined();
    expect(card?.box).toBe(1);
    expect(card?.intervalDays).toBe(1);
    expect(card?.consecutiveCorrect).toBe(0);
    expect(card?.totalLapses).toBe(0);
    expect(card?.nextReviewDate.getTime()).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it('advances a card by 1 box when reviewed with "good" and extends interval', async () => {
    await reviewDeckService.recordIncorrectAnswer(studentId, question1._id.toString(), courseId, topicId);
    const card = await ReviewCard.findOne({ studentId, questionId: question1._id });

    // Review with 'good'
    const updated = await reviewDeckService.submitReview(studentId, card!._id.toString(), 'good');
    expect(updated.box).toBe(2);
    expect(updated.intervalDays).toBe(LEITNER_INTERVALS[2]); // 3 days
    expect(updated.consecutiveCorrect).toBe(1);
    expect(updated.totalReviews).toBe(1);

    // Review with 'good' again
    const updated2 = await reviewDeckService.submitReview(studentId, card!._id.toString(), 'good');
    expect(updated2.box).toBe(3);
    expect(updated2.intervalDays).toBe(LEITNER_INTERVALS[3]); // 7 days
    expect(updated2.consecutiveCorrect).toBe(2);
  });

  it('advances a card by 2 boxes when reviewed with "easy" and caps at Box 5', async () => {
    await reviewDeckService.recordIncorrectAnswer(studentId, question1._id.toString(), courseId, topicId);
    const card = await ReviewCard.findOne({ studentId, questionId: question1._id });

    // Review with 'easy'
    const updated = await reviewDeckService.submitReview(studentId, card!._id.toString(), 'easy');
    expect(updated.box).toBe(3); // 1 + 2 = 3
    expect(updated.intervalDays).toBe(LEITNER_INTERVALS[3]);

    // Review with 'easy' again
    const updated2 = await reviewDeckService.submitReview(studentId, card!._id.toString(), 'easy');
    expect(updated2.box).toBe(5); // max capped at 5
    expect(updated2.intervalDays).toBe(LEITNER_INTERVALS[5]); // 30 days
  });

  it('demotes a higher-box card back to Box 1 when answered incorrectly or reviewed with "again"', async () => {
    // Put card into Box 4
    const card = await ReviewCard.create({
      studentId: new mongoose.Types.ObjectId(studentId),
      questionId: question1._id,
      courseId: new mongoose.Types.ObjectId(courseId),
      topicId: new mongoose.Types.ObjectId(topicId),
      box: 4,
      intervalDays: 14,
      consecutiveCorrect: 3,
      totalReviews: 3,
      totalLapses: 0,
      nextReviewDate: new Date(),
    });

    // Review with 'again'
    const demoted = await reviewDeckService.submitReview(studentId, card._id.toString(), 'again');
    expect(demoted.box).toBe(1);
    expect(demoted.intervalDays).toBe(1);
    expect(demoted.consecutiveCorrect).toBe(0);
    expect(demoted.totalLapses).toBe(1);
    expect(demoted.totalReviews).toBe(4);

    // Another lapse in practice session
    await reviewDeckService.recordIncorrectAnswer(studentId, question1._id.toString(), courseId, topicId);
    const rechecked = await ReviewCard.findById(card._id);
    expect(rechecked?.box).toBe(1);
  });

  it('correctly calculates deck summary counts and retention rate', async () => {
    // Card 1 in Box 1
    await ReviewCard.create({
      studentId: new mongoose.Types.ObjectId(studentId),
      questionId: question1._id,
      courseId: new mongoose.Types.ObjectId(courseId),
      topicId: new mongoose.Types.ObjectId(topicId),
      box: 1,
      intervalDays: 1,
      totalReviews: 4,
      totalLapses: 1,
      nextReviewDate: new Date(Date.now() - 10000), // Due
    });

    // Card 2 in Box 3
    await ReviewCard.create({
      studentId: new mongoose.Types.ObjectId(studentId),
      questionId: question2._id,
      courseId: new mongoose.Types.ObjectId(courseId),
      topicId: new mongoose.Types.ObjectId(topicId),
      box: 3,
      intervalDays: 7,
      totalReviews: 6,
      totalLapses: 0,
      nextReviewDate: new Date(Date.now() + 86400000), // Not due yet
    });

    const summary = await reviewDeckService.getDeckSummary(studentId);
    expect(summary.totalCards).toBe(2);
    expect(summary.dueToday).toBe(1);
    expect(summary.boxes.box1).toBe(1);
    expect(summary.boxes.box3).toBe(1);
    // (10 - 1) / 10 = 90% retention rate
    expect(summary.retentionRate).toBe(90);

    const dueCards = await reviewDeckService.getDueCards(studentId);
    expect(dueCards.length).toBe(1);
    expect(dueCards[0].questionId).toBeDefined();
  });

  it('allows manual addition and removal of questions to review deck', async () => {
    const added = await reviewDeckService.addCardManually(studentId, question2._id.toString());
    expect(added).toBeDefined();
    expect(added.box).toBe(1);

    const removed = await reviewDeckService.removeCard(studentId, added._id.toString());
    expect(removed).toBe(true);

    const remaining = await ReviewCard.findById(added._id);
    expect(remaining).toBeNull();
  });
});
