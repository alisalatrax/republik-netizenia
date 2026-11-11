/* barak (2×2) — spek-gaya §6 no. 25. Asrama tentara khas kompleks militer Indonesia (generik, tanpa nama satuan nyata):
   2 barak panjang 10 × 3,2 tinggi 3,0 dinding hijau-zaitun #8C8F6A, plint gelap, atap pelana 25° #6B7A4A (overhang ,45, bubungan),
   emperan seng berkolom sepanjang muka (seed 0/1) / teras beton (2/3), 6 jendela (barak I berteralis, barak II berpalang) + 2 pintu kayu, lampu dinding, talang,
   nomor barak di dinding · menara jaga 7 m (4 kaki rangka besi + silang, kabin berjendela gelap, atap limas hipGeo, tangga, lampu sorot)
   · gerbang: 2 pilar loreng, palang pintu merah-putih, pos jaga kecil, papan nama 'BARAK' · lapangan apel beton bergaris putih
   dengan tiang bendera merah-putih · 2 truk tentara (kabin + bak berterpal) · pagar kawat (tiang + 3 kawat + kawat duri) di muka &
   samping · 2 pohon. Varian seed: 0 barak B kiri, menara kanan-depan, emperan · 1 dicerminkan · 2 barak B kiri, teras beton + jemuran
   seragam, truk terpal terbuka · 3 dicerminkan, teras beton, menara beratap seng. Semua bagian di dalam kavling (pagar di |x|,|z| ≤ 7,86). */
const BARAK_GEO = new Map();
// bilah 2 muka (kawat, kaki rangka, tangga): [[p0, p1, lebar, vektor sisi]..] → satu geometri
function barak_bilah(key, list){ let g = BARAK_GEO.get(key); if (g) return g; const t = [];
  for (const [p0, p1, w, sd] of list){ const L = Math.hypot(sd[0], sd[1], sd[2]) || 1, h = sd.map(v => v / L * w / 2);
    const a = [p0[0] - h[0], p0[1] - h[1], p0[2] - h[2]], b = [p0[0] + h[0], p0[1] + h[1], p0[2] + h[2]], c = [p1[0] + h[0], p1[1] + h[1], p1[2] + h[2]], d = [p1[0] - h[0], p1[1] - h[1], p1[2] - h[2]];
    t.push(...a, ...b, ...c, ...a, ...c, ...d, ...a, ...c, ...b, ...a, ...d, ...c); }
  g = _geoFrom(t, null); BARAK_GEO.set(key, g); return g; }
// satu barak: rangka f (pusat alas, +z lokal = muka). W panjang, D dalam. emp = emperan seng (true) / teras beton (false)
function barak_gedung(f, W, D, H, emp, no, cAtap, sisi, lampu, teralis){
  const WL = '#8C8F6A', at = (dx, dz) => f.at(dx, 0, dz), r = f.r, p0 = at(0, 0);
  dinding(W, H, D, p0[0], 0, p0[2], WL, { plinth: .55, cPlinth: '#5E604A', rot: r, slot: 0 });
  atapPelana(W, D, p0[0], H, p0[2], { sudut: 25, overhang: .45, c: cAtap, cWall: WL, rot: r, slot: 0 });
  // muka: 6 jendela berteralis + 2 pintu (di 1/4 dan 3/4)
  const xd = [-W * .25, W * .25], xs = [-W / 2 + .9, -W * .25 - 1.25, -W * .25 + 1.25, W * .25 - 1.25, W * .25 + 1.25, W / 2 - .9];
  for (const x of xs){ const p = at(x, D / 2); jendelaKecil(p[0], 1.05, p[2], { rot: r, w: .8, h: 1.1, wall: WL, kusen: '#E6E2D8', teralis, teralisN: 4, palang: false }); }
  for (const x of xd){ const p = at(x, D / 2); pintu(p[0], p[2], { rot: r, wall: WL, c: '#5A4636', kusen: '#E6E2D8', y: emp ? .15 : .3, boven: false }); }
  const pl = at(0, D / 2); if (lampu) lampuDinding(pl[0], 2.45, pl[2], { rot: r });
  teks(no, pl[0], 1.7, pl[2], { rot: r, tinggi: .32, c: '#EDE8DC', dz: .02 });
  for (const t of [-1, 1]){ const p = at(t * (W / 2 - .15), D / 2); talang(p[0], 0, H - .1, { z: p[2], rot: r }); }
  // samping: 1 jendela di ujung yang terlihat (sisi = −1 kiri / +1 kanan lokal)
  for (const t of [sisi]){ const p = at(t * W / 2, -.2); jendelaKecil(p[0], 1.05, p[2], { rot: r + t * Math.PI / 2, w: .8, h: 1.1, wall: WL, kusen: '#E6E2D8', palang: false, lod: 1 }); }
  // emperan seng berkolom (1,4) atau teras beton ,3 dengan 2 anak tangga di muka pintu
  const pe = at(0, D / 2);
  if (emp) emperan(pe[0], pe[2], { rot: r, w: W, d: 1.35, y: H - .25, miring: 12, c: SENG, kolom: 4, cKolom: '#D9D4C8', talang: false });
  else teras(W - .4, 1.2, pe[0], pe[2], { rot: r, tinggi: .3, tangga: 1, tanggaW: 1.4, tanggaX: xd[1], c: '#BFB6A8' });
}

