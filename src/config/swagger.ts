import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Secure Backend API',
            version: '1.0.0',
            description: 'Security-first authentication and community backend with email verification, JWT tokens, and comprehensive security features.',
            contact: {
                name: 'API Support',
                email: 'support@example.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
            {
                url: 'https://api.yourdomain.com',
                description: 'Production server',
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token in the format: Bearer {token}'
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            example: '123e4567-e89b-12d3-a456-426614174000'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'user@example.com'
                        },
                        nickname: {
                            type: 'string',
                            example: 'johndoe'
                        },
                        emailVerified: {
                            type: 'boolean',
                            example: true
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            example: 'Error Type'
                        },
                        message: {
                            type: 'string',
                            example: 'Error message description'
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Authentication',
                description: 'User authentication and authorization endpoints'
            },
            {
                name: 'Email Verification',
                description: 'Email verification and code management'
            },
            {
                name: 'Password Management',
                description: 'Password reset and recovery'
            },
            {
                name: 'Posts',
                description: 'Blog posts CRUD operations'
            },
            {
                name: 'Comments',
                description: 'Post comments and replies'
            },
            {
                name: 'Likes',
                description: 'Post likes and engagement'
            },
            {
                name: 'Upload',
                description: 'File upload and management'
            },
            {
                name: 'Profile',
                description: 'User profile management'
            },
            {
                name: 'Social Login',
                description: 'OAuth social login (Google, Kakao)'
            }
        ]
    },
    apis: ['./src/controllers/*.ts', './src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
