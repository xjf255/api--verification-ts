import { InsertSessions, InsertUser, SelectSessions } from "./schemas/db.ts"

export interface User {
  id?: string,
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

interface IUserModel {
  getById: (id: string) => Promise<CleanUser | null>
  createUser: (user: CreatedUser) => Promise<CleanUser>,
  createSession: (input: InsertSessions) => Promise<SelectSessions>
  updateUser: (userToUpdate: Partial<InsertUser>, id: string) => Promise<boolean>
  login: ({ user, email, password }: any) => Promise<CleanUser | boolean>
  getByInfo: (userInfo: string) => Promise<CleanUser | boolean>
  getByToken: (token: string) => Promise<CleanUser | boolean>
}

interface IUserClass {
  UserModel: IUserModel
}