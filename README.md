# LinkSnap 🔗

A self-hosted link shortener with a real-time analytics dashboard. Create short links, track every click, and visualize traffic with a **Top Referrers heatmap** and **Unique vs Total Clicks** breakdown.

![Dashboard Preview](https://via.placeholder.com/900x500/0a0a0c/e8ff5a?text=LinkSnap+Dashboard)

---

## Features

- **Link shortening** — custom codes supported
- **Click tracking** — every redirect is logged (IP-hash for privacy, referrer, user-agent)
- **Analytics dashboard**
  - Unique vs Total clicks (donut chart)
  - Clicks over time — last 30 days (bar chart)
  - Top Referrers heatmap — heat-ranked by traffic volume
- **Privacy-first** — raw IPs are never stored; only a salted SHA-256 hash
- **Zero dependencies on cloud APIs** — fully self-contained

---

## Tech Stack

| Layer     | Tech                        |
|-----------|-----------------------------|
| Backend   | Node.js + Express           |
| Database  | SQLite (via `better-sqlite3`) |
| Frontend  | Vanilla HTML/CSS/JS         |
| Charts    | Chart.js                    |

---

## Local Development

### Prerequisites
- Node.js 18+

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/linksnap.git
cd linksnap

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
# Edit .env — set BASE_URL=http://localhost:3000 and choose an IP_SALT

# 4. Start the dev server (auto-restarts on changes)
npm run dev
```

Visit `http://localhost:3000` — the dashboard is ready.

---

## Deployment

### Deploy to Render (free tier)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Configure:
   | Field         | Value              |
   |---------------|--------------------|
   | Build Command | `npm install`      |
   | Start Command | `npm start`        |
   | Environment   | `Node`             |
5. Add environment variables:
   - `BASE_URL` → your Render URL (e.g. `https://linksnap.onrender.com`)
   - `IP_SALT` → any long random string
   - `PORT` → leave blank (Render sets this automatically)
6. Click **Deploy**

> ⚠️ **Render free tier note:** The disk is ephemeral on the free plan — your SQLite database will reset on each deploy. Upgrade to a paid plan and set `DB_DIR` to a persistent disk path, or swap `better-sqlite3` for a hosted Postgres (via `pg` + `node-postgres`).

---

### Deploy to Railway

```bash
# Install the Railway CLI
npm install -g @railway/cli

# Login and init
railway login
railway init

# Add environment variables
railway variables set BASE_URL=https://your-app.up.railway.app
railway variables set IP_SALT=your_secret_salt

# Deploy
railway up
```

Railway automatically detects the `npm start` command and provisions a persistent volume for your database.

---

## Project Structure

```
linksnap/
├── public/
│   ├── index.html     # Dashboard UI (single-page app)
│   └── 404.html       # Custom 404 for missing short codes
├── src/
│   ├── server.js      # Express app — all routes
│   └── db.js          # SQLite setup and schema
├── data/              # Auto-created — holds linksnap.db (gitignored)
├── .env.example       # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

---

## API Reference

| Method | Route                          | Description                          |
|--------|--------------------------------|--------------------------------------|
| POST   | `/api/links`                   | Create a shortened link              |
| GET    | `/api/links`                   | List all links with summary stats    |
| GET    | `/api/links/:code/analytics`   | Full analytics for one link          |
| DELETE | `/api/links/:code`             | Delete a link and all click data     |
| GET    | `/:code`                       | Redirect + track click               |

### POST `/api/links`

**Body:**
```json
{
  "url": "https://example.com/very/long/url",
  "title": "Optional display name",
  "custom_code": "my-link"
}
```

**Response `201`:**
```json
{
  "id": 1,
  "short_code": "my-link",
  "original_url": "https://example.com/very/long/url",
  "short_url": "https://your-domain.com/my-link"
}
```

---

## Analytics Design

### Unique vs Total Clicks
Uniqueness is determined per IP hash. The same hashed IP clicking a link multiple times counts as 1 unique visit, regardless of session. This gives a rough approximation of reach vs engagement.

### Top Referrers Heatmap
The referrer header is parsed to extract the hostname (e.g. `t.co`, `google.com`, `Direct`). Rows are ranked by total click volume and color-coded on a green→red heat scale to make traffic sources immediately scannable.

### Privacy
Raw IP addresses are **never stored**. Before writing to the database, each IP is hashed using SHA-256 with a secret salt (`IP_SALT`). This allows deduplication for unique-visitor counting while making it computationally infeasible to recover the original IP.

---

## License

MIT
