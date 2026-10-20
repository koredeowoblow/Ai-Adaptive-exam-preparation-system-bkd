import { studentRepository, StudentQueryOptions } from '../repositories/student.repository';
import { UpdateStudentDTO, CompleteOnboardingDTO, PromoteStudentDTO } from '../types/student.types';
import { AppError } from '../utils/AppError';
import { Course } from '../models/course.model';
import { validateExamDate } from '../utils/dateValidation';

export class StudentService {
  async getStudentProfile(id: string) {
    const student = await studentRepository.findByIdWithCourses(id);
    if (!student) {
      throw new AppError('Student not found', 404);
    }
    return student;
  }

  async promoteStudent(studentId: string, data: PromoteStudentDTO) {
    const student = await studentRepository.findById(studentId);
    if (!student) {
      throw new AppError('Student not found', 404);
    }

    if (!student.departmentId) {
      throw new AppError('Student must be assigned to a department before promotion', 400);
    }

    const currentLevel = student.level || '100L';
    const currentNum = parseInt(currentLevel.replace(/\D/g, ''), 10) || 100;
    const targetNum = parseInt(data.targetLevel.replace(/\D/g, ''), 10) || 100;

    // 1. Repeat check: student is already at target level
    if (data.targetLevel === currentLevel) {
      throw new AppError(`Student is already at level ${currentLevel}. Repeat promotion is not permitted.`, 400);
    }

    // 2. Backwards promotion check
    if (targetNum < currentNum) {
      throw new AppError('Cannot promote backwards to a previous level', 400);
    }

    // 3. Skip-level check (only current + 1 is permitted)
    const expectedTargetNum = currentNum + 100;
    const expectedTargetLevel = `${expectedTargetNum}L`;
    if (data.targetLevel !== expectedTargetLevel) {
      throw new AppError(
        `Skip-level promotion is not allowed. Next sequential level must be ${expectedTargetLevel}`,
        400
      );
    }

    // 4. Derive highest level from data (department courses), NOT a constant
    const deptCourses = await Course.find({ departmentId: student.departmentId }).select('level _id code title');
    const availableNumericLevels = Array.from(
      new Set(
        deptCourses.map((c) =>
          typeof c.level === 'number' ? c.level : parseInt(String(c.level).replace(/\D/g, ''), 10)
        )
      )
    ).sort((a, b) => a - b);

    if (availableNumericLevels.length === 0) {
      throw new AppError('No courses available for the student department', 400);
    }

    const maxLevel = availableNumericLevels[availableNumericLevels.length - 1];
    if (!availableNumericLevels.includes(targetNum)) {
      throw new AppError(
        `Department does not offer courses for level ${data.targetLevel}. Highest available level is ${maxLevel}L.`,
        400
      );
    }

    // 5. Date validation if provided
    let cleanExamDate: string | null | undefined = undefined;
    if (data.nextExamDate !== undefined) {
      const dateCheck = validateExamDate(data.nextExamDate);
      if (!dateCheck.isValid) {
        throw new AppError(dateCheck.error || 'Invalid exam date', 400);
      }
      cleanExamDate = dateCheck.cleanDate;
    }

    // 6. Filter course IDs: must belong to student department and target level
    let validCourseIds: string[] = [];
    if (data.courseIds && data.courseIds.length > 0) {
      validCourseIds = deptCourses
        .filter((c) => {
          const cNum = typeof c.level === 'number' ? c.level : parseInt(String(c.level).replace(/\D/g, ''), 10);
          return cNum === targetNum && data.courseIds?.includes(c._id.toString());
        })
        .map((c) => c._id.toString());
    }

    // 7. Atomic conditional update (guarantees race condition safety and idempotency)
    const updated = await studentRepository.atomicPromote(
      studentId,
      currentLevel,
      data.targetLevel,
      validCourseIds,
      cleanExamDate
    );

    if (!updated) {
      // Check if another concurrent request already completed this exact promotion
      const recheck = await studentRepository.findByIdWithCourses(studentId);
      if (recheck && recheck.level === data.targetLevel) {
        // Idempotent resolution for concurrent double-submit: return state without double-enrollment
        return recheck;
      }
      throw new AppError('Concurrent update conflict. Please refresh and try again.', 409);
    }

    return updated;
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
