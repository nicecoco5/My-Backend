/**
 * Type Definitions for Authentication
 */

/**
 * User registration request body
 */
export interface RegisterRequest {
    email: string;
    password: string;
    nickname?: string;
}

/**
 * User login request body
 */
export interface LoginRequest {
    email: string;
    password: string;
}

/**
 * User response (excludes sensitive data like password)
 */
export interface UserResponse {
    id: string;
    email: string;
    nickname: string | null;
    createdAt: Date;
}

/**
 * Login response
 */
export interface LoginResponse {
    message: string;
    accessToken: string;
    // refreshToken removed - now in HttpOnly cookie
    user: AuthenticatedUser;
}

/**
 * Refresh token request body (empty - token from cookie)
 */
export interface RefreshTokenRequest {
    // Empty - token comes from HttpOnly cookie
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
    accessToken: string;
    // refreshToken removed - now in HttpOnly cookie
}

/**
 * Logout request body (empty - token from cookie)
 */
export interface LogoutRequest {
    // Empty - token comes from HttpOnly cookie
}

/**
 * Forgot password request body
 */
export interface ForgotPasswordRequest {
    email: string;
}

/**
 * Forgot password response
 */
export interface ForgotPasswordResponse {
    message: string;
}

/**
 * Reset password request body
 */
export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

/**
 * Reset password response
 */
export interface ResetPasswordResponse {
    message: string;
}

/**
 * API Error response
 */
export interface ErrorResponse {
    error: string;
    message: string;
}

/**
 * JWT Payload structure
 */
export interface JwtPayload {
    userId: string;
    iat?: number;  // Issued at
    exp?: number;  // Expiration time
}

/**
 * User object attached to authenticated requests
 */
export interface AuthenticatedUser {
    id: string;
    email: string;
    nickname: string | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Extend Express Request to include user property
 */
declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

