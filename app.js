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

document.addEventListener('DOMContentLoaded', () => {
  initAgeGate();
  markActiveNav();
});
