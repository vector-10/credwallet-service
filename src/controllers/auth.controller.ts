import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { asyncHandler } from '../utils/asyncHandler';

export class AuthController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  register = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.userService.register(req.body);
    res.status(201).json({ success: true, message: 'Account created successfully', data: result });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.userService.login(req.body);
    res.status(200).json({ success: true, message: 'Login successful', data: result });
  });
}
