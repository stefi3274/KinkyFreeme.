/* ============================================================
   KINKY, FREE ME — Shared JavaScript (Supabase backend)
   Created by SteFi Services · stefiservices.com
   ============================================================ */

// ── Supabase client ──────────────────────────────────────
const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ── Helpers ──────────────────────────────────────────────
const KFM = {
  isSubscribed() { return localStorage.getItem('kfm_member') === 'true'; },
  setSubscribed(){ localStorage.setItem('kfm_member', 'true'); },
  ageVerified()  { return sessionStorage.getItem('kfm_age') === 'ok'; },
  setAge()       { sessionStorage.setItem('kfm_age', 'ok'); },

  tagLabel(tag) {
    return { 'self-discovery':'Self-Discovery', 'submission':'Submission', 'bdsm':'BDSM' }[tag] || tag;
  },
  formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  }
};

// ── Toast ────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Age gate ─────────────────────────────────────────────
function initAgeGate() {
  const gate = document.getElementById('age-gate');
  if (!gate) return;
  if (KFM.ageVerified()) { gate.style.display = 'none'; return; }
  gate.style.display = 'flex';
}
function ageConfirm() {
  KFM.setAge();
  const gate = document.getElementById('age-gate');
  if (gate) { gate.style.opacity='0'; gate.style.transition='opacity 0.4s'; setTimeout(()=>gate.style.display='none',400); }
}
function ageLeave() { window.location.href = 'https://www.google.com'; }

// ── Newsletter subscribe ─────────────────────────────────
async function subscribe(inputId, successId) {
  const el    = document.getElementById(inputId);
  const email = el ? el.value.trim() : '';
  if (!email || !email.includes('@')) { showToast('Please enter a valid email.'); return; }

  const { error } = await _sb.from('subscribers').insert({ email, source: 'site' });
  if (error) {
    if (error.code === '23505') { showToast("You're already in the circle ✦"); return; }
    showToast('Something went wrong. Try again.'); return;
  }
  KFM.setSubscribed();
  const form = el.closest('.newsletter-row');
  if (form) form.style.display = 'none';
  const ok = document.getElementById(successId);
  if (ok) ok.style.display = 'block';
  showToast('Welcome to the Inner Circle ✦');
}

// ── Build blog card HTML ─────────────────────────────────
function buildCard(post) {
  const label = KFM.tagLabel(post.tag);
  const img   = post.photo_url
    ? `<img src="${post.photo_url}" alt="${post.title}" loading="lazy">`
    : `<div class="card-img-placeholder">${label[0]}</div>`;
  const excerpt = (post.body || '').replace(/\n/g,' ').substring(0,160) + '…';
  return `
    <article class="blog-card" onclick="openPost(${post.id})">
      <div class="blog-card-img">${img}</div>
      <div class="blog-card-body">
        <div class="card-tag">${label}</div>
        <h2 class="card-title">${post.title}</h2>
        <p class="card-excerpt">${excerpt}</p>
        <div class="card-meta">
          <span>${KFM.formatDate(post.created_at)}</span>
          ${post.premium === 'yes' ? '<span class="premium-badge">Members</span>' : ''}
        </div>
      </div>
    </article>`;
}

// ── Open post ────────────────────────────────────────────
function openPost(id) {
  sessionStorage.setItem('kfm_read_id', id);
  window.location.href = 'post.html';
}

// ── Active nav link ──────────────────────────────────────
function markActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  initAgeGate();
  markActiveNav();
  await loadPublicDesign();
});

