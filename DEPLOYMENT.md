# Ospite AI — Deployment Guide

## 1. Deploy to Vercel (15 minutes)

The fastest way to get this live.

### Step 1 — Push to GitHub
```bash
cd ospite-ai
git init
git add .
git commit -m "Initial Ospite AI setup"
# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/ospite-ai.git
git push -u origin main
```

### Step 2 — Deploy on Vercel
1. Go to vercel.com → New Project
2. Import your GitHub repo
3. Add environment variables (Settings → Environment Variables):
   - `ANTHROPIC_API_KEY` = your key from console.anthropic.com
4. Click Deploy

Your app is live at `https://ospite-ai-XXXX.vercel.app`

### Step 3 — Custom domain (optional but recommended)
- Buy `ospite.ai` or `yourbrandname.app` (~$12/year)
- Add it in Vercel → Settings → Domains
- Each property gets: `yourdomain.com/chat/villa-rosaria`

---

## 2. WhatsApp Integration via Twilio

This lets guests message your AI assistant on WhatsApp — no app, no website, just WhatsApp.

### How it works
```
Guest sends WhatsApp message
         ↓
Twilio receives it, forwards to your webhook
         ↓
/api/whatsapp on your Vercel app
         ↓
Claude AI generates a reply
         ↓
Twilio sends reply back to guest on WhatsApp
```

### Step-by-step setup

#### A. Create a Twilio account
1. Go to twilio.com → Sign up (free trial gives $15 credit)
2. From the Console Dashboard, note your:
   - Account SID
   - Auth Token

#### B. Enable WhatsApp Sandbox (free, for testing)
1. In Twilio Console → Messaging → Try it out → Send a WhatsApp message
2. Follow the instructions to join the sandbox (guests send a code to a Twilio number)
3. Set the "When a message comes in" webhook to:
   ```
   https://your-app.vercel.app/api/whatsapp
   ```
   Method: HTTP POST

#### C. Get a real WhatsApp Business number (for production)
1. Twilio Console → Phone Numbers → Buy a Number
2. Choose a number with WhatsApp capability
3. Apply for WhatsApp Business API approval (~1-2 weeks)
4. Cost: ~$1/month for the number + $0.005 per message sent

#### D. Add environment variables to Vercel
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

#### E. Map properties to WhatsApp numbers
In `pages/api/whatsapp.ts`, update `getPropertyForNumber()` to look up your DB:

```typescript
// Production version — look up property from your database
async function getPropertyForNumber(toNumber: string) {
  // Option A: Simple mapping in code
  const mapping: Record<string, string> = {
    'whatsapp:+39123456789': 'property-id-for-villa-rosaria',
    'whatsapp:+34987654321': 'property-id-for-posada-sol',
  }
  
  // Option B: Look up from Supabase
  const { data } = await supabase
    .from('properties')
    .select('*')
    .eq('whatsapp_number', toNumber)
    .single()
  
  return data
}
```

---

## 3. Database upgrade (when you have 5+ properties)

Replace localStorage with Supabase (free tier handles this easily).

### Supabase setup
```bash
npm install @supabase/supabase-js
```

Create a `properties` table in Supabase:
```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,
  location TEXT,
  rules TEXT,
  local_info TEXT,
  host_contact TEXT,
  extra TEXT,
  languages TEXT[],
  slug TEXT UNIQUE,
  whatsapp_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Add to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## 4. Per-property QR codes

For each property, generate a printable QR:

```
https://your-app.vercel.app/api/qr?url=https://your-app.vercel.app/chat/villa-rosaria&size=400
```

Save this image and put it in the welcome-card.html template.

For print quality, use 600px+ size:
```
/api/qr?url=YOUR_URL&size=600
```

---

## 5. Pricing model (when charging)

### Suggested tiers

| Plan | Price | Properties | WhatsApp | Languages |
|------|-------|-----------|---------|-----------|
| Starter | €49/mo | 1 | No | 3 |
| Host | €99/mo | 5 | Yes | 6 |
| Agency | €249/mo | Unlimited | Yes | 6 + custom |

### Your costs per property (Anthropic API)
- Average guest conversation: ~10 messages
- Cost per message (Claude Sonnet): ~$0.003
- Cost per guest stay (10 conversations): ~$0.03
- Monthly API cost for busy property (100 guests): ~$3

Margin at €49/month starter: ~€46 profit per property.

---

## 6. Quick launch checklist

- [ ] Anthropic API key obtained (console.anthropic.com)
- [ ] Code pushed to GitHub
- [ ] Deployed on Vercel
- [ ] Environment variables set
- [ ] Test property created and chat working
- [ ] Welcome card printed and tested
- [ ] QR code scanned and verified
- [ ] WhatsApp sandbox tested (optional)
- [ ] First pilot property onboarded
