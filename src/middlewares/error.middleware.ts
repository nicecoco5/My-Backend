/**
 * Error Middleware
 * Global error handling with Winston logging
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// 404 Not Found Handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
    const error = new Error(`Route ${req.method} ${req.path} not found`);
    res.status(404).json({
        error: 'Not Found',
        message: error.message
    });
};

// Global Error Handler
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    // Log the error
    logger.error(`${err.message} - ${req.method} ${req.path} - ${req.ip}`);

    // Log stack trace in development
    if (process.env.NODE_ENV === 'development') {
        logger.debug(err.stack);
    }

    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
};
