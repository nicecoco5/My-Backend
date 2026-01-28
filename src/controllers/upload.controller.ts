/**
 * Upload Controller
 * Handles HTTP requests for file upload operations
 */

import { Request, Response } from 'express';
import * as uploadService from '../services/upload.service';

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: 파일 업로드
 *     description: 이미지 파일을 업로드합니다 (JPEG, PNG, GIF, WebP, 최대 5MB)
 *     tags: [Upload]
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
 *                 description: 업로드할 이미지 파일
 *     responses:
 *       201:
 *         description: 업로드 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: File uploaded successfully
 *                 file:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                       example: 1706423456789-123456789.jpg
 *                     url:
 *                       type: string
 *                       example: /uploads/1706423456789-123456789.jpg
 *                     size:
 *                       type: integer
 *                       example: 102400
 *                     mimetype:
 *                       type: string
 *                       example: image/jpeg
 *       400:
 *         description: 유효하지 않은 파일
 *       401:
 *         description: 인증 필요
 *       500:
 *         description: 서버 에러
 */
export const uploadFile = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) {
            res.status(401).json({
                error: 'Authentication Required',
                message: 'You must be logged in to upload files'
            });
            return;
        }

        if (!req.file) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'No file uploaded'
            });
            return;
        }

        const file = req.file;
        const url = uploadService.getFileUrl(file.filename);

        res.status(201).json({
            message: 'File uploaded successfully',
            file: {
                filename: file.filename,
                url,
                size: file.size,
                mimetype: file.mimetype,
                originalname: file.originalname
            }
        });
    } catch (error) {
        console.error('❌ Upload file error:', error);
        res.status(500).json({
            error: 'Failed to upload file',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/upload/{filename}:
 *   delete:
 *     summary: 파일 삭제
 *     description: 업로드된 파일을 삭제합니다
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: 삭제할 파일명
 *     responses:
 *       200:
 *         description: 삭제 성공
 *       401:
 *         description: 인증 필요
 *       404:
 *         description: 파일을 찾을 수 없음
 *       500:
 *         description: 서버 에러
 */
export const deleteFile = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) {
            res.status(401).json({
                error: 'Authentication Required',
                message: 'You must be logged in to delete files'
            });
            return;
        }

        const filename = req.params.filename as string;

        const deleted = await uploadService.deleteFile(filename);

        if (!deleted) {
            res.status(404).json({
                error: 'Not Found',
                message: 'File not found'
            });
            return;
        }

        res.status(200).json({
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('❌ Delete file error:', error);
        res.status(500).json({
            error: 'Failed to delete file',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/upload:
 *   get:
 *     summary: 업로드된 파일 목록
 *     description: 모든 업로드된 파일 목록을 조회합니다
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 파일 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 files:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: 인증 필요
 */
export const getUploadedFiles = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) {
            res.status(401).json({
                error: 'Authentication Required',
                message: 'You must be logged in to view files'
            });
            return;
        }

        const files = uploadService.getUploadedFiles();

        res.status(200).json({
            files: files.map(filename => ({
                filename,
                url: uploadService.getFileUrl(filename)
            }))
        });
    } catch (error) {
        console.error('❌ Get files error:', error);
        res.status(500).json({
            error: 'Failed to get files',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
