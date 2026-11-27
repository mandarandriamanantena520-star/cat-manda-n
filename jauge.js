// CAT by Manda V4.46 - Jaugeage Gasoil : conversion Litres <-> cm (barème C15 / certificat du 01-02-2021).
// Option independante : page « page-jauge » (menu). Utilise window.catBaremeC16 (app.js) = source unique des valeurs.
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var t = function (s) { return (window.CATi18n && window.CATi18n.t) ? window.CATi18n.t(s) : s; };
  var MIN = 50, MAX = 222, pts = null;

  function build() {
    var B = window.catBaremeC16; if (!B) return false;
    pts = [];
    for (var h = MIN; h <= MAX; h++) { var r = B[Math.floor(h / 10)]; pts[h] = r ? r[h % 10] : undefined; }
    return pts[MIN] != null && pts[MAX] != null;
  }
  function cmToL(h) {            // interpolation lineaire entre deux graduations entieres
    if (!isFinite(h) || h < MIN || h > MAX) return null;
    var a = Math.floor(h), f = h - a;
    return f === 0 ? pts[a] : pts[a] + (pts[a + 1] - pts[a]) * f;
  }
  function lToCm(L) {
    if (!isFinite(L) || L < pts[MIN] || L > pts[MAX]) return null;
    var lo = MIN, hi = MAX;      // dichotomie : pts[] est croissant
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (pts[m] <= L) lo = m; else hi = m; }
    return lo + (L - pts[lo]) / (pts[lo + 1] - pts[lo]);
  }
  var f2 = function (x) { return x.toFixed(2).replace('.', ','); };
  var f1 = function (x) { var r = Math.round(x * 10) / 10; return (Number.isInteger(r) ? String(r) : r.toFixed(1)).replace('.', ','); };
  var num = function (v) { return parseFloat(String(v).replace(',', '.')); };

  function show(msg, err) { var r = $('jg-result'); r.innerHTML = msg; r.classList.toggle('jg-err', !!err); }
  function range() { return f2(pts[MIN]) + ' – ' + f2(pts[MAX]) + ' L  (' + MIN + ' – ' + MAX + ' cm)'; }
  function mark(h) {
    document.querySelectorAll('#jg-tbody .jg-hit, #jg-tbody .jg-row-hit').forEach(function (e) { e.classList.remove('jg-hit', 'jg-row-hit'); });
    if (h == null) return;
    var n = Math.round(h), tr = $('jg-r' + Math.floor(n / 10)); if (!tr) return;
    tr.classList.add('jg-row-hit'); var td = tr.children[(n % 10) + 1]; if (td) td.classList.add('jg-hit');
  }

  function fromCm() {
    var v = $('jg-cm').value;
    if (v === '') { $('jg-l').value = ''; mark(null); return show(t('Entrez une hauteur ou un volume.')); }
    var h = num(v), L = cmToL(h);
    if (L == null) { $('jg-l').value = ''; mark(null); return show(t('Hors barème') + ' : ' + range(), true); }
    $('jg-l').value = L.toFixed(2); mark(h);
    show('<b>' + f1(h) + ' cm</b> = <b>' + f2(L) + ' L</b>');
  }
  function fromL() {
    var v = $('jg-l').value;
    if (v === '') { $('jg-cm').value = ''; mark(null); return show(t('Entrez une hauteur ou un volume.')); }
    var L = num(v), h = lToCm(L);
    if (h == null) { $('jg-cm').value = ''; mark(null); return show(t('Hors barème') + ' : ' + range(), true); }
    $('jg-cm').value = f1(h).replace(',', '.'); mark(h);
    var n = Math.round(h);
    show('<b>' + f2(L) + ' L</b> = <b>' + f1(h) + ' cm</b><br><small>' + t('Graduation la plus proche') + ' : <b>' + n + ' cm</b> (' + f2(pts[n]) + ' L)</small>');
  }

  function table() {
    var B = window.catBaremeC16, hd = '<tr><th>cm</th>', bd = '';
    for (var c = 0; c < 10; c++) hd += '<th>' + c + '</th>';
    $('jg-thead').innerHTML = hd + '</tr>';
    Object.keys(B).sort(function (a, b) { return a - b; }).forEach(function (k) {
      bd += '<tr id="jg-r' + k + '"><th>' + k + '</th>';
      for (var c = 0; c < 10; c++) bd += '<td>' + (B[k][c] != null ? f2(B[k][c]) : '') + '</td>';
      bd += '</tr>';
    });
    $('jg-tbody').innerHTML = bd;
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!$('page-jauge') || !build()) return;
    table();
    $('jg-cm').addEventListener('input', fromCm);
    $('jg-l').addEventListener('input', fromL);
    $('jg-clear').addEventListener('click', function () { $('jg-cm').value = ''; $('jg-l').value = ''; mark(null); show(t('Entrez une hauteur ou un volume.')); $('jg-cm').focus(); });
  });
  window.catLToCm = function (L) { return pts ? lToCm(L) : null; };   // reutilisable ailleurs
})();
