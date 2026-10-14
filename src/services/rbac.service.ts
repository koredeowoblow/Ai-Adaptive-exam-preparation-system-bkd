import { rbacRepository } from '../repositories/rbac.repository';
import { authorizationService } from './authorization.service';
import { AppError } from '../utils/AppError';
import { Types } from 'mongoose';
import { IPermissionDocument, IRoleDocument } from '../types/rbac.types';

export class RbacService {
  /**
   * Privilege Ceiling Evaluation
   * Ensures an actor cannot grant permissions they do not possess.
   * SuperAdmin bypasses this.
   */
  private async enforcePrivilegeCeiling(actorId: string, targetPermissionIds: string[]): Promise<void> {
    const isSuperAdmin = await authorizationService.hasPermission(actorId, '*'); // Superadmin bypass check if we had wildcard. Actually we will just check if they are SuperAdmin.
    // Let's implement SuperAdmin bypass by checking if actor has the 'superadmin' role, or just evaluating their exact permissions.
    // If the actor has ALL permissions, they can grant anything.
    
    // Get actor's effective permissions (slugs)
    const actorPermissions = await authorizationService.resolveUserPermissions(actorId);
    const isActorSuperAdmin = await this.isUserSuperAdmin(actorId);

    if (isActorSuperAdmin) return; // SuperAdmin bypass

    // Get target permission slugs
    const targetPerms = await Promise.all(
      targetPermissionIds.map(id => rbacRepository.findPermissionById(id))
    );
    
    for (const perm of targetPerms) {
      if (perm && !actorPermissions.includes(perm.slug)) {
        throw new AppError(`Privilege ceiling exceeded: You cannot grant the permission '${perm.slug}' because you do not possess it.`, 403);
      }
    }
  }

  private async isUserSuperAdmin(userId: string): Promise<boolean> {
    const roles = await rbacRepository.findUserRoles(userId);
    return roles.some(r => r.slug === 'superadmin');
  }

  private async logAudit(actorId: string, action: string, result: 'success' | 'denied', reason?: string, details?: any) {
    await rbacRepository.logAudit({
      actorUserId: actorId ? new Types.ObjectId(actorId) : undefined,
      action,
      result,
      reason,
      metadata: details,
      timestamp: new Date()
    });
  }

  // ---- ROLE MANAGEMENT ----

  async createRole(actorId: string, data: Partial<IRoleDocument>) {
    try {
      // Prevent normal users from creating protected/system roles
      const isSuperAdmin = await this.isUserSuperAdmin(actorId);
      if ((data.isProtected || data.isSystem || data.slug === 'superadmin') && !isSuperAdmin) {
        throw new AppError('Only SuperAdmin can create protected or system roles.', 403);
      }

      if (data.permissionIds && data.permissionIds.length > 0) {
        await this.enforcePrivilegeCeiling(actorId, data.permissionIds.map(id => id.toString()));
      }

      const role = await rbacRepository.createRole({
        ...data,
        createdBy: new Types.ObjectId(actorId)
      });

      await this.logAudit(actorId, 'CREATE_ROLE', 'success', undefined, { roleId: role._id });
      return role;
    } catch (error: any) {
      await this.logAudit(actorId, 'CREATE_ROLE', 'denied', error.message, { data });
      throw error;
    }
  }

  async updateRole(actorId: string, roleId: string, data: Partial<IRoleDocument>) {
    try {
      const role = await rbacRepository.findRoleById(roleId);
      if (!role) throw new AppError('Role not found', 404);

      const isSuperAdmin = await this.isUserSuperAdmin(actorId);

      // SuperAdmin protection
      if (role.isProtected && !isSuperAdmin) {
        throw new AppError('Cannot modify a protected role without SuperAdmin privileges.', 403);
      }

      // Prevent renaming superadmin slug
      if (role.slug === 'superadmin' && data.slug && data.slug !== 'superadmin') {
        throw new AppError('Cannot rename the superadmin slug.', 403);
      }

      // Privilege ceiling on new permissions
      if (data.permissionIds) {
        await this.enforcePrivilegeCeiling(actorId, data.permissionIds.map(id => id.toString()));
      }

      const updated = await rbacRepository.updateRole(roleId, data);
      
      // Invalidate users caching this role
      await authorizationService.invalidateRole(roleId);

      await this.logAudit(actorId, 'UPDATE_ROLE', 'success', undefined, { roleId });
      return updated;
    } catch (error: any) {
      await this.logAudit(actorId, 'UPDATE_ROLE', 'denied', error.message, { roleId, data });
      throw error;
    }
  }

