// CAT by Manda V4.5 - Opérations de l'agent de quart
// Remise, Couplage, Permutation, Découplage, Déclenchement / coupure générale, Arrêt complet.
// Stockage : table Dexie "operations" (synchronisée avec Supabase via sync.js).
document.addEventListener('DOMContentLoaded', function () {
  const db = window.CATdb, host = document.querySelector('.container');
  if (!db || !host || !db.operations) return;

  const GR = ['G1', 'G2', 'G3'];
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const pad = n => String(n).padStart(2, '0');
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const nowT = () => { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const who = () => { try { return (JSON.parse(localStorage.getItem('catProf') || '{}').nom || ''); } catch (e) { return ''; } };

  // Libellés des heures (clé -> libellé)
  const H = {
    hRemise: 'Heure de remise', hEncl: 'Heure enclenchement disjoncteur', hDem: 'Heure de démarrage', hCoupl: 'Heure de couplage',
    hDecoupl: 'Heure de découplage', hArret: 'Heure arrêt moteur', hDisj: 'Heure disjoncteur (ouverture)', hEvt: 'Heure de l\'événement'
  };
  // Définition des opérations
  const OPS = {
    remise: { label: 'Remise', hint: 'Remise en service après coupure', g: 1, h: ['hRemise', 'hEncl'], rel: false },
    couplage: { label: 'Couplage', hint: 'Démarrage puis couplage d\'un groupe', g: 1, h: ['hDem', 'hCoupl'], rel: false },
    permutation: { label: 'Permutation', hint: 'Transfert de la puissance d\'un groupe vers un autre', g: 2, h: ['hDem', 'hCoupl', 'hDecoupl', 'hArret'], rel: true },
    decouplage: { label: 'Découplage', hint: 'Découplage puis arrêt moteur', g: 1, h: ['hDecoupl', 'hArret'], rel: true },
    declenchement: { label: 'Déclenchement / coupure', hint: 'Déclenchement disjoncteur ou coupure générale', g: 1, h: ['hEvt'], rel: false, kind: true },
    arret: { label: 'Arrêt complet', hint: 'Disjoncteur ouvert + arrêt moteur (groupe éteint)', g: 1, h: ['hDisj', 'hArret'], rel: true }
  };
  const KINDS = ['Déclenchement disjoncteur', 'Coupure générale'];

  let cur = 'remise';

  function css() {
    if (document.getElementById('opCss')) return;
    const s = document.createElement('style'); s.id = 'opCss';
    s.textContent = `
.op-types{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}
.op-types button{padding:10px 8px;border:1.5px solid var(--border);border-radius:12px;background:var(--bg-card,#fff);color:var(--text-main);font-weight:700;font-size:13.5px;cursor:pointer;text-align:center;line-height:1.25}
.op-types button small{display:block;font-weight:500;font-size:11px;color:var(--text-muted);margin-top:2px}
.op-types button.on{border-color:var(--primary);background:var(--ac-soft,rgba(28,75,156,.08));box-shadow:0 0 0 2px var(--primary) inset}
.op-lab{display:flex;align-items:center;justify-content:space-between;gap:8px}
.op-now{border:0;background:none;color:var(--primary);font-size:12px;font-weight:700;text-decoration:underline;cursor:pointer;padding:0}
.op-rel{margin-top:14px;padding:12px;border:1.5px dashed var(--secondary);border-radius:12px}
.op-rel h4{margin:0 0 4px;font-size:14px}
.op-rel p{margin:0 0 10px;font-size:12px;color:var(--text-muted)}
.op-err{color:#B42318;background:#FEF3F2;border-radius:10px;font-size:13px;padding:9px 12px;margin-top:12px}
.op-hist .op-row{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px solid var(--border)}
.op-hist .op-row:first-child{border-top:0}
.op-hist .op-t{flex:1;min-width:0;font-size:13px;line-height:1.45}
.op-hist .op-t b{font-size:14px}
.op-hist .op-t small{display:block;color:var(--text-muted)}
.op-hist button.btn-suppr{flex-shrink:0}`;
    document.head.appendChild(s);
  }

  const gSel = (id, v) => `<select id="${id}">${GR.map(g => `<option value="${g}" ${g === v ? 'selected' : ''}>${g}</option>`).join('')}</select>`;
  const tIn = k => `<div><div class="op-lab"><label for="op-${k}">${H[k]}</label><button type="button" class="op-now" data-now="op-${k}">Maintenant</button></div><input type="time" id="op-${k}"></div>`;

  function formHTML() {
    const o = OPS[cur];
    let gh = '';
    if (o.g === 2) gh = `<div class="grid2"><div><label for="op-g">Groupe qui donne la puissance</label>${gSel('op-g', 'G1')}</div><div><label for="op-g2">Groupe qui la reçoit</label>${gSel('op-g2', 'G2')}</div></div>`;
    else gh = `<div class="grid2"><div><label for="op-g">Groupe</label>${gSel('op-g', 'G1')}</div>${o.kind ? `<div><label for="op-kind">Type</label><select id="op-kind">${KINDS.map(k => `<option>${k}</option>`).join('')}</select></div>` : '<div></div>'}</div>`;
    const arretSel = cur === 'permutation' ? `<div style="margin-top:12px"><label for="op-ag">Groupe qui s'arrête (arrêt moteur)</label><select id="op-ag"></select></div>` : '';
    const times = o.h.map(tIn).join('');
    const rel = o.rel ? `<div class="op-rel"><h4>Relevé après arrêt moteur <span id="op-relg"></span></h4><p>Obligatoire : à noter dès que le moteur est arrêté.</p>
      <div class="grid2"><div><label for="op-en">Énergie compteur (kWh)</label><input type="number" step="any" id="op-en" inputmode="decimal"></div><div><label for="op-hm">Heure de marche groupe</label><input type="number" step="any" id="op-hm" inputmode="decimal"></div></div>
      <div style="margin-top:12px"><label for="op-go">Gasoil dans le groupe (cm)</label><input type="number" step="any" id="op-go" inputmode="decimal"></div></div>` : '';
    return `<div class="card"><h2>Nouvelle opération</h2>
      <div class="op-types">${Object.keys(OPS).map(k => `<button type="button" data-op="${k}" class="${k === cur ? 'on' : ''}">${OPS[k].label}<small>${OPS[k].hint}</small></button>`).join('')}</div>
      <label for="op-date">Date</label><input type="date" id="op-date" value="${today()}" style="margin-bottom:12px">
      ${gh}
      <div class="grid2" style="margin-top:12px">${times}</div>
      ${arretSel}${rel}
      <label for="op-obs" style="margin-top:12px;display:block">Observation</label><input type="text" id="op-obs" placeholder="Facultatif">
      <div id="op-err" class="op-err" hidden></div>
      <button class="btn btn-yellow btn-full mt-14" id="op-save" type="button">Enregistrer l'opération</button></div>
      <div class="card op-hist"><h2>Dernières opérations</h2><div id="op-list"></div></div>`;
  }

  // Texte résumé d'une opération
  function resume(r) {
    const o = OPS[r.type]; if (!o) return '';
    const hs = o.h.filter(k => r[k]).map(k => H[k].replace(/^Heure (de |d')?/, '').replace(/^arrêt moteur$/, 'arrêt moteur') + ' ' + r[k]);
    let t = hs.join(' · ');
    if (r.type === 'permutation') t = `${r.groupe} → ${r.groupe2} · ` + t + (r.arretGroupe ? ` (arrêt ${r.arretGroupe})` : '');
    if (r.en != null && r.en !== '') t += ` | compteur ${r.en} kWh · HM ${r.hm} · GO ${r.go} cm`;
    return t;
  }
  window.CATopResume = resume;
  window.CATopLabel = r => (OPS[r.type] ? OPS[r.type].label : r.type) + (r.kind ? ' - ' + r.kind : '');

  async function renderList() {
    const box = document.getElementById('op-list'); if (!box) return;
    const all = await db.operations.toArray();
    all.sort((a, b) => ((b.date || '') + (b.ts || 0)).toString().localeCompare(((a.date || '') + (a.ts || 0)).toString()) || b.id - a.id);
    if (!all.length) { box.innerHTML = '<p style="color:#888;">Aucune opération enregistrée.</p>'; return; }
    const sl = all.slice(0, 15);
    box.innerHTML = sl.map(r => `<div class="op-row"><div class="op-t"><b>${esc(window.CATopLabel(r))}</b> ${r.type === 'permutation' ? '' : esc(r.groupe || '')}<small>${esc(r.date)} · ${esc(resume(r))}${r.par ? ' · ' + esc(r.par) : ''}${r.obs ? '<br>' + esc(r.obs) : ''}</small></div><button type="button" class="btn-suppr" data-del="${r.id}">Suppr.</button></div>`).join('')
      + (all.length > 15 ? `<button type="button" class="btn btn-black btn-full mt-14" id="op-all">Voir tout (${all.length}) →</button>` : '');
    box.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      if (confirm('Supprimer cette opération ?')) { await db.operations.delete(parseInt(b.dataset.del, 10)); renderList(); }
    }));
    const more = document.getElementById('op-all'); if (more && window.openTableView) more.addEventListener('click', () => window.openTableView('operations'));
  }

  function syncArret() {
    const ag = document.getElementById('op-ag'); if (!ag) return;
    const g = document.getElementById('op-g').value, g2 = document.getElementById('op-g2').value, keep = ag.value;
    ag.innerHTML = [g, g2].map(x => `<option value="${x}">${x}</option>`).join('');
    ag.value = (keep === g || keep === g2) ? keep : g;
    relLabel();
  }
  function relLabel() {
    const l = document.getElementById('op-relg'); if (!l) return;
    const ag = document.getElementById('op-ag'), g = document.getElementById('op-g');
    l.textContent = '(' + (ag ? ag.value : g.value) + ')';
  }

  function bind() {
    const page = document.getElementById('page-operations');
    page.querySelectorAll('[data-op]').forEach(b => b.addEventListener('click', () => { cur = b.dataset.op; draw(); }));
    page.querySelectorAll('[data-now]').forEach(b => b.addEventListener('click', () => { document.getElementById(b.dataset.now).value = nowT(); }));
    const g = document.getElementById('op-g'), g2 = document.getElementById('op-g2');
    if (g) g.addEventListener('change', () => { if (g2 && g.value === g2.value) g2.value = GR.find(x => x !== g.value); syncArret(); relLabel(); });
    if (g2) g2.addEventListener('change', () => { if (g && g.value === g2.value) g.value = GR.find(x => x !== g2.value); syncArret(); });
    const ag = document.getElementById('op-ag'); if (ag) ag.addEventListener('change', relLabel);
    if (g2) { g2.value = 'G2'; syncArret(); } else relLabel();
    document.getElementById('op-save').addEventListener('click', save);
  }

  async function save() {
    const o = OPS[cur], err = document.getElementById('op-err'), v = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
    const fail = t => { err.textContent = t; err.hidden = false; err.scrollIntoView({ block: 'nearest' }); };
    err.hidden = true;
    const r = { type: cur, date: v('op-date'), groupe: v('op-g'), obs: v('op-obs'), par: who(), ts: Date.now() };
    if (!r.date) return fail('Choisissez la date.');
    if (o.kind) r.kind = v('op-kind');
    if (o.g === 2) { r.groupe2 = v('op-g2'); r.arretGroupe = v('op-ag'); }
    for (const k of o.h) { r[k] = v('op-' + k); if (!r[k]) return fail('Renseignez : ' + H[k].toLowerCase() + '.'); }
    if (o.rel) {
      r.en = v('op-en'); r.hm = v('op-hm'); r.go = v('op-go');
      if (r.en === '' || r.hm === '' || r.go === '') return fail('Après un arrêt moteur, notez : énergie compteur, heure de marche et gasoil dans le groupe.');
      r.relGroupe = r.arretGroupe || r.groupe;
    }
    try {
      await db.operations.add(r);
      if (cur === 'declenchement') {   // remonte au Chef (fil d'alertes)
        try { await db.alertes.add({ ts: Date.now(), groupe: r.groupe, date: r.date, heure: r.hEvt, texte: (r.kind || 'Déclenchement') + (r.kind === 'Coupure générale' ? '' : ' ' + r.groupe) + ' à ' + r.hEvt + (r.obs ? ' - ' + r.obs : ''), par: r.par }); } catch (e) {}
      }
      alert('Opération enregistrée.');
      draw();
    } catch (e) { console.error(e); fail('Enregistrement impossible : ' + e.message); }
  }

  function draw() {
    const page = document.getElementById('page-operations');
    page.innerHTML = formHTML(); bind(); renderList();
  }

  // Page + entrée de menu
  css();
  const page = document.createElement('div'); page.id = 'page-operations'; page.className = 'page';
  const msgs = document.getElementById('page-messages'); host.insertBefore(page, msgs || null);
  const menuItem = document.querySelector('.side-menu-item[onclick*="page-calendrier"]');
  if (menuItem) {
    const b = document.createElement('button'); b.className = 'side-menu-item'; b.setAttribute('onclick', "goToPage('page-operations')");
    b.innerHTML = (window.ICO ? window.ICO('clock', 22) : '') + ' Opérations';
    menuItem.parentNode.insertBefore(b, menuItem);
  }
  draw();
  const obs = new MutationObserver(() => { if (page.classList.contains('active')) renderList(); });
  obs.observe(page, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('cat-synced', renderList);
});
