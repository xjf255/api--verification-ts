import { boolean, pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  user: text('user').notNull().unique(),
  avatar: text('avatar').default('https://res.cloudinary.com/dkshw9hik/image/upload/v1736294033/avatardefault_w9hsxz.webp').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  resetToken: text('reset_token'),
  resetTokenExpires: timestamp("reset_token_expires"),
  phone: integer('phone').unique(),
  rebootAttempts: integer('reboot_attempts').default(3),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;
