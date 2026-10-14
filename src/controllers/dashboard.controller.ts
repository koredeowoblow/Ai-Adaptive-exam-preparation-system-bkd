import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { sendResponse } from '../utils/sendResponse';

export class DashboardController {
  getStudentDashboard = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id;
    const dashboard = await dashboardService.getStudentDashboard(studentId);
    return sendResponse(res, 200, 'Student dashboard retrieved successfully', dashboard);
  };

  getCourseDashboard = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id;
    const courseId = req.params.courseId as string;
    const dashboard = await dashboardService.getCourseDashboard(studentId, courseId);
    return sendResponse(res, 200, 'Course dashboard retrieved successfully', dashboard);
  };
}

export const dashboardController = new DashboardController();
