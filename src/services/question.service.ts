import { questionRepository, QuestionQueryOptions } from '../repositories/question.repository';
import { CreateQuestionDTO, UpdateQuestionDTO } from '../types/question.types';
import { AppError } from '../utils/AppError';

export class QuestionService {
  async createQuestion(data: CreateQuestionDTO) {
    if (data.type !== 'THEORY') {
      const validAnswer = data.options?.find(opt => opt.id === data.correctAnswer);
      if (!validAnswer) {
        throw new AppError('Correct answer must match an option ID', 400);
      }
    }
    return questionRepository.create(data);
  }

  async getQuestionById(id: string) {
    const question = await questionRepository.findById(id);
    if (!question) {
      throw new AppError('Question not found', 404);
    }
    return question;
  }

  async getAllQuestions(options: QuestionQueryOptions = {}) {
    return questionRepository.findAll(options);
  }

  async getQuestionsByTopic(topicId: string, limit: number = 20, cursor?: string) {
    return questionRepository.findByTopicId(topicId, limit, cursor);
  }

  async updateQuestion(id: string, data: UpdateQuestionDTO) {
    const question = await questionRepository.findById(id);
    if (!question) {
      throw new AppError('Question not found', 404);
    }

    const type = data.type || question.type;
    if (type !== 'THEORY' && (data.options || data.correctAnswer)) {
      const options = data.options || question.options;
      const correctAnswer = data.correctAnswer || question.correctAnswer;
      const validAnswer = options?.find(opt => opt.id === correctAnswer);
      if (!validAnswer) {
        throw new AppError('Correct answer must match an option ID', 400);
      }
    }

    return questionRepository.updateById(id, data);
  }

  async deleteQuestion(id: string) {
    const question = await questionRepository.findById(id);
    if (!question) {
      throw new AppError('Question not found', 404);
    }
    await questionRepository.deleteById(id);
    return null;
  }

  async bulkCreateQuestions(questions: CreateQuestionDTO[]) {
    // Basic validation
    for (const q of questions) {
      if (q.type !== 'THEORY') {
        const validAnswer = q.options?.find(opt => opt.id === q.correctAnswer);
        if (!validAnswer) {
          throw new AppError('Correct answer must match an option ID in bulk data', 400);
        }
      }
    }
    return questionRepository.bulkCreate(questions);
  }
}

export const questionService = new QuestionService();
