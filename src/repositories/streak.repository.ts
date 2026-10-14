import { StreakRecord } from '../models/streak.model';

export class StreakRepository {
  async findByStudent(studentId: string) {
    return StreakRecord.findOne({ studentId });
  }

  async create(studentId: string) {
    return StreakRecord.create({ studentId });
  }

  async update(id: string, updates: any) {
    return StreakRecord.findByIdAndUpdate(id, updates, { new: true });
  }
}

export const streakRepository = new StreakRepository();
