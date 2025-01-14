import { Request, Response } from "express"
import { validatedEmailUsers, validatedPartialUsers, validatedUsers } from "../schemas/user.js"
import { generarToken, getInfoToToken } from "../utils/generateToken.js"
import { hashCode, hashPassword } from "../utils/hashPassword.js"
import { deleteImage, loaderImage } from "../utils/cloudMethods.js"
import { sendMail } from "../utils/sendMail.js"
export class UsersController {
  private userModel

  constructor({ UserModel }: any) {
    this.userModel = UserModel
  }
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const messageId = await sendMail({ addressee: "juanfher.255@gmail.com" })
      console.log(messageId)
      const data = await this.userModel.getAll()
      if (data.length === 0) {
        res.status(404).json({ message: "Sin existencias" })
        return
      }
      res.status(200).json(data)
    } catch (error) {
      console.error("Error al obtener los usuarios:", error)
      res.status(500).json({ message: "Error interno del servidor" })
    }
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
      const { id } = req.params

      if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
        res.status(400).json({ message: "ID inválido" })
        return
      }

      const file = req.file
      if (file) {
        req.body.avatar = await loaderImage({ file })
        const { avatar } = await this.userModel.getById(id)
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
    const { id } = req.params
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
    const token = req.cookies.reactive
    const id = getInfoToToken(token)
    console.log(id)
    if (!id || !/^[0-9a-fA-F-]{36}$/.test(id.toString())) {
      res.status(400).json({ message: "ID inválido" })
      return
    }
    const response = await this.userModel.updateUser({ isActive: true }, id)
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
      const isValidInfo = validatedEmailUsers(user ?? email)
      if (isValidInfo.error) {
        res.status(400).json({ message: JSON.parse(isValidInfo.error.message) })
        return
      }
      const { user: validUser, email: validEmail } = isValidInfo.data
      const userData = await this.userModel.getByInfo(validEmail ?? validUser)
      if (!userData) {
        res.status(404).json({ message: "Usuario no encontrado" })
        return
      }
      const { id, rebootAttempts } = userData
      if (rebootAttempts === 0) {
        res.status(401).json({ message: "Intentalo más tarde" })
      }

      const time = new Date(Date.now() + (10 * 60 * 1000))
      const data = { resetTokenExpires: time.getTime() }
      const isUpdated = await this.userModel.updateUser(data, id)
      if (!isUpdated) {
        res.json({ message: "Error al enviar el URL" })
      }
      //todo
      res.json({ message: "se envio la url" })
    } catch (error) {
      console.error("Error en resetLogin:", error)
      res.status(500).json({ message: "Error interno del servidor" })
    }
  }

  //si el usuario ingreso a la URL,
  //'/two_factor?token=fslkfjasl' 
  authentication = async (req: Request, res: Response): Promise<any> => {
    const { token } = req.params
    if(!token){
      res.status(401).json({message:'Token invalido'})
    }
    
  }

  resetPassword = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params
    const { code } = req.body
    if (!code || !/^[0-9]{6}$/.test(code)) {
      res.status(400).json({ message: "Código inválido" })
      return
    }
    try {
      const response = await this.userModel.getById(id)
      if (!response) {
        res.status(404).json({ message: "Usuario no encontrado" })
        return
      }
      if (response.resetToken !== code) {
        res.status(400).json({ message: "Código inválido" })
        return
      }
      res.json({ message: "Código válido" })
    } catch (error) {
      console.error("Error al verificar el código:", error)
      res.status(500).json({ message: "Error interno del servidor" })
    }
  }
}