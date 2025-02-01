import { Request, Response } from "express"
import { validatedPartialUsers } from "../schemas/user.js"
import { generarToken, getInfoToToken } from "../utils/generateToken.js"

export class VerificationController {
  private userModel

  constructor({ UserModel }: any) {
    this.userModel = UserModel
  }

  login = async (req: Request, res: Response): Promise<any> => {
    try {
      const dataUser = validatedPartialUsers(req.body)
      if (dataUser.error) {
        return res.status(400).json({ message: JSON.parse(dataUser.error.message) })
      }
      const { password, user, email } = dataUser.data
      if (!password || !(user || email)) {
        return res.status(400).json({ message: "Faltan datos" })
      }
      const userData = await this.userModel.login({ user, email, password })
      if (!userData) {
        return res.status(404).json({ message: "Credenciales inválidas" })
      }

      if (!userData.isActive) {
        return res.status(403).cookie("reactive", { id: userData.id }, {
          httpOnly: true,
          sameSite: "strict"
        }).json({ message: "Usuario inactivo" })
      }

      const token = generarToken(userData)
      const refreshToken = generarToken(userData, "1y")
      res
        .cookie("access_token", token, {
          httpOnly: true,
          sameSite: "strict",
          maxAge: 60 * 60 * 24
        })
        .cookie("refresh_token", refreshToken, {
          httpOnly: true,
          sameSite: "strict",
          maxAge: 60 * 60 * 24 * 365
        })
        .json({
          message: "Inicio de sesión exitoso",
          user: userData,
          token,
        })

    } catch (error) {
      console.error("Error en el endpoint /login:", error)
      res.status(500).json({ message: "Error interno del servidor" })
    }
  }

  protected = async (req: Request, res: Response): Promise<any> => {
    const token = req.cookies?.access_token ?? ""
    const refreshToken = req.cookies?.refresh_token ?? ""

    if (!token || !refreshToken) {
      return res.status(403).json({ error: "Access denied. No token provided." })
    }

    const refreshTokenInfo = getInfoToToken(refreshToken)
    const accessTokenInfo = getInfoToToken(token)

    if (typeof refreshTokenInfo !== "object" || typeof accessTokenInfo !== "object") {
      return res.status(403).json({ error: "Access denied. Invalid token." })
    }

    const { exp: expRefreshToken } = refreshTokenInfo
    const { exp: expAccessToken } = accessTokenInfo

    if (!expRefreshToken || Date.now() >= expRefreshToken * 1000) {
      return res.status(403)
        .clearCookie("access_token")
        .clearCookie("refresh_token")
        .json({ error: "Access denied. Token expired." })
    }

    if (!expAccessToken || Date.now() >= expAccessToken * 1000) {
      const infoUser = refreshTokenInfo
      const newToken = generarToken(infoUser)
      const updateVerification = await this.userModel.updateVerification({ token: newToken}, infoUser.id)
      return res.cookie("access_token", newToken, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 24
      }).json(infoUser)
    }

    try {
      const userInfo = getInfoToToken(token)
      res.json(userInfo)
    } catch (error) {
      console.error("Error decoding token:", error)
      res.status(401).json({ error: "Invalid token." })
    }
  }

  logout = async (req: Request, res: Response): Promise<any> => {
    return res.clearCookie("access_token", { httpOnly: true, sameSite: "strict" })
      .clearCookie("refresh_token", { httpOnly: true, sameSite: "strict" })
      .json({ message: "Logout exitoso" })
  }
}