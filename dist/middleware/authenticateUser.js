import { getInfoToToken } from "../utils/generateToken.js";
export const authenticateUser = (req, res, next) => {
    const token = req.cookies?.access_token ?? req.cookies?.reactive;
    if (!token) {
        req.user = { id: null };
        return next();
    }
    try {
        const userInfo = getInfoToToken(token);
        if (!userInfo || !userInfo.id) {
            req.user = { id: null };
        }
        else {
            req.user = { id: userInfo.id };
        }
    }
    catch (error) {
        req.user = { id: null };
    }
    next();
};
