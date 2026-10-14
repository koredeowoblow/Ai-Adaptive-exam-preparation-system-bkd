import { studentRepository, StudentQueryOptions } from '../repositories/student.repository';
import { UpdateStudentDTO, CompleteOnboardingDTO } from '../types/student.types';
import { AppError } from '../utils/AppError';

export class StudentService {
  async getStudentProfile(id: string) {
    const student = await studentRepository.findByIdWithCourses(id);
    if (!student) {
      throw new AppError('Student not found', 404);
    }
    return student;
  }

  async updateStudent(id: string, data: UpdateStudentDTO) {
    const student = await studentRepository.updateById(id, data);
    if (!student) {
      throw new AppError('Student not found', 404);
    }
    return student;
  }

  async completeOnboarding(id: string, data: CompleteOnboardingDTO) {
    const student = await studentRepository.completeOnboarding(id, data);
    if (!student) {
      throw new AppError('Student not found', 404);
    }
    return student;
  }

  async setDepartment(id: string, departmentId: string) {
    const student = await studentRepository.updateById(id, { departmentId });
    if (!student) {
      throw new AppError('Student not found', 404);
    }
    return student;
  }

  async enrollCourses(id: string, courseIds: string[]) {
    const student = await studentRepository.addCourses(id, courseIds);
    if (!student) {
      throw new AppError('Student not found', 404);
    }
    return student;
  }

  async removeCourseEnrollment(id: string, courseId: string) {
    const student = await studentRepository.removeCourse(id, courseId);
    if (!student) {
      throw new AppError('Student not found', 404);
    }
    return student;
  }

  async getEnrolledCourses(id: string) {
    const student = await studentRepository.findByIdWithCourses(id);
    if (!student) {
      throw new AppError('Student not found', 404);
    }
    return student.enrolledCourseIds;
  }

  async getAllStudents(options: StudentQueryOptions) {
    return studentRepository.findAll(options);
  }

  async deleteStudent(id: string) {
    const student = await studentRepository.deleteById(id);
    if (!student) {
      throw new AppError('Student not found', 404);
    }
    return student;
  }
}

export const studentService = new StudentService();
