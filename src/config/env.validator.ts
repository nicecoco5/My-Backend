import { z } from 'zod';

const envSchema = z.object({
    // Server Configuration
    PORT: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().positive()).optional().default(3000),
    NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),

    // Database
    DATABASE_URL: z.string().url({ message: "Invalid DATABASE_URL format" }),

    // JWT
    JWT_SECRET: z.string().min(32, { message: "JWT_SECRET must be at least 32 characters long" }),
    JWT_REFRESH_SECRET: z.string().min(32).optional(),

    // Email Configuration
    EMAIL_HOST: z.string().min(1),
    EMAIL_PORT: z.string().transform((val) => parseInt(val, 10)).pipe(z.number()),
    EMAIL_USER: z.string().min(1),
    EMAIL_PASSWORD: z.string().min(1),
    EMAIL_FROM: z.string().email(),

    // Frontend
    FRONTEND_URL: z.string().url().optional(),

    // Optional Services
    REDIS_URL: z.string().url().optional(),
});

export const validateEnv = () => {
    // Skip validation in test environment
    if (process.env.NODE_ENV === 'test') {
        return;
    }

    try {
        console.log('🔍 Validating environment variables...');
        const result = envSchema.parse(process.env);
        console.log('✅ Environment variables validated successfully.');
        return result;
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('❌ Environment Validation Failed:');
            error.issues.forEach((err: any) => {
                console.error(`   - ${err.path.join('.')}: ${err.message}`);
            });
            process.exit(1);
        }
        throw error;
    }
};
