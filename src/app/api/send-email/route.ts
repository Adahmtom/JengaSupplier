'use server'

import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get('x-email-secret')
  if (secret !== process.env.EMAIL_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { to, subject, html } = (await req.json()) as {
    to: string
    subject: string
    html: string
  }

  if (!to || !subject || !html) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })

  await transporter.sendMail({
    from: `"China Business Vault by Belle Jones" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  })

  return NextResponse.json({ ok: true })
}
