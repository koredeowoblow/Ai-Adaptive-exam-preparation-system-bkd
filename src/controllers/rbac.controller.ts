import { Request, Response, NextFunction } from 'express';
import { rbacService } from '../services/rbac.service';

export const createRole = async (req: Request, res: Response) => {
  // @ts-ignore
    const role = await rbacService.createRole(req.user._id, req.body);
    res.status(201).json({ success: true, data: role });
};

export const updateRole = async (req: Request, res: Response) => {
  // @ts-ignore
    const role = await rbacService.updateRole(req.user._id, req.params.id as string, req.body);
    res.status(200).json({ success: true, data: role });
};

export const deleteRole = async (req: Request, res: Response) => {
  // @ts-ignore
    await rbacService.deleteRole(req.user._id, req.params.id as string);
    res.status(200).json({ success: true, data: {} });
};

export const getRoles = async (req: Request, res: Response) => {
  const roles = await rbacService.getRoles();
    res.status(200).json({ success: true, data: roles });
};

export const createPermission = async (req: Request, res: Response) => {
  // @ts-ignore
    const perm = await rbacService.createPermission(req.user._id, req.body);
    res.status(201).json({ success: true, data: perm });
};

export const getPermissions = async (req: Request, res: Response) => {
  const perms = await rbacService.getPermissions();
    res.status(200).json({ success: true, data: perms });
};

export const assignRole = async (req: Request, res: Response) => {
  // @ts-ignore
    await rbacService.assignRoleToUser(req.user._id, req.params.userId as string, req.params.roleId as string);
    res.status(200).json({ success: true, data: {} });
};

export const removeRole = async (req: Request, res: Response) => {
  // @ts-ignore
    await rbacService.removeRoleFromUser(req.user._id, req.params.userId as string, req.params.roleId as string);
    res.status(200).json({ success: true, data: {} });
};

export const getUserRoles = async (req: Request, res: Response) => {
  const roles = await rbacService.getUserRoles(req.params.userId as string);
    res.status(200).json({ success: true, data: roles });
};
