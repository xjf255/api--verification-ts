import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
export const usersTable = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    user: text('user').notNull().unique(),
    password: text('password').notNull(),
    email: text('email').notNull().unique(),
    isActive: boolean('isActive').default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
        .notNull()
        .$onUpdate(() => new Date()),
});
