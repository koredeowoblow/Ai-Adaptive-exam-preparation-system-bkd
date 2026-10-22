import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';
import { sendResponse } from '../utils/sendResponse';

export class AnalyticsController {
  getPlatformStats = async (req: Request, res: Response) => {
    const stats = await analyticsService.getPlatformAnalytics();
    return sendResponse(res, 200, 'Platform analytics retrieved successfully', stats);
  };

  getCourseStats = async (req: Request, res: Response) => {
    const stats = await analyticsService.getCourseAnalytics(req.params.courseId as string);
    return sendResponse(res, 200, 'Course analytics retrieved successfully', stats);
  };

  getDepartmentStats = async (req: Request, res: Response) => {
    const stats = await analyticsService.getDepartmentAnalytics(req.params.departmentId as string);
    return sendResponse(res, 200, 'Department analytics retrieved successfully', stats);
  };

  getTopicStats = async (req: Request, res: Response) => {
    const stats = await analyticsService.getTopicAnalytics(req.params.topicId as string);
    return sendResponse(res, 200, 'Topic analytics retrieved successfully', stats);
  };

  getStudentAnalytics = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = (req.params.studentId as string) || req.user.id;
    const stats = await analyticsService.getStudentAnalytics(studentId);
    return sendResponse(res, 200, 'Student analytics retrieved successfully', stats);
  };

  getCohortBenchmark = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = (req.params.studentId as string) || req.user.id;
    const stats = await analyticsService.getCohortBenchmark(studentId);
    return sendResponse(res, 200, 'Cohort benchmark retrieved successfully', stats);
  };
}

export const analyticsController = new AnalyticsController();
