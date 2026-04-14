"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompetitors = getCompetitors;
exports.getCompetitor = getCompetitor;
exports.createCompetitor = createCompetitor;
exports.updateCompetitor = updateCompetitor;
exports.deleteCompetitor = deleteCompetitor;
const uuid_1 = require("uuid");
const competitors = [];
function getCompetitors(_req, res) {
    res.json({ success: true, data: competitors });
}
function getCompetitor(req, res) {
    const c = competitors.find((x) => x.id === req.params.id);
    if (!c) {
        res.status(404).json({ success: false, error: 'Competidor no encontrado' });
        return;
    }
    res.json({ success: true, data: c });
}
function createCompetitor(req, res) {
    const body = req.body;
    if (!body.name) {
        res.status(400).json({ success: false, error: 'name es requerido' });
        return;
    }
    const competitor = {
        ...body,
        id: (0, uuid_1.v4)(),
        createdAt: new Date().toISOString(),
    };
    competitors.push(competitor);
    res.status(201).json({ success: true, data: competitor });
}
function updateCompetitor(req, res) {
    const idx = competitors.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
        res.status(404).json({ success: false, error: 'Competidor no encontrado' });
        return;
    }
    competitors[idx] = { ...competitors[idx], ...req.body, id: req.params.id };
    res.json({ success: true, data: competitors[idx] });
}
function deleteCompetitor(req, res) {
    const idx = competitors.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
        res.status(404).json({ success: false, error: 'Competidor no encontrado' });
        return;
    }
    competitors.splice(idx, 1);
    res.json({ success: true, data: null });
}
