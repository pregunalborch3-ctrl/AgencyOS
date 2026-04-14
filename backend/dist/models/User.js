"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStore = void 0;
// ─── In-memory store ──────────────────────────────────────────────────────────
// Production: replace with Prisma / TypeORM / Mongoose adapter
const store = new Map();
const emailIndex = new Map(); // email → id
const stripeIndex = new Map(); // stripeCustomerId → id
exports.UserStore = {
    create(user) {
        store.set(user.id, user);
        emailIndex.set(user.email.toLowerCase(), user.id);
        if (user.stripeCustomerId)
            stripeIndex.set(user.stripeCustomerId, user.id);
        return user;
    },
    findById(id) {
        return store.get(id);
    },
    findByEmail(email) {
        const id = emailIndex.get(email.toLowerCase());
        return id ? store.get(id) : undefined;
    },
    findByStripeCustomerId(customerId) {
        const id = stripeIndex.get(customerId);
        return id ? store.get(id) : undefined;
    },
    update(id, patch) {
        const user = store.get(id);
        if (!user)
            return undefined;
        const updated = { ...user, ...patch, id };
        store.set(id, updated);
        if (patch.stripeCustomerId)
            stripeIndex.set(patch.stripeCustomerId, id);
        return updated;
    },
    toPublic(user) {
        const { passwordHash: _pw, ...pub } = user;
        return pub;
    },
};