CAT.barak.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, LW = fx + .8, LD = fz + .8, hx = LW / 2 - .1, hz = LD / 2 - .1, R0 = rangka(0, 0, 0, 0);
  const js = s % 2 ? -1 : 1, emp = s < 2, cAtap = '#6B7A4A', K = Math.round(LW * 10) + '|' + s;
  const bx = (sx, sy, sz, x, y, z, col, o) => taruh(R0, 'box', sx, sy, sz, x, y + sy / 2, z, col, Object.assign({ slot: 0 }, o));
  const KAWAT = [], RANGKA = [];
  const W = 10, D = 3.2, H = 3.0, ov = .45;
  // ---- barak A di belakang (muka +z), barak B di sisi −js (muka ke tengah) ----
  const zA = -hz + ov + .05 + D / 2, xA = js * (hx - ov - .05 - W / 2);
  barak_gedung(rangka(xA, 0, zA, 0), W, D, H, emp, 'I', cAtap, -js, true, true);
  const xB = -js * (hx - ov - .05 - D / 2), zB = zA + D / 2 + ov + .3 + W / 2 + .15;
  barak_gedung(rangka(xB, 0, zB, js * Math.PI / 2), W, D, H, emp, 'II', cAtap, js, false, false);
  // ---- lapangan apel beton + garis putih + tiang bendera ----
  const lx0 = xB + js * (D / 2 + (emp ? 1.6 : 1.45)), lx1 = js * 2.7, LX0 = Math.min(lx0, lx1), LX1 = Math.max(lx0, lx1), lz0 = zA + D / 2 + (emp ? 1.6 : 1.45), lz1 = hz - 1.6;
  bx(LX1 - LX0, .03, lz1 - lz0, (LX0 + LX1) / 2, .06, (lz0 + lz1) / 2, '#CFC6B8', { noHull: true, noEdge: true });
  { const a = LX0 + .15, b = LX1 - .15, c0 = lz0 + .15, d = lz1 - .15, w = .1, t = [];
    for (const [x0, z0, x1, z1] of [[a, c0, b, c0 + w], [a, d - w, b, d], [a, c0 + w, a + w, d - w], [b - w, c0 + w, b, d - w]]) t.push(x0, 0, z0, x1, 0, z1, x1, 0, z0, x0, 0, z0, x0, 0, z1, x1, 0, z1);
    const g = BARAK_GEO.get(K + 'gl') || (BARAK_GEO.set(K + 'gl', _geoFrom(t, null)), BARAK_GEO.get(K + 'gl'));
    taruh(R0, 'custom', 1, 1, 1, 0, .1, 0, '#EDE8DC', { geo: g.geo, edges: null, slot: 0, noHull: true, noEdge: true, lod: 1 }); }
  const xF = (LX0 + LX1) / 2; tiangBendera(xF, lz0 + .7, 7.5);
  // ---- 2 truk tentara di sisi js (sejajar z, menghadap jalan) ----
  const truk = (x, z, terpal) => { const f = R0.sub(x, 0, z, 0), TC = '#56603E';
    taruh(f, 'box', 1.8, .9, 1.6, 0, .95, 1.6, TC, { slot: 0 });                                   // kabin bawah
    taruh(f, 'box', 1.75, .75, 1.1, 0, 1.75, 1.35, TC, { slot: 0 });                                // kabin atas
    taruh(f, 'box', 1.5, .5, .05, 0, 1.8, 1.92, KACA[1], { glow: true, slot: 0 });                   // kaca depan
    taruh(f, 'box', 1.8, .5, 3.3, 0, .95, -.85, darken(TC, .9), { slot: 0 });                        // bak
    if (terpal) taruh(f, 'box', 1.8, 1.25, 3.2, 0, 1.82, -.85, '#6E7255', { slot: 0 });               // terpal
    else for (const t of [0, 1, 2]) taruh(f, 'box', 1.8, .06, .06, 0, 2.1, -.85 + (t - 1) * 1.4, '#3A3D32', { slot: 0 });
    for (const t of [-1, 1]) taruh(f, 'box', .3, .8, 4.0, t * .78, .4, 0, '#22231F', { slot: 0 }); };   // roda (satu sisi = satu blok gelap)
  const zT = (lz0 + lz1) / 2 - 1.2;
  truk(js * 4.0, zT, true); truk(js * 6.15, zT - .5, s !== 2);
  // ---- menara jaga 7 m di pojok depan sisi js ----
  const mx = js * (hx - 1.62), mz = hz - 1.62, kk = .85, Hm = 5.2, mf = R0.sub(mx, 0, mz, 0);
  for (const a of [-1, 1]) for (const b of [-1, 1]) taruh(mf, 'box', .16, Hm, .16, a * kk, Hm / 2, b * kk, '#5E604A', { slot: 0 });
  for (const t of [-1, 1]){ const z = t * kk; RANGKA.push([[mx - kk, .3, mz + z], [mx + kk, Hm * .5, mz + z], .08, [0, 0, 1]], [[mx - kk, Hm * .5, mz + z], [mx + kk, Hm - .2, mz + z], .08, [0, 0, 1]]);
    const x = t * kk; RANGKA.push([[mx + x, .3, mz - kk], [mx + x, Hm * .5, mz + kk], .08, [1, 0, 0]], [[mx + x, Hm * .5, mz - kk], [mx + x, Hm - .2, mz + kk], .08, [1, 0, 0]]); }
  taruh(mf, 'box', 2.3, .15, 2.3, 0, Hm + .075, 0, '#6F6A60', { slot: 0 });                          // lantai kabin
  taruh(mf, 'box', 2.1, .95, 2.1, 0, Hm + .15 + .475, 0, '#8C8F6A', { slot: 0 });                     // dinding bawah kabin
  taruh(mf, 'box', 2.0, .55, 2.0, 0, Hm + 1.1 + .275, 0, '#2E3438', { slot: 0, noHull: true });       // bukaan pandang gelap
  const hg = hipGeo(2.9, 2.9, .9); taruh(mf, 'custom', 2.9, .9, 2.9, 0, Hm + 1.65 + .45, 0, s === 3 ? SENG : cAtap, { geo: hg.geo, edges: hg.edges, slot: 0 });
  taruh(mf, 'box', .3, .25, .3, js * -.6, Hm + 1.3, 1.07, '#3A3D40', { slot: 0, lod: 1 }); taruh(mf, 'box', .22, .16, .04, js * -.6, Hm + 1.3, 1.23, LAMPU, { glow: true, lod: 1 });   // lampu sorot
  for (let k = 0; k < 2; k++) RANGKA.push([[mx - js * (kk + .05) + (k ? 0 : 0), 0, mz - .25 + k * .5], [mx - js * (kk + .05), Hm, mz - .25 + k * .5], .06, [1, 0, 0]].map((v, i) => i === 3 ? [0, 0, 1] : v));
  for (let k = 1; k < 7; k++) KAWAT.push([[mx - js * (kk + .05), k * Hm / 7, mz - .25], [mx - js * (kk + .05), k * Hm / 9, mz + .25], .05, [0, 1, 0]]);   // anak tangga
  // ---- gerbang: 2 pilar loreng + palang merah-putih + pos jaga kecil + papan nama ----
  const gx = -js * .2, zG = hz - .25, gW = 4.0;
  for (const t of [-1, 1]){ const f = R0.sub(gx + t * (gW / 2 + .25), 0, zG - .1, 0);
    taruh(f, 'box', .5, 2.2, .5, 0, 1.1, 0, '#6B7A4A', { slot: 0 });
    taruh(f, 'box', .62, .14, .62, 0, 2.27, 0, '#D9D4C8', { slot: 0 }); }
  const pf = R0.sub(gx, 0, zG - .1, 0);
  taruh(pf, 'box', gW + 1.0, .5, .12, 0, 2.6, 0, '#3F4A36', { slot: 0 }); _teks(pf, 'BARAK', 0, 2.45, .08, gW * .6, .3, '#EDE8DC');
  for (const t of [-1, 1]) taruh(pf, 'box', .1, .4, .1, t * (gW / 2 - .2), 2.35 - .25, 0, '#3F4A36', { slot: 0, lod: 1 });
  // palang: tiang kecil + lengan bergaris (4 ruas merah/putih)
  const pg = R0.sub(gx - gW / 2 + .15, 0, zG - .9, 0); taruh(pg, 'box', .3, 1.0, .3, 0, .5, 0, '#E6E2D8', { slot: 0 });
  for (let k = 0; k < 3; k++) taruh(pg, 'box', (gW - .4) / 3, .1, .1, .2 + (k + .5) * (gW - .4) / 3, .92, 0, k % 2 ? '#E6E2D8' : '#B5473A', { slot: 0 });
  // pos jaga kecil di dalam gerbang (sisi −js dari gerbang)
  const ps = R0.sub(gx + js * (gW / 2 + 1.45), 0, zG - 1.0, 0);
  taruh(ps, 'box', 1.6, 2.3, 1.4, 0, 1.15, 0, '#8C8F6A', { slot: 0 }); taruh(ps, 'box', 1.2, .6, .06, 0, 1.4, .72, '#2E3438', { slot: 0, attach: 'z+' });
  taruh(ps, 'prism', 1.9, .4, 1.8, 0, 2.5, 0, cAtap, { slot: 0 });
  // ---- pagar kawat: muka (bukaan gerbang) + 2 samping; tiang tiap ±2,5, 3 kawat + kawat duri ----
  const tiang = (x, z, sd) => RANGKA.push([[x, 0, z], [x, 2.0, z], .09, sd]);
  const ruas = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 2.5)); for (let k = 0; k <= n; k++) tiang(x0 + (x1 - x0) * k / n, z0 + (z1 - z0) * k / n, [x1 - x0, 0, z1 - z0]);
    for (const y of [.5, 1.1, 1.7, 1.95]) KAWAT.push([[x0, y, z0], [x1, y, z1], y > 1.9 ? .05 : .025, [0, 1, 0]]); };
  const xP = hx - .04, zP = hz - .04;
  ruas(-xP, zP, gx - gW / 2 - .5, zP); ruas(gx + gW / 2 + .5, zP, xP, zP);
  ruas(-xP, -hz + .1, -xP, zP); ruas(xP, -hz + .1, xP, zP);
  taruh(R0, 'custom', 1, 1, 1, 0, 0, 0, '#4A4E46', { geo: barak_bilah(K + 'rk', RANGKA).geo, edges: null, slot: 0, noHull: true, noEdge: true });
  taruh(R0, 'custom', 1, 1, 1, 0, 0, 0, '#6F7378', { geo: barak_bilah(K + 'kw', KAWAT).geo, edges: null, slot: 0, noHull: true, noEdge: true, lod: 1 });
  // ---- jemuran seragam (seed 2), pohon ----
  if (s === 2) jemuran(xA - js * 2.2, zA + D / 2 + 2.6, { w: 2.4, h: 1.7, n: 3, warna: 2 });
  pohonKecil(-js * (hx - 1.0), hz - 1.2, .85, {});
  pohonKecil(js * (Math.abs(xA) - W / 2 - 1.0 + (hx - Math.abs(xA) - W / 2) * 0), -hz + 1.1, .7, {});
};
