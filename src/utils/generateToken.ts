import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { SECRET_KEY } from "../config.js";
// Ensure SECRET_KEY is a string (type Secret for jwt)
import { DecodedToken } from "../jwt.js";

export function generarToken(userData: Record<string, any> | string, time = "1d") {
  if (SECRET_KEY) {
    if (typeof userData === "string") {
      userData = { info: userData }
    }

    const cleanPayload = { ...userData } as Record<string, any>
    delete cleanPayload.exp
    const token = jwt.sign(cleanPayload, SECRET_KEY as Secret, { expiresIn: time } as SignOptions)

    return token
  }
}

export function getInfoToToken(token: string): any {
  if (!token || !SECRET_KEY) return ''

  try {
    return jwt.verify(token, SECRET_KEY) as DecodedToken
  } catch (error) {
    return new Object({ id: "" })
  }
}
