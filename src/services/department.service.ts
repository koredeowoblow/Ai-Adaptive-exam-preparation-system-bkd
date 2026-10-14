import { departmentRepository } from '../repositories/department.repository';
import { CreateDepartmentDTO, UpdateDepartmentDTO } from '../types/department.types';
import { AppError } from '../utils/AppError';

export class DepartmentService {
  async createDepartment(data: CreateDepartmentDTO) {
    const existing = await departmentRepository.findByName(data.name);
    if (existing) {
      throw new AppError('Department with this name already exists', 400);
    }
    return departmentRepository.create(data);
  }

  async getAllDepartments(limit: number = 20, cursor?: string) {
    return departmentRepository.findAll(limit, cursor);
  }

  async getDepartmentById(id: string) {
    const department = await departmentRepository.findById(id);
    if (!department) {
      throw new AppError('Department not found', 404);
    }
    return department;
  }

  async updateDepartment(id: string, data: UpdateDepartmentDTO) {
    const department = await departmentRepository.findById(id);
    if (!department) {
      throw new AppError('Department not found', 404);
    }
    
    if (data.name && data.name !== department.name) {
      const existing = await departmentRepository.findByName(data.name);
      if (existing) {
        throw new AppError('Department with this name already exists', 400);
      }
    }

    return departmentRepository.updateById(id, data);
  }

  async deleteDepartment(id: string) {
    const department = await departmentRepository.findById(id);
    if (!department) {
      throw new AppError('Department not found', 404);
    }
    await departmentRepository.deleteById(id);
    return null;
  }
}

export const departmentService = new DepartmentService();
