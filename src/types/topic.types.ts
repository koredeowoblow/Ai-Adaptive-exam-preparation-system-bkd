import { Document, Types } from 'mongoose';

export interface ITopic {
  courseId: Types.ObjectId;
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITopicDocument extends ITopic, Document {}

export interface CreateTopicDTO {
  courseId: string;
  name: string;
  order?: number;
}

export interface UpdateTopicDTO {
  courseId?: string | Types.ObjectId;
  name?: string;
  order?: number;
}
