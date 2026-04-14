"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateContent = generateContent;
exports.getContentHistory = getContentHistory;
const uuid_1 = require("uuid");
// In-memory store (replace with DB in production)
const history = [];
function buildCaption(req) {
    const ctas = req.callToAction
        ? [req.callToAction]
        : ['Descúbrelo ahora.', 'Contáctanos hoy.', '¡No te lo pierdas!'];
    const cta = ctas[Math.floor(Math.random() * ctas.length)];
    const keywords = req.keywords.split(',').map((k) => k.trim()).filter(Boolean);
    const hashtags = keywords.map((k) => `#${k.replace(/\s/g, '')}`).join(' ');
    const templates = [
        `¡${req.brand} lo hace de nuevo! 🚀\n\n${req.topic} — la oportunidad que estabas esperando.\n\n${cta}\n\n${hashtags}`,
        `Hablemos de ${req.topic.toLowerCase()} ✨\n\nEn ${req.brand} creemos en resultados reales. Cada acción cuenta, cada detalle importa.\n\n${cta}\n\n${hashtags}`,
        `${req.topic} — más que una tendencia, una necesidad. 💡\n\nDesde ${req.brand} te acompañamos en cada paso.\n\n${cta}\n\n${hashtags}`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
}
function generateContent(req, res) {
    const body = req.body;
    if (!body.topic || !body.brand || !body.platform) {
        res.status(400).json({ success: false, error: 'topic, brand y platform son requeridos' });
        return;
    }
    const variations = Array.from({ length: 3 }, () => {
        const item = {
            id: (0, uuid_1.v4)(),
            caption: buildCaption(body),
            hashtags: body.keywords.split(',').map((k) => k.trim().replace(/\s/g, '')).filter(Boolean),
            platform: body.platform,
            createdAt: new Date().toISOString(),
        };
        history.push(item);
        return item;
    });
    res.json({ success: true, data: variations });
}
function getContentHistory(_req, res) {
    res.json({ success: true, data: history.slice(-50) });
}
