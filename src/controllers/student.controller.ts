import { Request, Response } from 'express';

import { studentService } from '../services/student.service';
import { sendResponse } from '../utils/sendResponse';

export class StudentController {
  getProfile = async (req: Request, res: Response) => {
    // @ts-ignore - req.user will be populated by auth middleware
    const studentId = req.user.id;
    const profile = await studentService.getStudentProfile(studentId);
    return sendResponse(res, 200, 'Student profile retrieved successfully', profile);
  };

  updateProfile = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id;
    const profile = await studentService.updateStudent(studentId, req.body);
    return sendResponse(res, 200, 'Profile updated successfully', profile);
  };

  completeOnboarding = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id || req.user._id;
    const profile = await studentService.completeOnboarding(studentId, req.body);
    return sendResponse(res, 200, 'Onboarding completed successfully', profile);
  };

  getEnrolledCourses = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id;
    const courses = await studentService.getEnrolledCourses(studentId);
    return sendResponse(res, 200, 'Enrolled courses retrieved successfully', courses);
  };

  enrollCourses = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id || req.user._id;
    const courseIds = req.body?.courseIds || (req.params.courseId ? [req.params.courseId] : []);
    const student = await studentService.enrollCourses(studentId, courseIds);
    return sendResponse(res, 200, 'Successfully enrolled in courses', student);
  };

  updateDepartment = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id;
    const student = await studentService.setDepartment(studentId, req.body.departmentId);
    return sendResponse(res, 200, 'Department updated successfully', student);
  };

  getStudentById = async (req: Request, res: Response) => {
    const profile = await studentService.getStudentProfile(req.params.id as string);
    return sendResponse(res, 200, 'Student retrieved successfully', profile);
  };

  getAll = async (req: Request, res: Response) => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const departmentId = req.query.departmentId as string | undefined;
    const level = req.query.level as string | undefined;
    const isOnboarded =
      req.query.isOnboarded === 'true'
        ? true
        : req.query.isOnboarded === 'false'
        ? false
        : undefined;
    const roleId = req.query.roleId as string | undefined;
    const q = req.query.q as string | undefined;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

    const result = await studentService.getAllStudents({
      page,
      limit,
      departmentId,
      level,
      isOnboarded,
      roleId,
      q,
      sortBy,
      sortOrder,
    });

    return sendResponse(res, 200, 'Students retrieved successfully', result);
  };

  updateStudentByAdmin = async (req: Request, res: Response) => {
    const student = await studentService.updateStudent(req.params.id as string, req.body);
    return sendResponse(res, 200, 'Student updated successfully', student);
  };

  deleteStudent = async (req: Request, res: Response) => {
    await studentService.deleteStudent(req.params.id as string);
    return sendResponse(res, 200, 'Student deleted successfully', null);
  };
}

export const studentController = new StudentController();
