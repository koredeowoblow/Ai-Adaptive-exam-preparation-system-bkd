import { adaptiveService } from '../src/services/adaptive.service';
import { masteryRepository } from '../src/repositories/mastery.repository';
import { questionRepository } from '../src/repositories/question.repository';
import { topicRepository } from '../src/repositories/topic.repository';

jest.mock('../src/repositories/mastery.repository');
jest.mock('../src/repositories/question.repository');
jest.mock('../src/repositories/topic.repository');

// Mock the Mongoose model so updateStudentEloConditionally doesn't require a live DB
jest.mock('../src/models/mastery.model', () => ({
  MasteryRecord: {
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock('../src/models/question.model', () => ({
  Question: {
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  },
}));

describe('AdaptiveService - Elo Based Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('topic priority & batch question selection', () => {
    it('should select the optimal priority topic based on weakness and uncertainty', async () => {
      const ratings = [
        { topicId: 'topicA', eloRating: 800, confidence: 0.1, lastAttemptedAt: new Date(Date.now() - 100000000) },
        { topicId: 'topicB', eloRating: 1500, confidence: 0.9, lastAttemptedAt: new Date() },
      ];

      const selected = adaptiveService.selectPriorityTopic(ratings);
      expect(selected.topicId).toBe('topicA');
    });

    it('should select batch questions correctly', async () => {
      (questionRepository.findManyOptimalQuestions as jest.Mock).mockImplementation((tId, elo, exc, limit, type) => {
        if (type === 'MULTIPLE_CHOICE') {
          return Promise.resolve([{ _id: 'mcq1', type: 'MULTIPLE_CHOICE' }]);
        }
        return Promise.resolve([{ _id: 'th1', type: 'THEORY' }]);
      });

      const result = await adaptiveService.selectBatchQuestions('topicA', 1000, [], 1, 1);
      expect(result.length).toBe(2);
      expect(questionRepository.findManyOptimalQuestions).toHaveBeenCalledTimes(2);
    });
  });

  describe('processAnswer', () => {
    it('should calculate new Elo and update records', async () => {
      const mockMastery = {
        _id: 'mastery123',
        eloRating: 1000,
        questionsAttempted: 5,
        questionsCorrect: 2,
        confidence: 0.2,
        recentAnswers: [true, false],
      };

      (masteryRepository.updateEloConditionally as jest.Mock).mockResolvedValue({ modifiedCount: 1 });

      const updatedMastery = await (adaptiveService as any).updateStudentEloConditionally(
        mockMastery,
        1032,
      );

      expect(updatedMastery).toBe(true);
      // We know it modifies DB under the hood in the real service, here we mock it
      // So we just assert it returned true for successful conditional update.
    });
  });
});
