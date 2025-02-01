import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../config.js";
import { DecodedToken } from "../jwt.js";

export function generarToken(userData: Object | string, time = "1d") {
  if (SECRET_KEY) {
    const token = jwt.sign(userData, SECRET_KEY, {
      expiresIn: time
    })
    return token
  }
}

export function getInfoToToken(token: string): DecodedToken | string {
  if (!token || !SECRET_KEY) return ''

  try {
    return jwt.verify(token, SECRET_KEY) as DecodedToken
  } catch (error) {
    console.error("Error verifying token:", error)
    return ''
  }
}
