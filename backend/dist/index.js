"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const security_1 = require("./middleware/security");
// Validate env vars before anything else
console.log('\n🔐 Verificando variables de entorno…');
(0, security_1.validateEnv)();
console.log('  ✓ Variables de entorno OK\n');
const auth_1 = __importDefault(require("./routes/auth"));
const subscription_1 = __importDefault(require("./routes/subscription"));
const campaigns_1 = __importDefault(require("./routes/campaigns"));
const content_1 = __importDefault(require("./routes/content"));
const calendar_1 = __importDefault(require("./routes/calendar"));
const budget_1 = __importDefault(require("./routes/budget"));
const briefing_1 = __importDefault(require("./routes/briefing"));
const competitor_1 = __importDefault(require("./routes/competitor"));
const home_1 = __importDefault(require("./routes/home"));
const frameworks_1 = __importDefault(require("./routes/frameworks"));
const settings_1 = __importDefault(require("./routes/settings"));
const apiKeys_1 = __importDefault(require("./routes/apiKeys"));
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 3001;
// Trust proxy (Railway / Vercel sit behind a reverse proxy)
app.set('trust proxy', 1);
// Security headers
const frontendOrigin = process.env.FRONTEND_URL ?? 'http://localhost:5173';
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'none'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", frontendOrigin],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: [],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
}));
// CORS
app.use((0, cors_1.default)({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }));
// Global rate limiter — applied before all routes
app.use(security_1.generalLimiter);
// ⚠  Stripe webhook needs raw body — mount BEFORE express.json()
app.post('/api/subscription/webhook', express_1.default.raw({ type: 'application/json' }), (req, res, next) => { (0, subscription_1.default)(req, res, next); });
// Body parsing with size limit + sanitization
app.use(express_1.default.json({ limit: '1mb' }));
app.use(security_1.sanitizeBody);
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/subscription', subscription_1.default);
app.use('/api/campaigns', campaigns_1.default);
app.use('/api/content', content_1.default);
app.use('/api/calendar', calendar_1.default);
app.use('/api/budget', budget_1.default);
app.use('/api/briefing', briefing_1.default);
app.use('/api/competitor', competitor_1.default);
app.use('/api/home', home_1.default);
app.use('/api/frameworks', frameworks_1.default);
app.use('/api/settings', settings_1.default);
app.use('/api/apikeys', apiKeys_1.default);
// Health
app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'AgencyOS API running', timestamp: new Date().toISOString() });
});
app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
});
app.listen(PORT, () => {
    console.log(`🚀 AgencyOS API  →  http://localhost:${PORT}`);
    console.log(`   Health        →  http://localhost:${PORT}/api/health\n`);
});
exports.default = app;
