"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contentController_1 = require("../controllers/contentController");
const router = (0, express_1.Router)();
router.post('/generate', contentController_1.generateContent);
router.get('/history', contentController_1.getContentHistory);
exports.default = router;
