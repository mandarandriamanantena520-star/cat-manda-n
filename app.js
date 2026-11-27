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
  let navigated = false, restoring = false;   // navigated = l'utilisateur a change de page lui-meme depuis le chargement
  function showPage(target) {
    if (!restoring) navigated = true;
    try { localStorage.setItem('catPage', target); } catch (e) {}
    markNav(target);
    document.body.classList.toggle('on-chef', target === 'page-chef');
    navBtns.forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));   // requête à chaque fois : pages ajoutées par operations.js
    const btn = document.querySelector(`.nav-btn[data-target="${target}"]`);
    if(btn) btn.classList.add('active');
    const page = document.getElementById(target);
    if(page) page.classList.add('active');
    if(target === 'page-fiche' && window.ficheShow) window.ficheShow();
    if(target === 'page-chef' && window.chefShow) window.chefShow();
    if(target === 'page-messages' && window.CATmsgShow) window.CATmsgShow();
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
    const tm = body.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem('theme', tm);
    try { CFG.themeMode = tm; saveCfg(); } catch (e) {}
    updateThemeIcons();
  });

  window.setTheme = function(mode, fromCfg) {
    if (!fromCfg) {   // mémorise aussi dans cat_cfg, sinon le thème saute au rechargement
      try { const c = JSON.parse(localStorage.getItem('cat_cfg') || '{}'); c.themeMode = mode; localStorage.setItem('cat_cfg', JSON.stringify(c)); } catch (e) {}
      try { CFG.themeMode = mode; } catch (e) {}
    }
    if(mode === 'dark') body.classList.add('dark-mode');
    else body.classList.remove('dark-mode');
    localStorage.setItem('theme', mode);
    updateThemeIcons();
  };

  window.setAccent = function(color) {
    if (String(color).toUpperCase() === '#FFCC11') color = '#2F5BD3'; // ancien jaune par défaut : migré vers le bleu
    document.documentElement.style.setProperty('--ac', color);
    document.documentElement.style.setProperty('--ac-soft', color + '1a');
    document.documentElement.style.setProperty('--secondary', color);
    document.documentElement.style.setProperty('--secondary-soft', color + '1f');
    localStorage.setItem('accent', color);
  };
  const savedAccent = localStorage.getItem('accent');
  if(savedAccent) setAccent(savedAccent);

  // Ancien réglage « Style » (Moderne) supprimé en V4.18 : on nettoie la valeur restée sur l'appareil.
  try { localStorage.removeItem('catStyle'); delete document.documentElement.dataset.style; } catch (e) {}

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
  db.version(12).stores({
    operations: '++id, date, type, groupe',
    alertes: '++id, ts',
    consignes: '++id, ts',
    employes: '++id, uid, nom, poste, statut',
    employes_rh: '++id, uid',
    lus: '++id, mid, uid',
    messages: '++id, ts, to',
    conges: '++id, start',
    roster: '++id, from', 
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

  window.catMmToL = mmToL;   // V4.30 : utilise par chef.js (NIVEAU GO toujours en litres)
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
        await db.relevés.add(newReleve);
        if (warns.length) { try { await db.alertes.add({ ts: Date.now(), groupe: newReleve.groupe, date: newReleve.date, heure: newReleve.heure, texte: warns.join(' ; '), par: (JSON.parse(localStorage.getItem('catProf') || '{}').nom || '') }); } catch (e) {} }   // remonte au Chef (fil d'alertes)
        alert("Relevé enregistré !");
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
      const air = (r.airAdm !== undefined && r.airAdm !== '') ? r.airAdm : '-';
      const e = (r.energie !== undefined && r.energie !== '') ? r.energie : '-';
      const g = (r.gasoilLitres !== undefined && r.gasoilLitres !== '') ? r.gasoilLitres : '-';
      const hm = (r.heureMarche !== undefined && r.heureMarche !== '') ? r.heureMarche : '-';

      tr.innerHTML = `
        <td>${p}</td><td>${t}</td><td>${i}</td><td>${c}</td><td>${rpm}</td><td>${f}</td>
        <td>${te}</td><td class="col-g3">${th}</td><td>${air}</td><td>${trf}</td><td>${ph}</td><td>${pg}</td>
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
      const keys = ['date','heure','groupe','puissance','tension','intensite','cos','rpm','frequence','tempEau','tempHuile','airAdm','transfo','pressHuile','pressGasoil','energie','gasoilLitres','heureMarche'];
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
    if (chronoDisplay) { const okh = apHeureAv && apHeureAp && apHeureAv.value && apHeureAp.value; chronoDisplay.textContent = (okh ? calcDiffMinutes(apHeureAv.value, apHeureAp.value) : 0) + ' min'; const w = document.getElementById('ap-duree-warn'); if (w) w.textContent = (okh && apHeureAp.value < apHeureAv.value) ? "Attention : l'heure après est avant l'heure avant." : ''; }
    const av = parseFloat(apAvMm.value) || 0, ap = parseFloat(apApMm.value) || 0;
    const marche = apEtat && apEtat.value === "En marche";
    const mins = marche ? calcDiffMinutes(apHeureAv.value, apHeureAp.value) : 0;
    apQte.textContent = (ap - av + mins).toFixed(0);
    const lv = mmToL(av), lp = mmToL(ap), ql = document.getElementById('ap-qte-l');
    if (ql) ql.textContent = (lv !== '' && lp !== '') ? (lp - lv + mins).toFixed(0) : '-';
  }

  if(apAvMm) apAvMm.addEventListener('input', calcAppoint);
  if(apApMm) apApMm.addEventListener('input', calcAppoint);
  if(apHeureAv) apHeureAv.addEventListener('change', calcAppoint);
  if(apHeureAp) apHeureAp.addEventListener('change', calcAppoint);
  if(apEtat) apEtat.addEventListener('change', calcAppoint);

  const apCtAv = document.getElementById('ap-ct-av'); const apCtAp = document.getElementById('ap-ct-ap'); const apCtDiff = document.getElementById('ap-ct-diff');
  function calcAppointCT() { if(!apCtAv || !apCtAp) return; let av = parseInt(apCtAv.value) || 0; let ap = parseInt(apCtAp.value) || 0; apCtDiff.textContent = av - ap; }
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
        document.getElementById('ap-obs').value = ''; calcAppoint(); chronoDisplay.textContent = "0 min"; loadHistorique();
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
      ['Date', 'Grp', 'État', 'Heures', 'Niveau (cm)', 'Qté', 'CT'],
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

  const twRef = document.getElementById('tw-ref');
  const twExtra = document.getElementById('tw-extra-fields');
  const twAgent = document.getElementById('tw-agent');

  const twCbs = () => [...document.querySelectorAll('.tw-cb')];
  const twSel = () => twCbs().filter(c => c.checked).map(c => c.value);
  function twRefresh() {
    const s = twSel();
    twRef.value = s.length === 1 && refs[s[0]] ? refs[s[0]] : s.filter(x => refs[x]).map(x => refs[x]).join(' / ');
    const needAgent = s.includes("Appoint d'eau") || s.includes('Autres');
    twExtra.classList.toggle('hidden', !needAgent);
    if (twAgent) twAgent.placeholder = s.includes('Autres') ? 'Préciser le travail...' : 'Nom de la personne';
  }
  twCbs().forEach(c => c.addEventListener('change', () => { twRefresh(); }));

  if(document.getElementById('tw-date')) document.getElementById('tw-date').value = todayStr;

  const btnSaveTravail = document.getElementById('btn-save-travail');
  if(btnSaveTravail) {
    btnSaveTravail.addEventListener('click', async () => {
      const sel = twSel();
      if (!sel.length) { alert('Safidio farafahakeliny ny karazana asa iray.'); return; }
      const agentVal = document.getElementById('tw-agent').value;
      if (sel.includes('Autres') && !agentVal) { alert("Précise le travail s'il te plaît."); return; }
      const base = { date: document.getElementById('tw-date').value, groupe: document.getElementById('tw-groupe').value, hm: document.getElementById('tw-hm').value, qte: document.getElementById('tw-qte').value };
      try {
        for (const ty of sel) {
          await db.travaux.add({ ...base, type: ty === 'Autres' ? agentVal : ty, ref: refs[ty] || '', agent: ty === 'Appoint d\'eau' ? agentVal : '' });
        }
        alert(sel.length + ' travail(aux) enregistré(s) !');
        twCbs().forEach(c => c.checked = false); twRefresh();
        ['tw-hm', 'tw-qte', 'tw-agent'].forEach(id => document.getElementById(id).value = '');
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
  // Planning personnalisable : chaque « plan » (table roster, synchronisée) s'applique dès sa date `from`
  // et hérite des champs qu'il ne redéfinit pas : agents, postes[{nom,debut,fin}], step (pas de rotation),
  // start (jour de départ du cycle), bloques[{m,d}]. Les plans passés ne sont jamais réécrits.
  // Les modifications manuelles d'un jour sont des enregistrements roster {kind:'swap', date, poste, agent, orig, by, at}.
  const DEF_POSTES = [{ nom: 'Jour', debut: '07:00', fin: '17:00' }, { nom: 'Nuit', debut: '17:00', fin: '07:00' }];
  const DEF_BLOCK = [{ m: 0, d: 1 }, { m: 5, d: 26 }, { m: 11, d: 25 }, { m: 11, d: 31 }];
  const DEF_ROSTER = [{ from: '1900-01-01', agents: ['Nandrianina', 'Jimmy', 'Eddy'], postes: DEF_POSTES, step: 2, start: '2026-11-16', bloques: DEF_BLOCK }, { from: '2026-11-24', agents: ['Nandrianina', 'Jimmy', 'Eddy', 'Michel'] }];
  let roster = [];
  const rosterList = () => { const L = roster.filter(r => !r.kind); return (L.length ? L : DEF_ROSTER).slice().sort((x, y) => x.from.localeCompare(y.from)); };
  function planFor(d) {
    const iso = localDateStr(d); let p = {}; rosterList().forEach(r => { if (r.from <= iso) p = Object.assign(p, r); });
    if (!p.postes || !p.postes.length) p.postes = DEF_POSTES; if (!p.agents) p.agents = [];
    p.step = +p.step || p.postes.length; p.start = p.start || '2026-11-16'; p.bloques = p.bloques || DEF_BLOCK; return p;
  }
  const rosterFor = d => planFor(d).agents;
  const allNames = () => [...new Set(rosterList().flatMap(r => [...(r.agents || []), ...(r.mode === 'equipes' ? (r.equipes || []).flatMap(t => [t.nom, ...(t.membres || [])]) : [])]))];   // V4.34 : + equipes et leurs membres
  window.CATrosterList = rosterList; window.CATdefRoster = () => DEF_ROSTER; window.CATplanFor = planFor;
  window.CATswaps = () => roster.filter(r => r.kind === 'swap');
  let viewYear = new Date().getFullYear(); let viewMonth = new Date().getMonth();
  let leaves = [];
  const monthsFr = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const weekdaysFr = ['LUN','MAR','MER','JEU','VEN','SAM','DIM'];

  function onLeave(n, d) { return leaves.some(l => n === l.name && d >= new Date(l.start + 'T00:00:00') && d <= new Date(l.end + 'T00:00:00')); }

  // Rotation sur les agents PRÉSENTS (congés exclus) : à chaque congé la rotation se recalcule (4 → 3, etc.).
  function getSched(date, pOverride) {   // pOverride : plan hypothétique (aperçu de l'éditeur du Chef), sans échanges ponctuels
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()), iso = localDateStr(d), p = pOverride || planFor(d);
    if (p.mode === 'equipes' && p.equipes && p.equipes.length) {   // V4.34 : rotation par EQUIPES (le mode agents reste inchange ci-dessous)
      const T = p.equipes, nt = T.length, per = Math.max(1, +p.per || 1), dd = Math.floor((d - new Date(p.start + 'T00:00:00')) / 86400000), kk = Math.floor(dd / per), bs = (((kk * p.step) % nt) + nt) % nt;
      const sl = p.postes.map((po, i) => ({ poste: po, agent: i < nt ? T[(bs + i) % nt].nom : '—', membres: i < nt ? (T[(bs + i) % nt].membres || []).slice() : [] }));
      if (!pOverride) roster.filter(r => r.kind === 'swap' && r.date === iso).forEach(w => { const s1 = sl[w.poste]; if (s1) { s1.orig = s1.orig || s1.agent; s1.agent = w.agent; s1.membres = []; s1.by = w.by; s1.at = w.at; } });
      const us = new Set(sl.map(x => x.agent));
      return { slots: sl, repos: T.map(t => t.nom).filter(x => !us.has(x)), conge: [], plan: p, jour: sl[0].agent, nuit: sl[sl.length - 1].agent, equipes: true };
    }
    const present = p.agents.filter(n => !onLeave(n, d)), conge = p.agents.filter(n => onLeave(n, d)), n = present.length;
    const diff = Math.floor((d - new Date(p.start + 'T00:00:00')) / 86400000), base = n ? (((diff * p.step) % n) + n) % n : 0;
    const slots = p.postes.map((po, i) => ({ poste: po, agent: i < n ? present[(base + i) % n] : '—' }));
    if (!pOverride) roster.filter(r => r.kind === 'swap' && r.date === iso).forEach(w => { const sl = slots[w.poste]; if (sl) { sl.orig = sl.orig || sl.agent; sl.agent = w.agent; sl.by = w.by; sl.at = w.at; } });
    const used = new Set(slots.map(x => x.agent));
    return { slots, repos: present.filter(a => !used.has(a)), conge, plan: p, jour: slots[0].agent, nuit: slots[slots.length - 1].agent };
  }
  window.CATsched = getSched; window.CATallNames = allNames;

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

    const nCells = Math.ceil((off + new Date(viewYear, viewMonth + 1, 0).getDate()) / 7) * 7;   // V4.23 : lignes completes uniquement
    for (let i = 0; i < nCells; i++) {
      let d = new Date(viewYear, viewMonth, 1 - off + i);
      let isO = d.getMonth() !== viewMonth; 
      let div = document.createElement('div');
      div.className = 'day';
      if (isO) div.style.opacity = '0.4';
      if (d.toDateString() === todayObj.toDateString()) div.classList.add('today');
      { const sc = getSched(d); if (sc.conge.length) div.style.borderColor = '#E5484D'; if (sc.slots.some(x => x.orig)) div.style.borderColor = '#FFCC11'; }   // V4.23 : les echanges sont visibles meme sans conge
      div.innerHTML = `<div>${d.getDate()}</div>`;
      div.addEventListener('click', () => {
        const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        openModal(iso);
      });
      cal.appendChild(div);
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
  function resolveLeave(d, s) { return { jour: { name: s.jour }, midi: s.slots.length === 3 ? { name: s.slots[1].agent } : null, nuit: { name: s.nuit } }; }   // compat fiche : 1er et dernier poste
  const fdt = ts => { const x = new Date(ts); return x.toLocaleDateString('fr-FR') + ' ' + x.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); };
  function openModal(iso) {
    const d = new Date(iso + 'T00:00:00'), s = getSched(d);
    document.getElementById('modalTitle').textContent = fmtLong(d);
    document.getElementById('modalSubtitle').textContent = 'Mahanoro';
    document.getElementById('modalAgents').innerHTML = s.slots.map(x => `<div class="agent-row" style="margin-bottom:10px;"><div><b>${escH(x.agent)}</b><small>${escH(x.poste.nom)} ${x.poste.debut}–${x.poste.fin}${x.membres && x.membres.length ? '<br>' + x.membres.map(escH).join(', ') : ''}${x.orig ? ' · remplace ' + escH(x.orig) + ' (modifié' + (x.by ? ' par ' + escH(x.by) : '') + (x.at ? ' le ' + fdt(x.at) : '') + ')' : ''}</small></div></div>`).join('')
      + (s.repos.length ? `<p style="font-size:13px;color:var(--text-muted)">Repos : ${s.repos.map(escH).join(', ')}</p>` : '') + (s.conge.length ? `<p style="font-size:13px;color:#E5484D">En congé : ${s.conge.map(escH).join(', ')}</p>` : '');
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
  const openLeaveModal = () => { if (document.body.dataset.role === 'agent') return; const ln = document.getElementById('leaveName'); if (ln) ln.innerHTML = allNames().map(n => `<option>${escH(n)}</option>`).join(''); document.getElementById('leaveModal').classList.add('open'); document.body.style.overflow = 'hidden'; renderLeaveList(); };
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
      b.addEventListener('click', async () => {
        const l = leaves[parseInt(b.getAttribute('data-del'))]; if (l) await db.conges.delete(l.id);
        await loadCal(); renderLeaveList();
      });
    });
  }

  const btnAddLeave = document.getElementById('btnAddLeave');
  if(btnAddLeave) {
    btnAddLeave.addEventListener('click', async () => {
      const n = document.getElementById('leaveName').value; const s = document.getElementById('leaveStart').value; const e = document.getElementById('leaveEnd').value;
      if (!s || !e || e < s) { alert('Dates invalides.'); return; }
      let cur = new Date(s + 'T00:00:00'); let end = new Date(e + 'T00:00:00'); let isBlocked = false;
      while(cur <= end) { if (planFor(cur).bloques.some(b => b.m === cur.getMonth() && b.d === cur.getDate())) { isBlocked = true; break; } cur.setDate(cur.getDate() + 1); }
      if (isBlocked) { alert('REFUSÉ : le congé touche un jour bloqué (' + planFor(new Date(s + 'T00:00:00')).bloques.map(b => String(b.d).padStart(2, '0') + '/' + String(b.m + 1).padStart(2, '0')).join(', ') + '). Tsy azo atao ny miala sasatra amin\'ireo andro ireo.'); return; }
      await db.conges.add({ name: n, start: s, end: e });
      await loadCal(); renderLeaveList(); alert(n + ' : Congé ajouté. Le calendrier a été mis à jour.'); closeLeaveModal();
    });
  }
  if(document.getElementById('leaveStart')) document.getElementById('leaveStart').value = todayStr;
  if(document.getElementById('leaveEnd')) document.getElementById('leaveEnd').value = todayStr;

  // ==========================================
  // 10. FICHE D'EXPLOITATION (kopia ny taratasy, feno ho azy avy amin'ny Appoint/Relevés/Travaux)
  // ==========================================
  const fichePage = document.getElementById('page-fiche');
  const G = [1, 2, 3];
  const fNum = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(n) ? null : n; };
  const fmt = (v, d = 0) => (v == null || isNaN(v)) ? '' : (+v).toFixed(d);
  // V4.30 : NIVEAU GO = toujours en LITRES. Un entier sans virgule entre 50 et 229 = ancienne valeur en cm -> convertie par le bareme.
  const nivNorm = raw => { const t = String(raw ?? '').trim(); if (t === '') return ''; if (/^\d{2,3}$/.test(t) && +t >= 50 && +t <= 229) { const l = mmToL(t); return l === '' ? t : (+l).toFixed(2); } const n = fNum(t); return n == null ? t : n.toFixed(2); };
  const mmToLs = mm => { if (mm == null) return null; const v = mmToL(mm); return v !== '' ? v : mm * 3.8837; };
  const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return localDateStr(d); };
  const dayOf = (date, heure) => (heure && heure < '06:00') ? addDays(date, -1) : date; // andro fiche = 06h → 06h
  let curDate = dayOf(localDateStr(), localTimeStr()), userZoom = false;
  const el = k => fichePage.querySelector(`[data-k="${k}"]`);
  const put = (k, v) => { const e = el(k); if (e) e.value = v; };
  const pre = (k, v) => { const e = el(k); if (e && e.value === '' && v != null && v !== '' && !(typeof v === 'number' && isNaN(v))) e.value = v; };

  // Citerne + pige ao amin'ny Transfert (Appoint)
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
    for (let i = 1; i <= nTr; i++) trR += `<tr>${['cit', 'pav', 'pap', 'cpt', 'cav', 'cap', 'qte'].map(f => `<td>${A('tr' + i + '_' + f)}</td>`).join('')}</tr>`;
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
      <table class="fp-t"><tr><th>CITERNE</th><th>PIGE AV</th><th>PIGE AP</th><th>COMPTEUR</th><th>CUVE T AV</th><th>CUVE T AP</th><th>QTÉ</th></tr>${trR}</table>
      <div class="fp-sub">APPOINT GO GROUPE <small>(ligne 1 = litres groupe · ligne 2 = Cuve T (CT) : sert à la consommation)</small></div>
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
    const rel = {}, niv = {}, nivCm = {};
    for (const n of G) {
      rel[n] = [await near(n, d), await near(n, d1)];
      const r0 = await near(n, d, hasNiv, 180), r1 = await near(n, d1, hasNiv, 180);
      niv[n] = [nivL(r0), nivL(r1)];
      nivCm[n] = [r0 ? fNum(r0.gasoilMm) : null, r1 ? fNum(r1.gasoilMm) : null];   // jauge en cm (pour corriger les anciennes valeurs)
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
    return { rel, niv, nivCm, aps, trs, tws };
  }

  const JCOEF = (() => { try { const c = JSON.parse(localStorage.getItem('chefCfg') || '{}').coef; return Array.isArray(c) && c.length >= 2 ? c : [8, 1, 1]; } catch (e) { return [8, 1, 1]; } })();
  function compute() {
    const g = k => fNum((el(k) || {}).value);
    let tp = 0, tc = 0, tj = 0, aP = false, aC = false, aJ = false;
    G.forEach(n => {
      const p = (g('kwh1_' + n) != null && g('kwh0_' + n) != null) ? g('kwh1_' + n) - g('kwh0_' + n) : null;        // HFF = EMCP J+1 − J
      const h = (g('hm1_' + n) != null && g('hm0_' + n) != null) ? g('hm1_' + n) - g('hm0_' + n) : null;
      // V4.30 : Appoint GO = Appoint Go (CT) = CT AV - CT AP (ligne 2) ; si le CT n'est pas rempli, on garde la quantite litres groupe (ligne 1)
      let q = 0; fichePage.querySelectorAll(`[data-k^="ap${n}_"][data-k$="_qL"]`).forEach(e => { const c = fNum((el(e.dataset.k.replace(/_qL$/, '_qC')) || {}).value); q += (c != null ? c : (fNum(e.value) || 0)); });
      const c = (g('niv0_' + n) != null && g('niv1_' + n) != null) ? g('niv0_' + n) + q - g('niv1_' + n) : null;      // Consom = Niveau J + Qté − Niveau J+1
      const s = (c != null && p > 0) ? c * CFG.densite / p : null;
      put('p_' + n, fmt(p)); put('c_' + n, fmt(c)); put('h_' + n, fmt(h, 0)); put('s_' + n, fmt(s, 2));
      if (p != null) { tp += p; aP = true; }
      if (c != null) { tc += c; aC = true; }
      // V4.30 : production JIRAMA = G1 (index JIRAMA x8) + G2 (index JIRAMA x1) + G3 (pas d'index JIRAMA : production HFF/EMCP du G3).
      // Si l'index JIRAMA de G1/G2 manque, on prend l'EMCP (meme regle que le PPS/DPR).
      let pjN = null;
      if (n < 3 && g('jir1_' + n) != null && g('jir0_' + n) != null) pjN = (g('jir1_' + n) - g('jir0_' + n)) * (JCOEF[n - 1] ?? 1);
      else pjN = p;
      if (pjN != null) { tj += pjN; aJ = true; }
    });
    put('rh_prod', aP ? fmt(tp) : ''); put('rj_prod', aJ ? fmt(tj) : '');
    put('rh_consom', aC ? fmt(tc) : ''); put('rh_csp', (aP && aC && tp > 0) ? fmt(tc * CFG.densite / tp, 2) : '');   // CSP = 2 chiffres apres la virgule
  }

  async function loadFiche(reset) {
    const d = curDate, D = await ficheData(d);
    const saved = reset ? null : await db.fiches.where('date').equals(d).first();
    const byG = { 1: [], 2: [], 3: [] };
    D.aps.forEach(a => { const n = +String(a.groupe).replace(/\D/g, ''); if (byG[n]) byG[n].push(a); });
    const body = document.getElementById('fp-body');
    body.innerHTML = buildFiche(Math.max(3, ...G.map(n => byG[n].length)), Math.max(2, D.trs.length));
    if (saved && saved.vals) Object.keys(saved.vals).forEach(k => { const e = el(k); if (e && !e.readOnly) e.value = saved.vals[k]; });
    G.forEach(n => [0, 1].forEach(t => { const e = el('niv' + t + '_' + n); if (e && e.value !== '') e.value = nivNorm(e.value); }));   // anciennes valeurs en cm -> litres
    // RELEVÉ à 06 H J = RELEVÉ à 06 H J+1 de la fiche d'hier (même mesure) : mipetraka ho azy
    const prev = await db.fiches.where('date').equals(addDays(d, -1)).first();
    if (prev && prev.vals) G.forEach(n => ['hm', 'kwh', 'jir', 'niv'].forEach(f => {
      if (f === 'jir' && n === 3) return;
      const v = prev.vals[f + '1_' + n]; if (v !== undefined && v !== '') put(f + '0_' + n, f === 'niv' ? nivNorm(v) : v);
    }));

    // Appoint (avy amin'ny Appoint) : ligne 1 = litres groupe (après conversion), ligne 2 = CT
    G.forEach(n => byG[n].forEach((a, i) => {
      const av = fNum(a.avMm), ap = fNum(a.apMm), qm = fNum(a.qteMm), avL = mmToLs(av), apL = mmToLs(ap);
      const dm = String(a.duree || '').match(/^(\d+):(\d+)$/), chr = dm ? (+dm[1] + +dm[2] / 60) : 0;   // Durée (chrono MM:SS) → minitra
      const marche = a.etat === 'En marche';                                                          // en arrêt : Après − Avant seulement
      const mins = marche ? (chr > 0 ? chr : calcDiffMinutes(a.heureAv, a.heureAp)) : 0;               // en marche : + durée (chrono, sinon Heure AV → AP)
      const qL = (apL != null && avL != null) ? (apL - avL) + mins : null;
      const k = `ap${n}_${i + 1}_`, cA = fNum(a.avCt), cP = fNum(a.apCt);
      put(k + 'avL', fmt(avL)); put(k + 'apL', fmt(apL)); put(k + 'qL', fmt(qL));
      put(k + 'avC', a.avCt ?? ''); put(k + 'apC', a.apCt ?? ''); put(k + 'qC', (cA != null && cP != null) ? (cA - cP) : '');
    }));
    // Transfert (citerne iza, pige, compteur, cuve T)
    D.trs.forEach((t, i) => { const k = 'tr' + (i + 1) + '_'; put(k + 'cit', t.citerne || '—'); put(k + 'pav', t.pigeAv ?? ''); put(k + 'pap', t.pigeAp ?? ''); put(k + 'cpt', t.compteurValeur ?? ''); put(k + 'cav', t.avCt ?? ''); put(k + 'cap', t.apCt ?? ''); put(k + 'qte', t.qte ?? ''); });
    // Pige : côté gauche (AV) = mpiasa jour (06h–17h) · côté droit (AP) = mpiasa alina (17h–06h)
    const mn = t => (t.heure && /^\d{1,2}:\d{2}/.test(t.heure)) ? (+t.heure.slice(0, 2)) * 60 + (+t.heure.slice(3, 5)) : null;
    const isDay = t => { const m = mn(t); return m != null && m >= 360 && m < 1020; };
    const firstOf = l => l.filter(isDay)[0] || l[0];
    const lastOf = l => { const nt = l.filter(t => !isDay(t)); return nt.length ? nt[nt.length - 1] : l[l.length - 1]; };
    [1, 2, 3].forEach(c => { const l = D.trs.filter(t => String(t.citerne).slice(-1) === String(c)); if (l.length) { pre('pg' + c + '_av', firstOf(l).pigeAv); pre('pg' + c + '_ap', lastOf(l).pigeAp); } });
    // V4.31 : CUVE T (CT) a 06h J = CT AV du 1er mouvement de la journee (appoint OU transfert) ; a 06h J+1 = CT AP du dernier mouvement
    {
      const tm = h => (h && /^\d{1,2}:\d{2}/.test(h)) ? ((+h.slice(0, 2)) * 60 + (+h.slice(3, 5)) - 360 + 1440) % 1440 : 99999;
      const ev = [...D.aps.map((a, i) => ({ t: tm(a.heureAv || a.heureAp), o: i, av: fNum(a.avCt), ap: fNum(a.apCt) })), ...D.trs.map((t, i) => ({ t: tm(t.heure), o: 1000 + i, av: fNum(t.avCt), ap: fNum(t.apCt) }))].sort((x, y) => x.t - y.t || x.o - y.o);
      const f0 = ev.find(x => x.av != null), l0 = ev.slice().reverse().find(x => x.ap != null);
      if (f0) put('pgT_av', fmt(f0.av, 0)); if (l0) put('pgT_ap', fmt(l0.ap, 0));
    }
    if (D.trs.length) {
      const lt = D.trs[D.trs.length - 1];                       // COMPTEUR = « Total ou E du compteur » du dernier transfert
      pre('pgC', (lt.compteurTotal !== undefined && lt.compteurTotal !== '') ? lt.compteurTotal : lt.compteurValeur);
    }
    // Relevé 06h J / J+1
    G.forEach(n => [0, 1].forEach(t => { const r = D.rel[n][t]; if (r) { pre('hm' + t + '_' + n, r.heureMarche); pre('kwh' + t + '_' + n, r.energie); } const v = D.niv[n][t]; if (v != null) { const cur = fNum((el('niv' + t + '_' + n) || {}).value), cm = D.nivCm[n][t]; if (cur == null || (cm != null && cur === cm)) put('niv' + t + '_' + n, fmt(v, 2)); } }));   // NIVEAU GO = toujours en LITRES (remplace une ancienne valeur en cm)
    // Entretien + Travaux
    const EN = { hl: 'Filtre à huile', air: 'Filtre à air', go: 'Filtre à gasoil', sep: 'Filtre séparateur' };
    const pf = await db.fiches.where('date').equals(addDays(d, -1)).first(), pv = (pf && pf.vals) || {};
    G.forEach(n => Object.keys(EN).forEach(x => { const k = `en_${x}_${n}`, reset = D.tws.some(t => t.type === EN[x] && +String(t.groupe).slice(1) === n), p0 = fNum(pv[k]), hj = Math.round((fNum((el('hm1_' + n) || {}).value) ?? 0) - (fNum((el('hm0_' + n) || {}).value) ?? 0)); if (reset) put(k, '0'); else if (p0 != null) pre(k, String(p0 + hj)); }));
    pre('trav', D.tws.map(t => `${t.groupe} : ${t.type}${t.hm ? ' (HM ' + t.hm + ')' : ''}${t.qte ? ' – ' + t.qte : ''}`).join('\n'));
    // AQ avy amin'ny Calendrier
    const dt = new Date(d + 'T00:00:00'), rv = resolveLeave(dt, getSched(dt));
    pre('aq_m', rv.jour.name); if (rv.midi) pre('aq_d', rv.midi.name); pre('aq_n', rv.nuit.name);
    compute(); entColor();
  }

  const ENT_TH = { hl: [350, 350, 350], air: [500, 500, 250], go: [250, 250, 250], sep: [250, 250, 250] };
  function entColor() {
    if (!fichePage) return;
    Object.keys(ENT_TH).forEach(x => G.forEach(n => { const e = el(`en_${x}_${n}`); if (!e) return; const v = fNum(e.value), red = v != null && v >= ENT_TH[x][n - 1]; e.style.setProperty('color', red ? '#E5484D' : '', red ? 'important' : ''); e.style.fontWeight = red ? '800' : ''; e.style.webkitPrintColorAdjust = 'exact'; e.style.printColorAdjust = 'exact'; }));
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
    p.style.setProperty('--pz', Math.max(0.3, Math.min(3, k)).toFixed(3));
  }
  window.addEventListener('beforeprint', fitPrint);
  window.addEventListener('afterprint', () => { const p = document.getElementById('fp-paper'); if (p) p.classList.remove('pm'); });
  window.fitPrint = fitPrint;
  function zoomFiche(f) { const p = document.getElementById('fp-paper'); userZoom = true; p.style.zoom = Math.max(0.3, Math.min(2, (parseFloat(p.style.zoom) || 1) * f)); }

  if (fichePage) {
    fichePage.innerHTML = `<div class="fp-bar">
      <button data-act="reset">${ICO('refresh',14)} Actualiser</button><button class="y" id="btn-save-fiche">Enregistrer</button><button id="btn-print-fiche">Imprimer</button></div>
      <div class="fp-scroll" id="fp-scroll"><div class="fp-paper" id="fp-paper"><div id="fp-body"></div></div></div>`;
    fichePage.addEventListener('input', e => { if (e.target.dataset && e.target.dataset.k) { compute(); entColor(); } });
    fichePage.addEventListener('change', e => { if (e.target.id === 'f-date' && e.target.value) { curDate = e.target.value; loadFiche(); } });
    fichePage.addEventListener('click', async e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.act === 'zi') zoomFiche(1.2);
      if (b.dataset.act === 'zo') zoomFiche(1 / 1.2);
      if (b.dataset.act === 'fit') { userZoom = false; fitFiche(); }
      if (b.dataset.act === 'reset') { if (confirm('Averina avy amin\'ny Appoint/Relevés ny fiche ve?')) loadFiche(true); }
      if (b.id === 'btn-print-fiche') window.print();
      if (b.id === 'btn-save-fiche') {
        const vals = {}; fichePage.querySelectorAll('[data-k]').forEach(x => vals[x.dataset.k] = x.value);
        const prevRec = await db.fiches.where('date').equals(curDate).first();
        if (prevRec && prevRec.vals) Object.keys(prevRec.vals).forEach(k => { if (!(k in vals)) vals[k] = prevRec.vals[k]; });   // garde les compléments du Chef
        const rec = { date: curDate, statut: 'soumise', vals, totalProd: vals.rh_prod, totalGo: vals.rh_consom, csp: vals.rh_csp };
        try {
          const old = await db.fiches.where('date').equals(curDate).first();
          if (old) await db.fiches.update(old.id, rec); else await db.fiches.add(rec);
          alert('Fiche enregistrée avec succès !');
        } catch (err) { console.error(err); alert("Erreur lors de l'enregistrement."); }
      }
    });
    (function () {   // zoom par pincement (2 doigts)
      const sc = document.getElementById('fp-scroll'), p = document.getElementById('fp-paper'); let d0 = 0, z0 = 1;
      const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
      sc.addEventListener('touchstart', e => { if (e.touches.length === 2) { d0 = dist(e.touches); z0 = parseFloat(p.style.zoom) || 1; } }, { passive: true });
      sc.addEventListener('touchmove', e => { if (e.touches.length === 2 && d0) { userZoom = true; p.style.zoom = Math.max(0.3, Math.min(CFG.ficheZoom || 3, z0 * dist(e.touches) / d0)); } }, { passive: true });
      sc.addEventListener('touchend', () => { d0 = 0; }, { passive: true });
    })();
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
            <div><b>Air ADM (°C):</b> ${(currentEditData.airAdm !== undefined && currentEditData.airAdm !== null && currentEditData.airAdm !== '') ? currentEditData.airAdm : '-'}</div><div><b>Transfo:</b> ${currentEditData.transfo||'-'}</div>
            <div><b>P. Huile:</b> ${currentEditData.pressHuile||'-'}</div><div><b>P. Gasoil:</b> ${currentEditData.pressGasoil||'-'}</div>
            <div><b>Énergie:</b> ${currentEditData.energie||'-'}</div><div><b>Gasoil:</b> ${currentEditData.gasoilLitres||'-'}</div>
            <div><b>H. Marche:</b> ${currentEditData.heureMarche||'-'}</div>
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
            <p><b>Niveaux:</b> ${currentEditData.avMm} → ${currentEditData.apMm} cm (Qte: ${currentEditData.qteMm})</p>
            <p><b>CT:</b> ${currentEditData.avCt} → ${currentEditData.apCt}</p><p><b>Obs:</b> ${currentEditData.obs||'-'}</p>
          </div>
        `;
      } else if (table === 'operations') {
        contentHTML = `<div style="font-size:15px; line-height:1.8;"><p>${escH(window.CATopResume ? window.CATopResume(currentEditData) : '')}</p><p><b>Agent:</b> ${escH(currentEditData.par || '-')}</p><p><b>Obs:</b> ${escH(currentEditData.obs || '-')}</p></div>`;
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
      cols: [['Date', r => r.date], ['Heure', r => r.heure], ['Grp', r => r.groupe], ['Puiss. (MW)', r => r.puissance], ['Tension', r => r.tension], ['Intens.', r => r.intensite], ['Cos φ', r => r.cos], ['RPM', r => r.rpm], ['Fréq.', r => r.frequence], ['T° Eau', r => r.tempEau], ['T° Huile', r => r.tempHuile], ['Air ADM (°C)', r => r.airAdm], ['Transfo', r => r.transfo], ['P. Huile', r => r.pressHuile], ['P. Gasoil', r => r.pressGasoil], ['Énergie', r => r.energie], ['Gasoil', r => r.gasoilLitres], ['H. Marche', r => r.heureMarche]],
      det: r => ['Relevé ' + r.groupe, r.date + ' à ' + r.heure] },
    appoints: { label: 'Appoints', ico: ICO('fuel',22),
      cols: [['Date', a => a.date], ['Grp', a => a.groupe], ['État', a => a.etat], ['Heure AV', a => a.heureAv], ['Heure AP', a => a.heureAp], ['Durée', a => a.duree], ['Niv. AV (cm)', a => a.avMm], ['Niv. AP (cm)', a => a.apMm], ['Qté', a => a.qteMm], ['CT AV', a => a.avCt], ['CT AP', a => a.apCt], ['Obs.', a => a.obs]],
      det: a => ['Appoint ' + a.groupe, a.date] },
    transferts: { label: 'Transferts', ico: ICO('refresh',22),
      cols: [['Date', t => t.date], ['Heure', t => t.heure], ['Citerne', t => t.citerne], ['Pige AV', t => t.pigeAv], ['Pige AP', t => t.pigeAp], ['CT AV', t => t.avCt], ['CT AP', t => t.apCt], ['Qté (cm)', t => t.qte], ['Compteur', t => t.compteurValeur], ['Total compteur', t => t.compteurTotal], ['Obs.', t => t.obs]],
      det: t => ['Transfert', t.date + ' à ' + t.heure] },
    travaux: { label: 'Travaux', ico: ICO('tool',22),
      cols: [['Date', t => t.date], ['Grp', t => t.groupe], ['HM', t => t.hm], ['Travail', t => t.type], ['Agent', t => t.agent], ['Référence', t => t.ref], ['Qté', t => t.qte]],
      det: t => ['Travail ' + t.type, t.date] },
    operations: { label: 'Opérations', ico: ICO('clock',22),
      cols: [['Date', o => o.date], ['Opération', o => window.CATopLabel ? window.CATopLabel(o) : o.type], ['Grp', o => o.type === 'permutation' ? o.groupe + ' → ' + o.groupe2 : o.groupe], ['Heures', o => window.CATopResume ? window.CATopResume(o).split(' | ')[0] : ''], ['Énergie (kWh)', o => o.en], ['HM', o => o.hm], ['Gasoil (cm)', o => o.go], ['Agent', o => o.par], ['Obs.', o => o.obs]],
      det: o => [(window.CATopLabel ? window.CATopLabel(o) : o.type) + ' ' + (o.groupe || ''), o.date] },
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
    const base = terms.length ? TV.all.filter(x => terms.every(t => x.text.includes(t))) : TV.all.slice();
    // Filtres dynamiques : chaque liste ne propose que les valeurs existantes compte tenu de la recherche et des AUTRES filtres.
    const FAC = [
      ['tvFGrp', x => x.r.groupe || '', 'Tous les groupes', v => v, (a, b) => String(a).localeCompare(String(b), 'fr', { numeric: true })],
      ['tvFDate', x => x.r.date || '', 'Toutes les dates', v => v.split('-').reverse().join('/'), (a, b) => String(b).localeCompare(String(a))],
      ['tvFHeure', x => String(x.r.heure || x.r.heureAv || '').slice(0, 2), 'Toutes les heures', v => v + ' h', (a, b) => String(a).localeCompare(String(b))]
    ];
    const cur = {}; FAC.forEach(f => cur[f[0]] = tvEl(f[0]) ? tvEl(f[0]).value : '');
    const pass = (x, skip) => FAC.every(f => f[0] === skip || !cur[f[0]] || f[1](x) === cur[f[0]]);
    FAC.forEach(f => {
      const el = tvEl(f[0]); if (!el) return;
      const cnt = {}; base.forEach(x => { if (pass(x, f[0])) { const v = f[1](x); if (v) cnt[v] = (cnt[v] || 0) + 1; } });
      const vals = Object.keys(cnt).sort(f[4]);
      if (cur[f[0]] && !cnt[cur[f[0]]]) cur[f[0]] = '';   // valeur devenue impossible : filtre retire automatiquement
      const sig = f[0] + '|' + cur[f[0]] + '|' + vals.map(v => v + ':' + cnt[v]).join(',');
      if (el._sig !== sig) {
        el.innerHTML = `<option value="">${f[2]}</option>` + vals.map(v => `<option value="${escH(v)}">${escH(f[3](v))} (${cnt[v]})</option>`).join('');
        el._sig = sig;
      }
      el.value = cur[f[0]];
      if (el.parentElement) el.parentElement.classList.toggle('hidden', !vals.length && !cur[f[0]]);   // champ inutile pour cette rubrique (ex. pas de groupe)
    });
    const fg = cur.tvFGrp, fd = cur.tvFDate, fh = cur.tvFHeure;
    let rows = base.filter(x => pass(x, null));
    if (TV.sc >= 0) {
      const c = TV.sc, num = v => { const n = Number(String(v).replace(',', '.')); return (v === '' || isNaN(n)) ? null : n; };
      rows.sort((a, b) => {
        const A = a.cells[c], B = b.cells[c], nA = num(A), nB = num(B);
        return TV.sd * ((nA != null && nB != null) ? nA - nB : String(A).localeCompare(String(B), 'fr', { numeric: true }));
      });
    }
    const nf = [fg, fd, fh].filter(Boolean).length;
    if (tvEl('tvFilterBadge')) { tvEl('tvFilterBadge').textContent = nf; tvEl('tvFilterBadge').classList.toggle('hidden', !nf); tvEl('tvFilterBtn').classList.toggle('active', nf > 0); }
    TV.rows = rows; TV.shown = rows.slice(0, TV.limit);
    const tbl = tvEl('tvTable');
    tbl.classList.toggle('tv-all', TV.cat === 'all');
    tbl.querySelector('thead').innerHTML = '<tr>' + TV.cols.map((c, i) => `<th data-c="${i}">${escH(c)}${TV.sc === i ? (TV.sd > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('') + '</tr>';
    tbl.querySelector('tbody').innerHTML = TV.shown.length
      ? TV.shown.map((x, i) => `<tr data-i="${i}">${x.cells.map(v => `<td>${v === '' ? '-' : escH(v)}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${TV.cols.length}" class="tv-empty">Aucun résultat.</td></tr>`;
    tvEl('tvCount').textContent = rows.length + ' résultat' + (rows.length > 1 ? 's' : '') + (rows.length > TV.shown.length ? ' · ' + TV.shown.length + ' affichés' : '');
    tvEl('tvMore').classList.toggle('hidden', rows.length <= TV.shown.length);
    if (tvEl('tvFInfo')) tvEl('tvFInfo').textContent = rows.length + ' résultat' + (rows.length > 1 ? 's' : '');
  }

  function closeTV() { tvEl('tvOverlay').classList.remove('open'); document.body.style.overflow = ''; }

  window.openTableView = async function (cat, q) {
    TV.cat = cat; TV.q = q || ''; TV.sc = -1; TV.sd = 1; TV.limit = 500;
    tvEl('tvTitle').textContent = cat === 'all' ? 'Recherche globale' : HIST[cat].label;
    tvEl('tvSearch').value = TV.q; ['tvFGrp', 'tvFDate', 'tvFHeure'].forEach(id => { if (tvEl(id)) tvEl(id).value = ''; });
    if (tvEl('tvFilterPanel')) { tvEl('tvFilterPanel').classList.add('hidden'); tvEl('tvFilterBtn').setAttribute('aria-expanded', 'false'); }
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
    ['tvFGrp', 'tvFDate', 'tvFHeure'].forEach(id => tvEl(id).addEventListener('change', () => { TV.limit = 500; tvRender(); }));
    tvEl('tvFReset').addEventListener('click', () => { ['tvFGrp', 'tvFDate', 'tvFHeure'].forEach(id => tvEl(id).value = ''); TV.limit = 500; tvRender(); });
    const tvClosePanel = () => { tvEl('tvFilterPanel').classList.add('hidden'); tvEl('tvFilterBtn').setAttribute('aria-expanded', 'false'); };
    tvEl('tvFDone').addEventListener('click', tvClosePanel);
    document.addEventListener('pointerdown', e => {   // clic en dehors : ferme la liste des filtres (le tableau ne bouge jamais)
      const pn = tvEl('tvFilterPanel'); if (pn.classList.contains('hidden')) return;
      if (e.target.closest('#tvFilterPanel') || e.target.closest('#tvFilterBtn')) return;
      tvClosePanel();
    });
    tvEl('tvFilterBtn').addEventListener('click', () => {
      const open = tvEl('tvFilterPanel').classList.toggle('hidden') === false;
      tvEl('tvFilterBtn').setAttribute('aria-expanded', String(open));
    });
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
      if (tvEl('tvOverlay').classList.contains('open')) { if (!tvEl('tvFilterPanel').classList.contains('hidden')) { tvEl('tvFilterPanel').classList.add('hidden'); tvEl('tvFilterBtn').setAttribute('aria-expanded', 'false'); } else closeTV(); }
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
  let CFG = { themeMode: localStorage.getItem('theme') === 'dark' ? 'dark' : 'light', fontSize: 15, ficheZoom: 3, densite: 830, alerts: {}, pinHash: '', autoLock: 0, seuilGo: '', capCuve: '', groupes: { G1: true, G2: true, G3: true }, rappel: false, ...JSON.parse(localStorage.getItem('cat_cfg') || '{}') };
  const saveCfg = () => localStorage.setItem('cat_cfg', JSON.stringify(CFG));
  window.CATcfg = () => CFG;
  window.CATdb = db;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  function applyCfg() {
    document.body.style.fontSize = CFG.fontSize + 'px';
    window.setTheme(CFG.themeMode === 'auto' ? (mq.matches ? 'dark' : 'light') : CFG.themeMode, true);
  }
  mq.addEventListener && mq.addEventListener('change', () => { if (CFG.themeMode === 'auto') applyCfg(); });
  applyCfg();

  const sha = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('cat:' + s)))].map(b => b.toString(16).padStart(2, '0')).join('');
  async function askPin(msg) {
    if (!CFG.pinHash) return true;
    const p = prompt(msg || 'Code PIN :'); if (p === null) return false;
    if (await sha(p) === CFG.pinHash) return true;
    alert('Code PIN incorrect.'); return false;
  }
  window.askPin = askPin;
  function applyGroupes() {
    const g = CFG.groupes || {};
    document.querySelectorAll('#r-groupe option, #ap-groupe option, #tw-groupe option, #filter-groupe option').forEach(o => {
      if (/^G[123]$/.test(o.value)) { const off = g[o.value] === false; o.hidden = off; o.disabled = off; }
    });
    ['r-groupe', 'ap-groupe', 'tw-groupe'].forEach(id => { const s = document.getElementById(id); if (s && s.selectedOptions[0] && s.selectedOptions[0].disabled) { const f = [...s.options].find(o => !o.disabled); if (f) s.value = f.value; } });
  }
  applyGroupes();
  // rappel hebdomadaire de sauvegarde
  setTimeout(() => {
    if (!CFG.rappel) return;
    const last = localStorage.getItem('cat_last_backup_ts'), age = last ? (Date.now() - (+last)) / 864e5 : 99;
    if (age >= 7 && confirm('Rappel : sauvegarde non faite depuis ' + (last ? Math.floor(age) + ' jours' : 'longtemps') + '. Exporter maintenant ?')) window.exportBackup();
  }, 2500);
  // verrouillage automatique au retour d'arrière-plan (nécessite l'empreinte activée)
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (CFG.autoLock > 0 && hiddenAt && Date.now() - hiddenAt > CFG.autoLock * 60000 && window.CATlock) window.CATlock();
  });

  const ALERT_DEFS = [['tension', 'Tension (V)'], ['frequence', 'Fréquence (Hz)'], ['cos', 'Cos φ'], ['tempEau', 'Temp. eau (°C)'], ['pressHuile', 'Pression huile (kPa)'], ['pressGasoil', 'Pression gasoil (kPa)']];
  function checkAlerts(r) {
    const out = [];
    ALERT_DEFS.forEach(([k, l]) => {
      const v = fNum(r[k]), a = CFG.alerts[k] || {};
      if (v == null) return;
      if (a.min != null && v < a.min) out.push(`${l} = ${v}  (min ${a.min})`);
      if (a.max != null && v > a.max) out.push(`${l} = ${v}  (max ${a.max})`);
    });
    const gl = fNum(r.gasoilLitres), sg = fNum(CFG.seuilGo);
    if (gl != null && sg != null && gl < sg) out.push(`Niveau gasoil = ${gl} L  (seuil ${sg} L)`);
    return out;
  }

  let sm = document.getElementById('settingsModal');
  if (!sm) { sm = document.createElement('div'); sm.id = 'settingsModal'; sm.className = 'modal-overlay'; document.body.appendChild(sm); }

  let stTab = 'menu', stSyncMsg = '';
  async function renderSettings() {
    const tbls = [['relevés', 'Relevés horaires'], ['appoints', 'Appoints'], ['transferts', 'Transferts'], ['travaux', 'Travaux'], ['operations', 'Opérations'], ['fiches', 'Fiches d\'exploitation']];
    const cnt = {}; for (const [t] of tbls) cnt[t] = await db[t].count();
    let SI = null; if (stTab === 'sync' && window.CATsync) { try { SI = await window.CATsync.info(); } catch (e) {} }
    const seg = (id, opts, cur) => `<div class="st-seg" data-seg="${id}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" class="${String(cur) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    const TABS = [['profil', 'users', 'Profil'], ['apparence', 'palette', 'Apparence'], ['securite', 'shield', 'Sécurité'], ['technique', 'tool', 'Technique'], ['calculs', 'calc', 'Calculs'], ['notifications', 'bell', 'Notifications'], ['sync', 'refresh', 'Synchronisation'], ['alertes', 'alert', 'Alertes'], ['sauvegarde', 'save', 'Sauvegarde'], ['donnees', 'folder', 'Données'], ['apropos', 'info', 'À propos']];   // 'apropos' ouvre la fenêtre À propos
    const P = {
      apparence: `<h2>Apparence</h2><p class="st-sub">Thème, taille du texte et couleur de l'application.</p>
        <div class="st-box">
          <div class="st-row"><span>Thème</span>${seg('theme', [['light', 'Clair'], ['dark', 'Sombre'], ['auto', 'Auto']], CFG.themeMode)}</div>
          <div class="st-row"><span>Taille du texte</span>${seg('font', [[14, 'Petit'], [15, 'Normal'], [17, 'Grand']], CFG.fontSize)}</div>
          <div class="st-row"><span>Langue<small>Langue de l'interface (les rapports restent en français)</small></span>${seg('lang', [['fr', 'FR'], ['mg', 'MG'], ['en', 'EN']], (window.CATi18n && window.CATi18n.get()) || 'fr')}</div>
          <div class="st-row"><span>Zoom maximum de la fiche<small>Pincement à 2 doigts · <b id="st-fz-v">${CFG.ficheZoom || 3}x</b></small></span><input type="range" id="st-fz" min="1" max="5" step="0.5" value="${CFG.ficheZoom || 3}" style="width:140px"></div>
          <div class="st-row"><span>Couleur d'accent <button type="button" class="st-btn" data-accent="#2F5BD3" style="padding:4px 8px;font-size:12px">Réinitialiser</button></span><div class="color-picker-grid" style="margin:0">${['#2F5BD3', '#F97316', '#22C55E', '#3B82F6', '#A855F7', '#EF4444'].map(c => `<button type="button" class="color-btn" data-accent="${c}" style="background:${c}"></button>`).join('')}</div></div>
        </div>`,
      securite: `<h2>Mot de passe &amp; sécurité</h2><p class="st-sub">Code PIN et verrouillage de l'application.</p>
        <div class="st-box">
          <div class="st-row"><span>Code PIN<small>${CFG.pinHash ? 'Défini' : 'Non défini'} · demandé avant « Vider », « Importer » et « Tout effacer »</small></span>
            <div class="st-actions" style="margin:0"><button type="button" class="st-btn" id="st-pin">${CFG.pinHash ? 'Modifier' : 'Définir'}</button>${CFG.pinHash ? '<button type="button" class="st-btn danger" id="st-pin-del">Retirer</button>' : ''}</div></div>
          <div class="st-row"><span>Empreinte digitale<small>${localStorage.getItem('catBio') ? 'Activée sur cet appareil' : 'Non activée'} · ouvre l\'application sans mot de passe</small></span><button type="button" class="st-btn" id="st-bio">${localStorage.getItem('catBio') ? 'Désactiver' : 'Activer'}</button></div>
          <div class="st-row"><span>Verrouillage automatique<small>${localStorage.getItem('catBio') ? 'Après inactivité (empreinte requise pour rouvrir)' : 'Activez d\'abord l\'empreinte digitale à la connexion'}</small></span>${seg('autolock', [[0, 'Jamais'], [5, '5 min'], [15, '15 min']], CFG.autoLock)}</div>
        </div>`,
      technique: `<h2>Paramètres techniques</h2><p class="st-sub">Mahanoro Power System.</p>
        <div class="st-box">
          <div class="st-row"><span>Seuil d'alerte niveau gasoil (L)<small>Alerte si le relevé est en dessous</small></span><input type="number" id="st-seuil" class="st-in" placeholder="ex: 200" value="${CFG.seuilGo ?? ''}"></div>
          <div class="st-row"><span>Capacité maximale Cuve T (cm)</span><input type="number" id="st-cap" class="st-in" value="${CFG.capCuve ?? ''}"></div>
          <div class="st-row"><span>Groupes actifs</span><div class="st-seg">${['G1', 'G2', 'G3'].map(g => `<button type="button" data-grp="${g}" class="${(CFG.groupes || {})[g] === false ? '' : 'on'}">${g}</button>`).join('')}</div></div>
        </div>`,
      calculs: `<h2>Calculs</h2><p class="st-sub">Valeurs utilisées dans la Fiche d'exploitation.</p>
        <div class="st-box"><div class="st-row"><span>Densité du gasoil (g/L)<small>Ampiasaina amin'ny CSP ao amin'ny Fiche</small></span><input type="number" id="st-dens" class="st-in" value="${CFG.densite}"></div></div>`,
      sync: (() => {
        if (!SI) return `<h2>Synchronisation</h2><p class="st-sub">Module indisponible. Mettez l'application à jour (Sauvegarde &gt; Mettre à jour).</p>`;
        const fmt = ts => ts ? new Date(ts).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'jamais';
        const stTxt = !SI.logged ? 'Non connecté' : SI.busy ? 'Synchronisation en cours…' : !SI.online ? 'Hors ligne' : SI.err ? 'Erreur' : 'Synchronisé';
        const cls = !SI.online || SI.err ? 'color:var(--danger)' : '';
        return `<h2>Synchronisation</h2><p class="st-sub">Fampifandraisana amin'ny serveur. Mihazona ny angona rehetra ao amin'ity appareil ity ianao na tsy misy internet.</p>
        <div class="st-box">
          <div class="st-row"><span>Connexion<small>État du réseau de l'appareil</small></span><b style="${cls}">${SI.online ? 'En ligne' : 'Hors ligne'}</b></div>
          <div class="st-row"><span>État<small>Synchronisation automatique toutes les 30 secondes</small></span><b style="${cls}">${stTxt}</b></div>
          <div class="st-row"><span>Dernière synchronisation</span><b>${fmt(SI.last)}</b></div>
          <div class="st-row"><span>En attente d'envoi<small>Modifications faites sur cet appareil</small></span><b>${SI.pending}</b></div>
          ${SI.err ? `<p class="st-hint" style="color:var(--danger)">Dernière erreur : ${escH(SI.err)}</p>` : ''}
          ${stSyncMsg ? `<p class="st-hint">${escH(stSyncMsg)}</p>` : ''}
          <div class="st-actions"><button type="button" class="st-btn" id="st-sync" ${SI.busy || !SI.logged ? 'disabled' : ''}>${ICO('refresh', 16)} Synchroniser maintenant</button></div>
        </div>`;
      })(),
      notifications: (() => {
        const N = window.CATnotif;
        if (!N) return `<h2>Notifications</h2><p class="st-sub">Module indisponible. Mettez l'application à jour (Sauvegarde &gt; Mettre à jour).</p>`;
        const n = N.get(), sys = N.sysState(), isCh = document.body.dataset.role === 'chef', yn = [[1, 'Oui'], [0, 'Non']], b = v => v ? 1 : 0;
        const tn = { son1: 'Son 1', ding: 'Ding', double: 'Double', cloche: 'Cloche', alarme: 'Alarme', sirene: 'Sirène' };
        const tseg = (id, list, cur) => seg(id, list.map(k => [k, tn[k]]), cur);
        const test = k => `<button type="button" class="st-btn" data-nttest="${k}" style="padding:7px 12px;font-size:12px">Tester</button>`;
        const hist = N.history();
        const fmt = ts => new Date(ts).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        const sysTxt = sys === 'unsupported' ? 'Non pris en charge par ce navigateur' : sys === 'denied' ? 'Bloquées : autorisez-les dans les réglages du site / du navigateur' : (sys === 'granted' && n.system) ? 'Activées sur cet appareil' : 'Désactivées';
        return `<h2>Notifications &amp; sonnerie</h2><p class="st-sub">Fanairana sy feon'ny hafatra, alertes ary consignes. Voatahiry ao amin'ity appareil ity ihany ny safidy.</p>
        <div class="st-box">
          <div class="st-row"><span>Notifications<small>Interrupteur général</small></span>${seg('nt-on', yn, b(n.on))}</div>
          <div class="st-row"><span>Sonnerie</span>${seg('nt-sound', yn, b(n.sound))}</div>
          <div class="st-row"><span>Volume</span>${seg('nt-vol', [[1, 'Bas'], [2, 'Moyen'], [3, 'Fort']], n.volume)}</div>
          <div class="st-row"><span>Vibration<small>Téléphone uniquement</small></span>${seg('nt-vib', yn, b(n.vibrate))}</div>
        </div>
        <div class="st-box">
          <div class="st-row"><span>Messagerie<small>Nouveau message reçu</small></span>${seg('nt-mail', yn, b(n.mail))}</div>
          ${isCh ? `<div class="st-row"><span>Alertes<small>Valeurs hors limites et déclenchements des agents</small></span>${seg('nt-alert', yn, b(n.alert))}</div>` : ''}
          <div class="st-row"><span>Consignes<small>Consigne prioritaire publiée par le Chef</small></span>${seg('nt-consigne', yn, b(n.consigne))}</div>
        </div>
        <div class="st-box">
          <div class="st-row"><span>Son messagerie</span><div class="st-actions" style="margin:0">${tseg('nt-tmail', ['son1', 'ding', 'double', 'cloche'], n.toneMail)}${test('mail')}</div></div>
          ${isCh ? `<div class="st-row"><span>Son alerte</span><div class="st-actions" style="margin:0">${tseg('nt-talert', ['son1', 'alarme', 'sirene', 'double'], n.toneAlert)}${test('alert')}</div></div>` : ''}
          <div class="st-row"><span>Son consigne</span><div class="st-actions" style="margin:0">${tseg('nt-tcons', ['son1', 'double', 'cloche', 'ding'], n.toneConsigne)}${test('consigne')}</div></div>
        </div>
        <div class="st-box">
          <div class="st-row"><span>Mode silencieux<small>Pas de son ni de vibration pendant cette plage. Les alertes sonnent toujours.</small></span>${seg('nt-quiet', yn, b(n.quiet))}</div>
          ${n.quiet ? `<div class="st-row"><span>De</span><input type="time" id="nt-qf" class="st-in" value="${n.qFrom}"></div><div class="st-row"><span>À</span><input type="time" id="nt-qt" class="st-in" value="${n.qTo}"></div>` : ''}
        </div>
        <div class="st-box">
          <div class="st-row"><span>Notifications du système<small>${sysTxt} · affichées quand l'application est en arrière-plan</small></span>
            ${sys === 'unsupported' ? '' : (sys === 'granted' && n.system) ? '<button type="button" class="st-btn danger" id="nt-sys-off">Désactiver</button>' : '<button type="button" class="st-btn" id="nt-sys">Activer</button>'}</div>
          <p class="st-hint">Sans serveur push, ces notifications arrivent seulement si l'application est ouverte ou encore active en mémoire du téléphone.</p>
        </div>
        <div class="st-box">
          <div class="st-row"><span>Historique<small>${hist.length} notification(s) récente(s)</small></span>${hist.length ? '<button type="button" class="st-btn danger" id="nt-hclear">Effacer</button>' : ''}</div>
          ${hist.map(h => `<div class="st-row" style="align-items:flex-start"><span><b>${escH(h.title)}</b><small>${fmt(h.ts)}</small>${escH(h.body)}</span></div>`).join('')}
        </div>`;
      })(),
      alertes: `<h2>Alertes des relevés</h2><p class="st-sub">Fanairana rehefa mihoatra ny sisintany ny relevé. Avelao foana ny tsy ilaina.</p>
        <div class="st-box st-grid2">${ALERT_DEFS.map(([k, l]) => { const a = CFG.alerts[k] || {}; return `<div class="st-row"><span>${l}</span><div class="st-mm"><input type="number" step="any" placeholder="Min" data-al="${k}" data-b="min" value="${a.min ?? ''}"><input type="number" step="any" placeholder="Max" data-al="${k}" data-b="max" value="${a.max ?? ''}"></div></div>`; }).join('')}</div>`,
      sauvegarde: `<h2>Sauvegarde &amp; restauration</h2><p class="st-sub">Voatahiry ao amin'ity appareil ity ihany ny angona. Manaova sauvegarde tsy tapaka, indrindra rehefa hifindra finday na ordinateur.</p>
        <div class="st-box"><p class="st-hint">Dernière sauvegarde : <b>${localStorage.getItem('cat_last_backup') || 'jamais'}</b></p>
          <div class="st-actions"><button type="button" class="st-btn" id="st-exp">${ICO('down',16)} Exporter (JSON)</button><label class="st-btn" id="st-imp-l">${ICO('up',16)} Importer<input type="file" id="st-imp" accept=".json,application/json" hidden></label></div></div>
        <div class="st-box"><div class="st-row"><span>Rappel de sauvegarde (hebdomadaire)</span>${seg('rappel', [[1, 'Oui'], [0, 'Non']], CFG.rappel ? 1 : 0)}</div>
          <div class="st-row"><span>Forcer la mise à jour<small>Vide le cache et charge la dernière version</small></span><button type="button" class="st-btn" id="st-upd">${ICO('refresh',16)} Mettre à jour</button></div></div>`,
      donnees: `<h2>Données</h2><p class="st-sub">Nombre d'enregistrements et suppression par rubrique.</p>
        <div class="st-box">${tbls.map(([t, l]) => `<div class="st-row"><span>${l}<small>${cnt[t]} enregistrement(s)</small></span><button type="button" class="st-btn danger" data-clear="${t}">Vider</button></div>`).join('')}
          <div class="st-row"><span>Réinitialisation complète<small>Efface toutes les données de l'appareil</small></span><button type="button" class="st-btn danger" id="st-all">Tout effacer</button></div></div>`
    };
    const ARROW = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>';
    const isMenu = stTab === 'menu', cur = TABS.find(x => x[0] === stTab);
    const lastB = localStorage.getItem('cat_last_backup') || 'jamais';
    const menuBody = `<div class="cd-hero"><div class="hc-top"><div class="hc-ic">${ICO('gear', 22)}</div><div class="hc-t"><b>Paramètres</b><span>CAT by Manda · Mahanoro</span></div></div>
        <div class="hc-lab">Dernière sauvegarde</div><div class="hc-val"><b style="font-size:15px">${lastB}</b></div>
        <button type="button" class="hc-go" data-tab="sauvegarde" aria-label="Sauvegarde">${ICO('next', 20)}</button></div>
      <div class="cd-nav">${TABS.map(([id, ic, l]) => `<button type="button" class="cd-nt" ${id === 'apropos' ? 'data-about="1"' : id === 'profil' ? 'data-profile="1"' : `data-tab="${id}"`}>${ICO(ic, 40)}<span>${l}</span></button>`).join('')}</div>`;
    sm.innerHTML = `<div class="modal st-modal bred-modal ${isMenu ? 'hero' : ''}"><div class="modal-head">
        ${isMenu ? `<button class="modal-close" type="button" aria-label="Fermer">${ARROW}</button>` : `<button class="bm-circle" type="button" data-tab="menu" aria-label="Retour">${ARROW}</button>`}
        <h3>${isMenu ? 'Paramètres' : cur[2]}</h3><span class="bm-circle bm-ghost" aria-hidden="true"></span></div>
      <div class="modal-body">${isMenu ? menuBody : `<div class="st-panel">${P[stTab]}</div>`}</div></div>`;
  }

  sm.addEventListener('click', async (e) => {
    const t = e.target;
    if (t.closest('.modal-close')) { sm.classList.remove('open'); return; }
    if (t.closest('[data-about]')) { window.openAboutModal(); return; }
    if (t.closest('[data-profile]')) { sm.classList.remove('open'); if (window.openProfile) window.openProfile(); return; }
    const tb = t.closest('[data-tab]'); if (tb) { stTab = tb.dataset.tab; renderSettings(); return; }
    if (t.closest('#st-sync')) {
      stSyncMsg = 'Synchronisation en cours…'; renderSettings();
      const r = await window.CATsync.now();
      stSyncMsg = r.ok ? 'Synchronisation terminée.' : r.reason === 'offline' ? 'Pas de réseau : la synchronisation reprendra automatiquement au retour d\'internet.' : r.reason === 'login' ? 'Connectez-vous d\'abord.' : 'La synchronisation a échoué. Un nouvel essai aura lieu automatiquement.';
      renderSettings(); return;
    }
    const N = window.CATnotif;
    if (N) {
      const nb = t.closest('[data-nttest]'); if (nb) { N.test(nb.dataset.nttest); return; }
      if (t.closest('#nt-sys')) { const r = await N.sysAsk(); if (r === 'denied') alert('Notifications bloquées : autorisez-les dans les réglages du site ou du navigateur, puis réessayez.'); else if (r === 'granted') N.test('mail'); renderSettings(); return; }
      if (t.closest('#nt-sys-off')) { N.set({ system: false }); renderSettings(); return; }
      if (t.closest('#nt-hclear')) { N.clearHistory(); renderSettings(); return; }
      const ns = t.closest('[data-seg] button');
      if (ns && String(ns.parentElement.dataset.seg).startsWith('nt-')) {
        const id = ns.parentElement.dataset.seg, v = ns.dataset.v;
        const BOOL = { 'nt-on': 'on', 'nt-sound': 'sound', 'nt-vib': 'vibrate', 'nt-mail': 'mail', 'nt-alert': 'alert', 'nt-consigne': 'consigne', 'nt-quiet': 'quiet' };
        const TONE = { 'nt-tmail': ['toneMail', 'mail'], 'nt-talert': ['toneAlert', 'alert'], 'nt-tcons': ['toneConsigne', 'consigne'] };
        if (BOOL[id]) N.set({ [BOOL[id]]: v === '1' });
        else if (id === 'nt-vol') { N.set({ volume: +v }); N.play(N.get().toneMail); }
        else if (TONE[id]) { N.set({ [TONE[id][0]]: v }); N.play(v); }
        renderSettings(); return;
      }
    }
    const sg = t.closest('[data-seg] button');
    if (sg) { const id = sg.parentElement.dataset.seg; if (id === 'lang') { if (window.CATi18n) window.CATi18n.set(sg.dataset.v); renderSettings(); return; } if (id === 'theme') CFG.themeMode = sg.dataset.v; else if (id === 'autolock') CFG.autoLock = +sg.dataset.v; else if (id === 'rappel') CFG.rappel = sg.dataset.v === '1'; else CFG.fontSize = +sg.dataset.v; saveCfg(); applyCfg(); renderSettings(); return; }
    const ac = t.closest('[data-accent]'); if (ac) { window.setAccent(ac.dataset.accent); return; }
    const sg2 = t.closest('[data-grp]');
    if (sg2) { const g = sg2.dataset.grp; CFG.groupes = CFG.groupes || {}; const on = CFG.groupes[g] !== false; if (on && Object.values({ G1: 1, G2: 1, G3: 1 }).length && ['G1', 'G2', 'G3'].filter(x => CFG.groupes[x] !== false).length <= 1) { alert('Au moins un groupe doit rester actif.'); return; } CFG.groupes[g] = !on; saveCfg(); applyGroupes(); renderSettings(); return; }
    if (t.closest('#st-bio')) {
      try {
        if (!window.CATbio) throw new Error('Connexion en ligne requise.');
        if (window.CATbio.on()) window.CATbio.disable(); else await window.CATbio.enable();
      } catch (err) { alert(err && err.message ? err.message : 'Activation impossible ou annulée.'); }
      renderSettings(); return;
    }
    if (t.closest('#st-pin')) {
      if (CFG.pinHash && !(await askPin('Code PIN actuel :'))) return;
      const p1 = prompt('Nouveau code PIN (4 chiffres minimum) :'); if (p1 === null) return;
      if (!/^\d{4,8}$/.test(p1)) { alert('Le PIN doit contenir 4 à 8 chiffres.'); return; }
      if (prompt('Confirmez le code PIN :') !== p1) { alert('Les codes ne correspondent pas.'); return; }
      CFG.pinHash = await sha(p1); saveCfg(); renderSettings(); return;
    }
    if (t.closest('#st-pin-del')) { if (await askPin('Code PIN actuel :')) { CFG.pinHash = ''; saveCfg(); renderSettings(); } return; }
    if (t.closest('#st-upd')) {
      if (!confirm("Vider le cache et recharger l'application ? (vos données sont conservées)")) return;
      try { for (const k of await caches.keys()) await caches.delete(k); const rg = await navigator.serviceWorker.getRegistrations(); for (const r of rg) await r.unregister(); } catch (e) {}
      location.reload(); return;
    }
    if (t.closest('#st-all')) {
      if (!(await askPin('Code PIN pour tout effacer :'))) return;
      if (!confirm('Tout effacer ? Cette action est irréversible.')) return;
      for (const tb of db.tables) await tb.clear();
      await renderSettings(); loadReleves(); loadHistorique(); loadTravaux(); return;
    }
    const cl = t.closest('[data-clear]');
    if (cl) {
      const n = cl.dataset.clear;
      if (!(await askPin('Code PIN pour vider :'))) return;
      if (confirm(`Vider "${n}" ? Tsy azo averina izany.`)) { await db[n].clear(); await renderSettings(); loadReleves(); loadHistorique(); loadTravaux(); }
      return;
    }
    if (t.id === 'st-exp') window.exportBackup();
  });
  sm.addEventListener('input', (e) => {
    const t = e.target;
    if (window.CATnotif && (t.id === 'nt-qf' || t.id === 'nt-qt') && t.value) window.CATnotif.set(t.id === 'nt-qf' ? { qFrom: t.value } : { qTo: t.value });
    if (t.id === 'st-fz') { CFG.ficheZoom = +t.value; saveCfg(); const v = document.getElementById('st-fz-v'); if (v) v.textContent = t.value + 'x'; }
    if (t.id === 'st-seuil') { CFG.seuilGo = t.value; saveCfg(); }
    if (t.id === 'st-cap') { CFG.capCuve = t.value; saveCfg(); }
    if (t.id === 'st-dens') { CFG.densite = fNum(t.value) || 830; saveCfg(); }
    if (t.dataset && t.dataset.al) { const a = CFG.alerts[t.dataset.al] = CFG.alerts[t.dataset.al] || {}; const v = fNum(t.value); if (v == null) delete a[t.dataset.b]; else a[t.dataset.b] = v; saveCfg(); }
  });
  sm.addEventListener('change', async (e) => { if (e.target.id === 'st-imp') { const f = e.target.files[0]; if (f && await askPin('Code PIN pour importer :')) window.importBackup(f); else e.target.value = ''; } });

  ['cat-sync-state', 'online', 'offline'].forEach(ev => window.addEventListener(ev, () => { if (sm.classList.contains('open') && stTab === 'sync') renderSettings(); }));
  window.openSettingsModal = async function (tab) {
    stTab = (typeof tab === 'string' && tab) ? tab : 'menu'; await renderSettings(); sm.classList.add('open');
    sideMenu.classList.remove('open'); sideMenuOverlay.classList.remove('open');
  };

  // --- Liens externes (À propos : WhatsApp, Facebook, portfolio) : ouverture fiable (PWA, file:///, téléphone) ---
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[data-ext]');
    if (!a) return;
    e.preventDefault();
    const url = a.getAttribute('href');
    let w = null;
    try { w = window.open(url, '_blank', 'noopener'); } catch (x) {}
    if (!w) { try { location.href = url; } catch (x) {} }
  });

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
    localStorage.setItem('cat_last_backup_ts', Date.now());
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
      /* congés : dans la base (table conges) */
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
      b.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:3000;background:#0B1F4B;color:#fff;padding:12px 16px;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.35);display:flex;gap:12px;align-items:center;font-size:14px;font-weight:700;';
      b.innerHTML = '<span>Nouvelle version disponible</span><button style="background:#fff;color:#0B1F4B;border:none;border-radius:8px;padding:6px 12px;font-weight:800;cursor:pointer;">Mettre à jour</button>';
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
  function renderUpcoming() {
    const el = document.getElementById('leaveUpcoming'); if (!el) return;
    const t = localDateStr(), up = leaves.filter(l => l.end >= t).sort((x, y) => x.start.localeCompare(y.start));
    const fd = v => v.split('-').reverse().join('/');
    el.innerHTML = up.length ? up.map(l => `<div class="lv-row"><b>${escH(l.name)}</b><span>${fd(l.start)} → ${fd(l.end)}</span></div>`).join('') : '<p style="color:var(--text-muted);font-size:14px">Aucun congé prévu.</p>';
  }
  async function loadCal() {
    if (document.body.dataset.role === 'chef' && !localStorage.getItem('hffc_leaves_mig')) {   // migration unique des anciens congés (localStorage → base synchronisée)
      try { for (const l of JSON.parse(localStorage.getItem('hffc_leaves') || '[]')) await db.conges.add({ name: l.name, start: l.start, end: l.end }); } catch (e) {}
      localStorage.setItem('hffc_leaves_mig', '1');
    }
    leaves = await db.conges.toArray(); roster = await db.roster.toArray();
    renderCal(); renderUpcoming(); myShiftBanner();
  }
  function myShiftBanner() {
    const el = document.getElementById('myShift'); if (!el) return;
    let nom = ''; try { nom = (JSON.parse(localStorage.getItem('catProf') || '{}').nom || '').toLowerCase(); } catch (e) {}
    const mine = a => nom && (nom.includes(String(a).toLowerCase()) || String(a).toLowerCase().includes(nom));
    const lines = [], sig = [];
    for (let k = 0; k < 14; k++) {
      const d = new Date(); d.setDate(d.getDate() + k); const sc = getSched(d), iso = localDateStr(d);
      sc.slots.forEach(x => { if (mine(x.agent) || (x.membres || []).some(mine) || document.body.dataset.role === 'chef') sig.push(iso + x.poste.nom + x.agent); });
      if (k < 2) sc.slots.forEach(x => { if (mine(x.agent) || (x.membres || []).some(mine)) lines.push((k ? 'Demain' : "Aujourd'hui") + ' : <b>' + escH(x.poste.nom) + '</b> ' + x.poste.debut + '–' + x.poste.fin); });
    }
    const h = sig.join('|'), old = localStorage.getItem('catSchedSig'); let chg = '';
    if (old !== null && old !== h) chg = '<div style="background:#FFCC11;color:#000;padding:8px 10px;border-radius:8px;margin-bottom:8px;font-weight:700">Le planning a été modifié par le Chef.</div>';
    localStorage.setItem('catSchedSig', h);
    el.innerHTML = chg + (lines.length ? '<div class="cd-card" style="padding:10px;margin-bottom:10px"><b>Mon poste</b><br>' + lines.join('<br>') + '</div>' : '');
  }
  window.CATcalReload = loadCal;
  window.addEventListener('cat-synced', loadCal);
  loadCal();

  // PERSISTANCE : dernière page + brouillons des formulaires (iOS recharge l'app en arrière-plan)
  const draftIds = [...document.querySelectorAll('.page input[id], .page select[id], .page textarea[id]')]
    .filter(e => !['file', 'password', 'search', 'date', 'time'].includes(e.type) && !e.closest('#page-fiche') && !e.closest('#page-chef')).map(e => e.id);
  function saveDraft() {
    try { const d = {}; draftIds.forEach(id => { const e = document.getElementById(id); if (e && e.value !== '') d[id] = e.value; }); localStorage.setItem('catDraft', JSON.stringify(d)); } catch (e) {}
  }
  try {
    const d = JSON.parse(localStorage.getItem('catDraft') || '{}');
    Object.keys(d).forEach(id => { const e = document.getElementById(id); if (e && draftIds.includes(id)) { e.value = d[id]; e.dispatchEvent(new Event('input', { bubbles: true })); } });
  } catch (e) {}
  let dt = null; const later = () => { clearTimeout(dt); dt = setTimeout(saveDraft, 300); };
  document.addEventListener('input', later); document.addEventListener('change', later);
  document.addEventListener('click', e => { if (e.target.closest('button')) setTimeout(saveDraft, 600); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveDraft(); });
  window.addEventListener('pagehide', saveDraft);
  // Rechargement (actualiser) : on revient sur la meme page, au meme endroit.
  // 1re tentative au demarrage ; 2e a « cat-ready » (apres connexion : role connu, pages ajoutees par operations.js presentes).
  const saveScroll = () => { try { sessionStorage.setItem('catScroll', JSON.stringify({ p: localStorage.getItem('catPage'), y: window.scrollY })); } catch (e) {} };
  window.addEventListener('pagehide', saveScroll); window.addEventListener('beforeunload', saveScroll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveScroll(); });
  const restorePage = () => {
    const lp = localStorage.getItem('catPage');
    if (!lp || !document.getElementById(lp)) return false;
    if (lp === 'page-chef' && document.body.dataset.role !== 'chef') return false;
    restoring = true; try { showPage(lp); } finally { restoring = false; }
    try { const sc = JSON.parse(sessionStorage.getItem('catScroll') || 'null'); if (sc && sc.p === lp && sc.y > 0) setTimeout(() => window.scrollTo({ top: sc.y, behavior: 'instant' }), 400); } catch (e) {}
    return true;
  };
  if (!restorePage()) markNav('page-releve');
  window.addEventListener('cat-ready', () => { if (!navigated) restorePage(); });
});
