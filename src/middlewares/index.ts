/**
 * Middlewares Index
 * Export all middlewares from this file
 */

// Authentication middleware
export { authMiddleware } from './auth.middleware';
export { requireEmailVerified } from './emailVerified.middleware';

// TODO: Add validation middleware
// export { validateRequest } from './validation.middleware';
