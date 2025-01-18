import { boolean, pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';
export const usersTable = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    user: text('user').notNull().unique(),
    avatar: text('avatar').default('https://res.cloudinary.com/dkshw9hik/image/upload/v1736294033/avatardefault_w9hsxz.webp').notNull(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    resetToken: text('reset_token'),
    resetCod: integer('reset_code'),
    resetTokenExpires: timestamp("reset_token_expires"),
    phone: text('phone'),
    rebootAttempts: integer('reboot_attempts').default(3).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
});
