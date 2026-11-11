/* rs (2×2) — spek-gaya §6 no. 13 + spek-tata-kota setback gedung (depan 2,4 · samping 1,2 · belakang 1,0).
   Rumah sakit daerah Indonesia, 3 lantai (ring luar) / 5 lantai (pusat) dari floorsFor: lantai dasar LANTAI_USAHA 4,2 + 3,2 per lantai.
     blok utama 13,6×8,0 dinding putih tulang #DDD9CE + pita biru #4C6A96 ,4 (di atas lantai dasar & di bawah parapet), 5 jendela/lantai
     di muka, jendela kecil di samping & belakang, AC luar 6, talang, parapet 1,0.
     sayap UGD 1 lantai 6,0×3,6 menjorok ke depan (sisi kanan/kiri menurut seed) + kanopi beton 5,4×2,8 di 4 kolom bulat + papan merah 'UGD'
       + pintu kaca geser + ambulans di bawah kanopi.
     lobi: pintu kaca dobel + boven, etalase kaca, kanopi beton berkolom bertuliskan 'LOBI', anak tangga + ram.
     atap: helipad (lingkaran + 'H'), ruang mesin lift, 2 toren, papan '+' merah 2,0 di atas parapet / di menara inti (seed 2–3), papan nama.
     halaman: pagar besi 2 ruas (gerbang lebar UGD + gerbang lobi), tiang bendera, 2 pohon, motor parkir, bangku, pot.
   Varian seed: bit 0 = UGD kanan/kiri (cermin) · bit 1 = blok polos (jendela berluifel / pita spandrel biru) vs menara inti tangga
     menjorok di tengah muka (kaca tegak + '+' di puncak menara, menjulang 1,6 di atas atap).
   Semua bagian di dalam kavling (pagar di z = LD/2 − ,2); muka +z menghadap jalan. Detail kecil lod 1. */
function rs_lod(n0){ for (let k = n0; k < P.length; k++) P[k].lod = 1; }
// ambulans (van putih bergaris merah, lampu rotator biru) — panjang di sumbu x lokal, kepala di +x
function rs_ambulans(x, z, rot){ const f = rangka(x, 0, z, rot), cW = '#E8E6DF';
  taruh(f, 'box', 3.1, 1.75, 1.9, -.55, .38 + .875, 0, cW, { slot: 0 });                // ruang pasien
  taruh(f, 'box', 1.2, 1.15, 1.86, 1.6, .38 + .575, 0, cW, { slot: 0 });               // kabin depan
  taruh(f, 'box', .06, .6, 1.6, 2.19, 1.25, 0, '#55687A', { slot: 0, attach: 'x-' });   // kaca depan
  taruh(f, 'box', 3.12, .22, 1.92, -.55, 1.15, 0, '#B5473A', { slot: 0, noEdge: true }); // garis merah
  for (const sz of [-1, 1]) taruh(f, 'box', .9, .5, .04, 1.55, 1.25, sz * .94, '#55687A', { slot: 0, noEdge: true });
  const n0 = P.length;
  for (const a of [-1.45, 1.45]) for (const b of [-.78, .78]) taruh(f, 'box', .66, .66, .26, a, .33, b, '#1E1C1A', { slot: 0, noEdge: true });
  taruh(f, 'box', .9, .18, .4, .55, 2.22, 0, '#3E6FB0', { slot: 0, glow: true, c2: '#7FA6D8' });
  _teks(f.sub(-.6, 0, .97, 0), 'AMBULANS', 0, 1.5, 0, 2.6, .32, '#B5473A');
  taruh(f, 'box', .5, .5, .04, -.6, 1.62, 0, '#B5473A', { slot: 0 }); rs_lod(n0); }
// tanda '+' merah di papan putih (w = lebar papan); di rangka f, alas dyb, bidang dz
function rs_salib(f, w, dx, dyb, dz){ const k = w * .78, t = k * .32;
  taruh(f, 'box', w, w, .16, dx, dyb + w / 2, dz + .05, '#EDEBE4', { slot: 0, attach: 'z+' });
  taruh(f, 'box', t, k, .06, dx, dyb + w / 2, dz + .15, '#B5473A', { slot: 0, noEdge: true });
  taruh(f, 'box', k, t, .06, dx, dyb + w / 2, dz + .15, '#B5473A', { slot: 0, noEdge: true }); }
