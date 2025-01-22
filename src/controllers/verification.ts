import { Request, Response } from "express"
import { validatedPartialUsers } from "../schemas/user.js"
import { generarToken, getInfoToToken } from "../utils/generateToken.js"

export class VerificationController {
  private userModel

  constructor({ UserModel }: any) {
    this.userModel = UserModel
  }

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const dataUser = validatedPartialUsers(req.body)
      if (dataUser.error) {
        res.status(400).json({ message: JSON.parse(dataUser.error.message) })
        return
      }
      const { password, user, email } = dataUser.data
      if (!password || !(user || email)) {
        res.status(400).json({ message: "Faltan datos" })
        return
      }
      const userData = await this.userModel.login({ user, email, password })
      if (!userData) {
        res.status(404).json({ message: "Credenciales inválidas" })
        return
      }

      if (!userData.isActive) {
        res.status(403).json({ message: "Usuario inactivo" })
        res.cookie("reactive", {id:userData.id}, {
          httpOnly: true,
          sameSite: "strict"
        })
      }

      const token = generarToken(userData)
      res
        .cookie("access_token", token, {
          httpOnly: true,
          sameSite: "strict"
        }).json({
          message: "Inicio de sesión exitoso",
          user: userData,
          token,
        })

    } catch (error) {
      console.error("Error en el endpoint /login:", error)
      res.status(500).json({ message: "Error interno del servidor" })
    }
  }

  protected = (req: Request, res: Response): any => {
    const token = req.cookies?.access_token ?? ''
    if (!token || token === '') {
      return res.status(403).json({ error: "Access denied. No token provided." })
    }

    try {
      const userInfo = getInfoToToken(token)
      res.json(userInfo)
    } catch (error) {
      console.error("Error decoding token:", error)
      res.status(401).json({ error: "Invalid token." })
    }
  }

  logout = (req: Request, res: Response): any => {
    res.clearCookie("access_token").json({ message: "Logout exitoso" })
  }
}