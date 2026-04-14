"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBriefings = getBriefings;
exports.getBriefing = getBriefing;
exports.createBriefing = createBriefing;
exports.updateBriefing = updateBriefing;
exports.deleteBriefing = deleteBriefing;
const uuid_1 = require("uuid");
const briefings = [];
function getBriefings(_req, res) {
    res.json({ success: true, data: briefings });
}
function getBriefing(req, res) {
    const b = briefings.find((x) => x.id === req.params.id);
    if (!b) {
        res.status(404).json({ success: false, error: 'Briefing no encontrado' });
        return;
    }
    res.json({ success: true, data: b });
}
function createBriefing(req, res) {
    const body = req.body;
    if (!body.clientName || !body.projectName) {
        res.status(400).json({ success: false, error: 'clientName y projectName son requeridos' });
        return;
    }
    const briefing = { ...body, id: (0, uuid_1.v4)(), createdAt: new Date().toISOString() };
    briefings.push(briefing);
    res.status(201).json({ success: true, data: briefing });
}
function updateBriefing(req, res) {
    const idx = briefings.findIndex((b) => b.id === req.params.id);
    if (idx === -1) {
        res.status(404).json({ success: false, error: 'Briefing no encontrado' });
        return;
    }
    briefings[idx] = { ...briefings[idx], ...req.body, id: req.params.id };
    res.json({ success: true, data: briefings[idx] });
}
function deleteBriefing(req, res) {
    const idx = briefings.findIndex((b) => b.id === req.params.id);
    if (idx === -1) {
        res.status(404).json({ success: false, error: 'Briefing no encontrado' });
        return;
    }
    briefings.splice(idx, 1);
    res.json({ success: true, data: null });
}
