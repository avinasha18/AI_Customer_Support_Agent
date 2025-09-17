import { Request, Response } from 'express';
import { authService } from '@/services/auth.service';
import { IAuthenticatedRequest, IApiResponse } from '@/types';
import { asyncHandler, createError } from '@/middlewares/error.middleware';
import { logger } from '@/utils/logger';

/**
 * Register a new user
 */
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password, firstName, lastName } = req.body;

  // Validate email format
  if (!authService.validateEmail(email)) {
    throw createError('Invalid email format', 400);
  }

  // Validate password strength
  const passwordValidation = authService.validatePassword(password);
  if (!passwordValidation.isValid) {
    throw createError(passwordValidation.message || 'Invalid password', 400);
  }

  const user = await authService.register({
    email,
    password,
    firstName,
    lastName,
  });

  const response: IApiResponse = {
    success: true,
    data: user,
    message: 'User registered successfully',
  };

  res.status(201).json(response);
});

/**
 * Login user
 */
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const result = await authService.login({ email, password });

  const response: IApiResponse = {
    success: true,
    data: {
      user: result.user,
      token: result.token,
    },
    message: 'Login successful',
  };

  res.status(200).json(response);
});

/**
 * Get current user profile
 */
export const getProfile = asyncHandler(async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const user = await authService.getUserProfile(req.user._id);

  const response: IApiResponse = {
    success: true,
    data: user,
  };

  res.status(200).json(response);
});

/**
 * Update user profile
 */
export const updateProfile = asyncHandler(async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { firstName, lastName } = req.body;

  // Validate that at least one field is provided
  if (!firstName && !lastName) {
    throw createError('At least one field must be provided for update', 400);
  }

  const user = await authService.updateUserProfile(req.user._id, {
    firstName,
    lastName,
  });

  const response: IApiResponse = {
    success: true,
    data: user,
    message: 'Profile updated successfully',
  };

  res.status(200).json(response);
});

/**
 * Change user password
 */
export const changePassword = asyncHandler(async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const { currentPassword, newPassword } = req.body;

  // Validate new password strength
  const passwordValidation = authService.validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    throw createError(passwordValidation.message || 'Invalid new password', 400);
  }

  await authService.changePassword(req.user._id, currentPassword, newPassword);

  const response: IApiResponse = {
    success: true,
    message: 'Password changed successfully',
  };

  res.status(200).json(response);
});

/**
 * Refresh JWT token
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  const result = await authService.refreshToken(refreshToken);

  const response: IApiResponse = {
    success: true,
    data: {
      token: result.token,
      refreshToken: result.refreshToken,
    },
    message: 'Token refreshed successfully',
  };

  res.status(200).json(response);
});

/**
 * Logout user (client-side token removal)
 */
export const logout = asyncHandler(async (req: IAuthenticatedRequest, res: Response): Promise<void> => {
  // In a stateless JWT system, logout is handled client-side
  // by removing the token from storage
  // For additional security, you could implement a token blacklist

  logger.info('User logged out', {
    userId: req.user?._id,
    email: req.user?.email,
  });

  const response: IApiResponse = {
    success: true,
    message: 'Logged out successfully',
  };

  res.status(200).json(response);
});

/**
 * Check if email is available
 */
export const checkEmailAvailability = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.query;

  if (!email || typeof email !== 'string') {
    throw createError('Email parameter is required', 400);
  }

  if (!authService.validateEmail(email)) {
    throw createError('Invalid email format', 400);
  }

  // This would typically check against the database
  // For now, we'll just validate the format
  const response: IApiResponse = {
    success: true,
    data: {
      available: true, // In a real implementation, check the database
    },
  };

  res.status(200).json(response);
});
