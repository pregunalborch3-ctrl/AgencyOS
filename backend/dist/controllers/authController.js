"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.me = me;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const User_1 = require("../models/User");
const BCRYPT_ROUNDS = 12;
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
function signToken(user) {
    const payload = {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
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
    });
    const token = signToken(user);
    res.status(201).json({
        success: true,
        data: { token, user: User_1.UserStore.toPublic(user) },
    });
}
async function login(req, res) {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
        res.status(400).json({ success: false, error: "Email y contrasena son obligatorios." });
        return;
    }
    const user = await User_1.UserStore.findByEmail(email);
    if (!user) {
        await bcryptjs_1.default.compare(password, "$2a$12$invalidhashplaceholder00000000000000000000");
        res.status(401).json({ success: false, error: "Credenciales incorrectas." });
        return;
    }
    const match = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!match) {
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
