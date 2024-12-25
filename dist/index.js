import express, { json } from 'express';
import { supabaseUrl } from './config.js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, getTableColumns } from 'drizzle-orm';
import { usersTable } from './schemas/db.js';
import { validatedPartialUsers, validatedUsers } from './schemas/user.js';
import { comparePassword, hashPassword } from './utils/hashPassword.js';
const app = express();
app.use(json());
app.disable('x-powered-by');
const PORT = process.env.SERVICE_PORT ?? 3001;
if (!supabaseUrl) {
    console.error('Error: supabaseUrl no está definido en la configuración.');
    process.exit(1);
}
const client = postgres(supabaseUrl, { debug: true, ssl: "require" });
const db = drizzle({ client });
// Endpoint para obtener los usuarios
app.get("/users", async (req, res) => {
    try {
        const data = await db.select({ ...getTableColumns(usersTable) }).from(usersTable);
        if (data.length === 0) {
            res.status(404).json({ message: "Sin existencias" });
            return;
        }
        const sanitizedUsers = data.map(({ password, ...info }) => info);
        res.status(200).json(sanitizedUsers);
    }
    catch (error) {
        console.error("Error al obtener los usuarios:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});
app.post("/users", async (req, res) => {
    try {
        const user = validatedUsers(req.body);
        if (user.error) {
            res.status(400).json({ message: JSON.parse(user.error.message) });
            return;
        }
        const userDB = await hashPassword(user.data);
        await db.insert(usersTable).values(userDB);
        res.status(201).json({ message: "usuario agregado Correctamente" });
    }
    catch (error) {
        if (error.code === "23505") {
            res.status(409).json({ message: "El usuario o correo ya existe" });
        }
        else {
            res.status(500).json({ message: "Error interno del servidor" });
        }
    }
});
app.put("/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }
        const updatedUserInfo = validatedPartialUsers(req.body);
        if (updatedUserInfo.error) {
            res.status(400).json({ message: JSON.parse(updatedUserInfo.error.message) });
            return;
        }
        const { password, ...otherData } = updatedUserInfo.data;
        const validData = Object.fromEntries(Object.entries({ ...otherData, password })
            .filter(([_, value]) => value != null));
        let userToUpdate = validData;
        if (password) {
            const userUpdated = await hashPassword(validData);
            userToUpdate = userUpdated;
        }
        await db.update(usersTable).set(userToUpdate).where(eq(usersTable.id, id));
        res.json({ message: "Usuario actualizado Correctamente" });
    }
    catch (error) {
        if (error.code === "23505") {
            res.status(409).json({ message: "El usuario o correo ya existe" });
        }
        else {
            res.status(500).json({ message: "Error interno del servidor" });
        }
    }
});
app.post('/login', async (req, res) => {
    const dataUser = validatedPartialUsers(req.body);
    if (dataUser.error) {
        res.status(401).json({ message: JSON.parse(dataUser.error.message) });
        return;
    }
    const { password, user, email } = dataUser.data;
    if (user && password) {
        const userInfo = await db.select({ ...getTableColumns(usersTable) }).from(usersTable).where(eq(usersTable.user, user));
        const { password: dbPassword } = userInfo[0];
        if (await comparePassword({ password: password, hashedPassword: dbPassword })) {
            res.json(userInfo);
            return;
        }
        res.status(401).json({ message: "contraseña Incorrecta" });
        return;
    }
    else if (email && password) {
        const userInfo = await db.select({ ...getTableColumns(usersTable) }).from(usersTable).where(eq(usersTable.email, email));
        const { password: dbPassword } = userInfo[0];
        if (await comparePassword({ password: password, hashedPassword: dbPassword })) {
            res.json(userInfo);
            return;
        }
        res.status(401).json({ message: "contraseña Incorrecta" });
        return;
    }
    res.status(404).json({ message: "no se encontro el usuario" });
});
// Ruta raíz para redirigir a /users
app.get("/", (req, res) => {
    res.send(`<a href="http://localhost:${PORT}/users">Ver usuarios</a>`);
});
// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
});
