import { Department } from '../models/department.model';
import { CreateDepartmentDTO, UpdateDepartmentDTO } from '../types/department.types';
import { cacheService } from '../utils/cache';

export class DepartmentRepository {
  private readonly CACHE_TTL = 3600;

  async create(data: CreateDepartmentDTO) {
    const dept = await Department.create(data);
    await cacheService.deleteByPattern('departments:*');
    return dept;
  }

  async findAll(limit: number = 20, cursor?: string) {
    const key = `departments:all:limit:${limit}:cursor:${cursor || 'null'}`;
    return cacheService.getOrSetSingleFlight(key, this.CACHE_TTL, async () => {
      const filter: any = {};
      if (cursor) filter._id = { $lt: cursor };
      return Department.find(filter).sort({ _id: -1 }).limit(limit);
    });
  }

  async findById(id: string) {
    const key = `departments:id:${id}`;
    return cacheService.getOrSetSingleFlight(key, this.CACHE_TTL, async () => {
      return Department.findById(id);
    });
  }

  async findByName(name: string) {
    return Department.findOne({ name });
  }

  async updateById(id: string, data: UpdateDepartmentDTO) {
    const updated = await Department.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    await cacheService.deleteByPattern('departments:*');
    return updated;
  }

  async deleteById(id: string) {
    const deleted = await Department.findByIdAndDelete(id);
    await cacheService.deleteByPattern('departments:*');
    return deleted;
  }
}

export const departmentRepository = new DepartmentRepository();
