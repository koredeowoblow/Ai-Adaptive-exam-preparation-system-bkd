import { Router } from 'express';
import { topicController } from '../../controllers/topic.controller';
import { questionController } from '../../controllers/question.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { createTopicSchema, updateTopicSchema } from '../../validators/topic.validator';
import { asyncHandler } from '../../utils/asyncHandler';

import { protect } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(protect);

router.post('/', authorize('topic.create'), validateRequest(createTopicSchema), asyncHandler(topicController.create));
router.get('/', asyncHandler(topicController.getAll));
router.get('/course/:courseId', asyncHandler(topicController.getByCourse));
router.get('/:id', asyncHandler(topicController.getById));
router.get('/:topicId/questions', authorize('question.read'), asyncHandler(questionController.getByTopic));
router.put('/:id', authorize('topic.update'), validateRequest(updateTopicSchema), asyncHandler(topicController.update));
router.delete('/:id', authorize('topic.delete'), asyncHandler(topicController.delete));

export const topicRoutes = router;
