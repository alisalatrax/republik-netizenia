/* sawah (2×1) — spek-gaya §6 no. 8. DESA: sawah padi Jawa/Sunda: petak-petak dibatasi pematang tanah (galengan) ,3 m, padi 2 nada berbaris
   (punggung baris padi + celah gelap lumpur → garis-garis rapi dilihat dari atas), petak berair (baru tanam: bibit pendek di atas air
   #B8D9D4), petak menguning (#D9C56A, siap panen), saung panggung beratap rumbia + tangga bambu, orang-orangan bercaping berbaju warna
   pemilik + tali rafia, pohon kelapa di ujung pematang, saluran irigasi beton kecil di belakang, jalan setapak tanah dari muka jalan.
   Varian seed: 0 saung kiri, 2 petak berair + 1 menguning, orang-orangan · 1 saung kanan, musim tanam (3 petak berair) + bebek ·
   2 saung kiri, musim panen (3 petak menguning) + karung gabah + terpal jemur gabah · 3 saung kanan, 2 kelapa, orang-orangan.
   Zona pusat (bukan DESA: KAMPUNG/KOTA/RUKO/CBD — sawah tidak masuk akal di kota): kebun pembibitan — rumah plastik (greenhouse) 6×3×2,6
   rangka #8E979C, 4 bedeng 1,2×,3×5 #7E9452 dengan baris sayur, rak bibit polybag, papan nama 'BIBIT', pagar bambu rendah, gerobak sorong.
   Varian pusat: seed 0/1 rumah plastik (kiri/kanan) + sawi · 2/3 rumah paranet jaring hitam berisi polybag (kiri/kanan) + cabai tinggi.
   Kavling 2×1 bisa berputar (1×2, fx < fz): semua isi dibangun di rangka lokal R (sumbu panjang = x lokal) lalu diputar; papan nama &
   gerbang selalu di muka jalan (+z). Semua bagian di dalam kavling (|x| ≤ LW/2 − ,1). Tanpa badan bangunan. */
const SAWAH_GEO = new Map();
function sawah_geo(key, build){ let g = SAWAH_GEO.get(key); if (g) return g; const t = [], e = [];
  const tri = (a, b, c, n) => { const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const cr = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] < 0) t.push(...a, ...c, ...b); else t.push(...a, ...b, ...c); };
  build(tri, (a, b) => e.push(...a, ...b)); g = _geoFrom(t, e.length ? e : null); SAWAH_GEO.set(key, g); return g; }
