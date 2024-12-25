export interface User {
  id?:string,
  user:string,
  password: string,
  email:string,
  isActive:boolean,
  createdAt: Date,
  updatedAt: Date
}

export type CreatedUser = Omit<User,"created_at","updatedAt","isActive">