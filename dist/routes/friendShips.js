import { Router } from 'express';
import { FriendShipsController } from '../controllers/friendShips.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { friendshipIdParamSchema, userIdParamSchema } from '../schemas/params.js';
export const createFriendShipsRouter = ({ UserModel, FriendShipModel }) => {
    const friendShipsRouter = Router();
    const friendShipsController = new FriendShipsController({ UserModel, FriendShipModel });
    friendShipsRouter.post('/request', friendShipsController.requestSend.bind(friendShipsController));
    friendShipsRouter.post('/:friendshipId/accept', validateRequest(friendshipIdParamSchema), friendShipsController.requestAccept.bind(friendShipsController));
    friendShipsRouter.delete('/:friendshipId', validateRequest(friendshipIdParamSchema), friendShipsController.removeFriend.bind(friendShipsController));
    friendShipsRouter.post('/:friendshipId/reject', validateRequest(friendshipIdParamSchema), friendShipsController.requestReject.bind(friendShipsController));
    friendShipsRouter.delete('/:friendshipId/cancel', validateRequest(friendshipIdParamSchema), friendShipsController.cancelRequest.bind(friendShipsController));
    friendShipsRouter.get('/:userId/friends', validateRequest(userIdParamSchema), friendShipsController.getFriendsList.bind(friendShipsController));
    friendShipsRouter.get('/:userId/requests', validateRequest(userIdParamSchema), friendShipsController.getFriendRequestsList.bind(friendShipsController));
    return friendShipsRouter;
};
