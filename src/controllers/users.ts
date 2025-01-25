import { Request, Response } from "express"
import { validatedEmailUsers, validatedPartialUsers, validatedUsers } from "../schemas/user.js"
import { generarToken, getInfoToToken } from "../utils/generateToken.js"
import { hashPassword } from "../utils/hashPassword.js"
import { deleteImage, loaderImage } from "../services/cloudMethods.js"
import { sendMail } from "../services/sendMail.js"
import { CleanUser, IUserClass } from "../types.js"
import ejs from "ejs"
import path from "path"
import getDirname from "../utils/dirname.js"
import { sendSMS } from "../services/sendSMS.js"
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

      const userData = await this.userModel.create(user.data)
      const token = generarToken(userData)

      res.status(201)
        .cookie("access_token", token, {
          httpOnly: true,
          sameSite: "strict"
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

      if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
        res.status(400).json({ message: "ID inválido" })
        return
      }

      const file = req.file
      if (file) {
        req.body.avatar = await loaderImage({ file })
        const data = await this.userModel.getById(id)
        if (!data) {
          res.status(404).json({ message: "usuario no existente" })
          return
        }
        const { avatar } = data
        if (avatar && avatar !== "https://res.cloudinary.com/dkshw9hik/image/upload/v1736294033/avatardefault_w9hsxz.webp") {
          const res = await deleteImage(avatar)
          if (res.error) {
            console.error("Error al eliminar la imagen:", res.error)
          }
        }
      }

      const updatedUserInfo = validatedPartialUsers(req.body)
      if (updatedUserInfo.error) {
        res.status(400).json({ message: JSON.parse(updatedUserInfo.error.message) })
        return
      }
      const { password, ...otherData } = updatedUserInfo.data

      const validData = Object.fromEntries(
        Object.entries({ ...otherData, password })
          .filter(([_, value]) => value != null)
      )

      let userToUpdate = validData
      if (password) {
        const userUpdated = await hashPassword(validData)
        userToUpdate = userUpdated
      }

      const isUpdated = await this.userModel.updateUser(userToUpdate, id)
      if (!isUpdated) {
        throw new Error("Usuario no encontrado")
      }
      res.json({ message: "Usuario actualizado Correctamente" })
    } catch (error: any) {
      if (error.code === "23505") {
        res.status(409).json({ message: "El usuario o correo no valido" })
      } else {
        res.status(500).json({ message: "Error interno del servidor" })
      }
    }
  }

  deleteUser = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params ?? req?.user
    if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
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
    if (!id || !/^[0-9a-fA-F-]{36}$/.test(id.toString())) {
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
      const userData = await this.userModel.getByInfo(valueOfUser)
      if (!userData) {
        res.status(404).json({ message: "Usuario no encontrado" })
        return
      }
      const { id, user: userName, email: addressee, rebootAttempts } = userData as CleanUser
      if (rebootAttempts === 0 || !id) {
        res.status(401).json({ message: "Intentalo más tarde" })
        return
      }

      const time = new Date(Date.now() + 5 * 60 * 1000)
      const token = generarToken({ codigo: Math.floor(Math.random() * 1000000).toString() }, "5m")
      const data = { resetTokenExpires: time, rebootAttempts: rebootAttempts - 1, resetToken: token }
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
          const isUpdated = await this.userModel.updateUser(data, id)
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
      const { token } = req.params
      const infoUser = await this.userModel.getByToken(token)
      if (!infoUser) {
        res.status(404).json({ message: "no se encontro el usuario" })
        return
      }
      const { phone, id } = infoUser as CleanUser
      if (!phone || !id) {
        res.status(404).json({ message: "acceso no autorizado, por falta de datos" })
        return
      }
      const code = Math.floor(Math.random() * 1000000)
      const updateCod = await this.userModel.updateUser({ resetCod: code }, id)
      //enviar el cod por msg
      if (updateCod) {
        await sendSMS({ phoneNumber: phone, code })
        res.json({ message: 'Codigo enviado' })
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
    try {
      const response = await this.userModel.getByToken(cod)
      if (!response) {
        res.status(404).json({ message: "Usuario no encontrado" })
        return
      }
      res.json({ message: "Código válido" })
    } catch (error) {
      console.error("Error al verificar el código:", error)
      res.status(500).json({ message: "Error interno del servidor" })
    }
  }
}