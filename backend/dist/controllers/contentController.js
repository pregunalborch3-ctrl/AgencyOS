"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateContent = generateContent;
exports.getContentHistory = getContentHistory;
const client_1 = require("@prisma/client");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const uuid_1 = require("uuid");
const prisma = new client_1.PrismaClient();
const client = new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
const CLAUDE_TIMEOUT_MS = 30000;
async function generateThreeVariations(body) {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('La IA tardó demasiado. Por favor, inténtalo de nuevo.')), CLAUDE_TIMEOUT_MS));
    const message = await Promise.race([
        client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 1500,
            messages: [{
                    role: 'user',
                    content: `Eres un experto en marketing digital y redes sociales.
Genera EXACTAMENTE 3 captions diferentes y profesionales para ${body.platform} con estas características:
- Marca: ${body.brand}
- Tema: ${body.topic}
- Tono: ${body.tone || 'profesional y cercano'}
- Keywords/hashtags: ${body.keywords}
- Call to action: ${body.callToAction || 'genérico apropiado'}

Cada caption debe:
- Ser natural y no genérico
- Incluir emojis relevantes
- Terminar con hashtags
- Estar optimizado para ${body.platform}
- Tener entre 100-300 caracteres (sin hashtags)
- Ser claramente distinto a los otros dos (diferente ángulo, tono o estructura)

Responde ÚNICAMENTE con este JSON (sin markdown, sin comentarios):
{"captions": ["caption1", "caption2", "caption3"]}`,
                }],
        }),
        timeout,
    ]);
    const raw = message.content[0].text.trim();
    const clean = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(clean);
    return parsed.captions;
}
async function generateContent(req, res) {
    const userId = req.user.userId;
    const body = req.body;
    if (!body.topic || !body.brand || !body.platform) {
        res.status(400).json({ success: false, error: 'topic, brand y platform son requeridos' });
        return;
    }
    try {
        const captions = await generateThreeVariations(body);
        const variations = captions.map((caption) => ({
            id: (0, uuid_1.v4)(),
            caption,
            hashtags: body.keywords.split(',').map((k) => k.trim().replace(/\s/g, '')).filter(Boolean),
            platform: body.platform,
            createdAt: new Date().toISOString(),
        }));
        await prisma.contentHistory.createMany({
            data: variations.map((item) => ({ userId, content: item })),
        });
        res.json({ success: true, data: variations });
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Error al generar contenido con IA';
        res.status(500).json({ success: false, error: msg });
    }
}
async function getContentHistory(req, res) {
    const userId = req.user.userId;
    const rows = await prisma.contentHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });
    const data = rows.map((r) => r.content);
    res.json({ success: true, data });
}
