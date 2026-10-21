import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UploadResult {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
  provider: 'cloudinary' | 'local';
}

class UploadService {
  private isCloudinaryConfigured = false;

  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const cloudinaryUrl = process.env.CLOUDINARY_URL;

    if (cloudinaryUrl || (cloudName && apiKey && apiSecret)) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.isCloudinaryConfigured = true;
      console.log('[UploadService] Cloudinary configured and enabled.');
    } else {
      console.log('[UploadService] Cloudinary credentials not detected; falling back to local static storage.');
    }
  }

  /**
   * Uploads an image diagram directly to Cloudinary via memory stream (zero server disk clutter),
   * or falls back to local disk storage if Cloudinary credentials are not present.
   */
  async uploadDiagram(file: Express.Multer.File): Promise<UploadResult> {
    if (!file || !file.buffer) {
      throw new Error('No image file buffer provided for upload');
    }

    // 1. If Cloudinary is configured, stream buffer directly to Cloudinary CDN
    if (this.isCloudinaryConfigured) {
      return new Promise<UploadResult>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'exam_diagrams',
            resource_type: 'image',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          },
          (error, result) => {
            if (error || !result) {
              return reject(error || new Error('Cloudinary upload returned empty result'));
            }
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              provider: 'cloudinary',
            });
          }
        );

        uploadStream.end(file.buffer);
      });
    }

    // 2. Local fallback storage (for offline development and unit tests)
    const uploadsDir = path.join(process.cwd(), 'uploads', 'diagrams');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(file.originalname) || '.png';
    const uniqueName = `diagram-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const filePath = path.join(uploadsDir, uniqueName);

    await fs.promises.writeFile(filePath, file.buffer);

    return {
      url: `/uploads/diagrams/${uniqueName}`,
      provider: 'local',
    };
  }
}

export const uploadService = new UploadService();
