"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPosts = getPosts;
exports.createPost = createPost;
exports.updatePost = updatePost;
exports.deletePost = deletePost;
const uuid_1 = require("uuid");
const posts = [
    {
        id: (0, uuid_1.v4)(),
        title: 'Lanzamiento campaña verano',
        content: '¡El verano llegó! Descubre nuestra nueva colección...',
        platform: 'instagram',
        status: 'programado',
        scheduledAt: new Date(2026, 3, 15, 10, 0).toISOString(),
        tags: ['verano', 'colección'],
    },
];
function getPosts(_req, res) {
    res.json({ success: true, data: posts });
}
function createPost(req, res) {
    const body = req.body;
    if (!body.title || !body.platform || !body.scheduledAt) {
        res.status(400).json({ success: false, error: 'title, platform y scheduledAt son requeridos' });
        return;
    }
    const post = { ...body, id: (0, uuid_1.v4)() };
    posts.push(post);
    res.status(201).json({ success: true, data: post });
}
function updatePost(req, res) {
    const { id } = req.params;
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) {
        res.status(404).json({ success: false, error: 'Post no encontrado' });
        return;
    }
    posts[idx] = { ...posts[idx], ...req.body, id };
    res.json({ success: true, data: posts[idx] });
}
function deletePost(req, res) {
    const { id } = req.params;
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) {
        res.status(404).json({ success: false, error: 'Post no encontrado' });
        return;
    }
    posts.splice(idx, 1);
    res.json({ success: true, data: null });
}
