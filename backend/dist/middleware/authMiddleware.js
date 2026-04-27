"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireApiKey = requireApiKey;
exports.requireAuth = requireAuth;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
// ─── API Key middleware (for Enterprise/programmatic access) ──────────────────
async function requireApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey?.startsWith('aos_sk_')) {
        res.status(401).json({ success: false, error: 'API key requerida. Usa el header X-API-Key.' });
        return;
    }
    try {
        const hash = crypto_1.default.createHash('sha256').update(apiKey).digest('hex');
        const record = await User_1.prisma.apiKey.findUnique({ where: { keyHash: hash } });
        if (!record) {
            res.status(401).json({ success: false, error: 'API key inválida.' });
            return;
        }
        // fire-and-forget lastUsed update
        User_1.prisma.apiKey.update({ where: { id: record.id }, data: { lastUsed: new Date() } }).catch(() => { });
        const user = await User_1.UserStore.findById(record.userId);
        if (!user) {
            res.status(401).json({ success: false, error: 'Usuario no encontrado.' });
            return;
        }
        req.user = { userId: user.id, email: user.email, name: user.name, role: user.role };
        next();
    }
    catch {
        res.status(500).json({ success: false, error: 'Error validando API key.' });
    }
}
async function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: 'Token de autenticación requerido.' });
        return;
    }
    const token = header.slice(7);
    try {
        const secret = process.env.JWT_SECRET;
        const payload = jsonwebtoken_1.default.verify(token, secret);
        const user = await User_1.UserStore.findById(payload.userId);
        if (!user) {
            res.status(401).json({ success: false, error: 'Usuario no encontrado.' });
            return;
        }
        // Invalidate tokens issued before a password change
        const currentPwv = crypto_1.default.createHash('sha256').update(user.passwordHash).digest('hex').slice(0, 16);
        if (payload.pwv && payload.pwv !== currentPwv) {
            res.status(401).json({ success: false, error: 'Sesión inválida. Por favor inicia sesión de nuevo.' });
            return;
        }
        req.user = payload;
        next();
    }
    catch {
        res.status(401).json({ success: false, error: 'Token inválido o expirado.' });
    }
}
