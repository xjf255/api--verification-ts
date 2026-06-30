import { z } from 'zod';
export const uuidParamSchema = z.object({
    id: z.string().uuid('El ID debe ser un UUID válido')
});
export const friendshipIdParamSchema = z.object({
    friendshipId: z.string().uuid('El ID de amistad debe ser un UUID válido')
});
export const userIdParamSchema = z.object({
    userId: z.string().uuid('El ID de usuario debe ser un UUID válido')
});
export const emailParamSchema = z.object({
    email: z.string().email('El email no tiene un formato válido')
});
export const tokenParamSchema = z.object({
    token: z.string().min(1, 'El token no puede estar vacío')
});
