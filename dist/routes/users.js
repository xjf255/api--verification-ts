import { Router } from "express";
import { UsersController } from "../controllers/users.js";
export const createUsersRouter = ({ UserModel }) => {
    const userRouter = Router();
    const usersController = new UsersController({ UserModel });
    userRouter.get('/', usersController.getAll.bind(usersController));
    userRouter.post('/', usersController.createUser.bind(usersController));
    userRouter.put('/:id', usersController.updateUser.bind(usersController));
    userRouter.post('/login', usersController.login.bind(usersController));
    userRouter.get('/protected', usersController.protected.bind(usersController));
    return userRouter;
};
