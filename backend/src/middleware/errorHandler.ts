import { Request, Response, NextFunction } from 'express';
import { ICustomError, ErrorType } from '../types';

/**
 * Custom error class for application-specific errors
 */
export class CustomError extends Error implements ICustomError {
  public type: ErrorType;
  public statusCode: number;
  public details?: any;

  constructor(
    message: string,
    type: ErrorType = 'PROCESSING_ERROR',
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.name = 'CustomError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, CustomError);
  }
}

/**
 * Main error handling middleware
 * @param err - Error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next function
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error details for debugging
  console.error('Error Details:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID format';
    error = new CustomError(message, 'VALIDATION_ERROR', 400);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value for ${field}. Please use another value.`;
    error = new CustomError(message, 'VALIDATION_ERROR', 400, { field });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val: any) => val.message).join(', ');
    error = new CustomError(message, 'VALIDATION_ERROR', 400, { fields: err.errors });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again.';
    error = new CustomError(message, 'AUTHENTICATION_ERROR', 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired. Please log in again.';
    error = new CustomError(message, 'AUTHENTICATION_ERROR', 401);
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File size too large. Please upload a smaller file.';
    error = new CustomError(message, 'VALIDATION_ERROR', 413);
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = 'Too many files. Please upload fewer files.';
    error = new CustomError(message, 'VALIDATION_ERROR', 413);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file type. Please check allowed file types.';
    error = new CustomError(message, 'VALIDATION_ERROR', 415);
  }

  // OpenAI API errors
  if (err.type === 'invalid_request_error') {
    const message = 'Invalid request to AI service. Please try again.';
    error = new CustomError(message, 'AI_SERVICE_ERROR', 400);
  }

  if (err.type === 'rate_limit_exceeded') {
    const message = 'AI service rate limit exceeded. Please try again later.';
    error = new CustomError(message, 'RATE_LIMIT_ERROR', 429);
  }

  if (err.type === 'insufficient_quota') {
    const message = 'AI service quota exceeded. Please contact support.';
    error = new CustomError(message, 'AI_SERVICE_ERROR', 402);
  }

  // MongoDB connection errors
  if (err.name === 'MongooseServerSelectionError' || err.name === 'MongoNetworkError') {
    const message = 'Database connection error. Please try again later.';
    error = new CustomError(message, 'DATABASE_ERROR', 503);
  }

  // File system errors
  if (err.code === 'ENOENT') {
    const message = 'File not found.';
    error = new CustomError(message, 'STORAGE_ERROR', 404);
  }

  if (err.code === 'ENOSPC') {
    const message = 'Not enough storage space.';
    error = new CustomError(message, 'STORAGE_ERROR', 507);
  }

  // Default to generic server error
  const statusCode = error.statusCode || 500;
  const errorType = error.type || 'PROCESSING_ERROR';
  const message = error.message || 'Internal server error';

  // Determine if error details should be exposed
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isCustomError = error instanceof CustomError;

  // Prepare error response
  const errorResponse: any = {
    success: false,
    error: errorType,
    message,
    ...(isCustomError && error.details && { details: error.details }),
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add stack trace in development
  if (isDevelopment) {
    errorResponse.stack = err.stack;
  }

  // Add request ID if available
  if (req.headers['x-request-id']) {
    errorResponse.requestId = req.headers['x-request-id'];
  }

  // Set appropriate headers
  res.status(statusCode);
  
  // Handle different content types
  const acceptsJson = req.accepts(['json', 'html']) === 'json';
  
  if (acceptsJson) {
    res.json(errorResponse);
  } else {
    // Fallback to text for non-JSON requests
    res.type('text').send(`Error ${statusCode}: ${message}`);
  }
};

/**
 * Not found handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new CustomError(
    `Route ${req.originalUrl} not found`,
    'NOT_FOUND_ERROR',
    404
  );
  next(error);
};

/**
 * Async error wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error helper
 */
export const validationError = (message: string, details?: any): CustomError => {
  return new CustomError(message, 'VALIDATION_ERROR', 400, details);
};

/**
 * Authentication error helper
 */
export const authenticationError = (message: string = 'Authentication required'): CustomError => {
  return new CustomError(message, 'AUTHENTICATION_ERROR', 401);
};

/**
 * Authorization error helper
 */
export const authorizationError = (message: string = 'Access denied'): CustomError => {
  return new CustomError(message, 'AUTHORIZATION_ERROR', 403);
};

/**
 * Not found error helper
 */
export const notFoundError = (resource: string = 'Resource'): CustomError => {
  return new CustomError(`${resource} not found`, 'NOT_FOUND_ERROR', 404);
};

/**
 * Processing error helper
 */
export const processingError = (message: string, details?: any): CustomError => {
  return new CustomError(message, 'PROCESSING_ERROR', 500, details);
};

/**
 * AI service error helper
 */
export const aiServiceError = (message: string, details?: any): CustomError => {
  return new CustomError(message, 'AI_SERVICE_ERROR', 503, details);
};

/**
 * Rate limit error helper
 */
export const rateLimitError = (message: string = 'Rate limit exceeded'): CustomError => {
  return new CustomError(message, 'RATE_LIMIT_ERROR', 429);
}; 