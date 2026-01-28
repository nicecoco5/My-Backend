import request from 'supertest';
// 1. Mock dependencies before importing app
jest.mock('../../utils/prisma', () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        emailVerificationToken: {
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockResolvedValue({ Code: '123456' }),
        },
        passwordResetToken: {
            create: jest.fn(),
        }
    },
}));

jest.mock('../../services/redis.service', () => ({
    initRedis: jest.fn().mockReturnValue({
        connect: jest.fn().mockResolvedValue(true),
        on: jest.fn(),
    }),
    isRedisConnected: jest.fn().mockReturnValue(false),
    getRedisClient: jest.fn().mockReturnValue(null),
}));

jest.mock('../../utils/email', () => ({
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

// 2. Import app and mocked modules
import app from '../../app';
import prisma from '../../utils/prisma';

describe('E2E: Auth Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        it('should create a new user and return 201', async () => {
            const userData = {
                email: 'newuser@example.com',
                password: 'Password123!',
                nickname: 'NewUser'
            };

            // Mock: User does not exist
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            // Mock: Create user success
            (prisma.user.create as jest.Mock).mockResolvedValue({
                id: 'user-1',
                email: userData.email,
                nickname: userData.nickname,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const res = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('message', 'Registration successful. Please check your email for the 6-digit verification code.');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe(userData.email);
        });

        it('should return 400 if email already exists', async () => {
            const userData = {
                email: 'existing@example.com',
                password: 'Password123!',
                nickname: 'ExistingUser'
            };

            // Mock: User exists
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-id' });

            const res = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(res.status).toBe(409);
            expect(res.body).toHaveProperty('error', 'Conflict');
            expect(res.body).toHaveProperty('message', 'Email already registered');
        });
    });
});