  async deleteRole(actorId: string, roleId: string) {
    try {
      const role = await rbacRepository.findRoleById(roleId);
      if (!role) throw new AppError('Role not found', 404);

      if (role.isProtected) {
        throw new AppError('Cannot delete a protected role.', 403);
      }

      await rbacRepository.deleteRole(roleId);
      await authorizationService.invalidateRole(roleId);

      await this.logAudit(actorId, 'DELETE_ROLE', 'success', undefined, { roleId });
    } catch (error: any) {
      await this.logAudit(actorId, 'DELETE_ROLE', 'denied', error.message, { roleId });
      throw error;
    }
  }

  // ---- PERMISSION MANAGEMENT ----

  async createPermission(actorId: string, data: Partial<IPermissionDocument>) {
    try {
      const isSuperAdmin = await this.isUserSuperAdmin(actorId);
      if (!isSuperAdmin) {
        throw new AppError('Only SuperAdmin can create permissions.', 403);
      }

      const perm = await rbacRepository.createPermission(data);
      await this.logAudit(actorId, 'CREATE_PERMISSION', 'success', undefined, { permissionId: perm._id });
      return perm;
    } catch (error: any) {
      await this.logAudit(actorId, 'CREATE_PERMISSION', 'denied', error.message, { data });
      throw error;
    }
  }

  // ---- USER ASSIGNMENTS ----

  async assignRoleToUser(actorId: string, targetUserId: string, roleId: string) {
    try {
      const role = await rbacRepository.findRoleById(roleId);
      if (!role) throw new AppError('Role not found', 404);

      const isSuperAdmin = await this.isUserSuperAdmin(actorId);
      if (role.slug === 'superadmin' && !isSuperAdmin) {
        throw new AppError('Only an existing SuperAdmin can assign the SuperAdmin role.', 403);
      }

      // Privilege ceiling: Actor must possess all permissions of the role they are assigning
      await this.enforcePrivilegeCeiling(actorId, role.permissionIds.map((p: any) => p._id.toString()));

      await rbacRepository.assignRoleToUser(targetUserId, roleId);
      await authorizationService.invalidateUser(targetUserId);

      await this.logAudit(actorId, 'ASSIGN_ROLE', 'success', undefined, { targetUserId, roleId });
    } catch (error: any) {
      await this.logAudit(actorId, 'ASSIGN_ROLE', 'denied', error.message, { targetUserId, roleId });
      throw error;
    }
  }

  async removeRoleFromUser(actorId: string, targetUserId: string, roleId: string) {
    try {
      const role = await rbacRepository.findRoleById(roleId);
      if (!role) throw new AppError('Role not found', 404);

      const isSuperAdmin = await this.isUserSuperAdmin(actorId);
      if (role.slug === 'superadmin' && !isSuperAdmin) {
        throw new AppError('Only an existing SuperAdmin can remove the SuperAdmin role.', 403);
      }

      await rbacRepository.removeRoleFromUser(targetUserId, roleId);
      await authorizationService.invalidateUser(targetUserId);

      await this.logAudit(actorId, 'REMOVE_ROLE', 'success', undefined, { targetUserId, roleId });
    } catch (error: any) {
      await this.logAudit(actorId, 'REMOVE_ROLE', 'denied', error.message, { targetUserId, roleId });
      throw error;
    }
  }

  // ---- GETTERS FOR CONTROLLERS ----
  async getRoles() {
    return rbacRepository.findAllRoles();
  }

  async getPermissions() {
    return rbacRepository.findAllPermissions();
  }

  async getUserRoles(userId: string) {
    return rbacRepository.findUserRoles(userId);
  }
}

export const rbacService = new RbacService();
