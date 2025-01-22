import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../config.js";
import { DecodedToken } from "../jwt.js";

export function generarToken(userData: Object | string, time = "24h") {
  if (SECRET_KEY) {
    const token = jwt.sign(userData, SECRET_KEY, {
      expiresIn: time
    })
    return token
  }
}

export function getInfoToToken(token: string): DecodedToken | string {
  if (!token || SECRET_KEY === undefined) return ''
  return jwt.verify(token, SECRET_KEY!) as DecodedToken
}