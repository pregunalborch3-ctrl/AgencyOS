"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.me = me;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const crypto_1 = __importDefault(require("crypto"));
const User_1 = require("../models/User");
const security_1 = require("../middleware/security");
const emailService_1 = require("../services/emailService");
const BCRYPT_ROUNDS = 12;
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
function signToken(user) {
    const pwv = crypto_1.default.createHash("sha256").update(user.passwordHash).digest("hex").slice(0, 16);
    const payload = {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        pwv,
    };
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d"),
    });
}
async function register(req, res) {
    const { name, email, password, confirmPassword } = req.body;
    if (!name?.trim() || !email?.trim() || !password || !confirmPassword) {
        res.status(400).json({ success: false, error: "Todos los campos son obligatorios." });
        return;
    }
    if (name.trim().length < 2) {
        res.status(400).json({ success: false, error: "El nombre debe tener al menos 2 caracteres." });
        return;
    }
    if (!isValidEmail(email)) {
        res.status(400).json({ success: false, error: "El formato del email no es valido." });
        return;
    }
    if (await User_1.UserStore.findByEmail(email)) {
        res.status(409).json({ success: false, error: "Ya existe una cuenta con ese email." });
        return;
    }
    if (password !== confirmPassword) {
        res.status(400).json({ success: false, error: "Las contrasenas no coinciden." });
        return;
    }
    const passwordHash = await bcryptjs_1.default.hash(password, BCRYPT_ROUNDS);
    const user = await User_1.UserStore.create({
        id: (0, uuid_1.v4)(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: "member",
        stripeCustomerId: null,
        subscription: null,
        freeUsed: false,
    });
    const token = signToken(user);
    res.status(201).json({
        success: true,
        data: { token, user: User_1.UserStore.toPublic(user) },
    });
    (0, emailService_1.sendWelcomeEmail)(user.email, user.name).catch((err) => {
        console.error("[register] Fallo al enviar email de bienvenida:", err);
    });
}
async function login(req, res) {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
        res.status(400).json({ success: false, error: "Email y contrasena son obligatorios." });
        return;
    }
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const user = await User_1.UserStore.findByEmail(email);
    if (!user) {
        await bcryptjs_1.default.compare(password, "$2a$12$invalidhashplaceholder00000000000000000000");
        (0, security_1.logFailedLogin)(ip, email);
        res.status(401).json({ success: false, error: "Credenciales incorrectas." });
        return;
    }
    const match = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!match) {
        (0, security_1.logFailedLogin)(ip, email);
        res.status(401).json({ success: false, error: "Credenciales incorrectas." });
        return;
    }
    await User_1.UserStore.update(user.id, { lastLoginAt: new Date().toISOString() });
    const token = signToken(user);
    res.json({
        success: true,
        data: { token, user: User_1.UserStore.toPublic(user) },
    });
}
function me(req, res) {
    User_1.UserStore.findById(req.user.userId).then(user => {
        if (!user) {
            res.status(404).json({ success: false, error: "Usuario no encontrado." });
            return;
        }
        res.json({ success: true, data: User_1.UserStore.toPublic(user) });
    });
}
async function forgotPassword(req, res) {
    const { email } = req.body;
    if (!email?.trim() || !isValidEmail(email)) {
        res.status(400).json({ success: false, error: "El formato del email no es válido." });
        return;
    }
    // Always respond the same to avoid user enumeration
    const SAFE_RESPONSE = { success: true, data: { message: "Si ese email existe, recibirás un enlace en breve." } };
    const user = await User_1.UserStore.findByEmail(email);
    if (!user) {
        res.json(SAFE_RESPONSE);
        return;
    }
    // Invalidate any existing unused tokens for this user
    await User_1.prisma.passwordResetToken.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
    });
    const rawToken = crypto_1.default.randomBytes(32).toString("hex");
    const tokenHash = crypto_1.default.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await User_1.prisma.passwordResetToken.create({
        data: { id: (0, uuid_1.v4)(), userId: user.id, tokenHash, expiresAt },
    });
    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;
    (0, emailService_1.sendPasswordResetEmail)(user.email, user.name, resetUrl).catch((err) => {
        console.error("[forgotPassword] Error enviando email de reset:", err);
    });
    res.json(SAFE_RESPONSE);
}
async function resetPassword(req, res) {
    const { token, password, confirmPassword } = req.body;
    if (!token?.trim() || !password || !confirmPassword) {
        res.status(400).json({ success: false, error: "Todos los campos son obligatorios." });
        return;
    }
    if (password !== confirmPassword) {
        res.status(400).json({ success: false, error: "Las contraseñas no coinciden." });
        return;
    }
    if (password.length < 8) {
        res.status(400).json({ success: false, error: "La contraseña debe tener mínimo 8 caracteres." });
        return;
    }
    const tokenHash = crypto_1.default.createHash("sha256").update(token).digest("hex");
    const resetToken = await User_1.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
        res.status(400).json({ success: false, error: "El enlace no es válido o ha caducado. Solicita uno nuevo." });
        return;
    }
    const passwordHash = await bcryptjs_1.default.hash(password, BCRYPT_ROUNDS);
    await User_1.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
    });
    await User_1.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
    });
    res.json({ success: true, data: { message: "Contraseña actualizada correctamente. Ya puedes iniciar sesión." } });
}
