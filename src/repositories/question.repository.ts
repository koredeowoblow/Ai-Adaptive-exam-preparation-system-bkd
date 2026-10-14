import { Question } from '../models/question.model';
import { Topic } from '../models/topic.model';
import { CreateQuestionDTO, UpdateQuestionDTO } from '../types/question.types';
import { cacheService } from '../utils/cache';

export interface QuestionQueryOptions {
  courseId?: string;
  topicId?: string;
  q?: string;
  type?: 'MULTIPLE_CHOICE' | 'THEORY' | 'all';
  difficulty?: string | number;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  cursor?: string;
}

export class QuestionRepository {
  private readonly CACHE_TTL = 3600;

  async create(data: CreateQuestionDTO) {
    const question = await Question.create(data);
    await cacheService.deleteByPattern('questions:*');
    return question;
  }

  async findById(id: string) {
    const key = `questions:id:${id}`;
    return cacheService.getOrSetSingleFlight(key, this.CACHE_TTL, async () => {
      return Question.findById(id).populate('topicId', 'name');
    });
  }

  async findManyByIds(ids: string[]) {
    return Question.find({ _id: { $in: ids } }).populate('topicId', 'name');
  }

  async findByTopicId(topicId: string, limit: number = 20, cursor?: string) {
    const key = `questions:topic:${topicId}:limit:${limit}:cursor:${cursor || 'null'}`;
    return cacheService.getOrSetSingleFlight(key, this.CACHE_TTL, async () => {
      const filter: any = { topicId };
      if (cursor) filter._id = { $lt: cursor };
      return Question.find(filter)
        .populate({
          path: 'topicId',
          select: 'name courseId',
          populate: { path: 'courseId', select: 'title code' },
        })
        .sort({ _id: -1 })
        .limit(limit);
    });
  }

