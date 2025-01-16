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
    userRouter.delete('/:id', usersController.deleteUser.bind(usersController));
    userRouter.get('/reactive', usersController.reactiveUser.bind(usersController));
    userRouter.post('/resetLogin', usersController.resetLogin.bind(usersController));
    return userRouter;
};
/*
PUT indempotente(a pesar que se realice varias veces la misma peticion
cada vez genera o retorna lo mismo)
POST no es indempotente
*/ 
