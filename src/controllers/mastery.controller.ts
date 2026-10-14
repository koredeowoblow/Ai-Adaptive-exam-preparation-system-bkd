import { Request, Response } from 'express';
import { masteryService } from '../services/mastery.service';
import { sendResponse } from '../utils/sendResponse';

export class MasteryController {
  getStudentMastery = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id;
    let limit = parseInt(req.query.limit as string) || 20;
    if (limit > 100) limit = 100;
    const cursor = req.query.cursor as string | undefined;
    
    const items = await masteryService.getStudentMastery(studentId, limit, cursor);
    const nextCursor = items.length > 0 ? items[items.length - 1]._id : null;
    return sendResponse(res, 200, 'Student mastery retrieved successfully', { items, limit, nextCursor });
  };

  getCourseMastery = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id;
    let limit = parseInt(req.query.limit as string) || 20;
    if (limit > 100) limit = 100;
    const cursor = req.query.cursor as string | undefined;
    
    const items = await masteryService.getCourseMastery(studentId, req.params.courseId as string, limit, cursor);
    const nextCursor = items.length > 0 ? items[items.length - 1]._id : null;
    return sendResponse(res, 200, 'Course mastery retrieved successfully', { items, limit, nextCursor });
  };

  getTopicMastery = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id;
    const record = await masteryService.getTopicMastery(studentId, req.params.topicId as string);
    if (!record) {
      return sendResponse(res, 404, 'Mastery record not found for this topic');
    }
    return sendResponse(res, 200, 'Topic mastery retrieved successfully', record);
  };
}

export const masteryController = new MasteryController();
