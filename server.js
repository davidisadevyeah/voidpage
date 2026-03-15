const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const DB_FILE = path.join(__dirname, 'db.json');
const PUBLIC = path.join(__dirname, 'voidpage.html');

// ── Load / Save DB ──
function loadDB() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { return { users: {}, badges: [] }; }
}
function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ── Init DB with owner account if empty ──
(function initDB() {
  const db = loadDB();
  if (!db.users['davidescu']) {
    db.users['davidescu'] = {
      username: 'davidescu',
      displayName: 'Davidescu',
      password: 'sarvatSarvat1000',
      role: 'owner',
      avatar: null,
      banner: null,
      bio: 'Platform owner & lead dev ⚡ Building voidpage.elementfx.com',
      handle: '@davidescu',
      accentColor: '#f0a752',
      bgColor: '#07070f',
      avatarRadius: '50%',
      effect: 'particles',
      sparkle: true,
      viewCount: 0,
      badges: ['owner', 'verified'],
      socials: { twitter:'', instagram:'', github:'', youtube:'', twitch:'', discord:'', spotify:'' },
      links: [{ icon:'🌐', title:'voidpage.elementfx.com', url:'https://voidpage.elementfx.com', color:'#f0a752' }],
      discord: { show: false, name:'', activity:'' },
    };
  }
  if (!db.badges || db.badges.length === 0) {
    db.badges = [
      { key:'owner',    label:'👑 Owner',    color:'#f0a752', bg:'rgba(240,167,82,0.12)' },
      { key:'verified', label:'✓ Verified', color:'#60a5fa', bg:'rgba(96,165,250,0.1)' },
      { key:'premium',  label:'★ Premium',  color:'#fbbf24', bg:'rgba(251,191,36,0.1)' },
      { key:'og',       label:'⚡ OG',       color:'#f87171', bg:'rgba(248,113,113,0.1)' },
      { key:'booster',  label:'💎 Booster', color:'#c084fc', bg:'rgba(192,132,252,0.1)' },
      { key:'staff',    label:'🛡 Staff',   color:'#34d399', bg:'rgba(52,211,153,0.1)' },
    ];
  }
  saveDB(db);
  console.log('✅ DB initialized');
})();

// ── MIME types ──
const MIME = {
  '.html': 'text/html',
  '.json': 'application/json',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
};

// ── Generate public profile HTML ──
function renderProfile(user, badges) {
  const myBadges = badges.filter(b => user.badges.includes(b.key));
  const SOCIALS = [
    { key:'twitter', icon:'𝕏' }, { key:'instagram', icon:'📸' },
    { key:'github', icon:'💻' }, { key:'youtube', icon:'▶' },
    { key:'twitch', icon:'🎮' }, { key:'discord', icon:'💬' },
    { key:'spotify', icon:'🎵' },
  ];
  const activeSocials = SOCIALS.filter(s => user.socials && user.socials[s.key]);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(user.displayName)} | voidpage.elementfx.com</title>
