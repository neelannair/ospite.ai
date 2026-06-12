// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt, type Property } from '../../lib/properties'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messages, property, language } = req.body as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    property: Property
    language: string
  }

  if (!messages || !property) {
    return res.status(400).json({ error: 'Missing messages or property' })
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: buildSystemPrompt(property, language || 'English'),
      messages,
    })

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')

    return res.status(200).json({ reply: text })
  } catch (error: any) {
    console.error('Claude API error:', error)
    return res.status(500).json({ error: 'AI assistant temporarily unavailable' })
  }
}
