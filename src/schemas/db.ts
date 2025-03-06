import { boolean, pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';

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
  isGuest : boolean('is_guest').default(false).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
})

export const sessionsTable = pgTable('sessions', {
  id: integer('id').notNull().primaryKey().generatedByDefaultAsIdentity(),
  userId: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }), // Relación con la tabla de usuarios
  accessToken: text('access_token').notNull().unique(),
  refreshToken: text('refresh_token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(), // Fecha de inicio de la sesión
  expiresAt: timestamp('expires_at').notNull(), // Fecha de expiración del token
})

export const verificationsTable = pgTable('verifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }).unique(),
  resetToken: text('reset_token').unique(), // Token para recuperación de contraseña
  resetCode: text('reset_code'), // Código para 2FA
  resetTokenExpires: timestamp('reset_token_expires'), // Expiración del token
  rebootAttempts: integer('reboot_attempts').default(3).notNull(), // Intentos restantes para 2FA
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
})

export type InsertSessions = typeof sessionsTable.$inferInsert
export type SelectSessions = typeof sessionsTable.$inferSelect

export type InsertVerification = typeof verificationsTable.$inferInsert
export type SelectVerification = typeof verificationsTable.$inferSelect

export type InsertUser = typeof usersTable.$inferInsert
export type SelectUser = typeof usersTable.$inferSelect
