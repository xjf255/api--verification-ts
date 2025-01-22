import { Router } from "express"
import { UsersController } from "../controllers/users.js"
import { IUserClass } from "../types.js"
import multer from "multer";

const storage = multer.memoryStorage()
const upload = multer({ storage });
export const createUsersRouter = ({ UserModel }: IUserClass) => {
  const userRouter = Router()
  const usersController = new UsersController({ UserModel })
  userRouter.post('/', upload.single('avatar'), usersController.createUser.bind(usersController))
  userRouter.put('/:id', upload.single('avatar'), usersController.updateUser.bind(usersController))
  userRouter.delete('/:id', usersController.deleteUser.bind(usersController))
  userRouter.get('/reactive', usersController.reactiveUser.bind(usersController))
  userRouter.post('/resetLogin', usersController.resetLogin.bind(usersController))
  userRouter.get('/?token', usersController.authentication.bind(usersController))
  userRouter.get('/?cod', usersController.validationToken.bind(usersController))
  return userRouter
}

/* 
PUT indempotente(a pesar que se realice varias veces la misma peticion
cada vez genera o retorna lo mismo)
POST no es indempotente
*/