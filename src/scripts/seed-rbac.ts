import mongoose from 'mongoose';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { connectDatabase } from '../config/db';
import { createPermission, createRole, assignRole } from '../controllers/rbac.controller';
import { authController } from '../controllers/auth.controller';
import { rbacService } from '../services/rbac.service';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();

const DEFAULT_PERMISSIONS = [
  { resource: 'role', action: 'read', slug: 'role.read', name: 'Read Roles' },
  { resource: 'role', action: 'create', slug: 'role.create', name: 'Create Roles' },
  { resource: 'role', action: 'update', slug: 'role.update', name: 'Update Roles' },
  { resource: 'role', action: 'delete', slug: 'role.delete', name: 'Delete Roles' },
  { resource: 'permission', action: 'read', slug: 'permission.read', name: 'Read Permissions' },
  { resource: 'permission', action: 'create', slug: 'permission.create', name: 'Create Permissions' },
  { resource: 'user', action: 'assign-role', slug: 'user.assign-role', name: 'Assign User Roles' },
  { resource: 'user', action: 'remove-role', slug: 'user.remove-role', name: 'Remove User Roles' },
  { resource: 'question', action: 'read', slug: 'question.read', name: 'Read Questions' },
  { resource: 'question', action: 'create', slug: 'question.create', name: 'Create Questions' },
  { resource: 'question', action: 'update', slug: 'question.update', name: 'Update Questions' },
  { resource: 'question', action: 'delete', slug: 'question.delete', name: 'Delete Questions' },
];

const mockReq = (user: any, body: any = {}, params: any = {}): any => ({
  user,
  body,
  params,
});

class MockRes {
  statusCode: number = 200;
  responseData: any = null;

  status(code: number) {
    this.statusCode = code;
    return this;
  }

  json(data: any) {
    this.responseData = data;
    return this;
  }
}

export const seedRbac = async () => {
  if (process.env.NODE_ENV === 'production') {
    logger.error("Refusing to run seed-rbac script in production environment.");
    throw new Error("Refusing to run seed-rbac script in production environment.");
  }

  try {
    if (process.env.SUPERADMIN_BOOTSTRAP_ENABLED !== 'true') {
      logger.info('RBAC Bootstrap skipped');
      return;
    }

    await connectDatabase();
    logger.info('Starting RBAC Bootstrap via Controllers...');

    // Bypass privilege ceiling for empty database bootstrap
    const originalIsSuperAdmin = (rbacService as any).isUserSuperAdmin;
    (rbacService as any).isUserSuperAdmin = async () => true;

    // We need a dummy actor ID for the controller req.user._id
    const systemActor = { _id: new mongoose.Types.ObjectId().toString() };

    // 1. Create permissions
    const createdPermIds: string[] = [];
    for (const p of DEFAULT_PERMISSIONS) {
      const res = new MockRes();
      await createPermission(
        mockReq(systemActor, p) as Request,
        res as unknown as Response
      );
      if (res.responseData?.data?._id) {
        createdPermIds.push(res.responseData.data._id);
        logger.info(`Created permission: ${p.slug}`);
      }
    }

    // 2. Create SuperAdmin role
    const roleRes = new MockRes();
    await createRole(
      mockReq(systemActor, {
        name: 'Super Administrator',
        slug: 'superadmin',
        description: 'Protected system role with all permissions.',
        isSystem: true,
        isProtected: true,
        permissionIds: createdPermIds,
      }) as Request,
      roleRes as unknown as Response
    );
    const superAdminRole = roleRes.responseData?.data;
    if (superAdminRole) {
      logger.info('Created SuperAdmin role');
    }

    // Restore privilege ceiling
    (rbacService as any).isUserSuperAdmin = originalIsSuperAdmin;

    // 3. Assign SuperAdmin to configured user
    const superAdminEmail = process.env.SUPERADMIN_EMAIL;
    const superAdminPassword = process.env.SUPERADMIN_PASSWORD;
    if (superAdminEmail) {
      if (!superAdminPassword) {
        logger.error('SUPERADMIN_PASSWORD environment variable must be set');
        throw new Error('SUPERADMIN_PASSWORD environment variable is required');
      }
      // Create the user if they don't exist
      const authRes = new MockRes();
      await authController.register(
        mockReq(null, {
          email: superAdminEmail,
          password: superAdminPassword,
          name: 'System Admin'
        }) as Request,
        authRes as unknown as Response
      );
      
      const user = authRes.responseData?.data?.user;
      if (user && superAdminRole) {
        // Assign role using controller
        // Actor is the system actor, but we must bypass privilege ceiling again
        (rbacService as any).isUserSuperAdmin = async () => true;
        const assignRes = new MockRes();
        await assignRole(
          mockReq(systemActor, {}, { userId: user._id, roleId: superAdminRole._id }) as Request,
          assignRes as unknown as Response
        );
        (rbacService as any).isUserSuperAdmin = originalIsSuperAdmin;
        
        logger.info(`Assigned SuperAdmin role to ${superAdminEmail}`);
      }
    }

    logger.info('RBAC Bootstrap completed successfully!');
  } catch (error) {
    logger.error('RBAC Bootstrap failed:', error);
    throw error;
  } finally {
    if (require.main === module) {
      await mongoose.disconnect();
    }
  }
};

if (require.main === module) {
  seedRbac();
}
