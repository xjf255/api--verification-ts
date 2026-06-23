import { db } from './db.js';
import { usersTable, user_friendships } from '../../schemas/db.js';
import { eq, or, and } from 'drizzle-orm';
import { Friendship, FriendshipRequest, IFriendShipModel } from '../../types.js';

export const FriendShipModel: IFriendShipModel = {
  async friendRequestSend(requesterId: string, addresseeEmail: string): Promise<boolean> {
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
  },

  async friendRequestAccept(friendshipId: string): Promise<boolean> {
    const [updated] = await db.update(user_friendships)
      .set({
        status: 'accepted',
        responsedAt: new Date()
      })
      .where(eq(user_friendships.id, friendshipId))
      .returning();
    return !!updated;
  },

  async friendRequestReject(friendshipId: string): Promise<boolean> {
    // Since rejected is not a valid status in the friendship_status pgEnum,
    // we delete the pending record on rejection.
    const [deleted] = await db.delete(user_friendships)
      .where(eq(user_friendships.id, friendshipId))
      .returning();
    return !!deleted;
  },

  async cancelFriendRequest(friendshipId: string): Promise<boolean> {
    const [deleted] = await db.delete(user_friendships)
      .where(
        and(
          eq(user_friendships.id, friendshipId),
          eq(user_friendships.status, 'pending')
        )
      )
      .returning();
    return !!deleted;
  },

  async getFriendsList(userId: string): Promise<Friendship[]> {
    const friends1 = await db.select({
      id: usersTable.id,
      user: usersTable.user,
      email: usersTable.email,
      avatar: usersTable.avatar,
      phone: usersTable.phone,
    })
    .from(user_friendships)
    .innerJoin(usersTable, eq(user_friendships.addresseeId, usersTable.id))
    .where(
      and(
        eq(user_friendships.requesterId, userId),
        eq(user_friendships.status, 'accepted')
      )
    );

    const friends2 = await db.select({
      id: usersTable.id,
      user: usersTable.user,
      email: usersTable.email,
      avatar: usersTable.avatar,
      phone: usersTable.phone,
    })
    .from(user_friendships)
    .innerJoin(usersTable, eq(user_friendships.requesterId, usersTable.id))
    .where(
      and(
        eq(user_friendships.addresseeId, userId),
        eq(user_friendships.status, 'accepted')
      )
    );

    return [...friends1, ...friends2];
  },

  async getFriendRequestsList(userId: string): Promise<FriendshipRequest[]> {
    const requests = await db.select({
      id: user_friendships.id, // Returns friendship ID so it can be accepted/rejected
      user: usersTable.user,
      email: usersTable.email,
      avatar: usersTable.avatar,
    })
    .from(user_friendships)
    .innerJoin(usersTable, eq(user_friendships.requesterId, usersTable.id))
    .where(
      and(
        eq(user_friendships.addresseeId, userId),
        eq(user_friendships.status, 'pending')
      )
    );

    return requests as FriendshipRequest[];
  },

  async removeFriend(friendshipId: string): Promise<boolean> {
    const [deleted] = await db.delete(user_friendships)
      .where(eq(user_friendships.id, friendshipId))
      .returning();
    return !!deleted;
  }
};
