import express, { Request, Response, json, NextFunction } from 'express'
import cookieParser from 'cookie-parser'
import { corsMiddleware } from './middleware/cors.js'
import { createUsersRouter } from './routes/users.js'
import { IUserClass } from './types.js'
import rateLimit from 'express-rate-limit'
import { createVerificationRouter } from './routes/verification.js'
import { authenticateUser } from './middleware/authenticateUser.js'
import { createFriendShipsRouter } from './routes/friendShips.js'
import { errorHandler } from './middleware/errorHandler.js'

export const createApp = ({ UserModel, FriendShipModel }: IUserClass) => {
  const app = express()

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' }
  })

  app.use(limiter)
  app.use(cookieParser())
  app.use(json())
  app.use(corsMiddleware())
  app.disable('x-powered-by')
  app.use(authenticateUser)

  const PORT = process.env.SERVICE_PORT ?? 3001

  app.get('/', (req: Request, res: Response): void => {
    res.json({ message: 'API online', version: '1.0.0', port: PORT })
  })

  app.use('/users', createUsersRouter(UserModel))
  app.use('/verification', createVerificationRouter(UserModel))
  app.use('/friendships', createFriendShipsRouter({ UserModel, FriendShipModel }))

  // 404 handler — must come after all routes
  app.use((req: Request, res: Response): void => {
    res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.path}` })
  })

  // Global error handler — must be last middleware (4 params)
  app.use(errorHandler)

  app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`)
  })
}