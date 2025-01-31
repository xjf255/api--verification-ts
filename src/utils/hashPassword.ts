import bcrypt from "bcrypt"
import { SALT_ROUND } from "../config.js";

export async function hashPassword(password: string) {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUND)
  return hashedPassword
}
interface Props {
  input: string,
  hashedInput: string
}

export async function comparePassword({ input, hashedInput }: Props): Promise<boolean> {
  return await bcrypt.compare(input, hashedInput)
}

export async function hashCode(input: string): Promise<string> {
  const newCode = await bcrypt.hash(input, SALT_ROUND) ?? ''
  return newCode
}