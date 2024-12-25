import { CreatedUser } from "../types.js";
import bcrypt from "bcrypt"
import { SALT_ROUND } from "../config.js";

export async function hashPassword(user: CreatedUser) {
  const { password } = user
  const hashedPassword = await bcrypt.hash(password, SALT_ROUND)
  return { ...user, password: hashedPassword }
}

interface Props {
  password:string,
  hashedPassword:string
}

export async function comparePassword({ password, hashedPassword }: Props) {
  return await bcrypt.compare(password, hashedPassword)
}