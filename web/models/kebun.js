/* kebun (1×1, DESA) — spek-tata-kota (tipe BARU) "kebun sayur & pisang di desa"; anggaran ≈ sawah 1×1 (500 dekat).
   Kebun pekarangan desa Jawa: 3 bedeng tanah ditinggikan (cabai/terong berbuah merah/ungu · sawi/kangkung berbaris · kacang panjang
   merambat di ajir bambu segitiga), jalan setapak tanah, pohon pisang + kelapa/pepaya, gubuk kecil beratap rumbia (lantai bambu
   lesehan, dinding anyaman belakang, karung pupuk, cangkul bersandar), pagar bambu (tiang + 2 palang) di muka jalan & samping dengan
   gapura bambu, ember. Varian seed: 0 gubuk kanan-depan, pisang + kelapa · 1 gubuk kiri-depan, 2 pisang, terong ungu ·
   2 gubuk kanan-belakang, pisang + pepaya · 3 gubuk kiri-belakang, kelapa + pisang, bedeng tengah ditanami jagung.
   Batang tipis (pagar, ajir, tiang gubuk, pelepah) = bidang 2 muka khusus (4 segitiga, bukan kotak 12) → hemat; batang tipis kotak pun
   tanpa garis/kulit (aturan otomatis), jadi tampilan tinta sama. Semua bagian di dalam kavling (|x|,|z| ≤ LW/2 − ,05). */
const KEBUN_GEO = new Map();
function kebun_geo(key, build){ let g = KEBUN_GEO.get(key); if (g) return g; const t = [];
  const tri = (a, b, c, n) => { const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const cr = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (!n) { t.push(...a, ...b, ...c, ...a, ...c, ...b); return; }      // 2 muka
    if (cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] < 0) t.push(...a, ...c, ...b); else t.push(...a, ...b, ...c); };
  build(tri); g = _geoFrom(t, null); KEBUN_GEO.set(key, g); return g; }
// rumpun: limas segi-3 (3 segitiga, tanpa alas) di titik [x, z, h, r]
const kebun_rumpun = (key, pts) => kebun_geo('rp|' + key, tri => { for (const [x, z, h, r] of pts){ const T0 = [x, h, z], a = [x, 0, z + r], b = [x + r * .87, 0, z - r * .5], c = [x - r * .87, 0, z - r * .5];
  tri(a, b, T0, [.5, .3, .3]); tri(b, c, T0, [0, .3, -1]); tri(c, a, T0, [-.5, .3, .3]); } });
// baris punggung (sawi/kangkung): [x, z0, z1, h, b] sejajar z
const kebun_baris = (key, rows) => kebun_geo('br|' + key, tri => { for (const [x, z0, z1, h, b] of rows){ const L0 = [x - b / 2, 0, z0], L1 = [x - b / 2, 0, z1], R0 = [x + b / 2, 0, z0], R1 = [x + b / 2, 0, z1], T0 = [x, h, z0], T1 = [x, h, z1];
  tri(L0, L1, T1, [-1, .5, 0]); tri(L0, T1, T0, [-1, .5, 0]); tri(R0, T0, T1, [1, .5, 0]); tri(R0, T1, R1, [1, .5, 0]); } });
