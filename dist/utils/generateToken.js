import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../config.js";
export function generarToken(userData, time = "1d") {
    if (SECRET_KEY) {
        if (typeof userData === "string") {
            userData = { info: userData };
        }
        const cleanPayload = { ...userData };
        delete cleanPayload.exp;
        const token = jwt.sign(cleanPayload, SECRET_KEY, { expiresIn: time });
        return token;
    }
}
export function getInfoToToken(token) {
    if (!token || !SECRET_KEY)
        return '';
    try {
        return jwt.verify(token, SECRET_KEY);
    }
    catch (error) {
        console.error("Error verifying token:", error);
        return new Object({ id: "" });
    }
}
