import { Router } from 'express';
import { protect } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import * as rbacController from '../../controllers/rbac.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// Protect all RBAC routes
router.use(protect);

// ---- ROLES ----
router.get('/roles', authorize('role.read'), asyncHandler(rbacController.getRoles));
router.post('/roles', authorize('role.create'), asyncHandler(rbacController.createRole));
router.patch('/roles/:id', authorize('role.update'), asyncHandler(rbacController.updateRole));
router.delete('/roles/:id', authorize('role.delete'), asyncHandler(rbacController.deleteRole));

// ---- PERMISSIONS ----
router.get('/permissions', authorize('permission.read'), asyncHandler(rbacController.getPermissions));
router.post('/permissions', authorize('permission.create'), asyncHandler(rbacController.createPermission));

// ---- USER ROLE ASSIGNMENTS ----
router.get('/users/:userId/roles', authorize('role.read'), asyncHandler(rbacController.getUserRoles));
router.post('/users/:userId/roles/:roleId', authorize('user.assign-role'), asyncHandler(rbacController.assignRole));
router.delete('/users/:userId/roles/:roleId', authorize('user.remove-role'), asyncHandler(rbacController.removeRole));

export default router;
