import { Request, Response } from 'express';
import { reviewDeckService } from '../services/reviewDeck.service';
import { sendResponse } from '../utils/sendResponse';
import { AppError } from '../utils/AppError';
import { ReviewRating } from '../types/reviewDeck.types';

export class ReviewDeckController {
  getSummary = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id;
    const courseId = req.query.courseId as string | undefined;

    const summary = await reviewDeckService.getDeckSummary(studentId, courseId);
    return sendResponse(res, 200, 'Review deck summary retrieved successfully', summary);
  };

  getDueCards = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id;
    const courseId = req.query.courseId as string | undefined;
    let limit = parseInt(req.query.limit as string) || 30;
    if (limit > 100) limit = 100;

    const cards = await reviewDeckService.getDueCards(studentId, courseId, limit);
    return sendResponse(res, 200, 'Due review cards retrieved successfully', cards);
  };

  submitReview = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id;
    const cardId = req.params.cardId as string;
    const { rating } = req.body;

    if (!rating || !['again', 'good', 'easy'].includes(rating)) {
      throw new AppError('Valid rating is required: "again", "good", or "easy"', 400);
    }

    const updatedCard = await reviewDeckService.submitReview(studentId, cardId, rating as ReviewRating);
    return sendResponse(res, 200, 'Review submitted successfully', updatedCard);
  };

  addCard = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id;
    const { questionId } = req.body;

    if (!questionId) {
      throw new AppError('questionId is required', 400);
    }

    const card = await reviewDeckService.addCardManually(studentId, questionId);
    return sendResponse(res, 201, 'Question added to review deck successfully', card);
  };

  removeCard = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user.id;
    const cardId = req.params.cardId as string;

    const removed = await reviewDeckService.removeCard(studentId, cardId);
    if (!removed) {
      throw new AppError('Review card not found or already removed', 404);
    }

    return sendResponse(res, 200, 'Review card removed from deck successfully', { removed: true });
  };
}

export const reviewDeckController = new ReviewDeckController();
