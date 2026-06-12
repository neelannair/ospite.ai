// pages/api/whatsapp.ts
// This endpoint receives incoming WhatsApp messages from Twilio
// and responds using the property's AI assistant.
//
// SETUP:
// 1. Create a Twilio account at twilio.com
// 2. Enable the WhatsApp sandbox (or buy a WhatsApp-enabled number)
// 3. Set your webhook URL in Twilio console to:
//    https://your-app.vercel.app/api/whatsapp
// 4. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER to .env.local

import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt } from '../../lib/properties'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// In-memory conversation store (use Redis or a DB in production)
const conversations: Record<string, { role: 'user' | 'assistant'; content: string }[]> = {}

// In production: look up the property by the Twilio number or a guest session
// For now, we use a hardcoded demo property — replace with a DB lookup
function getPropertyForNumber(_toNumber: string) {
  // Example: look up from your DB using the WhatsApp number guests messaged
  return {
    id: 'demo',
    name: 'Villa Rosaria',
    type: 'Villa',
    location: 'Florence, Italy',
    rules: 'Check-in: 3pm. Check-out: 11am. No smoking. WiFi: VillaRosaria / welcome2024',
    local: 'Trattoria da Marco is 5 min walk. Taxi to airport ~€35, 25 min.',
    host: 'Maria — WhatsApp +39 333 1234567',
    extra: 'The rooftop is magical at sunset.',
    languages: ['English', 'Italian'],
    slug: 'villa-rosaria',
    createdAt: new Date().toISOString(),
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed')
  }

  // Twilio sends form-encoded data
  const { Body: userMessage, From: fromNumber, To: toNumber } = req.body

  if (!userMessage || !fromNumber) {
    return res.status(400).send('Missing fields')
  }

  // Retrieve or create conversation history for this guest
  if (!conversations[fromNumber]) {
    conversations[fromNumber] = []
  }
  const history = conversations[fromNumber]
  history.push({ role: 'user', content: userMessage })

  // Keep last 20 messages to stay within context limits
  const recentHistory = history.slice(-20)

  const property = getPropertyForNumber(toNumber)

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512, // Shorter for WhatsApp — guests expect brief replies
      system: buildSystemPrompt(property, 'English'),
      messages: recentHistory,
    })

    const reply = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')

    history.push({ role: 'assistant', content: reply })

    // Twilio expects TwiML XML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(reply)}</Message>
</Response>`

    res.setHeader('Content-Type', 'text/xml')
    return res.status(200).send(twiml)
  } catch (error) {
    console.error('WhatsApp handler error:', error)
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Sorry, I'm having trouble right now. Please contact the host directly at ${property.host}.</Message>
</Response>`
    res.setHeader('Content-Type', 'text/xml')
    return res.status(200).send(errorTwiml)
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export const config = {
  api: { bodyParser: { type: 'application/x-www-form-urlencoded' } },
}
