import { Schema, model } from 'mongoose';
import { ITopicDocument } from '../types/topic.types';

const TopicSchema = new Schema<ITopicDocument>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Topic name is required'],
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

TopicSchema.index({ courseId: 1, order: 1 });
// Compound index for fast cursor pagination and filtering by course
TopicSchema.index({ courseId: 1, _id: -1 });
// A course shouldn't have duplicate topic names
TopicSchema.index({ courseId: 1, name: 1 }, { unique: true });

export const Topic = model<ITopicDocument>('Topic', TopicSchema);
