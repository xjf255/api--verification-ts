import { validatedPartialUsers, validatedUsers } from "../schemas/user.js";
import { generarToken, getInfoToToken } from "../utils/generateToken.js";
import { hashPassword } from "../utils/hashPassword.js";
export class UsersController {
    constructor({ UserModel }) {
        this.getAll = async (req, res) => {
            try {
                const data = await this.userModel.getAll();
                if (data.length === 0) {
                    res.status(404).json({ message: "Sin existencias" });
                    return;
                }
                res.status(200).json(data);
            }
            catch (error) {
                console.error("Error al obtener los usuarios:", error);
                res.status(500).json({ message: "Error interno del servidor" });
            }
        };
        this.createUser = async (req, res) => {
            try {
                const file = req.file;
                console.log(req.file, req.body);
                const user = validatedUsers(req.body);
                if (user.error) {
                    res.status(400).json({ message: JSON.parse(user.error.message) });
                    return;
                }
                console.log('img cargada');
                return;
                // const userData = await this.userModel.create(user.data)
                // const token = generarToken(userData)
                // res.status(201)
                //   .cookie("access_token", token, {
                //     httpOnly: true,
                //     sameSite: "strict"
                //   })
                //   .json(userData)
            }
            catch (error) {
                if (error.code === "23505") {
                    res.status(409).json({ message: "El usuario o correo no valido" });
                }
                else {
                    console.log(error);
                    res.status(500).json({ message: "Error interno del servidor" });
                }
            }
        };
        this.updateUser = async (req, res) => {
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
                const isUpdated = await this.userModel.updateUser(userToUpdate, id);
                if (!isUpdated) {
                    throw new Error("Usuario no encontrado");
                }
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
        };
        this.login = async (req, res) => {
            try {
                const dataUser = validatedPartialUsers(req.body);
                if (dataUser.error) {
                    res.status(400).json({ message: JSON.parse(dataUser.error.message) });
                    return;
                }
                const { password, user, email } = dataUser.data;
                if (!password || !(user || email)) {
                    res.status(400).json({ message: "Faltan datos" });
                    return;
                }
                const userData = await this.userModel.login({ user, email, password });
                if (!userData) {
                    res.status(404).json({ message: "Credenciales inválidas" });
                    return;
                }
                const token = generarToken(userData);
                res
                    .cookie("access_token", token, {
                    httpOnly: true,
                    sameSite: "strict"
                }).json({
                    message: "Inicio de sesión exitoso",
                    user: userData,
                    token,
                });
            }
            catch (error) {
                console.error("Error en el endpoint /login:", error);
                res.status(500).json({ message: "Error interno del servidor" });
            }
        };
        this.protected = (req, res) => {
            const token = req.cookies.access_token;
            if (!token) {
                return res.status(403).json({ error: "Access denied. No token provided." });
            }
            try {
                const userInfo = getInfoToToken(token);
                res.json(userInfo);
            }
            catch (error) {
                console.error("Error decoding token:", error);
                res.status(401).json({ error: "Invalid token." });
            }
        };
        this.userModel = UserModel;
    }
}
