import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../auth.middleware';
import prisma from '../../utils/prisma';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../utils/prisma', () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn(),
        },
    },
}));

describe('Auth Middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {
            headers: {},
            cookies: {},
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as unknown as Response; // Type casting for chaining
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should return 401 if no token is provided', async () => {
        await authMiddleware(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Authentication Required' }));
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
        req.headers = { authorization: 'Bearer invalid_token' };

        // Mock jwt.verify to throw error
        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw new Error('Invalid token');
        });

        await authMiddleware(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Authentication Failed' }));
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next() if token is valid and user exists', async () => {
        req.headers = { authorization: 'Bearer valid_token' };

        const mockPayload = { userId: 'user-123' };
        const mockUser = { id: 'user-123', email: 'test@example.com' };

        // Mock jwt.verify success
        (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

        // Mock prisma findUnique success
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

        await authMiddleware(req as Request, res as Response, next);

        // Should attach user to request
        expect((req as any).user).toEqual(mockUser);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 if token is valid but user does not exist', async () => {
        req.headers = { authorization: 'Bearer valid_token' };

        // Mock jwt.verify success
        (jwt.verify as jest.Mock).mockReturnValue({ userId: 'non-existent-user' });

        // Mock prisma findUnique returns null
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        await authMiddleware(req as Request, res as Response, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Authentication Failed' }));
        expect(next).not.toHaveBeenCalled();
    });
});