  async findAll(options: QuestionQueryOptions = {}) {
    const key = `questions:all:${JSON.stringify(options)}`;
    return cacheService.getOrSetSingleFlight(key, this.CACHE_TTL, async () => {
      const filter: any = {};

      if (options.topicId) {
        filter.topicId = options.topicId;
      } else if (options.courseId) {
        const topics = await Topic.find({ courseId: options.courseId }).select('_id');
        filter.topicId = { $in: topics.map((t) => t._id) };
      }

      if (options.q && options.q.trim()) {
        filter.questionText = { $regex: options.q.trim(), $options: 'i' };
      }

      if (options.type && options.type !== 'all') {
        filter.type = options.type;
      }

      if (options.difficulty) {
        if (options.difficulty === 'easy') {
          filter.difficulty = { $lte: 3 };
        } else if (options.difficulty === 'medium') {
          filter.difficulty = { $gte: 4, $lte: 7 };
        } else if (options.difficulty === 'hard') {
          filter.difficulty = { $gte: 8 };
        } else if (!isNaN(Number(options.difficulty))) {
          filter.difficulty = Number(options.difficulty);
        }
      }

      if (options.status === 'complete') {
        filter.$or = [
          { type: 'THEORY', modelAnswer: { $exists: true, $ne: '' } },
          { type: { $ne: 'THEORY' }, 'options.1': { $exists: true } },
        ];
      } else if (options.status === 'incomplete') {
        filter.$or = [
          { type: 'THEORY', $or: [{ modelAnswer: { $exists: false } }, { modelAnswer: '' }] },
          { type: { $ne: 'THEORY' }, $or: [{ options: { $exists: false } }, { options: { $size: 0 } }, { 'options.1': { $exists: false } }] },
        ];
      }

      const sortOrderVal = options.sortOrder === 'asc' ? 1 : -1;
      const sortObj: any = {};
      if (options.sortBy === 'prompt') {
        sortObj.questionText = sortOrderVal;
      } else if (options.sortBy === 'difficulty') {
        sortObj.difficulty = sortOrderVal;
      } else if (options.sortBy === 'elo') {
        sortObj.eloRating = sortOrderVal;
      } else {
        sortObj.createdAt = sortOrderVal;
        sortObj._id = -1;
      }

      const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));
      const page = Math.max(1, Number(options.page) || 1);
      const skip = (page - 1) * limit;

      const [total, items] = await Promise.all([
        Question.countDocuments(filter),
        Question.find(filter)
          .populate({
            path: 'topicId',
            select: 'name courseId',
            populate: { path: 'courseId', select: 'title code' },
          })
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        nextCursor: items.length > 0 ? (items[items.length - 1] as any)._id : null,
      };
    });
  }

  async findOptimalQuestion(topicId: string, targetElo: number, excludedQuestionIds: string[]) {
    const mongoose = require('mongoose');
    const topicObjectId = new mongoose.Types.ObjectId(topicId);
    const excludedObjectIds = excludedQuestionIds.map(id => new mongoose.Types.ObjectId(id));

    // Execute twin queries bounded by the { topicId: 1, eloRating: 1 } index
    const [above, below] = await Promise.all([
      Question.find({ 
        topicId: topicObjectId, 
        _id: { $nin: excludedObjectIds }, 
        eloRating: { $gte: targetElo } 
      }).sort({ eloRating: 1 }).limit(3).lean(),
      
      Question.find({ 
        topicId: topicObjectId, 
        _id: { $nin: excludedObjectIds }, 
        eloRating: { $lt: targetElo } 
      }).sort({ eloRating: -1 }).limit(3).lean()
    ]);

    const candidates = [...above, ...below];
    if (candidates.length === 0) return null;

    const anyCandidates = candidates as any[];
    // Calculate absolute difference in memory for the tiny candidate set
    anyCandidates.forEach((q: any) => {
      q.eloDifference = Math.abs(q.eloRating - targetElo);
    });

    // Sort by closest match
    anyCandidates.sort((a: any, b: any) => a.eloDifference - b.eloDifference);

    // Filter to those that share the absolute closest distance
    const closestDistance = anyCandidates[0].eloDifference;
    const bestCandidates = anyCandidates.filter((q: any) => q.eloDifference === closestDistance);

    // Pick 1 randomly to prevent exact determinism if multiple questions have the same Elo
    const selected = bestCandidates[Math.floor(Math.random() * bestCandidates.length)];
    
    // We used lean(), so if the service expects a mongoose doc, we could fetch by ID, 
    // but the service doesn't call .save() on the returned question anymore, so lean is safe!
    return selected;
  }

  async findManyOptimalQuestions(
    topicId: string,
    targetElo: number,
    excludedQuestionIds: string[],
    limit: number,
    questionType?: 'MULTIPLE_CHOICE' | 'THEORY',
  ) {
    if (limit <= 0) return [];

    const mongoose = require('mongoose');
    const topicObjectId = new mongoose.Types.ObjectId(topicId);
    const excludedObjectIds = excludedQuestionIds.map(id => new mongoose.Types.ObjectId(id));

    const typeFilter = questionType ? { type: questionType } : {};

    // Fetch double the limit from both sides to ensure we have enough candidates
    const searchLimit = limit * 2;
    const [above, below] = await Promise.all([
      Question.find({ 
        topicId: topicObjectId, 
        _id: { $nin: excludedObjectIds }, 
        eloRating: { $gte: targetElo },
        ...typeFilter
      }).sort({ eloRating: 1 }).limit(searchLimit).lean(),
      
      Question.find({ 
        topicId: topicObjectId, 
        _id: { $nin: excludedObjectIds }, 
        eloRating: { $lt: targetElo },
        ...typeFilter
      }).sort({ eloRating: -1 }).limit(searchLimit).lean()
    ]);

    const candidates = [...above, ...below] as any[];
    if (candidates.length === 0) return [];

    candidates.forEach(q => {
      q.eloDifference = Math.abs(q.eloRating - targetElo);
    });

    // Sort by closest match
    candidates.sort((a, b) => a.eloDifference - b.eloDifference);

    // Slice the top `limit` results
    const selected = candidates.slice(0, limit);

    // Shuffle the result slightly to prevent exactly identical batches for same targetElo
    for (let i = selected.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [selected[i], selected[j]] = [selected[j], selected[i]];
    }
    
    return selected;
  }

  async countByTopic(topicId: string) {
    return Question.countDocuments({ topicId });
  }

  async bulkCreate(data: CreateQuestionDTO[]) {
    const questions = await Question.insertMany(data);
    await cacheService.deleteByPattern('questions:*');
    return questions;
  }

  async updateById(id: string, data: UpdateQuestionDTO) {
    const updated = await Question.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    await cacheService.deleteByPattern('questions:*');
    return updated;
  }

  async deleteById(id: string) {
    const deleted = await Question.findByIdAndDelete(id);
    await cacheService.deleteByPattern('questions:*');
    return deleted;
  }

  async findByIdDirect(id: string) {
    return Question.findById(id).populate('topicId', 'name');
  }

  async bulkUpdateStats(operations: any[]) {
    const res = await Question.bulkWrite(operations);
    const ids = operations
      .map((op: any) => op.updateOne?.filter?._id)
      .filter(Boolean);
    await Promise.all(
      ids.map((id: any) => cacheService.delete(`questions:id:${id.toString()}`))
    );
    return res;
  }

  async updateTopicIds(oldTopicId: string, newTopicId: string) {
    const res = await Question.updateMany({ topicId: oldTopicId }, { topicId: newTopicId });
    await cacheService.deleteByPattern('questions:*');
    return res;
  }

  async deleteByTopicId(topicId: string) {
    const res = await Question.deleteMany({ topicId });
    await cacheService.deleteByPattern('questions:*');
    return res;
  }

  async incrementAnswerCounters(questionId: string, isCorrect: boolean) {
    const res = await Question.updateOne(
      { _id: questionId },
      {
        $inc: {
          timesAnswered: 1,
          exposureCount: 1,
          timesCorrect: isCorrect ? 1 : 0,
        }
      }
    );
    await cacheService.delete(`questions:id:${questionId.toString()}`);
    return res;
  }

  async updateEloConditionally(questionId: any, currentElo: number, newElo: number) {
    const result = await Question.updateOne(
      { _id: questionId, eloRating: currentElo },
      { $set: { eloRating: Math.max(0, newElo) } }
    );
    if (result.modifiedCount > 0) {
      await cacheService.delete(`questions:id:${questionId.toString()}`);
    }
    return result;
  }
}

export const questionRepository = new QuestionRepository();
