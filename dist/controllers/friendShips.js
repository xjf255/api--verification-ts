export class FriendShipsController {
    constructor({ UserModel, FriendShipModel }) {
        this.requestSend = async (req, res, next) => {
            try {
                const { requesterId, addressee } = req.body;
                if (!requesterId || !addressee) {
                    return res.status(400).json({ message: 'Faltan datos' });
                }
                const response = await this.userModel.friendRequestSend(addressee, requesterId);
                if (!response) {
                    return res.status(400).json({ message: 'No se pudo enviar la solicitud de amistad' });
                }
                return res.status(200).json({ message: 'Solicitud de amistad enviada' });
            }
            catch (error) {
                next(error);
            }
        };
        this.requestAccept = async (req, res, next) => {
            try {
                const { friendshipId } = req.params;
                const response = await this.friendShipModel.friendRequestAccept(friendshipId);
                if (!response) {
                    return res.status(404).json({ message: 'No se pudo aceptar la solicitud de amistad' });
                }
                return res.status(200).json({ message: 'Solicitud de amistad aceptada' });
            }
            catch (error) {
                next(error);
            }
        };
        this.requestReject = async (req, res, next) => {
            try {
                const { friendshipId } = req.params;
                const response = await this.friendShipModel.friendRequestReject(friendshipId);
                if (!response) {
                    return res.status(404).json({ message: 'No se pudo rechazar la solicitud de amistad' });
                }
                return res.status(200).json({ message: 'Solicitud de amistad rechazada' });
            }
            catch (error) {
                next(error);
            }
        };
        this.cancelRequest = async (req, res, next) => {
            try {
                const { friendshipId } = req.params;
                const response = await this.friendShipModel.cancelFriendRequest(friendshipId);
                if (!response) {
                    return res.status(404).json({ message: 'No se pudo cancelar la solicitud de amistad' });
                }
                return res.status(200).json({ message: 'Solicitud de amistad cancelada' });
            }
            catch (error) {
                next(error);
            }
        };
        this.getFriendsList = async (req, res, next) => {
            try {
                const { userId } = req.params;
                const friends = await this.friendShipModel.getFriendsList(userId);
                if (friends.length === 0) {
                    return res.status(200).json({ message: 'No se encontraron amigos' });
                }
                return res.status(200).json({ friends });
            }
            catch (error) {
                next(error);
            }
        };
        this.getFriendRequestsList = async (req, res, next) => {
            try {
                const { userId } = req.params;
                const requests = await this.friendShipModel.getFriendRequestsList(userId);
                if (requests.length === 0) {
                    return res.status(200).json({ message: 'No se encontraron solicitudes de amistad' });
                }
                return res.status(200).json({ requests });
            }
            catch (error) {
                next(error);
            }
        };
        this.removeFriend = async (req, res, next) => {
            try {
                const { friendshipId } = req.params;
                const response = await this.friendShipModel.removeFriend(friendshipId);
                if (!response) {
                    return res.status(404).json({ message: 'No se pudo eliminar la amistad' });
                }
                return res.status(200).json({ message: 'Amistad eliminada' });
            }
            catch (error) {
                next(error);
            }
        };
        this.userModel = UserModel;
        this.friendShipModel = FriendShipModel;
    }
}
