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

interface IUserModel {
  getById: (id: string) => Promise<CleanUser | null>
  createUser: (user: CreatedUser) => Promise<CleanUser>,
  createSession: (input: InsertSessions) => Promise<SelectSessions>
  removeSession: (accessToken: string, refreshToken: string) => Promise<boolean>
  updateSession: (input: Partial<InsertSessions>, id:string) => Promise<CleanUser | false>
  updateUser: (userToUpdate: Partial<InsertUser>, id: string) => Promise<boolean>
  createVerification: (input: InsertVerification) => Promise<boolean>
  verificationAttempts: (values: InsertVerification) => Promise<boolean>
  updateVerification: (input: Partial<InsertVerification>, id: string) => Promise<SelectVerification>
  login: ({ user, email, password }: any) => Promise<CleanUser | boolean>
  getAllInfo: (userInfo: string) => Promise<CleanUser | boolean>
  verification: (id: string, cod: string) => Promise<CleanUser | boolean>
  searchUserByToken: (token: string) => Promise<CleanUser | boolean>
}

interface IUserClass {
  UserModel: IUserModel
}