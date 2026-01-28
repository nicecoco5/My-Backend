import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import logger, { stream } from './utils/logger';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

// Validate environment variables
import { validateEnv } from './config/env.validator';
validateEnv();

// Import routes
import authRoutes from './routes/auth.routes';
import postRoutes from './routes/post.routes';
import commentRoutes from './routes/comment.routes';
import likeRoutes from './routes/like.routes';
import uploadRoutes from './routes/upload.routes';
import profileRoutes from './routes/profile.routes';
import socialAuthRoutes from './routes/social-auth.routes';
import notificationRoutes from './routes/notification.routes';
import * as commentController from './controllers/comment.controller';

// Import Passport
import passport from './config/passport.config';

// Import middlewares
import { apiLimiter } from './middlewares/rateLimiter.middleware';

// Import Swagger configuration
import { swaggerSpec } from './config/swagger';

// Import Redis service
import { initRedis, isRedisConnected } from './services/redis.service';

// Initialize Metrics Middleware
import { metricsMiddleware, getMetrics, metricsContentType } from './middlewares/metrics.middleware';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// ===== Middlewares =====

// Enable CORS with specific configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true  // Allow cookies to be sent
}));

// Set security HTTP headers
app.use(helmet());

// Prevent http param pollution
app.use(hpp());

// Use Helper stream for monitoring
// Combined format outputs standard Apache combined log format
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', { stream }));

// Parse JSON request bodies
app.use(express.json());

// Parse cookies
app.use(cookieParser());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Initialize Passport
app.use(passport.initialize());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// ===== Routes =====

// Metrics Endpoint
app.get('/metrics', async (req: Request, res: Response) => {
    try {
        res.set('Content-Type', metricsContentType);
        res.end(await getMetrics());
    } catch (ex) {
        res.status(500).end(ex);
    }
});

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: '🚀 Secure Backend System is running!',
        status: 'OK',
        timestamp: new Date().toISOString(),
        endpoints: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            me: 'GET /api/auth/me (Protected)'
        }
    });
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Secure Backend API Documentation'
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', socialAuthRoutes);  // Social OAuth routes
app.use('/api/posts', postRoutes);
app.use('/api/posts', commentRoutes);  // Comment routes nested under /api/posts
app.use('/api/posts', likeRoutes);     // Like routes nested under /api/posts
app.use('/api/upload', uploadRoutes);  // File upload routes
app.use('/api/profile', profileRoutes); // User profile routes
app.use('/api/notifications', notificationRoutes); // Notification routes

// Standalone comment routes for update/delete
import { authMiddleware } from './middlewares/auth.middleware';
app.put('/api/comments/:id', authMiddleware, commentController.updateComment);
app.delete('/api/comments/:id', authMiddleware, commentController.deleteComment);

// ===== Error Handling =====

import { notFoundHandler, errorHandler } from './middlewares/error.middleware';

// 404 Not Found handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ===== Start Server =====

// Only start server if not testing
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log('========================================');
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
        console.log(`📅 Started at: ${new Date().toISOString()}`);
        console.log('========================================');

        // Initialize Redis (optional - will work without it)
        try {
            const redisClient = initRedis();
            redisClient.connect().then(() => {
                console.log('📦 Redis: Connected');
            }).catch(() => {
                console.log('📦 Redis: Not available (caching disabled)');
            });
        } catch (err) {
            console.log('📦 Redis: Not available (caching disabled)');
        }

        console.log('📍 Available endpoints:');
        console.log('   GET  /                  - Health check');
        console.log('   POST /api/auth/register - User registration');
        console.log('   POST /api/auth/login    - User login');
        console.log('   GET  /api/auth/me       - Get current user (Protected)');
        console.log('   POST /api/auth/refresh  - Refresh access token');
        console.log('========================================');
    });
}

export default app;
