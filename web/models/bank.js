/* bank (2×1, Bank Negara, CBD) — spek-gaya §6 no. 24. Kantor cabang bank pemerintah khas Indonesia, 2 lantai (lantai dasar
   LANTAI_USAHA 4,2 + 3,2). floorsFor('bank') = 1 (server), tetapi spek §6 menetapkan 2–3 lantai → n = maks(2, floors) (lihat laporan).
   Dinding krem '#E2D6B8' + pita emas ,3 di atas lantai dasar + lis mahkota emas; pintu kaca dobel + boven, 2 etalase (teller),
   jendela atas bertopi, papan nama 'BANK NEGARA' + logo bulat emas, ATM, AC, pagar besi + gerbang, 2 pot, talang, lampu dinding.
   Varian seed: 0 serambi raksasa 6 kolom bulat 2 lantai + entablatur + pediment segitiga berlogo ·
     1 modern: kanopi beton menerus + fasia aksen bernama + 4 kolom ramping + pita kaca lantai atas + galeri ATM ·
     2 kolonial: atap limasan genteng (pelana sejajar deret bila adj) + serambi 4 kolom berbalkon tembok di lantai 2 + pintu balkon ·
     3 deret 3 unit muka (parapet beda tinggi): ATM center | pintu utama berpapan | etalase teller, kanopi cor per unit.
   Deret (ROW_TYPES, adj): sisi itu rapat ke batas kavling, tanpa tonjolan (pita/lis/pagar/atap). Semua bagian di dalam kavling. */
function bank_lod(n0){ for (let k = n0; k < P.length; k++) P[k].lod = 1; }
// mesin ATM berdiri (kios kecil): badan + layar kaca + papan 'ATM' (menghadap +z lokal)
function bank_atm(x, z, rot, c){ const f = rangka(x, 0, z, rot);
  taruh(f, 'box', 1.3, 2.5, 1.0, 0, 1.25, 0, '#D9D4C8', { slot: 0 });
  taruh(f, 'box', 1.5, .14, 1.2, 0, 2.57, 0, c, { slot: 1 });
  taruh(f, 'box', .9, 1.5, .06, 0, 1.0 + .75, .5, KACA[1], { slot: 0, attach: 'z+' });
  taruh(f, 'box', .5, .32, .05, 0, 1.55, .54, '#3E6FB0', { glow: true });
  _teks(f, 'ATM', 0, 2.12, .51, .8, .26, c); }
// jendela samping hemat: kusen 1 kotak + kaca + ambang opsional (lod 1) = 24–36 segitiga (jendelaKecil + palang = 48)
function bank_jendela(x, y, z, rot, w, h, cW, o){ const f = rangka(x, y, z, rot);
  taruh(f, 'box', w + .16, h + .16, .07, 0, h / 2, 0, KUSEN, { attach: 'z+', slot: 0 });
  _kaca(f, w, h, 0, 0, .02);
  if (o && o.ambang) taruh(f, 'box', w + .26, .12, .16, 0, -.05, .05, darken(cW, .8), { attach: 'z+', slot: 0, lod: 1, noEdge: true });
  if (o && o.teralis) _jeruji(f, w - .04, h - .04, 0, .02, .1, Math.max(4, Math.round(w / .24)), BESI, { satu: 1, rel: .05, batang: .04, lod: 1 }); }
// ATM kios muat di sebelah kanan serambi? (seed 0/2) — dipakai juga untuk meniadakan jendela sayap di belakang ATM (seed 0)
function bank_atmMuat(s, bw, X1, aR, cx){ const pwk = s === 0 ? Math.min(8.4, bw - 1.2) + .4 : Math.min(5.6, bw - 1.6) + .3, xa = X1 - (aR ? 1.0 : .85);
  return xa - .65 > cx + pwk / 2 + .2; }
