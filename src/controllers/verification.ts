import { Request, Response } from "express"
import { validatedPartialUsers } from "../schemas/user.js"
import { generarToken, getInfoToToken } from "../utils/generateToken.js"
import { CleanUser, IUserClass } from "../types.js"
import { hrInMs } from "../utils/constant.js"

export class VerificationController {
  private userModel

  constructor({ UserModel }: IUserClass) {
    this.userModel = UserModel
  }

  login = async (req: Request, res: Response): Promise<any> => {
    try {
      const dataUser = validatedPartialUsers({ ...req.body })
      if (dataUser.error) {
        return res.status(400).json({ message: JSON.parse(dataUser.error.message) })
      }
      const { password, user, email } = dataUser.data
      if (!password || !(user || email)) {
        return res.status(400).json({ message: "Faltan datos" })
      }
      const userData = await this.userModel.login({ user, email, password }) as CleanUser
      if (!userData) {
        return res.status(404).json({ message: "Credenciales inválidas" })
      }

      if (!userData.isActive) {
        const reactiveToken = generarToken({ id: userData.id }, "1h")
        return res.status(401).cookie("reactive", reactiveToken, {
          httpOnly: true,
          sameSite: "strict",
          expires: new Date(Date.now() + hrInMs)
        }).json({ message: "Usuario inactivo" })
      }

      const token = generarToken(userData)
      const refreshToken = generarToken(userData, "7d")

      if (!token || !refreshToken) {
        return res.status(403).json({ message: "Error al generar token" })
      }

      await this.userModel.createSession({
        userId: userData.id,
        accessToken: token,
        refreshToken,
        expiresAt: new Date(Date.now() + hrInMs * 24 * 7)
      })

      res
        .cookie("access_token", token, {
          httpOnly: true,
          sameSite: "strict",
          expires: new Date(Date.now() + hrInMs),
        })
        .cookie("refresh_token", refreshToken, {
          httpOnly: true,
          sameSite: "strict",
          expires: new Date(Date.now() + hrInMs * 24 * 7),
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

  loginByGuest = async (req: Request, res: Response): Promise<any> => {
    try {
      const dataUser = validatedPartialUsers({ ...req.body })
      if (dataUser.error) {
        return res.status(400).json({ message: JSON.parse(dataUser.error.message) })
      }
      const { password, user, email } = dataUser.data
      if (!password || !(user || email)) {
        return res.status(400).json({ message: "Faltan datos" })
      }
      const userData = await this.userModel.login({ user, email, password }) as CleanUser
      if (!userData) {
        return res.status(404).json({ message: "Credenciales inválidas" })
      }

      if (!userData.isActive) {
        const reactiveToken = generarToken({ id: userData.id }, "1h")
        return res.status(401).cookie("reactive", reactiveToken, {
          httpOnly: true,
          sameSite: "strict",
          expires: new Date(Date.now() + hrInMs)
        }).json({ message: "Usuario inactivo" })
      }

      const token = generarToken(userData)
      const refreshToken = generarToken(userData, "7d")

      if (!token || !refreshToken) {
        return res.status(403).json({ message: "Error al generar token" })
      }

      await this.userModel.createSession({
        userId: userData.id,
        accessToken: token,
        refreshToken,
        expiresAt: new Date(Date.now() + hrInMs * 24 * 7)
      })

      res
        .cookie("access_token", token, {
          httpOnly: true,
          sameSite: "strict",
          expires: new Date(Date.now() + hrInMs),
        })
        .cookie("refresh_token", refreshToken, {
          httpOnly: true,
          sameSite: "strict",
          expires: new Date(Date.now() + hrInMs * 24 * 7),
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

    if (!refreshToken) {
      return res.status(403).json({ error: "Access denied. No token provided." })
    }

    let refreshTokenInfo, accessTokenInfo

    try {
      refreshTokenInfo = getInfoToToken(refreshToken)
      console.log("Refresh Token Info:", refreshTokenInfo)  
      accessTokenInfo = getInfoToToken(token)

      if (typeof refreshTokenInfo !== "object" && typeof accessTokenInfo !== "object") {
        throw new Error("Invalid token format")
      }

      const { exp: expRefreshToken } = refreshTokenInfo
      const { exp: expAccessToken, isGuest } = accessTokenInfo

      if ((!expRefreshToken || Date.now() >= expRefreshToken * 1000) && isGuest) {
        return res.status(403)
          .clearCookie("access_token")
          .clearCookie("refresh_token")
          .json({ error: "Session expired. Please log in again." })
      }

      if (!expAccessToken || Date.now() >= expAccessToken * 1000) {
        const infoUser = refreshTokenInfo
        const newToken = generarToken(infoUser)

        try {
          const updateVerification = await this.userModel.updateSession({ accessToken: newToken }, infoUser.id)
          if (!updateVerification) {
            throw new Error("Failed to update session")
          }
          return res.cookie("access_token", newToken, {
            httpOnly: true,
            sameSite: "strict",
            expires: new Date(Date.now() + hrInMs)
          }).json(updateVerification)
        } catch (error) {
          console.error(error)
          return res.status(500).json({ error: "Server error. Try again later." })
        }
      }
      const user = await this.userModel.getById(accessTokenInfo.id)

      return res.json(user)

    } catch (error) {
      console.error("Token error:", error)
      return res.status(403).json({ error: "Access denied. Invalid token." })
    }
  }

  logout = async (req: Request, res: Response): Promise<any> => {
    const accessToken = req.cookies?.access_token ?? ""
    const refreshToken = req.cookies?.refresh_token ?? ""
    await this.userModel.removeSession(accessToken, refreshToken)
    return res
      .clearCookie("access_token", { httpOnly: true, sameSite: "strict" })
      .clearCookie("refresh_token", { httpOnly: true, sameSite: "strict" })
      .json({ message: "Logout exitoso" })
  }
}