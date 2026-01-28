/**
 * Logger Utility
 * Configured using Winston and Winston Daily Rotate File
 */

import winston from 'winston';
import winstonDaily from 'winston-daily-rotate-file';
import path from 'path';

const logDir = 'logs';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Define custom log format
const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});

/*
 * Log Levels
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */

const logger = winston.createLogger({
    format: combine(
        timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        json() // Save as JSON in files for easier parsing if needed, or use logFormat for text
    ),
    transports: [
        // Info Level Logs (Combined)
        new winstonDaily({
            level: 'info',
            datePattern: 'YYYY-MM-DD',
            dirname: logDir,
            filename: `%DATE%.log`,
            maxFiles: '30d', // Keep logs for 30 days
            zippedArchive: true,
        }),
        // Error Level Logs
        new winstonDaily({
            level: 'error',
            datePattern: 'YYYY-MM-DD',
            dirname: logDir + '/error',  // Save errors in a separate folder
            filename: `%DATE%.error.log`,
            maxFiles: '30d',
            zippedArchive: true,
        }),
    ],
});

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: combine(
                colorize(), // Colorize levels
                logFormat // Use simple text format for console
            ),
        })
    );
}

/**
 * Stream for Morgan (HTTP Request Logger)
 */
export const stream = {
    write: (message: string) => {
        logger.info(message.substring(0, message.lastIndexOf('\n')));
    },
};

export default logger;
