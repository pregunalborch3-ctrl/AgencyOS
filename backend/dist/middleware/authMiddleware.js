"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: 'Token de autenticación requerido.' });
        return;
    }
    const token = header.slice(7);
    try {
        const secret = process.env.JWT_SECRET;
        const payload = jsonwebtoken_1.default.verify(token, secret);
        // Ensure user still exists
        const user = User_1.UserStore.findById(payload.userId);
        if (!user) {
            res.status(401).json({ success: false, error: 'Usuario no encontrado.' });
            return;
        }
        req.user = payload;
        next();
    }
    catch {
        res.status(401).json({ success: false, error: 'Token inválido o expirado.' });
    }
}
