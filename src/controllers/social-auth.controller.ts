/**
 * Social Auth Controller
 * Handles OAuth callbacks and token generation
 */

import { Request, Response } from 'express';
import { generateSocialLoginTokens } from '../services/social-auth.service';

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Google 로그인
 *     description: Google OAuth 로그인 페이지로 리다이렉트합니다
 *     tags: [Social Login]
 *     responses:
 *       302:
 *         description: Google 로그인 페이지로 리다이렉트
 */

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google 로그인 콜백
 *     description: Google OAuth 인증 후 콜백 처리
 *     tags: [Social Login]
 *     responses:
 *       200:
 *         description: 로그인 성공, JWT 토큰 반환
 *       401:
 *         description: 인증 실패
 */
export const googleCallback = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user as any;

        if (!user) {
            res.status(401).json({
                error: 'Authentication Failed',
                message: 'Google authentication failed'
            });
            return;
        }

        const { accessToken, refreshToken } = generateSocialLoginTokens(user.id);

        // Set refresh token as HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            message: 'Google login successful',
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                nickname: user.nickname,
                profileImage: user.profileImage,
                socialProvider: user.socialProvider
            }
        });
    } catch (error) {
        console.error('❌ Google callback error:', error);
        res.status(500).json({
            error: 'Login Failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/auth/kakao:
 *   get:
 *     summary: Kakao 로그인
 *     description: Kakao OAuth 로그인 페이지로 리다이렉트합니다
 *     tags: [Social Login]
 *     responses:
 *       302:
 *         description: Kakao 로그인 페이지로 리다이렉트
 */

/**
 * @swagger
 * /api/auth/kakao/callback:
 *   get:
 *     summary: Kakao 로그인 콜백
 *     description: Kakao OAuth 인증 후 콜백 처리
 *     tags: [Social Login]
 *     responses:
 *       200:
 *         description: 로그인 성공, JWT 토큰 반환
 *       401:
 *         description: 인증 실패
 */
export const kakaoCallback = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user as any;

        if (!user) {
            res.status(401).json({
                error: 'Authentication Failed',
                message: 'Kakao authentication failed'
            });
            return;
        }

        const { accessToken, refreshToken } = generateSocialLoginTokens(user.id);

        // Set refresh token as HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            message: 'Kakao login successful',
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                nickname: user.nickname,
                profileImage: user.profileImage,
                socialProvider: user.socialProvider
            }
        });
    } catch (error) {
        console.error('❌ Kakao callback error:', error);
        res.status(500).json({
            error: 'Login Failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/auth/social/status:
 *   get:
 *     summary: 소셜 로그인 설정 상태
 *     description: 활성화된 소셜 로그인 제공자 확인
 *     tags: [Social Login]
 *     responses:
 *       200:
 *         description: 소셜 로그인 상태
 */
export const getSocialLoginStatus = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({
        providers: {
            google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
            kakao: !!process.env.KAKAO_CLIENT_ID
        }
    });
};
