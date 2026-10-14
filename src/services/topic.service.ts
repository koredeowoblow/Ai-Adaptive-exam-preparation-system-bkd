import { topicRepository } from '../repositories/topic.repository';
import { CreateTopicDTO, UpdateTopicDTO } from '../types/topic.types';
import { AppError } from '../utils/AppError';

export class TopicService {
  async createTopic(data: CreateTopicDTO) {
    const existing = await topicRepository.findByNameAndCourse(data.name, data.courseId);
    if (existing) {
      throw new AppError('Topic with this name already exists in the course', 400);
    }
    return topicRepository.create(data);
  }

  async getTopicById(id: string) {
    const topic = await topicRepository.findById(id);
    if (!topic) {
      throw new AppError('Topic not found', 404);
    }
    return topic;
  }

  async getAllTopics(courseId?: string, limit: number = 20, cursor?: string) {
    return topicRepository.findAll(courseId, limit, cursor);
  }

  async getTopicsByCourse(courseId: string, limit: number = 20, cursor?: string) {
    return topicRepository.findByCourseId(courseId, limit, cursor);
  }

  async updateTopic(id: string, data: UpdateTopicDTO) {
    const topic = await topicRepository.findById(id);
    if (!topic) {
      throw new AppError('Topic not found', 404);
    }
    
    if (data.name && data.name !== topic.name) {
      const courseIdStr = (topic.courseId as any)?._id
        ? (topic.courseId as any)._id.toString()
        : topic.courseId?.toString();
      const existing = await topicRepository.findByNameAndCourse(data.name, courseIdStr);
      if (existing) {
        throw new AppError('Topic with this name already exists in the course', 400);
      }
    }

    return topicRepository.updateById(id, data);
  }

  async deleteTopic(id: string) {
    const topic = await topicRepository.findById(id);
    if (!topic) {
      throw new AppError('Topic not found', 404);
    }
    await topicRepository.deleteById(id);
    return null;
  }
}

export const topicService = new TopicService();
