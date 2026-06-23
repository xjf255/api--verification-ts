import { db } from './db.js';
import { usersTable, sessionsTable, verificationsTable, user_friendships } from '../../schemas/db.js';
import { eq, or, and } from 'drizzle-orm';
import { CleanUser, IUserModel, CreatedUser } from '../../types.js';
import { InsertSessions, InsertUser, InsertVerification, SelectSessions, SelectVerification } from '../../schemas/db.js';
import { hashPassword, comparePassword } from '../../utils/hashPassword.js';
import { getInfoToToken } from '../../utils/generateToken.js';
import { DecodedToken } from '../../jwt.js';

export const UserModel: IUserModel = {
  async getById(id: string): Promise<CleanUser | null> {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    if (!user) return null;
    const { password, ...cleanUser } = user;
    return cleanUser as CleanUser;
  },

  async getByEmail(email: string): Promise<CleanUser | boolean> {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!user) return false;
    const { password, ...cleanUser } = user;
    return cleanUser as CleanUser;
  },

  async createUser(user: CreatedUser): Promise<CleanUser> {
    const hashedPassword = await hashPassword(user.password);
    const [inserted] = await db.insert(usersTable).values({
      ...user,
      password: hashedPassword,
    }).returning();
    const { password, ...cleanUser } = inserted;
    return cleanUser as CleanUser;
  },

  async createSession(input: InsertSessions): Promise<SelectSessions> {
    const [session] = await db.insert(sessionsTable).values(input).returning();
    return session;
  },

  async removeSession(accessToken: string, refreshToken: string): Promise<boolean> {
    await db.delete(sessionsTable).where(
      or(
        eq(sessionsTable.accessToken, accessToken),
        eq(sessionsTable.refreshToken, refreshToken)
      )
    );
    return true;
  },

  async updateSession(input: Partial<InsertSessions>, refreshToken: string): Promise<boolean> {
    await db.update(sessionsTable)
      .set(input)
      .where(eq(sessionsTable.refreshToken, refreshToken));
    return true;
  },

  async updateUser(userToUpdate: Partial<InsertUser>, id: string): Promise<boolean | CleanUser> {
    const [updated] = await db.update(usersTable)
      .set(userToUpdate)
      .where(eq(usersTable.id, id))
      .returning();
    if (!updated) return false;
    const { password, ...cleanUser } = updated;
    return cleanUser as CleanUser;
  },

  async createVerification(input: InsertVerification): Promise<boolean> {
    await db.insert(verificationsTable).values(input);
    return true;
  },

  async verificationAttempts(values: InsertVerification): Promise<boolean> {
    const [existing] = await db.select().from(verificationsTable).where(eq(verificationsTable.userId, values.userId));
    if (existing) {
      await db.update(verificationsTable)
        .set({
          resetToken: values.resetToken,
          resetTokenExpires: values.resetTokenExpires,
          rebootAttempts: values.rebootAttempts ?? 3,
        })
        .where(eq(verificationsTable.userId, values.userId));
    } else {
      await db.insert(verificationsTable).values(values);
    }
    return true;
  },

  async updateVerification(input: Partial<InsertVerification>, userId: string): Promise<SelectVerification> {
    const [existing] = await db.select().from(verificationsTable).where(eq(verificationsTable.userId, userId));
    if (existing) {
      const [updated] = await db.update(verificationsTable)
        .set(input)
        .where(eq(verificationsTable.userId, userId))
        .returning();
      return updated;
    } else {
      const [inserted] = await db.insert(verificationsTable).values({
        userId,
        ...input,
      } as InsertVerification).returning();
      return inserted;
    }
  },

  async login({ user, email, password }: any): Promise<CleanUser | boolean> {
    const conditions = [];
    if (user) conditions.push(eq(usersTable.user, user));
    if (email) conditions.push(eq(usersTable.email, email));
    
    if (conditions.length === 0) return false;

    const [foundUser] = await db.select().from(usersTable).where(
      conditions.length === 1 ? conditions[0] : or(...conditions)
    );
    if (!foundUser) return false;
    const matches = await comparePassword({ input: password, hashedInput: foundUser.password });
    if (!matches) return false;
    const { password: _, ...cleanUser } = foundUser;
    return cleanUser as CleanUser;
  },

  async getAllInfo(userInfo: string): Promise<CleanUser | boolean> {
    const [foundUser] = await db.select().from(usersTable).where(
      or(
        eq(usersTable.user, userInfo),
        eq(usersTable.email, userInfo)
      )
    );
    if (!foundUser) return false;
    const { password, ...cleanUser } = foundUser;
    return cleanUser as CleanUser;
  },

  async verification(verificationToken: string, cod: string): Promise<CleanUser | boolean> {
    const decoded = getInfoToToken(verificationToken) as DecodedToken;
    if (!decoded || !decoded.verificationId) return false;

    const [record] = await db.select().from(verificationsTable).where(eq(verificationsTable.id, decoded.verificationId));
    if (!record || record.rebootAttempts <= 0) return false;

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
        if (!user) return false;
        const { password, ...cleanUser } = user;
        return cleanUser as CleanUser;
      } else {
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

  async searchUserByToken(token: string): Promise<CleanUser | boolean> {
    const [record] = await db.select().from(verificationsTable).where(eq(verificationsTable.resetToken, token));
    if (!record) return false;
    if (record.resetTokenExpires && record.resetTokenExpires < new Date()) {
      return false;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, record.userId));
    if (!user) return false;
    const { password, ...cleanUser } = user;
    return cleanUser as CleanUser;
  },

  async friendRequestSend(addresseeEmail: string, requesterId: string): Promise<boolean> {
    const [addressee] = await db.select().from(usersTable).where(eq(usersTable.email, addresseeEmail));
    if (!addressee) return false;

    const [existing] = await db.select().from(user_friendships).where(
      or(
        and(
          eq(user_friendships.requesterId, requesterId),
          eq(user_friendships.addresseeId, addressee.id)
        ),
        and(
          eq(user_friendships.requesterId, addressee.id),
          eq(user_friendships.addresseeId, requesterId)
        )
      )
    );

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
