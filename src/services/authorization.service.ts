import { cacheService } from '../utils/cache';
import { studentRepository } from '../repositories/student.repository';
import { logger } from '../utils/logger';

export class AuthorizationService {
  private readonly CACHE_TTL = 60; // 60 seconds

  /**
   * Resolves the effective permissions for a user, using Redis cache if available.
   */
  async resolveUserPermissions(userId: string): Promise<string[]> {
    const cacheKey = `authz:user:${userId}`;

    // SingleFlight ensures multiple concurrent requests only trigger 1 DB hit
    return cacheService.getOrSetSingleFlight(
      cacheKey,
      this.CACHE_TTL,
      async () => {
        try {
          const student = await studentRepository.findByIdWithRolesAndPermissions(userId);

          if (!student) {
            return [];
          }

          const permissions = new Set<string>();

          // Extract unique permission slugs
          const roles = student.roleIds as any[];
          for (const role of roles) {
            const perms = role.permissionIds as any[];
            for (const perm of perms) {
              if (perm && perm.slug) {
                permissions.add(perm.slug);
              }
            }
          }

          return Array.from(permissions);
        } catch (error) {
          logger.error(`Error resolving permissions for user ${userId}:`, error);
          throw error;
        }
      }
    );
  }

  /**
   * Checks if a user has a specific permission.
   */
  async hasPermission(userId: string, permissionSlug: string): Promise<boolean> {
    const student = await studentRepository.findByIdWithRoles(userId);
    if (student && student.roleIds && student.roleIds.some((r: any) => r.slug === 'superadmin' || r.slug === 'admin')) {
      return true; // Superadmin / Admin bypass
    }
    
    const permissions = await this.resolveUserPermissions(userId);
    return permissions.includes(permissionSlug) || permissions.includes('*');
  }

  /**
   * Invalidates the authorization cache for a specific user.
   */
  async invalidateUser(userId: string): Promise<void> {
    const cacheKey = `authz:user:${userId}`;
    await cacheService.delete(cacheKey);
  }

  /**
   * Invalidates the authorization cache for ALL users possessing a specific role.
   * Uses bounded batching to prevent Redis/Node event loop blocking on huge data sets.
   */
  async invalidateRole(roleId: string): Promise<void> {
    const batchSize = 500;
    let skip = 0;
    
    try {
      while (true) {
        // Find users with this role
        const users = await studentRepository.findUsersByRole(roleId, skip, batchSize);

        if (users.length === 0) {
          break; // Done
        }

        const keysToDelete = users.map((u: any) => `authz:user:${u._id.toString()}`);
        
        // Parallel delete for the batch
        await Promise.all(keysToDelete.map(key => cacheService.delete(key)));

        skip += batchSize;
      }
    } catch (error) {
      logger.error(`Error invalidating cache for role ${roleId}:`, error);
      // We log but don't strictly crash the calling mutation, 
      // since the TTL limits exposure to max 60s anyway.
    }
  }
}

export const authorizationService = new AuthorizationService();
