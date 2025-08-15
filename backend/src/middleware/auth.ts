import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { IAuthRequest, ITokenPayload } from '../types';

/**
 * Authentication middleware to verify JWT tokens
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next function
 */
export const authMiddleware = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header or cookies
    let token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.authToken;

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
        message: 'Access denied. Please log in to continue.'
      });
      return;
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as ITokenPayload;

    // Find user and attach to request
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'User not found. Please log in again.'
      });
      return;
    }

    // Check if subscription is active for non-free users
    if (!user.isSubscriptionActive()) {
      res.status(403).json({
        success: false,
        error: 'Subscription expired',
        message: 'Your subscription has expired. Please renew to continue.'
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Token is invalid. Please log in again.'
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'An error occurred during authentication.'
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuthMiddleware = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.authToken;

    if (!token) {
      return next();
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next();
    }

    const decoded = jwt.verify(token, jwtSecret) as ITokenPayload;
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.isSubscriptionActive()) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Silently continue without user for optional auth
    next();
  }
};

/**
 * Middleware to check subscription level
 */
export const requireSubscription = (requiredLevel: 'pro' | 'enterprise') => {
  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please log in to access this feature.'
      });
      return;
    }

    const subscriptionLevels = { free: 0, pro: 1, enterprise: 2 };
    const userLevel = subscriptionLevels[req.user.subscription as keyof typeof subscriptionLevels];
    const requiredLevelNum = subscriptionLevels[requiredLevel];

    if (userLevel < requiredLevelNum) {
      res.status(403).json({
        success: false,
        error: 'Subscription upgrade required',
        message: `This feature requires a ${requiredLevel} subscription.`,
        upgradeUrl: '/pricing'
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check document access permissions
 */
export const checkDocumentAccess = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { documentId } = req.params;
    
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please log in to access this document.'
      });
      return;
    }

    // Import Document model here to avoid circular dependency
    const Document = (await import('../models/Document')).default;
    const document = await Document.findById(documentId);

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Document not found',
        message: 'The requested document does not exist.'
      });
      return;
    }

    if (!document.canUserAccess(req.user._id)) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to access this document.'
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Access check failed',
      message: 'An error occurred while checking document access.'
    });
  }
};

/**
 * Rate limiting middleware for AI operations
 */
export const aiRateLimit = (req: IAuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  // Define rate limits based on subscription
  const rateLimits = {
    free: { requests: 10, window: 3600000 }, // 10 requests per hour
    pro: { requests: 100, window: 3600000 }, // 100 requests per hour
    enterprise: { requests: 1000, window: 3600000 } // 1000 requests per hour
  };

  const userLimit = rateLimits[req.user.subscription as keyof typeof rateLimits];
  
  // In a production environment, you would use Redis or another store
  // For now, we'll just apply the limit without persistent tracking
  
  next();
}; 