"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRICE_IDS = exports.WEBHOOK_SECRET = exports.PRICE_ID = exports.stripe = void 0;
const stripe_1 = __importDefault(require("stripe"));
if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_REEMPLAZA')) {
    console.warn('\n⚠  STRIPE_SECRET_KEY no configurada. Las rutas de suscripción no funcionarán.\n');
}
exports.stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder');
exports.PRICE_ID = process.env.STRIPE_PRICE_ID ?? '';
exports.WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';
exports.PRICE_IDS = {
    starter: process.env.STRIPE_PRICE_ID_STARTER ?? process.env.STRIPE_PRICE_ID ?? '',
    pro: process.env.STRIPE_PRICE_ID_PRO ?? '',
    enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE ?? '',
};
