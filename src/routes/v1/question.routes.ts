import { Router } from 'express';
import { questionController } from '../../controllers/question.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { createQuestionSchema, updateQuestionSchema } from '../../validators/question.validator';
import { asyncHandler } from '../../utils/asyncHandler';

import { protect } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(protect);

router.post('/', authorize('question.create'), validateRequest(createQuestionSchema), asyncHandler(questionController.create));
router.get('/', asyncHandler(questionController.getAll));
// Need a bulk schema in validator ideally, but simplified here
router.post('/bulk', authorize('question.create'), asyncHandler(questionController.bulkCreate)); 
router.get('/topic/:topicId', asyncHandler(questionController.getByTopic));
router.get('/:id', asyncHandler(questionController.getById));
router.put('/:id', authorize('question.update'), validateRequest(updateQuestionSchema), asyncHandler(questionController.update));
router.delete('/:id', authorize('question.delete'), asyncHandler(questionController.delete));

export const questionRoutes = router;
