import { Request, Response } from 'express';
import { courseService } from '../services/course.service';
import { sendResponse } from '../utils/sendResponse';

export class CourseController {
  create = async (req: Request, res: Response) => {
    const course = await courseService.createCourse(req.body);
    return sendResponse(res, 201, 'Course created successfully', course);
  };

  getAll = async (req: Request, res: Response) => {
    // @ts-ignore
    const tokenUser = req.user;
    let limit = parseInt(req.query.limit as string) || 20;
    if (limit > 100) limit = 100;
    const cursor = req.query.cursor as string | undefined;

    const items = await courseService.getCourses(tokenUser, limit, cursor);
      
    const nextCursor = items.length > 0 ? items[items.length - 1]._id : null;
    return sendResponse(res, 200, 'Courses retrieved successfully', { items, limit, nextCursor });
  };

  getById = async (req: Request, res: Response) => {
    // @ts-ignore
    const user = req.user;
    const course = await courseService.getCourseById(req.params.id as string, user);
    
    return sendResponse(res, 200, 'Course retrieved successfully', course);
  };

  getByDepartment = async (req: Request, res: Response) => {
    // @ts-ignore
    const user = req.user;
    const reqDeptId = req.params.departmentId as string;
    
    let limit = parseInt(req.query.limit as string) || 20;
    if (limit > 100) limit = 100;
    const cursor = req.query.cursor as string | undefined;

    const items = await courseService.getCoursesByDepartment(reqDeptId, user, limit, cursor);
    const nextCursor = items.length > 0 ? items[items.length - 1]._id : null;
    return sendResponse(res, 200, 'Department courses retrieved successfully', { items, limit, nextCursor });
  };

  update = async (req: Request, res: Response) => {
    const course = await courseService.updateCourse(req.params.id as string, req.body);
    return sendResponse(res, 200, 'Course updated successfully', course);
  };

  delete = async (req: Request, res: Response) => {
    await courseService.deleteCourse(req.params.id as string);
    return sendResponse(res, 200, 'Course deleted successfully');
  };
}

export const courseController = new CourseController();
