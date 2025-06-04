import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserDao } from '../dao/userDao';
import { AuthUtils } from '../utils/auth';
import { authenticateToken, rateLimit } from '../middleware/auth';
import {
  registrationSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateProfileSchema
} from '../validation/authSchemas';
import { UserRegistration, UserLogin, AuthResponse } from '../models/User';

export async function authRoutes(fastify: FastifyInstance) {
  // Apply rate limiting to auth routes
  fastify.addHook('preHandler', async (request, reply) => {
    await rateLimit(request, reply, 50, 15 * 60 * 1000); // 50 requests per 15 minutes
  });

  /**
   * POST /api/auth/register
   * Register a new user
   */
  fastify.post('/register', {
    schema: {
      body: registrationSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    isEmailVerified: { type: 'boolean' }
                  }
                },
                token: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: UserRegistration }>, reply: FastifyReply) => {
    try {
      const { firstName, lastName, email, password } = request.body;

      // Validate email format
      if (!AuthUtils.isValidEmail(email)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid email format',
          code: 'INVALID_EMAIL'
        });
      }

      // Validate password strength
      const passwordValidation = AuthUtils.validatePassword(password);
      if (!passwordValidation.isValid) {
        return reply.status(400).send({
          success: false,
          error: 'Password does not meet requirements',
          code: 'WEAK_PASSWORD',
          details: passwordValidation.errors
        });
      }

      // Create user
      const user = await UserDao.createUser({ firstName, lastName, email, password });

      // Generate tokens
      const accessToken = AuthUtils.generateAccessToken({ userId: user.id, email: user.email });
      const refreshToken = AuthUtils.generateRefreshToken({ userId: user.id, email: user.email });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      const authResponse: AuthResponse = {
        user: userWithoutPassword,
        token: accessToken,
        refreshToken,
        expiresIn: AuthUtils.getTokenExpiration()
      };

      reply.status(201).send({
        success: true,
        message: 'User registered successfully',
        data: authResponse
      });

    } catch (error: any) {
      if (error.message === 'User with this email already exists') {
        return reply.status(409).send({
          success: false,
          error: 'User with this email already exists',
          code: 'USER_EXISTS'
        });
      }

      fastify.log.error('Registration error:', error);
      reply.status(500).send({
        success: false,
        error: 'Registration failed',
        code: 'REGISTRATION_FAILED'
      });
    }
  });

  /**
   * POST /api/auth/login
   * Authenticate user and return JWT tokens
   */
  fastify.post('/login', {
    schema: {
      body: loginSchema
    }
  }, async (request: FastifyRequest<{ Body: UserLogin }>, reply: FastifyReply) => {
    try {
      const { email, password, rememberMe } = request.body;

      // Find user by email
      const user = await UserDao.findUserByEmail(email);
      if (!user) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Verify password
      const isValidPassword = await AuthUtils.comparePassword(password, user.password);
      if (!isValidPassword) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Update last login
      await UserDao.updateLastLogin(user.id);

      // Generate tokens (longer expiry if remember me is checked)
      const tokenExpiry = rememberMe ? '30d' : '7d';
      const accessToken = AuthUtils.generateAccessToken({ userId: user.id, email: user.email });
      const refreshToken = AuthUtils.generateRefreshToken({ userId: user.id, email: user.email });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      const authResponse: AuthResponse = {
        user: userWithoutPassword,
        token: accessToken,
        refreshToken,
        expiresIn: AuthUtils.getTokenExpiration(tokenExpiry)
      };

      reply.send({
        success: true,
        message: 'Login successful',
        data: authResponse
      });

    } catch (error: any) {
      fastify.log.error('Login error:', error);
      reply.status(500).send({
        success: false,
        error: 'Login failed',
        code: 'LOGIN_FAILED'
      });
    }
  });

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   */
  fastify.post('/refresh', {
    schema: {
      body: refreshTokenSchema
    }
  }, async (request: FastifyRequest<{ Body: { refreshToken: string } }>, reply: FastifyReply) => {
    try {
      const { refreshToken } = request.body;

      // Verify refresh token
      const decoded = AuthUtils.verifyRefreshToken(refreshToken);
      if (!decoded) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid or expired refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

      // Verify user still exists
      const user = await UserDao.findUserById(decoded.userId);
      if (!user) {
        return reply.status(401).send({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Generate new tokens
      const newAccessToken = AuthUtils.generateAccessToken({ userId: user.id, email: user.email });
      const newRefreshToken = AuthUtils.generateRefreshToken({ userId: user.id, email: user.email });

      reply.send({
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          token: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: AuthUtils.getTokenExpiration()
        }
      });

    } catch (error: any) {
      fastify.log.error('Token refresh error:', error);
      reply.status(500).send({
        success: false,
        error: 'Token refresh failed',
        code: 'REFRESH_FAILED'
      });
    }
  });

  /**
   * POST /api/auth/logout
   * Logout user (invalidate token on client side)
   */
  fastify.post('/logout', {
    preHandler: [authenticateToken]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    // In a production app, you might want to maintain a blacklist of tokens
    // For now, we'll just return success and let the client handle token removal
    reply.send({
      success: true,
      message: 'Logged out successfully'
    });
  });

  /**
   * GET /api/auth/me
   * Get current user profile
   */
  fastify.get('/me', {
    preHandler: [authenticateToken]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await UserDao.findUserById(request.user!.userId);
      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      reply.send({
        success: true,
        data: { user: userWithoutPassword }
      });

    } catch (error: any) {
      fastify.log.error('Get profile error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to get user profile',
        code: 'PROFILE_FETCH_FAILED'
      });
    }
  });

  /**
   * PUT /api/auth/profile
   * Update user profile
   */
  fastify.put('/profile', {
    schema: {
      body: updateProfileSchema
    },
    preHandler: [authenticateToken]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const updates = request.body as Partial<any>;
      const userId = request.user!.userId;

      // Update user
      const updatedUser = await UserDao.updateUser(userId, updates);
      if (!updatedUser) {
        return reply.status(404).send({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;

      reply.send({
        success: true,
        message: 'Profile updated successfully',
        data: { user: userWithoutPassword }
      });

    } catch (error: any) {
      fastify.log.error('Profile update error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to update profile',
        code: 'PROFILE_UPDATE_FAILED'
      });
    }
  });

  /**
   * POST /api/auth/change-password
   * Change user password
   */
  fastify.post('/change-password', {
    schema: {
      body: changePasswordSchema
    },
    preHandler: [authenticateToken]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { currentPassword, newPassword } = request.body as { currentPassword: string; newPassword: string };
      const userId = request.user!.userId;

      // Get current user
      const user = await UserDao.findUserById(userId);
      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Verify current password
      const isValidPassword = await AuthUtils.comparePassword(currentPassword, user.password);
      if (!isValidPassword) {
        return reply.status(400).send({
          success: false,
          error: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Validate new password
      const passwordValidation = AuthUtils.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return reply.status(400).send({
          success: false,
          error: 'New password does not meet requirements',
          code: 'WEAK_PASSWORD',
          details: passwordValidation.errors
        });
      }

      // Change password
      const success = await UserDao.changePassword(userId, newPassword);
      if (!success) {
        return reply.status(500).send({
          success: false,
          error: 'Failed to change password',
          code: 'PASSWORD_CHANGE_FAILED'
        });
      }

      reply.send({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error: any) {
      fastify.log.error('Change password error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to change password',
        code: 'PASSWORD_CHANGE_FAILED'
      });
    }
  });

  /**
   * DELETE /api/auth/account
   * Delete user account
   */
  fastify.delete('/account', {
    preHandler: [authenticateToken]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;

      const success = await UserDao.deleteUser(userId);
      if (!success) {
        return reply.status(404).send({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      reply.send({
        success: true,
        message: 'Account deleted successfully'
      });

    } catch (error: any) {
      fastify.log.error('Delete account error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to delete account',
        code: 'ACCOUNT_DELETE_FAILED'
      });
    }
  });
} 