import { Request, Response } from 'express';
import { topicService } from '../services/topic.service';
import { sendResponse } from '../utils/sendResponse';

export class TopicController {
  create = async (req: Request, res: Response) => {
    const topic = await topicService.createTopic(req.body);
    return sendResponse(res, 201, 'Topic created successfully', topic);
  };

  getAll = async (req: Request, res: Response) => {
    const courseId = req.query.courseId as string | undefined;
    let limit = parseInt(req.query.limit as string) || 20;
    if (limit > 100) limit = 100;
    const cursor = req.query.cursor as string | undefined;

    const items = await topicService.getAllTopics(courseId, limit, cursor);
    const nextCursor = items.length > 0 ? items[items.length - 1]._id : null;
    return sendResponse(res, 200, 'Topics retrieved successfully', { items, limit, nextCursor });
  };

  getById = async (req: Request, res: Response) => {
    const topic = await topicService.getTopicById(req.params.id as string);
    return sendResponse(res, 200, 'Topic retrieved successfully', topic);
  };

  getByCourse = async (req: Request, res: Response) => {
    let limit = parseInt(req.query.limit as string) || 20;
    if (limit > 100) limit = 100;
    const cursor = req.query.cursor as string | undefined;

    const items = await topicService.getTopicsByCourse(req.params.courseId as string, limit, cursor);
    const nextCursor = items.length > 0 ? items[items.length - 1]._id : null;
    return sendResponse(res, 200, 'Course topics retrieved successfully', { items, limit, nextCursor });
  };

  update = async (req: Request, res: Response) => {
    const topic = await topicService.updateTopic(req.params.id as string, req.body);
    return sendResponse(res, 200, 'Topic updated successfully', topic);
  };

  delete = async (req: Request, res: Response) => {
    await topicService.deleteTopic(req.params.id as string);
    return sendResponse(res, 200, 'Topic deleted successfully');
  };
}

export const topicController = new TopicController();
