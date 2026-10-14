import { Topic } from '../models/topic.model';
import { CreateTopicDTO, UpdateTopicDTO } from '../types/topic.types';
import { cacheService } from '../utils/cache';

export class TopicRepository {
  async create(data: CreateTopicDTO) {
    const topic = await Topic.create(data);
    if (topic.courseId) {
      await cacheService.deleteByPattern(`topics:course:${topic.courseId}:*`);
    }
    return topic;
  }

  async findById(id: string) {
    return Topic.findById(id).populate('courseId', 'title code');
  }

  async findByCourseId(courseId: string, limit: number = 20, cursor?: string) {
    return cacheService.getOrSetSingleFlight(
      `topics:course:${courseId}:limit:${limit}:cursor:${cursor || 'null'}`,
      3600, // 1 hour
      async () => {
        const filter: any = { courseId };
        if (cursor) filter._id = { $lt: cursor };
        return Topic.find(filter).sort({ _id: -1 }).limit(limit);
      }
    );
  }

  async findAll(courseId?: string, limit: number = 20, cursor?: string) {
    const filter: any = courseId ? { courseId } : {};
    if (cursor) filter._id = { $lt: cursor };
    return Topic.find(filter).sort({ _id: -1 }).limit(limit);
  }

  async findByNameAndCourse(name: string, courseId: string) {
    return Topic.findOne({ name, courseId });
  }

  async updateById(id: string, data: UpdateTopicDTO) {
    const existing = await Topic.findById(id);
    if (!existing) return null;
    const oldCourseId = existing.courseId?.toString();
    const updated = await Topic.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    const newCourseId = updated?.courseId?.toString();

    if (oldCourseId) {
      await cacheService.deleteByPattern(`topics:course:${oldCourseId}:*`);
    }
    if (newCourseId && newCourseId !== oldCourseId) {
      await cacheService.deleteByPattern(`topics:course:${newCourseId}:*`);
    }
    return updated;
  }

  async deleteById(id: string) {
    const existing = await Topic.findById(id);
    if (!existing) return null;
    const courseId = existing.courseId?.toString();
    const deleted = await Topic.findByIdAndDelete(id);
    if (courseId) {
      await cacheService.deleteByPattern(`topics:course:${courseId}:*`);
    }
    return deleted;
  }
}

export const topicRepository = new TopicRepository();
