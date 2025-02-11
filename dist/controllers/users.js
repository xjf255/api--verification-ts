import { validatedEmailUsers, validatedPartialUsers, validatedUsers } from "../schemas/user.js";
import { generarToken } from "../utils/generateToken.js";
import { hashCode, hashPassword } from "../utils/hashPassword.js";
import { deleteImage, loaderImage } from "../services/cloudMethods.js";
import { sendMail } from "../services/sendMail.js";
import ejs from "ejs";
import path from "path";
import getDirname from "../utils/dirname.js";
import { sendSMS } from "../services/sendSMS.js";
import { isValidUUID } from "../utils/validatedUUID.js";
import { hrInMs } from "../utils/constant.js";
export class UsersController {
    constructor({ UserModel }) {
        this.createUser = async (req, res) => {
            try {
                const file = req.file;
                if (file) {
                    req.body.avatar = await loaderImage({ file });
                }
                else {
                    req.body.avatar = 'https://res.cloudinary.com/dkshw9hik/image/upload/v1736294033/avatardefault_w9hsxz.webp';
                }
                console.log(req.body);
                const user = validatedUsers(req.body);
                if (user.error) {
                    return res.status(400).json({ message: JSON.parse(user.error.message) });
                }
                const userData = await this.userModel.createUser(user.data);
                console.log(userData);
                const accessToken = generarToken(userData);
                const refreshToken = generarToken(userData, "7d");
                if (!accessToken || !refreshToken) {
                    return res.status(403).json({ message: "Error al generar token" });
                }
                await this.userModel.createSession({
                    userId: userData.id,
                    accessToken,
                    refreshToken,
                    expiresAt: new Date(Date.now() + hrInMs * 24 * 7)
                });
                return res.status(201)
                    .cookie("access_token", accessToken, {
                    httpOnly: true,
                    sameSite: "strict",
                    expires: new Date(Date.now() + hrInMs)
                })
                    .cookie("refresh_token", refreshToken, {
                    httpOnly: true,
                    sameSite: "strict",
                    expires: new Date(Date.now() + hrInMs * 24 * 7)
                })
                    .json(userData);
            }
            catch (error) {
                console.log(error);
                if (error.code === "23505") {
                    if (error.constraint === "users_email_unique") {
                        return res.status(409).json({ message: "El correo ya esta en uso" });
                    }
                    else {
                        return res.status(409).json({ message: "El usuario ya esta en uso" });
                    }
                }
                else {
                    console.log(error);
                    return res.status(500).json({ message: "Error interno del servidor" });
                }
            }
        };
        this.updateUser = async (req, res) => {
            try {
                const id = req?.user?.id || req?.params?.id;
                if (!isValidUUID(id)) {
                    return res.status(400).json({ message: "ID inválido" });
                }
                if (req.file) {
                    await this.handleAvatarUpdate(req, id);
                }
                console.log(req.body);
                const updatedUserInfo = validatedPartialUsers({ ...req.body });
                console.log(updatedUserInfo);
                if (updatedUserInfo.error) {
                    return res.status(400).json({ message: JSON.parse(updatedUserInfo.error.message) });
                }
                const { password, ...otherData } = updatedUserInfo.data;
                if (password) {
                    otherData.password = await hashPassword(password);
                }
                const userToUpdate = Object.fromEntries(Object.entries(otherData).filter(([_, value]) => value !== null));
                const isUpdated = await this.userModel.updateUser(userToUpdate, id);
                if (!isUpdated) {
                    throw new Error("Usuario no encontrado");
                }
                return res.json({ message: "Usuario actualizado correctamente" });
            }
            catch (error) {
                if (error.code === "23505") {
                    return res.status(409).json({ message: "El usuario o correo no válido" });
                }
                else {
                    console.error("Error al actualizar usuario:", error);
                    return res.status(500).json({ message: "Error interno del servidor" });
                }
            }
        };
        this.handleAvatarUpdate = async (req, userId) => {
            try {
                const newAvatarUrl = await loaderImage({ file: req.file });
                const userData = await this.userModel.getById(userId);
                if (!userData) {
                    throw new Error("Usuario no existente");
                }
                const { avatar } = userData;
                const isDefaultAvatar = avatar === "https://res.cloudinary.com/dkshw9hik/image/upload/v1736294033/avatardefault_w9hsxz.webp";
                if (avatar && !isDefaultAvatar) {
                    const deleteResponse = await deleteImage(avatar);
                    if (deleteResponse.error) {
                        console.error("Error al eliminar la imagen:", deleteResponse.error);
                    }
                }
                req.body.avatar = newAvatarUrl;
            }
            catch (error) {
                console.error("Error al actualizar avatar:", error);
                throw new Error("Error al manejar la imagen de perfil");
            }
        };
        this.deleteUser = async (req, res) => {
            const { id } = req.params ?? req?.user;
            if (!isValidUUID(id)) {
                return res.status(400).json({ message: "ID inválido" });
            }
            const response = await this.userModel.updateUser({ isActive: false }, id);
            if (!response) {
                return res
                    .clearCookie("access_token")
                    .status(404)
                    .json({ message: "Usuario no encontrado" });
            }
        };
        this.reactiveUser = async (req, res) => {
            const id = req?.user?.id;
            if (!id || !isValidUUID(id)) {
                return res.status(400).json({ message: "ID inválido" });
            }
            const response = await this.userModel.updateUser({ isActive: true }, id.toString());
            if (!response) {
                return res.status(404).json({ message: "Usuario no encontrado" });
            }
            return res.clearCookie("reactive").json({ message: "Usuario reactivado" });
        };
        //envia una URL al correo del usuario
        this.resetLogin = async (req, res) => {
            try {
                //en el req.body puede venir el email o el user
                const { user, email } = req.body;
                const isValidInfo = validatedEmailUsers({
                    user, email
                });
                if (isValidInfo.error) {
                    return res.status(400).json({ message: JSON.parse(isValidInfo.error.message) });
                }
                const { user: validUser, email: validEmail } = isValidInfo.data;
                const valueOfUser = validEmail ?? validUser;
                if (!valueOfUser) {
                    return res.status(404).json({ message: 'no ingreso ningun valor para buscar el usuario' });
                }
                //busca el usuario por email o user
                const userData = await this.userModel.getAllInfo(valueOfUser);
                if (!userData) {
                    return res.status(404).json({ message: "Usuario no encontrado" });
                }
                const { id, user: userName, email: addressee } = userData;
                const time = new Date(Date.now() + hrInMs * 24);
                const token = generarToken({ codigo: Math.floor(Math.random() * 1000000).toString() }, "5m");
                const data = { userId: id, resetTokenExpires: time, resetToken: token };
                const templatePath = path.join(getDirname(), "../view/user/templateMail.ejs");
                const templateData = { name: userName, url: token };
                ejs.renderFile(templatePath, templateData, async (err, html) => {
                    if (err) {
                        console.error("Error al renderizar la plantilla:", err.message);
                        return res.status(500).json({ message: "Error al procesar la plantilla del correo." });
                    }
                    try {
                        // Enviar el correo
                        const messageId = await sendMail({ addressee, data: html });
                        console.log("Correo enviado con ID:", messageId);
                        // Actualiza la informacion del usuario
                        const isUpdated = await this.userModel.verificationAttempts(data);
                        if (!isUpdated) {
                            return res.status(500).json({ message: "Error al actualizar los datos del usuario" });
                        }
                        return res.json({ message: `Correo enviado correctamente a ${addressee}` });
                    }
                    catch (mailError) {
                        console.error("Error al enviar el correo:", mailError);
                        return res.status(500).json({ message: "Error al enviar el correo." });
                    }
                });
            }
            catch (error) {
                console.error("Error en resetLogin:", error);
                return res.status(500).json({ message: "Error interno del servidor" });
            }
        };
        //si el usuario ingreso a la URL,
        //'/two_factor?token=fslkfjasl' 
        this.authentication = async (req, res) => {
            try {
                // obtengo el token de la URL
                console.log(req.params);
                const { token } = req.params;
                // busco el usuario por el token
                const infoUser = await this.userModel.searchUserByToken(token);
                if (!infoUser) {
                    return res.status(404).json({ message: "no se encontro el usuario" });
                }
                const { phone, id } = infoUser;
                if (!phone || !id) {
                    return res.status(404).json({ message: "acceso no autorizado, por falta de datos" });
                }
                const code = String(Math.floor(100000 + Math.random() * 900000)); // Código de 6 dígitos
                const hashedCode = await hashCode(code);
                const { id: verificationId } = await this.userModel.updateVerification({ resetCode: hashedCode }, id);
                //enviar el cod por msg
                if (verificationId) {
                    const verificationIdToken = generarToken({ verificationId }, "5m");
                    await sendSMS({ phoneNumber: phone, code });
                    return res.cookie("verification", verificationIdToken, {
                        httpOnly: true,
                        sameSite: "strict",
                        expires: new Date(Date.now() + 1000 * 60 * 5)
                    })
                        .json({ message: 'Codigo enviado' });
                }
                return res.status(401).json({ message: 'no se pudo en enviar el codigo' });
            }
            catch (error) {
                console.log(error);
                return res.status(500).json({ message: error });
            }
        };
        //el usuario envia codigo
        this.validationToken = async (req, res) => {
            const { cod } = req.body;
            const verificationToken = req.cookies?.verification;
            try {
                const info = await this.userModel.verification(verificationToken, cod);
                if (!info || !info.id) {
                    return res.status(404).json({ message: "Usuario no encontrado" });
                }
                const { id } = info;
                const accessToken = generarToken(info);
                const refreshToken = generarToken(info, '7d');
                const newSession = {
                    userId: id,
                    accessToken: accessToken ?? "",
                    refreshToken: refreshToken ?? "",
                    expiresAt: new Date(Date.now() + hrInMs * 24 * 7)
                };
                const session = await this.userModel.createSession(newSession);
                return res
                    .cookie("access_token", session.accessToken, {
                    httpOnly: true,
                    sameSite: "strict",
                    secure: true,
                    expires: new Date(Date.now() + hrInMs)
                })
                    .cookie("refresh_token", session.refreshToken, {
                    httpOnly: true,
                    sameSite: "strict",
                    expires: new Date(Date.now() + hrInMs * 24 * 7)
                })
                    .json({ message: "Código válido" });
            }
            catch (error) {
                console.error("Error al verificar el código:", error);
                return res.status(500).json({ message: "Error interno del servidor" });
            }
        };
        this.userModel = UserModel;
    }
}
