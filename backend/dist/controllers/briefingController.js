"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBriefings = getBriefings;
exports.getBriefing = getBriefing;
exports.createBriefing = createBriefing;
exports.updateBriefing = updateBriefing;
exports.deleteBriefing = deleteBriefing;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const BRIEFING_ALLOWED_FIELDS = [
    'clientName', 'brand', 'projectName', 'projectType', 'objective',
    'targetAudience', 'ageRange', 'location', 'keyMessage', 'tone',
    'mandatories', 'restrictions', 'deliverables', 'startDate', 'endDate',
    'budget', 'competitors', 'references', 'additionalNotes',
];
async function getBriefings(req, res) {
    const userId = req.user.userId;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const cursor = req.query.cursor;
    const briefings = await prisma.briefing.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = briefings.length > limit;
    const items = hasMore ? briefings.slice(0, limit) : briefings;
    const nextCursor = hasMore ? items[items.length - 1].id : null;
    res.json({ success: true, data: items, meta: { hasMore, nextCursor } });
}
async function getBriefing(req, res) {
    const userId = req.user.userId;
    const briefing = await prisma.briefing.findFirst({
        where: { id: req.params.id, userId },
    });
    if (!briefing) {
        res.status(404).json({ success: false, error: 'Briefing no encontrado' });
        return;
    }
    res.json({ success: true, data: briefing });
}
async function createBriefing(req, res) {
    const userId = req.user.userId;
    const body = req.body;
    if (!body.clientName || !body.projectName) {
        res.status(400).json({ success: false, error: 'clientName y projectName son requeridos' });
        return;
    }
    const briefing = await prisma.briefing.create({
        data: {
            userId,
            clientName: body.clientName,
            brand: body.brand ?? '',
            projectName: body.projectName,
            projectType: body.projectType ?? '',
            objective: body.objective ?? '',
            targetAudience: body.targetAudience ?? '',
            ageRange: body.ageRange ?? '',
            location: body.location ?? '',
            keyMessage: body.keyMessage ?? '',
            tone: body.tone ?? '',
            mandatories: body.mandatories ?? '',
            restrictions: body.restrictions ?? '',
            deliverables: body.deliverables ?? '',
            startDate: body.startDate ?? '',
            endDate: body.endDate ?? '',
            budget: body.budget ?? '',
            competitors: body.competitors ?? '',
            references: body.references ?? '',
            additionalNotes: body.additionalNotes ?? '',
        },
    });
    res.status(201).json({ success: true, data: briefing });
}
async function updateBriefing(req, res) {
    const userId = req.user.userId;
    const existing = await prisma.briefing.findFirst({
        where: { id: req.params.id, userId },
    });
    if (!existing) {
        res.status(404).json({ success: false, error: 'Briefing no encontrado' });
        return;
    }
    const body = req.body;
    const clean = {};
    for (const key of BRIEFING_ALLOWED_FIELDS) {
        if (body[key] !== undefined)
            clean[key] = body[key];
    }
    const updated = await prisma.briefing.update({
        where: { id: req.params.id },
        data: clean,
    });
    res.json({ success: true, data: updated });
}
async function deleteBriefing(req, res) {
    const userId = req.user.userId;
    const existing = await prisma.briefing.findFirst({
        where: { id: req.params.id, userId },
    });
    if (!existing) {
        res.status(404).json({ success: false, error: 'Briefing no encontrado' });
        return;
    }
    await prisma.briefing.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null });
}
