"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBudgets = getBudgets;
exports.getBudget = getBudget;
exports.createBudget = createBudget;
exports.updateBudget = updateBudget;
exports.deleteBudget = deleteBudget;
const uuid_1 = require("uuid");
const budgets = [];
function getBudgets(_req, res) {
    res.json({ success: true, data: budgets });
}
function getBudget(req, res) {
    const budget = budgets.find((b) => b.id === req.params.id);
    if (!budget) {
        res.status(404).json({ success: false, error: 'Presupuesto no encontrado' });
        return;
    }
    res.json({ success: true, data: budget });
}
function createBudget(req, res) {
    const body = req.body;
    if (!body.projectName) {
        res.status(400).json({ success: false, error: 'projectName es requerido' });
        return;
    }
    const budget = { ...body, id: (0, uuid_1.v4)(), createdAt: new Date().toISOString() };
    budgets.push(budget);
    res.status(201).json({ success: true, data: budget });
}
function updateBudget(req, res) {
    const idx = budgets.findIndex((b) => b.id === req.params.id);
    if (idx === -1) {
        res.status(404).json({ success: false, error: 'Presupuesto no encontrado' });
        return;
    }
    budgets[idx] = { ...budgets[idx], ...req.body, id: req.params.id };
    res.json({ success: true, data: budgets[idx] });
}
function deleteBudget(req, res) {
    const idx = budgets.findIndex((b) => b.id === req.params.id);
    if (idx === -1) {
        res.status(404).json({ success: false, error: 'Presupuesto no encontrado' });
        return;
    }
    budgets.splice(idx, 1);
    res.json({ success: true, data: null });
}
