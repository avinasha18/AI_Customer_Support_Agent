import { Response, NextFunction } from 'express';
import { authService } from '@/services/auth.service';
import { IAuthenticatedRequest } from '@/types';
import { logger } from '@/utils/logger';

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = async (
  req: IAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required',
      });
      return;
    }

    const user = await authService.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    });
  }
};

/**
 * Middleware to optionally authenticate JWT tokens
 * Used for endpoints that work with or without authentication
 */
export const optionalAuth = async (
  req: IAuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const user = await authService.verifyToken(token);
        req.user = user;
      } catch (error) {
        // Token is invalid, but we continue without authentication
        logger.warn('Optional authentication failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Optional authentication error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next();
  }
};

/**
 * Middleware to check if user is authenticated
 */
export const requireAuth = (req: IAuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }
  next();
};
