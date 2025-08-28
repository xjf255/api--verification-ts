import { boolean, pgTable, text, timestamp, uuid, integer, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
export const friendShipStatus = pgEnum('friendship_status', ["pending", "accepted", "blocked"]);
export const usersTable = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    user: text('user').notNull().unique(),
    avatar: text('avatar')
        .default('https://res.cloudinary.com/dkshw9hik/image/upload/v1736294033/avatardefault_w9hsxz.webp')
        .notNull(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    phone: text('phone').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    isGuest: boolean('is_guest').default(false).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
});
export const sessionsTable = pgTable('sessions', {
    id: integer('id').notNull().primaryKey().generatedByDefaultAsIdentity(),
    userId: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }), // Relación con la tabla de usuarios
    accessToken: text('access_token').notNull().unique(),
    refreshToken: text('refresh_token').notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(), // Fecha de inicio de la sesión
    expiresAt: timestamp('expires_at').notNull(), // Fecha de expiración del token
});
export const verificationsTable = pgTable('verifications', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }).unique(),
    resetToken: text('reset_token').unique(), // Token para recuperación de contraseña
    resetCode: text('reset_code'), // Código para 2FA
    resetTokenExpires: timestamp('reset_token_expires'), // Expiración del token
    rebootAttempts: integer('reboot_attempts').default(3).notNull(), // Intentos restantes para 2FA
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
});
export const user_friendships = pgTable('user_friendships', {
    id: uuid('id').defaultRandom().primaryKey(),
    requesterId: uuid('requester_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    addresseeId: uuid('addressee_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    status: friendShipStatus('status').notNull().default('pending'), // pending, accepted, rejected,
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    responsedAt: timestamp('responded_at', { withTimezone: true })
}, (t) => {
    return {
        requesterIdx: index('idx_friendships_requested').on(t.requesterId),
        addresseeIdx: index('idx_friendships_addressee').on(t.addresseeId),
        uniqueDirected: uniqueIndex('uq_friendships').on(t.requesterId, t.addresseeId)
    };
});
