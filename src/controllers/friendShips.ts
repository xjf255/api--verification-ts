import { NextFunction, Request, Response } from 'express'
import { IUserClass } from '../types.js'

export class FriendShipsController {
  private userModel
  private friendShipModel

  constructor ({ UserModel, FriendShipModel }: IUserClass) {
    this.userModel = UserModel
    this.friendShipModel = FriendShipModel
  }

  requestSend = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const { requesterId, addressee } = req.body
      if (!requesterId || !addressee) {
        return res.status(400).json({ message: 'Faltan datos' })
      }
      const response = await this.userModel.friendRequestSend(addressee, requesterId)
      if (!response) {
        return res.status(400).json({ message: 'No se pudo enviar la solicitud de amistad' })
      }
      return res.status(200).json({ message: 'Solicitud de amistad enviada' })
    } catch (error) {
      next(error)
    }
  }

  requestAccept = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const { friendshipId } = req.params
      const response = await this.friendShipModel.friendRequestAccept(friendshipId as string)
      if (!response) {
        return res.status(404).json({ message: 'No se pudo aceptar la solicitud de amistad' })
      }
      return res.status(200).json({ message: 'Solicitud de amistad aceptada' })
    } catch (error) {
      next(error)
    }
  }

  requestReject = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const { friendshipId } = req.params
      const response = await this.friendShipModel.friendRequestReject(friendshipId as string)
      if (!response) {
        return res.status(404).json({ message: 'No se pudo rechazar la solicitud de amistad' })
      }
      return res.status(200).json({ message: 'Solicitud de amistad rechazada' })
    } catch (error) {
      next(error)
    }
  }

  cancelRequest = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const { friendshipId } = req.params
      const response = await this.friendShipModel.cancelFriendRequest(friendshipId as string)
      if (!response) {
        return res.status(404).json({ message: 'No se pudo cancelar la solicitud de amistad' })
      }
      return res.status(200).json({ message: 'Solicitud de amistad cancelada' })
    } catch (error) {
      next(error)
    }
  }

  getFriendsList = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const { userId } = req.params
      const friends = await this.friendShipModel.getFriendsList(userId as string)
      if (friends.length === 0) {
        return res.status(200).json({ message: 'No se encontraron amigos' })
      }
      return res.status(200).json({ friends })
    } catch (error) {
      next(error)
    }
  }

  getFriendRequestsList = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const { userId } = req.params
      const requests = await this.friendShipModel.getFriendRequestsList(userId as string)
      if (requests.length === 0) {
        return res.status(200).json({ message: 'No se encontraron solicitudes de amistad' })
      }
      return res.status(200).json({ requests })
    } catch (error) {
      next(error)
    }
  }

  removeFriend = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const { friendshipId } = req.params
      const response = await this.friendShipModel.removeFriend(friendshipId as string)
      if (!response) {
        return res.status(404).json({ message: 'No se pudo eliminar la amistad' })
      }
      return res.status(200).json({ message: 'Amistad eliminada' })
    } catch (error) {
      next(error)
    }
  }
}
