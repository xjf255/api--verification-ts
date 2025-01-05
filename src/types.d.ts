export interface User {
  id?:string,
  user:string,
  password: string,
  email:string,
  avatar:string,
  resetToken?:string | null,
  resetTokenExpires?:Date | null,
  isActive:boolean | null,
  createdAt: Date,
  updatedAt: Date
}

export type CleanUser = Omit<User,"password">

export type CreatedUser = Omit<User,"created_at","updatedAt","isActive">

interface IUserModel {
  getAll: () => Promise<CleanUser[]>
  create: (user: User) => Promise<CleanUser>
  updateUser: (userToUpdate: any, id: string) => Promise<boolean>
  login: ({ user, email, password }: any) => Promise<CleanUser | boolean>
}

interface IUserClass{
  UserModel: IUserModel
}