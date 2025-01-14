import { createTransport } from "nodemailer"
import { MAIL, MAIL_PASSWORD } from "../config.js"

const transporter = createTransport({
  host: 'smtp.gmail.com',
  secure: true,
  port: 465,
  auth: {
    user: MAIL,
    pass: MAIL_PASSWORD,
  },
})

export async function sendMail({ addressee }: { addressee: string }) {
  const info = await transporter.sendMail({
    from: `"Optimized Life 🌱" <${MAIL}>`,
    to: addressee,
    subject: "Ahora es mas facil volver a acceder a Trello copy ✔",
    html: "<b>Hello world?</b>",
  });

  return info.messageId
}