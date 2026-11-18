// En ligne : connexion (agent / chef) + synchronisation offline-first Dexie <-> Supabase (table "records")
document.addEventListener('DOMContentLoaded', async () => {
  const db = window.CATdb, CFG = window.CAT_CFG;
  if (!db || !CFG || !window.supabase) return;
  const sb = window.supabase.createClient(CFG.url, CFG.key);
  const TB = ['relevés', 'appoints', 'transferts', 'travaux', 'fiches', 'rapports'];
  const LS = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  let H = LS('catSyncH', {}), T = localStorage.getItem('catSyncT') || '1970-01-01T00:00:00Z', me = null, busy = false, timer = null;
  if (!localStorage.getItem('catDev')) localStorage.setItem('catDev', Math.random().toString(36).slice(2, 8));
  const dev = localStorage.getItem('catDev');
  const st = o => (o && typeof o === 'object') ? (Array.isArray(o) ? '[' + o.map(st) + ']' : '{' + Object.keys(o).sort().map(k => JSON.stringify(k) + ':' + st(o[k])) + '}') : JSON.stringify(o);
  const clean = r => { const { id, _rk, ...d } = r; return d; };
  const keyOf = (t, r) => t === 'fiches' ? r.date : (r._rk || dev + ':' + r.id);
  const save = () => { localStorage.setItem('catSyncH', JSON.stringify(H)); localStorage.setItem('catSyncT', T); };

  // Pastille d'état + déconnexion dans le menu latéral
  const menu = document.getElementById('sideMenu');
  const stat = document.createElement('div');
  stat.style.cssText = 'padding:14px 18px;font-size:13px;opacity:.85;border-top:1px solid var(--border)';
  stat.innerHTML = '<div id="cat-st"></div><button type="button" id="cat-out" class="side-menu-item" style="margin-top:6px">' + window.ICO('shield', 18) + ' Déconnexion</button>';
  if (menu) menu.appendChild(stat);
  const setS = (s, n) => { const e = document.getElementById('cat-st'); if (e) e.textContent = ({ ok: 'En ligne - synchronisé', off: 'Hors ligne - sera envoyé au retour du réseau', err: 'Erreur de synchronisation - nouvel essai bientôt' })[s]; };

  async function push() {
    const rows = [], seen = {}, now = new Date().toISOString();
    for (const t of TB) for (const r of await db[t].toArray()) {
      const k = keyOf(t, r), h = st(clean(r)), id = t + '|' + k; seen[id] = 1;
      if (t !== 'fiches' && !r._rk) await db[t].update(r.id, { _rk: k });
      if (H[id] !== h) rows.push({ tbl: t, key: k, data: clean(r), deleted: false, updated_at: now, _id: id, _h: h });
    }
    Object.keys(H).forEach(id => { if (!seen[id]) { const p = id.split('|'); rows.push({ tbl: p[0], key: p.slice(1).join('|'), data: null, deleted: true, updated_at: now, _id: id, _h: null }); } });
    if (!rows.length) return;
    const { error } = await sb.from('records').upsert(rows.map(({ _id, _h, ...x }) => x), { onConflict: 'tbl,key' });
    if (error) throw error;
    rows.forEach(r => { if (r._h == null) delete H[r._id]; else H[r._id] = r._h; }); save();
  }

  async function pull() {
    const { data, error } = await sb.from('records').select('*').gt('updated_at', T).order('updated_at').limit(1000);
    if (error) throw error;
    if (!data.length) return;
    const L = {}; for (const t of TB) L[t] = await db[t].toArray();
    for (const r of data) {
      const t = r.tbl; if (!db[t]) continue;
      const id = t + '|' + r.key, loc = L[t].find(x => keyOf(t, x) === r.key);
      if (r.updated_at > T) T = r.updated_at;
      if (loc && st(clean(loc)) !== H[id]) continue;            // modification locale en attente : la version locale gagne
      if (r.deleted) { if (loc) await db[t].delete(loc.id); delete H[id]; continue; }
      if (loc) await db[t].update(loc.id, r.data); else await db[t].add(t === 'fiches' ? r.data : { ...r.data, _rk: r.key });
      H[id] = st(r.data);
    }
    save();
    const cp = document.getElementById('page-chef'); if (cp && cp.classList.contains('active') && window.chefShow) window.chefShow();
  }

  async function sync() {
    if (busy || !me) return;
    if (!navigator.onLine) return setS('off');
    busy = true;
    try { await push(); await pull(); setS('ok'); } catch (e) { console.error(e); setS('err'); }
    busy = false;
  }

  let pt = null, mode = 'in';
  function css() {
    if (document.getElementById('catLoginCss')) return;
    const s = document.createElement('style');
    s.id = 'catLoginCss';
    s.textContent = `
#catLogin{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;overflow:auto;font-family:inherit;
  background:radial-gradient(circle at 12% 18%,#3fb6f4 0,transparent 45%),radial-gradient(circle at 95% 62%,#0a4f9c 0,transparent 52%),linear-gradient(160deg,#2e9be6,#1a6fc4 55%,#0d3f85)}
#catLF{width:100%;max-width:360px;box-sizing:border-box;padding:34px 24px 30px;border-radius:44px;color:#fff;text-align:center;
  background:linear-gradient(160deg,#5cc0ea 0%,#42a0dc 55%,#2f74bd 100%);box-shadow:0 30px 60px rgba(4,36,100,.5),inset 0 1px 0 rgba(255,255,255,.4)}
#catLF img{width:104px;height:104px;object-fit:contain;filter:drop-shadow(0 10px 14px rgba(5,40,110,.45))}
#catLF h2{margin:10px 0 24px;font-weight:300;font-size:20px;letter-spacing:.3em;text-transform:uppercase;color:#fff}
.cat-f{position:relative;margin-bottom:16px}
.cat-f .li{position:absolute;left:22px;top:50%;transform:translateY(-50%);color:#fff;line-height:0;pointer-events:none}
#catLF input[type=email],#catLF input[type=password],#catLF input[type=text]{width:100%;box-sizing:border-box;height:58px;border-radius:999px!important;border:2px solid #fff!important;
  background:linear-gradient(160deg,rgba(255,255,255,.2),rgba(255,255,255,.03))!important;color:#fff!important;padding:0 52px 0 58px!important;font-size:15px;outline:none;margin:0!important;
  box-shadow:0 10px 18px rgba(8,50,130,.35)}
#catLF input::placeholder{color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.16em;font-size:12px;font-weight:700}
#catLF input:-webkit-autofill{-webkit-text-fill-color:#fff;transition:background-color 99999s}
#catEye{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:0;color:#fff;padding:8px;cursor:pointer;line-height:0}
.cat-rm{display:flex;align-items:center;gap:8px;margin:4px 6px 20px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.85);text-align:left}
.cat-rm input{width:18px;height:18px;accent-color:#1f3466;margin:0}
#catM{color:#fff;background:rgba(190,30,40,.55);border-radius:14px;font-size:13px;padding:8px 12px;margin-bottom:14px}
#catGo{width:62%;height:54px;border:0;border-radius:999px;background:#1f3466;color:#fff;font-weight:800;font-size:13px;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;box-shadow:0 14px 24px rgba(5,25,80,.5)}
#catGo:disabled{opacity:.6}
#catLF p{margin:0 0 20px;font-size:14px;line-height:1.5}.cat-sw{display:block;margin-top:18px;color:#fff;font-size:13px;text-decoration:underline;background:none;border:0;width:100%;cursor:pointer}`;
    document.head.appendChild(s);
  }
  const overlay = () => { let d = document.getElementById('catLogin'); if (!d) { d = document.createElement('div'); d.id = 'catLogin'; document.body.appendChild(d); } return d; };
  const esc = x => String(x ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  async function ready(user) {
    clearInterval(pt);
    me = user; window.CATme = user;
    let p = LS('catProf', null);
    try {
      const r = await sb.from('profiles').select('nom,role,approved').eq('id', user.id).maybeSingle();
      if (!r.error) { if (r.data) { p = { id: user.id, ...r.data }; localStorage.setItem('catProf', JSON.stringify(p)); } else { p = null; localStorage.removeItem('catProf'); } }
    } catch (e) {}
    if (!p || p.id !== user.id || !p.approved) return pendingUI(user);
    document.body.dataset.role = p.role === 'chef' ? 'chef' : 'agent';
    const lg = document.getElementById('catLogin'); if (lg) lg.remove();
    if (!window.CATsyncOn) {
      window.CATsyncOn = true;
      timer = setInterval(sync, 30000);
      window.addEventListener('online', sync); window.addEventListener('offline', () => setS('off'));
      document.addEventListener('click', e => { if (e.target.closest('button')) setTimeout(sync, 900); });
      sb.channel('rec').on('postgres_changes', { event: '*', schema: 'public', table: 'records' }, () => sync()).subscribe();
    }
    sync();
  }

  function pendingUI(user) {
    css(); clearInterval(pt);
    overlay().innerHTML = `<div id="catLF"><img src="logo-cat.png" alt="CAT"><h2>En attente</h2><p>Votre compte (${esc(user.email)}) doit être validé par le Chef. Cette page se met à jour toute seule.</p><button class="btn" id="catGo" type="button">Actualiser</button><button type="button" class="cat-sw" id="catBye">Se déconnecter</button></div>`;
    document.getElementById('catGo').addEventListener('click', () => ready(user));
    document.getElementById('catBye').addEventListener('click', logout);
    pt = setInterval(() => ready(user), 10000);
  }

  function loginUI() {
    css();
    const up = mode === 'up', saved = localStorage.getItem('catEmail') || '';
    overlay().innerHTML = `<form id="catLF"><img src="logo-cat.png" alt="CAT"><h2>${up ? 'Créer un compte' : 'Connexion'}</h2>
      ${up ? `<div class="cat-f"><span class="li">${window.ICO('users', 24)}</span><input id="catN" type="text" placeholder="Nom" autocomplete="name" required></div>` : ''}
      <div class="cat-f"><span class="li">${window.ICO('mail', 24)}</span><input id="catE" type="email" placeholder="Email" autocomplete="username" value="${up ? '' : esc(saved)}" required></div>
      <div class="cat-f"><span class="li">${window.ICO('lock', 24)}</span><input id="catP" type="password" placeholder="Mot de passe" autocomplete="${up ? 'new-password' : 'current-password'}" minlength="6" required><button type="button" id="catEye" aria-label="Afficher le mot de passe">${window.ICO('eye', 22)}</button></div>
      ${up ? '' : `<label class="cat-rm"><input type="checkbox" id="catRm" ${saved ? 'checked' : ''}> Se souvenir de moi</label>`}
      <div id="catM" hidden></div><button class="btn" id="catGo" type="submit">${up ? 'Créer le compte' : 'Connexion'}</button>
      <button type="button" class="cat-sw" id="catSw">${up ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? Créer un compte'}</button></form>`;
    document.getElementById('catSw').addEventListener('click', () => { mode = up ? 'in' : 'up'; loginUI(); });
    document.getElementById('catEye').addEventListener('click', () => {
      const p = document.getElementById('catP'), show = p.type === 'password';
      p.type = show ? 'text' : 'password';
      document.getElementById('catEye').innerHTML = window.ICO(show ? 'eyeoff' : 'eye', 22);
    });
    document.getElementById('catLF').addEventListener('submit', async e => {
      e.preventDefault();
      const m = document.getElementById('catM'), go = document.getElementById('catGo'), em = document.getElementById('catE').value.trim(), pw = document.getElementById('catP').value;
      const say = t => { m.textContent = t; m.hidden = false; };
      m.hidden = true; go.disabled = true;
      if (up) {
        const { data, error } = await sb.auth.signUp({ email: em, password: pw, options: { data: { nom: document.getElementById('catN').value.trim() } } });
        go.disabled = false;
        if (error) return say('Création impossible : ' + error.message);
        if (data.session) return ready(data.user);
        return say('Compte créé. Confirmez votre email puis connectez-vous.');
      }
      const { data, error } = await sb.auth.signInWithPassword({ email: em, password: pw });
      go.disabled = false;
      if (error) return say('Email ou mot de passe incorrect (ou pas de réseau).');
      if (document.getElementById('catRm').checked) localStorage.setItem('catEmail', em); else localStorage.removeItem('catEmail');
      ready(data.user);
    });
  }

  async function logout() { await sb.auth.signOut(); localStorage.removeItem('catProf'); location.reload(); }
  window.CATsb = sb;
  document.getElementById('cat-out').addEventListener('click', logout);
  const { data } = await sb.auth.getSession();
  if (data && data.session) ready(data.session.user); else loginUI();
});
