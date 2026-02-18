require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { nanoid } = require('nanoid');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ─── Helpers ───────────────────────────────────────────────────────────────

function hashIP(ip) {
  // One-way hash — never store raw IPs
  return crypto.createHash('sha256').update(ip + (process.env.IP_SALT || 'linksnap')).digest('hex').slice(0, 16);
}

function parseReferrer(raw) {
  if (!raw || raw === '') return 'Direct';
  try {
    const url = new URL(raw);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return 'Unknown';
  }
}

function getClientIP(req) {
  return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
}

// ─── API Routes ────────────────────────────────────────────────────────────

// POST /api/links — create a shortened link
app.post('/api/links', (req, res) => {
  const { url, title, custom_code } = req.body;

  if (!url) return res.status(400).json({ error: 'URL is required' });

  try { new URL(url); } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  const short_code = custom_code?.trim() || nanoid(6);

  // Check if custom code already taken
  if (custom_code) {
    const existing = db.prepare('SELECT id FROM links WHERE short_code = ?').get(short_code);
    if (existing) return res.status(409).json({ error: 'That custom code is already taken' });
  }

  try {
    const stmt = db.prepare('INSERT INTO links (short_code, original_url, title) VALUES (?, ?, ?)');
    const result = stmt.run(short_code, url, title || null);
    res.status(201).json({
      id: result.lastInsertRowid,
      short_code,
      original_url: url,
      short_url: `${BASE_URL}/${short_code}`,
    });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Short code collision, please try again' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/links — list all links with summary stats
app.get('/api/links', (req, res) => {
  const links = db.prepare(`
    SELECT
      l.id,
      l.short_code,
      l.original_url,
      l.title,
      l.created_at,
      COUNT(c.id)                                      AS total_clicks,
      COUNT(DISTINCT c.ip_hash)                        AS unique_clicks,
      MAX(c.clicked_at)                                AS last_clicked_at
    FROM links l
    LEFT JOIN clicks c ON c.link_id = l.id
    GROUP BY l.id
    ORDER BY l.created_at DESC
  `).all();

  const withUrls = links.map(l => ({
    ...l,
    short_url: `${BASE_URL}/${l.short_code}`,
  }));

  res.json(withUrls);
});

// GET /api/links/:code/analytics — detailed analytics for one link
app.get('/api/links/:code/analytics', (req, res) => {
  const link = db.prepare('SELECT * FROM links WHERE short_code = ?').get(req.params.code);
  if (!link) return res.status(404).json({ error: 'Link not found' });

  // Unique vs Total by day (last 30 days)
  const clicksOverTime = db.prepare(`
    SELECT
      date(clicked_at) AS day,
      COUNT(*)          AS total,
      COUNT(DISTINCT ip_hash) AS unique_visitors
    FROM clicks
    WHERE link_id = ?
      AND clicked_at >= datetime('now', '-30 days')
    GROUP BY day
    ORDER BY day ASC
  `).all(link.id);

  // Top referrers
  const topReferrers = db.prepare(`
    SELECT
      COALESCE(NULLIF(referrer, ''), 'Direct') AS source,
      COUNT(*)                                 AS total,
      COUNT(DISTINCT ip_hash)                  AS unique_visitors
    FROM clicks
    WHERE link_id = ?
    GROUP BY source
    ORDER BY total DESC
    LIMIT 15
  `).all(link.id);

  // Summary totals
  const summary = db.prepare(`
    SELECT
      COUNT(*)                AS total_clicks,
      COUNT(DISTINCT ip_hash) AS unique_clicks
    FROM clicks
    WHERE link_id = ?
  `).get(link.id);

  res.json({
    link: { ...link, short_url: `${BASE_URL}/${link.short_code}` },
    summary,
    clicks_over_time: clicksOverTime,
    top_referrers: topReferrers,
  });
});

// DELETE /api/links/:code — remove a link and all its clicks
app.delete('/api/links/:code', (req, res) => {
  const result = db.prepare('DELETE FROM links WHERE short_code = ?').run(req.params.code);
  if (result.changes === 0) return res.status(404).json({ error: 'Link not found' });
  res.json({ success: true });
});

// ─── Redirect Route ────────────────────────────────────────────────────────

app.get('/:code', (req, res) => {
  const { code } = req.params;
  if (code === 'favicon.ico') return res.status(204).end();

  const link = db.prepare('SELECT * FROM links WHERE short_code = ?').get(code);
  if (!link) return res.status(404).sendFile('404.html', { root: 'public' });

  // Record click asynchronously — don't block the redirect
  setImmediate(() => {
    try {
      db.prepare(`
        INSERT INTO clicks (link_id, ip_hash, referrer, user_agent)
        VALUES (?, ?, ?, ?)
      `).run(
        link.id,
        hashIP(getClientIP(req)),
        parseReferrer(req.headers['referer'] || ''),
        (req.headers['user-agent'] || '').slice(0, 200),
      );
    } catch (e) {
      console.error('Click tracking error:', e.message);
    }
  });

  res.redirect(301, link.original_url);
});

// ─── Start ─────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🔗 LinkSnap running at ${BASE_URL}`);
});
