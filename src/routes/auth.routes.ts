/**
 * Auth Routes
 * Defines API endpoints for authentication
 */

import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares';
import { authLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 * Body: { email, password, nickname }
 * Rate limit: 5 requests per 15 minutes
 */
router.post('/register', authLimiter, authController.register);

/**
 * POST /api/auth/login
 * Login with email and password
 * Body: { email, password }
 * Rate limit: 5 requests per 15 minutes
 */
router.post('/login', authLimiter, authController.login);

/**
 * GET /api/auth/me
 * Get current authenticated user's information
 * Requires: Authorization header with Bearer token
 */
router.get('/me', authMiddleware, authController.getCurrentUser);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 * Body: { refreshToken }
 */
router.post('/refresh', authController.refreshToken);

/**
 * POST /api/auth/logout
 * Logout and revoke refresh token
 * Body: { refreshToken }
 */
router.post('/logout', authController.logout);

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 * Body: { email }
 * Rate limit: 5 requests per 15 minutes
 */
router.post('/forgot-password', authLimiter, authController.forgotPassword);

/**
 * POST /api/auth/reset-password
 * Reset password using reset token
 * Body: { token, newPassword }
 * Rate limit: 5 requests per 15 minutes
 */
router.post('/reset-password', authLimiter, authController.resetPassword);

export default router;

/**
 * POST /api/auth/verify-email
 * Verify email address using token
 * Body: { token }
 */
router.post('/verify-email', authController.verifyEmail);

/**
 * POST /api/auth/resend-verification
 * Resend verification email
 * Body: { email }
 * Rate limit: 5 requests per 15 minutes
 */
router.post('/resend-verification', authLimiter, authController.resendVerification);
