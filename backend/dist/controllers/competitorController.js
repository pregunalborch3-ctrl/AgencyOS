"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompetitors = getCompetitors;
exports.getCompetitor = getCompetitor;
exports.createCompetitor = createCompetitor;
exports.updateCompetitor = updateCompetitor;
exports.deleteCompetitor = deleteCompetitor;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function getCompetitors(req, res) {
    const userId = req.user.userId;
    const competitors = await prisma.competitor.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: competitors });
}
async function getCompetitor(req, res) {
    const userId = req.user.userId;
    const competitor = await prisma.competitor.findFirst({ where: { id: req.params.id, userId } });
    if (!competitor) {
        res.status(404).json({ success: false, error: 'Competidor no encontrado' });
        return;
    }
    res.json({ success: true, data: competitor });
}
async function createCompetitor(req, res) {
    const userId = req.user.userId;
    const { name, url, notes } = req.body;
    if (!name) {
        res.status(400).json({ success: false, error: 'name es requerido' });
        return;
    }
    const competitor = await prisma.competitor.create({
        data: { userId, name, url: url ?? null, notes: notes ?? null },
    });
    res.status(201).json({ success: true, data: competitor });
}
const COMPETITOR_ALLOWED = ['name', 'url', 'notes'];
async function updateCompetitor(req, res) {
    const userId = req.user.userId;
    const existing = await prisma.competitor.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) {
        res.status(404).json({ success: false, error: 'Competidor no encontrado' });
        return;
    }
    const body = req.body;
    const clean = {};
    for (const key of COMPETITOR_ALLOWED) {
        if (body[key] !== undefined)
            clean[key] = body[key];
    }
    const updated = await prisma.competitor.update({
        where: { id: req.params.id },
        data: clean,
    });
    res.json({ success: true, data: updated });
}
async function deleteCompetitor(req, res) {
    const userId = req.user.userId;
    const existing = await prisma.competitor.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) {
        res.status(404).json({ success: false, error: 'Competidor no encontrado' });
        return;
    }
    await prisma.competitor.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null });
}
