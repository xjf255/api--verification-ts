import { CreatedUser } from "../types.js";
import bcrypt from "bcrypt"
import { SALT_ROUND } from "../config.js";

export async function hashPassword(user: CreatedUser) {
  const { password } = user
  const hashedPassword = await bcrypt.hash(password, SALT_ROUND)
  return { ...user, password: hashedPassword }
}

interface Props {
  input: string,
  hashedInput: string
}

export async function comparePassword({ input, hashedInput }: Props) {
  return await bcrypt.compare(input, hashedInput)
}

export async function hashCode(input: string) {
  const newCode = await bcrypt.hash(input, SALT_ROUND)
  return newCode
}