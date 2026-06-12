// pages/chat/[slug].tsx — Guest-facing chat interface
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import type { Property } from '../../lib/properties'

const WELCOME: Record<string, string> = {
  English:    "Benvenuto! 👋 I'm your personal assistant for this stay. Ask me anything about the property, house rules, or local area.",
  Italian:    "Benvenuto! 👋 Sono il tuo assistente personale. Chiedimi tutto sulla proprietà, le regole della casa o la zona.",
  Spanish:    "¡Bienvenido! 👋 Soy tu asistente personal. Pregúntame lo que quieras sobre la propiedad o la zona.",
  French:     "Bienvenue ! 👋 Je suis votre assistant personnel. Posez-moi vos questions sur la propriété ou les environs.",
  German:     "Willkommen! 👋 Ich bin Ihr persönlicher Assistent. Fragen Sie mich alles über die Unterkunft oder die Umgebung.",
  Portuguese: "Bem-vindo! 👋 Sou o seu assistente pessoal. Pergunte-me qualquer coisa sobre a propriedade ou a zona.",
}

const QUICK_QUESTIONS: Record<string, string[]> = {
  English:    ['Check-in time?', 'WiFi password?', 'Parking?', 'Best restaurants?', 'Contact host'],
  Italian:    ['Orario check-in?', 'Password WiFi?', 'Parcheggio?', 'Ristoranti consigliati?', 'Contatta host'],
  Spanish:    ['¿Hora de entrada?', '¿Contraseña WiFi?', '¿Aparcamiento?', '¿Restaurantes?', 'Contactar host'],
  French:     ["Heure d'arrivée ?", 'Mot de passe WiFi ?', 'Parking ?', 'Restaurants ?', "Contacter l'hôte"],
  German:     ['Check-in Zeit?', 'WLAN-Passwort?', 'Parken?', 'Restaurants?', 'Host kontaktieren'],
  Portuguese: ['Hora de check-in?', 'Password WiFi?', 'Estacionamento?', 'Restaurantes?', 'Contactar anfitrião'],
}

const FLAGS: Record<string, string> = {
  English: '🇬🇧', Italian: '🇮🇹', Spanish: '🇪🇸',
  French: '🇫🇷', German: '🇩🇪', Portuguese: '🇵🇹',
}

