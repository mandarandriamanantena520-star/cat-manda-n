document.addEventListener('DOMContentLoaded', function () {
  /* ============================================================
     HELPERS
  ============================================================ */
  function $(id) { return document.getElementById(id); }
  function on(id, ev, fn) { var el = $(id); if (el) el.addEventListener(ev, fn); }

  /* ============================================================
     I18N
  ============================================================ */
  var currentLang = 'fr';
  try { currentLang = localStorage.getItem('hffc_lang') || 'fr'; } catch (e) {}

  var I18N = {
    fr: {
      header_sub: 'Calendrier + CAT-System • Groupes Électrogènes',
      tab_cal: 'Calendrier',
      view_grid: 'Grille',
      view_list: 'Liste',
      prev: 'Précédent',
      today: "Aujourd'hui",
      next: 'Suivant',
      my_planning: 'Mon planning :',
      all_agents: 'Tous les agents',
      print: 'Imprimer',
      legend_day: 'Jour 7h - 17h',
      legend_night: 'Nuit 17h - 7h',
      legend_click: 'Cliquez sur un jour pour voir le détail',
      leave_title: 'Gérer un congé',
      leave_desc: 'Si 1 agent est en congé, les 3 autres tournent à 3.',
      leave_agent: 'Agent en congé',
      leave_start: 'Date de début',
      leave_end: 'Date de fin',
      add_leave: 'Ajouter le congé',
      stat_days: 'Jours ce mois',
      stat_shifts: 'Postes ce mois',
      stat_mine_day: 'Mes jours',
      stat_mine_night: 'Mes nuits',
      cat_releves: 'Relevés',
      cat_appoints: 'Appoints',
      cat_ops: 'Opérations',
      cat_ent: 'Entretiens',
      cat_tab_releve: 'Relevé',
      cat_tab_jauge: 'Jaugeage',
      cat_tab_appoint: 'Appoint',
      cat_tab_ops: 'Opérations',
      cat_tab_ent: 'Entretien',
      cat_tab_cahier: 'Cahier',
      releve_title: 'Relevé Paramètres — Fiche Officielle',
      releve_desc: "Température d'huile = G3 uniquement. Gasoil mm → Litres auto via barèmage C16.",
      group: 'Groupe',
      date: 'Date',
      hour_read: 'Heure de lecture',
      agent: 'Agent',
      obs: 'Observations',
      save_releve: 'Enregistrer le relevé',
      hist_releve: 'Historique Relevés',
      jauge_title: 'Conversion Jaugeage — C16 Mahanoro',
      jauge_desc: 'Saisis la hauteur en mm (50 à 229 mm). Valeurs exactes du certificat.',
      appoint_title: 'Appoint Gasoil + Cuve Tampon',
      state: 'État du groupe',
      save_appoint: "Enregistrer l'appoint",
      ops_title: 'Opérations — Remise / Couplage / Permutation',
      ops_desc: 'Remise : 2 heures obligatoires. Couplage / Permutation : heure exacte pour chaque action.',
      save_op: 'Enregistrer dans le cahier',
      ent_title: 'Travaux & Entretien',
      save_ent: "Enregistrer l'intervention",
      cahier_title: 'Cahier de Passation',
      footer: 'Henri Fraise Fils & Cie — Mahanoro • Calendrier + CAT - System',
      close: 'Fermer',
      nav_calendar: 'Calendrier',
      nav_prev: 'Préc.',
      nav_leaves: 'Congés',
      nav_next: 'Suiv.',
      day: 'Jour',
      night: 'Nuit',
      rotation3: 'Rotation à 3',
      rotation4: 'Rotation à 4',
      today_label: "AUJOURD'HUI",
      forbidden: 'CONGÉ INTERDIT',
      view_my_days: 'Voir mes jours de travail',
      work_title: 'Tous les jours de travail de',
      work_sub: 'Mois affiché + 60 prochains jours',
      no_work: 'Aucun service dans cette période.',
      delete: 'Supprimer',
      no_leave: 'Aucun congé enregistré.',
      next_services: 'Prochains services de',
      no_service_15: 'Aucun service dans les 15 prochains jours.',
      in_leave: 'EN CONGÉ',
      vacant: 'VACANT',
      months: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
      weekdays: ['LUN','MAR','MER','JEU','VEN','SAM','DIM'],
      weekday_long: ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi']
    },
    mg: {
      header_sub: 'Kalandrie + CAT-System • Groupe Électrogène',
      tab_cal: 'Kalandrie',
      view_grid: 'Takelaka',
      view_list: 'Lisitry',
      prev: 'Teo aloha',
      today: 'Anio',
      next: 'Manaraka',
      my_planning: 'Ny fandaharam-potoanako :',
      all_agents: 'Mpiara-miasa rehetra',
      print: 'Printy',
      legend_day: 'Antoandro 7h - 17h',
      legend_night: 'Alina 17h - 7h',
      legend_click: 'Tsindrio ny andro iray hahitana ny antsipiriany',
      leave_title: 'Tantano ny fialan-tsasatra',
      leave_desc: 'Raha misy 1 miala sasatra, ny 3 sisa no mihodina 3.',
      leave_agent: 'Iza no miala sasatra',
      leave_start: 'Daty fanombohana',
      leave_end: 'Daty farany',
      add_leave: 'Ampio ny fialan-tsasatra',
      stat_days: "Andro amin'ity volana ity",
      stat_shifts: "Asa amin'ity volana ity",
      stat_mine_day: 'Ny antoandroko',
      stat_mine_night: 'Ny alinako',
      cat_releves: 'Relevé',
      cat_appoints: 'Appoint',
      cat_ops: 'Asa',
      cat_ent: 'Fikojakojana',
      cat_tab_releve: 'Relevé',
      cat_tab_jauge: 'Jaugeage',
      cat_tab_appoint: 'Appoint',
      cat_tab_ops: 'Asa',
      cat_tab_ent: 'Fikojakojana',
      cat_tab_cahier: 'Kahie',
      releve_title: 'Relevé Paramètres — Taratasy Ofisialy',
      releve_desc: "Temperaturan'ny menaka = G3 ihany. Gasoil mm → Litres mandeha ho azy C16.",
      group: 'Groupe',
      date: 'Daty',
      hour_read: 'Ora famakiana',
      agent: 'Mpiasa',
      obs: 'Fanamarihana',
      save_releve: 'Tehirizo ny relevé',
      hist_releve: "Tantaran'ny Relevé",
      jauge_title: 'Fandikana Jaugeage — C16 Mahanoro',
      jauge_desc: "Ampidiro ny haavony mm (50 hatramin'ny 229 mm). Sanda marina avy amin'ny taratasy.",
      appoint_title: 'Appoint Gasoil + Cuve Tampon',
      state: 'Toetry ny groupe',
      save_appoint: 'Tehirizo ny appoint',
      ops_title: 'Asa — Remise / Couplage / Permutation',
      ops_desc: 'Remise : ora 2 tsy maintsy feno. Couplage / Permutation : ora marina isaky ny asa.',
      save_op: "Tehirizo ao amin'ny kahie",
      ent_title: 'Asa & Fikojakojana',
      save_ent: 'Tehirizo ny asa',
      cahier_title: 'Kahie Passation',
      footer: 'Henri Fraise Fils & Cie — Mahanoro • Kalandrie + CAT-System',
      close: 'Hidio',
      nav_calendar: 'Kalandrie',
      nav_prev: 'Teo aloha',
      nav_leaves: 'Fialan-tsasatra',
      nav_next: 'Manaraka',
      day: 'Antoandro',
      night: 'Alina',
      rotation3: 'Fihodinana 3',
      rotation4: 'Fihodinana 4',
      today_label: 'ANIO',
      forbidden: 'FIALAN-TSASATRA VOARARA',
      view_my_days: "Jereo ny andro iasako",
      work_title: "Ny andro iasan'i",
      work_sub: 'Volana aseho + 60 andro manaraka',
      no_work: "Tsy misy asa amin'ity fe-potoana ity.",
      delete: 'Fafao',
      no_leave: 'Tsy misy fialan-tsasatra voarakitra.',
      next_services: "Asa manaraka an'i",
      no_service_15: "Tsy misy asa ao anatin'ny 15 andro manaraka.",
      in_leave: 'MIALA SASATRA',
      vacant: 'TSY MISY',
      months: ['Janoary','Febroary','Martsa','Aprily','Mey','Jona','Jolay','Aogositra','Septambra','Oktobra','Novambra','Desambra'],
      weekdays: ['ALATS','TAL','LAR','ALAR','ZOM','ASAB','ALAH'],
      weekday_long: ['alahady','alatsinainy','talata','larobia','alakamisy','zoma','asabotsy']
    }
  };

  function t(k) {
    return (I18N[currentLang] && I18N[currentLang][k]) || I18N.fr[k] || k;
  }

  /* ============================================================
     LANGUAGE SWITCH
  ============================================================ */
  function setLang(lang) {
    currentLang = lang;
    try { localStorage.setItem('hffc_lang', lang); } catch (e) {}
    $('btnFR').classList.toggle('active', lang === 'fr');
    $('btnMG').classList.toggle('active', lang === 'mg');

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (I18N[lang][k]) el.innerHTML = I18N[lang][k];
    });

    var ms = $('monthSelect');
    if (ms) {
      var cur = ms.value;
      ms.innerHTML = '';
      I18N[lang].months.forEach(function (m, i) {
        var o = document.createElement('option');
        o.value = i;
        o.textContent = m;
        if (String(i) === String(cur)) o.selected = true;
        ms.appendChild(o);
      });
    }

    var wd = $('weekdaysRow');
    if (wd) wd.innerHTML = I18N[lang].weekdays.map(function (d) { return '<div>' + d + '</div>'; }).join('');

    renderCal();
    renderLeaveList();
  }

  /* ============================================================
     CALENDRIER DATA
  ============================================================ */
  var ALL = ['Eddy', 'Jimmy', 'Nandrianina', 'Michel'];
  var BASE3 = new Date(2026, 10, 14);
  var BASE4 = new Date(2026, 10, 24);
  var RET = new Date(2026, 10, 24);
  var viewYear = new Date().getFullYear();
  var viewMonth = new Date().getMonth();

  var BLOCKED = [
    { m: 5, d: 26, label: '26 Juin', mg: '26 Jona' },
    { m: 11, d: 25, label: '25 Décembre', mg: '25 Desambra' },
    { m: 11, d: 31, label: '31 Décembre', mg: '31 Desambra' },
    { m: 0, d: 1, label: '1er Janvier', mg: '1 Janoary' }
  ];

  function blockedLabel(b) { return currentLang === 'mg' ? b.mg : b.label; }
  function isBlocked(d) {
    return BLOCKED.find(function (b) { return b.m === d.getMonth() && b.d === d.getDate(); }) || null;
  }
  function findBlocked(s, e) {
    var cur = new Date(s + 'T00:00:00'), end = new Date(e + 'T00:00:00'), f = [];
    while (cur <= end) {
      var b = isBlocked(cur);
      if (b) f.push({ date: new Date(cur), label: blockedLabel(b) });
      cur.setDate(cur.getDate() + 1);
    }
    return f;
  }

  var leaves = [];
  try {
    var st = JSON.parse(localStorage.getItem('hffc_leaves') || 'null');
    if (st === null) {
      leaves = [{ name: 'Michel', start: '2026-11-14', end: '2026-11-23', note: 'Reprise 24 Nov' }];
      localStorage.setItem('hffc_leaves', JSON.stringify(leaves));
    } else leaves = st;
  } catch (e) { leaves = []; }

  function diff(a, b) {
    return Math.floor((new Date(a.getFullYear(), a.getMonth(), a.getDate()) - new Date(b.getFullYear(), b.getMonth(), b.getDate())) / 86400000);
  }
  function onLeave(n, d) {
    return leaves.some(function (l) {
      return l.name === n && d >= new Date(l.start + 'T00:00:00') && d <= new Date(l.end + 'T00:00:00');
    });
  }
  function fmtLong(d) {
    return I18N[currentLang].weekday_long[d.getDay()] + ' ' + d.getDate() + ' ' +
      I18N[currentLang].months[d.getMonth()] + ' ' + d.getFullYear();
  }

  /* ============================================================
     SCHEDULE ENGINE
  ============================================================ */
  function getSched(date) {
    var d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    var abs = ALL.filter(function (a) { return onLeave(a, d); });

    if (d < RET) {
      var o = ['Eddy', 'Jimmy', 'Nandrianina'];
      var i = ((diff(d, BASE3) % 3) + 3) % 3;
      return { jour: o[i], nuit: o[(i + 2) % 3], mode: '3', is3: true, abs: abs };
    }
    if (abs.length === 0) {
      var o2 = ['Michel', 'Nandrianina', 'Eddy', 'Jimmy'];
      var i2 = ((diff(d, BASE4) % 4) + 4) % 4;
      return { jour: o2[i2], nuit: o2[(i2 + 2) % 4], mode: '4', is3: false, abs: abs };
    }
    if (abs.length === 1) {
      var full = ['Eddy', 'Jimmy', 'Nandrianina', 'Michel'];
      var o3 = full.filter(function (a) { return abs.indexOf(a) === -1; });
      var i3 = ((diff(d, BASE4) % 3) + 3) % 3;
      return { jour: o3[i3], nuit: o3[(i3 + 2) % 3], mode: '3', is3: true, abs: abs };
    }
    var o4 = ['Michel', 'Nandrianina', 'Eddy', 'Jimmy'];
    var i4 = ((diff(d, BASE4) % 4) + 4) % 4;
    return {
      jour: o4[i4], nuit: o4[(i4 + 2) % 4], mode: 'vacant', is3: false, abs: abs,
      jV: abs.indexOf(o4[i4]) !== -1,
      nV: abs.indexOf(o4[(i4 + 2) % 4]) !== -1
    };
  }

  /* ============================================================
     UI NAVIGATION
  ============================================================ */
  function showMain(n) {
    $('main-cal').classList.toggle('hidden', n !== 'cal');
    $('main-cat').classList.toggle('hidden', n !== 'cat');
    $('mainBtn-cal').classList.toggle('active', n === 'cal');
    $('mainBtn-cat').classList.toggle('active', n === 'cat');
    $('nav-cal').classList.toggle('active', n === 'cal');
    $('nav-cat').classList.toggle('active', n === 'cat');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showCat(n) {
    ['releve', 'jauge', 'appoint', 'ops', 'ent', 'cahier'].forEach(function (x) {
      $('cat-' + x).classList.toggle('hidden', x !== n);
      $('catBtn-' + x).classList.toggle('active', x === n);
    });
  }

  /* ============================================================
     MODAL JOUR
  ============================================================ */
  function openModal(ds) {
    var d = new Date(ds + 'T00:00:00');
    var s = getSched(d);
    var b = isBlocked(d);
    $('modalTitle').textContent = fmtLong(d);
    $('modalSubtitle').textContent = (s.is3 ? t('rotation3') : t('rotation4')) + ' • Mahanoro' +
      (b ? ' • ' + t('forbidden') + ' (' + blockedLabel(b) + ')' : '');

    var dl = currentLang === 'mg' ? 'Antoandro 7h-17h' : 'Jour 7h-17h';
    var nl = currentLang === 'mg' ? 'Alina 17h-7h' : 'Nuit 17h-7h';
    var html = '';
    html += '<div class="agent-row"><div><b>' + s.jour + '</b><small>' + dl + '</small></div>' +
      '<button type="button" class="btn btn-yellow btn-small" data-agent="' + s.jour + '">' + t('view_my_days') + '</button></div>';
    html += '<div class="agent-row"><div><b>' + s.nuit + '</b><small>' + nl + '</small></div>' +
      '<button type="button" class="btn btn-black btn-small" data-agent="' + s.nuit + '">' + t('view_my_days') + '</button></div>';
    $('modalAgents').innerHTML = html;
    $('modalAgents').querySelectorAll('[data-agent]').forEach(function (btn) {
      btn.addEventListener('click', function () { showWork(btn.getAttribute('data-agent')); });
    });
    $('modalWorkList').innerHTML = '';
    $('dayModal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    $('dayModal').classList.remove('open');
    document.body.style.overflow = '';
  }

  function showWork(agent) {
    var s1 = new Date(viewYear, viewMonth, 1), e1 = new Date(viewYear, viewMonth + 1, 0), dates = [], cur = new Date(s1);
    while (cur <= e1) {
      var s = getSched(cur);
      if (s.jour === agent || s.nuit === agent) dates.push({ date: new Date(cur), type: s.jour === agent ? 'jour' : 'nuit' });
      cur.setDate(cur.getDate() + 1);
    }
    var html = '<div class="work-list"><h4>' + t('work_title') + ' ' + agent + ' — ' + dates.length + '</h4>' +
      '<p style="font-size:12px;color:#666">' + t('work_sub') + '</p>';
    if (!dates.length) html += '<div>' + t('no_work') + '</div>';
    else html += dates.map(function (x) {
      return '<div class="work-item"><span>' + fmtLong(x.date) + '</span><span>' +
        (x.type === 'jour' ? 'JOUR 7h-17h' : 'NUIT 17h-7h') + '</span></div>';
    }).join('');
    html += '</div><button type="button" class="btn btn-yellow btn-full" id="btnFilterAgent" style="margin-top:10px">Filtrer sur ' + agent + '</button>';
    $('modalWorkList').innerHTML = html;
    var fb = $('btnFilterAgent');
    if (fb) fb.addEventListener('click', function () {
      $('meSelect').value = agent; closeModal(); renderCal();
    });
  }

  /* ============================================================
     MODAL CONGÉ
  ============================================================ */
  function openLeaveModal() {
    $('leaveModal').classList.add('open');
    document.body.style.overflow = 'hidden';
    renderLeaveList();
  }
  function closeLeaveModal() {
    $('leaveModal').classList.remove('open');
    document.body.style.overflow = '';
  }

  function renderLeaveList() {
    var el = $('leaveList');
    if (!el) return;
    var count = $('leaveCount');
    if (count) count.textContent = leaves.length;

    if (!leaves.length) {
      el.innerHTML = '<p style="color:#888;font-size:13px;padding:10px 0">' + t('no_leave') + '</p>';
      return;
    }
    el.innerHTML = leaves.map(function (l, i) {
      return '<div class="list-item" style="display:flex;justify-content:space-between;align-items:center;gap:10px">' +
        '<span><b>' + l.name + '</b><br><small>' + l.start + ' → ' + l.end + '</small></span>' +
        '<button type="button" class="del" data-del="' + i + '">' + t('delete') + '</button></div>';
    }).join('');
    el.querySelectorAll('[data-del]').forEach(function (b) {
      b.addEventListener('click', function () {
        var idx = parseInt(b.getAttribute('data-del'), 10);
        leaves.splice(idx, 1);
        try { localStorage.setItem('hffc_leaves', JSON.stringify(leaves)); } catch (e) {}
        renderCal();
        renderLeaveList();
      });
    });
  }

  function addLeave() {
    var n = $('leaveName').value, s = $('leaveStart').value, e = $('leaveEnd').value;
    if (!s || !e) { showErr('Choisis dates'); return; }
    if (e < s) { showErr('Fin après début'); return; }
    var bf = findBlocked(s, e);
    if (bf.length) {
      var lab = bf.map(function (x) { return x.date.toLocaleDateString('fr-FR') + ' (' + x.label + ')'; }).join(', ');
      showErr('REFUSÉ : ' + lab);
      alert('REFUSÉ\n' + lab);
      return;
    }
    leaves.push({ name: n, start: s, end: e });
    try { localStorage.setItem('hffc_leaves', JSON.stringify(leaves)); } catch (err) {}
    renderCal();
    renderLeaveList();
    alert(n + ' : Congé ajouté.');
  }

  function showErr(m) {
    var el = $('errorMsg');
    if (!el) return;
    el.textContent = m; el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 5000);
  }

  function changeMonth(d) {
    var m = viewMonth + d, y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    $('yearSelect').value = y;
    $('monthSelect').value = m;
    renderCal();
  }
  function goToday() {
    var n = new Date();
    $('yearSelect').value = n.getFullYear();
    $('monthSelect').value = n.getMonth();
    renderCal();
  }

  /* ============================================================
     VIEW / BADGE
  ============================================================ */
  function setView(m) {
    document.body.classList.toggle('list-mode', m === 'list');
    $('btnGrid').classList.toggle('active', m === 'grid');
    $('btnList').classList.toggle('active', m === 'list');
  }

  function updateBadge() {
    var badges = document.querySelectorAll('.nav-badge');
    badges.forEach(function (b) {
      if (leaves.length > 0) { b.textContent = leaves.length; b.classList.add('show'); }
      else b.classList.remove('show');
    });
  }

  /* ============================================================
     RENDER CALENDAR
  ============================================================ */
  function renderCal() {
    if (!$('yearSelect') || !$('monthSelect')) return;
    viewYear = parseInt($('yearSelect').value, 10);
    viewMonth = parseInt($('monthSelect').value, 10);
    var me = $('meSelect').value;
    var first = new Date(viewYear, viewMonth, 1), last = new Date(viewYear, viewMonth + 1, 0),
      off = (first.getDay() + 6) % 7;

    $('titleMonth').textContent = I18N[currentLang].months[viewMonth] + ' ' + viewYear;
    $('titleInfo').textContent = last.getDate() + ' jours • Mahanoro';

    var cal = $('calendar'); cal.innerHTML = '';
    var lv = $('listView'); lv.innerHTML = '';

    var today = new Date(), total = 0;

    for (var i = 0; i < 42; i++) {
      var d = new Date(viewYear, viewMonth, 1 - off + i),
        isO = d.getMonth() !== viewMonth,
        s = getSched(d), blk = isBlocked(d);

      if (!isO) total += 2;

      var dl = currentLang === 'mg' ? 'Antoandro' : 'Jour',
        nl = currentLang === 'mg' ? 'Alina' : 'Nuit';

      var div = document.createElement('div');
      div.className = 'day' + (isO ? ' other' : '') + (d.toDateString() === today.toDateString() ? ' today' : '');
      var iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

      div.innerHTML =
        '<div class="day-num"><span>' + d.getDate() + '</span>' +
        (d.toDateString() === today.toDateString()
          ? '<span style="font-size:10px;background:#111;color:#fff;padding:2px 6px;border-radius:10px">' + t('today_label') + '</span>'
          : '') + '</div>' +
        '<div class="shift jour"><b>' + s.jour + '</b> — ' + dl + ' 7h-17h</div>' +
        '<div class="shift nuit"><b>' + s.nuit + '</b> — ' + nl + ' 17h-7h</div>' +
        (blk ? '<div style="font-size:10px;background:#D92D20;color:#fff;padding:2px 5px;border-radius:8px;display:inline-block">' + t('forbidden') + '</div>' : '');

      (function (c) { div.addEventListener('click', function () { openModal(c); }); })(iso);
      cal.appendChild(div);

      if (!isO) {
        var li = document.createElement('div');
        li.className = 'list-item';
        (function (c) { li.addEventListener('click', function () { openModal(c); }); })(iso);
        li.innerHTML = '<strong>' + fmtLong(d) + '</strong><small>' + dl + ' : ' + s.jour + '</small><small>' + nl + ' : ' + s.nuit + '</small>';
        lv.appendChild(li);
      }
      if (i > 35 && d.getMonth() !== viewMonth && d.getDate() > 7) break;
    }

    updateBadge();
  }

  /* ============================================================
     CAT SYSTEM — DATA & BAREME
  ============================================================ */
  var BAREME = {
    5: [192.17, 198.06, 201.94, 205.82, 209.70, 213.59, 217.47, 221.35, 225.24, 229.12],
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
    21: [815.53, 819.42, 823.3, 827.18, 831.07, 834.95, 838.83, 842.72, 846.6, 850.49],
    22: [854.37, 858.25, 862.14, 866.02, 869.9, 873.79, 877.67, 881.55, 885.44, 889.32]
  };

  function mmToL(mm) {
    mm = parseInt(mm, 10);
    if (isNaN(mm)) return null;
    if (mm < 50 || mm > 229) return { error: true, msg: 'Hors tableau 50-229 mm' };
    var d = Math.floor(mm / 10), u = mm % 10;
    return { litres: BAREME[d][u], d: d, u: u };
  }
  function fmtN(n) {
    return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  var DB = { releves: [], appoints: [], ops: [], ents: [] };
  try { DB = JSON.parse(localStorage.getItem('catsystem_db') || '{"releves":[],"appoints":[],"ops":[],"ents":[]}'); } catch (e) {}

  function persist() {
    try { localStorage.setItem('catsystem_db', JSON.stringify(DB)); } catch (e) {}
    renderCat();
  }

  function onGroupe() {
    var g = $('rGroupe').value;
    $('wrapTempHuile').style.display = (g === 'G3' ? 'block' : 'none');
    if (g !== 'G3') $('rTempHuile').value = '';
  }
  function onReleveMm() {
    var mm = $('rGasMm').value;
    var r = mmToL(mm);
    if (!mm) { $('rGasL').value = ''; $('releveResult').textContent = '215 mm = 834,95 L'; return; }
    if (r && r.error) { $('rGasL').value = 'Hors tableau'; $('releveResult').textContent = r.msg; }
    else {
      $('rGasL').value = fmtN(r.litres) + ' L';
      $('releveResult').textContent = mm + ' mm = ' + fmtN(r.litres) + ' Litres (Ligne ' + r.d + ' + Col ' + r.u + ')';
    }
  }
  function doJauge() {
    var mm = $('jMm').value;
    var r = mmToL(mm);
    if (!mm) { $('jLitres').value = ''; return; }
    if (r && r.error) { $('jLitres').value = 'Hors tableau'; $('jaugeResult').textContent = r.msg; }
    else {
      $('jLitres').value = fmtN(r.litres) + ' L';
      $('jaugeResult').textContent = mm + ' mm → ' + fmtN(r.litres) + ' Litres';
    }
  }
  function onAppoint() {
    var av = $('aMmAvant').value, ap = $('aMmApres').value;
    var r1 = av ? mmToL(av) : null, r2 = ap ? mmToL(ap) : null;
    $('aLAvant').value = r1 && !r1.error ? fmtN(r1.litres) + ' L' : (av ? 'Hors tableau' : '');
    $('aLApres').value = r2 && !r2.error ? fmtN(r2.litres) + ' L' : (ap ? 'Hors tableau' : '');
    var txt = '';
    if (r1 && !r1.error) txt += 'Avant : ' + av + ' mm = ' + fmtN(r1.litres) + ' L<br>';
    if (r2 && !r2.error) txt += 'Après : ' + ap + ' mm = ' + fmtN(r2.litres) + ' L<br>';
    if (r1 && !r1.error && r2 && !r2.error) txt += 'Différence : ' + fmtN(r2.litres - r1.litres) + ' L';
    if (txt) $('appointResult').innerHTML = txt;
  }
  function onOpType() {
    var tt = $('oType').value;
    $('opsRemise').classList.toggle('hidden', tt !== 'Remise');
    $('opsCouplage').classList.toggle('hidden', tt !== 'Couplage');
    $('opsPermut').classList.toggle('hidden', tt !== 'Permutation');
    $('wrapGroupeSortant').style.display = (tt === 'Remise' ? 'none' : 'block');
  }
  function onEntType() {
    $('wrapAutres').classList.toggle('hidden', $('eType').value !== 'Autres');
  }

  function saveReleve() {
    var g = $('rGroupe').value, d = $('rDate').value, h = $('rHeure').value;
    if (!d) { alert('Choisis la date'); return; }
    var mm = $('rGasMm').value;
    var c = mm ? mmToL(mm) : null;
    var o = {
      id: Date.now(), groupe: g, date: d, heure: h, agent: $('rAgent').value,
      puiss: $('rPuiss').value, tension: $('rTension').value, freq: $('rFreq').value,
      gasMm: mm, gasL: c && !c.error ? c.litres : '', ct: $('rCT').value,
      obs: $('rObs').value, tempHuile: $('rTempHuile').value
    };
    DB.releves.unshift(o); persist(); alert('Relevé ' + g + ' enregistré.');
  }
  function saveAppoint() {
    var g = $('aGroupe').value, d = $('aDate').value;
    if (!d) { alert('Choisis la date'); return; }
    var av = $('aMmAvant').value, ap = $('aMmApres').value;
    var c1 = av ? mmToL(av) : null, c2 = ap ? mmToL(ap) : null;
    var o = {
      id: Date.now(), groupe: g, date: d, etat: $('aEtat').value,
      heureAvant: $('aHeureAvant').value, mmAvant: av, lAvant: c1 && !c1.error ? c1.litres : '',
      heureDebut: $('aHeureDebut').value, heureFin: $('aHeureFin').value,
      qte: $('aQte').value, mmApres: ap, lApres: c2 && !c2.error ? c2.litres : '',
      ctAvant: $('aCTAvant').value, ctApres: $('aCTApres').value, obs: $('aObs').value
    };
    DB.appoints.unshift(o); persist(); alert('Appoint ' + g + ' enregistré.');
  }
  function saveOp() {
    var type = $('oType').value, d = $('oDate').value, g = $('oGroupe').value;
    if (!d) { alert('Choisis la date'); return; }
    var actions = '', heure = '';
    if (type === 'Remise') {
      var h1 = $('oRem1').value, h2 = $('oRem2').value;
      if (!h1 || !h2) { alert('REMISE : les 2 heures sont obligatoires : Démarrage + Disjoncteur.'); return; }
      actions = '1. Démarrage à ' + h1 + ' | 2. Enclenchement disjoncteur à ' + h2; heure = h1;
    } else if (type === 'Couplage') {
      var c1 = $('oCoup1').value, c2 = $('oCoup2').value;
      if (!c1 || !c2) { alert('Couplage : 2 heures obligatoires'); return; }
      actions = 'Démarrage à ' + c1 + ' + Couplage à ' + c2; heure = c1;
    } else {
      var p1 = $('oPerm1').value, p2 = $('oPerm2').value, p3 = $('oPerm3').value, p4 = $('oPerm4').value;
      if (!p1 || !p2 || !p3 || !p4) { alert('Permutation : 4 heures obligatoires'); return; }
      actions = '1. Démarrage ' + p1 + ' | 2. Couplage ' + p2 + ' | 3. Découplage ' + p3 + ' | 4. Arrêt ' + p4; heure = p1;
    }
    var o = {
      id: Date.now(), sousType: type, groupe: g, groupe2: $('oGroupe2').value,
      date: d, heure: heure, actions: actions, obs: $('oObs').value
    };
    DB.ops.unshift(o); persist(); alert(type + ' enregistré.');
  }
  function saveEnt() {
    var ty = $('eType').value;
    if (ty === 'Autres') {
      ty = 'Autres : ' + ($('eAutres').value || '');
      if (!$('eAutres').value) { alert('Précise le travail'); return; }
    }
    var d = $('eDate').value, h = $('eHeure').value;
    if (!d || !h) { alert('Date et heure obligatoires'); return; }
    DB.ents.unshift({
      id: Date.now(), sousType: ty, groupe: $('eGroupe').value,
      date: d, heure: h, obs: $('eObs').value
    });
    persist(); alert(ty + ' enregistré.');
  }

  function renderCat() {
    $('sReleve').textContent = DB.releves.length;
    $('sAppoint').textContent = DB.appoints.length;
    $('sOps').textContent = DB.ops.length;
    $('sEnt').textContent = DB.ents.length;

    var fg = $('fReleveGroupe').value, fd = $('fReleveDate').value;
    var rel = DB.releves.filter(function (r) { return (!fg || r.groupe === fg) && (!fd || r.date === fd); });
    $('listReleve').innerHTML = rel.length ? rel.map(function (r) {
      return '<div class="list-item"><strong>' + r.groupe + ' — ' + r.date + ' à ' + r.heure + '</strong>' +
        '<small>Puiss ' + (r.puiss || '-') + ' • Tension ' + (r.tension || '-') + ' • Freq ' + (r.freq || '-') +
        ' • Gasoil ' + (r.gasMm || '-') + ' mm = ' + (r.gasL ? fmtN(r.gasL) + ' L' : '-') +
        ' • CT ' + (r.ct || '-') + ' cm • Obs ' + (r.obs || '-') + '</small>' +
        '<button type="button" class="del" data-del="releves:' + r.id + '">Supprimer</button></div>';
    }).join('') : '<p style="color:#888">Aucun relevé.</p>';

    $('listAppoint').innerHTML = DB.appoints.length ? DB.appoints.map(function (a) {
      return '<div class="list-item"><strong>' + a.groupe + ' — ' + a.date + '</strong>' +
        '<small>Avant ' + a.mmAvant + ' mm = ' + (a.lAvant ? fmtN(a.lAvant) + ' L' : '-') +
        ' → Après ' + a.mmApres + ' mm = ' + (a.lApres ? fmtN(a.lApres) + ' L' : '-') +
        ' • CT ' + a.ctAvant + ' → ' + a.ctApres + ' cm</small>' +
        '<button type="button" class="del" data-del="appoints:' + a.id + '">Supprimer</button></div>';
    }).join('') : '<p style="color:#888">Aucun appoint.</p>';

    $('listOps').innerHTML = DB.ops.length ? DB.ops.map(function (o) {
      return '<div class="list-item"><strong>' + o.sousType + ' — ' + o.groupe + ' — ' + o.date + ' à ' + o.heure + '</strong>' +
        '<small>' + o.actions + ' • Obs ' + (o.obs || '-') + '</small>' +
        '<button type="button" class="del" data-del="ops:' + o.id + '">Supprimer</button></div>';
    }).join('') : '<p style="color:#888">Aucune opération.</p>';

    $('listEnt').innerHTML = DB.ents.length ? DB.ents.map(function (e) {
      return '<div class="list-item"><strong>' + e.sousType + ' — ' + e.groupe + ' — ' + e.date + ' à ' + e.heure + '</strong>' +
        '<small>' + (e.obs || '-') + '</small>' +
        '<button type="button" class="del" data-del="ents:' + e.id + '">Supprimer</button></div>';
    }).join('') : '<p style="color:#888">Aucune intervention.</p>';

    document.querySelectorAll('[data-del]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = b.getAttribute('data-del').split(':');
        var k = p[0], id = parseInt(p[1], 10);
        if (!confirm('Supprimer ?')) return;
        DB[k] = DB[k].filter(function (x) { return x.id !== id; });
        persist();
      });
    });

    var all = [];
    DB.releves.forEach(function (r) { all.push({ date: r.date, heure: r.heure, type: 'Relevé', groupe: r.groupe, txt: 'Relevé ' + r.groupe + ' Gasoil ' + (r.gasMm || '-') + ' mm' }); });
    DB.appoints.forEach(function (a) { all.push({ date: a.date, heure: a.heureDebut || '00:00', type: 'Appoint', groupe: a.groupe, txt: 'Appoint ' + a.groupe + ' ' + a.mmAvant + ' → ' + a.mmApres + ' mm' }); });
    DB.ops.forEach(function (o) { all.push({ date: o.date, heure: o.heure, type: 'Opération', groupe: o.groupe, txt: o.sousType + ' ' + o.actions }); });
    DB.ents.forEach(function (e) { all.push({ date: e.date, heure: e.heure, type: 'Entretien', groupe: e.groupe, txt: e.sousType }); });

    var fcD = $('fCahierDate').value, fcG = $('fCahierGroupe').value, fcT = $('fCahierType').value;
    all = all.filter(function (x) {
      return (!fcD || x.date === fcD) && (!fcG || x.groupe === fcG) && (!fcT || x.type === fcT);
    });
    all.sort(function (a, b) { return (b.date + b.heure).localeCompare(a.date + a.heure); });
    $('listCahier').innerHTML = all.length ? all.map(function (x) {
      return '<div class="list-item"><strong>' + x.date + ' à ' + x.heure + ' — ' + x.type + ' — ' + x.groupe + '</strong><small>' + x.txt + '</small></div>';
    }).join('') : '<p style="color:#888">Cahier vide.</p>';
  }

  function exportCSV() {
    var rows = [['Date', 'Heure', 'Type', 'Groupe', 'Détail']];
    DB.releves.forEach(function (r) { rows.push([r.date, r.heure, 'Relevé', r.groupe, 'Gasoil ' + r.gasMm]); });
    DB.appoints.forEach(function (a) { rows.push([a.date, a.heureDebut, 'Appoint', a.groupe, a.mmAvant + '->' + a.mmApres]); });
    DB.ops.forEach(function (o) { rows.push([o.date, o.heure, 'Opération', o.groupe, o.actions]); });
    DB.ents.forEach(function (e) { rows.push([e.date, e.heure, 'Entretien', e.groupe, e.sousType]); });
    var csv = rows.map(function (r) {
      return r.map(function (c) { return '"' + String(c || '').replace(/"/g, '""') + '"'; }).join(';');
    }).join('\n');
    var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'CAT-System.csv';
    a.click();
  }

  /* ============================================================
     BINDINGS
  ============================================================ */
  on('btnFR', 'click', function () { setLang('fr'); });
  on('btnMG', 'click', function () { setLang('mg'); });

  on('mainBtn-cal', 'click', function () { showMain('cal'); });
  on('mainBtn-cat', 'click', function () { showMain('cat'); });
  on('nav-cal', 'click', function () { showMain('cal'); });
  on('nav-cat', 'click', function () { showMain('cat'); });

  on('navPrevBtn', 'click', function () { showMain('cal'); changeMonth(-1); });
  on('navNextBtn', 'click', function () { showMain('cal'); changeMonth(1); });

  // Bouton Congés (header + bottom-nav)
  on('btnOpenLeaves', 'click', openLeaveModal);
  on('navLeavesBtn', 'click', openLeaveModal);

  // Modal Congés
  on('btnCloseLeaveModal', 'click', closeLeaveModal);
  on('btnCloseLeaveModal2', 'click', closeLeaveModal);
  on('btnAddLeave', 'click', addLeave);

  $('leaveModal').addEventListener('click', function (e) {
    if (e.target === $('leaveModal')) closeLeaveModal();
  });

  // Modal Jour
  on('btnCloseModal', 'click', closeModal);
  on('btnCloseModal2', 'click', closeModal);
  $('dayModal').addEventListener('click', function (e) { if (e.target === $('dayModal')) closeModal(); });

  // ESC key: manidy izay modal misokatra
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeModal();
      closeLeaveModal();
    }
  });

  on('btnGrid', 'click', function () { setView('grid'); });
  on('btnList', 'click', function () { setView('list'); });
  on('btnCalPrev', 'click', function () { changeMonth(-1); });
  on('btnCalNext', 'click', function () { changeMonth(1); });
  on('btnCalToday', 'click', goToday);
  on('btnPrintCal', 'click', function () { window.print(); });

  on('yearSelect', 'change', renderCal);
  on('monthSelect', 'change', renderCal);
  on('meSelect', 'change', renderCal);

  ['releve', 'jauge', 'appoint', 'ops', 'ent', 'cahier'].forEach(function (n) {
    on('catBtn-' + n, 'click', function () { showCat(n); });
  });

  on('rGroupe', 'change', onGroupe);
  on('rGasMm', 'input', onReleveMm);
  on('jMm', 'input', doJauge);
  on('btnJauge215', 'click', function () { $('jMm').value = 215; doJauge(); });
  on('btnJauge100', 'click', function () { $('jMm').value = 100; doJauge(); });
  on('aMmAvant', 'input', onAppoint);
  on('aMmApres', 'input', onAppoint);
  on('oType', 'change', onOpType);
  on('eType', 'change', onEntType);

  on('btnSaveReleve', 'click', saveReleve);
  on('btnSaveAppoint', 'click', saveAppoint);
  on('btnSaveOp', 'click', saveOp);
  on('btnSaveEnt', 'click', saveEnt);

  on('fReleveGroupe', 'change', renderCat);
  on('fReleveDate', 'change', renderCat);
  on('fCahierDate', 'change', renderCat);
  on('fCahierGroupe', 'change', renderCat);
  on('fCahierType', 'change', renderCat);
  on('btnPrintCahier', 'click', function () { window.print(); });
  on('btnExportCSV', 'click', exportCSV);
  on('btnClearCat', 'click', function () {
    if (!confirm('Tout effacer ?')) return;
    DB = { releves: [], appoints: [], ops: [], ents: [] };
    persist();
  });

  /* ============================================================
     INIT
  ============================================================ */
  var ys = $('yearSelect');
  ys.innerHTML = '';
  for (var y = 2026; y <= 2030; y++) {
    var o = document.createElement('option');
    o.value = y; o.textContent = y;
    if (y === new Date().getFullYear()) o.selected = true;
    ys.appendChild(o);
  }

  var todayIso = new Date().toISOString().slice(0, 10);
  ['rDate', 'aDate', 'oDate', 'eDate'].forEach(function (id) { $(id).value = todayIso; });
  $('leaveStart').value = todayIso;
  $('leaveEnd').value = todayIso;

  var ctHtml = '';
  for (var v = 400; v <= 2400; v += 100) ctHtml += '<option value="' + v + '">' + v + ' cm</option>';
  $('rCT').innerHTML = ctHtml;
  $('aCTAvant').innerHTML = ctHtml;
  $('aCTApres').innerHTML = ctHtml;

  var saved = currentLang;
  currentLang = 'fr';
  setLang(saved);

  onGroupe();
  onOpType();
  onEntType();
  renderCal();
  renderCat();
  renderLeaveList();
  if (window.innerWidth <= 640) setView('list');

  console.log('✅ CAT-System OK — v3 (Congés en modal séparé)');
});