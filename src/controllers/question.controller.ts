import { Request, Response } from 'express';
import { questionService } from '../services/question.service';
import { sendResponse } from '../utils/sendResponse';

export class QuestionController {
  create = async (req: Request, res: Response) => {
    const question = await questionService.createQuestion(req.body);
    return sendResponse(res, 201, 'Question created successfully', question);
  };

  getAll = async (req: Request, res: Response) => {
    const courseId = req.query.courseId as string | undefined;
    const topicId = req.query.topicId as string | undefined;
    const q = req.query.q as string | undefined;
    const type = req.query.type as 'MULTIPLE_CHOICE' | 'THEORY' | 'all' | undefined;
    const difficulty = req.query.difficulty as string | undefined;
    const status = req.query.status as string | undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    let limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    if (limit > 100) limit = 100;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    const cursor = req.query.cursor as string | undefined;

    const result = await questionService.getAllQuestions({
      courseId,
      topicId,
      q,
      type,
      difficulty,
      status,
      page,
      limit,
      sortBy,
      sortOrder,
      cursor,
    });

    return sendResponse(res, 200, 'Questions retrieved successfully', result);
  };

  getById = async (req: Request, res: Response) => {
    const question = await questionService.getQuestionById(req.params.id as string);
    return sendResponse(res, 200, 'Question retrieved successfully', question);
  };

  getByTopic = async (req: Request, res: Response) => {
    let limit = parseInt(req.query.limit as string) || 20;
    if (limit > 100) limit = 100;
    const cursor = req.query.cursor as string | undefined;

    const items = await questionService.getQuestionsByTopic(req.params.topicId as string, limit, cursor);
    const nextCursor = items.length > 0 ? items[items.length - 1]._id : null;
    return sendResponse(res, 200, 'Topic questions retrieved successfully', { items, limit, nextCursor });
  };

  update = async (req: Request, res: Response) => {
    const question = await questionService.updateQuestion(req.params.id as string, req.body);
    return sendResponse(res, 200, 'Question updated successfully', question);
  };

  delete = async (req: Request, res: Response) => {
    await questionService.deleteQuestion(req.params.id as string);
    return sendResponse(res, 200, 'Question deleted successfully');
  };

  bulkCreate = async (req: Request, res: Response) => {
    const questions = await questionService.bulkCreateQuestions(req.body.questions);
    return sendResponse(res, 201, 'Questions created successfully', questions);
  };
}

export const questionController = new QuestionController();
