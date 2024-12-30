import express, { Request, Response, json } from 'express'
import cookieParser from 'cookie-parser'
import { corsMiddleware } from './middleware/cors.js'
import { createUsersRouter } from './routes/users.js'
import { IUserClass, IUserModel } from './types.js'

export const createApp = ({ UserModel }: IUserClass) => {

  const app = express()
  app.use(cookieParser())
  app.use(json())
  app.use(corsMiddleware())
  app.disable('x-powered-by')
  app.use("/users", createUsersRouter({ UserModel }))

  const PORT = process.env.SERVICE_PORT ?? 3001

  app.get("/", (req: Request, res: Response): void => {
    res.send(`<a href="http://localhost:${PORT}/users">Ver usuarios</a>`)
  })

  app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`)
  })

}