import { Router } from "express"
import { IUserClass } from "../types.js"
import { FriendShipsController } from "../controllers/friendShips.js"

export const createFriendShipsRouter = ({ UserModel, FriendShipModel }: IUserClass) => {
  const friendShipsRouter = Router()
  const friendShipsController = new FriendShipsController({ UserModel, FriendShipModel })
  friendShipsRouter.post('/request', friendShipsController.requestSend.bind(friendShipsController))
  friendShipsRouter.post('/:id/accept', friendShipsController.requestAccept.bind(friendShipsController))
  return friendShipsRouter
}