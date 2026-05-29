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
  rose:  {'--bg':'#fdf8f5','--bg2':'#f7f0ea','--bg3':'#f0e6dd','--surface':'#ffffff','--accent':'#b05470','--accent2':'#d4849a','--accent-lt':'#f4dde4','--text':'#2a1a22','--text-mid':'#6a4a56','--text-muted':'#a07888','--border':'rgba(176,84,112,0.14)','--shadow':'rgba(176,84,112,0.08)','--glow':'rgba(176,84,112,0.10)'},
  noir:  {'--bg':'#0d0d0d','--bg2':'#141414','--bg3':'#1a1a1a','--surface':'#1f1f1f','--accent':'#d4af6e','--accent2':'#e8cfa0','--accent-lt':'#2a2318','--text':'#f0ead8','--text-mid':'#b8a880','--text-muted':'#7a6a50','--border':'rgba(212,175,110,0.15)','--shadow':'rgba(212,175,110,0.08)','--glow':'rgba(212,175,110,0.08)'},
  blush: {'--bg':'#fff3f5','--bg2':'#ffe8ed','--bg3':'#ffd8e0','--surface':'#ffffff','--accent':'#d45070','--accent2':'#e890a8','--accent-lt':'#fde0e8','--text':'#3a1020','--text-mid':'#7a3048','--text-muted':'#b07088','--border':'rgba(212,80,112,0.15)','--shadow':'rgba(212,80,112,0.08)','--glow':'rgba(212,80,112,0.08)'},
  sage:  {'--bg':'#f5f7f5','--bg2':'#eaf0ea','--bg3':'#dde8dd','--surface':'#ffffff','--accent':'#5a8a6a','--accent2':'#88b898','--accent-lt':'#ddeedd','--text':'#1a2a1a','--text-mid':'#3a5a3a','--text-muted':'#7a9a7a','--border':'rgba(90,138,106,0.15)','--shadow':'rgba(90,138,106,0.08)','--glow':'rgba(90,138,106,0.08)'}
};
const PUB_FONTS = {
  cormorant:"'Cormorant Garamond', serif",
  playfair:"'Playfair Display', serif",
  garamond:"'EB Garamond', serif",
  josefin:"'Josefin Sans', sans-serif"
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
