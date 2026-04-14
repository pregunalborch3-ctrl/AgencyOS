"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const auth_1 = __importDefault(require("./routes/auth"));
const subscription_1 = __importDefault(require("./routes/subscription"));
const content_1 = __importDefault(require("./routes/content"));
const calendar_1 = __importDefault(require("./routes/calendar"));
const budget_1 = __importDefault(require("./routes/budget"));
const briefing_1 = __importDefault(require("./routes/briefing"));
const competitor_1 = __importDefault(require("./routes/competitor"));
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 3001;
app.use((0, cors_1.default)({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }));
// ⚠  Stripe webhook needs raw body — mount BEFORE express.json()
app.post('/api/subscription/webhook', express_1.default.raw({ type: 'application/json' }), (req, res, next) => { (0, subscription_1.default)(req, res, next); });
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/subscription', subscription_1.default);
app.use('/api/content', content_1.default);
app.use('/api/calendar', calendar_1.default);
app.use('/api/budget', budget_1.default);
app.use('/api/briefing', briefing_1.default);
app.use('/api/competitor', competitor_1.default);
// Health
app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'AgencyOS API running', timestamp: new Date().toISOString() });
});
app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
});
app.listen(PORT, () => {
    console.log(`\n🚀 AgencyOS API  →  http://localhost:${PORT}`);
    console.log(`   Health        →  http://localhost:${PORT}/api/health\n`);
});
exports.default = app;
