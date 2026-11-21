// CAT by Manda V4.7 - Génération PDF des rapports DPR / PPS, SANS bibliothèque externe (marche hors ligne).
// Principe : le rapport HTML est dessiné par le navigateur (SVG foreignObject -> canvas -> JPEG),
// puis les images sont assemblées dans un vrai fichier PDF (A4 paysage, une page par tranche de hauteur).
// Le PDF obtenu est donc fidèle à l'écran (texte non sélectionnable). Si le navigateur refuse, l'appelant retombe sur le HTML.
(function () {
  const enc = new TextEncoder();
  const PW = 842, PH = 595;   // A4 paysage en points (1/72 pouce)

  function buildPdf(pages) {   // pages : [{ jpeg: Uint8Array, w, h }]  (chaque image couvre toute la page)
    const parts = [], offs = []; let len = 0;
    const push = x => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; };
    const obj = (n, head, stream) => {
      offs[n] = len; push(n + ' 0 obj\n' + head);
      if (stream) { push('\nstream\n'); push(stream); push('\nendstream'); }
      push('\nendobj\n');
    };
    push(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));   // %PDF-1.4 + commentaire binaire
    const n = pages.length, total = 2 + 3 * n;
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Kids [' + pages.map((_, i) => (3 + 3 * i) + ' 0 R').join(' ') + '] /Count ' + n + ' >>');
    pages.forEach((p, i) => {
      const pg = 3 + 3 * i, ct = pg + 1, im = pg + 2, content = enc.encode('q ' + PW + ' 0 0 ' + PH + ' 0 0 cm /Im0 Do Q');
      obj(pg, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PW + ' ' + PH + '] /Resources << /XObject << /Im0 ' + im + ' 0 R >> >> /Contents ' + ct + ' 0 R >>');
      obj(ct, '<< /Length ' + content.length + ' >>', content);
      obj(im, '<< /Type /XObject /Subtype /Image /Width ' + p.w + ' /Height ' + p.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + p.jpeg.length + ' >>', p.jpeg);
    });
    const xref = len;
    let x = 'xref\n0 ' + (total + 1) + '\n0000000000 65535 f \n';
    for (let i = 1; i <= total; i++) x += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
    push(x + 'trailer\n<< /Size ' + (total + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    let size = 0; parts.forEach(p => size += p.length);
    const out = new Uint8Array(size); let k = 0; parts.forEach(p => { out.set(p, k); k += p.length; });
    return out;
  }

  const loadImg = src => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ko(new Error('Rendu du rapport impossible')); i.src = src; });
  const toJpeg = (cv, q) => new Promise((ok, ko) => cv.toBlob(b => b ? b.arrayBuffer().then(a => ok(new Uint8Array(a))) : ko(new Error('Image vide')), 'image/jpeg', q));

  // html -> [{jpeg,w,h}] ; targetW = largeur en pixels de chaque page ; q = qualité JPEG
  async function rasterize(html, targetW, q) {
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-20000px;top:0;display:inline-block;box-sizing:border-box;padding:16px;background:#fff;color:#000';
    host.innerHTML = html; document.body.appendChild(host);
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const r = host.getBoundingClientRect(), W = Math.ceil(r.width);
      host.style.width = W + 'px';
      const H = Math.ceil(host.getBoundingClientRect().height);
      const clone = host.cloneNode(true);
      clone.style.cssText = 'display:block;box-sizing:border-box;padding:16px;background:#fff;color:#000;width:' + W + 'px';
      const xml = new XMLSerializer().serializeToString(clone);
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '"><foreignObject x="0" y="0" width="100%" height="100%">' + xml + '</foreignObject></svg>';
      const img = await loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
      const pageH = W * PH / PW;                      // hauteur d'une page A4 paysage, en pixels du rapport
      const s = targetW / W, cw = Math.round(targetW), ch = Math.round(pageH * s), out = [];
      const page = async (sy, sh, k) => {             // k = réduction pour faire tenir une page
        const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
        const c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, cw, ch);
        const dw = W * s * k, dx = (cw - dw) / 2;
        c.drawImage(img, 0, sy, W, sh, dx, 0, dw, sh * s * k);
        out.push({ jpeg: await toJpeg(cv, q), w: cw, h: ch });
      };
      if (H <= pageH * 1.25) await page(0, H, H > pageH ? pageH / H : 1);    // une seule page (légèrement réduite si besoin)
      else for (let y = 0; y < H - 4; y += pageH) await page(y, Math.min(pageH, H - y), 1);
      return out;
    } finally { host.remove(); }
  }

  // Retourne un Uint8Array (PDF). Réduit la résolution si le fichier dépasse ~1,9 Mo (limite de l'envoi e-mail).
  async function fromHtml(html) {
    let last = null;
    for (const [w, q] of [[2200, 0.85], [1700, 0.8], [1300, 0.72], [1000, 0.65]]) {
      last = buildPdf(await rasterize(html, w, q));
      if (last.length < 1900000) break;
    }
    return last;
  }
  const b64 = u => { let s = ''; const n = 0x8000; for (let i = 0; i < u.length; i += n) s += String.fromCharCode.apply(null, u.subarray(i, i + n)); return btoa(s); };
  function download(bytes, name) {
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  window.CATpdf = { fromHtml, b64, download, _build: buildPdf };
})();
