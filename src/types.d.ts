export interface User {
  id?:string,
  name:string,
  password: string,
  email:string,
  createdAt: Date,
  updatedAt: Date
}

export type CreatedUser = Omit<User,"created_at","updatedAt">