CAT.rs.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, mir = s & 1 ? -1 : 1, inti = s >> 1;
  const LW = fx + .8, LD = fz + .8, n = clamp(floors || 3, 2, 6), H = LANTAI_USAHA + (n - 1) * LANTAI;
  const X = x => mir * x, R = r => mir * r;   // cermin sumbu x (sayap UGD kanan untuk mir 1)
  const cW = '#DDD9CE', BIRU = '#4C6A96', MERAH = '#B5473A', cPl = '#8E8A84';
  const x1 = LW / 2 - 1.2, bw = 2 * x1, zb = -LD / 2 + 1.0, zf = Math.min(1.0, LD / 2 - 7), bd = zf - zb, zc = (zb + zf) / 2;
  const yF = k => LANTAI_USAHA + (k - 1) * LANTAI;
  // ---- blok utama ----
  const lis = []; for (let k = 2; k < n; k++) lis.push(yF(k) - .06);
  dinding(bw, H, bd, 0, 0, zc, cW, { plinth: .6, cPlinth: cPl, lis, slot: 0 });
  for (const yb of [LANTAI_USAHA - .2, H - .5]) taruh(rangka(0, 0, zc, 0), 'box', bw + .1, .4, bd + .1, 0, yb + .2, 0, BIRU, { slot: 0, noEdge: true });
  // menara inti (seed 2–3): kotak tangga menjorok ,6 di tengah muka, menjulang 1,6 di atas atap, pita kaca tegak
  const kw = 3.0, kj = .6, kH = H + 1.6;
  if (inti){ dinding(kw, kH, bd * .5 + kj, 0, 0, zf - bd * .25 + kj / 2, '#E8E5DC', { plinth: .6, cPlinth: cPl, slot: 0 });
    taruh(rangka(0, 0, zf + kj, 0), 'box', 1.3, H - LANTAI_USAHA - .9, .1, 0, LANTAI_USAHA + .3 + (H - LANTAI_USAHA - .9) / 2, 0, KACA[0], { glow: true });
    _jeruji(rangka(0, 0, zf + kj + .06, 0), 1.3, H - LANTAI_USAHA - .9, 0, LANTAI_USAHA + .3, 0, 3, '#E8E5DC', { satu: 1, rel: 0, batang: .07, lod: 1 });
    rs_salib(rangka(0, 0, zf + kj, 0), 2.0, 0, H - .9, 0);
    taruh(rangka(0, 0, zf - bd * .25 + kj / 2, 0), 'box', kw + .2, .16, bd * .5 + kj + .2, 0, kH + .08, 0, darken('#E8E5DC', .85), { slot: 0 }); }
  // ---- jendela muka lantai atas: 5 per lantai ----
  const xs = inti ? [-5.3, -3.0, 3.0, 5.3] : [-5.4, -2.7, 0, 2.7, 5.4];
  for (let k = 1; k < n; k++){ const y = yF(k) + .9;
    for (const x of xs) jendela(x * bw / 13.6, y, zf, { w: 1.5, h: 1.5, wall: cW, kusen: '#F2F0EA', topi: s === 0, cTopi: '#E8E5DC', palang: false, palangH: s === 1, ambang: s !== 0 });
    if (s === 1) taruh(rangka(0, 0, zf, 0), 'box', bw + .06, .45, .08, 0, y - .45, .0, BIRU, { slot: 0, attach: 'z+', noEdge: true }); }
  // ---- samping & belakang: jendela kecil (tanpa ambang) + AC + talang ----
  // samping: per lantai satu pita kaca (reveal + kaca + 3 mullion = tampak 3 jendela) — hemat segitiga, garis tetap terbaca
  let nAC = 0;
  for (const sx of [-1, 1]){ const rr = sx * Math.PI / 2, g = rangka(sx * x1, 0, zc, rr), L = bd - 2.2;
    for (let k = 0; k < n; k++){ const y = k ? yF(k) + 1.0 : 1.2;
      taruh(g, 'box', L + .2, 1.5, .07, 0, y + .65, 0, darken(cW, .7), { slot: 0, attach: 'z+', ao: .8 });
      taruh(g, 'box', L, 1.3, .06, 0, y + .65, .02, KACA[0], { glow: true });
      _jeruji(g, L, 1.3, 0, y, .07, 4, '#F2F0EA', { satu: 1, rel: .06, batang: .1, lod: 1 });
      if (k && nAC < 4){ ac(sx * x1, y - .62, zb + bd * (k % 2 ? .12 : .88), { rot: rr }); nAC++; } }
    talang(sx * x1, 0, H - .1, { z: zf - .3, rot: rr }); }
  { const g = rangka(X(2.6), 0, zb, Math.PI);   // belakang: pita kaca koridor per lantai atas
    for (let k = 1; k < n; k++){ const y = yF(k) + 1.0;
      taruh(g, 'box', 5.2, 1.4, .07, 0, y + .6, 0, darken(cW, .7), { slot: 0, attach: 'z+' }); taruh(g, 'box', 5.0, 1.2, .06, 0, y + .6, .02, KACA[0], { glow: true });
      _jeruji(g, 5.0, 1.2, 0, y, .07, 4, '#F2F0EA', { satu: 1, rel: .06, batang: .1, lod: 1 }); } }
  pintu(X(-4.5), zb, { rot: Math.PI, w: 1.2, h: 2.2, c: '#7E8790', wall: cW, panel: false });
  // ---- lobi (sisi tanpa UGD) ----
  const xL = X(-2.6);
  pintu(xL, zf, { w: 2.0, h: 2.5, y: .3, daun: 2, kaca: true, c: '#3A3F44', kusen: BINGKAI, wall: cW, boven: false });
  etalase(X(-5.35), zf, { w: 2.3, h: 2.5, y: .6, wall: cW, ambang: cPl, bagi: 1.15 });
  etalase(X(-.2), zf, { w: 1.2, h: 2.5, y: .6, wall: cW, ambang: cPl, bagi: 2 });
  { const f = rangka(xL, 0, zf, 0), kd = 2.1, ky = 2.95;   // kanopi lobi
    taruh(f, 'box', 3.6, .3, kd + .04, 0, ky + .15, (kd - .04) / 2, '#E8E5DC', { slot: 0 });
    taruh(f, 'box', 3.64, .08, .1, 0, ky - .02, kd - .06, BIRU, { slot: 0, noEdge: true });
    for (const sx of [-1, 1]) taruh(f, 'box', .26, ky, .26, sx * 1.55, ky / 2, kd - .3, '#EDEBE4', { slot: 0 });
    _teks(f, 'LOBI', 0, ky + .05, kd + .005, 1.6, .2, BIRU, { lod: 1 });
    taruh(f, 'box', 3.2, .3, 1.2, 0, .15, .6, '#BFB6A8', { slot: 0 });
    taruh(f, 'box', 2.2, .15, .35, 0, .075, 1.37, darken('#BFB6A8', .92), { slot: 0 }); }
  papanNama(X(-3.9), 3.38, zf, { w: 5.4, h: .5, c: '#EDEBE4', bingkai: BIRU, teks: 'RUMAH SAKIT', cTeks: BIRU });
  lampuDinding(X(-4.15), 3.0, zf, {}); lampuDinding(X(-1.05), 3.0, zf, {});
  // ---- sayap UGD ----
  const ux0 = .8, ux1 = x1, uw = ux1 - ux0, ucx = X((ux0 + ux1) / 2), uzf = Math.min(zf + 3.6, LD / 2 - 3.4), ud = uzf - zf + .2, uzc = (uzf + zf - .2) / 2, uH = LANTAI_USAHA;
  dinding(uw, uH, ud, ucx, 0, uzc, cW, { plinth: .6, cPlinth: cPl, slot: 0 });
  taruh(rangka(ucx, 0, uzc, 0), 'box', uw + .06, .5, ud + .06, 0, uH - .3, 0, MERAH, { slot: 0, noEdge: true });
  atapDatar(uw, ud, ucx, uH, uzc, { parapet: .5, c: '#B8B2A6', cParapet: cW });
  pintu(ucx, uzf, { w: 2.2, h: 2.4, y: .15, daun: 2, kaca: true, c: '#5E666C', kusen: BINGKAI, wall: cW, boven: true });
  for (const sx of [-1, 1]) jendelaKecil(ucx + sx * 2.15, 1.1, uzf, { w: .9, h: 1.2, wall: cW, kusen: '#F2F0EA', gelap: false });
  jendelaKecil(X(ux1), 1.2, uzc, { rot: R(Math.PI / 2), w: 1.6, h: 1.2, wall: cW, ambang: false });
  { const f = rangka(ucx, 0, uzf, 0), kd = Math.min(2.8, LD / 2 - .45 - uzf), ky = 3.15, kw2 = 5.4;   // kanopi UGD
    taruh(f, 'box', kw2, .32, kd + .04, 0, ky + .16, (kd - .04) / 2, '#E8E5DC', { slot: 0 });
    taruh(f, 'box', kw2 + .04, .36, .12, 0, ky + .16, kd + .02, MERAH, { slot: 0, attach: 'z-' });
    _teks(f, 'GAWAT DARURAT', 0, ky + .05, kd + .09, kw2 - .6, .22, '#EDEBE4', { lod: 1 });
    for (const sx of [-1, 1]) for (const zz of [.35, kd - .3]) taruh(f, 'box', .28, ky, .28, sx * (kw2 / 2 - .3), ky / 2, zz, '#EDEBE4', { slot: 0 });
    taruh(f, 'box', kw2, .1, kd, 0, .05, kd / 2, '#BFB6A8', { slot: 0, noHull: true });
    taruh(rangka(ucx, 0, (uzf + kd + LD / 2 - .3) / 2, 0), 'box', 3.8, .03, LD / 2 - .3 - uzf - kd, 0, .075, 0, '#C9BFA6', { slot: 0, noHull: true, noEdge: true });
    papanNama(ucx, ky + .4, uzf, { w: 2.6, h: .62, c: MERAH, bingkai: '#EDEBE4', teks: 'UGD', cTeks: '#EDEBE4' });
    rs_ambulans(ucx, uzf + kd / 2 + .05, mir > 0 ? 0 : Math.PI); }
  // AC & kompresor di atap UGD
  ac(ucx - X(1.5), uH + .12, uzc - .2, { rot: 0 }); ac(ucx + X(.2), uH + .12, uzc - .2, { rot: 0 }); nAC += 2;
  // ---- atap blok utama ----
  atapDatar(bw, bd, 0, H, zc, { parapet: 1.0, c: '#B8B2A6', cParapet: cW, lis: true });
  const yA = H + .12;
  { const hz = zc - .3, hx = X(inti ? 2.9 : 1.2), f = rangka(hx, yA, hz, 0);   // helipad
    taruh(f, 'cylLo', 5.6, .1, 5.6, 0, .05, 0, '#5E6670', { slot: 0, noHull: true });
    const qh = _teks(f, 'H', 0, 0, 0, 1.6, 2.0, '#E6E2D8', { lod: 1 }); qh.rx = -Math.PI / 2; qh.p[1] = yA + .14; }
  { const f = rangka(X(-4.6), yA, zb + 1.6, 0);   // ruang mesin lift + tangga
    taruh(f, 'box', 2.6, 2.6, 2.4, 0, 1.3, 0, '#E8E5DC', { slot: 0, wall: true });
    taruh(f, 'box', 2.9, .15, 2.7, 0, 2.67, 0, darken('#E8E5DC', .82), { slot: 0 });
    taruh(f, 'box', .9, 2.0, .06, mir * .5, 1.0, 1.21, '#7E8790', { slot: 0, attach: 'z+' }); }
  for (const i of [0, 1]) tandon(X(-6.0 + i * 1.35), yA, zf - 1.3, { c: i ? 'biru' : '#D9762B', r: .55, h: 1.2, kaki: i ? 0 : .7 });
  antena(X(-2.9), yA + 2.75, zb + 1.2, { h: 2.6 });
  if (!inti){ const f = rangka(X(-2.6), yA, zf - .45, 0);   // papan '+' di atas parapet depan
    for (const sx of [-1, 1]) taruh(f, 'box', .12, 1.6, .12, sx * .8, .8, -.15, BESI, { slot: 0 });
    rs_salib(f, 2.0, 0, 1.0, -.1); }
  // ---- halaman depan ----
  const zP = LD / 2 - .2, xm = .4;
  pagarHalaman(LW / 2 - .15 + xm, zP, { x0: X((-LW / 2 + .15 + xm) / 2), gaya: 'besi', h: 1.0, gx: xL, gW: 2.0, pilar: 3.6, jarakBesi: .42, cPilar: '#E8E5DC', c: '#BFB6A8' });
  pagarHalaman(LW / 2 - .15 - xm, zP, { x0: X((LW / 2 - .15 + xm) / 2), gaya: 'besi', h: 1.0, gx: ucx, gW: 3.8, pilar: 3.6, jarakBesi: .42, cPilar: '#E8E5DC', c: '#BFB6A8' });
  taruh(rangka(0, 0, (zf + 2.1 + zP) / 2, 0), 'box', 2.0, .03, zP - zf - 2.2, xL, .075, 0, '#C9BFA6', { slot: 0, noHull: true, noEdge: true });
  pohonKecil(X(-LW / 2 + 1.0), zP - 1.0, .9, { jenis: 'bulat' });
  pohonKecil(X(-.4), zP - 1.0, .85, { jenis: 'bulat', c: '#5F8A3E' });
  { const n0 = P.length;
    for (let i = 0; i < 2; i++) motor(X(-6.4 + i * .8), zf + 4.0, { rot: Math.PI + .15 * (i - 1), c: ['#B4443A', '#2E3A40', '#3E5A82', '#C9D3DC'][(i + s) % 4] });
    pot(X(-4.1), zf + .55, 1.0, { kotak: true, c: cPl, bunga: '#C9708A' }); rs_lod(n0); }
};
