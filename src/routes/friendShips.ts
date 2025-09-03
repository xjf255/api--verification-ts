import { Router } from "express"
import { IUserClass } from "../types.js"
import { FriendShipsController } from "../controllers/friendShips.js"

export const createFriendShipsRouter = ({ UserModel, FriendShipModel }: IUserClass) => {
  const friendShipsRouter = Router()
  const friendShipsController = new FriendShipsController({ UserModel, FriendShipModel })
  friendShipsRouter.post('/request', friendShipsController.requestSend.bind(friendShipsController))
  friendShipsRouter.post('/:friendshipId/accept', friendShipsController.requestAccept.bind(friendShipsController))
  friendShipsRouter.delete('/:friendshipId', friendShipsController.removeFriend.bind(friendShipsController))
  friendShipsRouter.post('/:friendshipId/reject', friendShipsController.requestReject.bind(friendShipsController))
  friendShipsRouter.delete('/:friendshipId/cancel', friendShipsController.cancelRequest.bind(friendShipsController))
  friendShipsRouter.get('/:userId/friends', friendShipsController.getFriendsList.bind(friendShipsController))
  friendShipsRouter.get('/:userId/requests', friendShipsController.getFriendRequestsList.bind(friendShipsController))
  return friendShipsRouter
}