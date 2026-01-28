import { Request, Response, NextFunction } from 'express';
import { findUserById } from '../services/auth.service';

/**
 * REQUIRED middleware to check if user's email is verified
 * Apply to ALL protected routes
 */
export const requireEmailVerified = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user?.id) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
            return;
        }

        const user = await findUserById(req.user.id);

        if (!user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not found'
            });
            return;
        }

        if (!user.emailVerified) {
            res.status(403).json({
                error: 'Email Not Verified',
                message: '이메일 인증을 완료해주세요. 인증 코드를 확인하세요.'
            });
            return;
        }

        next();
    } catch (error) {
        res.status(500).json({
            error: 'Server Error',
            message: 'Failed to verify email status'
        });
    }
};
