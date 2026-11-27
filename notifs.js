// CAT by Manda V4.20 - Notifications & sonnerie (messagerie, alertes, consignes)
// - Sonnerie synthetisee (aucun fichier audio), volume, choix du son, vibration, mode silencieux (plage horaire)
// - Banniere dans l'application + notification systeme (Android / ordinateur) quand l'application est en arriere-plan
// - Historique des 30 dernieres notifications (utile surtout aux agents, qui ne voient pas les consignes ailleurs)
// Limite : sans serveur « push », une notification systeme n'arrive que si l'application est ouverte ou encore en memoire.
(function () {
  'use strict';
  var KEY = 'catNotif', HKEY = 'catNotifHist';
  var DEF = { on: true, mail: true, alert: true, consigne: true, sound: true, volume: 2, chef: true, toneMail: 'son1', toneAlert: 'son1', toneConsigne: 'son1', vibrate: true, system: false, quiet: false, qFrom: '22:00', qTo: '06:00' };
  var LS = function (k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  var me = function () { return (window.CATme && window.CATme.id) || ''; };
  var myName = function () { return String((LS('catProf', {}) || {}).nom || '').trim(); };
  var isChef = function () { return document.body && document.body.dataset.role === 'chef'; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  var tr = function (s) { try { return window.CATi18n ? window.CATi18n.t(s) : s; } catch (e) { return s; } };
  var prefs = Object.assign({}, DEF, LS(KEY, {}));
  // V4.38 : une seule fois, tous les sons deviennent « son_1 » (on peut ensuite en rechoisir un autre dans Paramètres).
  if (!prefs.son1v) { prefs.toneMail = prefs.toneAlert = prefs.toneConsigne = 'son1'; prefs.son1v = 1; try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) {} }
  function get() { return prefs; }
  function set(patch) { prefs = Object.assign({}, prefs, patch); try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) {} }

  // ---------------- SONS ----------------
  var ctx = null;
  function audio() {
    try {
      if (!ctx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctx = new AC(); }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch (e) { return null; }
  }
  // Les navigateurs exigent un geste de l'utilisateur avant de jouer un son : on « debloque » au premier toucher.
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, function () { audio(); }, { passive: true, once: false }); });

  // [frequence Hz, debut s, duree s, type d'onde]
  var TONES = {
    son1: [],   // fichier son_1.m4a (voir SON ci-dessous)
    ding: [[988, 0, 0.35, 'sine']],
    double: [[880, 0, 0.2, 'sine'], [1175, 0.14, 0.22, 'sine']],
    cloche: [[1319, 0, 0.9, 'sine'], [1976, 0, 0.6, 'sine'], [2637, 0, 0.35, 'sine']],
    alarme: [[1000, 0, 0.16, 'square'], [1000, 0.26, 0.16, 'square'], [1000, 0.52, 0.16, 'square'], [1000, 0.78, 0.16, 'square']],
    sirene: [[600, 0, 0.3, 'sawtooth'], [900, 0.3, 0.3, 'sawtooth'], [600, 0.6, 0.3, 'sawtooth'], [900, 0.9, 0.3, 'sawtooth']]
  };
  var VOL = { 1: 0.08, 2: 0.2, 3: 0.45 };
  // son_1.m4a : decode une fois (Web Audio, debloque par le premier toucher), rejoue a chaque notification ; repli = « ding » si pas encore charge.
  var SON = { buf: null, busy: false, src: null };
  function loadSon() {
    if (SON.buf || SON.busy) return; var ac = audio(); if (!ac) return; SON.busy = true;
    fetch('son_1.m4a').then(function (r) { return r.arrayBuffer(); })
      .then(function (b) { return new Promise(function (ok, ko) { ac.decodeAudioData(b, ok, ko); }); })
      .then(function (buf) { SON.buf = buf; }).catch(function () {}).then(function () { SON.busy = false; });
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, loadSon, { passive: true }); });
  function playSon(ac) {
    var g = ac.createGain(), v = { 1: 0.3, 2: 0.7, 3: 1 }[prefs.volume] || 0.7;
    try { if (SON.src) SON.src.stop(); } catch (e) {}
    var s = ac.createBufferSource(); s.buffer = SON.buf; g.gain.value = v; s.connect(g); g.connect(ac.destination); s.start(); SON.src = s; return true;
  }
  function play(name, force) {
    var ac = audio(); if (!ac) return false;
    if (name === 'son1') { if (SON.buf) return playSon(ac); loadSon(); name = 'ding'; }
    var seq = TONES[name] || TONES.ding;
    var base = ac.currentTime + 0.02, vol = VOL[prefs.volume] || VOL[2];
    seq.forEach(function (n) {
      var o = ac.createOscillator(), g = ac.createGain(), t = base + n[1], d = n[2];
      o.type = n[3]; o.frequency.value = n[0]; o.connect(g); g.connect(ac.destination);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.start(t); o.stop(t + d + 0.03);
    });
    return true;
  }
  function vibrate(kind) { try { if (navigator.vibrate) navigator.vibrate(kind === 'alert' ? [250, 120, 250, 120, 250] : [180, 90, 180]); } catch (e) {} }

  function inQuiet() {
    if (!prefs.quiet) return false;
    var n = new Date(), m = n.getHours() * 60 + n.getMinutes();
    var p = function (s) { var a = String(s || '').split(':'); return (+a[0] || 0) * 60 + (+a[1] || 0); };
    var a = p(prefs.qFrom), b = p(prefs.qTo);
    return a === b ? false : (a < b ? (m >= a && m < b) : (m >= a || m < b));   // gere la plage qui passe minuit (22:00 - 06:00)
  }

  // ---------------- HISTORIQUE ----------------
  function hist() { return LS(HKEY + ':' + me(), []); }
  function histAdd(it) { var h = hist(); h.unshift(it); h = h.slice(0, 30); try { localStorage.setItem(HKEY + ':' + me(), JSON.stringify(h)); } catch (e) {} }
  function histClear() { try { localStorage.removeItem(HKEY + ':' + me()); } catch (e) {} }

  // ---------------- BANNIERE ----------------
  var q = [], showing = false;
  function banner(it) { q.push(it); if (!showing) next(); }
  function next() {
    var it = q.shift(); if (!it) { showing = false; return; }
    showing = true;
    var d = document.getElementById('ntBanner');
    if (!d) { d = document.createElement('div'); d.id = 'ntBanner'; document.body.appendChild(d); }
    d.className = 'nt-' + it.kind;
    d.innerHTML = '<b>' + esc(it.title) + '</b><span>' + esc(it.body) + '</span>';
    d.onclick = function () { d.classList.remove('on'); go(it.kind); };
    requestAnimationFrame(function () { d.classList.add('on'); });
    clearTimeout(d._t); d._t = setTimeout(function () { d.classList.remove('on'); setTimeout(next, 350); }, it.kind === 'alert' ? 7000 : 4500);
  }
  function go(kind) {
    try {
      if (kind === 'mail') { if (window.goToPage) window.goToPage('page-messages'); }
      else if (isChef() && window.goToPage) window.goToPage('page-chef');
      else if (window.openSettingsModal) window.openSettingsModal('notifications');
    } catch (e) {}
  }

  // ---------------- NOTIFICATION SYSTEME ----------------
  function sysSupported() { return 'Notification' in window; }
  function sysState() { return sysSupported() ? Notification.permission : 'unsupported'; }
  async function sysAsk() {
    if (!sysSupported()) return 'unsupported';
    try { var r = await Notification.requestPermission(); set({ system: r === 'granted' }); return r; } catch (e) { return 'denied'; }
  }
  async function sysShow(it) {
    try {
      if (!sysSupported() || Notification.permission !== 'granted') return;
      var opt = { body: it.body, tag: it.tag || it.kind, icon: './icon-192.png', badge: './icon-192.png', renotify: true, data: { kind: it.kind } };
      var reg = navigator.serviceWorker && (await navigator.serviceWorker.getRegistration());
      if (reg && reg.showNotification) await reg.showNotification(it.title, opt);   // obligatoire sur Android
      else new Notification(it.title, opt);
    } catch (e) {}
  }
  if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', function (e) { if (e.data && e.data.type === 'notif-click') go(e.data.kind); });

  // ---------------- API PRINCIPALE ----------------
  var TITLES = { mail: 'Nouveau message', alert: 'Alerte', consigne: 'Consigne du Chef', chef: 'Chef' };
  var TONEKEY = { mail: 'toneMail', alert: 'toneAlert', consigne: 'toneConsigne', chef: 'toneConsigne' };
  function notify(o) {
    if (!prefs.on || !prefs[o.kind]) return false;
    var it = { kind: o.kind, title: tr(o.title || TITLES[o.kind] || 'CAT'), body: String(o.body || '').slice(0, 160), tag: o.tag, ts: Date.now() };
    histAdd(it);
    // Les alertes (declenchement, valeurs hors limites) sonnent meme en mode silencieux.
    var quiet = inQuiet() && o.kind !== 'alert';
    banner(it);
    if (prefs.sound && !quiet) play(prefs[TONEKEY[o.kind]]);
    if (prefs.vibrate && !quiet) vibrate(o.kind);
    if (prefs.system && document.hidden) sysShow(it);
    try { window.dispatchEvent(new Event('cat-notif')); } catch (e) {}
    return true;
  }

  // ---------------- DETECTION : alertes (agents -> Chef) et consignes (Chef -> tous) ----------------
  // « since » = moment du premier lancement sur cet appareil : l'ancien contenu ne declenche jamais de notification.
  var sinceKey = function () { return 'catNotifSince:' + me(); };
  function since() { var u = me(); if (!u) return Date.now(); var s = +localStorage.getItem(sinceKey()); if (!s) { s = Date.now(); try { localStorage.setItem(sinceKey(), String(s)); } catch (e) {} } return s; }
  var seenKey = function (t) { return 'catNotifSeen:' + me() + ':' + t; };
  var sig = function (r) { return r.ts + '|' + String(r.texte || '').slice(0, 24); };
  var scanning = false;

  async function scan() {
    var db = window.CATdb; if (!db || !me() || scanning) return; scanning = true;
    try {
      var s0 = since(), mine = myName();
      var plan = [['alertes', 'alert', isChef()], ['consignes', 'consigne', true]];
      for (var i = 0; i < plan.length; i++) {
        var t = plan[i][0], kind = plan[i][1], concerned = plan[i][2];
        if (!db[t]) continue;
        var rows = await db[t].toArray(), seen = new Set(LS(seenKey(t), [])), fresh = [];
        rows.forEach(function (r) {
          var k = sig(r); if (seen.has(k)) return; seen.add(k);
          if (!concerned || !(r.ts > s0)) return;                       // ancien contenu ou rubrique non concernee : marque comme vu, sans notification
          if (mine && r.par && String(r.par).trim() === mine) return;   // ma propre saisie
          fresh.push(r);
        });
        try { localStorage.setItem(seenKey(t), JSON.stringify(Array.from(seen).slice(-400))); } catch (e) {}
        if (!fresh.length) continue;
        fresh.sort(function (a, b) { return a.ts - b.ts; });
        if (fresh.length > 3) {
          notify({ kind: kind, title: kind === 'alert' ? fresh.length + ' nouvelles alertes' : fresh.length + ' nouvelles consignes', body: String(fresh[fresh.length - 1].texte || ''), tag: kind + '-multi' });
        } else fresh.forEach(function (r) {
          notify({ kind: kind, title: kind === 'alert' ? 'Alerte' + (r.groupe ? ' ' + r.groupe : '') : 'Consigne' + (r.par ? ' de ' + r.par : ''), body: String(r.texte || ''), tag: kind + r.ts });
        });
      }
    } catch (e) { console.warn('notifs', e); }
    scanning = false;
  }
  window.addEventListener('cat-synced', function () { setTimeout(scan, 400); });
  setTimeout(scan, 3000);

  window.CATnotif = {
    get: get, set: set, notify: notify, play: play, vibrate: vibrate, since: since, inQuiet: inQuiet,
    history: hist, clearHistory: histClear, tones: Object.keys(TONES),
    sysState: sysState, sysAsk: sysAsk,
    test: function (kind) {
      var k = kind || 'mail';
      var samples = { mail: ['Nouveau message', 'Ceci est un essai de notification.'], alert: ['Alerte G1', 'Essai : tension hors limites.'], consigne: ['Consigne du Chef', 'Ceci est un essai de consigne.'] };
      var it = { kind: k, title: samples[k][0], body: samples[k][1], ts: Date.now() };
      banner(it); play(prefs[TONEKEY[k]]); if (prefs.vibrate) vibrate(k);
      if (prefs.system && sysState() === 'granted') sysShow(it);
    }
  };
})();