CAT.bank.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, A = ctx.adj || {}, aL = !!A.l, aR = !!A.r;
  const LW = fx + .8, LD = fz + .8, n = clamp(Math.max(2, floors || 2), 2, 3), H = LANTAI_USAHA + (n - 1) * LANTAI;
  const X0 = aL ? -LW / 2 : -LW / 2 + .4, X1 = aR ? LW / 2 : LW / 2 - .4, bw = X1 - X0, cx = (X0 + X1) / 2;
  const zb = -LD / 2 + .4, zf = LD / 2 - 2.3, bd = zf - zb, zc = (zf + zb) / 2, zP = LD / 2 - .16;
  const cW = '#E2D6B8', EMAS = '#C2913A', cPl = '#9E9A90', yF = k => LANTAI_USAHA + (k - 1) * LANTAI;
  const sempit = bw < 11;
  // ---- badan ----
  if (s !== 3){
    dinding(bw, H, bd, cx, 0, zc, cW, { plinth: .6, cPlinth: cPl, adj: A, slot: 0 });
    const [ew, ex] = _ext(bw, .05, A); taruh(rangka(cx, 0, zc, 0), 'box', ew, .3, bd + .1, ex, LANTAI_USAHA - .05, 0, EMAS, { slot: 0 });
  }
  // ---- lantai dasar (seed 0–2): pintu kaca dobel di sumbu + 2 etalase + jendela sayap ----
  const ewid = clamp(bw / 2 - 1.15 - .3 - .45, 1.0, 2.5), exc = 1.05 + .1 + (ewid + .3) / 2, xWing = 1.05 + .2 + ewid + .3 + .1 + .66;
  const wing = bw / 2 - xWing > .3 && s !== 3;
  if (s !== 3){
    pintu(cx, zf, { w: 1.8, h: 2.5, y: .3, daun: 2, kaca: true, c: '#3A3F44', kusen: BINGKAI, wall: cW, boven: true });
    for (const sx of [-1, 1]) etalase(cx + sx * exc, zf, { w: ewid, h: 2.5, y: .6, wall: cW, ambang: cPl, bagi: 1.3, teks: sx < 0 && s === 1 ? 'TELLER' : null });
    if (wing) for (const sx of [-1, 1]) if (!(s === 0 && sx > 0 && bank_atmMuat(s, bw, X1, aR, cx))) jendela(cx + sx * (bw / 2 - (bw / 2 - xWing) / 2 - .1), 1.0, zf, { w: 1.1, h: 2.0, wall: cW, topi: true, cTopi: '#D9CDB0', kusen: KUSEN });
  }
  // ---- lantai atas: deret jendela bertopi ----
  if (s !== 3) for (let k = 1; k < n; k++){ const y = yF(k), nw = Math.max(2, Math.round(bw / 2.55));
    for (let i = 0; i < nw; i++){ const x = cx - bw / 2 + bw * (i + .5) / nw;
      if (s === 2 && Math.abs(x - cx) < 1.4 && k === 1) continue;   // tempat pintu balkon
      if (s === 1) continue;
      jendela(x, y + .75, zf, { w: 1.1, h: 1.75, wall: cW, topi: s !== 2, cTopi: '#D9CDB0', daun: s === 2 ? '#5E7A6A' : false, kusen: KUSEN }); }
    if (s === 1){   // pita kaca + mullion
      taruh(rangka(cx, 0, zf, 0), 'box', bw - (aL ? .6 : .9) - (aR ? .6 : .9), 1.8, .1, (aL ? .3 : .45) - (aR ? .3 : .45), y + .7 + .9, .02, KACA[0], { glow: true });
      _jeruji(rangka(cx, 0, zf + .08, 0), bw - 1.8, 1.8, 0, y + .7, 0, Math.round(bw / 1.5) + 1, '#5E666C', { satu: 1, rel: 0, batang: .06, lod: 1 }); } }
  // dinding samping panjang (muka sempit, facing 1: bd > 8; sisi deret tidak): lantai dasar 2 jendela berteralis + ambang, lantai atas 3 jendela,
  // pita ambang menerus di lantai atas, AC luar berak di lantai dasar, talang belakang, kisi ventilasi — revisi r1: sisi tidak polos & anggaran turun.
  if (bd > 8){ const zw = [zb + bd * .27, zb + bd * .73];
    for (const sx of [-1, 1]){ if ((sx < 0 && aL) || (sx > 0 && aR)) continue; const X = sx < 0 ? X0 : X1, rot = sx * Math.PI / 2;
      for (const z of zw) bank_jendela(X, 1.1, z, rot, 1.5, 1.7, cW, { ambang: true, teralis: true });   // lantai dasar: teralis besi (khas kantor bank)
      for (let f = 1; f < n; f++) for (const t of [.18, .5, .82]) bank_jendela(X, yF(f) + .9, zb + bd * t, rot, 1.3, 1.4, cW, {});
      const fs = rangka(X, 0, zc, rot); const n0 = P.length;
      for (let f = 1; f < n; f++) taruh(fs, 'box', bd - 1.4, .12, .12, 0, yF(f) + .78, .06, '#D9CDB0', { slot: 0, attach: 'z+', noEdge: true });
      taruh(fs, 'box', 1.6, .5, .05, 0, 3.55, .02, '#8E8A84', { slot: 0, attach: 'z+', noEdge: true });   // kisi ventilasi di atas AC
      bank_lod(n0);
      if (s !== 2) ac(X, 2.45, zc + .45 * sx, { rot, rak: true, lod: 1 });
      const q = talang(X, 0, H - .1, { z: zb + .35, rot }); q.lod = 1; } }
  if (s !== 0) for (let f = 1; f < n; f++) for (const t of s === 3 && bd > 8 ? [0] : [-.25, .25]) bank_jendela(cx + t * bw, yF(f) + .9, zb, Math.PI, 1.0, 1.3, cW, { ambang: true });
  // ---- per seed ----
  const NAMA = 'BANK NEGARA';
  if (s === 0){   // serambi raksasa + pediment
    const pw = Math.min(8.4, bw - 1.2), nc = pw >= 7 ? 6 : 4, zk = zf + 1.15, hc = 6.9 - .3, ff = rangka(cx, 0, zf, 0);
    taruh(ff, 'box', pw + .4, .3, 1.55, 0, .15, .75, '#CFC9BC', { slot: 0 });   // r1: anak tangga kedua dihapus (anggaran 5 %)
    for (let i = 0; i < nc; i++){ const x = cx - pw / 2 + .35 + (pw - .7) * i / (nc - 1); cylLo(.28, hc, x, .3, zk, '#ECE6D8');
      const n0 = P.length; box(.72, .22, .72, x, 6.68, zk, '#D9D4C8'); bank_lod(n0); }
    taruh(ff, 'box', pw + .4, .72, 1.5, 0, 6.9 + .36, .7, '#ECE6D8', { slot: 0 });
    taruh(ff, 'box', pw + .5, .14, 1.6, 0, 7.62 + .07, .72, EMAS, { slot: 0 });
    taruh(rangka(cx, 7.76, zf + .7, Math.PI / 2), 'prism', 1.45, 1.35, pw + .4, 0, .675, 0, '#ECE6D8', { slot: 0 });
    teks(NAMA, cx, 7.05, zf + 1.45, { tinggi: .36, lebarMaks: pw - 1, c: '#8E6A2A', dz: .01 });
    taruh(rangka(cx, 7.76, zf + 1.45, 0), 'sphLo', .7, .7, .16, 0, .5, 0, EMAS, { slot: 0 });
  } else if (s === 1){   // kanopi beton menerus + fasia aksen
    const kd = 1.75, ky = 3.55, kw = bw - (aL ? 0 : .1) - (aR ? 0 : .1), kx = cx + ((aL ? 0 : .05) - (aR ? 0 : .05)), ff = rangka(kx, 0, zf, 0);
    taruh(ff, 'box', kw, .3, kd + .05, 0, ky + .15, (kd - .05) / 2, '#CFC9BC', { slot: 0 });
    taruh(ff, 'box', kw, .75, .3, 0, ky + .1 + .375, kd - .15, c, { slot: 1 });
    teks(NAMA, cx - 1.0, ky + .3, zf + kd, { tinggi: .4, lebarMaks: Math.min(6, kw - 3), c: '#EDE8DC', dz: .01 });
    taruh(rangka(cx + Math.min(3.6, kw / 2 - 1.2), ky + .47, zf + kd, 0), 'sphLo', .55, .55, .14, 0, 0, .02, EMAS, { slot: 0 });
    for (const sx of [-1, 1]) for (const t of [.12, .4]) if (!sempit || t > .3) taruh(ff, 'box', .26, ky, .26, sx * kw * t + (sx < 0 ? 0 : 0), ky / 2, kd - .3, '#D9D4C8', { slot: 0 });
    for (const k of [-1, 0, 1]) taruh(rangka(cx + k * kw * .26, ky - .03, zf + .9, 0), 'box', .3, .05, .3, 0, 0, 0, LAMPU, { glow: true, noEdge: true });
    // sirip emas tegak di muka lantai atas
    for (const sx of [-1, 1]) taruh(rangka(cx + sx * (bw / 2 - .45), LANTAI_USAHA + .1, zf, 0), 'box', .3, H - LANTAI_USAHA + .3, .3, 0, (H - LANTAI_USAHA + .3) / 2, .1, EMAS, { slot: 0, attach: 'z+' });
  } else if (s === 2){   // kolonial: serambi 4 kolom berbalkon
    const pw = Math.min(5.6, bw - 1.6), zk = zf + 1.35, ff = rangka(cx, 0, zf, 0);
    taruh(ff, 'box', pw + .3, .3, 1.7, 0, .15, .83, '#CFC9BC', { slot: 0 }); taruh(ff, 'box', 2.2, .15, .3, 0, .075, 1.83, '#BFB6A8', { slot: 0 });
    for (let i = 0; i < 4; i++){ const x = cx - pw / 2 + .3 + (pw - .6) * i / 3; cylLo(.22, LANTAI_USAHA - .3, x, .3, zk, '#ECE6D8'); const n0 = P.length; box(.55, .2, .55, x, .3, zk, '#D9D4C8'); bank_lod(n0); }
    balkon(cx, LANTAI_USAHA, zf, { w: pw + .3, jorok: 1.65, gaya: 'tembok', cTembok: cW, cLantai: '#D9D4C8', konsol: false });
    pintu(cx, zf, { y: LANTAI_USAHA + .15, w: 1.6, h: 2.3, daun: 2, c: '#5E7A6A', kusen: KUSEN, wall: cW, panel: true });
    teks(NAMA, cx, LANTAI_USAHA + .35, zf + 1.66, { tinggi: .32, lebarMaks: pw - .6, c: '#8E6A2A', dz: .01 });
  } else {   // s3: 3 unit muka
    const nu = sempit ? 2 : 3, uw = bw / nu, cols = ['#E2D6B8', '#D8CBB2', '#E6E2D8'];
    for (let k = 0; k < nu; k++){ const ux = X0 + uw * (k + .5), uA = { l: k === 0 ? aL : 1, r: k === nu - 1 ? aR : 1 }, col = cols[k % 3], ph = [.9, 1.5, .6][k % 3], J = nu === 2 ? ['pintu', 'atm'][k] : ['atm', 'pintu', 'teller'][k];
      dinding(uw, H, bd, ux, 0, zc, col, { plinth: .6, cPlinth: cPl, adj: uA, slot: 0 });
      const [ew, ex] = _ext(uw, .05, uA); taruh(rangka(ux, 0, zc, 0), 'box', ew, .3, bd + .1, ex, LANTAI_USAHA - .05, 0, EMAS, { slot: 0 });
      atapDatar(uw, bd, ux, H, zc, { parapet: ph, cParapet: col, c: '#B8B2A6', adj: uA });
      if (J === 'pintu'){ pintu(ux, zf, { w: 1.8, h: 2.5, y: .3, daun: 2, kaca: true, c: '#3A3F44', kusen: BINGKAI, wall: col, boven: true });
        taruh(rangka(ux, 0, zf, 0), 'box', 2.6, .3, 1.0, 0, .15, .5, '#CFC9BC', { slot: 0 });
        papanNama(ux, 3.35, zf, { w: uw - .6, h: .7, c, slot: 1, teks: NAMA, cTeks: '#EDE8DC', bingkai: EMAS }); }
      else if (J === 'atm'){ etalase(ux, zf, { w: uw - 1.0, h: 2.4, y: .5, wall: col, ambang: cPl, teks: 'ATM 24 JAM', cTeks: '#3E5A82', bagi: 1.6 });
        for (const dx of [-.8, .8]) taruh(rangka(ux + dx, 0, zf - .4, 0), 'box', .8, 1.9, .5, 0, .95, 0, '#BFC3C6', { slot: 0, lod: 1 }); }
      else etalase(ux, zf, { w: uw - 1.0, h: 2.4, y: .6, wall: col, ambang: cPl, teks: 'TELLER', bagi: 1.3 });
      if (J !== 'pintu'){ const ff = rangka(ux, 0, zf, 0); taruh(ff, 'box', uw - .2, .2, 1.0, 0, 3.45, .48, '#CFC9BC', { slot: 0 }); }
      for (let f = 1; f < n; f++) for (const sx of [-1, 1]) jendela(ux + sx * uw * .22, yF(f) + .75, zf, { w: 1.1, h: 1.7, wall: col, topi: true, cTopi: darken(col, .9), kusen: KUSEN });
    }
    taruh(rangka(X0 + uw * 1.5 - (nu === 2 ? uw / 2 : 0), H + [.9, 1.5, .6][1], zf - .1, 0), 'sphLo', .8, .8, .2, 0, .36, 0, EMAS, { slot: 0 });   // logo di atas parapet tengah
  }
  // ---- atap (seed 0–2) ----
  if (s === 0 || s === 1) atapDatar(bw, bd, cx, H, zc, { parapet: s === 0 ? .9 : .6, c: '#B8B2A6', cParapet: s === 1 ? '#D9D4C8' : cW, adj: A });
  if (s === 0){ const [lw, lx] = _ext(bw, .08, A); taruh(rangka(cx, H + .9, zf - .1, 0), 'box', lw, .14, .26, lx, .07, .02, EMAS, { slot: 0 }); }
  if (s === 2){ const ov = .35, cR = gt || '#8E3E34';
    if (aL || aR) atapPelana(bw, bd, cx, H, zc, { sudut: 30, overhang: ov, ovL: aL ? 0 : ov, ovR: aR ? 0 : ov, c: cR, cWall: cW });
    else atapLimasan(bw, bd, cx, H, zc, { sudut: 30, overhang: ov, c: cR, cWall: cW }); }
  if (s !== 2){ tandon(cx + bw * .3, H + .12, zb + 1.2, { c: s % 2 ? 'biru' : '#D9762B', kaki: .6 }); ac(cx - bw * .25, H + .12, zb + .6, {}); ac(cx - bw * .25 + 1.0, H + .12, zb + .6, {}); }
  else { if (!aL) ac(X0, 1.2, zc - .8, { rot: -Math.PI / 2 }); if (!aR) ac(X1, 1.2, zc - .8, { rot: Math.PI / 2 }); if (aL && aR) ac(cx + bw * .3, yF(1) + .2, zb, { rot: Math.PI }); }
  // ---- halaman: pagar besi + gerbang, ATM kios, pot, lampu, talang ----
  const pl = aL ? -LW / 2 : -LW / 2 + .15, pr = aR ? LW / 2 : LW / 2 - .15;
  pagarHalaman(pr - pl, zP, { x0: (pl + pr) / 2, gaya: 'besi', h: .95, gerbang: true, gW: 2.4, gx: cx, pilar: 2.6, c: '#CFC9BC', cPilar: '#D9D4C8', adj: A, cGerbang: '#3A3D40' });
  if ((s === 0 || s === 2) && bank_atmMuat(s, bw, X1, aR, cx)) bank_atm(X1 - (aR ? 1.0 : .85), zf + .75, 0, c);
  { const n0 = P.length; const ppx = s === 0 ? Math.min(8.4, bw - 1.2) / 2 + .55 : s === 2 ? Math.min(5.6, bw - 1.6) / 2 + .45 : 1.6;
    for (const sx of [-1, 1]) pot(cx + sx * Math.min(ppx, bw / 2 - .4), zf + .45, 1.05, { kotak: true, c: '#8E8A84', bunga: sx > 0 ? '#C9708A' : null }); bank_lod(n0); }
  for (const sx of [-1, 1]) if (s === 1 || s === 2) lampuDinding(cx + sx * (exc + ewid / 2 + .45), 3.15, zf, {});
  if (!aL) talang(X0, 0, H - .1, { z: zf - .3, rot: -Math.PI / 2 }); if (!aR) talang(X1, 0, H - .1, { z: zf - .3, rot: Math.PI / 2 });
};
