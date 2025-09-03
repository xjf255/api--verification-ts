import { InsertSessions, InsertUser, InsertVerification, SelectSessions, SelectUser, SelectVerification } from "./schemas/db.ts"

export interface User {
  id: string,
  user: string,
  password: string,
  email: string,
  avatar: string,
  phone: string,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}

export type CleanUser = Omit<User, "password">
export type ValidateToReset = Pick<User, "email", "user">
export type Friendship = Omit<User, "password" | "createdAt" | "updatedAt" | "isActive">
export type FriendshipRequest = Omit<Friendship, "phone">
interface IUserModel {
  getById: (id: string) => Promise<CleanUser | null>
  getByEmail: (email: string) => Promise<CleanUser | boolean>
  createUser: (user: CreatedUser) => Promise<CleanUser>,
  createSession: (input: InsertSessions) => Promise<SelectSessions>
  removeSession: (accessToken: string, refreshToken: string) => Promise<boolean>
  updateSession: (input: Partial<InsertSessions>, id: string) => Promise<CleanUser | false>
  updateUser: (userToUpdate: Partial<InsertUser>, id: string) => Promise<boolean | CleanUser>
  createVerification: (input: InsertVerification) => Promise<boolean>
  verificationAttempts: (values: InsertVerification) => Promise<boolean>
  updateVerification: (input: Partial<InsertVerification>, id: string) => Promise<SelectVerification>
  login: ({ user, email, password }: any) => Promise<CleanUser | boolean>
  getAllInfo: (userInfo: string) => Promise<CleanUser | boolean>
  verification: (id: string, cod: string) => Promise<CleanUser | boolean>
  searchUserByToken: (token: string) => Promise<CleanUser | boolean>
  friendRequestSend: (requester: string, addresseeId: string) => Promise<boolean>
}

interface IFriendShipModel {
  friendRequestSend: (requester: string, addresseeId: string) => Promise<boolean>
  friendRequestAccept: (friendshipId: string) => Promise<boolean>
  friendRequestReject: (friendshipId: string) => Promise<boolean>
  cancelFriendRequest: (friendshipId: string) => Promise<boolean>
  getFriendsList: (userId: string) => Promise<Friendship[]>
  getFriendRequestsList: (userId: string) => Promise<FriendshipRequest[]>
  removeFriend: (friendshipId: string) => Promise<boolean>
}

interface IUserClass {
  UserModel: IUserModel
  FriendShipModel: IFriendShipModel
}