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
      const { requesterId, addressee } = req.body
      if (!requesterId || !addressee) {
        return res.status(400).json({ message: "Faltan datos" })
      }
      const response = await this.userModel.friendRequestSend(addressee, requesterId)
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
    try {
      const { friendshipId } = req.params
      if (!friendshipId) {
        return res.status(400).json({ message: "Faltan datos" })
      }
      const response = await this.friendShipModel.friendRequestAccept(friendshipId)
      if (!response) {
        return res.status(404).json({ message: "No se pudo aceptar la solicitud de amistad" })
      }
      return res.status(200).json({ message: "Solicitud de amistad aceptada" })
    } catch (error) {
      console.error("Error en requestAccept:", error)
      return res.status(500).json({ message: "Error del servidor" })
    }
  }

  requestReject = async (req: Request, res: Response): Promise<any> => {
    try {
      const { friendshipId } = req.params
      if (!friendshipId) {
        return res.status(400).json({ message: "Faltan datos" })
      }
      const response = await this.friendShipModel.friendRequestReject(friendshipId)
      if (!response) {
        return res.status(404).json({ message: "No se pudo rechazar la solicitud de amistad" })
      }
      return res.status(200).json({ message: "Solicitud de amistad rechazada" })
    } catch (error) {
      console.error("Error en requestReject:", error)
      return res.status(500).json({ message: "Error del servidor" })
    }
  }

  cancelRequest = async (req: Request, res: Response): Promise<any> => {
    try {
      const { friendshipId } = req.params
      if (!friendshipId) {
        return res.status(400).json({ message: "Faltan datos" })
      }
      const response = await this.friendShipModel.cancelFriendRequest(friendshipId)
      if (!response) {
        return res.status(404).json({ message: "No se pudo cancelar la solicitud de amistad" })
      }
      return res.status(200).json({ message: "Solicitud de amistad cancelada" })
    } catch (error) {
      console.error("Error en cancelRequest:", error)
      return res.status(500).json({ message: "Error del servidor" })
    }
  }

  getFriendsList = async (req: Request, res: Response): Promise<any> => {
    try {
      const { userId } = req.params
      if (!userId) {
        return res.status(400).json({ message: "Faltan datos" })
      }
      const friends = await this.friendShipModel.getFriendsList(userId)
      if (friends.length === 0) {
        return res.status(200).json({ message: "No se encontraron amigos" })
      }
      return res.status(200).json({ friends })
    } catch (error) {
      console.error("Error en getFriendsList:", error)
      return res.status(404).json({ message: "No se pudo obtener la lista de amigos" })
    }
  }

  getFriendRequestsList = async (req: Request, res: Response): Promise<any> => {
    try {
      const { userId } = req.params
      if (!userId) {
        return res.status(400).json({ message: "Faltan datos" })
      }
      const requests = await this.friendShipModel.getFriendRequestsList(userId)
      if (requests.length === 0) {
        return res.status(200).json({ message: "No se encontraron de solicitudes de amistad" })
      }
      return res.status(200).json({ requests })
    } catch (error) {
      console.error("Error en getFriendRequestsList:", error)
      return res.status(404).json({ message: "No se pudo obtener la lista de solicitudes de amistad" })
    }
  }

  removeFriend = async (req: Request, res: Response): Promise<any> => {
    try {
      const { friendshipId } = req.params
      if (!friendshipId) {
        return res.status(400).json({ message: "Faltan datos" })
      }
      const response = await this.friendShipModel.removeFriend(friendshipId)
      if (!response) {
        return res.status(404).json({ message: "No se pudo eliminar la amistad" })
      }
      return res.status(200).json({ message: "Amistad eliminada" })
    } catch (error) {
      console.error("Error en removeFriend:", error)
      return res.status(500).json({ message: "Error del servidor" })
    }
  }
}
