import { Vonage } from '@vonage/server-sdk';
import { Auth } from '@vonage/auth';
import { SMS, SMS_SECRET } from '../config.js';
const auth = new Auth({
    apiKey: SMS,
    apiSecret: SMS_SECRET
});
const vonage = new Vonage(auth);
async function send({ to, from, text }) {
    try {
        const response = await vonage.sms.send({ to, from, text });
        console.log(response);
    }
    catch (error) {
        console.error("Error enviando el mensaje ", error);
        throw Error;
    }
}
export async function sendSMS({ phoneNumber, code }) {
    const from = "Trello Copy";
    const to = `502${phoneNumber}`;
    const text = `su código de verificación para Trello es: ${code}. Válido por 5 minutos`;
    send({ to, from, text });
}