const kebun_lembar = (key, rects) => kebun_geo('lb|' + key, tri => { for (const [x0, z0, x1, z1] of rects){ tri([x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [0, 1, 0]); tri([x0, 0, z0], [x1, 0, z1], [x0, 0, z1], [0, 1, 0]); } });
// bilah 2 muka: dari p0 ke p1, lebar w ke arah vektor sisi 'sd' (dinormalkan). list = [[p0, p1, w, sd]..]
const kebun_bilah = (key, list) => kebun_geo('bl|' + key, tri => { for (const [p0, p1, w, sd] of list){ const L = Math.hypot(sd[0], sd[1], sd[2]) || 1, h = [sd[0] / L * w / 2, sd[1] / L * w / 2, sd[2] / L * w / 2];
  const a = [p0[0] - h[0], p0[1] - h[1], p0[2] - h[2]], b = [p0[0] + h[0], p0[1] + h[1], p0[2] + h[2]], c = [p1[0] + h[0], p1[1] + h[1], p1[2] + h[2]], d = [p1[0] - h[0], p1[1] - h[1], p1[2] - h[2]];
  tri(a, b, c); tri(a, c, d); } });

CAT.kebun.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, LW = fx + .8, LD = fz + .8, hx = LW / 2 - .1, hz = LD / 2 - .1, R0 = rangka(0, 0, 0, 0);
  const bx = (sx, sy, sz, x, y, z, col, o) => taruh(R0, 'box', sx, sy, sz, x, y + sy / 2, z, col, Object.assign({ slot: 0 }, o));
  const cus = (geo, y, col, o) => taruh(R0, 'custom', 1, 1, 1, 0, y, 0, col, Object.assign({ geo: geo.geo, edges: null, slot: 0, noHull: true, noEdge: true }, o));
  const K = Math.round(LW * 10) + '|' + s, kanan = s === 0 || s === 2, depan = s < 2, js = kanan ? 1 : -1;
  const BAMBU = [], TIANG = [], DAUN = [[], []], RAMBAT = [];   // bilah per warna (digabung 1 geometri per warna)
  const tegak = (x, z, y0, h, w, sd) => TIANG.push([[x, y0, z], [x, y0 + h, z], w, sd]);
  // ---- tanah olah + jalan setapak (lebih terang) dari gerbang ke belakang ----
  const gX = js * .6, jw = .9;
  cus(kebun_lembar(K + 'tn', [[-hx, -hz, hx, hz]]), .07, '#A88A62');
  cus(kebun_lembar(K + 'jl', [[gX - jw / 2, -hz + .4, gX + jw / 2, hz]]), .08, '#C9AE84');
  // ---- 3 bedeng ,95 × 4,6 tinggi ,25 di sisi tanpa gubuk ----
  const bl = depan ? 4.6 : 3.6, bz = depan ? -hz + .5 + bl / 2 : hz - .9 - bl / 2, bw = .95, xs = [];
  const xa = kanan ? -hx + .4 : gX + jw / 2 + .3, xb = kanan ? gX - jw / 2 - .3 : hx - .4, nb = 3, gp = (xb - xa - nb * bw) / (nb - 1);
  for (let k = 0; k < nb; k++){ const x = xa + bw / 2 + k * (bw + gp); xs.push(x); bx(bw, .25, bl, x, .06, bz, '#6B4F36'); }
  const yT = .31, z0 = bz - bl / 2 + .25, z1 = bz + bl / 2 - .25, iA = kanan ? 0 : 2, iB = 1, iC = kanan ? 2 : 0;
  // bedeng A: cabai/terong (rumpun 2 baris) + buah merah/ungu (detail dekat)
  const pts = []; for (let r = 0; r < 6; r++) for (const t of [-1, 1]) pts.push([xs[iA] + t * .22, z0 + (z1 - z0) * (r + .5) / 6 + t * .1, .5, .24]);
  cus(kebun_rumpun(K + 'a', pts), yT, '#5F8A3E', { lod: 1 });
  for (const k of [1, 6, 9]) bx(.1, .1, .1, pts[k][0] + .1, yT + .22, pts[k][1] + .08, s === 1 ? '#6F4E8C' : '#C9503C', { lod: 1, noEdge: true });
  // bedeng B: sawi/kangkung berbaris (seed 3: jagung = rumpun tinggi)
  if (s === 3){ const jg = []; for (let r = 0; r < 5; r++) for (const t of [-1, 1]) jg.push([xs[iB] + t * .2, z0 + (z1 - z0) * (r + .5) / 5, 1.5, .2]); cus(kebun_rumpun(K + 'jg', jg), yT, '#7FA850', { lod: 1 }); }
  else cus(kebun_baris(K + 'b', [-.3, 0, .3].map(d => [xs[iB] + d, z0, z1, .22, .22])), yT, PAL.bedeng, { lod: 1 });
  // bedeng C: kacang panjang — ajir bambu condong bertemu di palang atas + rambatan hijau
  for (let k = 0; k < 4; k++){ const z = z0 + (z1 - z0) * k / 3; for (const t of [-1, 1]){ BAMBU.push([[xs[iC] + t * .3, yT, z], [xs[iC] + t * .03, yT + 1.65, z], .05, [0, 0, 1]]);
    RAMBAT.push([[xs[iC] + t * .29, yT + .1, z + .04], [xs[iC] + t * .07, yT + 1.4, z + .04], .2, [0, 0, 1]]); } }
  BAMBU.push([[xs[iC], yT + 1.62, z0 - .05], [xs[iC], yT + 1.62, z1 + .05], .06, [1, 0, 0]]);
  // ---- gubuk kecil 2,0 × 1,7 beratap rumbia di pojok ----
  const gw = 2.0, gd = 1.7, gx0 = js * (hx - gw / 2 - .25), gz0 = depan ? hz - gd / 2 - 1.15 : -hz + gd / 2 + .9, gf = R0.sub(gx0, .06, gz0, 0);
  taruh(gf, 'box', gw, .1, gd, 0, .45, 0, '#B08A5A', { slot: 0 });
  for (const a of [-1, 1]) for (const b of [-1, 1]) tegak(gx0 + a * (gw / 2 - .07), gz0 + b * (gd / 2 - .07), .06, 2.05, .1, [1, 0, 0]);
  taruh(gf, 'prism', gw + .5, .8, gd + .6, 0, 2.0 + .4, 0, '#9C8556', { slot: 0 });
  taruh(gf, 'box', gw - .1, .9, .05, 0, .95, -gd / 2 + .05, '#C8A97A', { slot: 0 });                          // dinding anyaman belakang
  taruh(gf, 'box', .3, .32, .3, -js * (gw / 2 - .45), .66, -.3, '#E2D6B8', { slot: 0, lod: 1 });                // karung pupuk
  TIANG.push([[gx0 - js * (gw / 2 - .2), .06, gz0 + gd / 2 + .35], [gx0 - js * (gw / 2 - .2), 1.2, gz0 + gd / 2 + .1], .05, [1, 0, 0]]);   // gagang cangkul
  bx(.3, .3, .3, gX - js * .75, .06, hz - .5, '#3E6FB0', { lod: 1 });                                          // ember
  // ---- pohon: pisang (selalu) + kelapa (0,3) / pisang ke-2 (1) / pepaya (2) ----
  const pisang = (x, z, sc) => { cylLo(.11 * sc, 1.7 * sc, x, .06, z, '#8C9A5A');
    for (let k = 0; k < 5; k++){ const a = k * 1.256 + .3, dx = Math.sin(a), dz = Math.cos(a), y = .06 + 1.72 * sc;
      DAUN[k & 1].push([[x + dx * .1, y, z + dz * .1], [x + dx * 1.15 * sc, y + .25 * sc - (k % 2 ? .5 : .2) * sc, z + dz * 1.15 * sc], .45 * sc, [-dz, 0, dx]]); } };
  const kelapa = (x, z, h, ln) => { const tx = x, tz = z + h * Math.sin(ln), ty = .06 + h * Math.cos(ln);
    taruh(R0, 'cylLo', .24, h, .24, x, .06 + h / 2 * Math.cos(ln), z + h / 2 * Math.sin(ln), '#7A6A55', { slot: 0, rx: ln, noHull: true });
    for (let k = 0; k < 6; k++){ const a = k / 6 * Math.PI * 2 + .3, dx = Math.sin(a), dz = Math.cos(a); DAUN[k & 1].push([[tx, ty, tz], [tx + dx * 1.5, ty - .6, tz + dz * 1.5], .34, [-dz, 0, dx]]); }
    bx(.28, .24, .28, tx, ty - .36, tz, '#8C7A3E', { lod: 1, noEdge: true }); };
  const px = js * (hx - 1.1), pz = depan ? -hz + 1.15 : hz - 1.75;
  pisang(px, pz, .95);
  if (s === 1) pisang(px - js * 1.7, pz + .2, .8);
  else if (s === 2){ const x = -js * 1.8, z = -hz + .9; cylLo(.08, 2.5, x, .06, z, '#9C9A7A'); sphLo(.55, x, 2.75, z, '#5F8A3E', .35); bx(.2, .22, .2, x + .15, 2.25, z + .1, '#C2913A', { lod: 1, noEdge: true }); }
  else kelapa(gX, -hz + 1.55, 5.6, .1);
  // ---- pagar bambu: muka (bukaan gerbang) + kiri + kanan, tiang tiap ±1,6 + 2 palang, gapura bambu ----
  const pagX = (x0, x1, z) => { const len = x1 - x0, np = Math.max(1, Math.round(len / 1.6));
    for (const yy of [.42, .84]) BAMBU.push([[x0, yy, z], [x1, yy, z], .07, [0, 1, 0]]);
    for (let k = 0; k <= np; k++) tegak(x0 + len * k / np, z, 0, 1.0, .08, [1, 0, 0]); };
  const pagZ = (z0_, z1_, x) => { const len = z1_ - z0_, np = Math.max(1, Math.round(len / 1.6));
    for (const yy of [.42, .84]) BAMBU.push([[x, yy, z0_], [x, yy, z1_], .07, [0, 1, 0]]);
    for (let k = 0; k <= np; k++) tegak(x, z0_ + len * k / np, 0, 1.0, .08, [0, 0, 1]); };
  const zP = hz - .05, xP = hx - .05;
  pagX(-xP, gX - .75, zP); pagX(gX + .75, xP, zP); pagZ(-hz + .05, zP - .15, -xP); pagZ(-hz + .05, zP - .15, xP);
  for (const t of [-1, 1]) tegak(gX + t * .72, zP, 0, 1.75, .1, [1, 0, 0]);
  BAMBU.push([[gX - .85, 1.68, zP], [gX + .85, 1.68, zP], .09, [0, 1, 0]]);
  // bilah digabung per warna
  cus(kebun_bilah(K + 'bb', BAMBU), 0, '#C9A86A', { lod: 1 }); cus(kebun_bilah(K + 'tg', TIANG), 0, '#9C7A52');
  cus(kebun_bilah(K + 'd0', DAUN[0]), 0, '#6E9A45'); cus(kebun_bilah(K + 'd1', DAUN[1]), 0, '#5C7D3E'); cus(kebun_bilah(K + 'rb', RAMBAT), 0, '#5F8F4E', { lod: 1 });
};
