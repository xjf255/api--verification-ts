import z from 'zod'
import { CreatedUser } from '../types.js'

const schemaUsers = z.object({
  "user": z.string().max(8, "El usuario puede tener un maximo de 8 caracteres").nullable(),
  "password": z.string().min(8, "La contraseña debe tener al menos 8 caracteres").regex(
    /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>])/,
    "La cadena debe contener al menos un número y un carácter especial"
  ),
  "email": z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    "Correo electrónico inválido"),
  "avatar": z.string().url().optional(),
  "phone": z.number().int().positive().max(8).optional(),
})

export function validatedUsers(object: CreatedUser) {
  return schemaUsers.safeParse(object)
}

export function validatedPartialUsers(object: Partial<CreatedUser>) {
  return schemaUsers.partial().safeParse(object)
}