import { Router } from "express";
import { VerificationController } from "../controllers/verification.js";
export const createVerificationRouter = ({ UserModel }) => {
    const verificationController = new VerificationController({ UserModel });
    const verificationRouter = Router();
    verificationRouter.post('/login', verificationController.login.bind(verificationController));
    verificationRouter.get('/protected', verificationController.protected.bind(verificationController));
    verificationRouter.post('/logout', verificationController.logout.bind(verificationController));
    return verificationRouter;
};
