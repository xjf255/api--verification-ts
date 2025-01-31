import { request, Request, Response } from "express"
import { validatedEmailUsers, validatedPartialUsers, validatedUsers } from "../schemas/user.js"
import { generarToken } from "../utils/generateToken.js"
import { hashCode, hashPassword } from "../utils/hashPassword.js"
import { deleteImage, loaderImage } from "../services/cloudMethods.js"
import { sendMail } from "../services/sendMail.js"
import { CleanUser, IUserClass } from "../types.js"
import ejs from "ejs"
import path from "path"
import getDirname from "../utils/dirname.js"
import { sendSMS } from "../services/sendSMS.js"
import { isValidUUID } from "../utils/validatedUUID.js"
export class UsersController {
  private userModel

  constructor({ UserModel }: IUserClass) {
    this.userModel = UserModel
  }

  createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const file = req.file
      if (file) {
        req.body.avatar = await loaderImage({ file })
      }
      const user = validatedUsers(req.body)
      if (user.error) {
        res.status(400).json({ message: JSON.parse(user.error.message) })
        return
      }

      const userData = await this.userModel.createUser(user.data)
      const token = generarToken(userData)

      res.status(201)
        .cookie("access_token", token, {
          httpOnly: true,
          sameSite: "strict",
          maxAge: 1000 * 60 * 60
        })
        .json(userData)
    } catch (error: any) {
      console.log(error)
      if (error.code === "23505") {
        if (error.constraint === "users_email_unique") {
          res.status(409).json({ message: "El correo ya esta en uso" })
        } else {
          res.status(409).json({ message: "El usuario ya esta en uso" })
        }
      } else {
        console.log(error)
        res.status(500).json({ message: "Error interno del servidor" })
      }
    }
  }

  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req?.user?.id || req?.params?.id

      if (!isValidUUID(id)) {
        res.status(400).json({ message: "ID inválido" })
        return
      }

      if (req.file) {
        await this.handleAvatarUpdate(req, id)
      }

      const updatedUserInfo = validatedPartialUsers(req.body)
      if (updatedUserInfo.error) {
        res.status(400).json({ message: JSON.parse(updatedUserInfo.error.message) })
        return
      }

      const { password, ...otherData } = updatedUserInfo.data as { password?: string } & Record<string, any>

      if (password) {
        otherData.password = await hashPassword(password)
      }

      const userToUpdate = Object.fromEntries(
        Object.entries(otherData).filter(([_, value]) => value !== null)
      )

      const isUpdated = await this.userModel.updateUser(userToUpdate, id)
      if (!isUpdated) {
        throw new Error("Usuario no encontrado")
      }

      res.json({ message: "Usuario actualizado correctamente" })
    } catch (error: any) {
      if (error.code === "23505") {
        res.status(409).json({ message: "El usuario o correo no válido" })
      } else {
        console.error("Error al actualizar usuario:", error)
        res.status(500).json({ message: "Error interno del servidor" })
      }
    }
  }

  private handleAvatarUpdate = async (req: Request, userId: string) => {
    try {
      const newAvatarUrl = await loaderImage({ file: req.file! })
      const userData = await this.userModel.getById(userId)

      if (!userData) {
        throw new Error("Usuario no existente")
      }

      const { avatar } = userData
      const isDefaultAvatar =
        avatar === "https://res.cloudinary.com/dkshw9hik/image/upload/v1736294033/avatardefault_w9hsxz.webp"

      if (avatar && !isDefaultAvatar) {
        const deleteResponse = await deleteImage(avatar)
        if (deleteResponse.error) {
          console.error("Error al eliminar la imagen:", deleteResponse.error)
        }
      }

      req.body.avatar = newAvatarUrl
    } catch (error) {
      console.error("Error al actualizar avatar:", error)
      throw new Error("Error al manejar la imagen de perfil")
    }
  }

  deleteUser = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params ?? req?.user
    if (!isValidUUID(id)) {
      res.status(400).json({ message: "ID inválido" })
      return
    }
    const response = await this.userModel.updateUser({ isActive: false }, id)
    if (!response) {
      res
        .clearCookie("access_token")
        .status(404)
        .json({ message: "Usuario no encontrado" })
      return
    }
  }

  reactiveUser = async (req: Request, res: Response): Promise<any> => {
    const id = req?.user?.id
    if (!id || !isValidUUID(id)) {
      res.status(400).json({ message: "ID inválido" })
      return
    }
    const response = await this.userModel.updateUser({ isActive: true }, id.toString())
    if (!response) {
      res.status(404).json({ message: "Usuario no encontrado" })
      return
    }
    res.clearCookie("reactive").json({ message: "Usuario reactivado" })
  }

  //envia una URL al correo del usuario
  resetLogin = async (req: Request, res: Response): Promise<any> => {
    try {
      //en el req.body puede venir el email o el user
      const { user, email } = req.body
      const isValidInfo = validatedEmailUsers({
        user, email
      })
      if (isValidInfo.error) {
        res.status(400).json({ message: JSON.parse(isValidInfo.error.message) })
        return
      }
      const { user: validUser, email: validEmail } = isValidInfo.data
      const valueOfUser = validEmail ?? validUser
      if (!valueOfUser) {
        res.status(404).json({ message: 'no ingreso ningun valor para buscar el usuario' })
        return
      }
      //busca el usuario por email o user
      const userData = await this.userModel.getAllInfo(valueOfUser)
      if (!userData) {
        res.status(404).json({ message: "Usuario no encontrado" })
        return
      }
      const { id, user: userName, email: addressee } = userData as CleanUser

      const time = new Date(Date.now() + 5 * 60 * 1000)
      const token = generarToken({ codigo: Math.floor(Math.random() * 1000000).toString() }, "5m")
      const data = { userId: id, resetTokenExpires: time, resetToken: token }
      const templatePath = path.join(getDirname(), "../view/user/templateMail.ejs")
      const templateData = { name: userName, url: token }

      ejs.renderFile(templatePath, templateData, async (err, html) => {
        if (err) {
          console.error("Error al renderizar la plantilla:", err.message)
          res.status(500).json({ message: "Error al procesar la plantilla del correo." })
          return
        }

        try {
          // Enviar el correo
          const messageId = await sendMail({ addressee, data: html })
          console.log("Correo enviado con ID:", messageId)
          // Actualiza la informacion del usuario
          const isUpdated = await this.userModel.verificationAttempts(data)
          if (!isUpdated) {
            res.status(500).json({ message: "Error al actualizar los datos del usuario" })
            return
          }
          res.json({ message: "Se envió la URL correctamente." })
        } catch (mailError) {
          console.error("Error al enviar el correo:", mailError)
          res.status(500).json({ message: "Error al enviar el correo." })
        }
      })
    } catch (error) {
      console.error("Error en resetLogin:", error)
      res.status(500).json({ message: "Error interno del servidor" })
    }
  }

  //si el usuario ingreso a la URL,
  //'/two_factor?token=fslkfjasl' 
  authentication = async (req: Request, res: Response): Promise<any> => {
    try {
      // obtengo el token de la URL
      const { token } = req.params
      // busco el usuario por el token
      const infoUser = await this.userModel.searchUserByToken(token)
      if (!infoUser) {
        res.status(404).json({ message: "no se encontro el usuario" })
        return
      }
      const { phone, id } = infoUser as CleanUser
      if (!phone || !id) {
        res.status(404).json({ message: "acceso no autorizado, por falta de datos" })
        return
      }
      const code = String(Math.floor(100000 + Math.random() * 900000)) // Código de 6 dígitos
      const hashedCode = await hashCode(code)
      const { id: verificationId } = await this.userModel.updateVerification({ resetCode: hashedCode }, id)
      //enviar el cod por msg
      if (verificationId) {
        const verificationIdToken = generarToken({ verificationId }, "5m")
        await sendSMS({ phoneNumber: phone, code })
        res.status(200)
          .cookie("verification", verificationIdToken, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 1000 * 60 * 5,
          })
          .json({ message: 'Codigo enviado' })
        return
      }

      res.status(401).json({ message: 'no se pudo en enviar el codigo' })
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: error })
    }
  }
  //el usuario envia codigo
  validationToken = async (req: Request, res: Response): Promise<any> => {
    const { cod } = req.params
    const verificationToken = req.cookies?.verification
    try {
      const info = await this.userModel.verification(verificationToken, cod) as CleanUser
      if (!info || !info.id) {
        res.status(404).json({ message: "Usuario no encontrado" })
        return
      }
      const { id } = info
      const accessToken = generarToken(info)
      const refreshToken = generarToken(info, '7d')

      const newSession = {
        userId: id,
        accessToken: accessToken ?? "",
        refreshToken: refreshToken ?? "",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
      }
      const session = await this.userModel.createSession(newSession)
      res
        .cookie("access_token", session.accessToken, {
          httpOnly: true,
          sameSite: "strict",
          secure: true,
          maxAge: 1000 * 60 * 60
        })
        .cookie("refresh_token", session.refreshToken, {
          httpOnly: true,
          sameSite: "strict",
          maxAge: 1000 * 60 * 60 * 24 * 7
        })
        .json({ message: "Código válido" })
    } catch (error) {
      console.error("Error al verificar el código:", error)
      res.status(500).json({ message: "Error interno del servidor" })
    }
  }
}