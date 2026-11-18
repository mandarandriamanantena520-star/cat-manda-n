document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. NAVIGATION
  // ==========================================
  const navBtns = document.querySelectorAll('.nav-btn');
  const pages = document.querySelectorAll('.page');
  const sideMenu = document.getElementById('sideMenu');
  const sideMenuOverlay = document.getElementById('sideMenuOverlay');

  function markNav(t) {
    document.querySelectorAll('.side-menu-item').forEach(b => b.classList.toggle('active', (b.getAttribute('onclick') || '').includes("'" + t + "'")));
  }
  function showPage(target) {
    markNav(target);
    navBtns.forEach(b => b.classList.remove('active'));
    pages.forEach(p => p.classList.remove('active'));
    const btn = document.querySelector(`.nav-btn[data-target="${target}"]`);
    if(btn) btn.classList.add('active');
    const page = document.getElementById(target);
    if(page) page.classList.add('active');
    if(target === 'page-fiche' && window.ficheShow) window.ficheShow();
    if(target === 'page-chef' && window.chefShow) window.chefShow();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.getAttribute('data-target')));
  });

  // Side Menu Logic
  const btnMenuLogo = document.getElementById('btn-menu-logo');
  const btnCloseSideMenu = document.getElementById('btnCloseSideMenu');
  
  if(btnMenuLogo) btnMenuLogo.addEventListener('click', () => { sideMenu.classList.add('open'); sideMenuOverlay.classList.add('open'); });
  if(btnCloseSideMenu) btnCloseSideMenu.addEventListener('click', () => { sideMenu.classList.remove('open'); sideMenuOverlay.classList.remove('open'); });
  if(sideMenuOverlay) sideMenuOverlay.addEventListener('click', () => { sideMenu.classList.remove('open'); sideMenuOverlay.classList.remove('open'); });

  window.goToPage = function(target) {
    showPage(target);
    sideMenu.classList.remove('open'); sideMenuOverlay.classList.remove('open');
  };

  // ==========================================
  // 2. THEME & PARAMÈTRES
  // ==========================================
  const themeToggle = document.getElementById('theme-toggle');
  const iconMoon = document.getElementById('icon-moon');
  const iconSun = document.getElementById('icon-sun');
  const body = document.body;

  function updateThemeIcons() {
    if (body.classList.contains('dark-mode')) { iconMoon.classList.add('hidden'); iconSun.classList.remove('hidden'); } 
    else { iconSun.classList.add('hidden'); iconMoon.classList.remove('hidden'); }
  }
  if (localStorage.getItem('theme') === 'dark') body.classList.add('dark-mode');
  updateThemeIcons();

  themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
    updateThemeIcons();
  });

  window.setTheme = function(mode) {
    if(mode === 'dark') body.classList.add('dark-mode');
    else body.classList.remove('dark-mode');
    localStorage.setItem('theme', mode);
    updateThemeIcons();
  };

  window.setAccent = function(color) {
    document.documentElement.style.setProperty('--secondary', color);
    document.documentElement.style.setProperty('--secondary-soft', color + '1f');
    localStorage.setItem('accent', color);
  };
  const savedAccent = localStorage.getItem('accent');
  if(savedAccent) setAccent(savedAccent);

  window.openSettingsModal = function() {
    document.getElementById('settingsModal').classList.add('open');
    sideMenu.classList.remove('open'); sideMenuOverlay.classList.remove('open');
  };
  window.openAboutModal = function() {
    document.getElementById('aboutModal').classList.add('open');
    sideMenu.classList.remove('open'); sideMenuOverlay.classList.remove('open');
  };
  window.openHistoryModal = function() {
    document.getElementById('historyModal').classList.add('open');
    sideMenu.classList.remove('open'); sideMenuOverlay.classList.remove('open');
    loadGlobalHistory();
  };
  window.shareApp = function() {
    if (navigator.share) {
      navigator.share({ title: 'CAT by Manda', text: 'Application de gestion', url: window.location.href });
    } else {
      alert("Copier le lien: " + window.location.href);
    }
    sideMenu.classList.remove('open'); sideMenuOverlay.classList.remove('open');
  };

  // ==========================================
  // 3. DATABASE (IndexedDB)
  // ==========================================
  const db = new Dexie('CAT_System_v2');
  db.version(6).stores({ 
    rapports: '++id, date, statut',
    relevés: '++id, groupe, date, heure',
    appoints: '++id, groupe, date',
    transferts: '++id, date',
    travaux: '++id, date, groupe',
    fiches: '++id, date'
  });
  
  window.CATdb = db;
  const pad2 = n => String(n).padStart(2, '0');
  const localDateStr = (d = new Date()) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  const localTimeStr = (d = new Date()) => pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  const todayStr = localDateStr();
  const todayTime = localTimeStr();
  function refreshNow() {
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
    set('r-date', localDateStr()); set('r-heure', localTimeStr());
    set('tr-date', localDateStr()); set('tr-heure', localTimeStr());
    set('ap-date', localDateStr()); set('tw-date', localDateStr());
  }

  // ==========================================
  // 4. BARÈME C16 & RELEVÉS
  // ==========================================
  const baremeC16 = {
    5: [192.17, 198.05, 201.94, 205.82, 209.70, 213.59, 217.47, 221.35, 225.24, 229.12],
    6: [233, 236.89, 240.77, 244.66, 248.54, 252.42, 256.31, 260.19, 264.07, 267.96],
    7: [271.84, 275.72, 279.61, 283.49, 287.37, 291.26, 295.14, 299.02, 302.91, 306.79],
    8: [310.67, 314.56, 318.44, 322.33, 326.21, 330.09, 333.98, 337.86, 341.74, 345.63],
    9: [349.51, 353.39, 357.28, 361.16, 365.04, 368.93, 372.81, 376.69, 380.58, 384.46],
    10: [388.35, 392.23, 396.12, 400, 403.88, 407.77, 411.65, 415.53, 419.42, 423.30],
    11: [427.18, 431.07, 434.95, 438.83, 442.72, 446.6, 450.49, 454.37, 458.25, 462.14],
    12: [466.02, 469.9, 473.79, 477.67, 481.55, 485.44, 489.32, 493.2, 497.09, 500.97],
    13: [504.85, 508.74, 512.62, 516.5, 520.39, 524.27, 528.16, 532.04, 535.92, 539.81],
    14: [543.69, 547.57, 551.46, 555.34, 559.22, 563.11, 566.99, 570.87, 574.76, 578.64],
    15: [582.52, 586.41, 590.29, 594.17, 598.06, 601.94, 605.83, 609.71, 613.59, 617.48],
    16: [621.36, 625.24, 629.13, 633.01, 636.89, 640.78, 644.66, 648.54, 652.43, 656.31],
    17: [660.19, 664.08, 667.96, 671.84, 675.73, 679.61, 683.5, 687.38, 691.26, 695.15],
    18: [699.03, 702.91, 706.8, 710.68, 714.56, 718.45, 722.33, 726.21, 730.1, 733.98],
    19: [737.86, 741.75, 745.63, 749.51, 753.4, 757.28, 761.17, 765.05, 768.93, 772.82],
    20: [776.7, 780.58, 784.47, 788.35, 792.23, 796.12, 800, 803.88, 807.77, 811.65],
    21: [815.53, 819.42, 823.3, 827.18, 831.07, 834.95, 838.83, 842.72, 846.6, 850.49]
  };

  function mmToL(mm) {
    mm = parseInt(mm, 10);
    if (isNaN(mm) || mm < 50 || mm > 229) return "";
    let d = Math.floor(mm / 10), u = mm % 10;
    return baremeC16[d][u];
  }

  const rGasoilMm = document.getElementById('r-gasoil-mm');
  if(rGasoilMm) {
    rGasoilMm.addEventListener('input', (e) => {
      const val = mmToL(e.target.value);
      document.getElementById('r-gasoil-litres').value = val ? val.toFixed(2) + " L" : "";
    });
  }

  if(document.getElementById('r-date')) document.getElementById('r-date').value = todayStr;
  if(document.getElementById('r-heure')) document.getElementById('r-heure').value = todayTime;

  const rGroupe = document.getElementById('r-groupe');
  if(rGroupe) {
    rGroupe.addEventListener('change', (e) => {
      if (e.target.value === 'G3') document.getElementById('wrap-temp-huile').classList.remove('hidden');
      else { document.getElementById('wrap-temp-huile').classList.add('hidden'); document.getElementById('r-temp-huile').value = ''; }
    });
  }

  const btnSaveReleve = document.getElementById('btn-save-releve');
  if(btnSaveReleve) {
    btnSaveReleve.addEventListener('click', async () => {
      const newReleve = {
        groupe: document.getElementById('r-groupe').value, date: document.getElementById('r-date').value, heure: document.getElementById('r-heure').value,
        tension: document.getElementById('r-tension').value, intensite: document.getElementById('r-intensite').value, frequence: document.getElementById('r-frequence').value,
        cos: document.getElementById('r-cos').value, puissance: document.getElementById('r-puissance').value, energie: document.getElementById('r-energie').value,
        pressHuile: document.getElementById('r-press-huile').value, tempEau: document.getElementById('r-temp-eau').value,
        tempHuile: document.getElementById('r-groupe').value === 'G3' ? document.getElementById('r-temp-huile').value : null,
        transfo: document.getElementById('r-transfo').value, rpm: document.getElementById('r-rpm').value, heureMarche: document.getElementById('r-heure-marche').value,
        pressGasoil: document.getElementById('r-press-gasoil').value, airAdm: document.getElementById('r-air-adm').value,
        gasoilMm: document.getElementById('r-gasoil-mm').value, gasoilLitres: document.getElementById('r-gasoil-litres').value
      };
      if (!newReleve.date || !newReleve.heure) { alert("Date sy heure ilaina."); return; }
      const warns = checkAlerts(newReleve);
      if (warns.length && !confirm("ATTENTION : valeur(s) hors limites :\n\n" + warns.join("\n") + "\n\nEnregistrer quand même ?")) return;
      try {
        await db.relevés.add(newReleve); alert("Relevé enregistré !");
        ['r-tension','r-intensite','r-frequence','r-cos','r-puissance','r-energie','r-press-huile','r-temp-eau','r-temp-huile','r-rpm','r-heure-marche','r-press-gasoil','r-air-adm','r-gasoil-mm','r-gasoil-litres']
          .forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
        refreshNow(); loadReleves();
      } catch (error) { console.error(error); }
    });
  }

  async function loadReleves() {
    const filter = document.getElementById('filter-groupe');
    if(!filter) return;
    const filtre = filter.value;
    const tbody = document.getElementById('tbody-releves');
    const table = document.querySelector('.table-responsive');
    if (filtre === 'G3') table.classList.remove('hide-t-hulle'); else table.classList.add('hide-t-hulle');
    tbody.innerHTML = '';
    
    const data = await db.relevés.where('groupe').equals(filtre).toArray();
    data.sort((a, b) => ((b.date || '') + (b.heure || '')).localeCompare((a.date || '') + (a.heure || '')));
    
    data.forEach(r => {
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      
      const p = (r.puissance !== undefined && r.puissance !== '') ? r.puissance : '-';
      const t = (r.tension !== undefined && r.tension !== '') ? r.tension : '-';
      const i = (r.intensite !== undefined && r.intensite !== '') ? r.intensite : '-';
      const c = (r.cos !== undefined && r.cos !== '') ? r.cos : '-';
      const rpm = (r.rpm !== undefined && r.rpm !== '') ? r.rpm : '-';
      const f = (r.frequence !== undefined && r.frequence !== '') ? r.frequence : '-';
      const te = (r.tempEau !== undefined && r.tempEau !== '') ? r.tempEau : '-';
      const th = (r.tempHuile !== undefined && r.tempHuile !== null && r.tempHuile !== '') ? r.tempHuile : '-';
      const trf = (r.transfo !== undefined && r.transfo !== '') ? r.transfo : '-';
      const ph = (r.pressHuile !== undefined && r.pressHuile !== '') ? r.pressHuile : '-';
      const pg = (r.pressGasoil !== undefined && r.pressGasoil !== '') ? r.pressGasoil : '-';
      const e = (r.energie !== undefined && r.energie !== '') ? r.energie : '-';
      const g = (r.gasoilLitres !== undefined && r.gasoilLitres !== '') ? r.gasoilLitres : '-';
      const hm = (r.heureMarche !== undefined && r.heureMarche !== '') ? r.heureMarche : '-';

      tr.innerHTML = `
        <td>${p}</td><td>${t}</td><td>${i}</td><td>${c}</td><td>${rpm}</td><td>${f}</td>
        <td>${te}</td><td class="col-g3">${th}</td><td>${trf}</td><td>${ph}</td><td>${pg}</td>
        <td>${e}</td><td>${g}</td><td>${hm}</td>
        <td style="text-align:center; padding: 4px 8px;">
          <button class="btn-del" style="background:#E5484D; color:white; border:none; border-radius:4px; padding:4px 8px; cursor:pointer;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
        </td>
      `;
      
      tr.querySelector('.btn-del').addEventListener('click', async (e) => {
        e.stopPropagation();
        if(confirm("Supprimer ce relevé ?")) { await db.relevés.delete(r.id); loadReleves(); }
      });
      
      tr.addEventListener('click', () => {
        window.showDetailsModal('relevés', r.id, 'Relevé ' + r.groupe, r.date + ' à ' + r.heure);
      });
      tbody.appendChild(tr);
    });
    document.querySelectorAll('.col-g3').forEach(c => { c.style.display = (filtre === 'G3') ? '' : 'none'; });
  }

  function downloadFile(name, content, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }
  const btnExportReleves = document.getElementById('btn-export-releves');
  if(btnExportReleves) {
    btnExportReleves.addEventListener('click', async () => {
      const g = document.getElementById('filter-groupe').value;
      const rows = await db.relevés.where('groupe').equals(g).toArray();
      if(!rows.length) { alert("Tsy misy relevé hatao export."); return; }
      rows.sort((a, b) => ((a.date || '') + (a.heure || '')).localeCompare((b.date || '') + (b.heure || '')));
      const keys = ['date','heure','groupe','puissance','tension','intensite','cos','rpm','frequence','tempEau','tempHuile','transfo','pressHuile','pressGasoil','energie','gasoilLitres','heureMarche','airAdm'];
      const csv = [keys.join(';')].concat(rows.map(r => keys.map(k => '"' + String(r[k] ?? '').replace(/"/g, '""') + '"').join(';'))).join('\r\n');
      downloadFile('releves_' + g + '_' + localDateStr() + '.csv', '\ufeff' + csv, 'text/csv;charset=utf-8');
    });
  }
  const filterGroupe = document.getElementById('filter-groupe');
  if(filterGroupe) { filterGroupe.addEventListener('change', loadReleves); loadReleves(); }

  // ==========================================
  // 5. PASSATION (Appoint & Transfert)
  // ==========================================
  let chronoTimer; let chronoSeconds = 0; let isChronoRunning = false;
  const chronoDisplay = document.getElementById('chrono-display');
  const btnStartChrono = document.getElementById('btn-start-chrono');
  const btnStopChrono = document.getElementById('btn-stop-chrono');

  function formatChrono(sec) {
    let m = Math.floor(sec / 60).toString().padStart(2, '0');
    let s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  if(btnStartChrono) {
    btnStartChrono.addEventListener('click', () => {
      if(isChronoRunning) return;
      isChronoRunning = true; btnStartChrono.disabled = true; btnStopChrono.disabled = false;
      chronoSeconds = 0; chronoDisplay.textContent = "00:00";
      chronoTimer = setInterval(() => { chronoSeconds++; chronoDisplay.textContent = formatChrono(chronoSeconds); }, 1000);
    });
  }
  if(btnStopChrono) {
    btnStopChrono.addEventListener('click', () => {
      if(!isChronoRunning) return;
      isChronoRunning = false; btnStartChrono.disabled = false; btnStopChrono.disabled = true; clearInterval(chronoTimer);
    });
  }

  function initCTSelects() {
    const ctOpts = [];
    for (let v = 400; v <= 2400; v += 5) { ctOpts.push(`<option value="${v}">${v}</option>`); }
    ['ap-ct-av', 'ap-ct-ap', 'tr-ct-av', 'tr-ct-ap'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.innerHTML = ctOpts.join('');
    });
  }
  initCTSelects();

  const apAvMm = document.getElementById('ap-av-mm'); const apApMm = document.getElementById('ap-ap-mm'); const apQte = document.getElementById('ap-qte');
  const apEtat = document.getElementById('ap-etat'); const apHeureAv = document.getElementById('ap-heure-av'); const apHeureAp = document.getElementById('ap-heure-ap');

  function calcDiffMinutes(h1, h2) {
    if(!h1 || !h2) return 0;
    let t1 = new Date("1970-01-01T" + h1 + "Z"); let t2 = new Date("1970-01-01T" + h2 + "Z");
    let diffMs = t2 - t1; if(diffMs < 0) diffMs += 86400000;
    return Math.floor(diffMs / 60000);
  }

  function calcAppoint() {
    if(!apAvMm || !apApMm) return;
    let av = parseFloat(apAvMm.value) || 0; let ap = parseFloat(apApMm.value) || 0;
    let qte = ap - av;
    if(apEtat && apEtat.value === "En marche") { let mins = calcDiffMinutes(apHeureAv.value, apHeureAp.value); qte = qte + mins; }
    apQte.textContent = qte.toFixed(0);
  }

  if(apAvMm) apAvMm.addEventListener('input', calcAppoint);
  if(apApMm) apApMm.addEventListener('input', calcAppoint);
  if(apHeureAv) apHeureAv.addEventListener('change', calcAppoint);
  if(apHeureAp) apHeureAp.addEventListener('change', calcAppoint);
  if(apEtat) apEtat.addEventListener('change', calcAppoint);

  const apCtAv = document.getElementById('ap-ct-av'); const apCtAp = document.getElementById('ap-ct-ap'); const apCtDiff = document.getElementById('ap-ct-diff');
  function calcAppointCT() { if(!apCtAv || !apCtAp) return; let av = parseInt(apCtAv.value) || 0; let ap = parseInt(apCtAp.value) || 0; apCtDiff.textContent = Math.abs(ap - av); }
  if(apCtAv) apCtAv.addEventListener('change', calcAppointCT);
  if(apCtAp) apCtAp.addEventListener('change', calcAppointCT);

  const trCtAv = document.getElementById('tr-ct-av'); const trCtAp = document.getElementById('tr-ct-ap'); const trQte = document.getElementById('tr-qte');
  function calcTransfert() { if(!trCtAv || !trCtAp) return; let av = parseInt(trCtAv.value) || 0; let ap = parseInt(trCtAp.value) || 0; trQte.textContent = ap - av; }
  if(trCtAv) trCtAv.addEventListener('change', calcTransfert);
  if(trCtAp) trCtAp.addEventListener('change', calcTransfert);

  const btnSaveAppoint = document.getElementById('btn-save-appoint');
  if(btnSaveAppoint) {
    btnSaveAppoint.addEventListener('click', async () => {
      const newAppoint = {
        groupe: document.getElementById('ap-groupe').value, date: document.getElementById('ap-date').value, etat: document.getElementById('ap-etat').value,
        heureAv: document.getElementById('ap-heure-av').value, heureAp: document.getElementById('ap-heure-ap').value, duree: chronoDisplay.textContent,
        avMm: document.getElementById('ap-av-mm').value, apMm: document.getElementById('ap-ap-mm').value, qteMm: document.getElementById('ap-qte').textContent,
        avCt: document.getElementById('ap-ct-av').value, apCt: document.getElementById('ap-ct-ap').value, obs: document.getElementById('ap-obs').value
      };
      try {
        await db.appoints.add(newAppoint); alert("Appoint enregistré avec succès !");
        document.getElementById('ap-av-mm').value = ''; document.getElementById('ap-ap-mm').value = '';
        document.getElementById('ap-heure-av').value = ''; document.getElementById('ap-heure-ap').value = '';
        document.getElementById('ap-obs').value = ''; calcAppoint(); chronoDisplay.textContent = "00:00"; loadHistorique();
      } catch (error) { console.error(error); }
    });
  }

  const btnSaveTransfert = document.getElementById('btn-save-transfert');
  if(btnSaveTransfert) {
    btnSaveTransfert.addEventListener('click', async () => {
      const newTransfert = {
        citerne: (document.getElementById('tr-citerne') || {}).value || '', pigeAv: (document.getElementById('tr-pige-av') || {}).value || '', pigeAp: (document.getElementById('tr-pige-ap') || {}).value || '',
        date: document.getElementById('tr-date').value, heure: document.getElementById('tr-heure').value,
        avCt: document.getElementById('tr-ct-av').value, apCt: document.getElementById('tr-ct-ap').value, qte: document.getElementById('tr-qte').textContent,
        compteurValeur: document.getElementById('tr-compteur-valeur').value, compteurTotal: document.getElementById('tr-compteur-total').value, obs: document.getElementById('tr-obs').value
      };
      try {
        await db.transferts.add(newTransfert); alert("Transfert enregistré avec succès !");
        document.getElementById('tr-compteur-valeur').value = ''; document.getElementById('tr-compteur-total').value = ''; document.getElementById('tr-obs').value = '';
        calcTransfert(); loadHistorique();
      } catch (error) { console.error(error); }
    });
  }

  if(document.getElementById('ap-date')) document.getElementById('ap-date').value = todayStr;
  if(document.getElementById('tr-date')) document.getElementById('tr-date').value = todayStr;
  if(document.getElementById('tr-heure')) document.getElementById('tr-heure').value = todayTime;

  async function loadHistorique() {
    const LIM = 15;   // lignes affichées ici ; "Voir tout" ouvre le tableau plein écran
    const fill = (box, arr, tbl, head, cells, empty) => {
      if (!box) return;
      if (!arr.length) { box.innerHTML = `<p style="color:#888;">${empty}</p>`; return; }
      const sl = arr.slice(0, LIM);
      box.innerHTML = `<div class="table-responsive hist-mini"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}<th></th></tr></thead><tbody>` +
        sl.map(r => `<tr class="clk">${cells(r).map(c => `<td>${c}</td>`).join('')}<td><button type="button" class="btn-suppr">Suppr.</button></td></tr>`).join('') +
        `</tbody></table></div>` + (arr.length > LIM ? `<button type="button" class="btn btn-black btn-full mt-14" data-all="1">Voir tout (${arr.length}) →</button>` : '');
      box.querySelectorAll('tbody tr').forEach((tr, i) => {
        const r = sl[i];
        tr.addEventListener('click', () => { const d = HIST[tbl].det(r); window.showDetailsModal(tbl, r.id, d[0], d[1]); });
        tr.querySelector('.btn-suppr').addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm("Hamafa ity historique ity ve ianao?")) { try { await db[tbl].delete(r.id); } catch (err) { console.error(err); } loadHistorique(); }
        });
      });
      const more = box.querySelector('[data-all]'); if (more) more.addEventListener('click', () => window.openTableView(tbl));
    };

    const dataAp = await db.appoints.toArray();
    dataAp.sort((a, b) => ((b.date || '') + (b.heureAv || '')).localeCompare((a.date || '') + (a.heureAv || '')) || (b.id - a.id));
    fill(document.getElementById('list-appoints'), dataAp, 'appoints',
      ['Date', 'Grp', 'État', 'Heures', 'Niveau (mm)', 'Qté', 'CT'],
      a => [escH(a.date), escH(a.groupe), escH(a.etat), `${escH(a.heureAv || '-')} → ${escH(a.heureAp || '-')}`, `${escH(a.avMm)} → ${escH(a.apMm)}`, `<b>${escH(a.qteMm)}</b>`, `${escH(a.avCt)} → ${escH(a.apCt)}`],
      'Tsy misy appoint mbola voatahiry.');

    const dataTr = await db.transferts.toArray();
    dataTr.sort((a, b) => ((b.date || '') + (b.heure || '')).localeCompare((a.date || '') + (a.heure || '')) || (b.id - a.id));
    fill(document.getElementById('list-transferts'), dataTr, 'transferts',
      ['Date', 'Heure', 'Citerne', 'Pige', 'CT', 'Qté', 'Compteur'],
      t => [escH(t.date), escH(t.heure), escH(t.citerne || '-'), `${escH(t.pigeAv ?? '-')} → ${escH(t.pigeAp ?? '-')}`, `${escH(t.avCt)} → ${escH(t.apCt)}`, `<b>${escH(t.qte)}</b>`, `${escH(t.compteurValeur || '-')} (${escH(t.compteurTotal || '-')})`],
      'Tsy misy transfert mbola voatahiry.');
  }

  const btnClearAppoints = document.getElementById('btn-clear-appoints');
  if(btnClearAppoints) {
    btnClearAppoints.addEventListener('click', async () => {
      if(confirm("Hamafa ny historique Appoints rehetra ve ianao?")) { await db.appoints.clear(); loadHistorique(); }
    });
  }
  const btnClearTransferts = document.getElementById('btn-clear-transferts');
  if(btnClearTransferts) {
    btnClearTransferts.addEventListener('click', async () => {
      if(confirm("Hamafa ny historique Transferts rehetra ve ianao?")) { await db.transferts.clear(); loadHistorique(); }
    });
  }

  // ==========================================
  // 6. CAHIER DE TRAVAUX
  // ==========================================
  const refs = {
    "Filtre à air": "P77.7871",
    "Filtre séparateur": "P55.0900",
    "Filtre à gasoil": "P55.1311",
    "Filtre à huile": "P55.1808"
  };

  const twType = document.getElementById('tw-type');
  const twRef = document.getElementById('tw-ref');
  const twExtra = document.getElementById('tw-extra-fields');
  const twAgent = document.getElementById('tw-agent');

  if(twType) {
    twType.addEventListener('change', () => {
      const type = twType.value;
      if(refs[type]) { twRef.value = refs[type]; } else { twRef.value = ''; }
      
      if(type === "Appoint d'eau") { 
        twExtra.classList.remove('hidden'); 
        if(twAgent) twAgent.placeholder = "Nom de la personne";
      } 
      else if (type === "Autres") {
        twExtra.classList.remove('hidden');
        if(twAgent) twAgent.placeholder = "Préciser le travail...";
      }
      else { 
        twExtra.classList.add('hidden'); 
        if(twAgent) twAgent.value = ''; 
      }
    });
  }

  if(document.getElementById('tw-date')) document.getElementById('tw-date').value = todayStr;

  const btnSaveTravail = document.getElementById('btn-save-travail');
  if(btnSaveTravail) {
    btnSaveTravail.addEventListener('click', async () => {
      let finalType = document.getElementById('tw-type').value;
      let agentVal = document.getElementById('tw-agent').value;

      if (finalType === "Autres") {
        if (!agentVal) { alert("Précise le travail s'il te plaît."); return; }
        finalType = agentVal;
        agentVal = ''; 
      }

      const newTravail = {
        date: document.getElementById('tw-date').value,
        groupe: document.getElementById('tw-groupe').value,
        hm: document.getElementById('tw-hm').value,
        type: finalType,
        ref: document.getElementById('tw-ref').value,
        qte: document.getElementById('tw-qte').value,
        agent: agentVal
      };
      try {
        await db.travaux.add(newTravail); 
        alert("Travail enregistré avec succès !");
        document.getElementById('tw-hm').value = ''; 
        document.getElementById('tw-qte').value = ''; 
        document.getElementById('tw-agent').value = '';
        loadTravaux();
      } catch (error) { console.error(error); }
    });
  }

  async function loadTravaux() {
    const tbody = document.getElementById('tbody-travaux');
    if(!tbody) return;
    const data = await db.travaux.reverse().toArray();
    if(data.length === 0) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#888;">Tsy misy travaux mbola voatahiry.</td></tr>'; return; }
    
    tbody.innerHTML = '';
    data.forEach(t => {
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.innerHTML = `
        <td>${t.date}</td><td>${t.groupe}</td><td>${t.hm || '-'}</td>
        <td>${t.type} ${t.agent ? '('+t.agent+')' : ''}</td><td>${t.ref || '-'}</td><td>${t.qte || '-'}</td>
        <td style="text-align:center; padding: 4px 8px;">
          <button class="btn-del" style="background:#E5484D; color:white; border:none; border-radius:4px; padding:4px 8px; cursor:pointer;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
        </td>
      `;
      tr.querySelector('.btn-del').addEventListener('click', async (e) => {
        e.stopPropagation();
        if(confirm("Supprimer ce travail ?")) { await db.travaux.delete(t.id); loadTravaux(); }
      });
      tr.addEventListener('click', () => {
        window.showDetailsModal('travaux', t.id, 'Travail ' + t.type, t.date);
      });
      tbody.appendChild(tr);
    });
  }

  const btnClearTravaux = document.getElementById('btn-clear-travaux');
  if(btnClearTravaux) {
    btnClearTravaux.addEventListener('click', async () => {
      if(confirm("Hamafa ny cahier de travaux rehetra ve ianao?")) { await db.travaux.clear(); loadTravaux(); }
    });
  }

  // ==========================================
  // 7. CALENDRIER (Logique 16 Nov = Nan/Jim)
  // ==========================================
  const ALL = ['Eddy', 'Jimmy', 'Nandrianina', 'Michel']; 
  let viewYear = new Date().getFullYear(); let viewMonth = new Date().getMonth();
  let leaves = JSON.parse(localStorage.getItem('hffc_leaves') || '[]');
  const monthsFr = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const weekdaysFr = ['LUN','MAR','MER','JEU','VEN','SAM','DIM'];
  const blockedDates = [ {m:0, d:1}, {m:5, d:26}, {m:11, d:25}, {m:11, d:31} ];

  function onLeave(n, d) { return leaves.some(l => n === l.name && d >= new Date(l.start + 'T00:00:00') && d <= new Date(l.end + 'T00:00:00')); }
  const BASE_DATE = new Date(2026, 10, 16); 
  
  function getSched(date) {
    let d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    let diffDays = Math.floor((d - BASE_DATE) / 86400000);
    
    if (d < new Date(2026, 10, 24)) {
      let o = ['Nandrianina', 'Jimmy', 'Eddy'];
      let idxJour = ((diffDays * 2) % 3 + 3) % 3;
      let idxNuit = (idxJour + 1) % 3;
      return { jour: o[idxJour], nuit: o[idxNuit] };
    } else {
      let o4 = ['Nandrianina', 'Jimmy', 'Eddy', 'Michel'];
      let idxJour = ((diffDays * 2) % 4 + 4) % 4;
      let idxNuit = (idxJour + 1) % 4;
      return { jour: o4[idxJour], nuit: o4[idxNuit] };
    }
  }

  function fmtLong(d) { return weekdaysFr[(d.getDay()+6)%7] + ' ' + d.getDate() + ' ' + monthsFr[d.getMonth()] + ' ' + d.getFullYear(); }

  function renderCal() {
    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');
    if (!yearSelect || !monthSelect) return;
    if (yearSelect.options.length === 0) {
      for (let y = 2025; y <= 2030; y++) { let opt = document.createElement('option'); opt.value = y; opt.textContent = y; if (y === viewYear) opt.selected = true; yearSelect.appendChild(opt); }
      monthsFr.forEach((m, i) => { let opt = document.createElement('option'); opt.value = i; opt.textContent = m; if (i === viewMonth) opt.selected = true; monthSelect.appendChild(opt); });
    }
    viewYear = parseInt(yearSelect.value); viewMonth = parseInt(monthSelect.value);
    const wdRow = document.getElementById('weekdaysRow');
    if(wdRow) wdRow.innerHTML = weekdaysFr.map(d => `<div>${d}</div>`).join('');
    const cal = document.getElementById('calendar'); 
    if(!cal) return;
    cal.innerHTML = '';
    const first = new Date(viewYear, viewMonth, 1); 
    const off = (first.getDay() + 6) % 7; 
    const todayObj = new Date();

    for (let i = 0; i < 42; i++) {
      let d = new Date(viewYear, viewMonth, 1 - off + i);
      let isO = d.getMonth() !== viewMonth; 
      let div = document.createElement('div');
      div.className = 'day';
      if (isO) div.style.opacity = '0.4';
      if (d.toDateString() === todayObj.toDateString()) div.classList.add('today');
      if (leaves.length) { const sc = getSched(d); if (onLeave(sc.jour, d) || onLeave(sc.nuit, d)) div.style.borderColor = '#E5484D'; }
      div.innerHTML = `<div>${d.getDate()}</div>`;
      div.addEventListener('click', () => {
        const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        openModal(iso);
      });
      cal.appendChild(div);
      if (i > 35 && d.getMonth() !== viewMonth && d.getDate() > 7) break;
    }
  }

  const btnPrev = document.getElementById('btnCalPrev'); const btnNext = document.getElementById('btnCalNext'); const btnToday = document.getElementById('btnCalToday');
  if(btnPrev) btnPrev.addEventListener('click', () => { viewMonth--; if(viewMonth < 0) { viewMonth = 11; viewYear--; } document.getElementById('yearSelect').value = viewYear; document.getElementById('monthSelect').value = viewMonth; renderCal(); });
  if(btnNext) btnNext.addEventListener('click', () => { viewMonth++; if(viewMonth > 11) { viewMonth = 0; viewYear++; } document.getElementById('yearSelect').value = viewYear; document.getElementById('monthSelect').value = viewMonth; renderCal(); });
  if(btnToday) btnToday.addEventListener('click', () => { let n = new Date(); viewYear = n.getFullYear(); viewMonth = n.getMonth(); document.getElementById('yearSelect').value = viewYear; document.getElementById('monthSelect').value = viewMonth; renderCal(); });
  if(document.getElementById('yearSelect')) document.getElementById('yearSelect').addEventListener('change', renderCal);
  if(document.getElementById('monthSelect')) document.getElementById('monthSelect').addEventListener('change', renderCal);

  // ==========================================
  // 8. MODAL JOUR
  // ==========================================
  // Si l'agent prévu est en congé => remplaçant (1er agent libre). Ovay ny fitsipika raha hafa.
  function resolveLeave(d, s) {
    const out = { jour: { name: s.jour }, nuit: { name: s.nuit } };
    const michelOk = d >= new Date(2026, 10, 24);
    ['jour', 'nuit'].forEach(k => {
      if (onLeave(s[k], d)) {
        const pool = ALL.filter(n => n !== s.jour && n !== s.nuit && !onLeave(n, d) && (n !== 'Michel' || michelOk));
        out[k] = { name: pool[0] || '—', replaced: s[k] };
      }
    });
    return out;
  }
  function openModal(iso) {
    const d = new Date(iso + 'T00:00:00'); const s = getSched(d); const r = resolveLeave(d, s);
    document.getElementById('modalTitle').textContent = fmtLong(d);
    document.getElementById('modalSubtitle').textContent = 'Mahanoro';
    document.getElementById('modalAgents').innerHTML = `
      <div class="agent-row" style="margin-bottom:10px;"><div><b>${r.jour.name}</b><small>Jour 7h-17h${r.jour.replaced ? ' · remplace ' + r.jour.replaced + ' (en congé)' : ''}</small></div></div>
      <div class="agent-row"><div><b>${r.nuit.name}</b><small>Nuit 17h-7h${r.nuit.replaced ? ' · remplace ' + r.nuit.replaced + ' (en congé)' : ''}</small></div></div>
    `;
    document.getElementById('dayModal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  const closeModal = () => { document.getElementById('dayModal').classList.remove('open'); document.body.style.overflow = ''; };
  if(document.getElementById('btnCloseModal')) document.getElementById('btnCloseModal').addEventListener('click', closeModal);
  if(document.getElementById('btnCloseModal2')) document.getElementById('btnCloseModal2').addEventListener('click', closeModal);
  if(document.getElementById('dayModal')) document.getElementById('dayModal').addEventListener('click', (e) => { if (e.target === document.getElementById('dayModal')) closeModal(); });

  // ==========================================
  // 9. MODAL CONGÉS
  // ==========================================
  const openLeaveModal = () => { document.getElementById('leaveModal').classList.add('open'); document.body.style.overflow = 'hidden'; renderLeaveList(); };
  const closeLeaveModal = () => { document.getElementById('leaveModal').classList.remove('open'); document.body.style.overflow = ''; };
  const btnOpenLeaves = document.getElementById('btnOpenLeaves'); 
  if(btnOpenLeaves) btnOpenLeaves.addEventListener('click', openLeaveModal);
  if(document.getElementById('btnCloseLeaveModal')) document.getElementById('btnCloseLeaveModal').addEventListener('click', closeLeaveModal);
  if(document.getElementById('btnCloseLeaveModal2')) document.getElementById('btnCloseLeaveModal2').addEventListener('click', closeLeaveModal);
  if(document.getElementById('leaveModal')) document.getElementById('leaveModal').addEventListener('click', (e) => { if (e.target === document.getElementById('leaveModal')) closeLeaveModal(); });

  function renderLeaveList() {
    const el = document.getElementById('leaveList');
    if (!el) return;
    if (!leaves.length) { el.innerHTML = '<p style="color:#888;font-size:14px;padding:10px 0">Aucun congé enregistré.</p>'; return; }
    el.innerHTML = leaves.map((l, i) => `<div class="list-item" style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:8px; padding:10px; border:1px solid var(--border); border-radius:6px;"><span><b style="font-size:15px;">${l.name}</b><br><small style="font-size:13px;">${l.start} → ${l.end}</small></span><button type="button" class="del" data-del="${i}" style="background:#E5484D; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:12px;">Suppr.</button></div>`).join('');
    el.querySelectorAll('[data-del]').forEach(b => {
      b.addEventListener('click', () => {
        leaves.splice(parseInt(b.getAttribute('data-del')), 1);
        localStorage.setItem('hffc_leaves', JSON.stringify(leaves));
        renderCal(); renderLeaveList();
      });
    });
  }

  const btnAddLeave = document.getElementById('btnAddLeave');
  if(btnAddLeave) {
    btnAddLeave.addEventListener('click', () => {
      const n = document.getElementById('leaveName').value; const s = document.getElementById('leaveStart').value; const e = document.getElementById('leaveEnd').value;
      if (!s || !e || e < s) { alert('Dates invalides.'); return; }
      let cur = new Date(s + 'T00:00:00'); let end = new Date(e + 'T00:00:00'); let isBlocked = false;
      while(cur <= end) { if (blockedDates.some(b => b.m === cur.getMonth() && b.d === cur.getDate())) { isBlocked = true; break; } cur.setDate(cur.getDate() + 1); }
      if (isBlocked) { alert("REFUSÉ : Tsy azo atao ny miala sasatra amin'ny 01 Janvier, 26 Juin, 25 Décembre na 31 Décembre."); return; }
      leaves.push({ name: n, start: s, end: e }); localStorage.setItem('hffc_leaves', JSON.stringify(leaves));
      renderCal(); renderLeaveList(); alert(n + ' : Congé ajouté. Le calendrier a été mis à jour.'); closeLeaveModal();
    });
  }
  if(document.getElementById('leaveStart')) document.getElementById('leaveStart').value = todayStr;
  if(document.getElementById('leaveEnd')) document.getElementById('leaveEnd').value = todayStr;

  // ==========================================
  // 10. FICHE D'EXPLOITATION (kopia ny taratasy, feno ho azy avy amin'ny Passation/Relevés/Travaux)
  // ==========================================
  const fichePage = document.getElementById('page-fiche');
  const G = [1, 2, 3];
  const fNum = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(n) ? null : n; };
  const fmt = (v, d = 0) => (v == null || isNaN(v)) ? '' : (+v).toFixed(d);
  const mmToLs = mm => { if (mm == null) return null; const v = mmToL(mm); return v !== '' ? v : mm * 3.8837; };
  const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return localDateStr(d); };
  const dayOf = (date, heure) => (heure && heure < '06:00') ? addDays(date, -1) : date; // andro fiche = 06h → 06h
  let curDate = dayOf(localDateStr(), localTimeStr()), userZoom = false;
  const el = k => fichePage.querySelector(`[data-k="${k}"]`);
  const put = (k, v) => { const e = el(k); if (e) e.value = v; };
  const pre = (k, v) => { const e = el(k); if (e && e.value === '' && v != null && v !== '' && !(typeof v === 'number' && isNaN(v))) e.value = v; };

  // Citerne + pige ao amin'ny Transfert (Passation)
  (function () {
    const a = document.getElementById('tr-ct-av');
    if (!a || document.getElementById('tr-citerne')) return;
    a.closest('.grid2').insertAdjacentHTML('beforebegin',
      `<label>Citerne</label><select id="tr-citerne"><option>N°1</option><option>N°2</option><option>N°3</option></select>
       <div class="grid2" style="margin:10px 0"><div><label>Pige AV (cm)</label><input type="number" id="tr-pige-av"></div>
       <div><label>Pige AP (cm)</label><input type="number" id="tr-pige-ap"></div></div>`);
  })();

  function buildFiche(nAp, nTr) {
    const I = k => `<input data-k="${k}" inputmode="decimal" autocomplete="off">`;
    const T = k => `<input data-k="${k}" autocomplete="off">`;
    const A = k => `<input data-k="${k}" class="auto" readonly tabindex="-1">`;
    const X = '<td class="x"></td>';
    const GE = ['GE1-C15-LNA04001-MHR', 'GE2-C15-LNA03649-MHR', 'GE3-C15-LXJ0933-MHR'];
    const rel = t => `<table class="fp-t"><tr><th>RELEVE à 06 H J${t ? '+1' : ''}</th>${GE.map(x => `<th>${x}</th>`).join('')}</tr>
      <tr><th class="l">Index HM EMCP</th>${G.map(n => `<td>${I('hm' + t + '_' + n)}</td>`).join('')}</tr>
      <tr><th class="l">Index kWh EMCP</th>${G.map(n => `<td>${I('kwh' + t + '_' + n)}</td>`).join('')}</tr>
      <tr><th class="l">Index kWh JIRAMA</th>${G.map(n => n === 3 ? X : `<td>${I('jir' + t + '_' + n)}</td>`).join('')}</tr>
      <tr><th class="l">NIVEAU GO</th>${G.map(n => `<td>${I('niv' + t + '_' + n)}</td>`).join('')}</tr></table>`;
    let trR = '', apR = '';
    for (let i = 1; i <= nTr; i++) trR += `<tr>${['cit', 'pav', 'pap', 'cpt', 'cav', 'cap'].map(f => `<td>${A('tr' + i + '_' + f)}</td>`).join('')}</tr>`;
    for (let i = 1; i <= nAp; i++) {
      const c = s => G.map(n => ['av', 'ap', 'q'].map(f => `<td>${A(`ap${n}_${i}_${f}${s}`)}</td>`).join('')).join('');
      apR += `<tr><th class="l" rowspan="2">${i}${i === 1 ? ' èr' : ' ém'} Appt</th>${c('L')}</tr><tr>${c('C')}</tr>`;
    }
    const en = (lbl, x) => `<tr><th class="l">${lbl}:</th>${G.map(n => `<td>${T(`en_${x}_${n}`)}</td>`).join('')}</tr>`;
    return `
    <div class="fp-band"><div class="fp-head"><div class="fp-brand"><b>HENRI FRAISE FILS &amp; Cie</b><br>Power System</div><div class="fp-cat">CAT</div>
      <div class="fp-date">DATE : <input type="date" id="f-date" value="${curDate}"></div></div>
      <table class="fp-t"><tr><th colspan="3">REALISATION U JOUR</th></tr>
        <tr><th>TOTAL PRODUCTIONS</th><th>JIRAMA</th><th>HFF</th></tr>
        <tr><th class="l">PRODUCTIONS ( kWh )</th><td>${A('rj_prod')}</td><td>${A('rh_prod')}</td></tr>
        <tr><th class="l">CONSOMMATION ( Litres )</th>${X}<td>${A('rh_consom')}</td></tr>
        <tr><th class="l">CSP ( g/kWh )</th>${X}<td>${A('rh_csp')}</td></tr></table></div>
    <div class="fp-title">FICHE D'EXPLOITATION JOURNALIER MAHANORO</div>
    <div class="fp-band"><div>
      <table class="fp-t"><tr><th>OBSERVATION GENERALE</th><th>AQ JOUR MATIN</th><th>AQ JOUR MIDI</th><th>AQ NUIT</th></tr>
        <tr><td><textarea data-k="obs"></textarea></td><td>${T('aq_m')}</td><td>${T('aq_d')}</td><td>${T('aq_n')}</td></tr></table>
      ${rel(0)}</div>
      <div><table class="fp-t"><tr><th rowspan="2">POINTE MAX</th><th>JOUR (kW)</th><td>${I('pt_j')}</td></tr><tr><th>NUIT (kW)</th><td>${I('pt_n')}</td></tr>
        <tr><th colspan="2">HM Central</th><td>${I('hmc')}</td></tr></table>
      <table class="fp-t"><tr><th colspan="4">ENTRETIEN GROUPE</th></tr><tr><th></th><th>GE1</th><th>GE2</th><th>GE3</th></tr>
        ${en('HL', 'hl')}${en('AIR', 'air')}${en('GO', 'go')}${en('SEP', 'sep')}
        <tr><th class="l">AUX</th><td colspan="3">${T('aux')}</td></tr><tr><th class="l">COMPT GN</th><td colspan="3">${T('cgn')}</td></tr></table></div></div>
    <div class="fp-band"><div>
      <div class="fp-sub">TRANSFERT GO : CITERNE VERS CUVE 2 500 L</div>
      <table class="fp-t"><tr><th>CITERNE</th><th>PIGE AV</th><th>PIGE AP</th><th>COMPTEUR</th><th>CUVE T AV</th><th>CUVE T AP</th></tr>${trR}</table>
      <div class="fp-sub">APPOINT GO GROUPE <small>(ligne 1 = litres groupe · ligne 2 = Cuve T en cm)</small></div>
      <table class="fp-t"><tr><th rowspan="2"></th>${G.map(n => `<th colspan="3">GE${n}</th>`).join('')}</tr>
        <tr>${G.map(() => '<th>AVANT</th><th>APRES</th><th>Qté (L)</th>').join('')}</tr>${apR}</table></div>
      <div><div class="fp-sub">TRAVAUX</div><table class="fp-t"><tr><td><textarea data-k="trav" style="min-height:300px"></textarea></td></tr></table></div></div>
    <div class="fp-band"><div>${rel(1)}
      <div class="fp-sub">PRODUCTION PAR GROUPE</div>
      <table class="fp-t"><tr><th></th><th>GE1</th><th>GE2</th><th>GE3</th></tr>
        <tr><th class="l">PRODUCTION (kWh)</th>${G.map(n => `<td>${A('p_' + n)}</td>`).join('')}</tr>
        <tr><th class="l">CONSOM GO (Litres)</th>${G.map(n => `<td>${A('c_' + n)}</td>`).join('')}</tr>
        <tr><th class="l">Heures de Marche</th>${G.map(n => `<td>${A('h_' + n)}</td>`).join('')}</tr>
        <tr><th class="l">CSP ( g/kWh )</th>${G.map(n => `<td>${A('s_' + n)}</td>`).join('')}</tr>
        <tr><th class="l">Pointe MAX</th>${G.map(n => `<td>${I('pt_' + n)}</td>`).join('')}</tr></table></div>
      <div><table class="fp-t"><tr><th colspan="3">PIGE CITERNE ET CUVE 2500 L</th></tr><tr><th></th><th>AV <small>(Jour)</small></th><th>AP <small>(Nuit)</small></th></tr>
        ${[1, 2, 3].map(c => `<tr><th>N° ${c}</th><td>${I('pg' + c + '_av')}</td><td>${I('pg' + c + '_ap')}</td></tr>`).join('')}
        <tr><th>CUVE T</th><td>${I('pgT_av')}</td><td>${I('pgT_ap')}</td></tr>
        <tr><th>COMPTEUR <small>(Total)</small></th><td colspan="2">${I('pgC')}</td></tr></table></div></div>`;
  }

  async function ficheData(d) {
    const d1 = addDays(d, 1);
    const near = async (n, date, ok, win) => {
      const rows = (await db.relevés.where('groupe').equals('G' + n).toArray()).filter(r => r.date === date && r.heure && (!ok || ok(r)));
      let best = null, bd = (win || 60) + 1;
      rows.forEach(r => { const x = Math.abs(+r.heure.slice(0, 2) * 60 + +r.heure.slice(3, 5) - 360); if (x < bd) { bd = x; best = r; } });
      return best;
    };
    // NIVEAU GO = valeur déjà convertie en litres (relevé le plus proche de 06h qui a une jauge)
    const nivL = r => { if (!r) return null; const a = fNum(r.gasoilLitres); if (a != null) return a; const b = mmToL(r.gasoilMm); return b === '' ? null : b; };
    const hasNiv = r => nivL(r) != null;
    const rel = {}, niv = {};
    for (const n of G) {
      rel[n] = [await near(n, d), await near(n, d1)];
      niv[n] = [nivL(await near(n, d, hasNiv, 180)), nivL(await near(n, d1, hasNiv, 180))];
    }
    // Ordre chronologique réel dans la journée de fiche (06h → 06h) : 1er appoint, 2ème appoint...
    const m6 = h => (h && /^\d{1,2}:\d{2}/.test(h)) ? ((+h.slice(0, 2)) * 60 + (+h.slice(3, 5)) - 360 + 1440) % 1440 : null;
    const chrono = hf => (a, b) => {
      const x = m6(hf(a)), y = m6(hf(b));
      if (x != null && y != null && x !== y) return x - y;
      if (x != null && y == null) return -1;
      if (x == null && y != null) return 1;
      return (a.id || 0) - (b.id || 0);
    };
    const aps = (await db.appoints.toArray()).filter(a => dayOf(a.date, a.heureAv) === d).sort(chrono(a => a.heureAv || a.heureAp));
    const trs = (await db.transferts.toArray()).filter(t => dayOf(t.date, t.heure) === d).sort(chrono(t => t.heure));
    const tws = await db.travaux.where('date').equals(d).toArray();
    return { rel, niv, aps, trs, tws };
  }

  function compute() {
    const g = k => fNum((el(k) || {}).value);
    let tp = 0, tc = 0, tj = 0, aP = false, aC = false, aJ = false;
    G.forEach(n => {
      const p = (g('kwh1_' + n) != null && g('kwh0_' + n) != null) ? g('kwh1_' + n) - g('kwh0_' + n) : null;        // HFF = EMCP J+1 − J
      const h = (g('hm1_' + n) != null && g('hm0_' + n) != null) ? g('hm1_' + n) - g('hm0_' + n) : null;
      let q = 0; fichePage.querySelectorAll(`[data-k^="ap${n}_"][data-k$="_qL"]`).forEach(e => q += fNum(e.value) || 0);
      const c = (g('niv0_' + n) != null && g('niv1_' + n) != null) ? g('niv0_' + n) + q - g('niv1_' + n) : null;      // Consom = Niveau J + Qté − Niveau J+1
      const s = (c != null && p > 0) ? c * CFG.densite / p : null;
      put('p_' + n, fmt(p)); put('c_' + n, fmt(c)); put('h_' + n, fmt(h, 1)); put('s_' + n, fmt(s));
      if (p != null) { tp += p; aP = true; }
      if (c != null) { tc += c; aC = true; }
      if (n < 3 && g('jir1_' + n) != null && g('jir0_' + n) != null) { tj += (g('jir1_' + n) - g('jir0_' + n)) * (n === 1 ? 8 : 1); aJ = true; } // JIRAMA: G1 ×8, G2 ×1, G3 tsy misy
    });
    put('rh_prod', aP ? fmt(tp) : ''); put('rj_prod', aJ ? fmt(tj) : '');
    put('rh_consom', aC ? fmt(tc) : ''); put('rh_csp', (aP && aC && tp > 0) ? fmt(tc * CFG.densite / tp) : ''); // JIRAMA: tsy misy consom/CSP
  }

  async function loadFiche(reset) {
    const d = curDate, D = await ficheData(d);
    const saved = reset ? null : await db.fiches.where('date').equals(d).first();
    const byG = { 1: [], 2: [], 3: [] };
    D.aps.forEach(a => { const n = +String(a.groupe).slice(1); if (byG[n]) byG[n].push(a); });
    const body = document.getElementById('fp-body');
    body.innerHTML = buildFiche(Math.max(3, ...G.map(n => byG[n].length)), Math.max(2, D.trs.length));
    if (saved && saved.vals) Object.keys(saved.vals).forEach(k => { const e = el(k); if (e && !e.readOnly) e.value = saved.vals[k]; });
    // RELEVÉ à 06 H J = RELEVÉ à 06 H J+1 de la fiche d'hier (même mesure) : mipetraka ho azy
    const prev = await db.fiches.where('date').equals(addDays(d, -1)).first();
    if (prev && prev.vals) G.forEach(n => ['hm', 'kwh', 'jir', 'niv'].forEach(f => {
      if (f === 'jir' && n === 3) return;
      const v = prev.vals[f + '1_' + n]; if (v !== undefined && v !== '') put(f + '0_' + n, v);
    }));

    // Appoint (avy amin'ny Passation) : ligne 1 = litres groupe (après conversion), ligne 2 = CT
    G.forEach(n => byG[n].forEach((a, i) => {
      const av = fNum(a.avMm), ap = fNum(a.apMm), qm = fNum(a.qteMm), avL = mmToLs(av), apL = mmToLs(ap);
      const dm = String(a.duree || '').match(/^(\d+):(\d+)$/), chr = dm ? (+dm[1] + +dm[2] / 60) : 0;   // Durée (chrono MM:SS) → minitra
      const mins = chr > 0 ? chr : calcDiffMinutes(a.heureAv, a.heureAp);                               // raha tsy misy chrono: Heure AV → AP
      const qL = (apL != null && avL != null) ? (apL - avL) + mins : null;
      const k = `ap${n}_${i + 1}_`, cA = fNum(a.avCt), cP = fNum(a.apCt);
      put(k + 'avL', fmt(avL)); put(k + 'apL', fmt(apL)); put(k + 'qL', fmt(qL));
      put(k + 'avC', a.avCt ?? ''); put(k + 'apC', a.apCt ?? ''); put(k + 'qC', (cA != null && cP != null) ? Math.abs(cP - cA) : '');
    }));
    // Transfert (citerne iza, pige, compteur, cuve T)
    D.trs.forEach((t, i) => { const k = 'tr' + (i + 1) + '_'; put(k + 'cit', t.citerne || '—'); put(k + 'pav', t.pigeAv ?? ''); put(k + 'pap', t.pigeAp ?? ''); put(k + 'cpt', t.compteurValeur ?? ''); put(k + 'cav', t.avCt ?? ''); put(k + 'cap', t.apCt ?? ''); });
    // Pige : côté gauche (AV) = mpiasa jour (06h–17h) · côté droit (AP) = mpiasa alina (17h–06h)
    const mn = t => (t.heure && /^\d{1,2}:\d{2}/.test(t.heure)) ? (+t.heure.slice(0, 2)) * 60 + (+t.heure.slice(3, 5)) : null;
    const isDay = t => { const m = mn(t); return m != null && m >= 360 && m < 1020; };
    const firstOf = l => l.filter(isDay)[0] || l[0];
    const lastOf = l => { const nt = l.filter(t => !isDay(t)); return nt.length ? nt[nt.length - 1] : l[l.length - 1]; };
    [1, 2, 3].forEach(c => { const l = D.trs.filter(t => String(t.citerne).slice(-1) === String(c)); if (l.length) { pre('pg' + c + '_av', firstOf(l).pigeAv); pre('pg' + c + '_ap', lastOf(l).pigeAp); } });
    if (D.trs.length) {
      pre('pgT_av', firstOf(D.trs).avCt); pre('pgT_ap', lastOf(D.trs).apCt);
      const lt = D.trs[D.trs.length - 1];                       // COMPTEUR = « Total ou E du compteur » du dernier transfert
      pre('pgC', (lt.compteurTotal !== undefined && lt.compteurTotal !== '') ? lt.compteurTotal : lt.compteurValeur);
    }
    // Relevé 06h J / J+1
    G.forEach(n => [0, 1].forEach(t => { const r = D.rel[n][t]; if (r) { pre('hm' + t + '_' + n, r.heureMarche); pre('kwh' + t + '_' + n, r.energie); } const v = D.niv[n][t]; if (v != null) pre('niv' + t + '_' + n, fmt(v, 2)); }));
    // Entretien + Travaux
    const EN = { hl: 'Filtre à huile', air: 'Filtre à air', go: 'Filtre à gasoil', sep: 'Filtre séparateur' };
    D.tws.forEach(t => { const n = +String(t.groupe).slice(1); Object.keys(EN).forEach(x => { if (t.type === EN[x]) pre(`en_${x}_${n}`, t.hm || 'OK'); }); });
    pre('trav', D.tws.map(t => `${t.groupe} : ${t.type}${t.hm ? ' (HM ' + t.hm + ')' : ''}${t.qte ? ' – ' + t.qte : ''}`).join('\n'));
    // AQ avy amin'ny Calendrier
    const dt = new Date(d + 'T00:00:00'), rv = resolveLeave(dt, getSched(dt));
    pre('aq_m', rv.jour.name); pre('aq_n', rv.nuit.name);
    compute();
  }

  function fitFiche() {
    const sc = document.getElementById('fp-scroll'), p = document.getElementById('fp-paper');
    if (sc && p && sc.clientWidth) p.style.zoom = Math.max(0.35, Math.min(window.innerWidth >= 1024 ? 2.6 : 1.6, (sc.clientWidth - 4) / 1000));
  }
  function fitPrint() {   // calcule le zoom pour que la fiche tienne sur 1 page A4 paysage (géométrie « impression »)
    const p = document.getElementById('fp-paper'); if (!p) return;
    p.classList.add('pm');
    const z = p.style.zoom; p.style.zoom = '1';
    const h = p.offsetHeight, w = p.offsetWidth; p.style.zoom = z;
    if (!h || !w) return;
    const k = Math.min(1077 / w, 735 / h) * 0.97;
    p.style.setProperty('--pz', Math.max(0.3, Math.min(1.2, k)).toFixed(3));
  }
  window.addEventListener('beforeprint', fitPrint);
  window.addEventListener('afterprint', () => { const p = document.getElementById('fp-paper'); if (p) p.classList.remove('pm'); });
  window.fitPrint = fitPrint;
  function zoomFiche(f) { const p = document.getElementById('fp-paper'); userZoom = true; p.style.zoom = Math.max(0.3, Math.min(2, (parseFloat(p.style.zoom) || 1) * f)); }

  if (fichePage) {
    fichePage.innerHTML = `<div class="fp-bar">
      <button data-act="zo">−</button><button data-act="zi">＋</button><button data-act="fit">Ajuster</button>
      <button data-act="reset">${ICO('refresh',14)} Actualiser</button><button class="y" id="btn-save-fiche">Enregistrer</button><button id="btn-print-fiche">Imprimer</button></div>
      <div class="fp-scroll" id="fp-scroll"><div class="fp-paper" id="fp-paper"><div id="fp-body"></div></div></div>`;
    fichePage.addEventListener('input', e => { if (e.target.dataset && e.target.dataset.k) compute(); });
    fichePage.addEventListener('change', e => { if (e.target.id === 'f-date' && e.target.value) { curDate = e.target.value; loadFiche(); } });
    fichePage.addEventListener('click', async e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.act === 'zi') zoomFiche(1.2);
      if (b.dataset.act === 'zo') zoomFiche(1 / 1.2);
      if (b.dataset.act === 'fit') { userZoom = false; fitFiche(); }
      if (b.dataset.act === 'reset') { if (confirm('Averina avy amin\'ny Passation/Relevés ny fiche ve?')) loadFiche(true); }
      if (b.id === 'btn-print-fiche') window.print();
      if (b.id === 'btn-save-fiche') {
        const vals = {}; fichePage.querySelectorAll('[data-k]').forEach(x => vals[x.dataset.k] = x.value);
        const rec = { date: curDate, statut: 'soumise', vals, totalProd: vals.rh_prod, totalGo: vals.rh_consom, csp: vals.rh_csp };
        try {
          const old = await db.fiches.where('date').equals(curDate).first();
          if (old) await db.fiches.update(old.id, rec); else await db.fiches.add(rec);
          alert('Fiche enregistrée avec succès !');
        } catch (err) { console.error(err); alert("Erreur lors de l'enregistrement."); }
      }
    });
    window.ficheOpen = d => { curDate = d; window.goToPage('page-fiche'); };
    window.ficheShow = async () => { await loadFiche(); if (!userZoom) fitFiche(); };
    window.addEventListener('resize', () => { if (!userZoom && fichePage.classList.contains('active')) fitFiche(); });
  }

  // ==========================================
  // 11. MODAL DÉTAILS (Modifier & Supprimer)
  // ==========================================
  let currentEditData = null; let currentTable = null; let currentId = null;

  window.showDetailsModal = async function(table, id, title, subtitle) {
    currentTable = table; currentId = id;
    try {
      currentEditData = await db[table].get(id);
      document.getElementById('detailsModalTitle').textContent = title;
      document.getElementById('detailsModalSubtitle').textContent = subtitle;
      
      let contentHTML = '';
      if (table === 'relevés') {
        contentHTML = `
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; font-size:15px;">
            <div><b>Puissance:</b> ${currentEditData.puissance||'-'}</div><div><b>Tension:</b> ${currentEditData.tension||'-'}</div>
            <div><b>Intensité:</b> ${currentEditData.intensite||'-'}</div><div><b>Cos:</b> ${currentEditData.cos||'-'}</div>
            <div><b>RPM:</b> ${currentEditData.rpm||'-'}</div><div><b>Fréquence:</b> ${currentEditData.frequence||'-'}</div>
            <div><b>T° Eau:</b> ${currentEditData.tempEau||'-'}</div><div><b>T° Huile:</b> ${currentEditData.tempHuile||'-'}</div>
            <div><b>Transfo:</b> ${currentEditData.transfo||'-'}</div><div><b>P. Huile:</b> ${currentEditData.pressHuile||'-'}</div>
            <div><b>P. Gasoil:</b> ${currentEditData.pressGasoil||'-'}</div><div><b>Énergie:</b> ${currentEditData.energie||'-'}</div>
            <div><b>Gasoil:</b> ${currentEditData.gasoilLitres||'-'}</div><div><b>H. Marche:</b> ${currentEditData.heureMarche||'-'}</div>
          </div>
        `;
      } else if (table === 'travaux') {
        contentHTML = `
          <div style="font-size:15px; line-height:1.8;">
            <p><b>Groupe:</b> ${currentEditData.groupe}</p><p><b>HM:</b> ${currentEditData.hm || '-'}</p>
            <p><b>Travail:</b> ${currentEditData.type}</p><p><b>Référence:</b> ${currentEditData.ref || '-'}</p>
            <p><b>Quantité:</b> ${currentEditData.qte || '-'}</p><p><b>Agent:</b> ${currentEditData.agent || '-'}</p>
          </div>
        `;
      } else if (table === 'appoints') {
        contentHTML = `
          <div style="font-size:15px; line-height:1.8;">
            <p><b>Groupe:</b> ${currentEditData.groupe} (${currentEditData.etat})</p>
            <p><b>Heures:</b> ${currentEditData.heureAv||'-'} → ${currentEditData.heureAp||'-'} (${currentEditData.duree})</p>
            <p><b>Niveaux:</b> ${currentEditData.avMm} → ${currentEditData.apMm} mm (Qte: ${currentEditData.qteMm})</p>
            <p><b>CT:</b> ${currentEditData.avCt} → ${currentEditData.apCt}</p><p><b>Obs:</b> ${currentEditData.obs||'-'}</p>
          </div>
        `;
      } else if (table === 'transferts') {
        contentHTML = `
          <div style="font-size:15px; line-height:1.8;">
            <p><b>Citerne:</b> ${currentEditData.citerne || '-'} · <b>Pige:</b> ${currentEditData.pigeAv ?? '-'} → ${currentEditData.pigeAp ?? '-'}</p>
            <p><b>CT:</b> ${currentEditData.avCt} → ${currentEditData.apCt} (Qte: ${currentEditData.qte})</p>
            <p><b>Compteur:</b> ${currentEditData.compteurValeur} (Total: ${currentEditData.compteurTotal})</p>
            <p><b>Obs:</b> ${currentEditData.obs||'-'}</p>
          </div>
        `;
      }

      document.getElementById('detailsModalContent').innerHTML = contentHTML;
      document.getElementById('detailsActions').style.display = 'flex';

      document.getElementById('btnDeleteItem').onclick = async () => {
        if(confirm("Hamafa ity historique ity ve ianao?")) {
          await db[table].delete(id); alert("Voafafa soa aman-tsara!"); closeDetailsModal();
          if(table === 'relevés') loadReleves();
          if(table === 'travaux') loadTravaux();
          if(table === 'appoints' || table === 'transferts') loadHistorique();
        }
      };

      document.getElementById('btnEditItem').onclick = () => {
        let formHTML = `<div style="display:flex; flex-direction:column; gap:15px;">`;
        for (const [key, value] of Object.entries(currentEditData)) {
          if(key !== 'id') {
            let label = key.charAt(0).toUpperCase() + key.slice(1);
            formHTML += `<div><label style="font-size:13px; color:var(--text-muted);">${label}</label><input type="text" id="edit-${key}" value="${value || ''}" style="width:100%; padding:10px; border-radius:6px; border:1px solid var(--border);"></div>`;
          }
        }
        formHTML += `</div>
          <button type="button" class="btn btn-yellow btn-full mt-14" id="btnSaveEdit">Enregistrer</button>
          <button type="button" class="btn btn-black btn-full mt-14" id="btnCancelEdit">Annuler</button>
        `;
        document.getElementById('detailsModalContent').innerHTML = formHTML;
        document.getElementById('detailsActions').style.display = 'none';

        document.getElementById('btnSaveEdit').onclick = async () => {
          let updatedData = { ...currentEditData };
          for (const [key] of Object.entries(currentEditData)) {
            if(key !== 'id') { updatedData[key] = document.getElementById('edit-' + key).value; }
          }
          await db[table].update(id, updatedData); alert("Modification enregistrée !"); closeDetailsModal();
          if(table === 'relevés') loadReleves();
          if(table === 'travaux') loadTravaux();
          if(table === 'appoints' || table === 'transferts') loadHistorique();
        };
        document.getElementById('btnCancelEdit').onclick = () => { closeDetailsModal(); };
      };

      document.getElementById('detailsModal').classList.add('open');
      document.body.style.overflow = 'hidden';
    } catch (err) { console.error(err); alert("Nisy olana tamin'ny fakana ny données."); }
  };

  const closeDetailsModal = () => { document.getElementById('detailsModal').classList.remove('open'); document.body.style.overflow = (document.getElementById('tvOverlay') && document.getElementById('tvOverlay').classList.contains('open')) ? 'hidden' : ''; if (window.refreshTableView) window.refreshTableView(); };
  if(document.getElementById('btnCloseDetailsModal')) document.getElementById('btnCloseDetailsModal').addEventListener('click', closeDetailsModal);
  if(document.getElementById('btnCloseDetailsModal2')) document.getElementById('btnCloseDetailsModal2').addEventListener('click', closeDetailsModal);
  if(document.getElementById('detailsModal')) document.getElementById('detailsModal').addEventListener('click', (e) => { if (e.target === document.getElementById('detailsModal')) closeDetailsModal(); });

  // ==========================================
  // 12. HISTORIQUE GLOBAL
  // ==========================================
  const escH = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const normT = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Colonnes de chaque tableau (1re colonne = date)
  const HIST = {
    'relevés': { label: 'Relevés', ico: ICO('list',22),
      cols: [['Date', r => r.date], ['Heure', r => r.heure], ['Grp', r => r.groupe], ['Puiss. (MW)', r => r.puissance], ['Tension', r => r.tension], ['Intens.', r => r.intensite], ['Cos φ', r => r.cos], ['RPM', r => r.rpm], ['Fréq.', r => r.frequence], ['T° Eau', r => r.tempEau], ['T° Huile', r => r.tempHuile], ['Transfo', r => r.transfo], ['P. Huile', r => r.pressHuile], ['P. Gasoil', r => r.pressGasoil], ['Énergie', r => r.energie], ['Gasoil', r => r.gasoilLitres], ['H. Marche', r => r.heureMarche]],
      det: r => ['Relevé ' + r.groupe, r.date + ' à ' + r.heure] },
    appoints: { label: 'Appoints', ico: ICO('fuel',22),
      cols: [['Date', a => a.date], ['Grp', a => a.groupe], ['État', a => a.etat], ['Heure AV', a => a.heureAv], ['Heure AP', a => a.heureAp], ['Durée', a => a.duree], ['Niv. AV (mm)', a => a.avMm], ['Niv. AP (mm)', a => a.apMm], ['Qté', a => a.qteMm], ['CT AV', a => a.avCt], ['CT AP', a => a.apCt], ['Obs.', a => a.obs]],
      det: a => ['Appoint ' + a.groupe, a.date] },
    transferts: { label: 'Transferts', ico: ICO('refresh',22),
      cols: [['Date', t => t.date], ['Heure', t => t.heure], ['Citerne', t => t.citerne], ['Pige AV', t => t.pigeAv], ['Pige AP', t => t.pigeAp], ['CT AV', t => t.avCt], ['CT AP', t => t.apCt], ['Qté (cm)', t => t.qte], ['Compteur', t => t.compteurValeur], ['Total compteur', t => t.compteurTotal], ['Obs.', t => t.obs]],
      det: t => ['Transfert', t.date + ' à ' + t.heure] },
    travaux: { label: 'Travaux', ico: ICO('tool',22),
      cols: [['Date', t => t.date], ['Grp', t => t.groupe], ['HM', t => t.hm], ['Travail', t => t.type], ['Agent', t => t.agent], ['Référence', t => t.ref], ['Qté', t => t.qte]],
      det: t => ['Travail ' + t.type, t.date] },
    fiches: { label: 'Fiches', ico: ICO('file',22),
      cols: [['Date', f => f.date], ['Production (kWh)', f => f.totalProd], ['Consommation GO (L)', f => f.totalGo], ['CSP (g/kWh)', f => f.csp]],
      det: null }
  };

  const TV = { cat: null, all: [], cols: [], q: '', sc: -1, sd: 1, limit: 500, shown: [], rows: [] };
  const tvEl = id => document.getElementById(id);

  async function tvLoad() {
    const all = TV.cat === 'all';
    const out = [];
    for (const k of (all ? Object.keys(HIST) : [TV.cat])) {
      const H = HIST[k];
      (await db[k].toArray()).forEach(r => {
        const base = H.cols.map(c => { const v = c[1](r); return (v === undefined || v === null) ? '' : String(v); });
        const flat = Object.values(r).concat(r.vals ? Object.values(r.vals) : []).filter(v => v != null && typeof v !== 'object').join(' ');
        const x = { k, r, when: (r.date || '') + (r.heure || r.heureAv || ''), text: normT(H.label + ' ' + flat) };
        x.cells = all
          ? [H.label, base[0], r.groupe || '', base.slice(1).map((v, i) => v !== '' ? H.cols[i + 1][0] + ': ' + v : '').filter(Boolean).join(' · ')]
          : base;
        out.push(x);
      });
    }
    out.sort((a, b) => b.when.localeCompare(a.when));
    TV.all = out;
    TV.cols = all ? ['Rubrique', 'Date', 'Grp', 'Détail'] : HIST[TV.cat].cols.map(c => c[0]);
  }

  function tvRender() {
    const terms = normT(TV.q).split(/\s+/).filter(Boolean);
    let rows = terms.length ? TV.all.filter(x => terms.every(t => x.text.includes(t))) : TV.all.slice();
    if (TV.sc >= 0) {
      const c = TV.sc, num = v => { const n = Number(String(v).replace(',', '.')); return (v === '' || isNaN(n)) ? null : n; };
      rows.sort((a, b) => {
        const A = a.cells[c], B = b.cells[c], nA = num(A), nB = num(B);
        return TV.sd * ((nA != null && nB != null) ? nA - nB : String(A).localeCompare(String(B), 'fr', { numeric: true }));
      });
    }
    TV.rows = rows; TV.shown = rows.slice(0, TV.limit);
    const tbl = tvEl('tvTable');
    tbl.classList.toggle('tv-all', TV.cat === 'all');
    tbl.querySelector('thead').innerHTML = '<tr>' + TV.cols.map((c, i) => `<th data-c="${i}">${escH(c)}${TV.sc === i ? (TV.sd > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('') + '</tr>';
    tbl.querySelector('tbody').innerHTML = TV.shown.length
      ? TV.shown.map((x, i) => `<tr data-i="${i}">${x.cells.map(v => `<td>${v === '' ? '-' : escH(v)}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${TV.cols.length}" class="tv-empty">Aucun résultat.</td></tr>`;
    tvEl('tvCount').textContent = rows.length + ' résultat' + (rows.length > 1 ? 's' : '') + (rows.length > TV.shown.length ? ' · ' + TV.shown.length + ' affichés' : '');
    tvEl('tvMore').classList.toggle('hidden', rows.length <= TV.shown.length);
  }

  function closeTV() { tvEl('tvOverlay').classList.remove('open'); document.body.style.overflow = ''; }

  window.openTableView = async function (cat, q) {
    TV.cat = cat; TV.q = q || ''; TV.sc = -1; TV.sd = 1; TV.limit = 500;
    tvEl('tvTitle').textContent = cat === 'all' ? 'Recherche globale' : HIST[cat].label;
    tvEl('tvSearch').value = TV.q;
    await tvLoad(); tvRender();
    tvEl('tvOverlay').classList.add('open'); document.body.style.overflow = 'hidden';
    tvEl('tvOverlay').querySelector('.tv-body').scrollTop = 0;
  };
  window.refreshTableView = function () { if (tvEl('tvOverlay') && tvEl('tvOverlay').classList.contains('open')) tvLoad().then(tvRender); };

  function tvOpenRow(x) {
    if (x.k === 'fiches') {   // Fiche : mamoha ny fiche amin'io daty io
      curDate = x.r.date; closeTV(); tvEl('historyModal').classList.remove('open'); window.goToPage('page-fiche'); return;
    }
    const d = HIST[x.k].det(x.r); window.showDetailsModal(x.k, x.r.id, d[0], d[1]);
  }

  if (tvEl('tvOverlay')) {
    tvEl('tvBack').addEventListener('click', closeTV);
    tvEl('tvSearch').addEventListener('input', e => { TV.q = e.target.value; TV.limit = 500; tvRender(); });
    tvEl('tvMore').addEventListener('click', () => { TV.limit += 500; tvRender(); });
    tvEl('tvTable').querySelector('thead').addEventListener('click', e => {
      const th = e.target.closest('th[data-c]'); if (!th) return;
      const c = +th.dataset.c; if (TV.sc === c) TV.sd = -TV.sd; else { TV.sc = c; TV.sd = 1; }
      tvRender();
    });
    tvEl('tvTable').querySelector('tbody').addEventListener('click', e => {
      const tr = e.target.closest('tr[data-i]'); if (tr) tvOpenRow(TV.shown[+tr.dataset.i]);
    });
    tvEl('tvCsv').addEventListener('click', () => {
      if (!TV.rows.length) { alert('Aucune donnée à exporter.'); return; }
      const q = v => '"' + String(v).replace(/"/g, '""') + '"';
      const csv = [TV.cols.map(q).join(';')].concat(TV.rows.map(x => x.cells.map(q).join(';'))).join('\r\n');
      downloadFile('historique_' + (TV.cat === 'all' ? 'recherche' : TV.cat) + '_' + localDateStr() + '.csv', '\ufeff' + csv, 'text/csv;charset=utf-8');
    });
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (document.getElementById('detailsModal').classList.contains('open')) return;
      if (tvEl('tvOverlay').classList.contains('open')) closeTV();
      else { sideMenu.classList.remove('open'); sideMenuOverlay.classList.remove('open'); }
    });
  }

  // Historique global : rubriques cliquables → tableau plein écran
  async function loadGlobalHistory() {
    const box = tvEl('historyHome'); if (!box) return;
    const keys = Object.keys(HIST), cnt = {};
    for (const k of keys) cnt[k] = await db[k].count();
    const total = keys.reduce((n, k) => n + cnt[k], 0);
    box.innerHTML = keys.map(k => `<button type="button" class="hist-card" data-cat="${k}"><span class="hc-ico">${HIST[k].ico}</span><b>${HIST[k].label}</b><small>${cnt[k]} enregistrement(s)</small></button>`).join('') +
      `<button type="button" class="hist-card" data-cat="all"><span class="hc-ico">${ICO('search',22)}</span><b>Tout</b><small>${total} enregistrement(s) · recherche</small></button>`;
    box.onclick = e => { const b = e.target.closest('[data-cat]'); if (b) window.openTableView(b.dataset.cat); };
  }

  // Barre de recherche du menu (au-dessus de « Relevés »)
  const msForm = tvEl('menuSearchForm');
  if (msForm) msForm.addEventListener('submit', e => {
    e.preventDefault();
    const q = tvEl('menuSearch').value.trim(); if (!q) return;
    sideMenu.classList.remove('open'); sideMenuOverlay.classList.remove('open');
    window.openTableView('all', q);
  });

  // ==========================================
  // INITIALISATION
  // ==========================================

  // ==========================================
  // PARAMÈTRES (version professionnelle)
  // ==========================================
  let CFG = { themeMode: localStorage.getItem('theme') === 'dark' ? 'dark' : 'light', fontSize: 15, densite: 830, alerts: {}, ...JSON.parse(localStorage.getItem('cat_cfg') || '{}') };
  const saveCfg = () => localStorage.setItem('cat_cfg', JSON.stringify(CFG));
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  function applyCfg() {
    document.body.style.fontSize = CFG.fontSize + 'px';
    window.setTheme(CFG.themeMode === 'auto' ? (mq.matches ? 'dark' : 'light') : CFG.themeMode);
  }
  mq.addEventListener && mq.addEventListener('change', () => { if (CFG.themeMode === 'auto') applyCfg(); });
  applyCfg();

  const ALERT_DEFS = [['tension', 'Tension (V)'], ['frequence', 'Fréquence (Hz)'], ['cos', 'Cos φ'], ['tempEau', 'Temp. eau (°C)'], ['pressHuile', 'Pression huile (kPa)'], ['pressGasoil', 'Pression gasoil (kPa)']];
  function checkAlerts(r) {
    const out = [];
    ALERT_DEFS.forEach(([k, l]) => {
      const v = fNum(r[k]), a = CFG.alerts[k] || {};
      if (v == null) return;
      if (a.min != null && v < a.min) out.push(`${l} = ${v}  (min ${a.min})`);
      if (a.max != null && v > a.max) out.push(`${l} = ${v}  (max ${a.max})`);
    });
    return out;
  }

  let sm = document.getElementById('settingsModal');
  if (!sm) { sm = document.createElement('div'); sm.id = 'settingsModal'; sm.className = 'modal-overlay'; document.body.appendChild(sm); }

  let stTab = 'apparence';
  async function renderSettings() {
    const tbls = [['relevés', 'Relevés horaires'], ['appoints', 'Appoints'], ['transferts', 'Transferts'], ['travaux', 'Travaux'], ['fiches', 'Fiches d\'exploitation']];
    const cnt = {}; for (const [t] of tbls) cnt[t] = await db[t].count();
    const seg = (id, opts, cur) => `<div class="st-seg" data-seg="${id}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" class="${String(cur) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    const TABS = [['apparence', 'palette', 'Apparence'], ['calculs', 'calc', 'Calculs'], ['alertes', 'bell', 'Alertes'], ['sauvegarde', 'save', 'Sauvegarde'], ['donnees', 'folder', 'Données'], ['apropos', 'info', 'À propos']];
    const P = {
      apparence: `<h2>Apparence</h2><p class="st-sub">Thème, taille du texte et couleur de l'application.</p>
        <div class="st-box">
          <div class="st-row"><span>Thème</span>${seg('theme', [['light', 'Clair'], ['dark', 'Sombre'], ['auto', 'Auto']], CFG.themeMode)}</div>
          <div class="st-row"><span>Taille du texte</span>${seg('font', [[14, 'Petit'], [15, 'Normal'], [17, 'Grand']], CFG.fontSize)}</div>
          <div class="st-row"><span>Couleur d'accent</span><div class="color-picker-grid" style="margin:0">${['#FFCC11', '#F97316', '#22C55E', '#3B82F6', '#A855F7', '#EF4444'].map(c => `<button type="button" class="color-btn" data-accent="${c}" style="background:${c}"></button>`).join('')}</div></div>
        </div>`,
      calculs: `<h2>Calculs</h2><p class="st-sub">Valeurs utilisées dans la Fiche d'exploitation.</p>
        <div class="st-box"><div class="st-row"><span>Densité du gasoil (g/L)<small>Ampiasaina amin'ny CSP ao amin'ny Fiche</small></span><input type="number" id="st-dens" class="st-in" value="${CFG.densite}"></div></div>`,
      alertes: `<h2>Alertes des relevés</h2><p class="st-sub">Fanairana rehefa mihoatra ny sisintany ny relevé. Avelao foana ny tsy ilaina.</p>
        <div class="st-box st-grid2">${ALERT_DEFS.map(([k, l]) => { const a = CFG.alerts[k] || {}; return `<div class="st-row"><span>${l}</span><div class="st-mm"><input type="number" step="any" placeholder="Min" data-al="${k}" data-b="min" value="${a.min ?? ''}"><input type="number" step="any" placeholder="Max" data-al="${k}" data-b="max" value="${a.max ?? ''}"></div></div>`; }).join('')}</div>`,
      sauvegarde: `<h2>Sauvegarde &amp; restauration</h2><p class="st-sub">Voatahiry ao amin'ity appareil ity ihany ny angona. Manaova sauvegarde tsy tapaka, indrindra rehefa hifindra finday na ordinateur.</p>
        <div class="st-box"><p class="st-hint">Dernière sauvegarde : <b>${localStorage.getItem('cat_last_backup') || 'jamais'}</b></p>
          <div class="st-actions"><button type="button" class="st-btn" id="st-exp">${ICO('down',16)} Exporter (JSON)</button><label class="st-btn">${ICO('up',16)} Importer<input type="file" id="st-imp" accept=".json,application/json" hidden></label></div></div>`,
      donnees: `<h2>Données</h2><p class="st-sub">Nombre d'enregistrements et suppression par rubrique.</p>
        <div class="st-box">${tbls.map(([t, l]) => `<div class="st-row"><span>${l}<small>${cnt[t]} enregistrement(s)</small></span><button type="button" class="st-btn danger" data-clear="${t}">Vider</button></div>`).join('')}</div>`,
      apropos: `<h2>À propos</h2><p class="st-sub">Application de gestion d'exploitation.</p>
        <div class="st-box"><div class="st-row"><span>Application</span><b>CAT by Manda v2.1</b></div><div class="st-row"><span>Site</span><b>Henri Fraise Fils &amp; Cie — Mahanoro</b></div></div>`
    };
    sm.innerHTML = `<div class="modal st-modal"><div class="modal-head"><div><h3>Paramètres</h3><p>CAT by Manda · Mahanoro</p></div><button class="modal-close" type="button">×</button></div>
      <div class="st-layout"><nav class="st-nav">${TABS.map(([id, ic, l]) => `<button type="button" data-tab="${id}" class="${stTab === id ? 'on' : ''}"><span>${ICO(ic)}</span>${l}</button>`).join('')}</nav>
      <div class="st-panel">${P[stTab]}</div></div></div>`;
  }

  sm.addEventListener('click', async (e) => {
    const t = e.target;
    if (t.closest('.modal-close')) { sm.classList.remove('open'); return; }
    const tb = t.closest('[data-tab]'); if (tb) { stTab = tb.dataset.tab; renderSettings(); return; }
    const sg = t.closest('[data-seg] button');
    if (sg) { const id = sg.parentElement.dataset.seg; if (id === 'theme') CFG.themeMode = sg.dataset.v; else CFG.fontSize = +sg.dataset.v; saveCfg(); applyCfg(); renderSettings(); return; }
    const ac = t.closest('[data-accent]'); if (ac) { window.setAccent(ac.dataset.accent); return; }
    const cl = t.closest('[data-clear]');
    if (cl) {
      const n = cl.dataset.clear;
      if (confirm(`Vider "${n}" ? Tsy azo averina izany.`)) { await db[n].clear(); await renderSettings(); loadReleves(); loadHistorique(); loadTravaux(); }
      return;
    }
    if (t.id === 'st-exp') window.exportBackup();
  });
  sm.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'st-dens') { CFG.densite = fNum(t.value) || 830; saveCfg(); }
    if (t.dataset && t.dataset.al) { const a = CFG.alerts[t.dataset.al] = CFG.alerts[t.dataset.al] || {}; const v = fNum(t.value); if (v == null) delete a[t.dataset.b]; else a[t.dataset.b] = v; saveCfg(); }
  });
  sm.addEventListener('change', (e) => { if (e.target.id === 'st-imp') window.importBackup(e.target.files[0]); });

  window.openSettingsModal = async function () {
    await renderSettings(); sm.classList.add('open');
    sideMenu.classList.remove('open'); sideMenuOverlay.classList.remove('open');
  };

  // --- Fermeture des modals (Paramètres, À propos, Historique) ---
  ['settingsModal', 'aboutModal', 'historyModal'].forEach(id => {
    const m = document.getElementById(id);
    if (!m) return;
    m.addEventListener('click', (e) => { if (e.target === m) m.classList.remove('open'); });
    m.querySelectorAll('.modal-close, [data-close]').forEach(b => b.addEventListener('click', () => m.classList.remove('open')));
  });

  // --- Sauvegarde / Restauration (JSON) ---
  window.exportBackup = async function() {
    const dump = { app: 'CAT by Manda', version: 2, date: new Date().toISOString(), leaves, data: {} };
    for (const t of db.tables) dump.data[t.name] = await t.toArray();
    downloadFile('CAT_backup_' + localDateStr() + '.json', JSON.stringify(dump), 'application/json');
  };
  window.importBackup = async function(file) {
    if (!file) return;
    try {
      const dump = JSON.parse(await file.text());
      if (!dump.data) throw new Error('format');
      if (!confirm("Soloina ny angona rehetra amin'ny backup ve?")) return;
      for (const t of db.tables) {
        await t.clear();
        if (Array.isArray(dump.data[t.name]) && dump.data[t.name].length) await t.bulkAdd(dump.data[t.name]);
      }
      leaves = dump.leaves || []; localStorage.setItem('hffc_leaves', JSON.stringify(leaves));
      alert('Restauration réussie !'); location.reload();
    } catch (err) { console.error(err); alert('Fichier invalide.'); }
  };
  { const _exp = window.exportBackup; window.exportBackup = async function () { await _exp(); localStorage.setItem('cat_last_backup', new Date().toLocaleString('fr-FR')); if (sm.classList.contains('open')) renderSettings(); }; }
  const bExp = document.getElementById('btnExportBackup'); if (bExp) bExp.addEventListener('click', window.exportBackup);
  const bImp = document.getElementById('fileImportBackup'); if (bImp) bImp.addEventListener('change', (e) => window.importBackup(e.target.files[0]));

  // --- Date/heure à jour quand on revient sur l'app ---
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshNow(); });

  // --- Service Worker + bannière de mise à jour ---
  if ('serviceWorker' in navigator) {
    const showUpdateBanner = (worker) => {
      if (document.getElementById('updateBanner')) return;
      const b = document.createElement('div');
      b.id = 'updateBanner';
      b.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:3000;background:#111318;color:#FFCC11;padding:12px 16px;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.35);display:flex;gap:12px;align-items:center;font-size:14px;font-weight:700;';
      b.innerHTML = '<span>Version vaovao disponible</span><button style="background:#FFCC11;color:#111318;border:none;border-radius:8px;padding:6px 12px;font-weight:800;cursor:pointer;">Mettre à jour</button>';
      b.querySelector('button').onclick = () => worker.postMessage('SKIP_WAITING');
      document.body.appendChild(b);
    };
    navigator.serviceWorker.register('./sw.js').then(reg => {
      if (reg.waiting && navigator.serviceWorker.controller) showUpdateBanner(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (nw) nw.addEventListener('statechange', () => { if (nw.state === 'installed' && navigator.serviceWorker.controller) showUpdateBanner(nw); });
      });
    }).catch(err => console.error('SW error', err));
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloading) return; reloading = true; location.reload(); });
  }
  renderCal();
  loadHistorique();
  loadTravaux();
  loadReleves();
  markNav('page-releve');
});