interface Message {
  role: 'host' | 'guest'
  content: string
  time: string
}

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatPage() {
  const router = useRouter()
  const { pid } = router.query

  const [property, setProperty] = useState<Property | null>(null)
  const [lang, setLang] = useState('English')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load property from localStorage
  useEffect(() => {
    if (!pid) return
    const props: Property[] = JSON.parse(localStorage.getItem('ospite_properties') || '[]')
    const found = props.find(p => p.id === pid)
    if (found) {
      setProperty(found)
      setLang(found.languages[0] || 'English')
      setMessages([{ role: 'host', content: WELCOME[found.languages[0]] || WELCOME.English, time: nowTime() }])
    }
  }, [pid])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function switchLang(newLang: string) {
    setLang(newLang)
    setMessages([{ role: 'host', content: WELCOME[newLang] || WELCOME.English, time: nowTime() }])
  }

  async function send(text?: string) {
    const msg = text ?? input.trim()
    if (!msg || loading || !property) return
    setInput('')

    const userMsg: Message = { role: 'guest', content: msg, time: nowTime() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)
    setError('')

    const apiHistory = newMessages
      .filter(m => m.role !== 'host' || newMessages.indexOf(m) > 0)
      .map(m => ({ role: m.role === 'guest' ? 'user' : 'assistant', content: m.content }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiHistory, property, language: lang }),
      })
      const data = await res.json()
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'host', content: data.reply, time: nowTime() }])
      } else {
        setError(data.error || 'Something went wrong.')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  if (!property) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Inter, sans-serif', color: '#8C8478' }}>Loading…</div>
  }

  const questions = QUICK_QUESTIONS[lang] || QUICK_QUESTIONS.English
  const avatar = property.name.charAt(0).toUpperCase()

  return (
    <>
      <Head>
        <title>{property.name} — Guest Assistant</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; }
        body { font-family: 'Inter', sans-serif; background: #FAF7F3; color: #1E1A16; }
        #app { display: flex; flex-direction: column; height: 100dvh; max-width: 560px; margin: 0 auto; }
        .header { padding: 12px 16px; background: white; border-bottom: 1px solid #E8E0D4; display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
        .avatar { width: 40px; height: 40px; background: #F0E4DA; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond', serif; font-size: 18px; color: #C4714A; font-weight: 600; flex-shrink: 0; }
        .prop-name { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 600; }
        .prop-status { font-size: 11px; color: #2D4A3E; display: flex; align-items: center; gap: 4px; }
        .dot { width: 6px; height: 6px; background: #2D4A3E; border-radius: 50%; }
        .lang-bar { display: flex; gap: 4px; padding: 8px 16px; background: #FAF7F3; border-bottom: 1px solid #E8E0D4; overflow-x: auto; flex-shrink: 0; }
        .lang-btn { padding: 3px 10px; border-radius: 999px; border: 1px solid #E8E0D4; background: white; font-size: 11px; color: #8C8478; cursor: pointer; white-space: nowrap; transition: all 0.15s; font-family: 'Inter', sans-serif; }
        .lang-btn.active { background: #C4714A; border-color: #C4714A; color: white; }
        .messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; scroll-behavior: smooth; }
        .msg { display: flex; gap: 8px; max-width: 85%; animation: in 0.2s ease-out; }
        @keyframes in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; } }
        .msg.guest { align-self: flex-end; flex-direction: row-reverse; }
        .msg-av { width: 28px; height: 28px; border-radius: 8px; background: #F0E4DA; color: #C4714A; font-family: 'Cormorant Garamond', serif; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; align-self: flex-end; }
        .msg.guest .msg-av { background: #D6E8E0; color: #2D4A3E; }
        .bubble { padding: 10px 13px; border-radius: 14px; font-size: 13px; line-height: 1.55; white-space: pre-wrap; }
        .msg.host .bubble { background: white; border: 1px solid #E8E0D4; border-bottom-left-radius: 4px; }
        .msg.guest .bubble { background: #2D4A3E; color: white; border-bottom-right-radius: 4px; }
        .msg-time { font-size: 10px; color: #8C8478; margin-top: 3px; padding: 0 4px; }
        .msg.guest .msg-time { text-align: right; }
        .typing { display: flex; gap: 8px; align-items: flex-end; max-width: 85%; }
        .t-bubble { background: white; border: 1px solid #E8E0D4; border-radius: 14px; border-bottom-left-radius: 4px; padding: 12px 16px; display: flex; gap: 4px; align-items: center; }
        .t-dot { width: 6px; height: 6px; background: #8C8478; border-radius: 50%; animation: bounce 1.2s ease-in-out infinite; }
        .t-dot:nth-child(2) { animation-delay: 0.15s; }
        .t-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes bounce { 0%,60%,100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-4px); opacity: 1; } }
        .quick-area { padding: 8px 16px; display: flex; gap: 6px; overflow-x: auto; flex-shrink: 0; border-top: 1px solid #E8E0D4; background: #FAF7F3; }
        .q-btn { white-space: nowrap; padding: 6px 12px; border: 1px solid #E8E0D4; background: white; border-radius: 999px; font-size: 12px; color: #1E1A16; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
        .q-btn:hover { border-color: #C4714A; color: #C4714A; }
        .error { font-size: 12px; color: #b54a2a; background: #fdeee8; border-radius: 8px; padding: 8px 12px; margin: 0 16px; flex-shrink: 0; }
        .input-row { padding: 12px 16px; background: white; border-top: 1px solid #E8E0D4; display: flex; gap: 8px; align-items: flex-end; flex-shrink: 0; }
        textarea.ci { flex: 1; background: #FAF7F3; border: 1px solid #E8E0D4; border-radius: 20px; padding: 9px 14px; font-family: 'Inter', sans-serif; font-size: 13px; color: #1E1A16; outline: none; resize: none; line-height: 1.4; max-height: 100px; overflow-y: auto; transition: border-color 0.15s; }
        textarea.ci:focus { border-color: #C4714A; }
        .send { width: 36px; height: 36px; background: #C4714A; border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.15s; }
        .send:hover { background: #b5633f; }
        .send svg { width: 16px; height: 16px; fill: white; }
      `}</style>

      <div id="app">
        <div className="header">
          <div className="avatar">{avatar}</div>
          <div style={{ flex: 1 }}>
            <div className="prop-name">{property.name}</div>
            <div className="prop-status"><div className="dot"/> Guest assistant · always available</div>
          </div>
        </div>

        <div className="lang-bar">
          {property.languages.map(l => (
            <button key={l} className={`lang-btn ${l === lang ? 'active' : ''}`} onClick={() => switchLang(l)}>
              {FLAGS[l]} {l.slice(0,2).toUpperCase()}
            </button>
          ))}
        </div>

        <div className="messages">
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              <div className="msg-av">{m.role === 'guest' ? 'G' : avatar}</div>
              <div>
                <div className="bubble">{m.content}</div>
                <div className="msg-time">{m.time}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="typing">
              <div className="msg-av">{avatar}</div>
              <div className="t-bubble">
                <div className="t-dot"/><div className="t-dot"/><div className="t-dot"/>
              </div>
            </div>
          )}
          <div ref={messagesEndRef}/>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="quick-area">
          {questions.map((q, i) => (
            <button key={i} className="q-btn" onClick={() => send(q)}>{q}</button>
          ))}
        </div>

        <div className="input-row">
          <textarea
            ref={inputRef}
            className="ci"
            value={input}
            rows={1}
            placeholder="Ask anything about your stay…"
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            style={{ height: 'auto' }}
          />
          <button className="send" onClick={() => send()}>
            <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
    </>
  )
}
