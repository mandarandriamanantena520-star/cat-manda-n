// CAT by Manda V4.18 - « Mon profil » : photo, nom, e-mail, mot de passe, session.
// Ouvert depuis : menu lateral > Mon profil, Parametres > Profil, Espace Chef (photo en haut).
// La logique serveur (Supabase) est dans sync.js : window.CATprofile.
(function () {
  'use strict';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var ARROW = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>';
  var m = null, msg = null;   // msg = { t: texte, ok: bool } affiche en haut

  function modal() {
    if (m) return m;
    m = document.createElement('div'); m.id = 'profileModal'; m.className = 'modal-overlay';
    document.body.appendChild(m);
    m.addEventListener('click', onClick);
    m.addEventListener('change', onChange);
    return m;
  }

  function render() {
    var P = window.CATprofile, p = P.prof() || {}, u = P.me() || {}, im = P.avatar();
    var nom = p.nom || '', isChef = p.role === 'chef';
    var who = nom || u.email || '?';
    m.innerHTML =
      '<div class="modal st-modal bred-modal hero"><div class="modal-head">' +
        '<button class="modal-close" type="button" data-pf="close" aria-label="Fermer">' + ARROW + '</button>' +
        '<h3>Mon profil</h3><span class="bm-circle bm-ghost" aria-hidden="true"></span></div>' +
      '<div class="modal-body">' +
        '<div class="cd-hero"><div class="hc-top"><div class="hc-ic pf-av" style="' + (im ? 'background-image:url(' + im + ')' : '') + '">' + (im ? '' : esc(String(who).trim().slice(0, 1).toUpperCase())) + '</div>' +
          '<div class="hc-t"><b>' + esc(nom || who) + '</b><span>' + (isChef ? 'Chef' : (p.role ? 'Agent de quart' : '')) + '</span></div></div>' +
          '<div class="hc-lab">Adresse e-mail</div><div class="hc-val"><b style="font-size:15px">' + esc(u.email || '') + '</b></div></div>' +
        '<div class="pf-msg' + (msg && msg.ok ? ' ok' : '') + '" id="pf-msg" role="status"' + (msg ? '' : ' hidden') + '>' + esc(msg ? msg.t : '') + '</div>' +

        '<div class="st-box"><span class="pf-lab">Photo de profil</span>' +
          '<div class="pf-acts"><label class="st-btn">Changer la photo<input type="file" accept="image/*" id="pf-file" hidden></label>' +
          (im ? '<button type="button" class="st-btn danger" data-pf="delphoto">Retirer la photo</button>' : '') + '</div>' +
          '<p class="st-hint">Votre photo est visible par les autres utilisateurs de l\'application.</p></div>' +

        '<div class="st-box"><label class="pf-lab" for="pf-nom">Nom affiché</label>' +
          '<input id="pf-nom" class="st-in pf-in" type="text" maxlength="60" autocomplete="name" value="' + esc(nom) + '">' +
          '<div class="pf-acts"><button type="button" class="st-btn" data-pf="name">Enregistrer le nom</button></div></div>' +

        '<div class="st-box"><label class="pf-lab" for="pf-mail">Nouvelle adresse e-mail</label>' +
          '<input id="pf-mail" class="st-in pf-in" type="email" autocomplete="email" placeholder="nom@gmail.com">' +
          '<p class="st-hint">Un e-mail de confirmation sera envoyé : le changement n\'est effectif qu\'après avoir ouvert le lien reçu.</p>' +
          '<div class="pf-acts"><button type="button" class="st-btn" data-pf="email">Changer l\'adresse e-mail</button></div></div>' +

        '<div class="st-box"><label class="pf-lab" for="pf-p0">Mot de passe actuel</label>' +
          '<input id="pf-p0" class="st-in pf-in" type="password" autocomplete="current-password">' +
          '<label class="pf-lab" for="pf-p1">Nouveau mot de passe</label>' +
          '<input id="pf-p1" class="st-in pf-in" type="password" autocomplete="new-password" minlength="6" placeholder="6 caractères minimum">' +
          '<label class="pf-lab" for="pf-p2">Confirmer le nouveau mot de passe</label>' +
          '<input id="pf-p2" class="st-in pf-in" type="password" autocomplete="new-password" minlength="6">' +
          '<div class="pf-acts"><button type="button" class="st-btn" data-pf="pass">Changer le mot de passe</button></div></div>' +

        '<div class="st-box">' +
          '<div class="st-row"><span>Rôle</span><b>' + (isChef ? 'Chef' : (p.role ? 'Agent de quart' : '-')) + '</b></div>' +
          '<div class="st-row"><span>Statut</span><b>' + (p.approved ? 'Compte validé' : 'En attente') + '</b></div></div>' +

        '<div class="st-box"><span class="pf-lab">Session</span><div class="pf-acts">' +
          (P.hasBio() ? '<button type="button" class="st-btn" data-pf="lock">Verrouiller l\'application</button>' : '') +
          '<button type="button" class="st-btn danger" data-pf="logout">Se déconnecter</button></div></div>' +
      '</div></div>';
  }

  function say(t, ok) {
    msg = t ? { t: t, ok: !!ok } : null;
    var e = document.getElementById('pf-msg');
    if (e) { e.textContent = t || ''; e.hidden = !t; e.classList.toggle('ok', !!ok); if (t && e.scrollIntoView) e.scrollIntoView({ block: 'nearest' }); }
  }
  var val = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };

  function onChange(e) {
    if (e.target.id !== 'pf-file') return;
    var f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return;
    window.CATprofile.setAvatar(f).then(function (shared) { say(shared ? 'Photo enregistrée et visible par les autres utilisateurs.' : 'Photo enregistrée sur cet appareil. Non partagée (hors ligne, ou SQL V4.37 pas encore exécuté par le Chef).', true); render(); }, function (er) { say(er.message); });
  }

  function onClick(e) {
    var b = e.target.closest('[data-pf]'); if (!b) { if (e.target === m) close(); return; }
    var P = window.CATprofile, a = b.dataset.pf;
    if (a === 'close') return close();
    if (a === 'delphoto') { P.delAvatar(); say('Photo retirée.', true); return render(); }
    if (a === 'lock') { close(); return P.lock(); }
    if (a === 'logout') { if (confirm('Se déconnecter de ce compte ?')) P.logout(); return; }
    var run = {
      name: function () { return P.setName(val('pf-nom')).then(function () { say('Nom enregistré.', true); render(); }); },
      email: function () { return P.setEmail(val('pf-mail')).then(function () { say('E-mail de confirmation envoyé. Ouvrez le lien reçu pour valider la nouvelle adresse.', true); var i = document.getElementById('pf-mail'); if (i) i.value = ''; }); },
      pass: function () { return P.setPassword(val('pf-p0'), val('pf-p1'), val('pf-p2')).then(function () { say('Mot de passe modifié.', true); ['pf-p0', 'pf-p1', 'pf-p2'].forEach(function (i) { var x = document.getElementById(i); if (x) x.value = ''; }); }); }
    }[a];
    if (!run) return;
    b.disabled = true; say('');
    run().catch(function (er) { say(er && er.message ? er.message : 'Erreur.'); }).then(function () { b.disabled = false; });
  }

  function close() { if (m) m.classList.remove('open'); msg = null; }

  window.openProfile = function () {
    var P = window.CATprofile;
    if (!P || !P.me()) { alert('Connectez-vous d\'abord.'); return; }
    modal(); msg = null; render(); m.classList.add('open');
    var so = document.getElementById('sideMenuOverlay'), sm = document.getElementById('sideMenu');
    if (sm) sm.classList.remove('open'); if (so) so.classList.remove('open');
  };
})();
