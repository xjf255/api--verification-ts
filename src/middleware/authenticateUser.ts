import { NextFunction, Request, Response } from 'express'
import { getInfoToToken } from '../utils/generateToken.js'
import { DecodedToken } from '../jwt.js'

export const authenticateUser = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.access_token ?? req.cookies?.reactive

  if (!token) {
    ;(req as any).user = { id: null }
    return next()
  }

  try {
    const userInfo = getInfoToToken(token)
    if (!userInfo?.id) {
      ;(req as any).user = { id: null }
    } else {
      ;(req as any).user = { id: (userInfo as DecodedToken).id }
    }
  } catch {
    // Expired or invalid token — treat as unauthenticated, not an error
    ;(req as any).user = { id: null }
  }

  next()
}
