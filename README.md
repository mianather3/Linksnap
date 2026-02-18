# LinkSnap 🔗

A self-hosted link shortener with a real-time analytics dashboard. Create short links, track every click, and visualize traffic with a **Top Referrers heatmap** and **Unique vs Total Clicks** breakdown.

![Dashboard Preview](https://(https://linksnap-production-cead.up.railway.app/))

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
