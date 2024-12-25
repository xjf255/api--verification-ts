import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../config.js";

export function generarToken(userData: Object) {
  if (SECRET_KEY) {
    const token = jwt.sign(userData, SECRET_KEY, {
      expiresIn: "24h"
    })
    return token
  }
}

export function getInfoToToken(token:string){
  if(!token || SECRET_KEY === undefined) return
  return jwt.verify(token,SECRET_KEY)
}