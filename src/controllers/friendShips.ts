import { Request, Response } from "express"
import { IUserClass } from "../types.js"

export class FriendShipsController {
  private userModel
  private friendShipModel

  constructor({ UserModel, FriendShipModel }: IUserClass) {
    this.userModel = UserModel
    this.friendShipModel = FriendShipModel
  }

  requestSend = async (req: Request, res: Response): Promise<any> => {
    try {
      const { requester, addresseeId } = req.body
      if (!requester || !addresseeId) {
        return res.status(400).json({ message: "Faltan datos" })
      }
      const response = await this.userModel.friendRequestSend(requester, addresseeId)
      if (!response) {
        return res.status(404).json({ message: "No se pudo enviar la solicitud de amistad" })
      }
      return res.status(200).json({ message: "Solicitud de amistad enviada" })
    } catch (error) {
      console.error("Error en requestSend:", error)
      return res.status(500).json({ message: "Error del servidor" })
    }
  }

  requestAccept = async (req: Request, res: Response): Promise<any> => {
    
  }
}
