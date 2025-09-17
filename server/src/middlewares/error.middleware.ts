import { Request, Response, NextFunction } from 'express';
import { createRequestLogger } from '@/utils/logger';
import { IAppError } from '@/types';

/**
 * Custom error class for application errors
 */
export class AppError extends Error implements IAppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handling middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestLogger = createRequestLogger(req.headers['x-request-id'] as string || 'unknown');

  let statusCode = 500;
  let message = 'Internal server error';
  let isOperational = false;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    isOperational = error.isOperational;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.name === 'MongoError' && (error as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log error
  requestLogger.error('Request error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    statusCode,
    isOperational,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env['NODE_ENV'] === 'development' && {
      stack: error.stack,
      details: error.message,
    }),
  });
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const requestLogger = createRequestLogger(req.headers['x-request-id'] as string || 'unknown');

  requestLogger.warn('Route not found', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
};

/**
 * Async error wrapper
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create application error
 */
export const createError = (message: string, statusCode: number = 500): AppError => {
  return new AppError(message, statusCode);
};

/**
 * Validation error
 */
export const validationError = (message: string): AppError => {
  return new AppError(message, 400);
};

/**
 * Unauthorized error
 */
export const unauthorizedError = (message: string = 'Unauthorized'): AppError => {
  return new AppError(message, 401);
};

/**
 * Forbidden error
 */
export const forbiddenError = (message: string = 'Forbidden'): AppError => {
  return new AppError(message, 403);
};

/**
 * Not found error
 */
export const notFoundError = (message: string = 'Resource not found'): AppError => {
  return new AppError(message, 404);
};

/**
 * Conflict error
 */
export const conflictError = (message: string = 'Resource conflict'): AppError => {
  return new AppError(message, 409);
};
