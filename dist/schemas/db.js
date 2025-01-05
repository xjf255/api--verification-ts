import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
export const usersTable = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    user: text('user').notNull().unique(),
    avatar: text('avatar').default('https://cdn.icon-icons.com/icons2/1378/PNG/512/avatardefault_92824.png'),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    resetToken: text('reset_token'),
    resetTokenExpires: timestamp("reset_token_expires"),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
        .notNull()
        .$onUpdate(() => new Date()),
});
