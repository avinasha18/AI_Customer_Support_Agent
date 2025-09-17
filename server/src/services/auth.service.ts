import jwt from 'jsonwebtoken';
import { User } from '@/models/user.model';
import { config } from '@/config';
import { IUserCreate, IUserLogin, IUserResponse, IJwtPayload } from '@/types';
import { logger } from '@/utils/logger';

export class AuthService {
  /**
   * Register a new user
   */
  async register(userData: IUserCreate): Promise<IUserResponse> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create new user
      const user = await User.createUser(userData);
      
      logger.info('User registered successfully', {
        userId: user._id,
        email: user.email,
      });

      return this.formatUserResponse(user);
    } catch (error) {
      logger.error('User registration failed', {
        email: userData.email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Login user and return JWT token
   */
  async login(loginData: IUserLogin): Promise<{ user: IUserResponse; token: string }> {
    try {
      // Find user with password
      const user = await User.findByEmailWithPassword(loginData.email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(loginData.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate JWT token
      const token = this.generateToken({
        userId: user._id.toString(),
        email: user.email,
      });

      logger.info('User logged in successfully', {
        userId: user._id,
        email: user.email,
      });

      return {
        user: this.formatUserResponse(user),
        token,
      };
    } catch (error) {
      logger.error('User login failed', {
        email: loginData.email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Verify JWT token and return user
   */
  async verifyToken(token: string): Promise<IUserResponse> {
    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret) as IJwtPayload;
      
      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      return this.formatUserResponse(user);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      
      logger.error('Token verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(payload: Omit<IJwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as any);
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload: Omit<IJwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtRefreshExpiresIn } as any);
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwtSecret) as IJwtPayload;
      
      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      const newToken = this.generateToken({
        userId: user._id.toString(),
        email: user.email,
      });

      const newRefreshToken = this.generateRefreshToken({
        userId: user._id.toString(),
        email: user.email,
      });

      logger.info('Token refreshed successfully', {
        userId: user._id,
        email: user.email,
      });

      return {
        token: newToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      logger.error('Token refresh failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<IUserResponse> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return this.formatUserResponse(user);
    } catch (error) {
      logger.error('Get user profile failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: string,
    updateData: Partial<Pick<IUserCreate, 'firstName' | 'lastName'>>
  ): Promise<IUserResponse> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      logger.info('User profile updated successfully', {
        userId,
        updatedFields: Object.keys(updateData),
      });

      return this.formatUserResponse(user);
    } catch (error) {
      logger.error('Update user profile failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Find user with password
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      logger.info('Password changed successfully', {
        userId,
      });
    } catch (error) {
      logger.error('Change password failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Format user response (remove sensitive data)
   */
  private formatUserResponse(user: any): IUserResponse {
    return {
      _id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { isValid: boolean; message?: string } {
    if (password.length < 6) {
      return { isValid: false, message: 'Password must be at least 6 characters long' };
    }

    if (password.length > 128) {
      return { isValid: false, message: 'Password cannot exceed 128 characters' };
    }

    return { isValid: true };
  }
}

// Export singleton instance
export const authService = new AuthService();
