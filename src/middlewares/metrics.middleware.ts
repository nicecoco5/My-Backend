import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Create a Registry
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
    app: 'my-backend'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Define the Histogram metric
const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5] // buckets for response time from 0.1s to 5s
});

// Register the metric
register.registerMetric(httpRequestDurationMicroseconds);

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;

        // Use req.route.path to avoid high cardinality (e.g., /users/:id instead of /users/123)
        // If req.route is undefined (e.g. 404), fallback to req.path or 'unknown_route'
        // Note: req.baseUrl is needed if routers are mounted
        let route = req.route ? req.route.path : null;

        if (req.baseUrl) {
            route = route ? `${req.baseUrl}${route}` : req.baseUrl;
        }

        // Fallback for non-matched routes (usually 404)
        if (!route) {
            route = req.path;
            // Optional: you might want to group all 404s or specific unhandled paths
            // to prevent cardinality explosion if bots scan random paths.
            // For now, using path is acceptable if assuming mainly valid traffic or low volume 404s.
        }

        httpRequestDurationMicroseconds
            .labels(req.method, route || 'unknown', res.statusCode.toString())
            .observe(duration);
    });

    next();
};

export const getMetrics = async () => {
    return await register.metrics();
};

export const metricsContentType = register.contentType;
