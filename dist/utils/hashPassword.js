import bcrypt from "bcrypt";
import { SALT_ROUND } from "../config.js";
export async function hashPassword(user) {
    const { password } = user;
    const hashedPassword = await bcrypt.hash(password, SALT_ROUND);
    return { ...user, password: hashedPassword };
}
export async function comparePassword({ password, hashedPassword }) {
    return await bcrypt.compare(password, hashedPassword);
}
export async function hashCode(code) {
    const newCode = await bcrypt.hash(code, SALT_ROUND);
    return newCode;
}
