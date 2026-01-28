/**
 * Profile Controller
 * Handles HTTP requests for user profile operations
 */

import { Request, Response } from 'express';
import * as profileService from '../services/profile.service';
import * as uploadService from '../services/upload.service';

/**
 * @swagger
 * /api/profile/{id}:
 *   get:
 *     summary: 사용자 프로필 조회
 *     description: 사용자 ID로 프로필을 조회합니다
 *     tags: [Profile]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 프로필 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 nickname:
 *                   type: string
 *                 bio:
 *                   type: string
 *                 profileImage:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.id as string;

        const profile = await profileService.getProfileById(userId);

        if (!profile) {
            res.status(404).json({
                error: 'Not Found',
                message: 'User not found'
            });
            return;
        }

        res.status(200).json(profile);
    } catch (error) {
        console.error('❌ Get profile error:', error);
        res.status(500).json({
            error: 'Failed to get profile',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: 내 프로필 조회
 *     description: 로그인한 사용자의 프로필을 조회합니다
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 프로필 조회 성공
 *       401:
 *         description: 인증 필요
 */
export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                error: 'Authentication Required',
                message: 'You must be logged in to view your profile'
            });
            return;
        }

        const profile = await profileService.getProfileById(userId);

        res.status(200).json(profile);
    } catch (error) {
        console.error('❌ Get my profile error:', error);
        res.status(500).json({
            error: 'Failed to get profile',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: 내 프로필 수정
 *     description: 닉네임, 자기소개를 수정합니다
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *                 example: mynickname
 *                 description: 새 닉네임 (3-20자)
 *               bio:
 *                 type: string
 *                 example: 안녕하세요! 개발자입니다.
 *                 description: 자기소개 (최대 200자)
 *     responses:
 *       200:
 *         description: 프로필 수정 성공
 *       400:
 *         description: 유효성 검사 실패
 *       401:
 *         description: 인증 필요
 *       409:
 *         description: 닉네임 이미 사용 중
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                error: 'Authentication Required',
                message: 'You must be logged in to update your profile'
            });
            return;
        }

        const { nickname, bio } = req.body;

        // Validation
        if (nickname !== undefined) {
            if (typeof nickname !== 'string' || nickname.length < 3 || nickname.length > 20) {
                res.status(400).json({
                    error: 'Validation Error',
                    message: 'Nickname must be 3-20 characters'
                });
                return;
            }
            // Check for valid characters (alphanumeric and underscore only)
            if (!/^[a-zA-Z0-9_]+$/.test(nickname)) {
                res.status(400).json({
                    error: 'Validation Error',
                    message: 'Nickname can only contain letters, numbers, and underscores'
                });
                return;
            }
        }

        if (bio !== undefined && bio.length > 200) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Bio must be less than 200 characters'
            });
            return;
        }

        const updatedProfile = await profileService.updateProfile(userId, { nickname, bio });

        res.status(200).json({
            message: 'Profile updated successfully',
            profile: updatedProfile
        });
    } catch (error) {
        console.error('❌ Update profile error:', error);

        if (error instanceof Error && error.message === 'Nickname is already taken') {
            res.status(409).json({
                error: 'Conflict',
                message: 'Nickname is already taken'
            });
            return;
        }

        res.status(500).json({
            error: 'Failed to update profile',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/profile/image:
 *   put:
 *     summary: 프로필 이미지 업로드
 *     description: 프로필 이미지를 업로드/변경합니다
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 프로필 이미지 파일
 *     responses:
 *       200:
 *         description: 프로필 이미지 업로드 성공
 *       400:
 *         description: 파일 없음
 *       401:
 *         description: 인증 필요
 */
export const updateProfileImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                error: 'Authentication Required',
                message: 'You must be logged in to update your profile image'
            });
            return;
        }

        if (!req.file) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'No image file uploaded'
            });
            return;
        }

        const imageUrl = uploadService.getFileUrl(req.file.filename);
        const updatedProfile = await profileService.updateProfileImage(userId, imageUrl);

        res.status(200).json({
            message: 'Profile image updated successfully',
            profile: updatedProfile
        });
    } catch (error) {
        console.error('❌ Update profile image error:', error);
        res.status(500).json({
            error: 'Failed to update profile image',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/profile/image:
 *   delete:
 *     summary: 프로필 이미지 삭제
 *     description: 프로필 이미지를 삭제합니다
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 프로필 이미지 삭제 성공
 *       401:
 *         description: 인증 필요
 */
export const deleteProfileImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                error: 'Authentication Required',
                message: 'You must be logged in to delete your profile image'
            });
            return;
        }

        const updatedProfile = await profileService.removeProfileImage(userId);

        res.status(200).json({
            message: 'Profile image deleted successfully',
            profile: updatedProfile
        });
    } catch (error) {
        console.error('❌ Delete profile image error:', error);
        res.status(500).json({
            error: 'Failed to delete profile image',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
