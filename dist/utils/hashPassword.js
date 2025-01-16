import bcrypt from "bcrypt";
import { SALT_ROUND } from "../config.js";
export async function hashPassword(user) {
    const { password } = user;
    const hashedPassword = await bcrypt.hash(password, SALT_ROUND);
    return { ...user, password: hashedPassword };
}
export async function comparePassword({ input, hashedInput }) {
    return await bcrypt.compare(input, hashedInput);
}
export async function hashCode(input) {
    const newCode = await bcrypt.hash(input, SALT_ROUND);
    return newCode;
}
