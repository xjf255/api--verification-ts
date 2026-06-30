export class AppError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
    }
}
export const errorHandler = (err, req, res, next) => {
    // Operational errors we threw ourselves
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ message: err.message });
        return;
    }
    // Postgres unique constraint violation — may come directly or wrapped by Drizzle
    const pgCode = err.code ?? err.cause?.code;
    const pgConstraint = err.constraint ?? err.cause?.constraint;
    if (pgCode === '23505') {
        const isEmail = pgConstraint?.includes('email');
        res.status(409).json({
            message: isEmail
                ? 'El correo ya está en uso'
                : 'El usuario ya está en uso'
        });
        return;
    }
    // JWT errors
    if (err.name === 'TokenExpiredError') {
        res.status(401).json({ message: 'Token expirado. Por favor inicia sesión de nuevo.' });
        return;
    }
    if (err.name === 'JsonWebTokenError') {
        res.status(403).json({ message: 'Token inválido.' });
        return;
    }
    // Unknown errors — log and hide details from client
    console.error('[Unhandled Error]', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
};
