import { Router } from 'express';
import { reviewDeckController } from '../../controllers/reviewDeck.controller';
import { protect } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.use(protect);

router.get('/summary', asyncHandler(reviewDeckController.getSummary));
router.get('/due', asyncHandler(reviewDeckController.getDueCards));
router.post('/add', asyncHandler(reviewDeckController.addCard));
router.post('/:cardId/review', asyncHandler(reviewDeckController.submitReview));
router.delete('/:cardId', asyncHandler(reviewDeckController.removeCard));

export const reviewDeckRoutes = router;
