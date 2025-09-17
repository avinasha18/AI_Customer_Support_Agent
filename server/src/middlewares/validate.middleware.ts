import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { logger } from '@/utils/logger';
import { validationError } from './error.middleware';

/**
 * Validation middleware factory
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body, query, and params
      const validatedData = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Replace original data with validated data
      req.body = validatedData.body || req.body;
      req.query = validatedData.query || req.query;
      req.params = validatedData.params || req.params;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(
          (err) => `${err.path.join('.')}: ${err.message}`
        );

        logger.warn('Validation failed', {
          errors: errorMessages,
          body: req.body,
          query: req.query,
          params: req.params,
        });

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errorMessages,
        });
        return;
      }

      logger.error('Validation middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      next(validationError('Validation error'));
    }
  };
};

/**
 * Common validation schemas
 */
export const validationSchemas = {
  // User registration
  register: z.object({
    body: z.object({
      email: z.string().email('Invalid email format'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
      firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
      lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
    }),
  }),

  // User login
  login: z.object({
    body: z.object({
      email: z.string().email('Invalid email format'),
      password: z.string().min(1, 'Password is required'),
    }),
  }),

  // Chat message
  chatMessage: z.object({
    body: z.object({
      message: z.string().min(1, 'Message is required').max(10000, 'Message too long'),
      conversationId: z.string().optional(),
      model: z.string().optional(),
      stream: z.boolean().optional(),
    }),
  }),

  // Conversation ID parameter
  conversationId: z.object({
    params: z.object({
      conversationId: z.string().min(1, 'Conversation ID is required'),
    }),
  }),

  // Pagination query
  pagination: z.object({
    query: z.object({
      page: z.string().transform(Number).optional(),
      limit: z.string().transform(Number).optional(),
    }),
  }),

  // Rename conversation
  renameConversation: z.object({
    params: z.object({
      conversationId: z.string().min(1, 'Conversation ID is required'),
    }),
    body: z.object({
      title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    }),
  }),

  // Update profile
  updateProfile: z.object({
    body: z.object({
      firstName: z.string().min(1, 'First name is required').max(50, 'First name too long').optional(),
      lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long').optional(),
    }),
  }),

  // Change password
  changePassword: z.object({
    body: z.object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    }),
  }),

  // Refresh token
  refreshToken: z.object({
    body: z.object({
      refreshToken: z.string().min(1, 'Refresh token is required'),
    }),
  }),
};

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
};

/**
 * Rate limiting for specific endpoints
 */
export const createRateLimit = (_windowMs: number, _max: number) => {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    // This is a simple in-memory rate limiter
    // In production, you should use redis or a proper rate limiting library
    // This is a placeholder - implement proper rate limiting
    next();
  };
};
