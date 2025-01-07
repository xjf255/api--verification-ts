import { Router } from "express"
import { UsersController } from "../controllers/users.js"
import { IUserClass } from "../types.js"
import multer from "multer";
import CloudinaryStorage from "../utils/cloudinaryStorage.js";

const storage = new CloudinaryStorage()
const upload = multer({ storage });

export const createUsersRouter = ({ UserModel }: IUserClass) => {
  const userRouter = Router()
  const usersController = new UsersController({ UserModel })
  userRouter.get('/', usersController.getAll.bind(usersController))
  userRouter.post('/', upload.single('avatar'), usersController.createUser.bind(usersController))
  userRouter.put('/:id', upload.single('avatar'), usersController.updateUser.bind(usersController))
  userRouter.post('/login', usersController.login.bind(usersController))
  userRouter.get('/protected', usersController.protected.bind(usersController))
  return userRouter
}