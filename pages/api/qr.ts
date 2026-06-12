// pages/api/qr.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import QRCode from 'qrcode'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url, size = '300' } = req.query

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url parameter required' })
  }

  try {
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: parseInt(size as string),
      margin: 2,
      color: {
        dark: '#1E1A16',
        light: '#FAF7F3',
      },
    })

    // Return as base64 image
    const base64 = qrDataUrl.split(',')[1]
    const buffer = Buffer.from(base64, 'base64')

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    return res.status(200).send(buffer)
  } catch (error) {
    return res.status(500).json({ error: 'QR code generation failed' })
  }
}