// ── Load design from Supabase for public pages ───────────
const PUB_THEMES = {
  d1: {'--bg':'#0e0a0f','--bg2':'#160f18','--bg3':'#1e1422','--surface':'#1a1020','--accent':'#c4748a','--accent2':'#e0a0b4','--accent-lt':'#2a1428','--text':'#f0e8ec','--text-mid':'#c0a0b0','--text-muted':'#806070','--border':'rgba(196,116,138,0.18)','--shadow':'rgba(196,116,138,0.10)','--glow':'rgba(196,116,138,0.12)'},
  d2: {'--bg':'#0d0d0d','--bg2':'#141414','--bg3':'#1a1a1a','--surface':'#1f1f1f','--accent':'#d4af6e','--accent2':'#e8cfa0','--accent-lt':'#2a2318','--text':'#f0ead8','--text-mid':'#b8a880','--text-muted':'#7a6a50','--border':'rgba(212,175,110,0.18)','--shadow':'rgba(212,175,110,0.10)','--glow':'rgba(212,175,110,0.12)'},
  d3: {'--bg':'#0a0810','--bg2':'#100c18','--bg3':'#181020','--surface':'#140e1c','--accent':'#9b7fd4','--accent2':'#c0a8e8','--accent-lt':'#1e1430','--text':'#ede8f8','--text-mid':'#b0a0d8','--text-muted':'#706090','--border':'rgba(155,127,212,0.18)','--shadow':'rgba(155,127,212,0.10)','--glow':'rgba(155,127,212,0.12)'},
  d4: {'--bg':'#0f0808','--bg2':'#180e0e','--bg3':'#201414','--surface':'#1c1010','--accent':'#c45050','--accent2':'#e08080','--accent-lt':'#2a1010','--text':'#f5eaea','--text-mid':'#c09090','--text-muted':'#806060','--border':'rgba(196,80,80,0.18)','--shadow':'rgba(196,80,80,0.10)','--glow':'rgba(196,80,80,0.12)'},
  d5: {'--bg':'#080c10','--bg2':'#0e1418','--bg3':'#141c22','--surface':'#101820','--accent':'#5090c0','--accent2':'#80b8e0','--accent-lt':'#101e2a','--text':'#e8f0f8','--text-mid':'#90b0d0','--text-muted':'#507090','--border':'rgba(80,144,192,0.18)','--shadow':'rgba(80,144,192,0.10)','--glow':'rgba(80,144,192,0.12)'},
  d6: {'--bg':'#080f0a','--bg2':'#0e180f','--bg3':'#142016','--surface':'#101c12','--accent':'#50a870','--accent2':'#80c898','--accent-lt':'#101e14','--text':'#e8f5ec','--text-mid':'#90c0a0','--text-muted':'#507860','--border':'rgba(80,168,112,0.18)','--shadow':'rgba(80,168,112,0.10)','--glow':'rgba(80,168,112,0.12)'},
  d7: {'--bg':'#0f0a06','--bg2':'#18120a','--bg3':'#201a10','--surface':'#1c140c','--accent':'#c87840','--accent2':'#e0a870','--accent-lt':'#2a180a','--text':'#f5ede0','--text-mid':'#c0a070','--text-muted':'#806040','--border':'rgba(200,120,64,0.18)','--shadow':'rgba(200,120,64,0.10)','--glow':'rgba(200,120,64,0.12)'},
  l1: {'--bg':'#fdf8f5','--bg2':'#f7f0ea','--bg3':'#f0e6dd','--surface':'#ffffff','--accent':'#b05470','--accent2':'#d4849a','--accent-lt':'#f4dde4','--text':'#2a1a22','--text-mid':'#6a4a56','--text-muted':'#a07888','--border':'rgba(176,84,112,0.14)','--shadow':'rgba(176,84,112,0.08)','--glow':'rgba(176,84,112,0.10)'},
  l2: {'--bg':'#fdf8ee','--bg2':'#f7f0e0','--bg3':'#efe5cc','--surface':'#ffffff','--accent':'#b08040','--accent2':'#d0a870','--accent-lt':'#f5e8cc','--text':'#2a2010','--text-mid':'#6a5030','--text-muted':'#a08050','--border':'rgba(176,128,64,0.14)','--shadow':'rgba(176,128,64,0.08)','--glow':'rgba(176,128,64,0.10)'},
  l3: {'--bg':'#fff3f5','--bg2':'#ffe8ed','--bg3':'#ffd8e0','--surface':'#ffffff','--accent':'#d45070','--accent2':'#e890a8','--accent-lt':'#fde0e8','--text':'#3a1020','--text-mid':'#7a3048','--text-muted':'#b07088','--border':'rgba(212,80,112,0.15)','--shadow':'rgba(212,80,112,0.08)','--glow':'rgba(212,80,112,0.10)'},
  l4: {'--bg':'#f8f5ff','--bg2':'#f0ebff','--bg3':'#e4dcff','--surface':'#ffffff','--accent':'#8060c0','--accent2':'#a888e0','--accent-lt':'#ede0ff','--text':'#180a30','--text-mid':'#503880','--text-muted':'#8870b0','--border':'rgba(128,96,192,0.15)','--shadow':'rgba(128,96,192,0.08)','--glow':'rgba(128,96,192,0.10)'},
  l5: {'--bg':'#f0f5fa','--bg2':'#e4eef6','--bg3':'#d4e4f0','--surface':'#ffffff','--accent':'#3070a0','--accent2':'#6098c8','--accent-lt':'#d8eaf8','--text':'#081828','--text-mid':'#305070','--text-muted':'#6088a8','--border':'rgba(48,112,160,0.14)','--shadow':'rgba(48,112,160,0.08)','--glow':'rgba(48,112,160,0.10)'},
  l6: {'--bg':'#f4f7f4','--bg2':'#eaf0ea','--bg3':'#dde8dd','--surface':'#ffffff','--accent':'#4a7a5a','--accent2':'#78a888','--accent-lt':'#ddeedd','--text':'#101e12','--text-mid':'#2e5038','--text-muted':'#608070','--border':'rgba(74,122,90,0.15)','--shadow':'rgba(74,122,90,0.08)','--glow':'rgba(74,122,90,0.10)'},
  l7: {'--bg':'#faf4ee','--bg2':'#f3e8dc','--bg3':'#ead8c4','--surface':'#ffffff','--accent':'#a05a3a','--accent2':'#c88860','--accent-lt':'#f5e0cc','--text':'#281408','--text-mid':'#603820','--text-muted':'#a07050','--border':'rgba(160,90,58,0.14)','--shadow':'rgba(160,90,58,0.08)','--glow':'rgba(160,90,58,0.10)'},
};
const PUB_FONTS = {
  cormorant:   "'Cormorant Garamond', serif",
  playfair:    "'Playfair Display', serif",
  bodoni:      "'Bodoni Moda', serif",
  lora:        "'Lora', serif",
  baskerville: "'Libre Baskerville', serif",
  dm_serif:    "'DM Serif Display', serif",
  jost:        "'Jost', sans-serif",
  raleway:     "'Raleway', sans-serif"
};

async function loadPublicDesign() {
  try {
    const { data } = await _sb.from('settings').select('theme,font,font_size').eq('id',1).single();
    if (!data) return;
    if (data.theme && PUB_THEMES[data.theme]) {
      Object.entries(PUB_THEMES[data.theme]).forEach(([k,v]) => document.documentElement.style.setProperty(k,v));
    }
    if (data.font && PUB_FONTS[data.font]) {
      document.documentElement.style.setProperty('--font-display', PUB_FONTS[data.font]);
    }
    if (data.font_size) {
      document.documentElement.style.setProperty('--font-size-base', data.font_size + 'px');
    }
  } catch(e) { /* fail silently */ }
}
