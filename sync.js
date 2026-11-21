// En ligne : connexion (agent / chef) + synchronisation offline-first Dexie <-> Supabase (table "records")
document.addEventListener('DOMContentLoaded', async () => {
  const db = window.CATdb, CFG = window.CAT_CFG;
  if (!db || !CFG || !window.supabase) return;
  const recov = /type=recovery/.test(location.hash);   // arrivée par le lien « mot de passe oublié »
  const sb = window.supabase.createClient(CFG.url, CFG.key);
  const TB = ['relevés', 'appoints', 'transferts', 'travaux', 'operations', 'fiches', 'rapports', 'conges', 'roster', 'employes', 'alertes', 'consignes', 'messages', 'lus']  /* employes_rh (CIN, adresse…) volontairement ABSENT : jamais envoyé au serveur */;
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
  stat.innerHTML = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><label id="cat-av" title="Changer la photo" style="width:48px;height:48px;border-radius:50%;background:var(--secondary) center/cover;display:flex;align-items:center;justify-content:center;font-weight:800;color:#14171C;cursor:pointer;flex-shrink:0"><span id="cat-av-i"></span><input type="file" accept="image/*" id="cat-av-f" hidden></label><div><b id="cat-av-n"></b><br><small id="cat-av-r" style="opacity:.7"></small></div></div><div id="cat-st"></div><button type="button" id="cat-out" class="side-menu-item" style="margin-top:6px">' + window.ICO('shield', 18) + ' Déconnexion</button>';
  if (menu) menu.appendChild(stat);
  // Photo de profil : une cle PAR COMPTE (catAvatar:<id>). Avant V4.3 la cle etait unique (catAvatar) et la photo d'un compte apparaissait sur tous les autres.
  const avKey = () => (me && me.id) ? 'catAvatar:' + me.id : null;
  const avGet = () => { const k = avKey(); return k ? (localStorage.getItem(k) || '') : ''; };
  window.CATavatarGet = avGet;
  function renderAv() {
    const av = document.getElementById('cat-av'), p = LS('catProf', null) || {}, im = avGet();
    if (!av) return;
    av.style.backgroundImage = im ? 'url(' + im + ')' : 'none';
    document.getElementById('cat-av-i').textContent = im ? '' : String(p.nom || '?').trim().slice(0, 1).toUpperCase();
    document.getElementById('cat-av-n').textContent = p.nom || '';
    document.getElementById('cat-av-r').textContent = p.role === 'chef' ? 'Chef' : (p.role ? 'Agent de quart' : '');
  }
  window.CATrenderAv = renderAv; setTimeout(renderAv, 800); setInterval(renderAv, 5000);
  const avf = document.getElementById('cat-av-f');
  if (avf) avf.addEventListener('change', e => {
    const file = e.target.files[0]; e.target.value = ''; if (!file) return;
    if (!avKey()) return;   // pas de compte connecte : rien a enregistrer
    const k = avKey(), img = new Image();
    img.onload = () => { const c = document.createElement('canvas'), z = 192; c.width = c.height = z; const m = Math.min(img.width, img.height);
      c.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, z, z);
      try { localStorage.setItem(k, c.toDataURL('image/jpeg', 0.8)); } catch (x) { alert('Photo trop lourde pour la memoire du telephone.'); }
      renderAv(); window.dispatchEvent(new Event('cat-avatar')); URL.revokeObjectURL(img.src); };
    img.src = URL.createObjectURL(file);
  });
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
    save(); window.dispatchEvent(new Event('cat-synced'));
    const cp = document.getElementById('page-chef'); if (cp && cp.classList.contains('active') && window.chefShow) window.chefShow();
  }

  async function sync() {
    if (busy || !me) return;
    if (!navigator.onLine) return setS('off');
    busy = true;
    try { await push(); await pull(); setS('ok'); } catch (e) { console.error(e); setS('err'); }
    busy = false;
  }

  const FAKE = /@(example|exemple|test|tests|domain|fake|faux|nomail|localhost)\.[a-z.]+$|\.(invalid|local|test|example|localhost)$/i;   // adresses d'exemple refusees
  let pt = null, mode = 'in';
  function css() {
    if (document.getElementById('catLoginCss')) return;
    const s = document.createElement('style');
    s.id = 'catLoginCss';
    s.textContent = `
#catLogin{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;overflow:auto;font-family:inherit;background:#E9EDF3}
#catLF{width:100%;max-width:420px;min-height:100%;display:flex;flex-direction:column;background:#fff;color:#111;overflow:hidden;position:relative;margin:0}
@media(min-width:600px){#catLogin{padding:24px}#catLF{min-height:0;height:min(780px,100%);border-radius:36px;box-shadow:0 30px 70px rgba(15,23,42,.18)}}
.cat-hd{flex:0 0 36%;min-height:220px;display:flex;align-items:center;justify-content:center;position:relative;
  background:#0A0A0C url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%230A0A0C'/%3E%3Ccircle cx='20' cy='20' r='20' fill='%23202024'/%3E%3Cpath d='M40 40h40v40A40 40 0 0 1 40 40z' fill='%23181a1e'/%3E%3Cpath d='M0 80V40a40 40 0 0 1 40 40z' fill='%23262629'/%3E%3Crect x='50' y='4' width='26' height='26' rx='13' fill='%231b1b1f'/%3E%3C/svg%3E")}
.cat-hd.sm{flex:0 0 auto;min-height:0;height:140px;align-items:flex-start;justify-content:flex-start;padding:26px 20px;gap:10px}
.cat-logo{width:78px;height:78px;border-radius:22px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 12px 30px rgba(0,0,0,.5)}
.cat-logo img{width:64px;height:64px;object-fit:contain}
.cat-back{width:38px;height:38px;border:0;border-radius:12px;background:rgba(255,255,255,.12);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer}
.cat-htitle{flex:1;text-align:center;margin-right:48px;color:#fff;font-size:22px;font-weight:600;line-height:38px}
.cat-sheet{flex:1;display:flex;flex-direction:column;background:#fff;margin-top:-46px;border-radius:84px 0 0 0;padding:36px 26px 24px;position:relative}
.cat-hd.sm+.cat-sheet{margin-top:-44px;border-radius:72px 0 0 0;padding-top:30px}
.cat-sheet h2{margin:0 0 22px;text-align:center;font-weight:600;font-size:24px;color:#111;letter-spacing:-.2px;text-transform:none}
.cat-f{position:relative;margin-bottom:14px;background:#fff;border:1px solid #EFF1F5;border-radius:14px;box-shadow:0 8px 24px rgba(15,23,42,.08);padding:10px 16px 8px}
.cat-f:focus-within{border-color:#111;box-shadow:0 8px 24px rgba(15,23,42,.13)}
.cat-f label{display:block;margin:0 0 2px;font-size:12px;font-weight:700;color:#111}
#catLF .cat-f input{width:100%;height:26px;margin:0!important;padding:2px 38px 2px 0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;color:#111!important;font-size:15px;font-weight:500;outline:none}
#catLF input::placeholder{color:#9AA1AE;font-weight:500}
#catLF input:-webkit-autofill{-webkit-text-fill-color:#111;transition:background-color 99999s}
#catEye{position:absolute;right:10px;bottom:9px;background:none;border:0;color:#6B7280;padding:6px;cursor:pointer;line-height:0}
.cat-rm{display:flex;align-items:center;gap:8px;margin:2px 2px 18px;font-size:13px;font-weight:600;color:#374151}
.cat-rm input{width:18px;height:18px;margin:0;accent-color:#111}
#catM{color:#B42318;background:#FEF3F2;border-radius:12px;font-size:13px;padding:9px 12px;margin-bottom:14px}
#catGo{width:100%;height:52px;border:0;border-radius:10px;background:#0A0A0C;color:#fff;font-size:15px;font-weight:700;cursor:pointer;margin-top:6px;display:inline-flex;align-items:center;justify-content:center;gap:8px}
#catGo:disabled{opacity:.6}
#catLF p{margin:0 0 20px;font-size:14px;line-height:1.55;color:#374151;text-align:center}
.cat-sw{display:block;width:100%;margin-top:auto;padding-top:22px;color:#111;font-size:13.5px;background:none;border:0;cursor:pointer;text-align:center}
.cat-sw b{font-weight:800;text-decoration:underline}
.cat-fp{display:block;margin:-6px 0 14px auto;padding:4px 2px;background:none;border:0;color:#111;font-size:13px;font-weight:700;text-decoration:underline;cursor:pointer}
.cat-bio{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;margin-top:22px;padding:6px 0;border:0;background:none;color:#111;font-size:13.5px;font-weight:700;cursor:pointer}
.cat-bio i{display:flex;align-items:center;justify-content:center;width:72px;height:72px;border-radius:50%;background:#0A0A0C;color:#fff}
.cat-bio.off i{background:#9CA3AF}
`;
    document.head.appendChild(s);
  }
  const overlay = () => { let d = document.getElementById('catLogin'); if (!d) { d = document.createElement('div'); d.id = 'catLogin'; document.body.appendChild(d); } return d; };
  const esc = x => String(x ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  async function ready(user) {
    clearInterval(pt);
    me = user; window.CATme = user;
    let p = LS('catProf', null);
    // Migration V4.3 : l'ancienne photo partagee (catAvatar) est donnee au compte actif de l'appareil, puis supprimee pour tous les autres.
    const legacy = localStorage.getItem('catAvatar');
    if (legacy) { if (p && p.id === user.id && !localStorage.getItem('catAvatar:' + user.id)) localStorage.setItem('catAvatar:' + user.id, legacy); localStorage.removeItem('catAvatar'); }
    renderAv(); window.dispatchEvent(new Event('cat-avatar'));
    try {
      const r = await sb.from('profiles').select('nom,role,approved').eq('id', user.id).maybeSingle();
      if (!r.error) { if (r.data) { p = { id: user.id, ...r.data }; localStorage.setItem('catProf', JSON.stringify(p)); } else { p = null; localStorage.removeItem('catProf'); } }
    } catch (e) {}
    // Annuaire : garder la VRAIE adresse e-mail du compte dans le profil (utilisee pour choisir les destinataires).
    try { sb.from('profiles').select('email').eq('id', user.id).maybeSingle().then(q => { if (q && !q.error && q.data && user.email && String(q.data.email || '').toLowerCase() !== user.email.toLowerCase()) return sb.from('profiles').update({ email: user.email }).eq('id', user.id); }).catch(() => {}); } catch (e) {}
    if (!p || p.id !== user.id || !p.approved) return pendingUI(user);
    document.body.dataset.role = p.role === 'chef' ? 'chef' : 'agent'; renderAv();
    const lg = document.getElementById('catLogin'); if (lg) lg.remove();
    if (!window.CATsyncOn) {
      window.CATsyncOn = true;
      timer = setInterval(sync, 30000);
      window.addEventListener('online', sync); window.addEventListener('offline', () => setS('off'));
      document.addEventListener('click', e => { if (e.target.closest('button')) setTimeout(sync, 900); });
      sb.channel('rec').on('postgres_changes', { event: '*', schema: 'public', table: 'records' }, () => sync()).subscribe();
    }
    sync(); window.dispatchEvent(new Event('cat-synced'));
  }


  // ===== EMPREINTE DIGITALE / FACE ID (verrouillage local, WebAuthn) =====
  const b64 = b => btoa(String.fromCharCode(...new Uint8Array(b))), unb64 = t => Uint8Array.from(atob(t), c => c.charCodeAt(0));
  const bioOK = async () => { try { return !!(window.PublicKeyCredential && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()); } catch (e) { return false; } };
  const bioGet = () => { try { return JSON.parse(localStorage.getItem('catBio')); } catch (e) { return null; } };
  async function bioEnroll(user) {
    const c = await navigator.credentials.create({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), rp: { name: 'CAT by Manda' },
      user: { id: new TextEncoder().encode(user.id), name: user.email, displayName: user.email },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' }, timeout: 60000 } });
    localStorage.setItem('catBio', JSON.stringify({ id: b64(c.rawId), uid: user.id }));
  }
  async function bioCheck() {
    const b = bioGet(); if (!b) throw new Error('no bio');
    await navigator.credentials.get({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), userVerification: 'required', timeout: 60000,
      allowCredentials: [{ type: 'public-key', id: unb64(b.id), transports: ['internal'] }] } });
  }
  function offerBio(user) {
    css(); clearInterval(pt);
    overlay().innerHTML = `<div id="catLF"><div class="cat-hd"><div class="cat-logo"><img src="logo-cat.png" alt="CAT"></div></div><div class="cat-sheet"><h2>Empreinte digitale</h2><p>Activer l'empreinte (ou Face ID) pour ouvrir l'application sans email ni mot de passe ?</p><div id="catM" hidden></div><button class="btn" id="catGo" type="button">Activer</button><button type="button" class="cat-sw" id="catLater">Plus tard</button></div></div>`;
    document.getElementById('catGo').addEventListener('click', async () => {
      try { await bioEnroll(user); ready(user); } catch (e) { const m = document.getElementById('catM'); m.textContent = "Activation impossible ou annulée."; m.hidden = false; }
    });
    document.getElementById('catLater').addEventListener('click', () => { localStorage.setItem('catBioNo', '1'); ready(user); });
  }
  function lockUI(user) {
    css(); clearInterval(pt);
    overlay().innerHTML = `<div id="catLF"><div class="cat-hd"><div class="cat-logo"><img src="logo-cat.png" alt="CAT"></div></div><div class="cat-sheet"><h2>Application verrouillée</h2><button class="btn" id="catGo" type="button">${window.ICO('lock', 22)} Déverrouiller</button><div id="catM" hidden></div><button type="button" class="cat-sw" id="catOther">Utiliser un autre compte</button></div></div>`;
    const go = async () => {
      try { await bioCheck(); ready(user); } catch (e) { const m = document.getElementById('catM'); if (m) { m.textContent = 'Empreinte non reconnue. Réessayez.'; m.hidden = false; } }
    };
    document.getElementById('catGo').addEventListener('click', go);
    document.getElementById('catOther').addEventListener('click', () => { localStorage.removeItem('catBio'); logout(); });
    setTimeout(go, 300);
  }

  function pendingUI(user) {
    css(); clearInterval(pt);
    overlay().innerHTML = `<div id="catLF"><div class="cat-hd"><div class="cat-logo"><img src="logo-cat.png" alt="CAT"></div></div><div class="cat-sheet"><h2>En attente</h2><p>Votre compte (${esc(user.email)}) doit être validé par le Chef. Cette page se met à jour toute seule.</p><button class="btn" id="catGo" type="button">Actualiser</button><button type="button" class="cat-sw" id="catBye">Se déconnecter</button></div></div>`;
    document.getElementById('catGo').addEventListener('click', () => ready(user));
    document.getElementById('catBye').addEventListener('click', logout);
    pt = setInterval(() => ready(user), 10000);
  }

  // ===== MOT DE PASSE OUBLIÉ (e-mail de réinitialisation Supabase) =====
  function forgotUI(prefill) {
    css(); clearInterval(pt);
    overlay().innerHTML = `<form id="catLF"><div class="cat-hd sm"><button type="button" class="cat-back" id="catBack" aria-label="Retour">${window.ICO('back', 22)}</button><div class="cat-htitle">Mot de passe oublié</div></div><div class="cat-sheet">
      <p>Entrez l'adresse e-mail de votre compte. Vous recevrez un lien pour choisir un nouveau mot de passe.</p>
      <div class="cat-f"><label for="catE">Email</label><input id="catE" type="email" placeholder="nom@gmail.com" autocomplete="username" value="${esc(prefill || '')}" required></div>
      <div id="catM" hidden></div><button class="btn" id="catGo" type="submit">Envoyer le lien</button></div></form>`;
    document.getElementById('catBack').addEventListener('click', () => { mode = 'in'; loginUI(); });
    document.getElementById('catLF').addEventListener('submit', async e => {
      e.preventDefault();
      const m = document.getElementById('catM'), go = document.getElementById('catGo'), em = document.getElementById('catE').value.trim();
      const say = (t, ok) => { m.textContent = t; m.hidden = false; m.style.color = ok ? '#067647' : ''; m.style.background = ok ? '#ECFDF3' : ''; };
      if (!navigator.onLine) return say('Pas de réseau : la réinitialisation nécessite internet.');
      go.disabled = true;
      const opt = /^https?:$/.test(location.protocol) ? { redirectTo: location.origin + location.pathname } : {};
      const { error } = await sb.auth.resetPasswordForEmail(em, opt);
      go.disabled = false;
      if (error) return say('Envoi impossible : ' + error.message);
      say('Si cette adresse a un compte, un e-mail vient d\'être envoyé. Ouvrez le lien reçu (vérifiez aussi les spams).', true);
    });
  }
  function recoveryUI() {
    css(); clearInterval(pt);
    overlay().innerHTML = `<form id="catLF"><div class="cat-hd"><div class="cat-logo"><img src="logo-cat.png" alt="CAT"></div></div><div class="cat-sheet"><h2>Nouveau mot de passe</h2>
      <div class="cat-f"><label for="catP">Nouveau mot de passe</label><input id="catP" type="password" placeholder="6 caractères minimum" autocomplete="new-password" minlength="6" required></div>
      <div class="cat-f"><label for="catP2">Confirmer</label><input id="catP2" type="password" placeholder="Répétez le mot de passe" autocomplete="new-password" minlength="6" required></div>
      <div id="catM" hidden></div><button class="btn" id="catGo" type="submit">Enregistrer</button></div></form>`;
    document.getElementById('catLF').addEventListener('submit', async e => {
      e.preventDefault();
      const m = document.getElementById('catM'), go = document.getElementById('catGo'), a = document.getElementById('catP').value, b = document.getElementById('catP2').value;
      const say = t => { m.textContent = t; m.hidden = false; };
      if (a !== b) return say('Les deux mots de passe sont différents.');
      go.disabled = true;
      const { data, error } = await sb.auth.updateUser({ password: a });
      go.disabled = false;
      if (error) return say('Échec : ' + error.message + ' (le lien a peut-être expiré, redemandez-en un).');
      history.replaceState(null, '', location.pathname + location.search);
      ready(data.user);
    });
  }

  function loginUI() {
    css();
    const up = mode === 'up', saved = localStorage.getItem('catEmail') || '';
    overlay().innerHTML = `<form id="catLF">${up
        ? `<div class="cat-hd sm"><button type="button" class="cat-back" id="catBack" aria-label="Retour">${window.ICO('back', 22)}</button><div class="cat-htitle">Créer un compte</div></div><div class="cat-sheet">`
        : `${'<div class="cat-hd"><div class="cat-logo"><img src="logo-cat.png" alt="CAT"></div></div>'}<div class="cat-sheet"><h2>Connexion</h2>`}
      ${up ? `<div class="cat-f"><label for="catN">Nom</label><input id="catN" type="text" placeholder="Votre nom" autocomplete="name" required></div>` : ''}
      <div class="cat-f"><label for="catE">Email</label><input id="catE" type="email" placeholder="nom@exemple.com" autocomplete="username" value="${up ? '' : esc(saved)}" required></div>
      <div class="cat-f"><label for="catP">Mot de passe</label><input id="catP" type="password" placeholder="6 caractères minimum" autocomplete="${up ? 'new-password' : 'current-password'}" minlength="6" required><button type="button" id="catEye" aria-label="Afficher le mot de passe">${window.ICO('eye', 22)}</button></div>
      ${up ? '' : '<button type="button" class="cat-fp" id="catFp">Mot de passe oublié ?</button>'}
      ${up ? '' : `<label class="cat-rm"><input type="checkbox" id="catRm" ${saved ? 'checked' : ''}> Se souvenir de moi</label>`}
      <div id="catM" hidden></div><button class="btn" id="catGo" type="submit">${up ? 'Créer le compte' : 'Connexion'}</button>
      ${up ? '' : `<button type="button" class="cat-bio ${bioGet() ? '' : 'off'}" id="catBioBtn"><i>${window.ICO('fingerprint', 38)}</i><span>Touchez pour authentification biométrique</span></button>`}
      <button type="button" class="cat-sw" id="catSw">${up ? 'Déjà un compte ? <b>Se connecter</b>' : 'Pas de compte ? <b>Créer un compte</b>'}</button></div></form>`;
    document.getElementById('catSw').addEventListener('click', () => { mode = up ? 'in' : 'up'; loginUI(); });
    const fp = document.getElementById('catFp'); if (fp) fp.addEventListener('click', () => forgotUI(document.getElementById('catE').value.trim()));
    const bb = document.getElementById('catBioBtn');
    if (bb) bb.addEventListener('click', async () => {
      const m = document.getElementById('catM'), say = t => { m.textContent = t; m.hidden = false; };
      m.hidden = true;
      if (!bioGet()) {   // pas encore activée sur cet appareil
        localStorage.removeItem('catBioNo');   // « Plus tard » ne bloque plus la proposition
        if (!(await bioOK())) return say('Empreinte indisponible ici : il faut un téléphone/tablette avec empreinte, et l\'application ouverte en HTTPS (pas en file:///, pas dans un aperçu).');
        const em = document.getElementById('catE').value.trim(), pw = document.getElementById('catP').value;
        if (em && pw) return document.getElementById('catLF').requestSubmit();   // connexion, puis proposition d'activer l'empreinte
        return say('Première fois : entrez votre e-mail et mot de passe, puis touchez ce bouton (ou Connexion). L\'application proposera ensuite d\'activer l\'empreinte.');
      }
      try {
        await bioCheck();
        const { data: ss } = await sb.auth.getSession();
        if (ss && ss.session) return ready(ss.session.user);
        say('Session expirée : entrez votre mot de passe une seule fois, l\'empreinte reprendra ensuite.');
      } catch (e) { say('Empreinte non reconnue ou annulée.'); }
    });
    const bk = document.getElementById('catBack'); if (bk) bk.addEventListener('click', () => { mode = 'in'; loginUI(); });
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
        if (FAKE.test(em)) { go.disabled = false; return say('Utilisez votre vraie adresse e-mail (ex. nom@gmail.com), pas une adresse d\'exemple.'); }
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
      if (!bioGet() && !localStorage.getItem('catBioNo') && await bioOK()) return offerBio(data.user);
      ready(data.user);
    });
  }

  window.CATbio = {
    on: () => !!bioGet(),
    ok: bioOK,
    enable: async () => { if (!me) throw new Error('Connectez-vous d\'abord.'); if (!(await bioOK())) throw new Error('Empreinte indisponible sur cet appareil / en dehors de HTTPS.'); await bioEnroll(me); localStorage.removeItem('catBioNo'); },
    disable: () => { localStorage.removeItem('catBio'); }
  };
  window.CATlock = () => { if (bioGet() && me && !document.getElementById('catLogin')) lockUI(me); };
  async function logout() { await sb.auth.signOut(); localStorage.removeItem('catProf'); localStorage.removeItem('catBio'); localStorage.removeItem('catBioNo'); location.reload(); }
  window.CATsb = sb;
  document.getElementById('cat-out').addEventListener('click', () => { if (bioGet() && me) lockUI(me); else logout(); });
  const { data } = await sb.auth.getSession();
  if (recov && data && data.session) return recoveryUI();
  if (data && data.session) { const b = bioGet(); if (b && b.uid === data.session.user.id) lockUI(data.session.user); else ready(data.session.user); } else loginUI();
});