// lembar datar [x0,z0,x1,z1].. di y 0 menghadap atas
const sawah_lembar = (key, rects) => sawah_geo('lb|' + key, tri => { for (const [x0, z0, x1, z1] of rects){ tri([x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [0, 1, 0]); tri([x0, 0, z0], [x1, 0, z1], [x0, 0, z1], [0, 1, 0]); } });
// baris padi: punggung segitiga sejajar z (lebar b, tinggi h) di x = xs, z0..z1, tanpa tutup ujung (hemat). rows = [[x, z0, z1, h, b]..]
const sawah_baris = (key, rows) => sawah_geo('br|' + key, tri => { for (const [x, z0, z1, h, b] of rows){ const L0 = [x - b / 2, 0, z0], L1 = [x - b / 2, 0, z1], R0 = [x + b / 2, 0, z0], R1 = [x + b / 2, 0, z1], T0 = [x, h, z0], T1 = [x, h, z1];
  tri(L0, L1, T1, [-h, b / 2, 0]); tri(L0, T1, T0, [-h, b / 2, 0]); tri(R0, T0, T1, [h, b / 2, 0]); tri(R0, T1, R1, [h, b / 2, 0]); } });
// kelapa: batang cylLo miring + 6 pelepah menjuntai + 2 buah (detail dekat). (x, z) di rangka f, tinggi h, condong 'lean' rad ke +z lokal
function sawah_kelapa(f, x, z, h, lean, n){ const t = taruh(f, 'cylLo', .26, h, .26, x, .06 + h / 2 * Math.cos(lean), z + h / 2 * Math.sin(lean), '#7A6A55', { slot: 0, rx: lean, noHull: true });
  const cx = x, cy = .06 + h * Math.cos(lean), cz = z + h * Math.sin(lean), g = f.sub(cx, cy, cz, 0), np = n || 6;
  for (let k = 0; k < np; k++){ const a = k / np * Math.PI * 2 + .4, p = g.sub(0, 0, 0, a);
    taruh(p, 'box', .34, .04, 1.7, 0, -.28, .72, k % 2 ? '#5C7D3E' : '#6E9A45', { slot: 0, rx: .5, noEdge: true }); }
  if (np > 4) taruh(g, 'box', .3, .26, .3, 0, -.25, 0, '#8C7A3E', { slot: 0, lod: 1, noEdge: true });
  return t; }

CAT.sawah.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, LW = fx + .8, LD = fz + .8, lebar = LW >= LD;
  // rangka lokal: x lokal = sumbu panjang. kavling 1×2 (fx < fz): putar −90° → x lokal = +z dunia (ke muka jalan)
  const R = rangka(0, 0, 0, lebar ? 0 : -Math.PI / 2), A = Math.max(LW, LD) / 2 - .1, B = Math.min(LW, LD) / 2 - .1;
  const bx = (sx, sy, sz, x, y, z, col, o) => taruh(R, 'box', sx, sy, sz, x, y + sy / 2, z, col, Object.assign({ slot: 0 }, o));
  const cus = (geo, y, col, o) => taruh(R, 'custom', 1, 1, 1, 0, y, 0, col, Object.assign({ geo: geo.geo, edges: geo.edges, slot: 0, noHull: true, noEdge: true }, o));
  const W0 = Math.round(LW * 10) + 'x' + Math.round(LD * 10) + '|' + s;
  if (zone !== 'DESA') return sawah_bibit(R, A, B, LW, LD, c, s, bx, cus, W0);

  // ---- tata letak: lajur saung 2,6 di satu ujung sumbu panjang (kiri: seed 0/2, kanan: 1/3), sisanya petak 2 × nL ----
  const kiri = s % 2 === 0, js = kiri ? -1 : 1, lajur = 2.6, pw = .3, yG = .06;
  const a0 = kiri ? -A + lajur : -A, a1 = kiri ? A : A - lajur, b0 = -B + .55, b1 = B;      // b0: saluran irigasi di belakang (b < b0)
  const nL = Math.max(2, Math.round((a1 - a0) / 4.6)), nS = 2;
  // pematang: keliling + pembagi (box ,3 tinggi ,2, warna tanah #B59A6A, bergaris tinta → kisi petak terbaca)
  const PM = PAL.pematang, hP = .2;
  bx(a1 - a0, hP, pw, (a0 + a1) / 2, yG, b0 + pw / 2, PM); bx(a1 - a0, hP, pw, (a0 + a1) / 2, yG, b1 - pw / 2, PM);
  for (let k = 0; k <= nL; k++){ const a = a0 + (a1 - a0) * k / nL, ac = clamp(a, a0 + pw / 2, a1 - pw / 2); bx(pw, hP, b1 - b0 - 2 * pw, ac, yG, (b0 + b1) / 2, PM); }
  for (let k = 1; k < nS; k++) bx(a1 - a0 - 2 * pw, hP, pw, (a0 + a1) / 2, yG, b0 + (b1 - b0) * k / nS, PM);
  // ---- petak: keadaan per musim (seed) ----
  const nP = nL * nS, st = Array(nP).fill('hijau');
  const pick = (n, v, o) => { for (let k = 0; k < n; k++) st[(o + k * 3) % nP] = v; };
  if (s === 0){ pick(2, 'air', 1); st[(nP - 2) % nP] = 'kuning'; }
  else if (s === 1) pick(3, 'air', 0);
  else if (s === 2){ pick(3, 'kuning', 0); st[1] = 'air'; }
  else { st[2 % nP] = 'air'; st[nP - 1] = 'kuning'; }
  const lem = { air: [], hijau: [], kuning: [] }, rows = { h0: [], h1: [], k0: [], k1: [], a0: [] }, cells = [];
  for (let i = 0; i < nL; i++) for (let j = 0; j < nS; j++){ const k = i * nS + j, x0 = a0 + (a1 - a0) * i / nL + pw / 2 + (i === 0 ? pw / 2 : 0), x1 = a0 + (a1 - a0) * (i + 1) / nL - pw / 2 - (i === nL - 1 ? pw / 2 : 0);
    const z0 = b0 + (b1 - b0) * j / nS + pw / 2 + (j === 0 ? pw / 2 : 0), z1 = b0 + (b1 - b0) * (j + 1) / nS - pw / 2 - (j === nS - 1 ? pw / 2 : 0), S0 = st[k];
    lem[S0].push([x0, z0, x1, z1]); cells.push([x0, z0, x1, z1, S0]);
    // baris padi sejajar sumbu pendek, jarak ,55 (air: bibit muda ,2 jarak ,66)
    const gap = S0 === 'air' ? .66 : .55, n = Math.max(2, Math.floor((x1 - x0 - .2) / gap)), xs0 = (x0 + x1) / 2 - (n - 1) * gap / 2;
    for (let r = 0; r < n; r++){ const x = xs0 + r * gap, row = [x, z0 + .12, z1 - .12, S0 === 'air' ? .2 : S0 === 'kuning' ? .5 : .46, S0 === 'air' ? .16 : .38];
      (S0 === 'air' ? rows.a0 : S0 === 'kuning' ? rows['k' + (r & 1)] : rows['h' + (r & 1)]).push(row); } }
  // dasar petak (lumpur/air) sedikit di atas alas kavling; baris padi berdiri di atasnya
  const yD = .085, CL = { air: PAL.sawahAir, hijau: '#5E7A3C', kuning: '#9C8C4E' };
  for (const k in lem) if (lem[k].length) cus(sawah_lembar(W0 + k, lem[k]), yD, CL[k]);
  const RC = { h0: PAL.padi[0], h1: PAL.padi[1], k0: '#D9C56A', k1: '#C9B458', a0: '#8DBE5A' };
  for (const k in rows) if (rows[k].length) cus(sawah_baris(W0 + k, rows[k]), yD, RC[k], { lod: 1 });
  // jauh: tanpa baris → dasar petak diberi warna padi (lembar kedua 1 cm di bawah baris, hanya LOD jauh tidak ada → pakai dasar gelap saja)
  // ---- saluran irigasi beton kecil di belakang (air ,3) ----
  bx(a1 - a0, .3, .1, (a0 + a1) / 2, yG, -B + .05, '#A9A398'); cus(sawah_lembar(W0 + 'irg', [[a0, -B + .1, a1, b0 - .02]]), .24, PAL.air);
  // ---- lajur saung: tanah padat + jalan setapak dari muka jalan ----
  const L0 = kiri ? -A : A - lajur, L1 = kiri ? -A + lajur : A, lc = (L0 + L1) / 2;
  cus(sawah_lembar(W0 + 'tn', [[L0, -B, L1, B]]), .075, '#B8A07A');
  // saung panggung 2,0×1,6: lantai bambu ,55, 4 tiang, atap rumbia pelana (prism), tangga 2 anak
  const sf = R.sub(lc, yG, -B + 1.35, 0), sw = 1.9, sd = 1.5;
  taruh(sf, 'box', sw, .12, sd, 0, .55, 0, '#B08A5A', { slot: 0 });
  for (const a of [-1, 1]) for (const b of [-1, 1]) taruh(sf, 'box', .1, 2.25, .1, a * (sw / 2 - .08), 1.12, b * (sd / 2 - .08), '#8C6A48', { slot: 0 });
  taruh(sf, 'prism', sw + .6, .85, sd + .7, 0, 2.2 + .425, 0, '#9C8556', { slot: 0 });
  taruh(sf, 'box', sw + .66, .1, .14, 0, 3.0, 0, '#6B5546', { slot: 0, lod: 1 });
  taruh(sf, 'box', sw - .1, .45, .06, 0, .85, -sd / 2 + .05, '#C8A97A', { slot: 0, lod: 1 });              // dinding anyaman belakang rendah
  taruh(sf, 'box', .7, .06, .3, 0, .27, sd / 2 + .2, '#8C6A48', { slot: 0, lod: 1 });                    // anak tangga
  taruh(sf, 'box', .44, .08, .44, -.45, .65, .1, '#D9C08A', { slot: 0, lod: 1, noEdge: true });          // caping di lantai
  taruh(sf, 'box', .3, .1, .2, .5, .66, -.2, '#C9503C', { slot: 0, lod: 1, noEdge: true });                // rantang
  // kelapa di ujung pematang dekat lajur (seed 3: dua)
  const kxa = kiri ? a0 + .1 : a1 - .1;
  sawah_kelapa(R, kxa, b0 + .25 + 1.7, 6.2, -.08, s === 3 ? 5 : 6);
  if (s === 3) sawah_kelapa(R, kxa, B - 2.1, 5.2, -.06, 4);
  // orang-orangan sawah di petak hijau (seed 3: dua): tiang, lengan, baju warna pemilik, kepala karung, caping, tali rafia
  const hij = cells.filter(q => q[4] === 'hijau'), nO = s === 1 ? 0 : 1;
  for (let k = 0; k < nO && k < hij.length; k++){ const q = hij[(k * 2 + s) % hij.length], of = R.sub((q[0] + q[2]) / 2, yD, (q[1] + q[3]) / 2, .5 + k);
    taruh(of, 'box', .07, 1.95, .07, 0, .975, 0, '#8C6A48', { slot: 0 }); taruh(of, 'box', 1.1, .06, .06, 0, 1.45, 0, '#8C6A48', { slot: 0 });
    taruh(of, 'box', .5, .6, .16, 0, 1.25, 0, c, { slot: 1 }); taruh(of, 'box', .24, .26, .22, 0, 1.78, 0, '#D9C9A0', { slot: 0 });
    taruh(of, 'cone', .62, .2, .62, 0, 2.0, 0, '#C9A86A', { slot: 0 });
    taruh(of, 'box', .05, .5, .02, -.55, 1.18, 0, '#C9503C', { slot: 0, lod: 1, noHull: true }); }
  // bebek di petak berair (seed 1)
  if (s === 1){ const q = cells.find(v => v[4] === 'air'); if (q) for (let k = 0; k < 4; k++){ const f = R.sub(q[0] + .5 + k * .55, yD, (q[1] + q[3]) / 2 + (k % 2 ? .35 : -.2), k * .7);
    taruh(f, 'box', .18, .14, .3, 0, .07, 0, '#EDE8DC', { slot: 0, lod: 1 }); taruh(f, 'box', .1, .12, .1, 0, .2, .14, '#EDE8DC', { slot: 0, lod: 1, noEdge: true }); } }
  // panen (seed 2): terpal biru + gabah dijemur + 3 karung
  if (s === 2){ bx(lajur - .5, .03, 2.2, lc, .075, B - 1.6, '#3E6FB0', { noHull: true }); bx(lajur - .8, .05, 1.9, lc, .105, B - 1.6, '#D9C56A', { noHull: true, lod: 1, noEdge: true });
    for (let k = 0; k < 3; k++) bx(.45, .55, .35, L0 + .45 + k * .55, yG, -B + 2.75, '#E2D6B8', { lod: 1 }); }
  // patok batas & papan kecil kelompok tani di muka jalan (lajur)
  const pf = rangka(lebar ? lc : 0, 0, lebar ? B - .2 : A - .2, 0);   // dunia: di tepi muka jalan
  if (lebar){ taruh(pf, 'box', .08, 1.3, .08, -.5, .7, 0, '#8C6A48', { slot: 0 }); taruh(pf, 'box', .08, 1.3, .08, .5, .7, 0, '#8C6A48', { slot: 0 });
    taruh(pf, 'box', 1.3, .45, .05, 0, 1.2, .05, '#3F6B62', { slot: 0 }); _teks(pf, 'TANI', 0, 1.06, .085, 1.1, .26, '#EDE8DC'); }
};
// kebun pembibitan (zona pusat). Isi di rangka R (x lokal = sumbu panjang); papan nama & pagar muka di +z dunia
function sawah_bibit(R, A, B, LW, LD, c, s, bx, cus, W0){
  const kiri = s % 2 === 0, gx = kiri ? -A + 3.2 : A - 3.2, GW = 6, GD = Math.min(3, 2 * B - 1.2), GH = 2.0, gz = -B + .4 + GD / 2;
  cus(sawah_lembar(W0 + 'jl', [[-A, -B, A, B]]), .075, '#B8A07A');                                   // tanah olah
  // rumah plastik: dinding plastik susu + atap pelana plastik + rangka besi (jeruji 2 muka) + pintu
  const gf = R.sub(gx, .06, gz, 0), PL = '#DCE4E0', RK = '#8E979C';
  if (s >= 2){   // varian 2/3: rumah paranet (jaring peneduh hitam-hijau di atas rangka, sisi terbuka, polybag di dalam)
    const NT = '#36433A', HP = 2.4;
    taruh(gf, 'box', GW, .05, GD, 0, HP, 0, NT, { slot: 0 });
    taruh(gf, 'box', GW, .6, .04, 0, HP - .3, GD / 2, NT, { slot: 0, noHull: true }); taruh(gf, 'box', .04, .6, GD, (kiri ? 1 : -1) * GW / 2, HP - .3, 0, NT, { slot: 0, noHull: true });
    for (const a of [-1, 0, 1]) for (const b of [-1, 1]) taruh(gf, 'box', .08, HP, .08, a * (GW / 2 - .04), HP / 2, b * (GD / 2 - .04), RK, { slot: 0 });
    for (let k = 0; k < 3; k++){ taruh(gf, 'box', GW - .8, .2, .45, 0, .1, -GD / 2 + .55 + k * (GD - 1.1) / 2, '#2E2C2A', { slot: 0, lod: 1 });
      taruh(gf, 'box', GW - .9, .2, .4, 0, .3, -GD / 2 + .55 + k * (GD - 1.1) / 2, k === 1 ? '#7FA850' : '#5F8A3E', { slot: 0, lod: 1, noEdge: true }); }
  } else {
  taruh(gf, 'box', GW, GH, GD, 0, GH / 2, 0, PL, { slot: 0 });
  taruh(gf, 'prism', GW + .1, .7, GD + .1, 0, GH + .35, 0, '#E9EEEA', { slot: 0 });
  _jeruji(gf.sub(0, 0, GD / 2 + .02), GW, GH, 0, 0, 0, 7, RK, { batang: .05, rel: .06, lod: 1, satu: 1 });
  _jeruji(gf.sub(GW / 2 + .02 * (kiri ? 1 : -1), 0, 0, kiri ? Math.PI / 2 : -Math.PI / 2), GD, GH, 0, 0, 0, 4, RK, { batang: .05, rel: .06, lod: 1, satu: 1 });
  taruh(gf, 'box', 1.0, 1.9, .06, kiri ? GW / 2 - 1.0 : -GW / 2 + 1.0, .95, GD / 2 + .02, '#7F8F88', { slot: 0, attach: 'z+' });
  taruh(gf, 'box', GW + .14, .08, .08, 0, GH + .7, 0, RK, { slot: 0, lod: 1 }); }
  // 4 bedeng 1,2×,3×5 sejajar sumbu pendek + baris sayur (detail dekat)
  const nb = 4, bw = 1.2, bl = Math.min(5, 2 * B - 1.6), a0 = kiri ? gx + GW / 2 + .9 : -A + .7, a1 = kiri ? A - .7 : gx - GW / 2 - .9, gap = (a1 - a0 - nb * bw) / (nb - 1), bz = -B + .35 + bl / 2, rows = [];
  for (let k = 0; k < nb; k++){ const x = a0 + bw / 2 + k * (bw + gap); bx(bw, .3, bl, x, .06, bz, '#6E5238');
    for (const t of [-1, 1]) rows.push([x + t * .3, bz - bl / 2 + .2, bz + bl / 2 - .2, .32, .36]); }
  cus(sawah_baris(W0 + 'bd', s >= 2 ? rows.map(r => [r[0], r[1], r[2], .5, .3]) : rows), .36, s >= 2 ? '#5F8A3E' : PAL.bedeng, { lod: 1 });
  // rak bibit polybag 2 tingkat di depan rumah plastik
  const rf = R.sub(gx, .06, B - 1.1, 0), RW = Math.min(4.6, GW - .6);
  for (let k = 0; k < 2; k++){ taruh(rf, 'box', RW, .06, .7, 0, .45 + k * .55, -k * .1, '#8C6A48', { slot: 0 });
    taruh(rf, 'box', RW - .2, .16, .5, 0, .56 + k * .55, -k * .1, '#2E2C2A', { slot: 0, lod: 1, noEdge: true });
    taruh(rf, 'box', RW - .3, .14, .46, 0, .71 + k * .55, -k * .1, k ? '#7FA850' : '#5F8A3E', { slot: 0, lod: 1, noEdge: true }); }
  for (const t of [-1, 1]) taruh(rf, 'box', .08, 1.05, .6, t * (RW / 2 - .05), .52, -.05, '#6B4A33', { slot: 0 });
  // polybag di tanah (2 baris) + gerobak sorong + selang
  for (const t of [0, 1]) bx(RW, .22, .3, gx, .06, B - 2.0 - t * .42, '#2E2C2A', { lod: 1 });
  bx(RW - .1, .14, .7, gx, .28, B - 2.21, '#6E9A45', { lod: 1, noEdge: true });
  const wf = R.sub(kiri ? a0 + 1.2 : a1 - 1.2, .06, B - .9, .6); taruh(wf, 'box', .6, .3, .9, 0, .45, 0, '#4C6A96', { slot: 0 }); taruh(wf, 'box', .08, .3, .3, 0, .15, .45, BESI, { slot: 0, lod: 1 });
  for (const t of [-1, 1]) taruh(wf, 'box', .04, .04, .7, t * .25, .4, -.7, BESI, { slot: 0 });
  // papan nama 'BIBIT' + pagar bambu rendah di muka jalan (dunia +z) dengan bukaan masuk
  const zF = LD / 2 - .2, xF = LW / 2 - .15, pf = rangka(0, 0, zF, 0), gX = (lebar => lebar ? (kiri ? 2.2 : -2.2) : 0)(LW >= LD), gW = 1.6;
  for (const [x0, x1] of [[-xF, gX - gW / 2], [gX + gW / 2, xF]]){ const L = x1 - x0, xm = (x0 + x1) / 2, np = Math.max(1, Math.round(L / 1.8));
    for (const yy of [.35, .75]) taruh(pf, 'box', L, .06, .06, xm, yy, 0, '#C9A86A', { slot: 0 });
    for (let k = 0; k <= np; k++) taruh(pf, 'box', .08, .95, .08, x0 + L * k / np, .475, -.02, '#B08A5A', { slot: 0 }); }
  const nf = rangka(gX + (gX > 0 ? 1.7 : -1.7) * (LW >= LD ? 1 : 0), 0, zF - .35, 0);
  for (const t of [-1, 1]) taruh(nf, 'box', .1, 1.9, .1, t * .8, .95, 0, '#5E666C', { slot: 0 });
  taruh(nf, 'box', 1.9, .55, .06, 0, 1.6, .06, '#4F7A55', { slot: 0 }); _teks(nf, 'BIBIT', 0, 1.43, .1, 1.6, .3, '#EDE8DC');
}
