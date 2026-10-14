import { Role } from '../models/role.model';
import { Permission } from '../models/permission.model';
import { AuditLog } from '../models/audit-log.model';
import { Student } from '../models/student.model';
import { Types } from 'mongoose';
import { IRoleDocument, IPermissionDocument, IAuditLogDocument } from '../types/rbac.types';

export class RbacRepository {
  // Roles
  async createRole(data: Partial<IRoleDocument>): Promise<IRoleDocument> {
    return Role.create(data);
  }

  async findRoleById(roleId: string): Promise<IRoleDocument | null> {
    return Role.findById(roleId).populate('permissionIds');
  }

  async findRoleBySlug(slug: string): Promise<IRoleDocument | null> {
    return Role.findOne({ slug }).populate('permissionIds');
  }

  async updateRole(roleId: string, updates: Partial<IRoleDocument>): Promise<IRoleDocument | null> {
    return Role.findByIdAndUpdate(roleId, { $set: updates }, { new: true }).populate('permissionIds');
  }

  async deleteRole(roleId: string): Promise<void> {
    await Role.findByIdAndDelete(roleId);
  }

  async findAllRoles(): Promise<IRoleDocument[]> {
    return Role.find().populate('permissionIds');
  }

  // Permissions
  async createPermission(data: Partial<IPermissionDocument>): Promise<IPermissionDocument> {
    return Permission.create(data);
  }

  async findPermissionById(permId: string): Promise<IPermissionDocument | null> {
    return Permission.findById(permId);
  }

  async findPermissionBySlug(slug: string): Promise<IPermissionDocument | null> {
    return Permission.findOne({ slug });
  }

  async findAllPermissions(): Promise<IPermissionDocument[]> {
    return Permission.find();
  }

  // User Assignments (Atomic)
  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    await Student.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $addToSet: { roleIds: new Types.ObjectId(roleId) } }
    );
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await Student.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $pull: { roleIds: new Types.ObjectId(roleId) } }
    );
  }

  async setRolesForUser(userId: string, roleIds: string[]): Promise<void> {
    await Student.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $set: { roleIds: roleIds.map(id => new Types.ObjectId(id)) } }
    );
  }

  async findUserRoles(userId: string): Promise<IRoleDocument[]> {
    const student = await Student.findById(userId).populate('roleIds');
    return (student?.roleIds as unknown as IRoleDocument[]) || [];
  }

  // Audit Logs
  async logAudit(data: Partial<IAuditLogDocument>): Promise<void> {
    await AuditLog.create(data);
  }
}

export const rbacRepository = new RbacRepository();
