/* stadion (4×2) — spek-gaya §6 no. 19. Stadion kota kecil khas Indonesia: tembok keliling 6,0 '#C9C1B2' berpilaster, plint, lis warna
   aksen, roster ventilasi, 4 pintu (2 gerbang utama berkanopi seng 'YXZ' + 2 pintu samping), 4 loket karcis berteralis, huruf timbul
   'STADION', spanduk liga, lampu dinding, pot & tiang bendera di emperan depan; di dalam: tribun beton 3 tingkat di 4 sisi + strip kursi
   2 warna, atap tribun seng miring 10° 'YXZ' (turun ke arah lapangan) di atas tiang, 4 menara lampu 12,5 m (panel nyala menghadap
   lapangan), papan skor, lintasan atletik merah bata, rumput 2 nada 8 strip, garis lapangan lengkap (batas, tengah, lingkaran, 2 kotak
   penalti + 2 kotak gawang, titik), 2 gawang berjaring.
   Kerangka lokal R: sumbu X = sisi panjang kavling (bila kavling diputar 90°, R diputar); muka utama = sisi tembok yang menghadap jalan
   (+z model), emperan 1,0 di depannya (kanopi berhenti di batas kavling).
   Varian seed: 0 atap kedua tribun panjang seng + papan skor kanan · 1 atap hanya tribun utama (warna aksen) + papan skor kiri ·
   2 tanpa lintasan (rumput sampai tribun), kursi biru-putih, atap kedua sisi · 3 tembok krem + pita merah-putih, atap tribun utama saja,
   gerbang dengan papan nama tengah. Ronde perbaikan 1: tribun sisi panjang ,6/tingkat (lapangan ≈ 20 × 10), lintasan hanya di ujung (+ ,3
   di sisi panjang); s2 punya tanda luar: tembok pasir '#CDBFA3', lis hijau tua, 2 gapura pilar beratap limas genteng di gerbang utama.
   Semua bagian di dalam kavling. */
const STADION_GEO = new Map();
function stadion_geo(key, build){ let g = STADION_GEO.get(key); if (g) return g; const t = [], e = [];
  const tri = (a, b, c, n) => { const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const cr = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] < 0) t.push(...a, ...c, ...b); else t.push(...a, ...b, ...c); };
  build(tri, (a, b) => e.push(...a, ...b)); g = _geoFrom(t, e.length ? e : null); STADION_GEO.set(key, g); return g; }
