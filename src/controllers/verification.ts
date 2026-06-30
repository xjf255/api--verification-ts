import { NextFunction, Request, Response } from 'express'
import { validatedPartialUsers } from '../schemas/user.js'
import { generarToken, getInfoToToken } from '../utils/generateToken.js'
import { CleanUser, IUserModel } from '../types.js'
import { hrInMs } from '../utils/constant.js'

export class VerificationController {
  private userModel

  constructor (UserModel: IUserModel) {
    this.userModel = UserModel
  }

  login = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const dataUser = validatedPartialUsers({ ...req.body })
      if (dataUser.error) {
        return res.status(400).json({ message: JSON.parse(dataUser.error.message) })
      }
      const { password, user, email } = dataUser.data
      if (!password || !(user || email)) {
        return res.status(400).json({ message: 'Faltan datos' })
      }
      const userData = await this.userModel.login({ user, email, password }) as CleanUser
      if (!userData) {
        return res.status(401).json({ message: 'Credenciales inválidas' })
      }

      if (!userData.isActive) {
        const reactiveToken = generarToken({ id: userData.id }, '1h')
        return res.status(401).cookie('reactive', reactiveToken, {
          httpOnly: true,
          sameSite: 'strict',
          secure: true,
          expires: new Date(Date.now() + hrInMs)
        }).json({ message: 'Usuario inactivo' })
      }

      const token = generarToken(userData)
      const refreshToken = generarToken(userData, '7d')

      if (!token || !refreshToken) {
        return res.status(403).json({ message: 'Error al generar token' })
      }

      await this.userModel.createSession({
        userId: userData.id,
        accessToken: token,
        refreshToken,
        expiresAt: new Date(Date.now() + hrInMs * 24 * 7)
      })

      res
        .cookie('access_token', token, {
          httpOnly: true,
          sameSite: 'strict',
          secure: true,
          expires: new Date(Date.now() + hrInMs)
        })
        .cookie('refresh_token', refreshToken, {
          httpOnly: true,
          sameSite: 'strict',
          secure: true,
          expires: new Date(Date.now() + hrInMs * 24 * 7)
        })
        .json({
          message: 'Inicio de sesión exitoso',
          user: userData,
          token
        })
    } catch (error) {
      next(error)
    }
  }

  loginByGuest = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const dataUser = validatedPartialUsers({ ...req.body })
      if (dataUser.error) {
        return res.status(400).json({ message: JSON.parse(dataUser.error.message) })
      }
      const { password, user, email } = dataUser.data
      if (!password || !(user || email)) {
        return res.status(400).json({ message: 'Faltan datos' })
      }
      const userData = await this.userModel.login({ user, email, password }) as CleanUser
      if (!userData) {
        return res.status(401).json({ message: 'Credenciales inválidas' })
      }

      if (!userData.isActive) {
        const reactiveToken = generarToken({ id: userData.id }, '1h')
        return res.status(401).cookie('reactive', reactiveToken, {
          httpOnly: true,
          sameSite: 'strict',
          secure: true,
          expires: new Date(Date.now() + hrInMs)
        }).json({ message: 'Usuario inactivo' })
      }

      const token = generarToken(userData)
      const refreshToken = generarToken(userData, '7d')

      if (!token || !refreshToken) {
        return res.status(403).json({ message: 'Error al generar token' })
      }

      await this.userModel.createSession({
        userId: userData.id,
        accessToken: token,
        refreshToken,
        expiresAt: new Date(Date.now() + hrInMs * 24 * 7)
      })

      res
        .cookie('access_token', token, {
          httpOnly: true,
          sameSite: 'strict',
          secure: true,
          expires: new Date(Date.now() + hrInMs)
        })
        .cookie('refresh_token', refreshToken, {
          httpOnly: true,
          sameSite: 'strict',
          secure: true,
          expires: new Date(Date.now() + hrInMs * 24 * 7)
        })
        .json({
          message: 'Inicio de sesión exitoso',
          user: userData,
          token
        })
    } catch (error) {
      next(error)
    }
  }

  protected = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const token = req.cookies?.access_token ?? ''
    const refreshToken = req.cookies?.refresh_token ?? ''

    if (!refreshToken) {
      return res.status(403).json({ error: 'Access denied. No token provided.' })
    }

    try {
      const refreshTokenInfo = getInfoToToken(refreshToken)
      const accessTokenInfo = getInfoToToken(token)

      if (!refreshTokenInfo || !accessTokenInfo) {
        return res.status(403).json({ error: 'Access denied. Invalid token.' })
      }

      const { exp: expRefreshToken } = refreshTokenInfo
      const { exp: expAccessToken, isGuest } = accessTokenInfo as any

      if ((!expRefreshToken || Date.now() >= expRefreshToken * 1000) && isGuest) {
        return res.status(403)
          .clearCookie('access_token')
          .clearCookie('refresh_token')
          .json({ error: 'Session expired. Please log in again.' })
      }

      if (!expAccessToken || Date.now() >= expAccessToken * 1000) {
        const newToken = generarToken(refreshTokenInfo as Record<string, any>)

        const updateSession = await this.userModel.updateSession({
          accessToken: newToken,
          expiresAt: new Date(Date.now() + hrInMs)
        }, refreshToken)

        if (!updateSession) {
          return res.status(500).json({ error: 'Server error. Try again later.' })
        }

        return res.cookie('access_token', newToken, {
          httpOnly: true,
          sameSite: 'strict',
          secure: true,
          expires: new Date(Date.now() + hrInMs)
        }).json(updateSession)
      }

      const user = await this.userModel.getById((accessTokenInfo as any).id)
      return res.json(user)
    } catch (error) {
      next(error)
    }
  }

  logout = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const accessToken = req.cookies?.access_token ?? ''
      const refreshToken = req.cookies?.refresh_token ?? ''
      await this.userModel.removeSession(accessToken, refreshToken)
      return res
        .clearCookie('access_token', { httpOnly: true, sameSite: 'strict', secure: true })
        .clearCookie('refresh_token', { httpOnly: true, sameSite: 'strict', secure: true })
        .json({ message: 'Logout exitoso' })
    } catch (error) {
      next(error)
    }
  }
}