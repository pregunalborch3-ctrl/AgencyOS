"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStore = exports.prisma = void 0;
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient();
function toUser(u) {
    return {
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash: u.passwordHash,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
        lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
        stripeCustomerId: u.stripeCustomerId,
        subscription: u.subscriptionId ? {
            stripeSubscriptionId: u.subscriptionId,
            status: u.subscriptionStatus,
            currentPeriodEnd: u.subscriptionEnd ? u.subscriptionEnd.toISOString() : "",
            cancelAtPeriodEnd: u.cancelAtPeriodEnd,
            priceId: u.priceId ?? "",
            trialEnd: u.trialEnd ? u.trialEnd.toISOString() : null,
        } : null,
    };
}
exports.UserStore = {
    async create(user) {
        const u = await exports.prisma.user.create({
            data: {
                id: user.id,
                name: user.name,
                email: user.email.toLowerCase(),
                passwordHash: user.passwordHash,
                role: user.role,
            }
        });
        return toUser(u);
    },
    async findById(id) {
        const u = await exports.prisma.user.findUnique({ where: { id } });
        return u ? toUser(u) : undefined;
    },
    async findByEmail(email) {
        const u = await exports.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        return u ? toUser(u) : undefined;
    },
    async findByStripeCustomerId(customerId) {
        const u = await exports.prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
        return u ? toUser(u) : undefined;
    },
    async update(id, data) {
        const updateData = {};
        if (data.lastLoginAt !== undefined)
            updateData.lastLoginAt = data.lastLoginAt ? new Date(data.lastLoginAt) : null;
        if (data.stripeCustomerId !== undefined)
            updateData.stripeCustomerId = data.stripeCustomerId;
        if (data.subscriptionId !== undefined)
            updateData.subscriptionId = data.subscriptionId;
        if (data.subscriptionStatus !== undefined)
            updateData.subscriptionStatus = data.subscriptionStatus;
        if (data.subscriptionEnd !== undefined)
            updateData.subscriptionEnd = data.subscriptionEnd ? new Date(data.subscriptionEnd) : null;
        if (data.trialEnd !== undefined)
            updateData.trialEnd = data.trialEnd ? new Date(data.trialEnd) : null;
        if (data.priceId !== undefined)
            updateData.priceId = data.priceId;
        if (data.cancelAtPeriodEnd !== undefined)
            updateData.cancelAtPeriodEnd = data.cancelAtPeriodEnd;
        if (data.subscription !== undefined) {
            const sub = data.subscription;
            if (sub) {
                updateData.subscriptionId = sub.stripeSubscriptionId;
                updateData.subscriptionStatus = sub.status;
                updateData.subscriptionEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
                updateData.cancelAtPeriodEnd = sub.cancelAtPeriodEnd;
                updateData.priceId = sub.priceId;
                updateData.trialEnd = sub.trialEnd ? new Date(sub.trialEnd) : null;
            }
            else {
                updateData.subscriptionId = null;
                updateData.subscriptionStatus = null;
                updateData.subscriptionEnd = null;
                updateData.cancelAtPeriodEnd = false;
                updateData.priceId = null;
                updateData.trialEnd = null;
            }
        }
        const u = await exports.prisma.user.update({ where: { id }, data: updateData });
        return toUser(u);
    },
    toPublic(user) {
        const { passwordHash, ...pub } = user;
        return pub;
    }
};
