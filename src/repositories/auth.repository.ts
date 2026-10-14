import { Student } from '../models/student.model';
import { RegisterDTO } from '../types/auth.types';

export class AuthRepository {
  async findUserByEmail(email: string) {
    return Student.findOne({ email }).select('+passwordHash');
  }

  async createStudent(data: RegisterDTO) {
    return Student.create(data);
  }
}

export const authRepository = new AuthRepository();
