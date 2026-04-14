"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscriptionController_1 = require("../controllers/subscriptionController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Webhook must use raw body — mounted with express.raw() in index.ts
router.post('/webhook', subscriptionController_1.handleWebhook);
// Authenticated endpoints
router.get('/status', authMiddleware_1.requireAuth, subscriptionController_1.getStatus);
router.post('/checkout', authMiddleware_1.requireAuth, subscriptionController_1.createCheckoutSession);
router.post('/portal', authMiddleware_1.requireAuth, subscriptionController_1.createPortalSession);
router.post('/cancel', authMiddleware_1.requireAuth, subscriptionController_1.cancelSubscription);
router.post('/reactivate', authMiddleware_1.requireAuth, subscriptionController_1.reactivateSubscription);
exports.default = router;
