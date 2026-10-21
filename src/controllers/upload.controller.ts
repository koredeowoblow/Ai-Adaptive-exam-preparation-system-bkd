import { Request, Response } from 'express';
import { uploadService } from '../services/upload.service';
import { sendResponse } from '../utils/sendResponse';
import { AppError } from '../utils/AppError';

export class UploadController {
  async uploadDiagram(req: Request, res: Response) {
    if (!req.file) {
      throw new AppError('No image file uploaded. Please provide an image under the "image" field.', 400);
    }

    const result = await uploadService.uploadDiagram(req.file);

    sendResponse(res, 201, 'Diagram uploaded successfully', result);
  }
}

export const uploadController = new UploadController();
