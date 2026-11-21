// Messagerie e-mail (le Chef écrit aux Chefs ET aux agents) : rédaction type Gmail, vraies adresses e-mail uniquement,
// envoi réel par e-mail (Supabase Edge Function « send-mail »), accusés de lecture,
// suppression (pour moi / pour tout le monde) et pièces jointes DPR / PPS.
document.addEventListener('DOMContentLoaded', () => {
  const db = window.CATdb, page = document.getElementById('page-messages');
  if (!db || !page || !db.messages || !db.lus) return;
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const LS = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const me = () => (window.CATme && window.CATme.id) || '';
  const myMail = () => String((window.CATme && window.CATme.email) || '').toLowerCase();
  const myName = () => (LS('catProf', {}) || {}).nom || myMail() || 'Moi';
  const isChef = () => document.body.dataset.role === 'chef';
  const RE = /^[A-Za-z0-9._%+'\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}$/;   // vraie adresse e-mail uniquement
  const uid8 = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  const p2 = n => String(n).padStart(2, '0');
  const hhmm = t => { const d = new Date(t); return p2(d.getHours()) + ':' + p2(d.getMinutes()); };
  const dmy = t => { const d = new Date(t); return p2(d.getDate()) + '/' + p2(d.getMonth() + 1); };
  const when = t => new Date(t).toDateString() === new Date().toDateString() ? hhmm(t) : dmy(t);
  const full = t => dmy(t) + '/' + new Date(t).getFullYear() + ' à ' + hhmm(t);
  const b64 = s => btoa(unescape(encodeURIComponent(s)));
  const S = (d, z = 22) => `<svg width="${z}" height="${z}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const IC = {
    back: S('<path d="M19 12H5M12 19l-7-7 7-7"/>'),
    clip: S('<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>'),
    clipS: S('<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>', 14),
    send: S('<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>'),
    more: S('<circle cx="12" cy="5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="19" r="1.6" fill="currentColor"/>'),
    down: S('<polyline points="6 9 12 15 18 9"/>'),
    trash: S('<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>'),
    pen: S('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
    reply: S('<polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>'),
    x: S('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>', 16),
    users: S('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
    ok: S('<polyline points="20 6 9 17 4 12"/>', 18),
    okS: S('<polyline points="20 6 9 17 4 12"/>', 14)
  };

  const FAKE = /@(example|exemple|test|tests|domain|fake|faux|nomail|localhost)\.[a-z.]+$|\.(invalid|local|test|example|localhost)$/i;   // adresses d'exemple refusées
  let tab = 'in', msgs = [], reads = [], people = LS('catPeople', []), peopleErr = '', sel = new Set(), built = false;
  const draftKey = () => 'catMailDraft:' + me();   // brouillon propre à chaque compte (plus de mélange entre comptes)
  const hideKey = () => 'catMsgHide:' + me();
  const hidden = () => new Set(LS(hideKey(), []));
  const hideAdd = ids => { const h = hidden(); ids.forEach(i => h.add(i)); localStorage.setItem(hideKey(), JSON.stringify([...h])); };
  const rcpts = m => [...new Set([].concat(m.to ? String(m.to).split(',') : [], m.cc || [], m.bcc || []).map(x => String(x).trim().toLowerCase()).filter(Boolean))];
  const isRead = mid => reads.some(r => r.mid === mid && r.uid === me());
  const mails = () => msgs.filter(m => m.kind === 'mail' && m.mid && !hidden().has(m.mid));
  const inbox = () => mails().filter(m => m.uid !== me() && rcpts(m).includes(myMail())).sort((a, b) => b.ts - a.ts);
  const outbox = () => mails().filter(m => m.uid === me()).sort((a, b) => b.ts - a.ts);
  const unread = () => inbox().filter(m => !isRead(m.mid)).length;

  async function load() { msgs = await db.messages.toArray(); reads = await db.lus.toArray(); }
  // Annuaire = tous les comptes validés (Chefs ET agents) qui ont une vraie adresse e-mail.
  async function loadPeople() {
    peopleErr = '';
    try {
      const r = await window.CATsb.from('profiles').select('id,nom,email,role,approved');
      if (r.error) peopleErr = r.error.message || 'Annuaire indisponible.';
      else if (r.data) {
        people = r.data.filter(p => p.approved && p.email && RE.test(String(p.email).trim()) && !FAKE.test(String(p.email).trim()))
          .map(p => ({ ...p, email: String(p.email).trim().toLowerCase() }))
          .sort((a, b) => (+(b.role === 'chef') - +(a.role === 'chef')) || String(a.nom || a.email).localeCompare(String(b.nom || b.email)));
        localStorage.setItem('catPeople', JSON.stringify(people)); localStorage.removeItem('catPeopleChef');
      }
    } catch (e) { peopleErr = 'Pas de réseau : annuaire non actualisé.'; }
  }
  const personOf = e => people.find(p => String(p.email).toLowerCase() === e);

  function toast(t) {
    let d = $('mlToast'); if (!d) { d = document.createElement('div'); d.id = 'mlToast'; document.body.appendChild(d); }
    d.textContent = t; d.classList.add('on'); clearTimeout(d._t); d._t = setTimeout(() => d.classList.remove('on'), 2600);
  }
  function beep() {
    try { const ac = new (window.AudioContext || window.webkitAudioContext)(), t = ac.currentTime;
      [[880, 0], [1175, 0.14]].forEach(([f, d]) => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; o.connect(g); g.connect(ac.destination);
        g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.25, t + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.2); o.start(t + d); o.stop(t + d + 0.22); });
    } catch (e) {}
  }

  // ====================== LISTE ======================
  function build() {
    if (built) return; built = true;
    page.innerHTML = `<div class="ml-wrap"><div class="ml-tabs" id="mlTabs"></div><div class="ml-sel hidden" id="mlSel"></div><div id="mlList" class="ml-list"></div>
      <button type="button" class="ml-fab" id="mlNew">${IC.pen}<span>Écrire</span></button></div>`;
    $('mlTabs').addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (!b) return; tab = b.dataset.t; sel.clear(); render(); });
    $('mlNew').addEventListener('click', () => openCompose({ fresh: false }));
    $('mlSel').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.a === 'cancel') { sel.clear(); render(); }
      if (b.dataset.a === 'del') askDelete([...sel]);
    });
    $('mlList').addEventListener('click', e => {
      const ck = e.target.closest('[data-ck]'), row = e.target.closest('[data-m]'); if (!row) return;
      const mid = row.dataset.m;
      if (ck || sel.size) { sel.has(mid) ? sel.delete(mid) : sel.add(mid); return render(); }
      openMail(mid);
    });
  }
  function rowHtml(m) {
    const sent = m.uid === me(), un = !sent && !isRead(m.mid), on = sel.has(m.mid), r = rcpts(m);
    const who = sent ? 'À : ' + esc(r.filter(x => x !== myMail())[0] || r[0] || '') + (r.length > 1 ? ' +' + (r.length - 1) : '') : esc(m.nom || m.from || '?');
    const stt = !sent ? '' : ({ queued: '<em class="w">En attente de réseau · </em>', sending: '<em class="w">Envoi… · </em>', failed: '<em class="e">Non envoyé : touchez pour réessayer · </em>' }[m.state] || '');
    const ini = esc(String((sent ? myName() : (m.nom || m.from || '?'))).trim().slice(0, 1).toUpperCase());
    return `<div class="ml-row${un ? ' un' : ''}${on ? ' on' : ''}" data-m="${m.mid}"><button type="button" class="ml-ck" data-ck="1" aria-label="Sélectionner">${on ? IC.ok : ini}</button>
      <div class="ml-mid"><div class="ml-l1"><b>${who}</b><small>${when(m.ts)}</small></div><div class="ml-l2">${esc(m.subject || '(sans objet)')}</div>
      <div class="ml-l3">${m.att ? '<span class="ml-clip">' + IC.clipS + '</span>' : ''}${stt}${esc(String(m.text || '').replace(/\s+/g, ' ').slice(0, 90))}</div></div></div>`;
  }
  function render() {
    if (!isChef()) { built = false; page.innerHTML = '<div class="ml-lock"><h2>Messagerie réservée aux Chefs</h2><p>Les agents de quart n\'ont pas accès à la messagerie.</p></div>'; return; }
    build();
    const I = inbox(), O = outbox(), list = tab === 'in' ? I : O, u = unread();
    $('mlTabs').innerHTML = `<button type="button" data-t="in" class="${tab === 'in' ? 'on' : ''}">Réception${u ? `<i>${u}</i>` : ''}</button><button type="button" data-t="out" class="${tab === 'out' ? 'on' : ''}">Envoyés</button>`;
    const bar = $('mlSel'); bar.classList.toggle('hidden', !sel.size);
    bar.innerHTML = sel.size ? `<span>${sel.size} sélectionné(s)</span><span><button type="button" data-a="del">${IC.trash} Supprimer</button><button type="button" data-a="cancel">Annuler</button></span>` : '';
    $('mlList').innerHTML = list.length ? list.map(rowHtml).join('') : `<p class="ml-empty">${tab === 'in' ? 'Aucun message reçu.' : 'Aucun message envoyé.'}</p>`;
    const el = $('msgBadge'); if (el) { el.textContent = u; el.style.display = u ? '' : 'none'; }
  }
  async function refresh(sound) {
    const before = inbox().map(m => m.mid);
    await load();
    const fresh = inbox().some(m => !before.includes(m.mid) && !isRead(m.mid));
    if (before.length && fresh && sound) beep();
    render();
    if ($('mailView')) paintMail($('mailView').dataset.mid);
  }

  // ====================== SUPPRESSION ======================
  function askDelete(ids) {
    const rows = ids.map(id => msgs.find(m => m.mid === id)).filter(Boolean), mine = rows.length && rows.every(m => m.uid === me());
    const d = document.createElement('div'); d.id = 'mlDlg';
    d.innerHTML = `<div class="dlg"><h3>Supprimer ${rows.length > 1 ? rows.length + ' messages' : 'ce message'} ?</h3>
      <button type="button" data-d="me">Supprimer pour moi</button>
      ${mine ? '<button type="button" data-d="all" class="dng">Supprimer pour tout le monde</button><small>Les chefs ne le verront plus dans l\'application. Un e-mail déjà envoyé ne peut pas être rappelé.</small>' : ''}
      <button type="button" data-d="no" class="ghost">Annuler</button></div>`;
    document.body.appendChild(d);
    d.addEventListener('click', async e => {
      const b = e.target.closest('[data-d]'); if (!b && e.target !== d) return; const a = b ? b.dataset.d : 'no'; d.remove();
      if (a === 'no') return;
      if (a === 'me') hideAdd(ids);
      if (a === 'all') {
        for (const m of rows) {
          await db.messages.delete(m.id);
          for (const r of reads.filter(x => x.mid === m.mid)) await db.lus.delete(r.id);
        }
        hideAdd(ids);
      }
      sel.clear(); closeMail(); await load(); render(); toast(a === 'all' ? 'Supprimé pour tout le monde' : 'Message supprimé');
    });
  }

  // ====================== LECTURE ======================
  function closeMail() { const v = $('mailView'); if (v) v.remove(); }
  async function openMail(mid) {
    const m = msgs.find(x => x.mid === mid); if (!m) return;
    if (m.uid !== me() && !isRead(mid)) {
      await db.lus.add({ mid, uid: me(), nom: myName(), email: myMail(), ts: Date.now(), _rk: 'lu:' + mid + ':' + me() });
      reads = await db.lus.toArray(); render();
    }
    closeMail();
    const v = document.createElement('div'); v.id = 'mailView'; v.dataset.mid = mid; document.body.appendChild(v);
    v.addEventListener('click', e => onMailClick(e, mid));
    paintMail(mid);
  }
  function statusHtml(m) {
    if (m.state === 'sent') return `<div class="mv-st ok">${IC.okS} E-mail envoyé${m.sentAt ? ' le ' + full(m.sentAt) : ''}</div>`;
    if (m.state === 'queued') return '<div class="mv-st w">En attente de connexion : l\'e-mail partira automatiquement dès que le réseau revient.</div>';
    if (m.state === 'sending') return '<div class="mv-st w">Envoi en cours…</div>';
    if (m.state === 'failed') return `<div class="mv-st e"><b>L'e-mail n'est pas parti.</b><br>${esc(m.err || '')}<div class="mv-sb"><button type="button" data-a="retry">Réessayer</button><button type="button" data-a="mailto">Ouvrir dans ma messagerie</button>${navigator.share ? '<button type="button" data-a="share">Partager</button>' : ''}</div></div>`;
    return '';
  }
  function readsHtml(m) {
    const list = rcpts(m).filter(e => e !== myMail());
    if (!list.length) return '';
    return `<div class="mv-reads"><b>Lecture</b>${list.map(e => {
      const p = personOf(e);
      if (!p) return `<div class="mv-r"><span>${esc(e)}</span><small>Adresse externe : lecture non suivie</small></div>`;
      if (p.role !== 'chef') return `<div class="mv-r"><span>${esc(p.nom || e)}</span><small>Agent : reçu par e-mail, lecture non suivie</small></div>`;
      const r = reads.find(x => x.mid === m.mid && x.uid === p.id);
      return `<div class="mv-r"><span>${esc(p.nom || e)}</span>${r ? `<small class="ok">${IC.okS} Vu le ${full(r.ts)}</small>` : '<small>Pas encore vu</small>'}</div>`;
    }).join('')}</div>`;
  }
  function paintMail(mid) {
    const v = $('mailView'), m = msgs.find(x => x.mid === mid); if (!v) return;
    if (!m) { v.remove(); return; }
    const sent = m.uid === me(), cc = m.cc || [], bcc = m.bcc || [];
    v.innerHTML = `<div class="mv-bar2"><button type="button" data-a="back" aria-label="Retour">${IC.back}</button><span class="mc-sp"></span>${sent ? '' : `<button type="button" data-a="reply" aria-label="Répondre">${IC.reply}</button>`}<button type="button" data-a="del" aria-label="Supprimer">${IC.trash}</button></div>
      <div class="mv-sc"><h2>${esc(m.subject || '(sans objet)')}</h2>
      <div class="mv-meta"><div class="ml-av">${esc(String(m.nom || m.from || '?').trim().slice(0, 1).toUpperCase())}</div><div class="mv-who"><b>${esc(m.nom || '')}</b> <small>&lt;${esc(m.from || '')}&gt;</small>
        <br><small>À : ${esc(String(m.to || '').split(',').join(', '))}${cc.length ? '<br>Cc : ' + esc(cc.join(', ')) : ''}${sent && bcc.length ? '<br>Cci : ' + esc(bcc.join(', ')) : ''}</small></div><small class="mv-dt">${full(m.ts)}</small></div>
      <div class="mv-text">${esc(m.text || '').replace(/\n/g, '<br>')}</div>
      ${m.att ? `<div class="mv-att"><div class="mv-an">${IC.clip}<span><b>${esc(m.att.name)}</b><small>${esc(m.att.type)} · ${esc(m.att.date)}</small></span></div>
        <div class="mv-sb"><button type="button" data-a="open">Ouvrir</button><button type="button" data-a="pdf">PDF</button><button type="button" data-a="print">Imprimer</button>${navigator.share ? '<button type="button" data-a="shareatt">Partager</button>' : ''}</div></div>` : ''}
      ${sent ? statusHtml(m) + readsHtml(m) : ''}</div>`;
  }
  function viewReport(m) {
    let v = $('msgView'); if (v) v.remove();
    v = document.createElement('div'); v.id = 'msgView';
    v.innerHTML = `<div class="mv-bar"><b>${esc(m.att.type)} · ${esc(m.att.date)}</b><span><button type="button" id="mvPrint">Imprimer</button><button type="button" id="mvClose">Fermer</button></span></div><div class="mv-body"><div id="chef-print">${m.att.html}</div></div>`;
    document.body.appendChild(v);
    $('mvClose').onclick = () => v.remove();
    $('mvPrint').onclick = () => { document.body.classList.add('print-msg'); window.print(); setTimeout(() => document.body.classList.remove('print-msg'), 600); };
    return v;
  }
  const standalone = a => '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(a.name) + '</title><style>@page{size:A4 landscape;margin:8mm}body{margin:10px;font-family:Arial,sans-serif}</style></head><body>' + a.html + '</body></html>';
  // Pièce jointe : PDF (CATpdf), sinon HTML en secours si le navigateur ne sait pas dessiner le rapport
  const u8b64 = u => { let s = ''; const n = 0x8000; for (let i = 0; i < u.length; i += n) s += String.fromCharCode.apply(null, u.subarray(i, i + n)); return btoa(s); };
  const baseName = a => String(a.name || 'rapport').replace(/\.(pdf|html?)$/i, '');
  async function attFile(a) {
    try { if (window.CATpdf) return { name: baseName(a) + '.pdf', bytes: await window.CATpdf.fromHtml(a.html), type: 'application/pdf' }; } catch (x) { console.warn('PDF impossible, secours HTML', x); }
    return { name: baseName(a) + '.html', bytes: new TextEncoder().encode(standalone(a)), type: 'text/html' };
  }
  async function attDownload(m) {
    toast('Création du PDF…');
    const f = await attFile(m.att);
    if (window.CATpdf && f.type === 'application/pdf') window.CATpdf.download(f.bytes, f.name);
    else { const url = URL.createObjectURL(new Blob([f.bytes], { type: f.type })), a = document.createElement('a'); a.href = url; a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); toast('PDF indisponible : fichier HTML enregistré'); }
  }
  function mailtoOf(m) {
    const q = [['subject', m.subject || ''], ['body', (m.text || '') + (m.att ? '\n\n[Rapport ' + m.att.type + ' du ' + m.att.date + ' : utilisez « Partager » dans CAT pour l\'envoyer en pièce jointe]' : '') + '\n\n— CAT by Manda']]; if ((m.cc || []).length) q.push(['cc', m.cc.join(',')]); if ((m.bcc || []).length) q.push(['bcc', m.bcc.join(',')]);
    return 'mailto:' + String(m.to || '').split(',').map(encodeURIComponent).join(',') + '?' + q.map(([k, x]) => k + '=' + encodeURIComponent(x)).join('&');
  }
  async function onMailClick(e, mid) {
    const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a, m = msgs.find(x => x.mid === mid); if (!a || !m) return;
    if (a === 'back') return closeMail();
    if (a === 'del') return askDelete([mid]);
    if (a === 'reply') { closeMail(); return openCompose({ fresh: true, to: [String(m.from || '').toLowerCase()].filter(Boolean), subject: /^re:/i.test(m.subject || '') ? m.subject : 'Re: ' + (m.subject || ''), text: '' }); }
    if (a === 'open') return viewReport(m);
    if (a === 'pdf') { if (m.att) await attDownload(m); return; }
    if (a === 'print') { viewReport(m); document.body.classList.add('print-msg'); window.print(); setTimeout(() => document.body.classList.remove('print-msg'), 600); return; }
    if (a === 'retry') return deliver(mid, true);
    if (a === 'mailto') { location.href = mailtoOf(m); return; }
    if (a === 'share' || a === 'shareatt') {
      try {
        const data = { title: m.subject, text: m.text };
        if (m.att) { const af = await attFile(m.att), f = new File([af.bytes], af.name, { type: af.type }); if (navigator.canShare && navigator.canShare({ files: [f] })) data.files = [f]; }
        await navigator.share(data);
      } catch (x) {}
    }
  }

  // ====================== ENVOI RÉEL PAR E-MAIL ======================
  const inflight = new Set();
  async function deliver(mid, manual) {
    if (inflight.has(mid)) return;
    const row = (await db.messages.toArray()).find(x => x.mid === mid); if (!row || row.uid !== me() || row.state === 'sent') return;
    if (!navigator.onLine) { await db.messages.update(row.id, { state: 'queued' }); await load(); return render(); }
    inflight.add(mid);
    await db.messages.update(row.id, { state: 'sending', sendTs: Date.now(), err: '' }); await load(); render();
    try {
      const sb = window.CATsb; if (!sb || !sb.functions) throw new Error('Connexion au serveur indisponible.');
      const payload = { to: String(row.to).split(','), cc: row.cc || [], bcc: row.bcc || [], subject: row.subject || '(sans objet)', text: (row.text || '') + '\n\n— CAT by Manda · Mahanoro',
        replyTo: row.from, fromName: row.nom, attachments: [] };
      if (row.att) { const af = await attFile(row.att); payload.attachments = [{ name: af.name, content: u8b64(af.bytes) }]; }
      const r = await sb.functions.invoke((window.CAT_CFG && window.CAT_CFG.mailFn) || 'send-mail', { body: payload });
      if (r.error) { let msg = r.error.message || 'Erreur'; try { const j = await r.error.context.json(); if (j && j.error) msg = j.error; } catch (x) {} throw new Error(msg); }
      if (r.data && r.data.error) throw new Error(r.data.error);
      await db.messages.update(row.id, { state: 'sent', err: '', sentAt: Date.now() });
    } catch (e) {
      let msg = String((e && e.message) || e);
      if (/not found|404|Failed to send a request|FunctionsFetchError|FunctionsRelayError/i.test(msg)) msg = 'Le serveur d\'envoi e-mail n\'est pas encore installé (voir serveur-email/LISEZ-MOI.txt). En attendant, touchez « Ouvrir dans ma messagerie » ou « Partager ».';
      await db.messages.update(row.id, { state: 'failed', err: msg });
    }
    inflight.delete(mid); await load(); render();
    if ($('mailView') && $('mailView').dataset.mid === mid) paintMail(mid);
    if (manual) { const m = msgs.find(x => x.mid === mid); toast(m && m.state === 'sent' ? 'E-mail envoyé' : 'Envoi impossible'); }
  }
  async function flush() {
    if (!navigator.onLine || !me()) return;
    await load();
    for (const m of msgs) if (m.kind === 'mail' && m.uid === me() && (m.state === 'queued' || (m.state === 'sending' && Date.now() - (m.sendTs || 0) > 120000))) await deliver(m.mid);
  }

  // ====================== RÉDACTION (type Gmail) ======================
  let C = null;
  const draftSave = () => { if (C) localStorage.setItem(draftKey(), JSON.stringify(C)); };
  function closeCompose() { closePicker(); const c = $('mailCompose'); if (c) c.remove(); C = null; }
  function chipsHtml(f) { return C[f].map((e, i) => `<span class="mc-chip">${esc(e)}<button type="button" data-rm="${f}:${i}" aria-label="Retirer">${IC.x}</button></span>`).join(''); }
  function paintChips() { ['to', 'cc', 'bcc'].forEach(f => { const el = $('mc-ch-' + f); if (el) el.innerHTML = chipsHtml(f); }); }
  function paintAtt() {
    $('mcAtt').innerHTML = C.att ? `<div class="mc-att">${IC.clip}<span><b>${esc(C.att.name)}</b><small>${esc(C.att.type)} · ${esc(C.att.date)}</small></span><button type="button" data-rm="att" aria-label="Retirer">${IC.x}</button></div>` : '';
  }
  function err(t) { const e = $('mcErr'); if (!e) return; e.textContent = t || ''; e.classList.toggle('hidden', !t); }
  function commit(f) {
    const inp = $('mc-in-' + f); if (!inp || !C) return true; const raw = inp.value; if (!raw.trim()) return true;
    const bad = [];
    raw.split(/[\s,;]+/).filter(Boolean).forEach(p => { const e = p.replace(/^<|>$/g, '').toLowerCase(); if (RE.test(e) && !FAKE.test(e)) { if (!C[f].includes(e)) C[f].push(e); } else bad.push(p); });
    inp.value = bad.join(' '); paintChips(); draftSave();
    if (bad.length) { err('« ' + bad[0] + ' » n\'est pas une vraie adresse e-mail (ex. nom@gmail.com). Choisissez plutôt un contact avec le bouton ci-dessus. Elle n\'est pas ajoutée.'); return false; }
    err(''); return true;
  }
  function suggest(f) {
    const q = $('mc-in-' + f).value.trim().toLowerCase(), box = $('mcSug');
    const list = people.filter(p => String(p.email).toLowerCase() !== myMail() && !C[f].includes(String(p.email).toLowerCase()) && (!q || (p.nom || '').toLowerCase().includes(q) || String(p.email).toLowerCase().includes(q)));
    box.dataset.f = f; box.classList.toggle('hidden', !list.length);
    box.innerHTML = list.slice(0, 6).map(p => `<button type="button" data-sg="${esc(String(p.email).toLowerCase())}"><b>${esc(p.nom || '')} <i class="mc-role">${p.role === 'chef' ? 'Chef' : 'Agent'}</i></b><small>${esc(p.email)}</small></button>`).join('');
  }

  // ---- Choix des destinataires dans l'annuaire (Chefs + agents, vraies adresses) ----
  function closePicker() { const d = $('mcContacts'); if (d) d.remove(); }
  function paintPicker() {
    const d = $('mcContacts'); if (!d || !C) return;
    const f = d.dataset.f, q = ($('mcCq') ? $('mcCq').value : '').trim().toLowerCase();
    const list = people.filter(p => p.email !== myMail() && (!q || (p.nom || '').toLowerCase().includes(q) || p.email.includes(q)));
    const row = p => { const on = C[f].includes(p.email); return `<button type="button" class="mc-ct${on ? ' on' : ''}" data-ct="${esc(p.email)}"><span class="mc-ca">${on ? IC.ok : esc(String(p.nom || p.email).trim().slice(0, 1).toUpperCase())}</span><span class="mc-cn"><b>${esc(p.nom || p.email)}</b><small>${esc(p.email)} · ${p.role === 'chef' ? 'Chef' : 'Agent'}</small></span></button>`; };
    const chefs = list.filter(p => p.role === 'chef'), ags = list.filter(p => p.role !== 'chef');
    $('mcCl').innerHTML = (peopleErr ? `<p class="mc-cw">${esc(peopleErr)}${people.length ? ' (liste enregistrée affichée)' : ''}</p>` : '') +
      (chefs.length ? '<h4>Chefs</h4>' + chefs.map(row).join('') : '') + (ags.length ? '<h4>Agents</h4>' + ags.map(row).join('') : '') +
      (list.length ? '' : `<p class="mc-cw">Aucun contact${q ? ' pour cette recherche' : ' pour le moment'}. Les comptes validés apparaissent ici avec leur vraie adresse e-mail.</p>`);
    $('mcCok').textContent = 'Terminé (' + C[f].length + ')';
  }
  async function openPicker(f) {
    closePicker();
    const d = document.createElement('div'); d.id = 'mcContacts'; d.dataset.f = f;
    d.innerHTML = `<div class="mc-cb"><button type="button" data-ca="close" aria-label="Retour">${IC.back}</button><b>Choisir un destinataire</b><button type="button" data-ca="close" class="mc-cok" id="mcCok">Terminé</button></div>
      <div class="mc-cs"><input id="mcCq" type="search" placeholder="Rechercher un nom ou une adresse" autocomplete="off"></div><div id="mcCl" class="mc-cl"></div>
      <div class="mc-cf"><button type="button" data-ca="refresh">Actualiser la liste</button><small>Une personne sans compte ? Tapez simplement son adresse e-mail dans le champ À.</small></div>`;
    document.body.appendChild(d); paintPicker();
    d.addEventListener('input', e => { if (e.target.id === 'mcCq') paintPicker(); });
    d.addEventListener('click', async e => {
      const ct = e.target.closest('[data-ct]');
      if (ct) { const em = ct.dataset.ct, i = C[f].indexOf(em); if (i >= 0) C[f].splice(i, 1); else C[f].push(em); paintChips(); draftSave(); return paintPicker(); }
      const b = e.target.closest('[data-ca]'); if (!b) return;
      if (b.dataset.ca === 'close') { closePicker(); err(''); }
      if (b.dataset.ca === 'refresh') { b.textContent = 'Actualisation…'; await loadPeople(); b.textContent = 'Actualiser la liste'; paintPicker(); }
    });
    if (!people.length || peopleErr) { await loadPeople(); paintPicker(); }
  }
  function fieldRow(f, label, extra) {
    return `<div class="mc-row mc-f" data-f="${f}"><label>${label}</label><div class="mc-fb"><span id="mc-ch-${f}" class="mc-chs"></span><input id="mc-in-${f}" data-in="${f}" type="text" inputmode="email" autocomplete="off" autocapitalize="off" spellcheck="false"></div>${extra || ''}</div>`;
  }
  function openCompose(pre = {}) {
    closeCompose();
    const d = pre.fresh ? {} : LS(draftKey(), {});
    C = { to: pre.to || d.to || [], cc: d.cc || [], bcc: d.bcc || [], subject: pre.subject ?? d.subject ?? '', text: pre.text ?? d.text ?? '', att: pre.att || d.att || null };
    const el = document.createElement('div'); el.id = 'mailCompose';
    el.innerHTML = `<div class="mc-card"><div class="mc-bar"><button type="button" data-a="back" aria-label="Retour">${IC.back}</button><span class="mc-sp"></span>
      <button type="button" data-a="clip" aria-label="Joindre un rapport">${IC.clip}</button><button type="button" data-a="send" class="mc-go" aria-label="Envoyer">${IC.send}</button><button type="button" data-a="more" aria-label="Plus">${IC.more}</button></div>
      <div class="mc-menu hidden" id="mcMenu"><button type="button" data-a="cc">Ajouter Cc / Cci</button><button type="button" data-a="drop">Supprimer le brouillon</button></div>
      <div class="mc-row"><label>De</label><b class="mc-from">${esc(myMail() || '—')}</b><span class="mc-chev">${IC.down}</span></div>
      ${fieldRow('to', 'À', `<button type="button" class="mc-chev mc-pk" data-a="contacts" aria-label="Choisir dans les contacts">${IC.users}</button><button type="button" class="mc-chev" data-a="cc" aria-label="Cc / Cci">${IC.down}</button>`)}
      <div id="mcCcWrap" class="${C.cc.length || C.bcc.length ? '' : 'hidden'}">${fieldRow('cc', 'Cc', `<button type="button" class="mc-chev mc-pk" data-a="contacts-cc" aria-label="Choisir dans les contacts">${IC.users}</button>`)}${fieldRow('bcc', 'Cci', `<button type="button" class="mc-chev mc-pk" data-a="contacts-bcc" aria-label="Choisir dans les contacts">${IC.users}</button>`)}</div>
      <div id="mcSug" class="mc-sug hidden"></div>
      <input id="mcSubj" class="mc-subj" placeholder="Objet" value="${esc(C.subject)}">
      <div id="mcAtt"></div>
      <textarea id="mcText" class="mc-text" placeholder="Rédigez votre message">${esc(C.text)}</textarea>
      <div id="mcErr" class="mc-err hidden"></div>
      <div id="mcPick" class="mc-pick hidden"><b>Joindre un rapport</b><div class="mc-pr"><select id="mcPT"><option>DPR</option><option>PPS</option></select><input type="date" id="mcPD"><button type="button" data-a="attach">Joindre</button></div></div></div>`;
    document.body.appendChild(el);
    loadPeople().then(() => { const sg = $('mcSug'); if (sg && C && document.activeElement && document.activeElement.dataset && document.activeElement.dataset.in) suggest(document.activeElement.dataset.in); });
    paintChips(); paintAtt(); $('mcPD').value = window.CATficheDay ? window.CATficheDay() : new Date().toISOString().slice(0, 10);
    el.addEventListener('click', onComposeClick);
    el.addEventListener('input', e => {
      if (e.target.id === 'mcSubj') C.subject = e.target.value; else if (e.target.id === 'mcText') C.text = e.target.value;
      else if (e.target.dataset.in) { const f = e.target.dataset.in; if (/[\s,;]$/.test(e.target.value)) commit(f); suggest(f); return; }
      draftSave();
    });
    el.addEventListener('focusin', e => { if (e.target.dataset && e.target.dataset.in) suggest(e.target.dataset.in); else $('mcSug') && $('mcSug').classList.add('hidden'); });
    el.addEventListener('focusout', e => { if (e.target.dataset && e.target.dataset.in) { const f = e.target.dataset.in; setTimeout(() => { if (C && !(document.activeElement && document.activeElement.closest && document.activeElement.closest('#mcSug'))) commit(f); }, 200); } });
    el.addEventListener('keydown', e => { if (e.target.dataset && e.target.dataset.in && (e.key === 'Enter' || e.key === ',')) { e.preventDefault(); commit(e.target.dataset.in); } });
    setTimeout(() => { const t = $('mc-in-to'); if (t && !C.to.length) t.focus(); else if ($('mcText')) $('mcText').focus(); }, 60);
    return el;
  }
  async function attach(type, date) {
    if (!C) return;
    if (!window.CATreport) return err('Rapports indisponibles.');
    const r = await window.CATreport(type, date);
    if (!r) return err('Aucune fiche enregistrée à la date du ' + date + '.');
    C.att = { type, date, name: type + '_MAHANORO_' + date + '.pdf', html: r.html, summary: r.summary };
    const T = r.tpl;   // modèle A/B du cahier des charges (dates d'envoi et de réalisation distinctes)
    if (!C.subject.trim()) { C.subject = T ? T.subject : type + ' MAHANORO ' + date; $('mcSubj').value = C.subject; }
    if (!C.text.trim()) { C.text = T ? T.text : 'Bonjour,\n\nVeuillez trouver ci-joint le ' + type + ' de la centrale de Mahanoro du ' + date + '.\n\n' + r.summary + '\n\nCordialement,\n' + myName(); $('mcText').value = C.text; }
    err(''); paintAtt(); $('mcPick').classList.add('hidden'); draftSave();
  }
  async function doSend() {
    for (const f of ['to', 'cc', 'bcc']) if (!commit(f)) return;
    if (!C.to.length) return err('Ajoutez au moins un destinataire (une vraie adresse e-mail).');
    if (!C.subject.trim() && !confirm('Envoyer ce message sans objet ?')) return;
    if (!C.text.trim() && !C.att) return err('Le message est vide.');
    const m = { kind: 'mail', mid: uid8(), uid: me(), nom: myName(), from: myMail(), to: C.to.join(','), cc: C.cc.slice(), bcc: C.bcc.slice(), subject: C.subject.trim(), text: C.text, att: C.att,
      ts: Date.now(), state: navigator.onLine ? 'sending' : 'queued', _rk: 'mail:' + me() + ':' + uid8() };
    await db.messages.add(m);
    localStorage.removeItem(draftKey()); closeCompose(); tab = 'out'; await load(); render(); toast(navigator.onLine ? 'Envoi en cours…' : 'Hors ligne : il partira au retour du réseau');
    deliver(m.mid, true);
  }
  function onComposeClick(e) {
    const sg = e.target.closest('[data-sg]'); if (sg) { const f = $('mcSug').dataset.f || 'to'; if (!C[f].includes(sg.dataset.sg)) C[f].push(sg.dataset.sg); $('mc-in-' + f).value = ''; paintChips(); $('mcSug').classList.add('hidden'); draftSave(); return; }
    const rm = e.target.closest('[data-rm]'); if (rm) { const [f, i] = rm.dataset.rm.split(':'); if (f === 'att') { C.att = null; paintAtt(); } else { C[f].splice(+i, 1); paintChips(); } draftSave(); return; }
    const b = e.target.closest('button'); if (!b) { $('mcMenu').classList.add('hidden'); return; } const a = b.dataset.a; if (!a) return;
    $('mcMenu').classList.add('hidden');
    if (a === 'back') { const has = C.to.length || C.subject || C.text || C.att; if (has) { draftSave(); toast('Brouillon conservé'); } closeCompose(); }
    else if (a === 'send') doSend();
    else if (a === 'clip') $('mcPick').classList.toggle('hidden');
    else if (a === 'attach') attach($('mcPT').value, $('mcPD').value);
    else if (a === 'more') $('mcMenu').classList.toggle('hidden');
    else if (a === 'cc') $('mcCcWrap').classList.toggle('hidden');
    else if (a === 'contacts') openPicker('to');
    else if (a === 'contacts-cc') openPicker('cc');
    else if (a === 'contacts-bcc') openPicker('bcc');
    else if (a === 'drop') { localStorage.removeItem(draftKey()); closeCompose(); toast('Brouillon supprimé'); }
  }
  window.CATcompose = async opt => {
    if (!isChef()) return;
    if (window.goToPage) window.goToPage('page-messages');
    openCompose({ fresh: true });
    if (opt && opt.type) await attach(opt.type, opt.date || (window.CATficheDay ? window.CATficheDay() : ''));
  };

  // ====================== DÉMARRAGE ======================
  window.CATmsgShow = async () => { await load(); render(); await loadPeople(); render(); flush(); };
  window.addEventListener('cat-synced', () => { refresh(true); flush(); });
  window.addEventListener('online', flush);
  setInterval(flush, 60000);
  setTimeout(async () => { await load(); render(); if (isChef()) loadPeople(); flush(); }, 1800);
});
