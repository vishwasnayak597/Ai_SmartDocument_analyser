import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { IAuthRequest } from '../types';

const router = express.Router();

// Generate JWT token
const generateToken = (userId: string, email: string, subscription: string): string => {
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
  return jwt.sign({ userId, email, subscription }, jwtSecret, { expiresIn: '7d' });
};

// POST /api/auth/register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('firstName').trim().isLength({ min: 2, max: 50 }),
  body('lastName').trim().isLength({ min: 2, max: 50 })
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password, firstName, lastName } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }

  const user = new User({ email, password, firstName, lastName });
  await user.save();

  const token = generateToken(user._id, user.email, user.subscription);

  res.status(201).json({
    success: true,
    data: { user: user.toJSON(), token },
    message: 'User registered successfully'
  });
}));

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = generateToken(user._id, user.email, user.subscription);

  res.json({
    success: true,
    data: { user: user.toJSON(), token },
    message: 'Login successful'
  });
}));

// GET /api/auth/profile
router.get('/profile', authMiddleware, asyncHandler(async (req: IAuthRequest, res: Response) => {
  res.json({
    success: true,
    data: { user: req.user!.toJSON() }
  });
}));

export default router; 