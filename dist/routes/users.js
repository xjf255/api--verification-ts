import { Router } from "express";
import { UsersController } from "../controllers/users.js";
import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage });
export const createUsersRouter = ({ UserModel }) => {
    const userRouter = Router();
    const usersController = new UsersController({ UserModel });
    userRouter.get('/', usersController.getAll.bind(usersController));
    userRouter.post('/', upload.single('avatar'), usersController.createUser.bind(usersController));
    userRouter.put('/:id', upload.single('avatar'), usersController.updateUser.bind(usersController));
    userRouter.post('/login', usersController.login.bind(usersController));
    userRouter.get('/protected', usersController.protected.bind(usersController));
    return userRouter;
};
