import { Student } from '../models/student.model';
import { Role } from '../models/role.model';
import { Permission } from '../models/permission.model';
import { CreateStudentDTO, UpdateStudentDTO, CompleteOnboardingDTO } from '../types/student.types';

export class StudentRepository {
  async create(data: CreateStudentDTO) {
    return Student.create(data);
  }

  async findById(id: string) {
    return Student.findById(id).select('-passwordHash');
  }

  async findByEmail(email: string) {
    return Student.findOne({ email }).select('+passwordHash');
  }

  async findByIdWithCourses(id: string) {
    return Student.findById(id)
      .populate('departmentId', 'name')
      .populate('enrolledCourseIds', 'title code level')
      .select('-passwordHash');
  }

  async updateById(id: string, data: UpdateStudentDTO) {
    const updateData: any = { ...data };
    if (updateData.nextExamDate !== undefined) {
      updateData.nextExamDate = updateData.nextExamDate ? new Date(updateData.nextExamDate) : null;
    }
    return Student.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('departmentId', 'name')
      .populate('enrolledCourseIds', 'title code level')
      .select('-passwordHash');
  }

  async completeOnboarding(studentId: string, data: CompleteOnboardingDTO) {
    const updateOps: any = {
      $set: {
        isOnboarded: true,
      },
    };

    if (data.departmentId) {
      updateOps.$set.departmentId = data.departmentId;
    }
    if (data.level) {
      updateOps.$set.level = data.level;
    }
    if (data.nextExamDate !== undefined) {
      updateOps.$set.nextExamDate = data.nextExamDate ? new Date(data.nextExamDate) : null;
    }
    if (data.courseIds && data.courseIds.length > 0) {
      updateOps.$addToSet = {
        enrolledCourseIds: { $each: data.courseIds },
      };
    }

    return Student.findByIdAndUpdate(studentId, updateOps, { new: true, runValidators: true })
      .populate('departmentId', 'name')
      .populate('enrolledCourseIds', 'title code level')
      .select('-passwordHash');
  }

  async addCourses(studentId: string, courseIds: string[]) {
    return Student.findByIdAndUpdate(
      studentId,
      { $addToSet: { enrolledCourseIds: { $each: courseIds } } },
      { new: true }
    ).select('-passwordHash');
  }

  async removeCourse(studentId: string, courseId: string) {
    return Student.findByIdAndUpdate(
      studentId,
      { $pull: { enrolledCourseIds: courseId } },
      { new: true }
    ).select('-passwordHash');
  }

  async existsByEmail(email: string) {
    const student = await Student.findOne({ email }).select('_id');
    return !!student;
  }

  async findByIdWithRoles(id: string) {
    return Student.findById(id).populate('roleIds').select('-passwordHash');
  }

  async findByIdWithRolesAndPermissions(id: string) {
    // Requires importing Role and Permission if models aren't auto-resolved, 
    // but Mongoose usually resolves string refs automatically.
    return Student.findById(id).populate({
      path: 'roleIds',
      model: Role,
      populate: {
        path: 'permissionIds',
        model: Permission,
      },
    }).select('-passwordHash');
  }

  async findUsersByRole(roleId: string, skip: number, limit: number) {
    return Student.find({ roleIds: roleId })
      .select('_id')
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async findAll(options: StudentQueryOptions = {}) {
    const {
      departmentId,
      level,
      isOnboarded,
      roleId,
      q,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const filter: any = {};

    if (departmentId) {
      filter.departmentId = departmentId;
    }
    if (level) {
      filter.level = level;
    }
    if (isOnboarded !== undefined) {
      filter.isOnboarded = isOnboarded;
    }
    if (roleId) {
      filter.roleIds = roleId;
    }
    if (q && q.trim()) {
      filter.$or = [
        { name: { $regex: q.trim(), $options: 'i' } },
        { email: { $regex: q.trim(), $options: 'i' } },
      ];
    }

    const sortFieldMap: Record<string, string> = {
      name: 'name',
      email: 'email',
      level: 'level',
      createdAt: 'createdAt',
      onboarded: 'isOnboarded',
    };
    const sortField = sortFieldMap[sortBy] || 'createdAt';

    const safeLimit = Math.min(Math.max(1, limit), 100);
    const skip = (Math.max(1, page) - 1) * safeLimit;

    const [total, students] = await Promise.all([
      Student.countDocuments(filter),
      Student.find(filter)
        .select('-passwordHash')
        .populate('departmentId', 'name')
        .populate('enrolledCourseIds', 'title code')
        .populate('roleIds', 'name slug')
        .sort({ [sortField]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
    ]);

    return {
      items: students,
      total,
      page: Math.max(1, page),
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async deleteById(id: string) {
    return Student.findByIdAndDelete(id);
  }
}

export interface StudentQueryOptions {
  departmentId?: string;
  level?: string;
  isOnboarded?: boolean;
  roleId?: string;
  q?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const studentRepository = new StudentRepository();

