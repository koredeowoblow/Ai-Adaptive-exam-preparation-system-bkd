import { Document, Types } from 'mongoose';

export interface IDepartment {
  name: string;
  description?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDepartmentDocument extends IDepartment, Document {}

export interface CreateDepartmentDTO {
  name: string;
  description?: string;
  createdBy: string;
}

export interface UpdateDepartmentDTO {
  name?: string;
  description?: string;
}
