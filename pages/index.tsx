// pages/index.tsx  — Host setup page
import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { generateSlug, type Property } from '../lib/properties'

const LANGUAGES = [
  { code: 'English', flag: '🇬🇧', label: 'English' },
  { code: 'Italian', flag: '🇮🇹', label: 'Italiano' },
  { code: 'Spanish', flag: '🇪🇸', label: 'Español' },
  { code: 'French', flag: '🇫🇷', label: 'Français' },
  { code: 'German', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'Portuguese', flag: '🇵🇹', label: 'Português' },
]

export default function SetupPage() {
  const router = useRouter()
  const [langs, setLangs] = useState<string[]>(['English'])
  const [saving, setSaving] = useState(false)

  function toggleLang(code: string) {
    setLangs(prev =>
      prev.includes(code) ? prev.filter(l => l !== code) : [...prev, code]
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const form = e.currentTarget
    const data = new FormData(form)

    const property: Property = {
      id: crypto.randomUUID(),
      name: data.get('name') as string || 'My Property',
      type: data.get('type') as string,
      location: data.get('location') as string,
      rules: data.get('rules') as string,
      local: data.get('local') as string,
      host: data.get('host') as string,
      extra: data.get('extra') as string,
      languages: langs,
      slug: generateSlug(data.get('name') as string || 'property'),
      createdAt: new Date().toISOString(),
    }

    // Save to localStorage (swap for API call to DB in production)
    const existing = JSON.parse(localStorage.getItem('ospite_properties') || '[]')
    existing.push(property)
    localStorage.setItem('ospite_properties', JSON.stringify(existing))

    router.push(`/chat/${property.slug}?pid=${property.id}`)
  }

  return (
    <>
      <Head>
        <title>Ospite AI — Set up your guest assistant</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #FAF7F3; color: #1E1A16; }
        .wrap { max-width: 560px; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }
        .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 2.5rem; }
        .mark { width: 38px; height: 38px; background: #C4714A; border-radius: 9px; display: flex; align-items: center; justify-content: center; }
        .mark svg { width: 20px; height: 20px; fill: white; }
        .brand-name { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #1E1A16; }
        h1 { font-family: 'Cormorant Garamond', serif; font-size: 34px; font-weight: 500; line-height: 1.2; margin-bottom: 0.5rem; }
        .sub { font-size: 13px; color: #8C8478; line-height: 1.6; margin-bottom: 2rem; }
        .field { margin-bottom: 1.25rem; }
        label { display: block; font-size: 11px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: #8C8478; margin-bottom: 6px; }
        input, textarea, select { width: 100%; background: white; border: 1px solid #E8E0D4; border-radius: 8px; padding: 10px 12px; font-family: 'Inter', sans-serif; font-size: 13px; color: #1E1A16; outline: none; transition: border-color 0.15s; appearance: none; }
        input:focus, textarea:focus, select:focus { border-color: #C4714A; }
        textarea { min-height: 80px; resize: vertical; line-height: 1.5; }
        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
        .chip { padding: 5px 14px; border-radius: 999px; border: 1px solid #E8E0D4; background: white; font-size: 12px; color: #8C8478; cursor: pointer; transition: all 0.15s; user-select: none; }
        .chip.on { background: #C4714A; border-color: #C4714A; color: white; }
        .divider { display: flex; align-items: center; gap: 10px; margin: 1.5rem 0 1rem; }
        .divider span { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; color: #8C8478; white-space: nowrap; }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #E8E0D4; }
        .btn { width: 100%; padding: 14px; background: #C4714A; color: white; border: none; border-radius: 10px; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; margin-top: 1rem; transition: background 0.15s; }
        .btn:hover { background: #b5633f; }
        .btn:disabled { background: #d4a48a; cursor: not-allowed; }
      `}</style>
      <div className="wrap">
        <div className="brand">
          <div className="mark">
            <svg viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7L12 2zm0 2.18L19 8v8l-7 3.88L5 16V8l7-3.82z"/></svg>
          </div>
          <span className="brand-name">Ospite AI</span>
        </div>

        <h1>Set up your guest assistant</h1>
        <p className="sub">Fill in your property details. Your AI assistant will answer guest questions 24/7 — in their language.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Property name *</label>
            <input name="name" required placeholder="e.g. Villa Rosaria, Posada del Sol" />
          </div>

          <div className="row">
            <div className="field">
              <label>Property type</label>
              <select name="type">
                <option>Apartment</option>
                <option>Villa</option>
                <option>Boutique hotel</option>
                <option>B&B</option>
                <option>Agriturismo</option>
                <option>Hostel</option>
                <option>Casa rural</option>
              </select>
            </div>
            <div className="field">
              <label>Location *</label>
              <input name="location" required placeholder="e.g. Florence, Seville" />
            </div>
          </div>

          <div className="field">
            <label>House rules & key info</label>
            <textarea name="rules" placeholder="Check-in: 3pm · Check-out: 11am · WiFi: YourNetwork / password · Parking: street outside · No smoking..." />
          </div>

          <div className="field">
            <label>Local recommendations</label>
            <textarea name="local" placeholder="Best restaurants, bars, markets, pharmacies, transport to airport, things to do nearby..." />
          </div>

          <div className="field">
            <label>Host name & contact</label>
            <input name="host" placeholder="e.g. Maria — WhatsApp +39 333 1234567" />
          </div>

          <div className="field">
            <label>Guest languages to support</label>
            <div className="chips">
              {LANGUAGES.map(l => (
                <span
                  key={l.code}
                  className={`chip ${langs.includes(l.code) ? 'on' : ''}`}
                  onClick={() => toggleLang(l.code)}
                >
                  {l.flag} {l.label}
                </span>
              ))}
            </div>
          </div>

          <div className="divider"><span>optional</span></div>

          <div className="field">
            <label>Anything else the AI should know?</label>
            <textarea name="extra" placeholder="The hot water takes 30s to warm up · Farmer's market every Saturday · Rooftop access via the spiral staircase..." />
          </div>

          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Setting up...' : 'Launch guest assistant →'}
          </button>
        </form>
      </div>
    </>
  )
}
