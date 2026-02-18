# LinkSnap 🔗

A self-hosted link shortener with a real-time analytics dashboard.

**Live Demo → [linksnap-production-cead.up.railway.app](https://linksnap-production-cead.up.railway.app)**

---

## Features

- Shorten any URL with an optional custom code
- Track every click with a full analytics dashboard
- **Unique vs Total clicks** breakdown (donut chart)
- **Clicks over time** — last 30 days (bar chart)
- **Top Referrers heatmap** — see where your traffic comes from
- Privacy-first — IPs are never stored, only a one-way hash

---

## Tech Stack

- **Backend** — Node.js + Express
- **Database** — SQLite (via `better-sqlite3`)
- **Frontend** — Vanilla HTML/CSS/JS
- **Charts** — Chart.js
- **Hosted on** — Railway

---

## Run Locally

```bash
git clone https://github.com/YOUR_USERNAME/linksnap.git
cd linksnap
npm install
cp .env.example .env   # edit BASE_URL and IP_SALT
npm run dev
```

Visit `http://localhost:3000`

---

## License

MIT
