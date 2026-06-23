import { db } from './db.js';
import { usersTable, sessionsTable, verificationsTable, user_friendships } from '../../schemas/db.js';
import { eq, or, and } from 'drizzle-orm';
import { hashPassword, comparePassword } from '../../utils/hashPassword.js';
import { getInfoToToken } from '../../utils/generateToken.js';
export const UserModel = {
    async getById(id) {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
        if (!user)
            return null;
        const { password, ...cleanUser } = user;
        return cleanUser;
    },
    async getByEmail(email) {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
        if (!user)
            return false;
        const { password, ...cleanUser } = user;
        return cleanUser;
    },
    async createUser(user) {
        const hashedPassword = await hashPassword(user.password);
        const [inserted] = await db.insert(usersTable).values({
            ...user,
            password: hashedPassword,
        }).returning();
        const { password, ...cleanUser } = inserted;
        return cleanUser;
    },
    async createSession(input) {
        const [session] = await db.insert(sessionsTable).values(input).returning();
        return session;
    },
    async removeSession(accessToken, refreshToken) {
        await db.delete(sessionsTable).where(or(eq(sessionsTable.accessToken, accessToken), eq(sessionsTable.refreshToken, refreshToken)));
        return true;
    },
    async updateSession(input, refreshToken) {
        await db.update(sessionsTable)
            .set(input)
            .where(eq(sessionsTable.refreshToken, refreshToken));
        return true;
    },
    async updateUser(userToUpdate, id) {
        const [updated] = await db.update(usersTable)
            .set(userToUpdate)
            .where(eq(usersTable.id, id))
            .returning();
        if (!updated)
            return false;
        const { password, ...cleanUser } = updated;
        return cleanUser;
    },
    async createVerification(input) {
        await db.insert(verificationsTable).values(input);
        return true;
    },
    async verificationAttempts(values) {
        const [existing] = await db.select().from(verificationsTable).where(eq(verificationsTable.userId, values.userId));
        if (existing) {
            await db.update(verificationsTable)
                .set({
                resetToken: values.resetToken,
                resetTokenExpires: values.resetTokenExpires,
                rebootAttempts: values.rebootAttempts ?? 3,
            })
                .where(eq(verificationsTable.userId, values.userId));
        }
        else {
            await db.insert(verificationsTable).values(values);
        }
        return true;
    },
    async updateVerification(input, userId) {
        const [existing] = await db.select().from(verificationsTable).where(eq(verificationsTable.userId, userId));
        if (existing) {
            const [updated] = await db.update(verificationsTable)
                .set(input)
                .where(eq(verificationsTable.userId, userId))
                .returning();
            return updated;
        }
        else {
            const [inserted] = await db.insert(verificationsTable).values({
                userId,
                ...input,
            }).returning();
            return inserted;
        }
    },
    async login({ user, email, password }) {
        const conditions = [];
        if (user)
            conditions.push(eq(usersTable.user, user));
        if (email)
            conditions.push(eq(usersTable.email, email));
        if (conditions.length === 0)
            return false;
        const [foundUser] = await db.select().from(usersTable).where(conditions.length === 1 ? conditions[0] : or(...conditions));
        if (!foundUser)
            return false;
        const matches = await comparePassword({ input: password, hashedInput: foundUser.password });
        if (!matches)
            return false;
        const { password: _, ...cleanUser } = foundUser;
        return cleanUser;
    },
    async getAllInfo(userInfo) {
        const [foundUser] = await db.select().from(usersTable).where(or(eq(usersTable.user, userInfo), eq(usersTable.email, userInfo)));
        if (!foundUser)
            return false;
        const { password, ...cleanUser } = foundUser;
        return cleanUser;
    },
    async verification(verificationToken, cod) {
        const decoded = getInfoToToken(verificationToken);
        if (!decoded || !decoded.verificationId)
            return false;
        const [record] = await db.select().from(verificationsTable).where(eq(verificationsTable.id, decoded.verificationId));
        if (!record || record.rebootAttempts <= 0)
            return false;
        if (record.resetCode) {
            const matches = await comparePassword({ input: cod, hashedInput: record.resetCode });
            if (matches) {
                await db.update(verificationsTable)
                    .set({
                    resetCode: null,
                    resetToken: null,
                    resetTokenExpires: null,
                    rebootAttempts: 3,
                })
                    .where(eq(verificationsTable.id, record.id));
                const [user] = await db.select().from(usersTable).where(eq(usersTable.id, record.userId));
                if (!user)
                    return false;
                const { password, ...cleanUser } = user;
                return cleanUser;
            }
            else {
                await db.update(verificationsTable)
                    .set({
                    rebootAttempts: record.rebootAttempts - 1,
                })
                    .where(eq(verificationsTable.id, record.id));
                return false;
            }
        }
        return false;
    },
    async searchUserByToken(token) {
        const [record] = await db.select().from(verificationsTable).where(eq(verificationsTable.resetToken, token));
        if (!record)
            return false;
        if (record.resetTokenExpires && record.resetTokenExpires < new Date()) {
            return false;
        }
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, record.userId));
        if (!user)
            return false;
        const { password, ...cleanUser } = user;
        return cleanUser;
    },
    async friendRequestSend(addresseeEmail, requesterId) {
        const [addressee] = await db.select().from(usersTable).where(eq(usersTable.email, addresseeEmail));
        if (!addressee)
            return false;
        const [existing] = await db.select().from(user_friendships).where(or(and(eq(user_friendships.requesterId, requesterId), eq(user_friendships.addresseeId, addressee.id)), and(eq(user_friendships.requesterId, addressee.id), eq(user_friendships.addresseeId, requesterId))));
        if (!existing) {
            await db.insert(user_friendships).values({
                requesterId,
                addresseeId: addressee.id,
                status: 'pending',
            });
            return true;
        }
        return false;
    }
};
