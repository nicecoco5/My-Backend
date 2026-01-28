import { createPost } from '../post.service';
import { PrismaClient } from '@prisma/client';
import { cacheDelPattern, cacheKeys } from '../redis.service';

// Mock dependencies
jest.mock('@prisma/client', () => {
    const mPrismaClient = {
        post: {
            create: jest.fn(),
        },
    };
    return { PrismaClient: jest.fn(() => mPrismaClient) };
});

jest.mock('../redis.service', () => ({
    cacheDelPattern: jest.fn(),
    cacheKeys: {
        postsPattern: jest.fn().mockReturnValue('posts:*'),
    },
    cacheGet: jest.fn(),
    cacheSet: jest.fn(),
}));

describe('PostService', () => {
    let prisma: any;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        // Get the mock instance
        prisma = new PrismaClient();
    });

    describe('createPost', () => {
        it('should create a post and invalidate cache', async () => {
            const mockPostInput = {
                title: 'Test Post',
                content: 'Hello World',
                authorId: 'user-123'
            };

            const mockCreatedPost = {
                id: 'post-1',
                ...mockPostInput,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            // Setup Prisma Mock
            (prisma.post.create as jest.Mock).mockResolvedValue(mockCreatedPost);

            // Execute Service Method
            const result = await createPost(mockPostInput);

            // Verify Post Creation
            expect(result).toEqual(mockCreatedPost);
            expect(prisma.post.create).toHaveBeenCalledWith(expect.objectContaining({
                data: mockPostInput
            }));

            // Verify Cache Invalidation
            // It should call cacheDelPattern with the pattern from cacheKeys.postsPattern()
            expect(cacheDelPattern).toHaveBeenCalledWith('posts:*');
        });
    });
});
