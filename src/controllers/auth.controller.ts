/**
 * Auth Controller
 * Handles HTTP requests for authentication endpoints
 * Business logic is delegated to the service layer
 */

import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import config from '../config';
import { isValidEmail, isValidPassword, isPasswordSecure } from '../utils/validators';
import { RegisterRequest, LoginRequest } from '../types/auth.types';

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 회원가입
 *     description: 새로운 사용자를 등록하고 이메일 인증 코드를 발송합니다
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: 사용자 이메일 주소
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *                 description: 비밀번호 (최소 8자, 영문+숫자 필수)
 *               nickname:
 *                 type: string
 *                 example: johndoe
 *                 description: 사용자 닉네임 (선택)
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Registration successful. Please check your email for the 6-digit verification code.
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: 잘못된 요청 (유효성 검증 실패)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: 이메일 또는 닉네임 중복
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: 너무 많은 요청 (Rate Limiting)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 서버 에러
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, nickname }: RegisterRequest = req.body;

        // 1. Validate required fields
        if (!email || !password) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Email and password are required'
            });
            return;
        }

        // 2. Validate email format
        if (!isValidEmail(email)) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Invalid email format'
            });
            return;
        }

        // 3. Validate password strength
        if (!isValidPassword(password)) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Password must be at least 8 characters with at least 1 letter, 1 number, and 1 special character (@$!%*#?&)'
            });
            return;
        }

        // 4. Check password security (not containing email/nickname)
        const securityCheck = isPasswordSecure(password, email, nickname);
        if (!securityCheck.isSecure) {
            res.status(400).json({
                error: 'Validation Error',
                message: securityCheck.reason
            });
            return;
        }

        // 5. Check if email already exists
        const existingEmail = await authService.findUserByEmail(email);
        if (existingEmail) {
            res.status(409).json({
                error: 'Conflict',
                message: 'Email already registered'
            });
            return;
        }

        // 6. Check if nickname already exists (if provided)
        if (nickname) {
            const existingNickname = await authService.findUserByNickname(nickname);
            if (existingNickname) {
                res.status(409).json({
                    error: 'Conflict',
                    message: 'Nickname already taken'
                });
                return;
            }
        }

        // 7. Create user (password is hashed in service)
        const user = await authService.createUser({ email, password, nickname });

        // Generate 6-digit verification code
        const verificationCode = await authService.generateEmailVerificationToken(user.id, email);

        // Send verification email
        const { sendVerificationEmail } = await import('../utils/email');
        await sendVerificationEmail(email, verificationCode);

        // 8. Return success response
        res.status(201).json({
            message: 'Registration successful. Please check your email for the 6-digit verification code.',
            user: {
                id: user.id,
                email: user.email,
                nickname: user.nickname,
                emailVerified: false,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({
            error: 'Registration failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 로그인
 *     description: 이메일과 비밀번호로 로그인하고 JWT 토큰을 발급받습니다
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: 인증 실패 (잘못된 이메일 또는 비밀번호)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: 이메일 미인증
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: 너무 많은 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 서버 에러
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password }: LoginRequest = req.body;

        // 1. Validate required fields
        if (!email || !password) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Email and password are required'
            });
            return;
        }

        // 2. Find user by email
        const user = await authService.findUserByEmail(email);
        if (!user) {
            res.status(401).json({
                error: 'Authentication Failed',
                message: 'Invalid email or password'
            });
            return;
        }

        // 3. Check email verification
        if (!user.emailVerified) {
            res.status(403).json({
                error: 'Email Not Verified',
                message: '이메일 인증을 완료해주세요. 등록하신 이메일에서 6자리 인증 코드를 확인하세요.'
            });
            return;
        }

        // 4. Check if user has password (social login users don't have password)
        if (!user.password) {
            res.status(401).json({
                error: 'Social Login User',
                message: '소셜 로그인으로 가입된 계정입니다. 소셜 로그인을 이용해주세요.'
            });
            return;
        }

        // 5. Verify password
        const isValidPw = await authService.verifyPassword(password, user.password);
        if (!isValidPw) {
            res.status(401).json({
                error: 'Authentication Failed',
                message: 'Invalid email or password'
            });
            return;
        }

        // 4. Generate access token and refresh token
        const accessToken = authService.generateToken(user.id);
        const refreshToken = await authService.generateRefreshToken(user.id);

        // 5. Set refresh token as HttpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: config.cookieSecure,
            sameSite: config.cookieSameSite,
            maxAge: config.cookieMaxAge
        });

        // 6. Return success response (exclude password, refreshToken in cookie)
        res.status(200).json({
            message: 'Login successful',
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                nickname: user.nickname,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            error: 'Login failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 내 정보 조회
 *     description: 현재 로그인한 사용자의 정보를 조회합니다
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: 인증 실패 (토큰 없음 또는 무효)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 서버 에러
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
        // User is already attached by authMiddleware
        if (!req.user) {
            res.status(401).json({
                error: 'Authentication Required',
                message: 'User not authenticated'
            });
            return;
        }

        res.status(200).json({
            user: req.user
        });

    } catch (error) {
        console.error('❌ Get current user error:', error);
        res.status(500).json({
            error: 'Failed to get user',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: 토큰 갱신
 *     description: Refresh Token을 사용하여 새로운 Access Token을 발급받습니다
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: 토큰 갱신 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Refresh Token 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 유효하지 않은 Refresh Token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 서버 에러
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Get refresh token from HttpOnly cookie
        const refreshToken = req.cookies.refreshToken;

        // 2. Validate refresh token provided
        if (!refreshToken) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Refresh token is required'
            });
            return;
        }

        // 3. Verify refresh token
        const decoded = await authService.verifyRefreshToken(refreshToken);
        if (!decoded) {
            res.status(401).json({
                error: 'Invalid Token',
                message: 'Refresh token not found or expired'
            });
            return;
        }

        // 4. Generate new tokens (rotation)
        const newAccessToken = authService.generateToken(decoded.userId);
        const newRefreshToken = await authService.rotateRefreshToken(refreshToken, decoded.userId);

        // 5. Set new refresh token as HttpOnly cookie
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: config.cookieSecure,
            sameSite: config.cookieSameSite,
            maxAge: config.cookieMaxAge
        });

        // 6. Return new access token
        res.status(200).json({
            accessToken: newAccessToken
        });

    } catch (error) {
        console.error('❌ Refresh token error:', error);
        res.status(500).json({
            error: 'Token refresh failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: 로그아웃
 *     description: 현재 세션을 종료하고 Refresh Token을 무효화합니다
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *       400:
 *         description: Refresh Token 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 서버 에러
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Get refresh token from HttpOnly cookie
        const refreshToken = req.cookies.refreshToken;

        // 2. Validate refresh token provided
        if (!refreshToken) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Refresh token is required'
            });
            return;
        }

        // 3. Revoke refresh token
        await authService.revokeRefreshToken(refreshToken);

        // 4. Clear the HttpOnly cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: config.cookieSecure,
            sameSite: config.cookieSameSite
        });

        // 5. Return success
        res.status(200).json({
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('❌ Logout error:', error);
        res.status(500).json({
            error: 'Logout failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: 비밀번호 찾기
 *     description: 비밀번호 재설정 링크를 이메일로 발송합니다
 *     tags: [Password Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: 비밀번호 재설정 이메일 발송 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset email sent
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: 너무 많은 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 서버 에러
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        // 1. Validate email provided
        if (!email) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Email is required'
            });
            return;
        }

        // 2. Check if user exists
        const user = await authService.findUserByEmail(email);

        // Always return success message (don't reveal if email exists)
        // This prevents email enumeration attacks
        if (!user) {
            res.status(200).json({
                message: 'If an account exists with this email, a password reset link has been sent'
            });
            return;
        }

        // 3. Generate reset token
        const resetToken = await authService.generatePasswordResetToken(user.id);

        // 4. Send email with reset link
        const { sendPasswordResetEmail } = await import('../utils/email');
        await sendPasswordResetEmail(email, resetToken);

        // 5. Return success message
        res.status(200).json({
            message: 'If an account exists with this email, a password reset link has been sent'
        });

    } catch (error) {
        console.error('❌ Forgot password error:', error);
        res.status(500).json({
            error: 'Password reset request failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: 비밀번호 재설정
 *     description: 재설정 토큰을 사용하여 새 비밀번호를 설정합니다
 *     tags: [Password Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: abc123def456...
 *                 description: 비밀번호 재설정 토큰
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewSecurePass123!
 *                 description: 새 비밀번호 (최소 8자, 영문+숫자 필수)
 *     responses:
 *       200:
 *         description: 비밀번호 재설정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset successful
 *       400:
 *         description: 잘못된 요청 (토큰 또는 비밀번호 형식 오류)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 유효하지 않거나 만료된 토큰
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 서버 에러
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token, newPassword } = req.body;

        // 1. Validate required fields
        if (!token || !newPassword) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Token and new password are required'
            });
            return;
        }

        // 2. Validate password strength (same as registration)
        if (!isValidPassword(newPassword)) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Password must be at least 8 characters with at least 1 letter, 1 number, and 1 special character (@$!%*#?&)'
            });
            return;
        }

        // 3. Verify token and get user info
        const decoded = await authService.verifyPasswordResetToken(token);
        if (!decoded) {
            res.status(401).json({
                error: 'Invalid Token',
                message: 'Password reset token is invalid or has expired'
            });
            return;
        }

        // 4. Get user to check password security
        const user = await authService.findUserById(decoded.userId);
        if (!user) {
            res.status(401).json({
                error: 'Invalid Token',
                message: 'User not found'
            });
            return;
        }

        // 5. Additional password security checks (same as registration)
        if (!isPasswordSecure(newPassword, user.email, user.nickname || undefined)) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Password cannot contain your email ID or nickname'
            });
            return;
        }

        // 6. Reset password (token will be deleted after use)
        const success = await authService.resetPassword(token, newPassword);

        if (!success) {
            res.status(401).json({
                error: 'Invalid Token',
                message: 'Password reset failed'
            });
            return;
        }

        // 7. Return success
        res.status(200).json({
            message: 'Password has been reset successfully'
        });

    } catch (error) {
        console.error('❌ Reset password error:', error);
        res.status(500).json({
            error: 'Password reset failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: 이메일 인증
 *     description: 6자리 인증 코드로 이메일을 인증합니다
 *     tags: [Email Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               code:
 *                 type: string
 *                 pattern: '^\\d{6}$'
 *                 example: "123456"
 *                 description: 6자리 인증 코드
 *     responses:
 *       200:
 *         description: 이메일 인증 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email verified successfully
 *       400:
 *         description: 잘못된 요청 (코드 형식 오류)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 유효하지 않거나 만료된 코드
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 서버 에러
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Email and verification code are required'
            });
            return;
        }

        // Validate code format (6 digits)
        if (!/^\d{6}$/.test(code)) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Verification code must be 6 digits'
            });
            return;
        }

        const success = await authService.verifyEmailToken(email, code);

        if (!success) {
            res.status(401).json({
                error: 'Invalid Code',
                message: 'Verification code is invalid or has expired (5 minutes)'
            });
            return;
        }

        res.status(200).json({
            message: 'Email verified successfully'
        });
    } catch (error) {
        console.error('❌ Email verification error:', error);
        res.status(500).json({
            error: 'Verification failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: 인증 코드 재발송
 *     description: 새로운 6자리 인증 코드를 이메일로 재발송합니다
 *     tags: [Email Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: 인증 코드 재발송 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Verification code has been sent
 *       400:
 *         description: 이미 인증된 계정
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: 너무 많은 요청 (Rate Limiting)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 서버 에러
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const resendVerification = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Email is required'
            });
            return;
        }

        const user = await authService.findUserByEmail(email);

        // Always return success (prevent email enumeration)
        if (!user) {
            res.status(200).json({
                message: 'If an unverified account exists with this email, a verification link has been sent'
            });
            return;
        }

        // Check if already verified
        if (user.emailVerified) {
            res.status(400).json({
                error: 'Already Verified',
                message: 'This email is already verified'
            });
            return;
        }

        // Generate new code
        const verificationCode = await authService.generateEmailVerificationToken(user.id, email);

        // Send email
        const { sendVerificationEmail } = await import('../utils/email');
        await sendVerificationEmail(email, verificationCode);

        res.status(200).json({
            message: 'Verification code has been sent'
        });
    } catch (error) {
        // Handle rate limiting error
        if (error instanceof Error && error.message.includes('Too many')) {
            res.status(429).json({
                error: 'Too Many Requests',
                message: error.message
            });
            return;
        }

        console.error('❌ Resend verification error:', error);
        res.status(500).json({
            error: 'Failed to resend verification',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
