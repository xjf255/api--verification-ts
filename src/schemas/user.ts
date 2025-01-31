import z from 'zod'
import { ValidateToReset } from '../types.js'
import { InsertUser } from './db.js'

const schemaUsers = z.object({
  "user": z.string().max(8, "El usuario puede tener un maximo de 8 caracteres").nullable(),
  "password": z.string().min(8, "La contraseña debe tener al menos 8 caracteres").regex(
    /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>])/,
    "La cadena debe contener al menos un número y un carácter especial"
  ),
  "email": z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    "Correo electrónico inválido"),
  "avatar": z.string().url(),
  "phone": z
    .string()
    .length(8, "El número de teléfono debe tener exactamente 8 dígitos.")
    .regex(/^\d+$/, "El número de teléfono solo puede contener dígitos."),
})

export function validatedUsers(object: InsertUser) {
  return schemaUsers.safeParse(object)
}

export function validatedPartialUsers(object: Partial<InsertUser>) {
  return schemaUsers.partial().safeParse(object)
}

export function validatedEmailUsers(object: Partial<ValidateToReset>) {
  return schemaUsers.partial().safeParse(object)
}