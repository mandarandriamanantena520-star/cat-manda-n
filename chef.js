// Côté Chef : Accueil, Validation des fiches, Rapports PPS/DPR (boîte d'envoi prête pour le serveur)
document.addEventListener('DOMContentLoaded', () => {
  const db = window.CATdb, root = document.getElementById('page-chef');
  if (!db || !root) return;
  const I = (n, s) => window.ICO(n, s);
  const C = Object.assign({ nom: [360, 400, 400], dispo: [288, 320, 320], dens: 830, cspMax: 250, manager: 'Jules RANDRIANARISOA', team: 12, sn: ['LNA04001', 'LNA03694', 'LXJ06933'], coef: [8, 1, 1], ptHist: 0, mailMap: { DPR: 'A', PPS: 'B' } }, JSON.parse(localStorage.getItem('chefCfg') || '{}'));
  const num = v => { const x = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(x) ? null : x; };
  const f = (v, d = 0) => (v == null || isNaN(v)) ? '' : (+v).toFixed(d);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const p2 = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  const ficheDay = () => { const d = new Date(); if (d.getHours() < 6) d.setDate(d.getDate() - 1); return iso(d); };
  const ST = { brouillon: 'Brouillon', soumise: 'Soumise', validee: 'Validée', retournee: 'Retournée' };
  let tab = 'accueil', rDate = ficheDay(), rType = 'PPS';

  // Calculs communs (mêmes formules que la fiche et que PPS/DPR)
  function calc(v) {
    const g = k => num(v[k]), G = [1, 2, 3].map(n => {
      const h = g('hm1_' + n) != null && g('hm0_' + n) != null ? g('hm1_' + n) - g('hm0_' + n) : null;
      const e = g('kwh1_' + n) != null && g('kwh0_' + n) != null ? g('kwh1_' + n) - g('kwh0_' + n) : null;
      const j = n < 3 && g('jir1_' + n) != null && g('jir0_' + n) != null ? (g('jir1_' + n) - g('jir0_' + n)) * (C.coef[n - 1] ?? 1) : null;
      const pj = n < 3 ? (j ?? e) : e, c = num(v['c_' + n]);   // PPS : compteur JIRAMA (G1 ×8), sinon EMCP
      return { n, h, e, pj, c, nom: C.nom[n - 1], dispo: C.dispo[n - 1],
        tc: (pj != null && h > 0) ? pj / h / C.nom[n - 1] : null, csp: (c != null && pj > 0) ? c * C.dens / pj : null };
    });
    const s = k => G.reduce((a, x) => a + (x[k] || 0), 0), tp = s('pj'), tc = s('c');
    return { G, tp, te: s('e'), tc, csp: tp > 0 ? tc * C.dens / tp : null };
  }
  const getFiche = d => db.fiches.where('date').equals(d).first();
  const prevDay = d => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() - 1); return iso(x); };
  const badge = s => `<span class="chef-b chef-${s}">${ST[s] || ST.brouillon}</span>`;
  const delta = (a, b) => (a == null || b == null || !b) ? '' : `<small class="chef-d">${a >= b ? '+' : ''}${f((a - b) / b * 100, 1)} % vs veille</small>`;


  // ---- Formats e-mail / rapports (cahier des charges 6.3) ----
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const frDate = s => { const [y, m, d] = String(s).split('-'); const mo = MOIS[+m - 1] || ''; return (+d) + ' ' + mo.charAt(0).toUpperCase() + mo.slice(1) + ' ' + y; };   // 20 Novembre 2026
  const nInt = x => (x == null || isNaN(x)) ? '' : String(Math.round(x));                                                       // 8208 (sans séparateur)
  const nCsp = x => (x == null || isNaN(x)) ? '' : (+x).toFixed(2).replace('.', ',');                                           // 214,07
  const maxP = v => { const a = [num(v.pt_j), num(v.pt_n)].filter(x => x != null); return a.length ? Math.max(...a) : null; };
  const histMax = async () => Math.max(num(C.ptHist) || 0, ...(await db.fiches.toArray()).map(x => maxP(x.vals) || 0));
  const saveCfg = () => localStorage.setItem('chefCfg', JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('chefCfg') || '{}'), { mailMap: C.mailMap, ptHist: C.ptHist })));
  function mailTpl(type, fi) {
    const v = fi.vals, k = calc(v), prof = JSON.parse(localStorage.getItem('catProf') || '{}'), sign = prof.nom || C.manager;
    const dEnv = frDate(iso(new Date())), dReal = frDate(fi.date), model = (C.mailMap || {})[type] || (type === 'DPR' ? 'A' : 'B');
    const six = (hm, pr, co, cs, pt, di) => `Heure de marche centrale : ${nInt(hm)} hrs\nProductions centrale thermique : ${nInt(pr)} kWh\nConsommation GO : ${nInt(co)} Litres\nCsp : ${nCsp(cs)} g/kWh\nPointe Max : ${nInt(pt)} kW\nPuissance disponible : ${nInt(di)} kW`;
    const subject = 'Situation centrale thermique Mahanoro et Vatomandry du ' + dEnv;
    if (model === 'B') return { model, subject, text: `Bonjour chef,\n\nVeuillez trouver ci-joint la DPR Mahanoro et Vatomandry du ${dReal}.\n\nSincères salutations\n${sign}` };
    const vp = num(v.vtm_prod), vc = num(v.vtm_conso), vcsp = num(v.vtm_csp) ?? ((vp > 0 && vc != null) ? vc * C.dens / vp : null);
    const mhr = six(num(v.hmc), k.tp, k.tc, k.csp, maxP(v), C.dispo.reduce((a, b) => a + b, 0));
    const vtm = six(num(v.vtm_hm), vp, vc, vcsp, num(v.vtm_pt), num(v.vtm_dispo));
    return { model, subject, text: `Chef bonjour,\n\nMerci de trouver ci-joint la situation de la centrale thermique Mahanoro et Vatomandry du ${dEnv}\nRéalisation du ${dReal}\n\nMHR\n${mhr}\n\nVTM\n${vtm}\n\nCordialement\n${sign}` };
  }


  // ===== Tableau de bord KPI (6.1) =====
  async function kpiHtml() {
    try {
      const cfg = window.CATcfg ? window.CATcfg() : {}, sg = num(cfg.seuilGo), cap = num(cfg.capCuve), now = Date.now(), td = iso(new Date());
      const rel = await db['relevés'].toArray(), tw = await db.travaux.toArray(), ap = await db.appoints.toArray(), tr = await db.transferts.toArray();
      const ts = r => new Date((r.date || '') + 'T' + (r.heure || '00:00')).getTime() || 0;
      const G = [1, 2, 3].map(n => { const g = 'G' + n, last = rel.filter(r => r.groupe === g).sort((a, b) => ts(b) - ts(a))[0];
        const run = !!last && num(last.rpm) > 0 && now - ts(last) < 3 * 3600e3, maint = !run && tw.some(t => t.groupe === g && t.date === td);
        return { g, etat: run ? 'En marche' : maint ? 'Maintenance' : "À l'arrêt", cls: run ? 'validee' : maint ? 'retournee' : 'soumise', niv: last ? num(last.gasoilLitres) : null, vu: last ? last.date + ' ' + (last.heure || '') : 'aucun relevé' }; });
      const ct = ap.concat(tr).filter(x => num(x.apCt) != null).sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.id - b.id).pop(), cuve = ct ? num(ct.apCt) : null;
      const stock = (cuve || 0) + G.reduce((s, x) => s + (x.niv || 0), 0), low = sg != null && (stock < sg || G.some(x => x.niv != null && x.niv < sg));
      const fiches = (await db.fiches.toArray()).sort((a, b) => a.date.localeCompare(b.date)), ym = td.slice(0, 7), mo = fiches.filter(x => x.date.slice(0, 7) === ym).map(x => calc(x.vals));
      const day = fiches.find(x => x.date === ficheDay()), kd = day ? calc(day.vals) : null, tpM = mo.reduce((s, k) => s + (k.tp || 0), 0), tcM = mo.reduce((s, k) => s + (k.tc || 0), 0);
      const last14 = fiches.slice(-14).map(x => ({ d: x.date.slice(8), k: calc(x.vals) }));
      const bars = (key, unit) => { const mx = Math.max(1, ...last14.map(w => w.k[key] || 0)); return `<div class="cd-card"><div class="cd-row"><b>${key === 'tp' ? 'Production' : 'Consommation'} — 14 jours</b><small>${unit}</small></div><div class="cd-bars">${last14.length ? last14.map(w => `<div><span style="height:${Math.max(4, Math.round((w.k[key] || 0) / mx * 100))}%"></span><small>${w.d}</small></div>`).join('') : '<small>Aucune donnée.</small>'}</div></div>`; };
      const al = (await db.alertes.toArray()).sort((a, b) => b.ts - a.ts).slice(0, 8), cs = (await db.consignes.toArray()).sort((a, b) => b.ts - a.ts).slice(0, 5);
      const fdt = t => new Date(t).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      return `<div class="cd-card"><b>État des groupes</b>${G.map(x => `<div class="cd-row"><span>${x.g} <small>· ${esc(x.vu)}${x.niv != null ? ' · ' + f(x.niv) + ' L' : ''}</small></span><span class="chef-b chef-${x.cls}">${x.etat}</span></div>`).join('')}</div>
        <div class="cd-card"><div class="cd-row"><b>Stock gasoil</b><span class="chef-b chef-${low ? 'retournee' : 'validee'}">${low ? 'Seuil bas' : 'OK'}</span></div>
        <div class="cd-big"><b>${f(stock)} <i>L</i></b><span>Cuve T${cuve != null ? ' ' + f(cuve) : ' —'} + groupes${sg != null ? ' · seuil ' + sg + ' L' : ''}${cap ? ' · cuve ' + Math.round((cuve || 0) / cap * 100) + ' %' : ''}</span></div></div>
        <div class="cd-grid"><div class="cd-tile"><b>${kd ? f(kd.tp) : '-'}</b><small>kWh du jour</small></div><div class="cd-tile"><b>${f(tpM)}</b><small>kWh du mois</small></div>
        <div class="cd-tile"><b>${tpM > 0 ? f(tcM * C.dens / tpM, 1) : '-'}</b><small>CSP moyenne (g/kWh)</small></div><div class="cd-tile"><b>${kd && kd.tc > 0 ? f(kd.tp / kd.tc, 2) : '-'}</b><small>Rendement (kWh/L)</small></div></div>
        ${bars('tp', 'kWh')}${bars('tc', 'L')}
        <div class="cd-card"><b>Fil d'alertes</b>${cs.map(c => `<div class="cd-msg" style="margin:6px 0"><b>Consigne</b> · ${fdt(c.ts)}<br>${esc(c.texte)} <button class="btn btn-black" data-cdel="${c.id}" style="padding:2px 8px">×</button></div>`).join('')}
        ${al.length ? al.map(x => `<div class="cd-row" style="align-items:flex-start"><span><b>${esc(x.groupe || '')}</b> <small>${fdt(x.ts)}${x.par ? ' · ' + esc(x.par) : ''}</small><br>${esc(x.texte)}</span></div>`).join('') : '<small>Aucune alerte remontée.</small>'}
        <label>Publier une consigne prioritaire</label><textarea id="kg-txt" rows="2"></textarea><div class="chef-actions"><button class="btn btn-yellow" data-act="consigne">Publier</button></div></div>`;
    } catch (e) { return ''; }
  }

  async function accueil() {
    const d = ficheDay(), fi = await getFiche(d), pv = await getFiche(prevDay(d));
    const all = await db.fiches.toArray(), att = all.filter(x => (x.statut || 'soumise') === 'soumise').length;
    const k = fi ? calc(fi.vals) : null, kp = pv ? calc(pv.vals) : null, al = [];
    if (!fi) al.push('La fiche du ' + d + " n'est pas encore enregistrée.");
    if (k && k.csp > C.cspMax) al.push('CSP élevé : ' + f(k.csp) + ' g/kWh (seuil ' + C.cspMax + ').');
    if (att) al.push(att + ' fiche(s) en attente de validation.');
    try { if (window.CATsb) { const r = await window.CATsb.from('profiles').select('id', { count: 'exact', head: true }).eq('approved', false); if (r.count) al.push(r.count + ' compte(s) en attente de validation (onglet Compte).'); } } catch (e) {}
    const stk = fi ? ['pgT_ap'].map(x => num(fi.vals[x])) : [];
    const week = all.slice().sort((x, y) => x.date.localeCompare(y.date)).slice(-7).map(x => ({ d: x.date.slice(8), v: calc(x.vals).tp || 0 })), mx = Math.max(1, ...week.map(w => w.v));
    const prof = JSON.parse(localStorage.getItem('catProf') || '{}'), im = (window.CATavatarGet && window.CATavatarGet()) || '', h = new Date().getHours();
    const tile = (ic, lab, val, dl) => `<div class="cd-tile"><span class="cd-ic">${I(ic, 20)}</span><b>${val}</b><small>${lab}</small>${dl || ''}</div>`;
    const hide = localStorage.getItem('catHideProd') === '1', prodTxt = k ? f(k.tp) : '-';
    const rays = [-72, -36, 0, 36, 72, 108].map((r, i) => `<rect x="-8" y="-70" width="16" height="44" rx="8" fill="url(#bnG${i % 2})" opacity="${i % 2 ? .75 : .9}" transform="rotate(${r})"/>`).join('');
    return `<div class="cd-hero"><div class="hc-top"><div class="cd-av hc-ic" style="${im ? `background-image:url(${im})` : ''}">${im ? '' : esc(String(prof.nom || 'C').slice(0, 1).toUpperCase())}</div>
        <div class="hc-t"><b>${h < 18 ? 'Bonjour' : 'Bonsoir'} ${esc(prof.nom || 'Chef')}</b><span>Fiche du ${d}</span></div>
        <button type="button" class="hc-print" data-go="rapports" aria-label="Rapports">${I('file', 24)}</button></div>
      <div class="hc-lab">Production du jour ${fi ? badge(fi.statut || 'soumise') : ''}</div>
      <div class="hc-val"><b id="hc-prod" data-v="${prodTxt}">${hide ? '******' : prodTxt}</b><i>kWh</i><button type="button" class="hc-eye" data-act="eye" aria-label="Afficher ou masquer">${I(hide ? 'eyeoff' : 'eye', 22)}</button></div>
      <button type="button" class="hc-go" data-go="validation" aria-label="Valider les fiches">${I('next', 20)}${att ? `<em>${att}</em>` : ''}</button></div>
      <div class="cd-nav">${[['validation', 'Fiches', 'list'], ['rapports', 'Rapports', 'file'], ['calendrier', 'Quart', 'calendar'], ['employes', 'Employés', 'users'], ['equipe', 'Compte', 'shield']].map(([k, l, ic]) => `<button type="button" class="cd-nt" data-go="${k}">${I(ic, 40)}<span>${l}</span></button>`).join('')}</div>
      <div class="cd-banner"><div class="bn-txt"><div><b>CAT by Manda</b><p>VOTRE SUIVI D'EXPLOITATION<br>À CHAQUE INSTANT</p></div><div class="bn-foot"><img src="logo-cat.png" alt=""><small>Mahanoro Power System<br>Henri Fraise Fils &amp; Cie</small></div></div>
        <svg class="bn-rays" viewBox="0 0 170 150" aria-hidden="true"><defs><linearGradient id="bnG0" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFC20E"/><stop offset="1" stop-color="#FF7A59"/></linearGradient><linearGradient id="bnG1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7DE3FF"/><stop offset="1" stop-color="#2F7BFF"/></linearGradient><clipPath id="bnClip"><circle cx="0" cy="0" r="33"/></clipPath></defs>
          <g transform="translate(100 76)">${rays}<circle r="37" fill="#fff"/><image href="logo-cat.png" x="-33" y="-33" width="66" height="66" clip-path="url(#bnClip)" preserveAspectRatio="xMidYMid slice"/></g></svg></div>
      <div class="cd-grid">${tile('fuel', 'Consommation (L)', k ? f(k.tc) : '-', k && kp ? delta(k.tc, kp.tc) : '')}${tile('calc', 'CSP (g/kWh)', k ? f(k.csp) : '-', k && kp ? delta(k.csp, kp.csp) : '')}
        ${tile('alert', 'Pointe jour (kW)', fi ? esc(fi.vals.pt_j || '-') : '-')}${tile('alert', 'Pointe nuit (kW)', fi ? esc(fi.vals.pt_n || '-') : '-')}</div>
      <div class="cd-card"><div class="cd-row"><b>Production — 7 derniers jours</b><small>kWh</small></div>
        <div class="cd-bars">${week.length ? week.map(w => `<div><span style="height:${Math.max(4, Math.round(w.v / mx * 100))}%"></span><small>${w.d}</small></div>`).join('') : '<small>Aucune donnée.</small>'}</div></div>
      ${al.length ? `<div class="cd-msg"><b>${I('alert', 16)} À surveiller</b>${al.map(x => `<div>${esc(x)}</div>`).join('')}</div>` : `<div class="chef-ok">${I('check', 16)} Rien à signaler.</div>`}
      ${await kpiHtml()}`;
  }

  async function calendrier() {
    const list = (window.CATrosterList ? window.CATrosterList() : []), today = new Date(), p = window.CATplanFor(today), sw = (window.CATswaps ? window.CATswaps() : []).filter(x => x.date >= iso(today)).sort((a, b) => a.date.localeCompare(b.date));
    const sc = window.CATsched(today), fd = v => String(v).split('-').reverse().join('/');
    return `<h2>${I('users', 22)} Planning de quart</h2><p class="chef-sub">Chaque modification s'applique à partir de sa date d'effet ; le passé n'est jamais réécrit. Tous les agents voient le résultat.</p>
      ${list.map(r => `<div class="chef-card chef-row"><span><b>Dès le ${r.from === '1900-01-01' ? 'début' : fd(r.from)}</b><br><small>${esc((r.agents || []).join(' → '))}${r.postes ? ' · ' + r.postes.map(x => esc(x.nom) + ' ' + x.debut + '–' + x.fin).join(', ') : ''}</small></span>${r.id ? `<button class="btn btn-black" data-rdel="${r.id}">Suppr.</button>` : ''}</div>`).join('')}
      <div class="chef-card"><b>Nouveau plan / modifier</b>
      <label>Date d'effet</label><input type="date" id="ro-from" value="${iso(today)}">
      <label>Agents (un nom par ligne, dans l'ordre de rotation)</label><textarea id="ro-ag" rows="5">${esc(p.agents.join('\n'))}</textarea>
      <label>Postes — une ligne : nom ; début ; fin (un poste peut passer minuit)</label><textarea id="ro-po" rows="4">${esc(p.postes.map(x => x.nom + ' ; ' + x.debut + ' ; ' + x.fin).join('\n'))}</textarea>
      <div class="chef-actions"><button class="btn btn-black" data-act="impagents">Importer les agents actifs (dossiers employés)</button><button class="btn btn-black" data-act="presetpostes">Postes par défaut (3 postes)</button></div>
      <label>Jour de départ du cycle</label><input type="date" id="ro-start" value="${esc(p.start)}">
      <label>Pas de rotation (décalage de la file d'agents chaque jour ; = nombre de postes par défaut)</label><input type="number" id="ro-step" min="1" value="${p.step}">
      <label>Jours bloqués (JJ/MM, un par ligne)</label><textarea id="ro-bl" rows="3">${esc(p.bloques.map(b => p2(b.d) + '/' + p2(b.m + 1)).join('\n'))}</textarea>
      <div class="chef-actions"><button class="btn btn-yellow" data-act="roster">Appliquer</button></div></div>
      <div class="chef-card"><b>Modifier un jour précis / échanger deux agents</b>
      <label>Date</label><input type="date" id="sw-d" value="${iso(today)}">
      <label>Poste</label><select id="sw-p">${p.postes.map((x, k) => `<option value="${k}">${esc(x.nom)} ${x.debut}–${x.fin}</option>`).join('')}</select>
      <label>Agent</label><select id="sw-a">${p.agents.map(a => `<option>${esc(a)}</option>`).join('')}</select>
      <label>Échange avec le poste (facultatif)</label><select id="sw-p2"><option value="">—</option>${p.postes.map((x, k) => `<option value="${k}">${esc(x.nom)}</option>`).join('')}</select>
      <div class="chef-actions"><button class="btn btn-yellow" data-act="swap">Appliquer</button></div>
      ${sw.length ? sw.map(x => `<div class="chef-row" style="margin-top:6px"><span><b>${fd(x.date)}</b> · ${esc(((window.CATplanFor(new Date(x.date + 'T00:00:00')).postes[x.poste]) || {}).nom || '')} → ${esc(x.agent)}<br><small>par ${esc(x.by || 'Chef')} le ${new Date(x.at).toLocaleString('fr-FR')}</small></span><button class="btn btn-black" data-swdel="${x.id}">Suppr.</button></div>`).join('') : ''}</div>`;
  }


  // ===== Dossiers employés (6.1) =====
  // `employes` : identité de base (nom, poste, statut, avatar) — synchronisée, lisible par les agents.
  // `employes_rh` : CIN, photos CIN, naissance, téléphone, adresse, CNaPS — STOCKAGE LOCAL au Chef, jamais synchronisé.
  let empMode = 'list', empId = null, empImg = {};
  const POSTES = ['Agent de quart', 'Mécanicien', 'Électricien', 'Chef'], STATUTS = ['actif', 'en congé', 'inactif'];
  const uid8 = () => Math.random().toString(36).slice(2, 10);
  const initials = e => esc(((e.prenoms || e.nom || '?').trim()[0] || '?').toUpperCase());
  const short = e => ((e.prenoms || '').trim().split(/\s+/)[0]) || e.nom;           // nom affiché dans le planning
  const isMe = (a, e) => (String(e.prenoms || '') + ' ' + String(e.nom || '')).toLowerCase().split(/\s+/).includes(String(a).toLowerCase());
  function empStatus(e) {
    if (e.statut === 'inactif') return 'Inactif';
    const sc = window.CATsched ? window.CATsched(new Date()) : null;
    if (sc && sc.conge.some(a => isMe(a, e))) return 'En congé';
    if (sc && sc.slots.some(x => isMe(x.agent, e))) return 'De quart';
    return e.statut === 'en congé' ? 'En congé' : 'Repos';
  }
  const compress = (file, max, q) => new Promise((res, rej) => { const r = new FileReader(); r.onerror = rej; r.onload = () => { const im = new Image(); im.onerror = rej; im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', q)); }; im.src = r.result; }; r.readAsDataURL(file); });
  const avatar = (e, sz = 48) => `<span class="cd-av" style="width:${sz}px;height:${sz}px;${e.avatar ? `background-image:url(${e.avatar})` : ''}">${e.avatar ? '' : initials(e)}</span>`;
  const getRh = uid => db.employes_rh.where('uid').equals(uid).first();
  async function employes() {
    const all = (await db.employes.toArray()).sort((a, b) => String(a.nom).localeCompare(String(b.nom)));
    if (empMode === 'form') {
      const e = empId ? await db.employes.get(empId) : {}, r = (e && e.uid ? await getRh(e.uid) : null) || {};
      empImg = { avatar: e.avatar || '', cinRecto: r.cinRecto || '', cinVerso: r.cinVerso || '' };
      const inp = (k, l, v, t = 'text') => `<label>${l}</label><input data-e="${k}" type="${t}" value="${esc(v ?? '')}">`;
      const pv = (k, l) => `<label>${l}</label><div class="chef-actions"><input type="file" accept="image/*" data-img="${k}"><img id="pv-${k}" src="${empImg[k]}" style="max-width:120px;max-height:80px;border-radius:6px;${empImg[k] ? '' : 'display:none'}"></div>`;
      return `<h2>${empId ? 'Modifier' : 'Nouvel'} employé</h2><div class="chef-card">${pv('avatar', 'Photo de profil')}${inp('nom', 'Nom', e.nom)}${inp('prenoms', 'Prénoms', e.prenoms)}
        <label>Poste</label><select data-e="poste">${POSTES.map(p => `<option ${e.poste === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
        <label>Statut</label><select data-e="statut">${STATUTS.map(p => `<option ${(e.statut || 'actif') === p ? 'selected' : ''}>${p}</option>`).join('')}</select>${inp('embauche', "Date d'embauche", e.embauche, 'date')}
        <b style="display:block;margin-top:10px">Données personnelles (restent sur cet appareil)</b>
        ${inp('naissance', 'Date de naissance', r.naissance, 'date')}${inp('lieu', 'Lieu de naissance', r.lieu)}${inp('tel', 'Téléphone / WhatsApp', r.tel, 'tel')}${inp('adresse', 'Adresse', r.adresse)}
        ${inp('cin', 'N° CIN', r.cin)}${inp('cinDate', 'CIN délivrée le', r.cinDate, 'date')}${inp('cinLieu', 'CIN délivrée à', r.cinLieu)}${pv('cinRecto', 'Photo CIN recto')}${pv('cinVerso', 'Photo CIN verso')}${inp('cnaps', 'N° CNaPS / autres références', r.cnaps)}
        <div class="chef-actions"><button class="btn btn-yellow" data-act="empsave">Enregistrer</button><button class="btn btn-black" data-act="empback">Annuler</button></div></div>`;
    }
    if (empMode === 'view') {
      const e = await db.employes.get(empId); if (!e) { empMode = 'list'; return employes(); }
      const r = (await getRh(e.uid)) || {}, fd = v => v ? String(v).split('-').reverse().join('/') : '—', row = (l, v) => `<tr><td style="text-align:left;font-weight:700">${l}</td><td style="text-align:left">${esc(v || '—')}</td></tr>`;
      return `<div class="chef-actions"><button class="btn btn-black" data-act="empback">← Retour</button><button class="btn btn-black" data-act="empedit" data-id="${e.id}">Modifier</button><button class="btn btn-black" data-act="empprint">Imprimer / PDF</button><button class="btn btn-black" data-act="empdel" data-id="${e.id}">Supprimer</button></div>
        <div id="chef-print" class="chef-card"><div class="chef-row"><span style="display:flex;gap:10px;align-items:center">${avatar(e, 64)}<span><b style="font-size:18px">${esc(e.nom)} ${esc(e.prenoms || '')}</b><br><small>${esc(e.poste || '')} · ${esc(e.statut || 'actif')} · ${empStatus(e)}</small></span></span></div>
        <table class="chef-t" style="margin-top:8px">${row("Date d'embauche", fd(e.embauche))}${row('Né(e) le', fd(r.naissance) + (r.lieu ? ' à ' + r.lieu : ''))}${row('Téléphone / WhatsApp', r.tel)}${row('Adresse', r.adresse)}${row('N° CIN', r.cin)}${row('CIN délivrée', (r.cinDate ? 'le ' + fd(r.cinDate) : '') + (r.cinLieu ? ' à ' + r.cinLieu : ''))}${row('N° CNaPS / références', r.cnaps)}</table>
        <div class="chef-actions" style="margin-top:8px">${r.cinRecto ? `<img src="${r.cinRecto}" style="max-width:48%;border-radius:6px">` : ''}${r.cinVerso ? `<img src="${r.cinVerso}" style="max-width:48%;border-radius:6px">` : ''}</div></div>`;
    }
    return `<h2>${I('users', 22)} Employés</h2><div class="chef-actions"><button class="btn btn-yellow" data-act="empnew">+ Nouvel employé</button></div>
      ${all.length ? `<div class="cd-grid">${all.map(e => `<button type="button" class="cd-tile" data-act="empview" data-id="${e.id}" style="text-align:center">${avatar(e, 56)}<b>${esc(short(e))}</b><small>${esc(e.poste || '')}</small><span class="chef-b chef-${empStatus(e) === 'De quart' ? 'validee' : empStatus(e) === 'En congé' ? 'retournee' : 'soumise'}">${empStatus(e)}</span></button>`).join('')}</div>` : '<p class="chef-sub">Aucun employé enregistré.</p>'}`;
  }

  async function validation() {
    const rows = (await db.fiches.toArray()).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
    return `<h2>Validation des fiches</h2>` + (rows.length ? rows.map(r => {
      const k = calc(r.vals), st = r.statut || 'soumise';
      return `<div class="chef-card"><div class="chef-row"><b>${r.date}</b>${badge(st)}</div>
        <div class="chef-sub">Prod ${f(k.tp)} kWh · Conso ${f(k.tc)} L · CSP ${f(k.csp)} g/kWh</div>${r.note ? `<div class="chef-note">${esc(r.note)}</div>` : ''}
        <div class="chef-actions"><button class="btn btn-black" data-open="${r.date}">Ouvrir</button>
        <button class="btn btn-yellow" data-st="validee" data-id="${r.id}">${I('check', 16)} Valider</button>
        <button class="btn btn-black" data-st="retournee" data-id="${r.id}">Retourner</button></div></div>`;
    }).join('') : '<p class="chef-sub">Aucune fiche enregistrée.</p>');
  }

  // ===== PPS : reproduction du modèle Excel « POWER PLANT STATUS » (paysage) =====
  async function ppsHtml(fi) {
    const v = fi.vals, k = calc(v), G = k.G, H = await histMax(), fr = d => d.split('-').reverse().join('/');
    const nf = (x, d = 0) => (x == null || isNaN(x)) ? '' : Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/\u202f|\u00a0/g, ' ');
    const sum = a => a.reduce((s, x) => s + (x || 0), 0), raw = key => esc(v[key] ?? '');
    const jirOn = n => n < 3 && num(v['jir0_' + n]) != null && num(v['jir1_' + n]) != null;
    const c0 = n => jirOn(n) ? num(v['jir0_' + n]) : num(v['kwh0_' + n]), c1 = n => jirOn(n) ? num(v['jir1_' + n]) : num(v['kwh1_' + n]);
    const rows = G.map(x => `<tr><td class="l tt">GE${x.n}</td><td>${esc(C.sn[x.n - 1] || '')}</td><td>C15</td><td>${x.nom}</td><td>${x.dispo}</td><td>${nf(num(v['hm0_' + x.n]), 1)}</td><td>${nf(num(v['hm1_' + x.n]), 1)}</td><td>${nf(x.h, 1)}</td><td>${nf(c0(x.n))}</td><td>${nf(c1(x.n))}</td><td class="tt">${nf(x.pj)}</td><td>${nf(x.c)}</td><td>${nf(x.csp, 2)}</td><td>${x.tc != null ? nf(x.tc * 100, 0) + ' %' : ''}</td></tr>`).join('');
    const tot = `<tr class="tt"><td class="l">TOTAL</td><td></td><td></td><td>${sum(C.nom)}</td><td>${sum(C.dispo)}</td><td></td><td></td><td>${nf(sum(G.map(x => x.h)), 1)}</td><td></td><td></td><td>${nf(k.tp)}</td><td>${nf(k.tc)}</td><td>${nf(k.csp, 2)}</td><td></td></tr>`;
    // PV
    const pvE = (num(v.pv_c1) != null && num(v.pv_c0) != null) ? num(v.pv_c1) - num(v.pv_c0) : null, pen = (pvE != null && (k.tp + pvE) > 0) ? pvE / (k.tp + pvE) * 100 : null;
    const pv = `<table style="margin-top:4px"><tr class="tt"><td class="l" colspan="7">PV (PHOTOVOLTAÏQUE)</td></tr><tr class="tt"><td>Puissance installée (kW)</td><td>Début production</td><td>Fin production</td><td>Compteur début</td><td>Compteur fin</td><td>Énergie produite (kWh)</td><td>Taux de pénétration</td></tr>
      <tr><td>${raw('pv_pi')}</td><td>${raw('pv_h0')}</td><td>${raw('pv_h1')}</td><td>${raw('pv_c0')}</td><td>${raw('pv_c1')}</td><td>${nf(pvE)}</td><td>${pen != null ? nf(pen, 1) + ' %' : ''}</td></tr></table>`;
    const pts = `<table style="margin-top:4px"><tr class="pt"><td class="l">POINTE JOUR : ${raw('pt_j')} kW</td><td>GE en service : ${raw('ge_j')}</td><td class="l">POINTE NUIT : ${raw('pt_n')} kW</td><td>GE en service : ${raw('ge_n')}</td><td class="l">HEURE DE MARCHE CENTRALE : ${raw('hmc')}</td></tr>
      <tr class="pt"><td class="l" colspan="5">POINTE MAX ENREGISTRÉE DEPUIS LA MISE EN SERVICE : ${H ? nf(H) + ' kW' : ''}</td></tr></table>`;
    // Tableaux à lignes libres : « début ; fin ; puissance ; commentaires »
    const free = (key, title, third) => { const L = String(v[key] || '').split('\n').map(x => x.trim()).filter(Boolean).map(x => x.split(';').map(y => esc(y.trim()))); while (L.length < 3) L.push([]);
      return `<table style="margin-top:4px"><tr class="tt"><td class="l" colspan="4">${title}</td></tr><tr class="tt"><td>Heure début</td><td>Heure fin</td><td>${third}</td><td>Commentaires</td></tr>${L.map(r => `<tr><td>${r[0] || '&nbsp;'}</td><td>${r[1] || ''}</td><td>${r[2] || ''}</td><td class="l">${r[3] || ''}</td></tr>`).join('')}</table>`; };
    return DPR_CSS + `<div class="dpr"><table class="hd"><tr><td rowspan="3" class="brand">HENRI FRAISE FILS &amp; Cie<br><b>Power Systems</b></td><td rowspan="3" class="cat">CAT</td><td rowspan="3" class="ttl">POWER PLANT STATUS</td>
      <td class="l">Date rapport</td><td class="l">${fr(iso(new Date()))}</td><td class="l">Centrale</td><td class="l"><b>MAHANORO</b></td></tr>
      <tr><td class="l">Responsable</td><td class="l">${esc(C.manager)}</td><td class="l">Préparé par</td><td class="l">${esc(C.manager)}</td></tr>
      <tr><td class="l">Réalisation du</td><td class="l">${fr(fi.date)}</td><td colspan="2"></td></tr></table>
      <table style="margin-top:4px"><tr class="tt"><td>Groupe</td><td>S/N</td><td>Modèle</td><td>P nominale (kW)</td><td>P disponible (kW)</td><td>CTR horaire J-1</td><td>CTR horaire J</td><td>H marche</td><td>Compteur énergie 06h00 J-1</td><td>Compteur énergie 06h00 J</td><td>Production (kWh)</td><td>Conso GO (L)</td><td>CSP (g/kWh)</td><td>Taux de charge</td></tr>${rows}${tot}</table>
      <div style="font-size:9px;margin:2px 0">Production = différence des compteurs × coefficient (JIRAMA : ${C.coef.map((c, i) => 'GE' + (i + 1) + ' ×' + c).join(', ')}) ; sans index JIRAMA, index EMCP.</div>
      ${pv}${pts}${free('dl_tech', 'DÉLESTAGE TECHNIQUE', 'Puissance (kW)')}${free('dl_eco', 'DÉLESTAGE ÉCONOMIQUE', 'Puissance (kW)')}${free('dl_dg', 'DÉCLENCHEMENT GÉNÉRAL', 'Durée')}</div>`;
  }
  // ===== DPR : reproduction de la fiche papier « DAILY PRODUCTION REPORT » (format paysage) =====
  const DPR_CSS = `<style>
.dpr{font:11px/1.25 Arial,Helvetica,sans-serif;color:#000;background:#fff;min-width:760px}
.dpr table{border-collapse:collapse;width:100%}.dpr td,.dpr th{border:1px solid #444;padding:2px 5px;text-align:center;font-weight:400;vertical-align:middle}
.dpr .l{text-align:left}.dpr .sec td{background:#d9d9d9;font-weight:700;text-align:left}.dpr .u{width:62px}.dpr .n{font-variant-numeric:tabular-nums}
.dpr .tt{font-weight:700;background:#f2f2f2}.dpr .hd td{border:1px solid #444}
.dpr .brand{background:#f7a600;font-weight:700;text-align:left;width:190px}.dpr .brand b{color:#c00}.dpr .cat{background:#000;color:#ffcd11;font:900 20px Arial;width:54px}
.dpr .ttl{font-weight:700;font-size:13px}.dpr .rd{background:#fde0e0}.dpr .obs{height:46px;text-align:left;vertical-align:top;white-space:pre-wrap}
.dpr .pt td{font-weight:700}
</style>`;
  async function monthSums(fi) {
    const ym = fi.date.slice(0, 7), out = [0, 0, 0], outP = [0, 0, 0], outC = [0, 0, 0];
    (await db.fiches.toArray()).filter(x => x.date.slice(0, 7) === ym && x.date <= fi.date).forEach(x => {
      calc(x.vals).G.forEach((g, i) => { out[i] += g.e || 0; outP[i] += g.pj || 0; outC[i] += g.c || 0; });
    });
    return { e: out, pj: outP, c: outC };
  }
  async function dprHtml(fi) {
    const v = fi.vals, k = calc(v), M = await monthSums(fi), G = k.G, n0 = x => (x == null || isNaN(x)) ? '' : x;
    const nf = (x, d = 0) => (x == null || isNaN(x)) ? '' : Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/\u202f|\u00a0/g, ' ');
    const raw = key => esc(v[key] ?? '');
    const sum = a => a.reduce((s, x) => s + (x || 0), 0), any = a => a.some(x => x != null);
    const d1 = (() => { const x = new Date(fi.date + 'T00:00:00'); x.setDate(x.getDate() + 1); return iso(x); })();
    const fr = d => d.split('-').reverse().join('/');
    const R = (lab, unit, cells, tot, cls = '') => `<tr class="${cls}"><td class="l">${lab}</td><td class="u">${unit}</td>${cells.map(c => `<td class="n">${c}</td>`).join('')}<td class="n tt">${tot ?? ''}</td></tr>`;
    const S = t => `<tr class="sec"><td colspan="6">${t}</td></tr>`;
    const hrs = G.map(x => x.h), eP = G.map(x => x.e), pj = G.map(x => x.pj), cc = G.map(x => x.c);
    const qTr = [1, 2, 3, 4, 5, 6].reduce((s, i) => s + (num(v['tr' + i + '_qte']) || 0), 0);
    const tot = sum(pj), totC = sum(cc), te = sum(eP);
    const eff = G.map(x => (x.c > 0 && x.pj != null) ? x.pj / x.c : null);
    const gm = G.map(x => x.csp);
    const jirOn = n => n < 3 && num(v['jir0_' + n]) != null && num(v['jir1_' + n]) != null;
    const acc0 = [1, 2, 3].map(n => jirOn(n) ? num(v['jir0_' + n]) : num(v['kwh0_' + n]));
    const acc1 = [1, 2, 3].map(n => jirOn(n) ? num(v['jir1_' + n]) : num(v['kwh1_' + n]));
    const X = i => [1, 2, 3].map(n => raw('x' + i + '_' + n)), L = pre => [1, 2, 3].map(n => raw(pre + n));
    const dayH = [1, 2, 3].map(n => hrs[n - 1] != null ? nf((hrs[n - 1] || 0) + (num(v['x2_' + n]) || 0) + (num(v['x3_' + n]) || 0) + (num(v['x4_' + n]) || 0), 1) : '');
    const lube = [1, 2, 3].map(n => num(v['lube_' + n])), tch = G.map(x => x.tc != null ? x.tc * 100 : null), cspH = [1, 2, 3].map(n => (lube[n - 1] != null && hrs[n - 1] > 0) ? lube[n - 1] / hrs[n - 1] : null);
    const aux0 = num(v.aux0), aux1 = num(v.aux1), auxC = (aux0 != null && aux1 != null) ? aux1 - aux0 : null, auxP = (auxC != null && te > 0) ? auxC / te * 100 : null;
    const obsTxt = [v.obs, v.trav].filter(x => x && String(x).trim()).map(esc).join('\n');
    return DPR_CSS + `<div class="dpr">
<table class="hd"><tr><td rowspan="3" class="brand">HENRI FRAISE FILS &amp; Cie<br><b>Power Systems</b></td><td rowspan="3" class="cat">CAT</td>
 <td rowspan="2" class="ttl">DAILY PRODUCTION REPORT</td><td class="l">Power plant</td><td class="l"><b>MAHANORO</b></td><td class="l">Prepared</td><td class="l">${esc(C.manager)}</td></tr>
 <tr><td class="l">Power plant Manager</td><td class="l">${esc(C.manager)}</td><td class="l">Approved</td><td class="l">${esc(C.manager)}</td></tr>
 <tr><td>From 06h00' on ${fr(fi.date)} TO 06h00' on ${fr(d1)}</td><td class="l">Team size</td><td class="l">${esc(C.team)}</td><td class="l">Report date</td><td class="l">${fr(fi.date)}</td></tr></table>
<table>
<tr class="tt"><td class="l">PLANT PARAMETERS</td><td class="u">UNITS</td><td>GE # 1</td><td>GE # 2</td><td>GE # 3</td><td>TOTAL</td></tr>
${R('Engine model', 'Number', ['C15', 'C15', 'C15'], '')}
${R('Generator rated capacity', 'KW', C.nom, sum(C.nom))}
${R('Generator available capacity', 'KW', C.dispo, sum(C.dispo))}
${S('PLANT OPERATION')}
${R('Hour Meter Reading at Start', 'Hrs Mns', [1, 2, 3].map(n => raw('hm0_' + n)), '')}
${R('Hour Meter Reading at End', 'Hrs Mns', [1, 2, 3].map(n => raw('hm1_' + n)), '')}
${R('Engine running hours (X1) Actual', 'Hrs Mns', hrs.map(x => nf(x, 1)), any(hrs) ? nf(sum(hrs), 1) : '')}
${R('Noload Outage Hours (X2)', 'Hrs Mns', X(2), nf(sum(X(2).map(num))) )}
${R('Scheduled Outage Hours (X3)', 'Hrs Mns', X(3), nf(sum(X(3).map(num))))}
${R('Forced Outage Hours (X4)', 'Hrs Mns', X(4), nf(sum(X(4).map(num))))}
${R('Day Hours-Accountable (X1+X2+X3+X4)', 'Hrs Mns', dayH, any(dayH.map(num)) ? nf(sum(dayH.map(num)), 1) : '')}
${S('POWER PRODUCTION - ACTUAL')}
${R('Energy Meter Reading at Start', 'KWH', [1, 2, 3].map(n => nf(num(v['kwh0_' + n]))), '')}
${R('Energy Meter Reading at End', 'KWH', [1, 2, 3].map(n => nf(num(v['kwh1_' + n]))), '')}
${R('Power production - Today', 'KWH', eP.map(x => nf(x)), any(eP) ? nf(te) : '')}
${R('Power Production - monthly', 'KWH', M.e.map(x => nf(x)), nf(sum(M.e)))}
${R('Power Production - Commulative', 'KWH', [1, 2, 3].map(n => nf(num(v['kwh1_' + n]))), '')}
${S('FUEL AND OIL CONSUMPTION')}
${R('Gas Oil Consumption - Actual', 'Ltr', cc.map(x => nf(x)), any(cc) ? nf(totC) : '')}
${R('Fuel flow meter at Start', 'Ltr', L('db0_'), '')}
${R('Fuel flow meter at End', 'Ltr', L('db1_'), '')}
${R('Lube Oil Consumption', 'Ltr', lube.map(x => nf(x, 1)), lube.some(x => x != null) ? nf(sum(lube), 1) : '')}
${S('FUEL EFFICIENCY (Density ' + C.dens + ')')}
${R('Actual', 'Units/Ltr', eff.map(x => nf(x, 1)), totC > 0 ? nf(te / totC, 1) : '')}
${R('', 'gm/unit', gm.map(x => nf(x, 1)), k.csp != null ? nf(k.csp, 1) : '')}
${R('Load factor', '%', tch.map(x => nf(x, 0)), '')}
${R('Lube oil consumption rate', 'Ltr/Hr', cspH.map(x => nf(x, 2)), '')}
${S('POWER PRODUCTION - ACCOUNTABLE')}
${R('Energy Meter Reading at Start', 'KWH', acc0.map(x => nf(x)), '')}
${R('Energy Meter Reading at End', 'KWH', acc1.map(x => nf(x)), '')}
${R('Power production - Today', 'KWH', pj.map(x => nf(x)), any(pj) ? nf(tot) : '', 'tt')}
${R('Power Production - monthly', 'KWH', M.pj.map(x => nf(x)), nf(sum(M.pj)))}
${R('Écart actual − accountable (règle des coefficients)', 'KWH', ['', '', ''], any(eP) && any(pj) ? nf(te - tot) : '')}
${S('AUXILIARY POWER CONSUMPTION')}
${R('Auxiliary meter at Start', 'KWH', [raw('aux0'), '', ''], '')}
${R('Auxiliary meter at End', 'KWH', [raw('aux1'), '', ''], '')}
${R('Auxiliary consumption / % of production', 'KWH', [nf(auxC), auxP != null ? nf(auxP, 2) + ' %' : '', ''], raw('auxcum'))}
${S('FUEL EFFICIENCY (Density ' + C.dens + ') gram / Ltr')}
${R('Power plant fuel consumption', 'Liters', ['', '', ''], any(cc) ? nf(totC) : '')}
${R('Accountable (Consumption spécifique)', 'gm/kWH', ['', '', ''], k.csp != null ? nf(k.csp, 1) : '')}
${S('FUEL AND OIL STOCK')}
${R('Gas Oil opening (Yesterday) balance', 'Ltr', [1, 2, 3].map(n => nf(num(v['niv0_' + n]))), '')}
${R('Gas Oil received (Yesterday)', 'Ltr', ['', '', ''], qTr ? nf(qTr) : '')}
${R('Gas Oil available (Today) at 06:00 hrs', 'Ltr', [1, 2, 3].map(n => nf(num(v['niv1_' + n]))), '')}
${R('Cuve Tampo - Gas Oil (before → after)', 'Ltr', ['', '', ''], nf(num(v.pgT_av)) + ' → ' + nf(num(v.pgT_ap)))}
${R('Lube Oil opening balance', 'Ltr', L('oilo_'), '')}
${R('Lube Oil received', 'Ltr', L('oilr_'), '')}
${R('Lube Oil available at 06:00 hrs', 'Ltr', L('oild_'), '')}
</table>
<table style="margin-top:4px"><tr class="pt"><td class="l" style="width:34%">POINTE MAX (kW)</td><td>JOUR : ${raw('pt_j')} (GE : ${raw('ge_j')})</td><td>NUIT : ${raw('pt_n')} (GE : ${raw('ge_n')})</td><td>HEURE CENTRALE : ${raw('hmc')}</td></tr>
<tr><td class="l tt" colspan="4">OBSERVATIONS / MAJOR EVENTS</td></tr><tr><td class="obs" colspan="4">${obsTxt}</td></tr></table></div>`;
  }

  async function equipe() {
    const sb = window.CATsb; if (!sb) return '<p class="chef-sub">Indisponible.</p>';
    const { data, error } = await sb.from('profiles').select('*');
    if (error) return '<p class="chef-sub">Impossible de charger l\'équipe (pas de réseau ?).</p>';
    const me = window.CATme && window.CATme.id, rows = data.slice().sort((a, b) => (+a.approved - +b.approved) || String(a.email).localeCompare(b.email));
    return `<h2>${I('users', 22)} Équipe</h2>` + rows.map(p => {
      const bt = (act, l, cls, extra) => `<button class="btn ${cls}" data-pf="${act}" data-id="${p.id}" ${extra || ''}>${l}</button>`;
      const acts = p.id === me ? '' : (p.approved
        ? bt('role', p.role === 'chef' ? 'Passer agent' : 'Passer chef', 'btn-black', `data-role="${p.role === 'chef' ? 'agent' : 'chef'}"`) + bt('del', 'Retirer', 'btn-black')
        : bt('ok', 'Valider (agent)', 'btn-yellow') + bt('chef', 'Valider (chef)', 'btn-black') + bt('del', 'Refuser', 'btn-black'));
      return `<div class="chef-card"><div class="chef-row"><span><b>${esc(p.nom || '')}</b><br><small>${esc(p.email)}</small></span><span class="chef-b ${p.approved ? 'chef-validee' : 'chef-soumise'}">${p.approved ? (p.role === 'chef' ? 'Chef' : 'Agent') : 'En attente'}</span></div>${acts ? `<div class="chef-actions">${acts}</div>` : ''}</div>`;
    }).join('');
  }


  const XF = { grp: [['x2_', 'Heures à vide X2'], ['x3_', 'Arrêts programmés X3'], ['x4_', 'Arrêts forcés X4'], ['db0_', 'Débitmètre début'], ['db1_', 'Débitmètre fin'], ['lube_', 'Huile consommée (L)'], ['oilo_', 'Huile ouverture (L)'], ['oilr_', 'Huile reçue (L)'], ['oild_', 'Huile dispo 06h (L)']],
    one: [['ge_j', 'Nb GE en service (jour)'], ['ge_n', 'Nb GE en service (nuit)'], ['aux0', 'Auxiliaires : index début'], ['aux1', 'Auxiliaires : index fin'], ['auxcum', 'Auxiliaires : cumul du mois'], ['pv_pi', 'PV puissance installée (kW)'], ['pv_h0', 'PV début production'], ['pv_h1', 'PV fin production'], ['pv_c0', 'PV compteur début'], ['pv_c1', 'PV compteur fin'],
      ['vtm_hm', 'VTM heure de marche (hrs)'], ['vtm_prod', 'VTM production (kWh)'], ['vtm_conso', 'VTM consommation GO (L)'], ['vtm_csp', 'VTM CSP (vide = calculée)'], ['vtm_pt', 'VTM pointe max (kW)'], ['vtm_dispo', 'VTM puissance dispo (kW)']],
    txt: [['dl_tech', 'Délestage technique'], ['dl_eco', 'Délestage économique'], ['dl_dg', 'Déclenchement général']] };
  function complements(fi) {
    const v = fi.vals, inp = k => `<input data-x="${k}" inputmode="decimal" value="${esc(v[k] ?? '')}">`;
    return `<details class="chef-card"><summary><b>Compléments du rapport (X2/X3/X4, huile, PV, délestages, VTM)</b></summary>
      <table class="chef-t" style="margin:8px 0"><tr><th></th><th>GE1</th><th>GE2</th><th>GE3</th></tr>${XF.grp.map(([p, l]) => `<tr><td style="text-align:left">${l}</td>${[1, 2, 3].map(n => `<td>${inp(p + n)}</td>`).join('')}</tr>`).join('')}</table>
      ${XF.one.map(([k, l]) => `<label>${l}</label>${inp(k)}`).join('')}
      ${XF.txt.map(([k, l]) => `<label>${l} — une ligne par événement : début ; fin ; ${k === 'dl_dg' ? 'durée' : 'puissance'} ; commentaire</label><textarea data-x="${k}" rows="3">${esc(v[k] ?? '')}</textarea>`).join('')}
      <div class="chef-actions"><button class="btn btn-yellow" data-act="savex">Enregistrer les compléments</button></div></details>`;
  }

  async function rapports() {
    const fi = await getFiche(rDate);
    return `<h2>Rapports PPS / DPR</h2><div class="chef-actions"><input type="date" id="chef-rd" value="${rDate}">
      <button class="btn ${rType === 'PPS' ? 'btn-yellow' : 'btn-black'}" data-rt="PPS">PPS</button><button class="btn ${rType === 'DPR' ? 'btn-yellow' : 'btn-black'}" data-rt="DPR">DPR</button></div>
      ${fi ? complements(fi) + `<div id="chef-print">${rType === 'PPS' ? await ppsHtml(fi) : await dprHtml(fi)}</div>` : '<p class="chef-sub">Pas de fiche à cette date.</p>'}
      <div class="chef-actions"><label>Texte de l'e-mail pour ${rType} :</label><select id="chef-mm"><option value="A" ${((C.mailMap || {})[rType] || 'A') === 'A' ? 'selected' : ''}>Modèle A — détaillé (situation centrale)</option><option value="B" ${((C.mailMap || {})[rType] || '') === 'B' ? 'selected' : ''}>Modèle B — court</option></select></div>
      <div class="chef-actions"><button class="btn btn-yellow" data-act="mail" ${fi ? '' : 'disabled'}>${I('send', 16)} Envoyer par e-mail</button><button class="btn btn-black" data-act="print" ${fi ? '' : 'disabled'}>Imprimer</button></div>`;
  }

  async function render() {
    document.body.classList.toggle('chef-home', tab === 'accueil');
    if (document.body.dataset.role === 'agent') { root.innerHTML = '<p class="chef-sub">Accès réservé au Chef.</p>'; return; }
    const T = [['accueil', 'Accueil'], ['validation', 'Fiches'], ['rapports', 'Rapports'], ['calendrier', 'Quart'], ['employes', 'Employés'], ['equipe', 'Compte']];
    root.innerHTML = (tab === 'accueil' ? '' : `<div class="chef-tabs">${T.map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div>`) +
      `<div class="chef-body">${await ({ accueil, validation, rapports, calendrier, employes, equipe }[tab])()}</div>` +
      `<nav class="cd-dock"><button type="button" onclick="goToPage('page-messages')">${I('msg', 26)}<span>Messages</span></button><button type="button" onclick="openHistoryModal()">${I('clock', 26)}<span>Historique</span></button><button type="button" onclick="openSettingsModal()">${I('gear', 26)}<span>Paramètres</span></button></nav>`;
  }
  window.CATficheDay = ficheDay;
  window.CATreport = async (type, date) => { const fi = await getFiche(date); if (!fi) return null; const k = calc(fi.vals);
    return { tpl: mailTpl(type, fi), html: type === 'PPS' ? await ppsHtml(fi) : await dprHtml(fi), summary: type + ' MAHANORO ' + date + '\nProduction : ' + f(k.tp) + ' kWh\nConsommation : ' + f(k.tc) + ' L\nCSP : ' + f(k.csp) + ' g/kWh' }; };
  window.chefShow = render; window.addEventListener('cat-avatar', () => { const p = document.getElementById('page-chef'); if (p && p.classList.contains('active')) render(); });
  root.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.act === 'eye') { const p = document.getElementById('hc-prod'), nh = localStorage.getItem('catHideProd') === '1' ? '0' : '1'; localStorage.setItem('catHideProd', nh); if (p) p.textContent = nh === '1' ? '******' : p.dataset.v; b.innerHTML = I(nh === '1' ? 'eyeoff' : 'eye', 22); return; }
    if (b.dataset.tab || b.dataset.go) { empMode = 'list'; tab = b.dataset.tab || b.dataset.go; return render(); }
    if (b.dataset.pf) {
      const sb = window.CATsb, id = b.dataset.id, a = b.dataset.pf; let r;
      if (a === 'ok') r = await sb.from('profiles').update({ approved: true, role: 'agent' }).eq('id', id);
      else if (a === 'chef') r = await sb.from('profiles').update({ approved: true, role: 'chef' }).eq('id', id);
      else if (a === 'role') r = await sb.from('profiles').update({ role: b.dataset.role }).eq('id', id);
      else if (a === 'del') { if (!confirm('Retirer cet utilisateur ?')) return; r = await sb.from('profiles').delete().eq('id', id); }
      if (r && r.error) alert('Erreur : ' + r.error.message);
      return render();
    }
    if (b.dataset.rdel) { if (!confirm('Supprimer cette période ?')) return; await db.roster.delete(+b.dataset.rdel); await window.CATcalReload(); return render(); }
    if (b.dataset.swdel) { if (!confirm('Supprimer cette modification ?')) return; await db.roster.delete(+b.dataset.swdel); await window.CATcalReload(); return render(); }
    if (b.dataset.act === 'presetpostes') { document.getElementById('ro-po').value = 'Poste 1 ; 06:30 ; 13:00\nPoste 2 ; 13:00 ; 19:00\nPoste 3 ; 19:00 ; 06:30'; document.getElementById('ro-step').value = 3; return; }
    if (b.dataset.act === 'roster') {
      const from = document.getElementById('ro-from').value, start = document.getElementById('ro-start').value, step = Math.max(1, parseInt(document.getElementById('ro-step').value) || 1);
      const ag = [...new Set(document.getElementById('ro-ag').value.split('\n').map(x => x.trim()).filter(Boolean))];
      const postes = document.getElementById('ro-po').value.split('\n').map(x => x.trim()).filter(Boolean).map(x => { const [nom, debut, fin] = x.split(';').map(y => y.trim()); return { nom, debut, fin }; });
      const tm = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (!from || !start || ag.length < 2) return alert('Indiquez une date d\'effet, un jour de départ et au moins 2 agents.');
      if (!postes.length || postes.some(x => !x.nom || !tm.test(x.debut || '') || !tm.test(x.fin || ''))) return alert('Postes invalides : « nom ; hh:mm ; hh:mm » sur chaque ligne.');
      const bl = document.getElementById('ro-bl').value.split('\n').map(x => x.trim()).filter(Boolean).map(x => { const [d, m] = x.split('/').map(Number); return { d, m: m - 1 }; });
      if (bl.some(x => !(x.d >= 1 && x.d <= 31 && x.m >= 0 && x.m <= 11))) return alert('Jours bloqués invalides (format JJ/MM).');
      if (!(await db.roster.count())) for (const r of window.CATdefRoster()) await db.roster.add(JSON.parse(JSON.stringify(r)));
      const rec = { from, agents: ag, postes, step, start, bloques: bl, by: (JSON.parse(localStorage.getItem('catProf') || '{}').nom || 'Chef'), at: Date.now() };
      const ex = (await db.roster.toArray()).find(r => !r.kind && r.from === from);
      if (ex) await db.roster.update(ex.id, rec); else await db.roster.add(rec);
      await window.CATcalReload(); return render();
    }
    if (b.dataset.act === 'swap') {
      const date = document.getElementById('sw-d').value, pi = +document.getElementById('sw-p').value, ag = document.getElementById('sw-a').value, p2i = document.getElementById('sw-p2').value;
      if (!date) return alert('Choisissez une date.');
      const by = JSON.parse(localStorage.getItem('catProf') || '{}').nom || 'Chef', at = Date.now(), all = await db.roster.toArray();
      const put = async (poste, agent) => { const ex = all.find(r => r.kind === 'swap' && r.date === date && r.poste === poste); const rec = { kind: 'swap', date, poste, agent, by, at }; if (ex) await db.roster.update(ex.id, rec); else await db.roster.add(rec); };
      if (p2i !== '') { const q = +p2i; if (q === pi) return alert('Choisissez deux postes différents.'); const sc = window.CATsched(new Date(date + 'T00:00:00')); await put(pi, sc.slots[q].agent); await put(q, sc.slots[pi].agent); }
      else await put(pi, ag);
      await window.CATcalReload(); return render();
    }
    if (b.dataset.cdel) { await db.consignes.delete(+b.dataset.cdel); return render(); }
    if (b.dataset.act === 'consigne') { const t = (document.getElementById('kg-txt').value || '').trim(); if (!t) return; await db.consignes.add({ ts: Date.now(), texte: t, par: JSON.parse(localStorage.getItem('catProf') || '{}').nom || 'Chef' }); return render(); }
    if (b.dataset.act === 'empnew') { empMode = 'form'; empId = null; return render(); }
    if (b.dataset.act === 'empedit') { empMode = 'form'; empId = +b.dataset.id; return render(); }
    if (b.dataset.act === 'empview') { empMode = 'view'; empId = +b.dataset.id; return render(); }
    if (b.dataset.act === 'empback') { empMode = 'list'; empId = null; return render(); }
    if (b.dataset.act === 'empprint') { document.body.classList.add('print-chef'); window.print(); setTimeout(() => document.body.classList.remove('print-chef'), 500); return; }
    if (b.dataset.act === 'empdel') {
      if (!confirm('Supprimer définitivement cet employé et son dossier (CIN compris) ?')) return;
      const e = await db.employes.get(+b.dataset.id); if (e) { const r = await getRh(e.uid); if (r) await db.employes_rh.delete(r.id); await db.employes.delete(e.id); }
      empMode = 'list'; empId = null; return render();
    }
    if (b.dataset.act === 'empsave') {
      const v = {}; root.querySelectorAll('[data-e]').forEach(x => v[x.dataset.e] = x.value.trim());
      if (!v.nom) return alert('Le nom est obligatoire.');
      const old = empId ? await db.employes.get(empId) : null, uid = old ? old.uid : uid8();
      const e = { uid, nom: v.nom, prenoms: v.prenoms, poste: v.poste, statut: v.statut, embauche: v.embauche, avatar: empImg.avatar || '' };
      const r = { uid, naissance: v.naissance, lieu: v.lieu, tel: v.tel, adresse: v.adresse, cin: v.cin, cinDate: v.cinDate, cinLieu: v.cinLieu, cnaps: v.cnaps, cinRecto: empImg.cinRecto || '', cinVerso: empImg.cinVerso || '' };
      if (old) await db.employes.update(old.id, e); else empId = await db.employes.add(e);
      const ro = await getRh(uid); if (ro) await db.employes_rh.update(ro.id, r); else await db.employes_rh.add(r);
      empMode = 'view'; return render();
    }
    if (b.dataset.act === 'impagents') {
      const ag = (await db.employes.toArray()).filter(e => e.statut !== 'inactif' && e.poste === 'Agent de quart').map(short);
      if (!ag.length) return alert('Aucun agent de quart actif dans les dossiers employés.'); document.getElementById('ro-ag').value = ag.join('\n'); return;
    }
    if (b.dataset.open) return window.ficheOpen(b.dataset.open);
    if (b.dataset.rt) { rType = b.dataset.rt; return render(); }
    if (b.dataset.st) {
      const note = b.dataset.st === 'retournee' ? prompt('Motif du retour à l\'agent :') : '';
      if (b.dataset.st === 'retournee' && note === null) return;
      await db.fiches.update(+b.dataset.id, { statut: b.dataset.st, note: note || '', validePar: 'Chef', valideLe: Date.now() }); return render();
    }
    if (b.dataset.act === 'print') { document.body.classList.add('print-chef'); window.print(); setTimeout(() => document.body.classList.remove('print-chef'), 500); return; }
    if (b.dataset.act === 'savex') { const fi = await getFiche(rDate); if (!fi) return; const nv = Object.assign({}, fi.vals); root.querySelectorAll('[data-x]').forEach(x => nv[x.dataset.x] = x.value); await db.fiches.update(fi.id, { vals: nv }); return render(); }
    if (b.dataset.act === 'mail' && window.CATcompose) { const fi = await getFiche(rDate); if (fi && (fi.statut || 'soumise') !== 'validee' && !confirm('Cette fiche n\'est pas encore validée. Envoyer quand même ?')) return; return window.CATcompose({ type: rType, date: rDate }); }
  });
  root.addEventListener('change', async e => { const im = e.target.dataset && e.target.dataset.img; if (im && e.target.files[0]) { try { empImg[im] = await compress(e.target.files[0], im === 'avatar' ? 160 : 900, im === 'avatar' ? 0.8 : 0.7); const p = document.getElementById('pv-' + im); p.src = empImg[im]; p.style.display = ''; } catch (x) { alert('Image illisible.'); } return; }
    if (e.target.id === 'chef-mm') { C.mailMap = Object.assign({}, C.mailMap, { [rType]: e.target.value }); saveCfg(); return; }
    if (e.target.id === 'chef-rd' && e.target.value) { rDate = e.target.value; render(); } });
});
