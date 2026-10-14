import { authRepository } from '../repositories/auth.repository';
import { AppError } from '../utils/AppError';
import { studentRepository } from '../repositories/student.repository';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export class AuthService {
  async registerStudent(data: any) {
    const existing = await authRepository.findUserByEmail(data.email);
    if (existing) {
      throw new AppError('Email already in use', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const student = await authRepository.createStudent({
      name: data.name,
      email: data.email,
      passwordHash,
    });

    const tokens = this.generateTokens(student.id);

    return {
      user: {
        id: student._id.toString(),
        name: student.name,
        email: student.email,
        departmentId: student.departmentId?.toString(),
        isOnboarded: (student as any).isOnboarded ?? false,
        role: 'student',
      },
      accessToken: tokens.accessToken,
      tokens,
    };
  }

  async login(data: any) {
    const student = await authRepository.findUserByEmail(data.email);
    if (!student) {
      throw new AppError('Invalid credentials', 401);
    }

    const isMatch = await bcrypt.compare(data.password, student.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    const populated = await (student as any).populate('roleIds');
    const roles = (populated?.roleIds as any[]) || [];
    let role = 'student';
    if (roles.some((r: any) => r.slug === 'superadmin')) {
      role = 'superAdmin';
    } else if (roles.some((r: any) => r.slug === 'admin')) {
      role = 'admin';
    }

    const tokens = this.generateTokens(student.id, role);

    return {
      user: {
        id: student._id.toString(),
        name: student.name,
        email: student.email,
        departmentId: student.departmentId?.toString(),
        isOnboarded: (student as any).isOnboarded ?? !!student.departmentId,
        role,
      },
      accessToken: tokens.accessToken,
      tokens,
    };
  }

  generateTokens(userId: string, role: string = 'student') {
    const accessToken = jwt.sign({ 
      id: userId, 
      type: role === 'admin' || role === 'superAdmin' ? 'admin' : 'student',
      role 
    }, env.JWT_SECRET, {
      expiresIn: '7d',
    });
    return { accessToken };
  }

  async getMe(userId: string) {

    const student = await studentRepository.findByIdWithRoles(userId);

    if (!student) {
      throw new AppError('User not found', 404);
    }

    const roles = (student.roleIds as any[]) || [];
    let role = 'student';
    if (roles.some((r: any) => r.slug === 'superadmin')) {
      role = 'superAdmin';
    } else if (roles.some((r: any) => r.slug === 'admin')) {
      role = 'admin';
    }

    return {
      id: student._id.toString(),
      _id: student._id.toString(),
      name: student.name,
      email: student.email,
      departmentId: student.departmentId?.toString(),
      level: (student as any).level ?? '100L',
      enrolledCourseIds: student.enrolledCourseIds,
      isOnboarded: (student as any).isOnboarded ?? !!student.departmentId,
      role,
      roles: roles.map((r: any) => r.slug),
    };
  }

}

export const authService = new AuthService();
