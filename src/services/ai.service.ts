import { GenerateExplanationRequest, FocusPlanRequest } from '../types/ai.types';
import { aiQueue } from '../jobs/ai.job';
import { groqProvider } from '../providers/groq.provider';
import { courseRepository } from '../repositories/course.repository';
import { masteryRepository } from '../repositories/mastery.repository';


export class AIService {
  async queueExplanationGeneration(data: any) { // using 'any' here as we're passing rich data
    await aiQueue.add('generateExplanation', {
      questionText: data.questionText,
      correctAnswer: data.correctAnswer,
      studentAnswer: data.studentAnswer,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: 100,
    });

    return { queued: true };
  }

  async generateFocusPlan(data: any) {
    await aiQueue.add('generateFocusPlan', {
      studentStats: data.studentStats,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: 100,
    });

    return { queued: true };
  }

  async generateChatResponse(messages: any[], courseId?: string, studentId?: string, fallbackContext?: string) {
    let richContext = fallbackContext || '';

    if (courseId) {
      try {
        const course = await courseRepository.findById(courseId);
        if (course) {
          const masteries = studentId ? await masteryRepository.findByStudentAndCourse(studentId, courseId, 100) : [];

          richContext = `Course: ${course.code} - ${course.title} (Level ${course.level || 'Unknown'}).\n`;
          if (course.description) richContext += `Description: ${course.description}\n`;
          if (course.topics?.length) richContext += `Topics: ${course.topics.join(', ')}\n`;

          if (masteries && masteries.length > 0) {
            const avgElo = masteries.reduce((acc, m) => acc + m.eloRating, 0) / masteries.length;
            richContext += `\nStudent Performance Profile:\n`;
            richContext += `- Average ELO Rating: ${Math.round(avgElo)}\n`;
            richContext += `- Mastery Level: ${avgElo > 1500 ? 'Advanced' : avgElo > 1200 ? 'Intermediate' : 'Beginner'}\n`;
          }
        }
      } catch (err) {
        console.error('Error fetching course context for AI:', err);
      }
    }

    return await groqProvider.generateChatResponse(messages, richContext);
  }
}

export const aiService = new AIService();

