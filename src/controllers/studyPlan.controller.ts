import { Request, Response } from 'express';
import { studyPlanService } from '../services/studyPlan.service';
import { sendResponse } from '../utils/sendResponse';
import { AppError } from '../utils/AppError';

export class StudyPlanController {
  generatePlan = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id || req.user._id;
    const plan = await studyPlanService.generatePlan(studentId);
    return sendResponse(res, 201, 'Study plan generated successfully', { plan });
  };

  getActivePlan = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id || req.user._id;
    const plan = await studyPlanService.getActivePlan(studentId);
    return sendResponse(res, 200, 'Active study plan retrieved', { plan });
  };

  getPlanById = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id || req.user._id;
    const planId = req.params.planId as string;
    const plan = await studyPlanService.getPlanById(studentId, planId);
    return sendResponse(res, 200, 'Study plan retrieved', { plan });
  };

  updateTask = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id || req.user._id;
    const planId = req.params.planId as string;
    const taskId = req.params.taskId as string;
    const { completed } = req.body;

    if (typeof completed !== 'boolean') {
      throw new AppError('Field "completed" must be a boolean', 400);
    }

    const result = await studyPlanService.updateTaskCompletion(
      studentId,
      planId,
      taskId,
      completed
    );

    return sendResponse(res, 200, 'Task status updated', result);
  };

  generateWeek = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id || req.user._id;
    const planId = req.params.planId as string;
    const n = req.params.n as string;
    const weekNumber = parseInt(n, 10);

    if (isNaN(weekNumber) || weekNumber < 1) {
      throw new AppError('Invalid week number', 400);
    }

    const plan = await studyPlanService.generateWeek(studentId, planId, weekNumber);
    return sendResponse(res, 200, `Week ${weekNumber} generated successfully`, { plan });
  };

  retryWeek = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id || req.user._id;
    const planId = req.params.planId as string;
    const n = req.params.n as string;
    const weekNumber = parseInt(n, 10);

    if (isNaN(weekNumber) || weekNumber < 1) {
      throw new AppError('Invalid week number', 400);
    }

    const plan = await studyPlanService.retryWeek(studentId, planId, weekNumber);
    return sendResponse(res, 200, `Week ${weekNumber} retry completed`, { plan });
  };
}

export const studyPlanController = new StudyPlanController();
