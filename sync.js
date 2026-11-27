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
  stat.innerHTML = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><label id="cat-av" title="Changer la photo" style="width:48px;height:48px;border-radius:50%;background:var(--secondary) center/cover;display:flex;align-items:center;justify-content:center;font-weight:800;color:#14171C;cursor:pointer;flex-shrink:0"><span id="cat-av-i"></span><input type="file" accept="image/*" id="cat-av-f" hidden></label><div><b id="cat-av-n"></b><br><small id="cat-av-r" style="opacity:.7"></small></div></div><div id="cat-st"></div><button type="button" id="cat-prof" class="side-menu-item" style="margin-top:6px">' + window.ICO('users', 18) + ' Mon profil</button><button type="button" id="cat-out" class="side-menu-item" style="margin-top:6px">' + window.ICO('shield', 18) + ' Déconnexion</button>';
  if (menu) menu.appendChild(stat);
  // Photo de profil : une cle PAR COMPTE (catAvatar:<id>). Avant V4.3 la cle etait unique (catAvatar) et la photo d'un compte apparaissait sur tous les autres.
  const avKey = () => (me && me.id) ? 'catAvatar:' + me.id : null;
  const avGet = () => { const k = avKey(); return k ? (localStorage.getItem(k) || '') : ''; };
  window.CATavatarGet = avGet;
  // V4.37 : photo PARTAGEE (colonne profiles.avatar). Cache memoire + localStorage (hors ligne) des photos des autres comptes.
  let AVC = LS('catAvCache', {}) || {};
  const emKey = e => 'e:' + String(e || '').trim().toLowerCase();
  window.CATavatarOf = o => { o = o || {}; if (me && o.id && o.id === me.id) return avGet(); return (o.id && AVC['i:' + o.id]) || (o.email && AVC[emKey(o.email)]) || ''; };
  async function avPush(v) {
    try { if (!me || !navigator.onLine) return false; const r = await sb.from('profiles').update({ avatar: v || null }).eq('id', me.id).select('id'); return !r.error && !!(r.data && r.data.length); } catch (e) { return false; }
  }
  async function loadAvatars() {
    try {
      const r = await sb.from('profiles').select('id,email,avatar'); if (r.error || !r.data) return;
      const m = {}; r.data.forEach(p => { if (!p.avatar) return; m['i:' + p.id] = p.avatar; if (p.email) m[emKey(p.email)] = p.avatar; });
      AVC = m; try { localStorage.setItem('catAvCache', JSON.stringify(m)); } catch (e) {}
      window.dispatchEvent(new Event('cat-avatar'));
    } catch (e) {}
  }
  window.CATloadAvatars = loadAvatars;
  function renderAv() {
    const av = document.getElementById('cat-av'), p = LS('catProf', null) || {}, im = avGet();
    if (!av) return;
    av.style.backgroundImage = im ? 'url(' + im + ')' : 'none';
    document.getElementById('cat-av-i').textContent = im ? '' : String(p.nom || '?').trim().slice(0, 1).toUpperCase();
    document.getElementById('cat-av-n').textContent = p.nom || '';
    document.getElementById('cat-av-r').textContent = p.role === 'chef' ? 'Chef' : (p.role ? 'Agent de quart' : '');
  }
  window.CATrenderAv = renderAv; setTimeout(renderAv, 800); setInterval(renderAv, 5000);
  // Photo de profil (recadree en carre 192 px, gardee sur CET appareil seulement).
  function avatarFromFile(file) {
    return new Promise((res, rej) => {
      const k = avKey(); if (!k) return rej(new Error('Connectez-vous d\'abord.'));
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas'), z = 192; c.width = c.height = z; const m = Math.min(img.width, img.height);
        c.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, z, z);
        URL.revokeObjectURL(img.src);
        const du = c.toDataURL('image/jpeg', 0.8);
        try { localStorage.setItem(k, du); } catch (x) { return rej(new Error('Photo trop lourde pour la mémoire du téléphone.')); }
        renderAv(); window.dispatchEvent(new Event('cat-avatar')); avPush(du).then(ok => res(ok));   // res(true) = partagée avec les autres utilisateurs
      };
      img.onerror = () => rej(new Error('Image illisible.'));
      img.src = URL.createObjectURL(file);
    });
  }
  const avf = document.getElementById('cat-av-f');
  if (avf) avf.addEventListener('change', e => {
    const file = e.target.files[0]; e.target.value = ''; if (!file) return;
    avatarFromFile(file).catch(err => { if (avKey()) alert(err.message); });
  });
  const closeMenu = () => { const so = document.getElementById('sideMenuOverlay'); if (menu) menu.classList.remove('open'); if (so) so.classList.remove('open'); };
  const bp = document.getElementById('cat-prof');
  if (bp) bp.addEventListener('click', () => { closeMenu(); if (window.openProfile) window.openProfile(); });
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

  let lastErr = '';
  const tick = () => { try { window.dispatchEvent(new Event('cat-sync-state')); } catch (e) {} };
  async function sync() {
    if (busy || !me) return;
    if (!navigator.onLine) { setS('off'); return tick(); }
    busy = true; tick();
    try { await push(); await pull(); setS('ok'); lastErr = ''; localStorage.setItem('catSyncLast', String(Date.now())); }
    catch (e) { console.error(e); setS('err'); lastErr = (e && e.message) ? String(e.message) : String(e); }
    busy = false; tick();
  }
  // Nombre de modifications locales pas encore envoyees (meme detection que push, sans rien envoyer)
  async function pendingCount() {
    let n = 0; const seen = {};
    try {
      for (const t of TB) for (const r of await db[t].toArray()) { const id = t + '|' + keyOf(t, r); seen[id] = 1; if (H[id] !== st(clean(r))) n++; }
      Object.keys(H).forEach(id => { if (!seen[id]) n++; });
    } catch (e) {}
    return n;
  }
  // Utilise par Parametres > Synchronisation
  window.CATsync = {
    now: async () => {
      if (!me) return { ok: false, reason: 'login' };
      if (!navigator.onLine) { setS('off'); tick(); return { ok: false, reason: 'offline' }; }
      let w = 0; while (busy && w++ < 100) await new Promise(r => setTimeout(r, 100));   // attend la synchro deja en cours
      await sync();
      return { ok: !lastErr, err: lastErr };
    },
    info: async () => ({ online: navigator.onLine, busy, logged: !!me, last: +localStorage.getItem('catSyncLast') || 0, err: lastErr, pending: await pendingCount() })
  };

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
/* V4.40 : sur ordinateur (fenetre peu haute) le bas de la carte etait coupe -> « Créer un compte » invisible */
@media(min-width:600px){#catLF{overflow-y:auto}}
@media(max-height:780px){.cat-hd:not(.sm){flex:0 0 auto;min-height:0;height:150px}.cat-sheet{padding-top:30px}.cat-sheet h2{margin-bottom:14px}.cat-f{margin-bottom:10px}.cat-sw{padding-top:14px}}
.cat-fp{display:block;margin:-6px 0 14px auto;padding:4px 2px;background:none;border:0;color:#111;font-size:13px;font-weight:700;text-decoration:underline;cursor:pointer}
.cat-bio{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;margin-top:22px;padding:6px 0;border:0;background:none;color:#111;font-size:13.5px;font-weight:700;cursor:pointer}
.cat-bio i{display:flex;align-items:center;justify-content:center;width:72px;height:72px;border-radius:50%;background:#0A0A0C;color:#fff}
.cat-bio.off i{background:#9CA3AF}

/* V4.42 : ordinateur / tablette (>= 600 px) = fond sombre + carte COMPACTE ; ordinateur (>= 900 px) = panneau « Bienvenue » + photos a gauche. Telephone inchange. */
#catWelcome{display:none}
#catLF .cat-sub{margin:-10px 0 16px;font-size:13.5px}
@media(min-width:600px){
#catLogin{align-items:flex-start;justify-content:center;gap:clamp(28px,6vw,90px);padding:22px;background:radial-gradient(900px 520px at 12% 18%,rgba(28,75,156,.38),transparent 62%),radial-gradient(700px 480px at 92% 92%,rgba(255,200,61,.14),transparent 60%),#0A0A0C}
#catLF{width:100%;max-width:360px;height:auto;min-height:0;overflow:visible;margin-block:auto;border-radius:20px;box-shadow:0 26px 70px rgba(0,0,0,.5)}
#catLF .cat-hd:not(.sm){flex:0 0 auto;min-height:0;height:auto;background:#fff;padding:26px 0 0;border-radius:20px 20px 0 0}
#catLF .cat-hd::before,#catLF .cat-hd::after{display:none}
#catLF .cat-logo{width:64px;height:64px;border-radius:18px;border:1px solid #EEF0F4;box-shadow:0 6px 18px rgba(15,23,42,.12)}
#catLF .cat-logo img{width:52px;height:52px}
#catLF .cat-hd.sm{height:auto;min-height:0;background:#fff;padding:18px 22px 0;align-items:center;border-radius:20px 20px 0 0}
#catLF .cat-back{width:34px;height:34px;background:#F1F3F7;color:#111}
#catLF .cat-htitle{color:#111;font-size:18px;line-height:34px}
#catLF .cat-sheet,#catLF .cat-hd.sm+.cat-sheet{margin-top:0;border-radius:0 0 20px 20px;padding:12px 28px 24px}
#catLF .cat-sheet h2{font-size:21px;margin-bottom:16px}
#catLF .cat-f{margin-bottom:10px;padding:8px 14px 6px}
#catLF .cat-f input{height:24px;font-size:14px}
#catLF #catGo{height:44px;font-size:14px}
#catLF .cat-rm{margin:0 2px 12px;font-size:12.5px}
#catLF .cat-fp{margin:-4px 0 10px auto;font-size:12.5px}
#catLF .cat-bio{margin-top:12px;font-size:12.5px}
#catLF .cat-bio i{width:50px;height:50px}
#catLF .cat-sw{margin-top:14px;padding:12px;border:1px solid #E5E7EB;border-radius:12px;font-size:13px}
}
@media(min-width:900px){
#catWelcome{display:flex;flex-direction:column;align-items:flex-start;gap:14px;width:100%;max-width:420px;margin-block:auto;color:#fff}
#catWelcome .cat-wlogo{width:84px;height:84px;padding:9px;border-radius:24px;background:#fff;box-shadow:0 0 0 6px rgba(255,200,61,.2),0 18px 40px rgba(0,0,0,.45)}
#catWelcome .cat-wlogo img{display:block;width:100%;height:100%;object-fit:contain}
#catWelcome h1{margin:6px 0 0;font-size:34px;line-height:1.1;font-weight:700;letter-spacing:-.6px;color:#fff;text-transform:none}
#catWelcome h1 .cat-gold{color:#FFC83D}
#catWelcome p{margin:0;font-size:15px;line-height:1.55;color:#B8C0CE}
.cat-stack{position:relative;width:100%;max-width:400px;height:282px;margin-top:8px}
.cat-ph{position:absolute;border-radius:18px;overflow:hidden;border:3px solid #fff;background:#fff;box-shadow:0 20px 44px rgba(0,0,0,.45)}
.cat-ph img{display:block;width:100%;height:100%;object-fit:cover}
.cat-ph1{left:0;top:4px;width:210px;height:164px;--r:-4deg;transform:rotate(var(--r))}
.cat-ph2{left:150px;top:44px;width:240px;height:180px;--r:3deg;transform:rotate(var(--r))}
.cat-ph3{left:34px;top:122px;width:190px;height:152px;--r:-2deg;transform:rotate(var(--r))}
}
@media(min-width:900px) and (max-height:700px){#catWelcome h1{font-size:28px}#catWelcome .cat-wlogo{width:68px;height:68px}.cat-stack{transform:scale(.84);transform-origin:top left;height:240px}}

/* V4.43 : animations (CSS seul, desactivees si l'appareil demande « reduire les animations ») */
@keyframes cardIn{from{opacity:0;transform:translateY(16px) scale(.985)}to{opacity:1;transform:none}}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes logoPop{from{opacity:0;transform:scale(.55) rotate(-14deg)}to{opacity:1;transform:none}}
@keyframes ring{0%{transform:scale(1);opacity:.65}100%{transform:scale(1.32);opacity:0}}
@keyframes phIn{from{opacity:0;transform:translateY(46px) rotate(calc(var(--r) - 9deg)) scale(.9)}to{opacity:1;transform:translateY(0) rotate(var(--r)) scale(1)}}
@keyframes phFloat{0%,100%{transform:translateY(0) rotate(var(--r))}50%{transform:translateY(-9px) rotate(var(--r))}}
@keyframes shine{from{background-position:0 0}to{background-position:200% 0}}
@keyframes blobA{from{transform:translate(0,0) scale(1)}to{transform:translate(90px,60px) scale(1.15)}}
@keyframes blobB{from{transform:translate(0,0) scale(1)}to{transform:translate(-80px,-50px) scale(1.2)}}
@keyframes shake{0%,100%{transform:none}20%{transform:translateX(-6px)}40%{transform:translateX(5px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
@keyframes btnLoad{from{background-position:200% 0}to{background-position:-200% 0}}
#catLF{animation:cardIn .6s cubic-bezier(.2,.8,.2,1) both}
.cat-sheet>*{animation:fadeUp .5s cubic-bezier(.2,.8,.2,1) both}
.cat-sheet>:nth-child(1){animation-delay:.10s}.cat-sheet>:nth-child(2){animation-delay:.16s}.cat-sheet>:nth-child(3){animation-delay:.22s}.cat-sheet>:nth-child(4){animation-delay:.28s}.cat-sheet>:nth-child(5){animation-delay:.34s}.cat-sheet>:nth-child(6){animation-delay:.40s}.cat-sheet>:nth-child(n+7){animation-delay:.46s}
.cat-logo{animation:logoPop .7s cubic-bezier(.34,1.56,.64,1) .05s both}
.cat-f{transition:border-color .2s,box-shadow .2s,transform .2s}
.cat-f:focus-within{transform:translateY(-1px)}
#catLF #catGo{transition:transform .15s,box-shadow .2s,opacity .2s}
#catLF #catGo:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 10px 22px rgba(10,10,12,.28)}
#catLF #catGo:active:not(:disabled){transform:scale(.985)}
#catLF #catGo:disabled{background-image:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.28) 50%,transparent 70%);background-size:200% 100%;animation:btnLoad 1.1s linear infinite}
.cat-sw{transition:background .2s}.cat-sw:hover{background:#F6F7F9}
.cat-bio i{transition:transform .2s}.cat-bio:hover i{transform:scale(1.07)}
#catM:not([hidden]){animation:shake .4s}
@media(min-width:600px){
#catLogin::before,#catLogin::after{content:"";position:fixed;z-index:-1;width:520px;height:520px;border-radius:50%;filter:blur(90px);pointer-events:none}
#catLogin::before{left:-120px;top:-120px;background:rgba(28,75,156,.5);animation:blobA 14s ease-in-out infinite alternate}
#catLogin::after{right:-140px;bottom:-140px;background:rgba(255,200,61,.22);animation:blobB 17s ease-in-out infinite alternate}
}
@media(min-width:900px){
#catWelcome>*{animation:fadeUp .6s cubic-bezier(.2,.8,.2,1) both}
#catWelcome h1{animation-delay:.12s}#catWelcome p{animation-delay:.2s}
#catWelcome .cat-wlogo{position:relative;animation:logoPop .8s cubic-bezier(.34,1.56,.64,1) both}
#catWelcome .cat-wlogo::after{content:"";position:absolute;inset:-6px;border-radius:30px;border:2px solid rgba(255,200,61,.55);animation:ring 2.8s ease-out 1s infinite}
#catWelcome h1 .cat-gold{background:linear-gradient(90deg,#FFC83D,#FFF1B0,#FFC83D);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:shine 4.5s linear infinite}
.cat-stack{animation:none}
.cat-ph1{animation:phIn .9s cubic-bezier(.2,.8,.2,1) .25s both,phFloat 7s ease-in-out 1.3s infinite}
.cat-ph2{animation:phIn .9s cubic-bezier(.2,.8,.2,1) .4s both,phFloat 8s ease-in-out 1.6s infinite}
.cat-ph3{animation:phIn .9s cubic-bezier(.2,.8,.2,1) .55s both,phFloat 6.5s ease-in-out 1.9s infinite}
}
/* V4.44 : le texte de bienvenue ENTRE puis SORT en boucle (mot par mot) */
@keyframes txtCycle{0%{opacity:0;transform:translateY(20px);filter:blur(7px)}11%,84%{opacity:1;transform:none;filter:blur(0)}95%,100%{opacity:0;transform:translateY(-16px);filter:blur(7px)}}
@media(min-width:900px){
#catWelcome .cat-w{display:inline-block;animation:txtCycle 10s cubic-bezier(.4,0,.2,1) infinite backwards}
#catWelcome .cat-w:nth-child(1){animation-delay:.15s}#catWelcome .cat-w:nth-child(2){animation-delay:.23s}#catWelcome .cat-w:nth-child(3){animation-delay:.31s}#catWelcome .cat-w:nth-child(4){animation-delay:.39s}#catWelcome .cat-w:nth-child(5){animation-delay:.47s}
#catWelcome .cat-tp{display:block;animation:txtCycle 10s cubic-bezier(.4,0,.2,1) .7s infinite backwards}
}
@media(prefers-reduced-motion:reduce){#catLogin *,#catLogin::before,#catLogin::after{animation:none!important;transition:none!important}}
`;
    document.head.appendChild(s);
  }
  const welcomeHtml = () => `<aside id="catWelcome"><div class="cat-wlogo"><img src="logo-cat.png" alt="CAT"></div><h1><span class="cat-w">Bienvenue</span> <span class="cat-w">sur</span> <span class="cat-w"><span class="cat-gold">CAT</span></span> <span class="cat-w">by</span> <span class="cat-w">Manda</span></h1><p><span class="cat-tp">Fiche d'exploitation, relevés et appoints de la centrale (Henri Fraise Fils &amp; Cie, Mahanoro). Saisissez, validez et suivez tout en temps réel.</span></p>
    <div class="cat-stack"><div class="cat-ph cat-ph1"><img src="img-login-1.jpg" alt=""></div><div class="cat-ph cat-ph2"><img src="img-login-2.jpg" alt=""></div><div class="cat-ph cat-ph3"><img src="img-login-3.jpg" alt=""></div></div></aside>`;
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
    // V4.37 : synchroniser MA photo avec le serveur (le serveur gagne ; si le serveur est vide, on y envoie la photo de cet appareil), puis charger celles des autres.
    try {
      const q = await sb.from('profiles').select('avatar').eq('id', user.id).maybeSingle();
      if (q && !q.error && q.data) {
        const loc = avGet(), srv = q.data.avatar || '';
        if (srv && srv !== loc) { try { localStorage.setItem(avKey(), srv); } catch (e) {} renderAv(); window.dispatchEvent(new Event('cat-avatar')); }
        else if (!srv && loc) avPush(loc);
      }
    } catch (e) {}
    loadAvatars(); if (!window.CATavTimer) window.CATavTimer = setInterval(loadAvatars, 300000);
    const lg = document.getElementById('catLogin'); if (lg) lg.remove();
    try { sessionStorage.setItem('catUnlocked', user.id); } catch (e) {}   // un simple rechargement de la page ne redemande plus l'empreinte
    window.dispatchEvent(new Event('cat-ready'));
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
    try { sessionStorage.removeItem('catUnlocked'); } catch (e) {}
    css(); clearInterval(pt);
    overlay().innerHTML = `<div id="catLF"><div class="cat-hd"><div class="cat-logo"><img src="logo-cat.png" alt="CAT"></div></div><div class="cat-sheet"><h2>Application verrouillée</h2><button class="btn" id="catGo" type="button">${window.ICO('lock', 22)} Déverrouiller</button><div id="catM" hidden></div><button type="button" class="cat-sw" id="catOther">Se déconnecter / utiliser un autre compte</button></div></div>`;
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
    overlay().innerHTML = welcomeHtml() + `<form id="catLF">${up
        ? `<div class="cat-hd sm"><button type="button" class="cat-back" id="catBack" aria-label="Retour">${window.ICO('back', 22)}</button><div class="cat-htitle">Créer un compte</div></div><div class="cat-sheet">`
        : `${'<div class="cat-hd"><div class="cat-logo"><img src="logo-cat.png" alt="CAT"></div></div>'}<div class="cat-sheet"><h2>Bienvenue</h2><p class="cat-sub">Connectez-vous pour continuer.</p>`}
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
  async function logout() {
    try { sessionStorage.removeItem('catUnlocked'); } catch (e) {}
    // V4.39 : signOut peut rester bloque (autre onglet ouvert, reseau) : on attend 3 s au maximum, puis on supprime la session locale soi-meme.
    try { await Promise.race([sb.auth.signOut(), new Promise(r => setTimeout(r, 3000))]); } catch (e) {}
    try { Object.keys(localStorage).forEach(k => { if (/^sb-.*-auth-token/.test(k)) localStorage.removeItem(k); }); } catch (e) {}
    localStorage.removeItem('catProf'); localStorage.removeItem('catBio'); localStorage.removeItem('catBioNo'); location.reload(); }
  window.CATsb = sb;

  // ===== PROFIL (utilise par profil.js : « Mon profil ») =====
  const EMAIL_RE = /^[A-Za-z0-9._%+'\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}$/;
  const needNet = () => { if (!navigator.onLine) throw new Error('Pas de réseau : la modification nécessite internet.'); };
  const needMe = () => { if (!me) throw new Error('Connectez-vous d\'abord.'); };
  window.CATprofile = {
    me: () => me,
    prof: () => LS('catProf', null),
    avatar: avGet,
    setAvatar: avatarFromFile,
    delAvatar: () => { const k = avKey(); if (k) localStorage.removeItem(k); avPush(null); renderAv(); window.dispatchEvent(new Event('cat-avatar')); },
    async setName(nom) {
      needMe(); nom = String(nom || '').replace(/\s+/g, ' ').trim().slice(0, 60);
      if (nom.length < 2) throw new Error('Le nom est obligatoire.');
      needNet();
      const r = await sb.from('profiles').update({ nom }).eq('id', me.id).select('nom');
      if (r.error || !r.data || !r.data.length) throw new Error('Modification refusée par le serveur. Demandez au Chef d\'autoriser la modification du profil.');
      try { await sb.auth.updateUser({ data: { nom } }); } catch (e) {}
      const p = LS('catProf', null) || { id: me.id }; p.nom = nom; localStorage.setItem('catProf', JSON.stringify(p));
      renderAv(); window.dispatchEvent(new Event('cat-avatar'));
      return nom;
    },
    async setEmail(email) {
      needMe(); email = String(email || '').trim();
      if (!EMAIL_RE.test(email)) throw new Error('Adresse e-mail invalide.');
      if (FAKE.test(email)) throw new Error('Utilisez votre vraie adresse e-mail (ex. nom@gmail.com), pas une adresse d\'exemple.');
      if (me.email && email.toLowerCase() === me.email.toLowerCase()) throw new Error('C\'est déjà votre adresse e-mail.');
      needNet();
      const opt = /^https?:$/.test(location.protocol) ? { emailRedirectTo: location.origin + location.pathname } : {};
      const { error } = await sb.auth.updateUser({ email }, opt);
      if (error) throw new Error('Échec : ' + error.message);
    },
    async setPassword(cur, nw, nw2) {
      needMe();
      if (!cur) throw new Error('Entrez votre mot de passe actuel.');
      if (String(nw || '').length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
      if (nw !== nw2) throw new Error('Les deux mots de passe sont différents.');
      needNet();
      const t = await sb.auth.signInWithPassword({ email: me.email, password: cur });
      if (t.error) throw new Error('Mot de passe actuel incorrect.');
      const { error } = await sb.auth.updateUser({ password: nw });
      if (error) throw new Error('Échec : ' + error.message);
    },
    hasBio: () => !!bioGet(),
    lock: () => { if (bioGet() && me) lockUI(me); },
    logout
  };
  document.getElementById('cat-out').addEventListener('click', () => { logout(); });   // V4.39 : avant, avec l'empreinte activee, ce bouton ne faisait que verrouiller
  // Session conservee sur l'appareil : si getSession() echoue faute de reseau (jeton expire + pas d'internet), on garde l'utilisateur
  // connecte avec le profil memorise au lieu de renvoyer a l'ecran de connexion. Si la session a vraiment ete refusee, Supabase l'a deja effacee.
  function offlineUser() {
    try {
      const p = LS('catProf', null); if (!p || !p.approved) return null;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (/^sb-.+-auth-token$/.test(k)) { const v = JSON.parse(localStorage.getItem(k)); const u = v && (v.user || (v.currentSession && v.currentSession.user)); if (u && u.id === p.id) return u; }
      }
    } catch (e) {}
    return null;
  }
  window.addEventListener('online', async () => { try { await sb.auth.getSession(); } catch (e) {} sync(); });   // reseau revenu : renouvelle le jeton puis synchronise
  const { data } = await sb.auth.getSession();
  let sess = data && data.session;
  if (!sess && !recov) { const u = offlineUser(); if (u) sess = { user: u }; }
  if (recov && sess) return recoveryUI();
  if (sess) {
    const b = bioGet(), unlocked = (() => { try { return sessionStorage.getItem('catUnlocked') === sess.user.id; } catch (e) { return false; } })();
    if (b && b.uid === sess.user.id && !unlocked) lockUI(sess.user); else ready(sess.user);   // rechargement simple = pas de nouveau verrouillage
  } else loginUI();
});
