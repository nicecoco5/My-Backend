import dotenv from 'dotenv';

dotenv.config();

/**
 * Application Configuration
 * All environment variables and constants are managed here
 */
export const config = {
    // Server
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    // Database
    databaseUrl: process.env.DATABASE_URL || '',

    // JWT
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
    jwtExpiresIn: '15m', // Access token expiration (15 minutes)
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'default-refresh-secret',
    jwtRefreshExpiresIn: '7d', // Refresh token expiration (7 days)

    // Refresh Token
    refreshTokenExpiresIn: '7d', // Refresh token expiration (7 days)

    // Email Configuration
    emailHost: process.env.EMAIL_HOST || 'smtp.gmail.com',
    emailPort: parseInt(process.env.EMAIL_PORT || '587', 10),
    emailUser: process.env.EMAIL_USER || '',
    emailPassword: process.env.EMAIL_PASSWORD || '',
    emailFrom: process.env.EMAIL_FROM || 'noreply@example.com',

    // Password Reset
    resetTokenExpiresIn: '10m', // Password reset token expiration (10 minutes for security)
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',

    // Cookie settings for refresh token
    cookieMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    cookieSecure: process.env.NODE_ENV === 'production', // HTTPS only in production
    cookieSameSite: 'strict' as const, // CSRF protection

    // Password validation (영문자 + 숫자 + 특수문자 필수, 8자 이상)
    passwordRegex: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
} as const;

export default config;
