// CAT by Manda V4.45 - Page « À propos » en 3 langues (MG / FR / EN), suit la langue de l'application (i18n.js) ; sections repliables.
(function () {
  'use strict';
  var ICON = ["<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" ><circle cx=\"12\" cy=\"12\" r=\"10\"/><line x1=\"12\" y1=\"16\" x2=\"12\" y2=\"12\"/><line x1=\"12\" y1=\"8\" x2=\"12.01\" y2=\"8\"/></svg>", "<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" ><polygon points=\"13 2 3 14 12 14 11 22 21 10 12 10 13 2\"/></svg>", "<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" ><path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\"/></svg>", "<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" ><circle cx=\"12\" cy=\"12\" r=\"10\"/><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M14.83 9.17l4.24-4.24M4.93 19.07l4.24-4.24\"/></svg>", "<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" ><path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z\"/></svg>", "<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" ><rect x=\"2\" y=\"4\" width=\"20\" height=\"16\" rx=\"2\"/><polyline points=\"22 6 12 13 2 6\"/></svg>", "<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" ><circle cx=\"12\" cy=\"12\" r=\"10\"/><line x1=\"2\" y1=\"12\" x2=\"22\" y2=\"12\"/><path d=\"M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z\"/></svg>", "<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" ><path d=\"M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z\"/></svg>"];   // 0 info, 1 eclair, 2 bouclier, 3 support, 4 telephone, 5 mail, 6 web, 7 facebook
  var CHEVR = "<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" class=\"chev\"><polyline points=\"9 18 15 12 9 6\"/></svg>";
  var CHEV = '<svg class="ab-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';
  var esc = function (x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var ver = function () { return String(window.APP_VERSION || self.APP_VERSION || ''); };

  var L = {
    mg: {
      date: 'Novambra 2026', chip: 'PWA · Offline',
      about: { h: 'Mombamomba ny Application', rows: [
        ['Mpamorona', 'Manda Nandrianina (Creative Developer & Digital Designer)'],
        ["Natao manokana ho an'ny", 'Henri Fraise Fils & Cie — Tobim-pamokarana herinaratra Mahanoro Power System'],
        ['Daty namoahana', 'Novambra 2026'],
        ['Version sy Teknolojia', "Version {v} — Progressive Web App (PWA) mifanaraka amin'ny finday sy ordinatera."]],
        p: "Ny CAT by Manda dia rindranasa maoderina natao hanamora sy handrindrana ny fitantanana ara-teknika sy ny fanaraha-maso ny fiasan'ireo milina mpamokatra herinaratra (Groupes Électrogènes G1, G2, G3) ao amin'ny Mahanoro Power System. Noforonina izy ity mba hanoloana ny fomba fiasa mahazatra amin'ny taratasy sy hanomezana fitaovana haingana, marina, ary azo antoka ho an'ny ekipa miasa eo an-toerana." },
      feat: { h: "Ireo fiasa fototra sy tombotsoa azo amin'ny fampiasana", items: [
        ['Fitehirizana numérique feno', "Tsy mila taratasy intsony amin'ny fanoratana ny relevés horaires, ny appoints gasoil, ny transferts, ary ny cahier de travaux. Voatahiry avy hatrany ao anatin'ny fitaovanao ny angon-drakitra rehetra."],
        ['Fikajiana automatique sy marina', "Ny kajy ara-teknika rehetra toy ny Barème C16, ny CSP, ny elanelan'ny solika (litatra sy santimetatra), ary ny faharetan'ny fiasana dia kajin'ny rindranasa ho azy mba hisorohana ny fahadisoana."],
        ['Fampiasana tsy mila Internet (Mode Offline)', "Noho ny teknolojia PWA, dia mandeha tsara sy haingana hatrany ny rindranasa na dia tapaka aza ny tambajotra Internet eo an-toerana."],
        ['Fitantanana ny fandaharam-potoana (Calendrier & Tour de quart)', "Manamora ny fandrindrana ny fifandimbiasan'ny mpiasa (agents de quart) sy ny fitantanana ny fialan-tsasatra (congés) miaraka amin'ny fanitsiana mandeha ho azy ny fihodinana."],
        ['Famoahana tatitra haingana (Exportation)', "Afaka avoaka avy hatrany amin'ny endrika rakitra CSV ireo tabilao famintinana (tableaux récapitulatifs) mba hanamorana ny fanaraha-maso sy ny tatitra alefa any amin'ny lehibe (Espace Chef sy Fiche d'Exploitation)."],
        ['Synchronisation sy Messagerie', "Rehefa misy Internet, mifanaraka ho azy amin'ny serveur ny fiche sy ny angon-drakitra. Misy messagerie anatiny, notification (feo sy banner) ary sary de profil hita amin'ny ekipa."]] },
      sec: { h: 'Fiarovana ny angon-drakitra (Sauvegarde & Sécurité)',
        p: "Voatahiry ao anatin'ny fitaovana ampiasainao ny angon-drakitra ampidirinao, ary rehefa misy Internet dia mifanaraka (synchronisés) amin'ny serveur azo antoka mba hizarana azy amin'ny ekipa sy hiarovana azy. Na izany aza, entanina mafy ny mpampiasa rehetra hanao « Exporter (JSON) » matetika ao amin'ny fizarana Paramètres mba hitahirizana kopia fiarovana (backup), indrindra raha misy fanoloana finday na fanadiovana ny cache-n'ny navigateur." },
      sup: { h: 'Fanampiana teknika sy Fifandraisana (Support & Contact)',
        p: "Raha sendra misy olana ara-teknika (bug), fanontaniana momba ny fampiasana ny rindranasa, na soso-kevitra fanatsarana tianao haroso, dia aza misalasala mifandray mivantana amin'ny mpamorona :",
        l: ['Finday / WhatsApp', 'Adiresy Mailaka', 'Portfolio & Tetikasa', 'Facebook'] },
      foot: '© 2026 - Henri Fraise Fils & Cie — Mahanoro Power System. Zo rehetra voatokana (Tous droits réservés).'
    },
    fr: {
      date: 'Novembre 2026', chip: 'PWA · Hors ligne',
      about: { h: "À propos de l'application", rows: [
        ['Créateur', 'Manda Nandrianina (Creative Developer & Digital Designer)'],
        ['Conçu spécialement pour', 'Henri Fraise Fils & Cie — Centrale électrique Mahanoro Power System'],
        ['Date de publication', 'Novembre 2026'],
        ['Version et technologie', 'Version {v} — Progressive Web App (PWA), compatible téléphone et ordinateur.']],
        p: "CAT by Manda est une application moderne conçue pour faciliter et organiser la gestion technique ainsi que le suivi du fonctionnement des groupes électrogènes (G1, G2, G3) de Mahanoro Power System. Elle remplace les méthodes habituelles sur papier et offre à l'équipe sur site un outil rapide, précis et fiable." },
      feat: { h: 'Fonctions principales et avantages', items: [
        ['Archivage 100 % numérique', "Plus besoin de papier pour saisir les relevés horaires, les appoints de gasoil, les transferts et le cahier de travaux. Toutes les données sont enregistrées immédiatement sur votre appareil."],
        ['Calculs automatiques et fiables', "Tous les calculs techniques (barème C16, CSP, écarts de carburant en litres et en centimètres, durées de fonctionnement) sont effectués automatiquement par l'application pour éviter les erreurs."],
        ['Utilisation sans Internet (mode hors ligne)', "Grâce à la technologie PWA, l'application reste rapide et fonctionnelle même lorsque le réseau Internet local est coupé."],
        ['Planning (calendrier et tour de quart)', "Facilite l'organisation des rotations des agents de quart et la gestion des congés, avec ajustement automatique des rotations."],
        ['Export rapide des rapports', "Les tableaux récapitulatifs s'exportent directement en CSV pour faciliter le suivi et les rapports destinés à la hiérarchie (Espace Chef et fiche d'exploitation)."],
        ['Synchronisation et messagerie', "Quand Internet est disponible, les fiches et les données se synchronisent automatiquement avec le serveur. Messagerie interne, notifications (son et bannière) et photo de profil visibles par l'équipe."]] },
      sec: { h: 'Sauvegarde et sécurité',
        p: "Les données que vous saisissez sont enregistrées sur votre appareil et, lorsque Internet est disponible, synchronisées avec un serveur sécurisé pour être partagées avec l'équipe et protégées. Il est néanmoins vivement conseillé à tous les utilisateurs de faire régulièrement un « Exporter (JSON) » dans les Paramètres afin de conserver une copie de sauvegarde, surtout en cas de changement de téléphone ou de vidage du cache du navigateur." },
      sup: { h: 'Support technique et contact',
        p: "En cas de problème technique (bug), de question sur l'utilisation de l'application ou de suggestion d'amélioration, n'hésitez pas à contacter directement le créateur :",
        l: ['Téléphone / WhatsApp', 'Adresse e-mail', 'Portfolio et projets', 'Facebook'] },
      foot: '© 2026 - Henri Fraise Fils & Cie — Mahanoro Power System. Tous droits réservés.'
    },
    en: {
      date: 'November 2026', chip: 'PWA · Offline',
      about: { h: 'About the application', rows: [
        ['Creator', 'Manda Nandrianina (Creative Developer & Digital Designer)'],
        ['Built especially for', 'Henri Fraise Fils & Cie — Mahanoro Power System power plant'],
        ['Release date', 'November 2026'],
        ['Version & technology', 'Version {v} — Progressive Web App (PWA), works on phones and computers.']],
        p: "CAT by Manda is a modern application designed to simplify and organise the technical management and monitoring of the generating sets (G1, G2, G3) at Mahanoro Power System. It replaces the usual paper-based routines and gives the on-site team a fast, accurate and reliable tool." },
      feat: { h: 'Key features and benefits', items: [
        ['100% digital records', "No more paper for hourly readings, diesel top-ups, transfers and the work logbook. All data is saved instantly on your device."],
        ['Automatic, reliable calculations', "All technical calculations (C16 scale, CSP, fuel level differences in litres and centimetres, running times) are done automatically by the app to avoid mistakes."],
        ['Works without Internet (offline mode)', "Thanks to PWA technology, the app stays fast and fully working even when the local Internet connection is down."],
        ['Scheduling (calendar and shift rotation)', "Makes it easy to organise shift-agent rotations and manage leave, with automatic rotation adjustments."],
        ['Quick report export', "Summary tables can be exported straight to CSV to make monitoring easier and to support reports for management (Chief area and operating sheet)."],
        ['Synchronisation and messaging', "When Internet is available, sheets and data sync automatically with the server. Internal messaging, notifications (sound and banner) and profile photos are visible to the team."]] },
      sec: { h: 'Backup and security',
        p: "The data you enter is stored on your device and, when Internet is available, synchronised with a secure server so it can be shared with the team and protected. Even so, all users are strongly encouraged to run « Export (JSON) » regularly in Settings to keep a backup copy, especially before changing phones or clearing the browser cache." },
      sup: { h: 'Technical support and contact',
        p: "If you run into a technical problem (bug), have a question about using the app, or want to suggest an improvement, feel free to contact the creator directly:",
        l: ['Phone / WhatsApp', 'Email address', 'Portfolio & projects', 'Facebook'] },
      foot: '© 2026 - Henri Fraise Fils & Cie — Mahanoro Power System. All rights reserved.'
    }
  };

  var css = document.createElement('style');
  css.textContent = [
    '.ab-lang{display:flex;gap:6px;padding:4px;margin:16px 0 0;border-radius:16px;background:var(--surface);box-shadow:var(--tile-sh)}',
    '.ab-lang button{flex:1;border:0;border-radius:12px;padding:10px 6px;font-size:13px;font-weight:800;letter-spacing:.5px;background:transparent;color:var(--text-muted);cursor:pointer;transition:background .2s,color .2s,transform .15s}',
    '.ab-lang button:active{transform:scale(.97)}',
    '.ab-lang button.on{background:var(--bred-ic,#1C4B9C);color:#fff}',
    '.ab-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}',
    '.ab-chip{display:inline-flex;align-items:center;padding:7px 13px;border-radius:999px;background:var(--ac-soft);color:var(--bred-ic);font-size:12.5px;font-weight:700}',
    'details.ab-card>summary{list-style:none;cursor:pointer;-webkit-tap-highlight-color:transparent}',
    'details.ab-card>summary::-webkit-details-marker{display:none}',
    'details.ab-card>summary.ab-h{margin-bottom:0}',
    'details[open].ab-card>summary.ab-h{margin-bottom:12px}',
    '.ab-chev{margin-left:auto;flex-shrink:0;color:var(--text-muted);transition:transform .25s}',
    'details[open]>summary .ab-chev{transform:rotate(180deg)}',
    '.ab-kv{display:grid;gap:8px;margin:0 0 12px}',
    '.ab-kv>div{padding:10px 13px;border-radius:14px;background:var(--bg,rgba(0,0,0,.04))}',
    '.ab-kv small{display:block;font-size:11px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--text-muted);margin-bottom:2px}',
    '.ab-kv span{font-size:13.5px;line-height:1.5;color:var(--text-main);font-weight:600}',
    '.ab-fl{list-style:none;padding:0!important;margin:0}',
    '.ab-fl li{position:relative;padding:11px 12px 11px 34px;margin:0 0 8px;border-radius:14px;background:var(--bg,rgba(0,0,0,.04))}',
    '.ab-fl li::before{content:"";position:absolute;left:12px;top:17px;width:10px;height:10px;border-radius:50%;background:var(--bred-ic,#1C4B9C);box-shadow:0 0 0 4px var(--ac-soft)}',
    '@keyframes abIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}',
    '#abBody>.ab-card{animation:abIn .45s cubic-bezier(.2,.8,.2,1) both}',
    '#abBody>.ab-card:nth-child(3){animation-delay:.06s}#abBody>.ab-card:nth-child(4){animation-delay:.12s}#abBody>.ab-card:nth-child(5){animation-delay:.18s}',
    '@media(prefers-reduced-motion:reduce){#abBody>.ab-card{animation:none}.ab-chev,.ab-lang button{transition:none}}'
  ].join('\n');
  document.head.appendChild(css);

  function lang() { var l = window.CATi18n && window.CATi18n.get && window.CATi18n.get(); return L[l] ? l : 'fr'; }
  function head(ic, t) { return '<summary class="ab-h"><i>' + ICON[ic] + '</i><b>' + esc(t) + '</b>' + CHEV + '</summary>'; }
  function link(ic, t, small, href, ext, first) {
    return '<a class="ab-link' + (first ? ' first' : '') + '" href="' + href + '"' + (ext ? ' data-ext="1" target="_blank" rel="noopener"' : '') + '><i>' + ICON[ic] + '</i><span><b>' + esc(t) + '</b><small>' + esc(small) + '</small></span>' + CHEVR + '</a>';
  }

  function render() {
    var body = document.getElementById('abBody'), bar = document.getElementById('abLang'), ft = document.getElementById('abFoot');
    if (!body || !bar) return;
    var lg = lang(), T = L[lg], v = ver();
    var open = [].map.call(body.querySelectorAll('details'), function (d) { return d.open; });
    var o = function (i, dflt) { return open.length ? !!open[i] : dflt; };
    bar.innerHTML = ['mg', 'fr', 'en'].map(function (k) { return '<button type="button" data-ablang="' + k + '" class="' + (k === lg ? 'on' : '') + '" aria-pressed="' + (k === lg) + '">' + k.toUpperCase() + '</button>'; }).join('');
    body.innerHTML =
      '<div class="ab-chips"><span class="ab-chip">' + esc(v) + '</span><span class="ab-chip">' + esc(T.date) + '</span><span class="ab-chip">' + esc(T.chip) + '</span></div>' +
      '<details class="ab-card"' + (o(0, true) ? ' open' : '') + '>' + head(0, T.about.h) +
        '<div class="ab-kv">' + T.about.rows.map(function (r) { return '<div><small>' + esc(r[0]) + '</small><span>' + esc(r[1].replace('{v}', v)) + '</span></div>'; }).join('') + '</div><p>' + esc(T.about.p) + '</p></details>' +
      '<details class="ab-card"' + (o(1, false) ? ' open' : '') + '>' + head(1, T.feat.h) +
        '<ul class="ab-fl">' + T.feat.items.map(function (it) { return '<li><b>' + esc(it[0]) + ' :</b> ' + esc(it[1]) + '</li>'; }).join('') + '</ul></details>' +
      '<details class="ab-card"' + (o(2, false) ? ' open' : '') + '>' + head(2, T.sec.h) + '<p>' + esc(T.sec.p) + '</p></details>' +
      '<details class="ab-card"' + (o(3, true) ? ' open' : '') + '>' + head(3, T.sup.h) + '<p>' + esc(T.sup.p) + '</p><div style="margin-top:6px">' +
        link(4, T.sup.l[0], '+261 38 24 901 50', 'https://wa.me/261382490150', true, true) +
        link(5, T.sup.l[1], 'mandarandriamanantena520@gmail.com', 'mailto:mandarandriamanantena520@gmail.com', false) +
        link(6, T.sup.l[2], 'portfolio-manda.netlify.app', 'https://portfolio-manda.netlify.app/', true) +
        link(7, T.sup.l[3], 'Manda Nandrianina', 'https://www.facebook.com/manda.nandrianina.randriamanantena', true) + '</div></details>';
    if (ft) ft.textContent = T.foot;
    [].forEach.call(document.querySelectorAll('#aboutModal .app-ver'), function (e) { e.textContent = v; });
  }

  // boutons MG / FR / EN = la meme langue que Parametres > Langue
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-ablang]'); if (!b) return;
    if (window.CATi18n) window.CATi18n.set(b.dataset.ablang);   // re-affiche aussi cette page (voir plus bas)
    render();
  });
  var I = window.CATi18n;
  if (I && !I._ab) { var set0 = I.set; I.set = function (l) { set0.call(I, l); render(); }; I._ab = 1; }
  render();
})();