<meta property="og:title" content="${esc(user.displayName)}">
<meta property="og:description" content="${esc(user.bio)}">
<meta name="theme-color" content="${user.accentColor || '#7c6ffa'}">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --accent:${user.accentColor||'#7c6ffa'};
  --bg:${user.bgColor||'#07070f'};
  --s1:rgba(255,255,255,0.04);
  --s2:rgba(255,255,255,0.07);
  --border:rgba(255,255,255,0.07);
  --text:#e8e8f8;
  --muted:rgba(232,232,248,0.4);
  --accent3:#2fcea4;
  --font:'Outfit',sans-serif;
  --mono:'JetBrains Mono',monospace;
}
html,body{min-height:100%;background:var(--bg);color:var(--text);font-family:var(--font);display:flex;justify-content:center}
#card{width:100%;max-width:600px;padding-bottom:60px}
.banner{width:100%;height:150px;overflow:hidden;position:relative}
.banner img{width:100%;height:100%;object-fit:cover}
.banner-def{width:100%;height:100%;background:linear-gradient(135deg,#100d2e,#2a1f6e,#1e1040);position:relative}
.banner-def::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 30% 60%,rgba(124,111,250,0.2),transparent 60%),radial-gradient(ellipse at 75% 40%,rgba(240,107,160,0.12),transparent 55%)}
.head{display:flex;align-items:flex-end;gap:14px;padding:0 22px;margin-top:-32px;position:relative;z-index:2}
.av{width:76px;height:76px;border-radius:${user.avatarRadius||'50%'};border:3px solid var(--bg);overflow:hidden;flex-shrink:0;background:linear-gradient(135deg,var(--accent),#f06ba0);display:flex;align-items:center;justify-content:center;font-size:30px;box-shadow:0 4px 20px rgba(0,0,0,0.5)}
.av img{width:100%;height:100%;object-fit:cover;border-radius:${user.avatarRadius||'50%'}}
.info{padding-bottom:4px;flex:1;min-width:0}
.name{font-size:21px;font-weight:800;letter-spacing:-0.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.handle{font-family:var(--mono);font-size:11px;color:var(--muted);margin-top:2px}
.views{font-family:var(--mono);font-size:10px;color:var(--muted);margin-top:4px;display:flex;align-items:center;gap:5px}
.views::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--accent3);display:inline-block;animation:vp 2s infinite}
@keyframes vp{0%,100%{opacity:1}50%{opacity:0.3}}
.badges{display:flex;flex-wrap:wrap;gap:5px;padding:10px 22px 0}
.badge{padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;display:flex;align-items:center;gap:4px;border:1px solid}
.bio{padding:12px 22px 4px;font-size:14px;color:rgba(232,232,248,0.78);line-height:1.6;max-width:460px}
.socials{display:flex;flex-wrap:wrap;gap:7px;padding:10px 22px}
.soc{width:34px;height:34px;border-radius:9px;background:var(--s2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:15px;text-decoration:none;transition:transform 0.15s}
.soc:hover{transform:translateY(-3px)}
.divider{margin:4px 22px 10px;height:1px;background:var(--border)}
.links{padding:0 22px;display:flex;flex-direction:column;gap:8px}
.link{display:flex;align-items:center;gap:12px;padding:13px 15px;border-radius:14px;text-decoration:none;color:var(--text);background:var(--s1);border:1px solid var(--border);transition:transform 0.15s,box-shadow 0.15s;position:relative;overflow:hidden}
.link::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--lc,var(--accent));border-radius:3px 0 0 3px}
.link:hover{transform:translateX(4px);box-shadow:0 4px 20px rgba(0,0,0,0.3)}
.link-ico{font-size:19px;width:28px;text-align:center;flex-shrink:0}
.link-bd{flex:1;min-width:0}
.link-t{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.link-u{font-family:var(--mono);font-size:10px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px}
.link-arr{color:var(--muted);font-size:13px;flex-shrink:0}
.discord{margin:12px 22px 0;background:var(--s1);border:1px solid var(--border);border-radius:14px;padding:12px 15px;display:flex;align-items:center;gap:12px}
.dc-av{width:38px;height:38px;border-radius:50%;background:#5865f2;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;position:relative}
.dc-dot{width:11px;height:11px;border-radius:50%;position:absolute;bottom:0;right:0;border:2px solid var(--bg);background:var(--accent3)}
.dc-info{flex:1;min-width:0}
.dc-name{font-size:13px;font-weight:600}
.dc-act{font-size:11px;color:var(--accent);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dc-via{font-size:10px;color:var(--muted)}
.foot{text-align:center;padding:28px 0 0}
.foot a{font-family:var(--mono);font-size:10px;color:rgba(232,232,248,0.18);text-decoration:none;letter-spacing:1px;text-transform:uppercase;transition:color 0.15s}
.foot a:hover{color:var(--accent)}
@keyframes sUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.a1{animation:sUp 0.45s ease 0.05s both}
.a2{animation:sUp 0.45s ease 0.12s both}
.a3{animation:sUp 0.45s ease 0.19s both}
.a4{animation:sUp 0.45s ease 0.26s both}
.a5{animation:sUp 0.45s ease 0.33s both}
.a6{animation:sUp 0.45s ease 0.4s both}
</style>
</head>
<body>
<div id="card">
  <div class="banner a1">
    ${user.banner ? `<img src="${user.banner}">` : `<div class="banner-def"></div>`}
  </div>
  <div class="head a2">
    <div class="av">
      ${user.avatar ? `<img src="${user.avatar}">` : `<span>🌙</span>`}
    </div>
    <div class="info">
      <div class="name">${esc(user.displayName)}</div>
      <div class="handle">${esc(user.handle)}</div>
      <div class="views">${Number(user.viewCount||0).toLocaleString()} profile views</div>
    </div>
  </div>
  ${myBadges.length ? `<div class="badges a2">${myBadges.map(b=>`<span class="badge" style="color:${b.color};background:${b.bg};border-color:${b.color}50">${b.label}</span>`).join('')}</div>` : ''}
  <div class="bio a3">${esc(user.bio)}</div>
  ${activeSocials.length ? `<div class="socials a3">${activeSocials.map(s=>`<span class="soc">${s.icon}</span>`).join('')}</div>` : ''}
  <div class="divider a4"></div>
  <div class="links a4">
    ${(user.links||[]).map(l=>`
      <a class="link" href="${esc(l.url)}" target="_blank" rel="noopener" style="--lc:${l.color}">
        <span class="link-ico">${l.icon}</span>
        <div class="link-bd">
          <div class="link-t">${esc(l.title)}</div>
          <div class="link-u">${esc(l.url)}</div>
        </div>
        <span class="link-arr">→</span>
      </a>
    `).join('')}
  </div>
  ${user.discord && user.discord.show ? `
  <div class="discord a5">
    <div class="dc-av">💬<div class="dc-dot"></div></div>
    <div class="dc-info">
      <div class="dc-name">${esc(user.discord.name)}</div>
      <div class="dc-act">${esc(user.discord.activity)}</div>
      <div class="dc-via">via Discord</div>
    </div>
  </div>` : ''}
  <div class="foot a6"><a href="https://voidpage.elementfx.com">voidpage.elementfx.com</a></div>
</div>
</body>
</html>`;
}

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

// ── HTTP Server ──
const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // ── API ROUTES ──

  // POST /api/register
  if (pathname === '/api/register' && method === 'POST') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      const { username, displayName, password } = JSON.parse(body);
      const db = loadDB();
      if (!username || username.length < 3) return json(res, 400, { error: 'Username too short' });
      if (!/^[a-z0-9_]+$/i.test(username)) return json(res, 400, { error: 'Invalid username characters' });
      if (db.users[username.toLowerCase()]) return json(res, 400, { error: 'Username taken' });
      if (!password || password.length < 6) return json(res, 400, { error: 'Password too short' });
      const u = username.toLowerCase();
      db.users[u] = {
        username: u, displayName: displayName||u, password, role: 'user',
        avatar: null, banner: null,
        bio: 'Hello, world! 👋', handle: '@'+u,
        accentColor: '#7c6ffa', bgColor: '#07070f', avatarRadius: '50%',
        effect: 'none', sparkle: true, viewCount: 0, badges: [],
        socials: { twitter:'', instagram:'', github:'', youtube:'', twitch:'', discord:'', spotify:'' },
        links: [], discord: { show: false, name:'', activity:'' },
      };
      saveDB(db);
      const safe = { ...db.users[u] }; delete safe.password;
      json(res, 200, { ok: true, user: safe });
    });
    return;
  }

  // POST /api/login
  if (pathname === '/api/login' && method === 'POST') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      const { username, password } = JSON.parse(body);
      const db = loadDB();
      const u = db.users[username?.toLowerCase()];
      if (!u || u.password !== password) return json(res, 401, { error: 'Invalid credentials' });
      const safe = { ...u }; delete safe.password;
      json(res, 200, { ok: true, user: safe });
    });
    return;
  }

  // PUT /api/user/:username — save profile
  if (pathname.startsWith('/api/user/') && method === 'PUT') {
    const uname = pathname.split('/')[3];
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      const data = JSON.parse(body);
      const db = loadDB();
      if (!db.users[uname]) return json(res, 404, { error: 'User not found' });
      // Don't allow overwriting role/password via this endpoint
      const safe = { ...db.users[uname], ...data, role: db.users[uname].role, password: db.users[uname].password, username: uname };
      db.users[uname] = safe;
      saveDB(db);
      const out = { ...safe }; delete out.password;
      json(res, 200, { ok: true, user: out });
    });
    return;
  }

  // GET /api/users — owner only (no auth check here, frontend handles it)
  if (pathname === '/api/users' && method === 'GET') {
    const db = loadDB();
    const users = Object.values(db.users).map(u => { const s={...u}; delete s.password; return s; });
    json(res, 200, { users });
    return;
  }

  // GET /api/badges
  if (pathname === '/api/badges' && method === 'GET') {
    const db = loadDB();
    json(res, 200, { badges: db.badges });
    return;
  }

  // POST /api/badges — create badge (owner)
  if (pathname === '/api/badges' && method === 'POST') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      const badge = JSON.parse(body);
      const db = loadDB();
      if (db.badges.find(b => b.key === badge.key)) return json(res, 400, { error: 'Badge key exists' });
      db.badges.push(badge);
      saveDB(db);
      json(res, 200, { ok: true, badges: db.badges });
    });
    return;
  }

  // DELETE /api/badges/:key
  if (pathname.startsWith('/api/badges/') && method === 'DELETE') {
    const key = pathname.split('/')[3];
    const db = loadDB();
    db.badges = db.badges.filter(b => b.key !== key);
    Object.keys(db.users).forEach(u => { db.users[u].badges = db.users[u].badges.filter(b => b !== key); });
    saveDB(db);
    json(res, 200, { ok: true });
    return;
  }

  // POST /api/user/:username/badge — assign badge
  if (pathname.match(/^\/api\/user\/[^/]+\/badge$/) && method === 'POST') {
    const uname = pathname.split('/')[3];
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      const { badgeKey, action } = JSON.parse(body); // action: 'add' | 'remove'
      const db = loadDB();
      if (!db.users[uname]) return json(res, 404, { error: 'User not found' });
      if (action === 'add' && !db.users[uname].badges.includes(badgeKey)) db.users[uname].badges.push(badgeKey);
      if (action === 'remove') db.users[uname].badges = db.users[uname].badges.filter(b => b !== badgeKey);
      saveDB(db);
      json(res, 200, { ok: true, badges: db.users[uname].badges });
    });
    return;
  }

  // GET /@username or /username — render public profile
  const profileMatch = pathname.match(/^\/@?([a-z0-9_]+)$/i);
  if (profileMatch && method === 'GET') {
    const uname = profileMatch[1].toLowerCase();
    const db = loadDB();
    const user = db.users[uname];
    if (!user) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      return res.end(`<!DOCTYPE html><html><head><title>Not Found | voidpage.elementfx.com</title></head><body style="background:#07070f;color:#e8e8f8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:12px"><div style="font-size:48px">✦</div><div style="font-size:24px;font-weight:800">@${uname} not found</div><a href="/" style="color:#7c6ffa;font-size:13px">← Back to voidpage.elementfx.com</a></body></html>`);
    }
    // Increment view count
    user.viewCount = (user.viewCount || 0) + 1;
    db.users[uname] = user;
    saveDB(db);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(renderProfile(user, db.badges));
  }

  // GET / — serve voidpage.html
  if (pathname === '/' || pathname === '/index.html') {
    try {
      const html = fs.readFileSync(PUBLIC, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end(html);
    } catch {
      res.writeHead(500); return res.end('voidpage.html not found next to server.js');
    }
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   voidpage.elementfx.com  SERVER       ║
║   Running on http://localhost:${PORT}     ║
╠════════════════════════════════════════╣
║  GET  /                 → app          ║
║  GET  /@username        → profile      ║
║  POST /api/register     → sign up      ║
║  POST /api/login        → sign in      ║
║  PUT  /api/user/:name   → save profile ║
║  GET  /api/users        → all users    ║
║  GET  /api/badges       → all badges   ║
║  POST /api/badges       → new badge    ║
║  DEL  /api/badges/:key  → del badge    ║
║  POST /api/user/:n/badge→ assign badge ║
╚════════════════════════════════════════╝
  `);
});
