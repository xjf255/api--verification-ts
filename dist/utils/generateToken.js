import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../config.js";
export function generarToken(userData, time = "24h") {
    if (SECRET_KEY) {
        const token = jwt.sign(userData, SECRET_KEY, {
            expiresIn: time
        });
        return token;
    }
}
export function getInfoToToken(token) {
    if (!token || SECRET_KEY === undefined)
        return;
    return jwt.verify(token, SECRET_KEY);
}
