import nodemailer from 'nodemailer'
import { env, isProduction } from '~/config/environment'

let transporter = null

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host:   env.SMTP_HOST,
      port:   env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth:   { user: env.SMTP_USER, pass: env.SMTP_PASS },
    })
  }
  return transporter
}

const escapeHtml = (str = '') =>
  String(str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))

const sendMail = async ({ to, subject, html, text }) => {
  if (!env.SMTP_HOST) {
    if (isProduction) throw new Error('SMTP chưa được cấu hình')
    // eslint-disable-next-line no-console
    console.log(`\n[MAIL-DEV] Tới: ${to}\n[MAIL-DEV] Tiêu đề: ${subject}\n${text}\n`)
    return
  }
  await getTransporter().sendMail({ from: env.MAIL_FROM, to, subject, html, text })
}

export const sendResetPasswordEmail = ({ to, displayName, resetUrl, expiresInMinutes }) => {
  const name = escapeHtml(displayName)
  return sendMail({
    to,
    subject: 'Đặt lại mật khẩu',
    text:
      `Xin chào ${displayName},\n\n` +
      `Bạn vừa yêu cầu đặt lại mật khẩu. Mở liên kết sau (hiệu lực ${expiresInMinutes} phút):\n` +
      `${resetUrl}\n\nNếu không phải bạn, hãy bỏ qua email này.`,
    html:
      `<p>Xin chào <b>${name}</b>,</p>` +
      `<p>Bạn vừa yêu cầu đặt lại mật khẩu. Liên kết có hiệu lực trong <b>${expiresInMinutes} phút</b>:</p>` +
      `<p><a href="${resetUrl}">Đặt lại mật khẩu</a></p>` +
      `<p>Nếu không phải bạn, hãy bỏ qua email này.</p>`,
  })
}
