export interface User {
  id?: string,
  user: string,
  password: string,
  email: string,
  avatar: string,
  phone: string | null,
  resetToken?: string | null,
  resetCod?: number | null,
  rebootAttempts: number
  resetTokenExpires?: Date | null,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}

export type CleanUser = Omit<User, "password">
export type ValidateToReset = Pick<User, "email", "user">
export type CreatedUser = Omit<User, "created_at", "updatedAt", "isActive">

interface IUserModel {
  getById: (id: string) => Promise<CleanUser | null>
  create: (user: CreatedUser) => Promise<CleanUser>
  updateUser: (userToUpdate: any, id: string) => Promise<boolean>
  login: ({ user, email, password }: any) => Promise<CleanUser | boolean>
  getByInfo: (userInfo: string) => Promise<CleanUser | boolean>
  getByToken: (token: string) => Promise<CleanUser | boolean>
}

interface IUserClass {
  UserModel: IUserModel
}