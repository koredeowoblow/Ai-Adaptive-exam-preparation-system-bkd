import { Request, Response } from 'express';
import { departmentService } from '../services/department.service';
import { sendResponse } from '../utils/sendResponse';

export class DepartmentController {
  create = async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user?.id || req.user?._id;
    const department = await departmentService.createDepartment({
      ...req.body,
      createdBy: req.body.createdBy || userId,
    });
    return sendResponse(res, 201, 'Department created successfully', department);
  };

  getAll = async (req: Request, res: Response) => {
    let limit = parseInt(req.query.limit as string) || 20;
    if (limit > 100) limit = 100;
    const cursor = req.query.cursor as string | undefined;

    const items = await departmentService.getAllDepartments(limit, cursor);
    const nextCursor = items.length > 0 ? items[items.length - 1]._id : null;
    return sendResponse(res, 200, 'Departments retrieved successfully', { items, limit, nextCursor });
  };

  getById = async (req: Request, res: Response) => {
    const department = await departmentService.getDepartmentById(req.params.id as string);
    return sendResponse(res, 200, 'Department retrieved successfully', department);
  };

  update = async (req: Request, res: Response) => {
    const department = await departmentService.updateDepartment(req.params.id as string, req.body);
    return sendResponse(res, 200, 'Department updated successfully', department);
  };

  delete = async (req: Request, res: Response) => {
    await departmentService.deleteDepartment(req.params.id as string);
    return sendResponse(res, 200, 'Department deleted successfully');
  };
}

export const departmentController = new DepartmentController();
