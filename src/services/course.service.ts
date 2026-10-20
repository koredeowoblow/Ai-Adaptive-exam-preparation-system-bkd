import { courseRepository } from '../repositories/course.repository';
import { CreateCourseDTO, UpdateCourseDTO } from '../types/course.types';
import { AppError } from '../utils/AppError';

import { studentRepository } from '../repositories/student.repository';

export class CourseService {
  async createCourse(data: CreateCourseDTO) {
    const existing = await courseRepository.findByCode(data.code);
    if (existing) {
      throw new AppError('Course with this code already exists', 400);
    }
    return courseRepository.create(data);
  }

  private async isStudentUser(tokenUser?: any): Promise<{ isStudent: boolean; student: any }> {
    if (!tokenUser) return { isStudent: false, student: null };
    if (tokenUser.role === 'admin' || tokenUser.role === 'superAdmin' || tokenUser.role === 'superadmin') return { isStudent: false, student: null };
    if (tokenUser.type === 'admin') return { isStudent: false, student: null };

    const student = await studentRepository.findByIdWithRoles(tokenUser.id || tokenUser._id);
    if (!student) return { isStudent: false, student: null };

    const roles = (student.roleIds as any[]) || [];
    const isAdmin = roles.some((r: any) => r.slug === 'admin' || r.slug === 'superadmin');
    return { isStudent: !isAdmin, student };
  }

  async getCourseById(id: string, tokenUser?: any) {
    const course = await courseRepository.findById(id);
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    if (tokenUser) {
      const { isStudent, student } = await this.isStudentUser(tokenUser);
      if (isStudent && student?.isOnboarded) {
        const studentDeptId = student.departmentId?._id ? student.departmentId._id.toString() : student.departmentId?.toString();
        const courseDeptId = course.departmentId?._id ? course.departmentId._id.toString() : course.departmentId?.toString();
        if (!studentDeptId || courseDeptId !== studentDeptId) {
          throw new AppError('Forbidden: Course does not belong to your department', 403);
        }
      }
    }
    return course;
  }

  async getCourses(tokenUser?: any, limit: number = 20, cursor?: string) {
    if (tokenUser) {
      const { isStudent, student } = await this.isStudentUser(tokenUser);
      if (isStudent && student?.isOnboarded) {
        const studentDeptId = student.departmentId?._id ? student.departmentId._id.toString() : student.departmentId?.toString();
        if (!studentDeptId) {
          throw new AppError('Forbidden: Student must select a department first', 403);
        }
        return courseRepository.findByDepartmentId(studentDeptId, limit, cursor);
      }
    }
    return courseRepository.findAll(limit, cursor);
  }

  async getCoursesByDepartment(departmentId: string, tokenUser?: any, limit: number = 20, cursor?: string) {
    if (tokenUser) {
      const { isStudent, student } = await this.isStudentUser(tokenUser);
      if (isStudent && student?.isOnboarded) {
        const studentDeptId = student.departmentId?._id ? student.departmentId._id.toString() : student.departmentId?.toString();
        if (!studentDeptId || departmentId !== studentDeptId) {
          throw new AppError('Forbidden: Cannot view courses outside your department', 403);
        }
      }
    }
    return courseRepository.findByDepartmentId(departmentId, limit, cursor);
  }

  async updateCourse(id: string, data: UpdateCourseDTO) {
    const course = await courseRepository.findById(id);
    if (!course) {
      throw new AppError('Course not found', 404);
    }
    
    if (data.code && data.code !== course.code) {
      const existing = await courseRepository.findByCode(data.code);
      if (existing) {
        throw new AppError('Course with this code already exists', 400);
      }
    }

    return courseRepository.updateById(id, data);
  }

  async deleteCourse(id: string) {
    const course = await courseRepository.findById(id);
    if (!course) {
      throw new AppError('Course not found', 404);
    }
    await courseRepository.deleteById(id);
    return null;
  }
}

export const courseService = new CourseService();
