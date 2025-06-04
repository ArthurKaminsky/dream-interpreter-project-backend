import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthUtils } from '../utils/auth';
import { UserDao } from '../dao/userDao';

// Extend FastifyRequest to include user property
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
    };
  }
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    userId: string;
    email: string;
  };
}

/**
 * Middleware to authenticate JWT tokens
 */
export async function authenticateToken(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    const token = AuthUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      return reply.status(401).send({
        success: false,
        error: 'Access token is required',
        code: 'MISSING_TOKEN'
      });
    }

    const decoded = AuthUtils.verifyAccessToken(token);
    if (!decoded) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid or expired access token',
        code: 'INVALID_TOKEN'
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

    // Add user info to request
    request.user = {
      userId: decoded.userId,
      email: decoded.email
    };

  } catch (error) {
    return reply.status(401).send({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
}

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export async function optionalAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    const token = AuthUtils.extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = AuthUtils.verifyAccessToken(token);
      if (decoded) {
        const user = await UserDao.findUserById(decoded.userId);
        if (user) {
          request.user = {
            userId: decoded.userId,
            email: decoded.email
          };
        }
      }
    }
  } catch (error) {
    // Silently fail for optional auth
    console.warn('Optional auth failed:', error);
  }
}

/**
 * Middleware to check if user email is verified
 */
export async function requireEmailVerification(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  const user = await UserDao.findUserById(request.user.userId);
  if (!user) {
    return reply.status(401).send({
      success: false,
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  if (!user.isEmailVerified) {
    return reply.status(403).send({
      success: false,
      error: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }
}

/**
 * Middleware to check subscription status
 */
export async function requireActiveSubscription(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  const user = await UserDao.findUserById(request.user.userId);
  if (!user) {
    return reply.status(401).send({
      success: false,
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  if (user.subscription.status !== 'active') {
    return reply.status(403).send({
      success: false,
      error: 'Active subscription required',
      code: 'SUBSCRIPTION_REQUIRED'
    });
  }
}

/**
 * Rate limiting middleware (basic implementation)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export async function rateLimit(
  request: FastifyRequest,
  reply: FastifyReply,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): Promise<void> {
  const clientIp = request.ip;
  const now = Date.now();
  
  let requestInfo = requestCounts.get(clientIp);
  
  if (!requestInfo || now > requestInfo.resetTime) {
    requestInfo = {
      count: 1,
      resetTime: now + windowMs
    };
  } else {
    requestInfo.count++;
  }
  
  requestCounts.set(clientIp, requestInfo);
  
  if (requestInfo.count > maxRequests) {
    return reply.status(429).send({
      success: false,
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil((requestInfo.resetTime - now) / 1000)
    });
  }
  
  // Add rate limit headers
  reply.header('X-RateLimit-Limit', maxRequests);
  reply.header('X-RateLimit-Remaining', Math.max(0, maxRequests - requestInfo.count));
  reply.header('X-RateLimit-Reset', Math.ceil(requestInfo.resetTime / 1000));
} 