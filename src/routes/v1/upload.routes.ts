import { Router } from 'express';
import multer from 'multer';
import { uploadController } from '../../controllers/upload.controller';
import { protect } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';

const router = Router();

// Configure multer memory storage (zero disk footprint, directly streamed)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/svg+xml',
      'image/gif',
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Only PNG, JPEG, SVG, WebP, and GIF images are allowed.', 400));
    }
  },
});

router.use(protect);

router.post(
  '/diagram',
  authorize('question.create'),
  upload.single('image'),
  asyncHandler(uploadController.uploadDiagram)
);

export const uploadRoutes = router;
