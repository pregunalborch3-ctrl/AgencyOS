"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBudgets = getBudgets;
exports.getBudget = getBudget;
exports.createBudget = createBudget;
exports.updateBudget = updateBudget;
exports.deleteBudget = deleteBudget;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function getBudgets(req, res) {
    const userId = req.user.userId;
    const budgets = await prisma.budget.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: budgets });
}
async function getBudget(req, res) {
    const userId = req.user.userId;
    const budget = await prisma.budget.findFirst({
        where: { id: req.params.id, userId },
    });
    if (!budget) {
        res.status(404).json({ success: false, error: 'Presupuesto no encontrado' });
        return;
    }
    res.json({ success: true, data: budget });
}
async function createBudget(req, res) {
    const userId = req.user.userId;
    const body = req.body;
    if (!body.projectName) {
        res.status(400).json({ success: false, error: 'projectName es requerido' });
        return;
    }
    const budget = await prisma.budget.create({
        data: {
            userId,
            projectName: body.projectName,
            client: body.client ?? '',
            currency: body.currency ?? 'EUR',
            items: (body.items ?? []),
            agencyFeePercent: body.agencyFeePercent ?? 0,
            taxPercent: body.taxPercent ?? 0,
            notes: body.notes ?? '',
        },
    });
    res.status(201).json({ success: true, data: budget });
}
const BUDGET_ALLOWED = ['projectName', 'client', 'currency', 'items', 'agencyFeePercent', 'taxPercent', 'notes'];
async function updateBudget(req, res) {
    const userId = req.user.userId;
    const existing = await prisma.budget.findFirst({
        where: { id: req.params.id, userId },
    });
    if (!existing) {
        res.status(404).json({ success: false, error: 'Presupuesto no encontrado' });
        return;
    }
    const body = req.body;
    const clean = {};
    for (const key of BUDGET_ALLOWED) {
        if (body[key] !== undefined)
            clean[key] = body[key];
    }
    const updated = await prisma.budget.update({
        where: { id: req.params.id },
        data: clean,
    });
    res.json({ success: true, data: updated });
}
async function deleteBudget(req, res) {
    const userId = req.user.userId;
    const existing = await prisma.budget.findFirst({
        where: { id: req.params.id, userId },
    });
    if (!existing) {
        res.status(404).json({ success: false, error: 'Presupuesto no encontrado' });
        return;
    }
    await prisma.budget.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null });
}
