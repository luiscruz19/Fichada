import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const isProduction = process.env.NODE_ENV === 'production';

const buildAllowedOrigins = () => {
    const raw = process.env.CORS_ALLOWED_ORIGINS || process.env.WEB_URL || '';

    if (!raw) {
        if (isProduction) {
            console.error('[security] CORS_ALLOWED_ORIGINS or WEB_URL must be set in production');
            process.exit(1);
        }
        // In development, allow any origin so local frontends work without configuration
        return null;
    }

    const origins = raw.split(',').map(o => o.trim()).filter(Boolean);
    return origins.length ? origins : null;
};

const allowedOrigins = buildAllowedOrigins();

const corsOptions = {
    origin(origin, callback) {
        // Allow server-to-server requests (no Origin header) and configured origins
        if (!origin || !allowedOrigins || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Origin not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token', 'x-requested-with', 'x-idempotency-key'],
    credentials: true,
};

const getRateLimitConfig = () => {
    const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
    const max = Number(process.env.RATE_LIMIT_MAX || 100);

    if (isProduction && (!process.env.RATE_LIMIT_WINDOW_MS || !process.env.RATE_LIMIT_MAX)) {
        console.warn('[security] RATE_LIMIT_WINDOW_MS / RATE_LIMIT_MAX not set — using defaults');
    }

    return { windowMs, max };
};

const { windowMs, max } = getRateLimitConfig();

const apiRateLimit = rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 0, message: 'Too many requests, please try again later.' },
});

export const applySecurity = (app) => {
    app.use(helmet({
        // API-only service — no CSP or COEP needed
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
        frameguard: { action: 'deny' },
        noSniff: true,
        hidePoweredBy: true,
        referrerPolicy: { policy: 'same-origin' },
    }));
    app.use(cors(corsOptions));
    app.use(apiRateLimit);
};
