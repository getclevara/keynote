# Keynote Demo — 4 AI Agents. 1 Business Idea. 90 Seconds.

**Hawaii Island AI Summit 2026 | Live Stage Demo by Binil Chacko**

A live multi-agent AI demo for your keynote. Type any business idea, hit BUILD IT, and watch 4 specialized AI agents (Market Intel, Financials, Brand Identity, 30-Day Launch) stream real-time analysis simultaneously.

---

## Quick Deploy to Vercel (Recommended)

### Step 1: Push to GitHub

```bash
# Create a new repo on GitHub called "keynote-demo"
# Then:
cd keynote-demo
git init
git add .
git commit -m "keynote demo"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/keynote-demo.git
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and click **Add New → Project**
2. Import your `keynote-demo` repo from GitHub
3. Vercel will auto-detect Next.js — just click **Deploy**
4. After deploy, go to **Settings → Environment Variables**
5. Add: `ANTHROPIC_API_KEY` = your Anthropic API key (starts with `sk-ant-`)
6. **Redeploy** after adding the env variable (Settings → Deployments → Redeploy)

Your demo is now live at `https://keynote-demo.vercel.app` (or whatever Vercel assigns).

### Step 3: Custom Domain (Optional)

If you want a clean URL like `demo.binilchacko.com`:
1. In Vercel, go to **Settings → Domains**
2. Add your custom domain
3. Update DNS as instructed

---

## Run Locally

```bash
# Install dependencies
npm install

# Create your .env.local file
cp .env.local.example .env.local
# Edit .env.local and add your real API key

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Stage Setup Notes

### Apple TV / AirPlay
- AirPlay from MacBook to Apple TV → HDMI to projector works great
- Both devices must be on same Wi-Fi network
- AirPlay adds ~0.5s display lag — fine for streaming text
- **Test this the day before at Arc of Hilo**

### Backup Plan
- Bring a direct USB-C → HDMI cable as fallback
- Record 2-3 screen captures of the demo working with different ideas
- If anything fails: play the recording and keep moving

### Network
- Test Arc of Hilo Wi-Fi speed (need ~5 Mbps minimum)
- Bring phone hotspot as backup
- The API calls are small — even slow connections will work

### Display
- Dark background optimized for projectors
- Text sized for visibility from 50+ feet
- Works on any screen size — responsive grid

---

## Architecture

```
Browser (page.js)
    ↓ POST /api/agent { agent: "market", idea: "poke bowls" }
    ↓
API Route (route.js) — Edge Runtime
    ↓ Adds API key server-side
    ↓ Streams from Anthropic
    ↓
Browser receives SSE stream → live text updates in panels
```

- **API key stays on the server** — never exposed to the browser
- **Edge Runtime** — fastest possible response times on Vercel
- **Real streaming** — text appears character by character as Claude generates it
- **4 parallel requests** — all agents fire simultaneously with 300ms stagger

---

## Cost

Each demo run makes 4 API calls to Claude Sonnet. At ~400 tokens per response:
- **~$0.01 per demo run**
- Run it 100 times practicing = ~$1
- The entire keynote event = pennies

---

## Customization

### Change the AI model
In `app/api/agent/route.js`, swap `claude-sonnet-4-5-20250929` for any model.

### Adjust response length
Change `max_tokens: 400` in the API route.

### Edit agent prompts
All system prompts are in the `AGENTS` object in `app/api/agent/route.js`.

### Change colors/fonts
Edit `app/globals.css` and the style objects in `app/page.js`.
