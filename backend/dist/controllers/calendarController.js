"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPosts = getPosts;
exports.createPost = createPost;
exports.updatePost = updatePost;
exports.deletePost = deletePost;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function getPosts(req, res) {
    const userId = req.user.userId;
    const posts = await prisma.calendarPost.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
    });
    res.json({ success: true, data: posts });
}
async function createPost(req, res) {
    const userId = req.user.userId;
    const { title, date, platform, content, status } = req.body;
    if (!title || !date || !platform || !content) {
        res.status(400).json({ success: false, error: 'title, date, platform y content son requeridos' });
        return;
    }
    const post = await prisma.calendarPost.create({
        data: { userId, title, date, platform, content, status: status ?? 'draft' },
    });
    res.status(201).json({ success: true, data: post });
}
const CALENDAR_ALLOWED = ['title', 'date', 'platform', 'content', 'status'];
async function updatePost(req, res) {
    const userId = req.user.userId;
    const existing = await prisma.calendarPost.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) {
        res.status(404).json({ success: false, error: 'Post no encontrado' });
        return;
    }
    const body = req.body;
    const clean = {};
    for (const key of CALENDAR_ALLOWED) {
        if (body[key] !== undefined)
            clean[key] = body[key];
    }
    const updated = await prisma.calendarPost.update({
        where: { id: req.params.id },
        data: clean,
    });
    res.json({ success: true, data: updated });
}
async function deletePost(req, res) {
    const userId = req.user.userId;
    const existing = await prisma.calendarPost.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) {
        res.status(404).json({ success: false, error: 'Post no encontrado' });
        return;
    }
    await prisma.calendarPost.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null });
}
