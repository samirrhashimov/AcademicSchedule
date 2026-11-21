import nodemailer from 'nodemailer'

let transporter = null

const getTransporter = () => {
  if (transporter) {
    return transporter
  }
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('E-poçt göndərilməsi sazlanmayıb (SMTP_* dəyişənlərinə bax).')
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  return transporter
}

export const sendResetEmail = async (to, link) => {
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'AcademicSchedule: şifrə bərpası',
    text: `Şifrəni bərpa etmək üçün bu linkə keç (1 saat keçərlidir):\n${link}\n\nƏgər sən istəməmisənsə, bu məktuba məhəl qoyma.`,
  })
}
