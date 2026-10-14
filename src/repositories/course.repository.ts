import { Course } from '../models/course.model';
import { CreateCourseDTO, UpdateCourseDTO } from '../types/course.types';
import { cacheService } from '../utils/cache';

export class CourseRepository {
  private readonly CACHE_TTL = 3600;

  async create(data: CreateCourseDTO) {
    const course = await Course.create(data);
    await cacheService.deleteByPattern('courses:*');
    return course;
  }

  async findAll(limit: number = 20, cursor?: string) {
    const key = `courses:all:limit:${limit}:cursor:${cursor || 'null'}`;
    return cacheService.getOrSetSingleFlight(key, this.CACHE_TTL, async () => {
      const filter: any = {};
      if (cursor) filter._id = { $lt: cursor };
      return Course.find(filter).populate('departmentId', 'name').sort({ _id: -1 }).limit(limit);
    });
  }

  async findById(id: string) {
    const key = `courses:id:${id}`;
    return cacheService.getOrSetSingleFlight(key, this.CACHE_TTL, async () => {
      return Course.findById(id).populate('departmentId', 'name');
    });
  }

  async findByDepartmentId(departmentId: string, limit: number = 20, cursor?: string) {
    const key = `courses:dept:${departmentId}:limit:${limit}:cursor:${cursor || 'null'}`;
    return cacheService.getOrSetSingleFlight(key, this.CACHE_TTL, async () => {
      const filter: any = { departmentId };
      if (cursor) filter._id = { $lt: cursor };
      return Course.find(filter).sort({ _id: -1 }).limit(limit);
    });
  }

  async findByCode(code: string) {
    return Course.findOne({ code });
  }

  async updateById(id: string, data: UpdateCourseDTO) {
    const updated = await Course.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    await cacheService.deleteByPattern('courses:*');
    return updated;
  }

  async deleteById(id: string) {
    const deleted = await Course.findByIdAndDelete(id);
    await cacheService.deleteByPattern('courses:*');
    return deleted;
  }
}

export const courseRepository = new CourseRepository();