const stadion_lembar = (key, rects) => stadion_geo(key, tri => { for (const [x0, z0, x1, z1] of rects){ tri([x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [0, 1, 0]); tri([x0, 0, z0], [x1, 0, z1], [x0, 0, z1], [0, 1, 0]); } });
const stadion_cincin = (r0, r1, N) => stadion_geo(['cc', r0, r1, N].join('|'), tri => { for (let k = 0; k < N; k++){ const a = k / N * Math.PI * 2, b = (k + 1) / N * Math.PI * 2;
  const I0 = [r0 * Math.sin(a), 0, r0 * Math.cos(a)], I1 = [r0 * Math.sin(b), 0, r0 * Math.cos(b)], O0 = [r1 * Math.sin(a), 0, r1 * Math.cos(a)], O1 = [r1 * Math.sin(b), 0, r1 * Math.cos(b)];
  tri(I0, O0, O1, [0, 1, 0]); if (r0 > 0) tri(I0, O1, I1, [0, 1, 0]); } });

// gapura (seed 2): 2 pilar bata-plester + balok + atap limas genteng di depan gerbang, menjorok ≤ ,92 (emperan 1,0)
function stadion_gapura(fm, x, gt){ for (const t of [-1, 1]){ taruh(fm, 'box', .44, 4.1, .44, x + t * 1.6, 2.05, .5, '#D9D4C8', { slot: 0 }); taruh(fm, 'box', .56, .3, .56, x + t * 1.6, .15, .5, '#8E8A80', { slot: 0 });
    taruh(fm, 'box', .16, .22, .12, x + t * 1.6, 3.2, .78, LAMPU, { glow: true, lod: 1 }); }
  taruh(fm, 'box', 3.9, .4, .6, x, 4.3, .5, '#D9D4C8', { slot: 0 }); taruh(fm, 'box', 3.94, .1, .64, x, 4.05, .5, LIS2_STADION, { slot: 0, lod: 1 });
  const h = hipGeo(4.4, .92, .9); taruh(fm, 'custom', 4.4, .9, .92, x, 4.5 + .45, .46, gt, { geo: h.geo, edges: h.edges, slot: 3 }); }
const LIS2_STADION = '#3F6B62';

CAT.stadion.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, putar = fz > fx, LX = Math.max(fx, fz) + .8, LZ = Math.min(fx, fz) + .8;
  const R = rangka(0, 0, 0, putar ? Math.PI / 2 : 0);
  const TEMBOK = s === 3 ? '#D9D4C8' : s === 2 ? '#CDBFA3' : '#C9C1B2', LIS2 = '#3F6B62', PLINT = '#8E8A80', BETON = '#BFB6A8', BETON2 = '#CFC6B8', PUTIH = '#E6E2D8', TRACK = '#B0705A';
  const bx = (f, sx, sy, sz, x, y, z, col, o) => taruh(f, 'box', sx, sy, sz, x, y + sy / 2, z, col, Object.assign({ slot: 0 }, o));
  const cus = (geo, x, y, z, col, o) => taruh(R, 'custom', 1, 1, 1, x, y, z, col, Object.assign({ geo: geo.geo, edges: geo.edges, slot: 0, noHull: true, noEdge: true }, o));
  // ---- sisi tembok di rangka lokal: zp/zm = sisi panjang, xp/xm = sisi ujung; muka utama menghadap +z model ----
  const utama = putar ? 'xm' : 'zp', AP = 1.0, TW = .35, HW = 6.0;
  const ins = sd => sd === utama ? AP : .25;
  const xo = { xp: LX / 2 - ins('xp'), xm: LX / 2 - ins('xm') }, zo = { zp: LZ / 2 - ins('zp'), zm: LZ / 2 - ins('zm') };
  const SISI = { zp: { rot: 0, len: xo.xp + xo.xm, c: (xo.xp - xo.xm) / 2, pos: [0, zo.zp] }, zm: { rot: Math.PI, len: xo.xp + xo.xm, c: (xo.xp - xo.xm) / 2, pos: [0, -zo.zm] },
                 xp: { rot: Math.PI / 2, len: zo.zp + zo.zm - 2 * TW + .06, c: (zo.zp - zo.zm) / 2, pos: [xo.xp, 0] }, xm: { rot: -Math.PI / 2, len: zo.zp + zo.zm - 2 * TW + .06, c: (zo.zp - zo.zm) / 2, pos: [-xo.xm, 0] } };
  // rangka muka luar tiap sisi: +z lokal = keluar, x lokal = sepanjang tembok (pusat bentang)
  const muka = sd => { const S = SISI[sd], along = sd[0] === 'z' ? [S.c, 0] : [0, S.c]; return R.sub(S.pos[0] + along[0], 0, S.pos[1] + along[1], S.rot); };
  const m2 = (f, dx, dy, dz) => f.at(dx, dy, dz || 0);   // posisi model untuk fungsi fasad
  // ---- tembok keliling 6,0 + plint + lis aksen + kornis ----
  for (const sd of ['zp', 'zm', 'xp', 'xm']){ const f = muka(sd), L = SISI[sd].len;
    bx(f, L, HW, TW, 0, 0, -TW / 2, TEMBOK, { wall: true, slot: 0 });
    bx(f, L + (sd[0] === 'z' ? .1 : -.02), .55, .06, 0, 0, .02, PLINT, { attach: 'z-', noHull: true });
    bx(f, L + (sd[0] === 'z' ? .14 : -.02), .22, .08, 0, 4.0, .03, s === 3 ? '#B5473A' : s === 2 ? LIS2 : c, { attach: 'z-', slot: s >= 2 ? 0 : 1, noHull: true });
    if (s === 3) bx(f, L + (sd[0] === 'z' ? .14 : -.02), .22, .08, 0, 3.78, .03, PUTIH, { attach: 'z-', noHull: true });
    bx(f, L + (sd[0] === 'z' ? .2 : -.02), .25, .14, 0, HW - .25, .05, '#D9D4C8', { attach: 'z-', noHull: true }); }
  // ---- bagian dalam: batas muka dalam tembok ----
  const ix0 = -xo.xm + TW, ix1 = xo.xp - TW, iz0 = -zo.zm + TW, iz1 = zo.zp - TW;
  const dL = .6, dE = 1.5, hL = [1.2, 2.4, 3.6], hE = [1.4, 2.8, 4.2];   // tribun panjang tipis → lapangan ≈ 20 × 10
  const fx0 = ix0 + 3 * dE, fx1 = ix1 - 3 * dE, fz0 = iz0 + 3 * dL, fz1 = iz1 - 3 * dL, fcx = (fx0 + fx1) / 2, fcz = (fz0 + fz1) / 2, FW = fx1 - fx0, FD = fz1 - fz0;
  const kursi = s === 2 ? ['#4C6A96', PUTIH] : [c, '#D9D4C8'];
  // tribun: rangka g di muka dalam tembok, +z lokal = ke lapangan; tingkat 0 (rendah) paling dekat lapangan
  const tribun = (g, len, dd, hs, atap) => {
    for (let k = 0; k < 3; k++){ const z0 = (2 - k) * dd, h = hs[k]; bx(g, len, h, dd + (k ? .02 : 0), 0, .06, z0 + dd / 2 - (k ? .01 : 0), k % 2 ? BETON : BETON2);
      bx(g, len - .3, .4, .42, 0, .06 + h, z0 + .3, kursi[k % 2], { slot: k % 2 === 0 && s !== 2 ? 1 : 0, noHull: true }); }
    bx(g, len, .9, .12, 0, .06 + hs[0], 3 * dd - .06, PUTIH, { lod: 1, noHull: true });   // pagar pembatas depan
    if (atap){ const yB = HW + 1.5, a = 10 * D2R, D = 3 * dd + .25, n = Math.max(2, Math.round(len / 7));
      for (let k = 0; k <= n; k++) bx(g, .22, yB - HW + .1, .22, -len / 2 + .3 + (len - .6) * k / n, HW - .1, -TW / 2, '#5E666C');
      taruh(g, 'box', len + .2, .1, D / Math.cos(a), 0, yB + .05 - D / 2 * Math.tan(a), -TW + D / 2, atap, { slot: atap === c ? 1 : 0, rx: a });
      taruh(g, 'box', len + .2, .3, .1, 0, yB - D * Math.tan(a) - .1, -TW + D, '#5E666C', { slot: 0, lod: 1 }); } };
  const atapW = s === 1 ? darken(c, .9) : SENG;
  // tribun panjang (zm, zp) penuh selebar dalam; tribun ujung (xm, xp) di antara muka tribun panjang
  tribun(R.sub((ix0 + ix1) / 2, 0, iz0, 0), ix1 - ix0, dL, hL, atapW);
  tribun(R.sub((ix0 + ix1) / 2, 0, iz1, Math.PI), ix1 - ix0, dL, hL, (s === 0 || s === 2) ? SENG : null);
  tribun(R.sub(ix0, 0, fcz, Math.PI / 2), FD + .06, dE, hE, null); tribun(R.sub(ix1, 0, fcz, -Math.PI / 2), FD + .06, dE, hE, null);
  // ---- lapangan: lintasan merah bata + rumput 8 strip 2 nada + garis lengkap + 2 gawang ----
  const tr = s === 2 ? 0 : .9;
  if (tr) bx(R, FW, .04, FD, fcx, .06, fcz, TRACK, { noHull: true, noEdge: true });
  const trz = tr ? .3 : 0, gx0 = fx0 + tr, gx1 = fx1 - tr, gz0 = fz0 + trz, gz1 = fz1 - trz, GW = gx1 - gx0, GD = gz1 - gz0, nS = 8;
  for (let k = 0; k < nS; k++) bx(R, GW / nS + (k < nS - 1 ? .002 : 0), .08, GD, gx0 + GW * (k + .5) / nS, .06, fcz, RUMPUT[k % 2], { noHull: true, noEdge: true });
  const m = .5, lx0 = gx0 + m, lx1 = gx1 - m, lz0 = gz0 + m, lz1 = gz1 - m, LWd = lx1 - lx0, LDd = lz1 - lz0, w = .1, GR = [];
  const gl = (sx, sz, x, z) => GR.push([x - sx / 2, z - sz / 2, x + sx / 2, z + sz / 2]);
  gl(LWd + w, w, fcx, lz0); gl(LWd + w, w, fcx, lz1); gl(w, LDd, lx0, fcz); gl(w, LDd, lx1, fcz); gl(w, LDd, fcx, fcz);
  const pW = Math.min(LDd * .62, 6.5), pD = Math.min(LWd * .14, 2.6), aW = pW * .45, aD = pD * .4;
  for (const sx of [-1, 1]){ const xe = sx > 0 ? lx1 : lx0; gl(w, pW, xe - sx * pD, fcz); gl(pD, w, xe - sx * pD / 2, fcz - pW / 2); gl(pD, w, xe - sx * pD / 2, fcz + pW / 2);
    gl(w, aW, xe - sx * aD, fcz); gl(aD, w, xe - sx * aD / 2, fcz - aW / 2); gl(aD, w, xe - sx * aD / 2, fcz + aW / 2); }
  cus(stadion_lembar('gr|' + GR.map(r => r.map(v => v.toFixed(2)).join(',')).join(';'), GR), 0, .155, 0, PUTIH, { lod: 1 });
  const rc = Math.min(1.8, LDd * .2); cus(stadion_cincin(rc - .1, rc, 16), fcx, .155, fcz, PUTIH, { lod: 1 }); cus(stadion_cincin(0, .15, 6), fcx, .155, fcz, PUTIH, { lod: 1 });
  const gwG = Math.min(3.6, pW * .5), ghG = 1.8;
  for (const sx of [-1, 1]){ const g = R.sub(sx > 0 ? lx1 : lx0, .14, fcz, -sx * Math.PI / 2);
    for (const t of [-1, 1]) bx(g, .12, ghG, .12, t * gwG / 2, 0, 0, PUTIH);
    bx(g, gwG + .12, .12, .12, 0, ghG, 0, PUTIH);
    _jeruji(g, gwG, ghG, 0, 0, -.8, Math.round(gwG / .4), '#D9D4C8', { batang: .02, rel: .03, lod: 1 });
    bx(g, gwG, .03, .8, 0, ghG, -.4, '#D9D4C8', { lod: 1, noEdge: true, noHull: true }); }
  // ---- 4 menara lampu di sudut tembok (12,5 m, panel nyala menghadap tengah lapangan) ----
  const sud = [[-xo.xm + 1.0, -zo.zm + 1.3], [xo.xp - 1.0, -zo.zm + 1.3], [-xo.xm + 1.0, zo.zp - 1.3], [xo.xp - 1.0, zo.zp - 1.3]];
  for (const [tx, tz] of sud){ taruh(R, 'cylLo', .56, 12.5, .56, tx, 6.25, tz, '#8A939A', { slot: 0 });
    const g = R.sub(tx, 12.5, tz, Math.atan2(fcx - tx, fcz - tz));
    taruh(g, 'box', 2.4, 1.6, .3, 0, 0, .1, '#5E666C', { slot: 0, rx: .38 }); taruh(g, 'box', 2.1, 1.3, .06, 0, -.06, .27, LAMPU, { glow: true, rx: .38 });
    taruh(g, 'box', 2.2, .06, .5, 0, -1.0, .2, '#5E666C', { slot: 0, lod: 1 }); }
  // ---- papan skor di atas tembok ujung (bukan muka utama) ----
  const ujung = putar ? 'xp' : (s === 1 ? 'xm' : 'xp'), fu = muka(ujung);
  for (const t of [-1, 1]) bx(fu, .25, 3.0, .25, t * 2.2, HW - .2, -TW / 2, '#5E666C');
  bx(fu, 5.4, 2.4, .35, 0, HW + .6, -TW / 2, '#2B3A36'); { const fi = fu.sub(0, 0, -TW / 2, Math.PI); _teks(fi, 'NTZ 2-1', 0, HW + 1.25, .19, 4.4, .9, LAMPU, {}); _teks(fu, 'NETIZENIA', 0, HW + 1.45, -TW / 2 + .19, 4.6, .55, '#D9D4C8', {}); }
  // ---- muka utama (jalan): 6 pilaster, 2 gerbang berkanopi, 4 loket, roster, huruf STADION, 2 spanduk, 4 lampu, emperan: pot + bendera ----
  const fm = muka(utama), Lm = SISI[utama].len, rot = fm.r, P = (dx, dy, dz) => m2(fm, dx, dy, dz);
  const gX = Math.min(Lm * .24, 5.2), pil = [-Lm / 2 + .6, -gX - 2.2, -gX + 2.2, gX - 2.2, gX + 2.2, Lm / 2 - .6];
  for (const px of pil) bx(fm, .55, HW - .3, .26, px, 0, .1, '#D9D4C8', { attach: 'z-', noHull: true });
  for (const sx of [-1, 1]){ const p = P(sx * gX, 0, 0); pintu(p[0], p[2], { w: 2.6, h: 3.0, daun: 2, c: '#5E666C', wall: TEMBOK, kusen: '#8E8A80', rot, kanopi: s !== 2, cKanopi: SENG });
    if (s === 2) stadion_gapura(fm, sx * gX, gt);
    _teks(fm, sx < 0 ? 'PINTU A' : 'PINTU B', sx * gX, 3.75, .04, 2.0, .26, '#3A3430');
    for (const t of [-1, 1]){ const q = P(sx * gX + t * 3.1 * (Lm > 14 ? 1 : .8), 0, 0); if (Math.abs(sx * gX + t * 3.1) > Lm / 2 - 1) continue;
      jendelaKecil(q[0], 1.05, q[2], { w: .9, h: .75, wall: TEMBOK, kusen: '#8E8A80', teralis: true, rot });
      _teks(fm, 'LOKET', sx * gX + t * 3.1, 2.0, .04, .9, .18, '#3A3430'); }
    if (s !== 2){ const lp = P(sx * (gX + 1.75), 0, 0); lampuDinding(lp[0], 3.0, lp[2], { rot }); const lq = P(sx * (gX - 1.75), 0, 0); lampuDinding(lq[0], 3.0, lq[2], { rot }); } }
  // roster ventilasi di antara pilaster (y 4,4–5,2) — dekal ,03 menembus
  for (let k = 0; k < pil.length - 1; k++){ const a = pil[k] + .4, b = pil[k + 1] - .4; if (b - a < .8) continue;
    bx(fm, b - a, .7, .06, (a + b) / 2, 4.5, 0, '#8A8478', { attach: 'z-', noHull: true, noEdge: true });
    _jeruji(fm, b - a - .1, .62, (a + b) / 2, 4.54, .04, Math.round((b - a) / .25), '#D9D4C8', { batang: .05, rel: .05, lod: 1, satu: 1 }); }
  // huruf timbul STADION di atas bentang tengah + spanduk liga di bentang samping
  if (s === 3){ bx(fm, 2 * gX - 4.6, 1.0, .1, 0, 2.9, .03, '#3F6B62', { attach: 'z-', noHull: true }); _teks(fm, 'STADION', 0, 3.05, .1, 2 * gX - 5.2, .7, '#EDE8DC'); }
  else _teks(fm, 'STADION', 0, 2.6, .05, 2 * gX - 4.8, 1.0, darken(c, .7));
  for (const sx of [-1, 1]){ const x = sx * (gX + 2.2 + (Lm / 2 - .6 - gX - 2.2) / 2), wS = Math.min(3.2, Lm / 2 - gX - 3.6); if (wS < 1.2) continue;
    const p = P(x, 0, 0); spanduk(p[0], 2.2, p[2], { w: wS, h: .9, c: s === 3 ? PUTIH : '#E6E2D8', teks: sx < 0 ? 'LIGA 1' : 'AYO DUKUNG', cTeks: '#B5473A', rot }); }
  // emperan depan (1,0): pot + tiang bendera di pojok
  for (const sx of [-1, 1]) for (const t of [0, 1]){ const x = sx * (gX + (t ? -1 : 1) * (s === 2 ? 2.3 : 2.0)); const p = P(x, 0, .55); pot(p[0], p[2], .95, { kotak: true, c: '#B9AE98' }); }
  { const p = P(-Lm / 2 + 1.5, 0, .55); tiangBendera(p[0], p[2], 7.5, { rot }); }
  // ---- sisi lain: 1 pintu samping + 2 pilaster + roster per sisi ----
  for (const sd of ['zp', 'zm', 'xp', 'xm']){ if (sd === utama) continue; const f = muka(sd), L = SISI[sd].len;
    for (const t of [-1, 1]) bx(f, .5, HW - .3, .2, t * L * .3, 0, .07, '#D9D4C8', { attach: 'z-', noHull: true });
    if (sd !== ujung){ const p = m2(f, 0, 0, 0); pintu(p[0], p[2], { w: 2.0, h: 2.6, daun: 2, c: '#5E666C', wall: TEMBOK, kusen: '#8E8A80', rot: f.r, kanopi: sd[0] === 'x' ? false : false }); }
    bx(f, L * .6 - .8, .6, .06, 0, 4.5, 0, '#8A8478', { attach: 'z-', noHull: true, noEdge: true, lod: 1 }); }
};
