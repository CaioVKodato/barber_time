import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const user = (process.env.SMTP_USER ?? '').trim();
const pass = (process.env.SMTP_PASS ?? '').replace(/\s/g, '');
const to = process.argv[2] ?? user;

if (!user || !pass) {
  console.error('Defina SMTP_USER e SMTP_PASS no .env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: { user, pass },
});

try {
  await transporter.verify();
  console.log('SMTP login OK');

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? user,
    to,
    subject: 'BarberTime — teste de e-mail',
    text: 'Se você recebeu isto, o SMTP está funcionando.',
  });

  console.log('E-mail de teste enviado para:', to);
  console.log('MessageId:', info.messageId);
} catch (err) {
  console.error('Falha:', err.message);
  process.exit(1);
}
