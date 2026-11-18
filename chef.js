// Côté Chef : Accueil, Validation des fiches, Rapports PPS/DPR (boîte d'envoi prête pour le serveur)
document.addEventListener('DOMContentLoaded', () => {
  const db = window.CATdb, root = document.getElementById('page-chef');
  if (!db || !root) return;
  const I = (n, s) => window.ICO(n, s);
  const C = Object.assign({ nom: [360, 400, 400], dispo: [288, 320, 320], dens: 830, cspMax: 250 }, JSON.parse(localStorage.getItem('chefCfg') || '{}'));
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
      const j = n < 3 && g('jir1_' + n) != null && g('jir0_' + n) != null ? (g('jir1_' + n) - g('jir0_' + n)) * (n === 1 ? 8 : 1) : null;
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

  async function accueil() {
    const d = ficheDay(), fi = await getFiche(d), pv = await getFiche(prevDay(d));
    const all = await db.fiches.toArray(), att = all.filter(x => (x.statut || 'soumise') === 'soumise').length;
    const k = fi ? calc(fi.vals) : null, kp = pv ? calc(pv.vals) : null, al = [];
    if (!fi) al.push('La fiche du ' + d + " n'est pas encore enregistrée.");
    if (k && k.csp > C.cspMax) al.push('CSP élevé : ' + f(k.csp) + ' g/kWh (seuil ' + C.cspMax + ').');
    if (att) al.push(att + ' fiche(s) en attente de validation.');
    try { if (window.CATsb) { const r = await window.CATsb.from('profiles').select('id', { count: 'exact', head: true }).eq('approved', false); if (r.count) al.push(r.count + ' compte(s) en attente de validation (onglet Équipe).'); } } catch (e) {}
    const stk = fi ? ['pgT_ap'].map(x => num(fi.vals[x])) : [];
    return `<h2>${I('shield', 22)} Accueil Chef</h2><p class="chef-sub">Fiche du ${d} ${fi ? badge(fi.statut || 'soumise') : ''}</p>
      ${al.length ? `<div class="chef-alert">${al.map(a => `<div>${I('alert', 16)} ${esc(a)}</div>`).join('')}</div>` : `<div class="chef-ok">${I('check', 16)} Rien à signaler.</div>`}
      <div class="chef-kpi"><div><small>Production (kWh)</small><b>${k ? f(k.tp) : '-'}</b>${k && kp ? delta(k.tp, kp.tp) : ''}</div>
      <div><small>Consommation (L)</small><b>${k ? f(k.tc) : '-'}</b>${k && kp ? delta(k.tc, kp.tc) : ''}</div>
      <div><small>CSP (g/kWh)</small><b>${k ? f(k.csp) : '-'}</b>${k && kp ? delta(k.csp, kp.csp) : ''}</div>
      <div><small>Pointe jour / nuit (kW)</small><b>${fi ? esc(fi.vals.pt_j || '-') + ' / ' + esc(fi.vals.pt_n || '-') : '-'}</b></div></div>
      <div class="chef-actions"><button class="btn btn-yellow" data-go="validation">Valider les fiches</button><button class="btn btn-black" data-go="rapports">Rapports</button></div>`;
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

  function ppsHtml(fi) {
    const v = fi.vals, k = calc(v), T = (a, b) => `<tr>${a.map(x => `<td>${x ?? ''}</td>`).join('')}</tr>`;
    return `<h3>POWER PLANT STATUS - ${fi.date}</h3><div class="chef-scroll"><table class="chef-t"><tr><th>Groupe</th><th>Pnom (kW)</th><th>Pdispo (kW)</th><th>H marche</th><th>Production (kWh)</th><th>Taux charge (%)</th><th>Conso (L)</th><th>CSP (g/kWh)</th></tr>
      ${k.G.map(x => T(['GE' + x.n, x.nom, x.dispo, f(x.h, 1), f(x.pj), f(x.tc * 100, 1), f(x.c), f(x.csp)])).join('')}
      <tr class="tot"><td>TOTAL</td><td>${C.nom.reduce((a, b) => a + b)}</td><td>${C.dispo.reduce((a, b) => a + b)}</td><td></td><td>${f(k.tp)}</td><td></td><td>${f(k.tc)}</td><td>${f(k.csp)}</td></tr></table></div>
      <p>Pointe jour ${esc(v.pt_j || '')} kW · Pointe nuit ${esc(v.pt_n || '')} kW · HM centrale ${esc(v.hmc || '')}</p>`;
  }
  function dprHtml(fi) {
    const v = fi.vals, k = calc(v), R = (l, u, a) => `<tr><th>${l}</th><td>${u}</td>${a.map(x => `<td>${x}</td>`).join('')}</tr>`;
    return `<h3>DAILY PRODUCTION REPORT - ${fi.date}</h3><div class="chef-scroll"><table class="chef-t"><tr><th>Paramètre</th><th>Unité</th><th>GE1</th><th>GE2</th><th>GE3</th><th>Total</th></tr>
      ${R('Hour meter début', 'h', [1, 2, 3].map(n => esc(v['hm0_' + n] || '')).concat(''))}${R('Hour meter fin', 'h', [1, 2, 3].map(n => esc(v['hm1_' + n] || '')).concat(''))}
      ${R('Heures de marche (X1)', 'h', k.G.map(x => f(x.h, 1)).concat(f(k.G.reduce((a, x) => a + (x.h || 0), 0), 1)))}
      ${R('Production EMCP (jour)', 'kWh', k.G.map(x => f(x.e)).concat(f(k.te)))}${R('Production comptable', 'kWh', k.G.map(x => f(x.pj)).concat(f(k.tp)))}
      ${R('Consommation gasoil', 'L', k.G.map(x => f(x.c)).concat(f(k.tc)))}${R('CSP comptable', 'g/kWh', k.G.map(x => f(x.csp)).concat(f(k.csp)))}</table></div>
      <p>Observations : ${esc(v.obs || '')}</p>`;
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

  async function rapports() {
    const fi = await getFiche(rDate), dest = JSON.parse(localStorage.getItem('chefDest') || '{}');
    const out = (await db.rapports.toArray()).sort((a, b) => b.id - a.id).slice(0, 8);
    return `<h2>Rapports PPS / DPR</h2><div class="chef-actions"><input type="date" id="chef-rd" value="${rDate}">
      <button class="btn ${rType === 'PPS' ? 'btn-yellow' : 'btn-black'}" data-rt="PPS">PPS</button><button class="btn ${rType === 'DPR' ? 'btn-yellow' : 'btn-black'}" data-rt="DPR">DPR</button></div>
      ${fi ? `<div id="chef-print">${rType === 'PPS' ? ppsHtml(fi) : dprHtml(fi)}</div>` : '<p class="chef-sub">Pas de fiche à cette date.</p>'}
      <div class="chef-card"><label>À</label><input id="chef-to" value="${esc(dest.to || '')}" placeholder="adresses séparées par des virgules">
      <label>CC</label><input id="chef-cc" value="${esc(dest.cc || '')}"><label>BCC</label><input id="chef-bcc" value="${esc(dest.bcc || '')}">
      <div class="chef-actions"><button class="btn btn-yellow" data-act="queue" ${fi ? '' : 'disabled'}>${I('send', 16)} Mettre en boîte d'envoi</button><button class="btn btn-black" data-act="print" ${fi ? '' : 'disabled'}>Imprimer</button></div></div>
      <h3>Boîte d'envoi</h3>${out.length ? out.map(o => `<div class="chef-row chef-card"><span>${o.type} ${o.date}<br><small>${esc(o.to)}</small></span><span class="chef-b chef-soumise">En attente du serveur</span></div>`).join('') : '<p class="chef-sub">Vide.</p>'}`;
  }

  async function render() {
    if (document.body.dataset.role === 'agent') { root.innerHTML = '<p class="chef-sub">Accès réservé au Chef.</p>'; return; }
    const T = [['accueil', 'Accueil'], ['validation', 'Fiches'], ['rapports', 'Rapports'], ['equipe', 'Équipe']];
    root.innerHTML = `<div class="chef-tabs">${T.map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div>` +
      `<div class="chef-body">${await ({ accueil, validation, rapports, equipe }[tab])()}</div>`;
  }
  window.chefShow = render;
  root.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tab || b.dataset.go) { tab = b.dataset.tab || b.dataset.go; return render(); }
    if (b.dataset.pf) {
      const sb = window.CATsb, id = b.dataset.id, a = b.dataset.pf; let r;
      if (a === 'ok') r = await sb.from('profiles').update({ approved: true, role: 'agent' }).eq('id', id);
      else if (a === 'chef') r = await sb.from('profiles').update({ approved: true, role: 'chef' }).eq('id', id);
      else if (a === 'role') r = await sb.from('profiles').update({ role: b.dataset.role }).eq('id', id);
      else if (a === 'del') { if (!confirm('Retirer cet utilisateur ?')) return; r = await sb.from('profiles').delete().eq('id', id); }
      if (r && r.error) alert('Erreur : ' + r.error.message);
      return render();
    }
    if (b.dataset.open) return window.ficheOpen(b.dataset.open);
    if (b.dataset.rt) { rType = b.dataset.rt; return render(); }
    if (b.dataset.st) {
      const note = b.dataset.st === 'retournee' ? prompt('Motif du retour à l\'agent :') : '';
      if (b.dataset.st === 'retournee' && note === null) return;
      await db.fiches.update(+b.dataset.id, { statut: b.dataset.st, note: note || '', validePar: 'Chef', valideLe: Date.now() }); return render();
    }
    if (b.dataset.act === 'print') { document.body.classList.add('print-chef'); window.print(); setTimeout(() => document.body.classList.remove('print-chef'), 500); return; }
    if (b.dataset.act === 'queue') {
      const g = id => document.getElementById(id).value.trim(), d = { to: g('chef-to'), cc: g('chef-cc'), bcc: g('chef-bcc') };
      if (!d.to) return alert('Indiquez au moins un destinataire (À).');
      localStorage.setItem('chefDest', JSON.stringify(d));
      await db.rapports.add({ date: rDate, type: rType, ...d, subject: rType + ' MAHANORO ' + rDate, statut: 'en_attente', created: Date.now() }); render();
    }
  });
  root.addEventListener('change', e => { if (e.target.id === 'chef-rd' && e.target.value) { rDate = e.target.value; render(); } });
});
