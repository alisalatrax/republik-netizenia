/* waduk (2×2) — spek-gaya §6 no. 26 "Bendungan & Sungai". Bendung irigasi kecil khas Jawa:
   (1) waduk hulu di belakang, muka air TINGGI y 1,85, dibatasi tanggul tanah berbentuk U (lereng rumput, mercu jalan inspeksi
       berkerikil, muka dalam talud batu); papan duga muka air merah-putih; rangkaian pelampung oranye (seed 1/3) / perahu (2/3).
   (2) bendung beton 10,8 × 2,24 × 1,8 di tengah: 4 pintu air sorong baja di antara 5 pilar yang naik 1,1 di atas mercu, balok
       pengangkat + roda pemutar (cylLo 8 segmen) per pintu, pagar besi di kedua sisi mercu (jembatan inspeksi).
   (3) sungai hilir di depan bendung, muka air RENDAH y ,3, talud beton di tepi muka, buih putih di bawah pintu yang terbuka.
   (4) jembatan kayu 1,0 + pagar menyeberangi sungai ke pelataran kanan/kiri + tangga inspeksi naik ke mercu tanggul.
   (5) rumah jaga (dinding WALLS, atap limasan genteng = hipGeo, pintu, jendela, papan 'JAGA', lampu) di halaman depan,
       tugu papan nama beton 'BENDUNGAN', tembok rendah muka jalan dengan bukaan, 2 pohon + semak.
   Varian seed: 0 jembatan kanan, rumah jaga kiri, 2 pintu terbuka · 1 dicerminkan + pelampung · 2 semua pintu terbuka + perahu · 3 dicerminkan, 1 pintu terbuka, perahu + pelampung, pohon ganti kelapa. Semua bagian di dalam kavling. */
const WADUK_GEO = new Map();
function waduk_geo(key, build){ let g = WADUK_GEO.get(key); if (g) return g; const t = [], e = [];
  const tri = (a, b, c, n) => { const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const cr = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] < 0) t.push(...a, ...c, ...b); else t.push(...a, ...b, ...c); };
  const quad = (a, b, c, d, n) => { tri(a, b, c, n); tri(a, c, d, n); };
  build(quad, (a, b) => e.push(...a, ...b)); g = _geoFrom(t, e.length ? e : null); WADUK_GEO.set(key, g); return g; }
/* tanggul tanah: ruas lurus [x0,z0,x1,z1, nx,nz] = garis tepi DALAM + arah ke LUAR. Penampang: muka dalam tegak (y0..H), mercu selebar wt,
   lereng luar turun ke tanah sejauh wb dari tepi dalam. bagian: 'mercu' | 'lereng' | 'dalam' (satu warna per geometri); garis = 2 tepi mercu. */
const waduk_tanggul = (key, segs, H, wt, wb, bagian, y0) => waduk_geo('tg|' + key + bagian, (quad, ed) => {
  for (const [x0, z0, x1, z1, nx, nz] of segs){ const P = (x, z, d, y) => [x + nx * d, y, z + nz * d], up = [0, 1, 0], out = [nx, wb - wt > 0 ? H / (wb - wt) * 0 + .6 : 0, nz], inn = [-nx, 0, -nz];
    const A0 = P(x0, z0, 0, H), A1 = P(x1, z1, 0, H), B0 = P(x0, z0, wt, H), B1 = P(x1, z1, wt, H), C0 = P(x0, z0, wb, y0), C1 = P(x1, z1, wb, y0), D0 = P(x0, z0, 0, y0), D1 = P(x1, z1, 0, y0);
    if (bagian === 'mercu'){ quad(A0, A1, B1, B0, up); ed(A0, A1); ed(B0, B1); }
    if (bagian === 'lereng'){ quad(B0, B1, C1, C0, out);
      const ex = [x1 - x0, 0, z1 - z0], L = Math.hypot(ex[0], ex[2]); for (const [Q, S, sg] of [[[B0, C0, D0, A0], 0, -1], [[B1, C1, D1, A1], 1, 1]]){ const n = [ex[0] / L * sg, 0, ex[2] / L * sg]; quad(Q[0], Q[1], Q[2], Q[3], n); } }
    if (bagian === 'dalam') quad(D0, D1, A1, A0, inn); } });
const waduk_lembar = (key, rects) => waduk_geo('lb|' + key, quad => { for (const [x0, z0, x1, z1] of rects) quad([x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1], [0, 1, 0]); });

CAT.waduk.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, LW = fx + .8, LD = fz + .8, hx = LW / 2 - .1, hz = LD / 2 - .1, R0 = rangka(0, 0, 0, 0);
  const bx = (sx, sy, sz, x, y, z, col, o) => taruh(R0, 'box', sx, sy, sz, x, y + sy / 2, z, col, Object.assign({ slot: 0 }, o));
  const cus = (geo, y, col, o) => taruh(R0, 'custom', 1, 1, 1, 0, y, 0, col, Object.assign({ geo: geo.geo, edges: geo.edges, slot: 0, noHull: true }, o));
  const K = Math.round(LW * 10) + 'x' + Math.round(LD * 10), js = s % 2 ? -1 : 1;   // js: sisi jembatan (+1 kanan)
  const BETON = '#BFB6A8', BETON2 = '#A9A398', TALUD = '#9E9A90', BAJA = '#5E666C', AIR = PAL.air;
  // ---- tata letak ----
  const xi = Math.min(5.4, hx - 2.3), Ht = 2.3, wt = .9, wb = Math.min(2.4, hx - xi - .05), zB = -hz + wb, zD0 = -1.9, zD1 = -.1, zS0 = .45, zS1 = Math.min(3.4, hz - 4.2), yHulu = 1.85, yHilir = .3;
  // ---- (1) tanggul U + waduk hulu ----
  const segs = [[-hx + .05, zB, hx - .05, zB, 0, -1], [-xi, zD1, -xi, zB, -1, 0], [xi, zB, xi, zD1, 1, 0]];
  cus(waduk_tanggul(K, segs, Ht, wt, wb, 'mercu', .06), 0, '#C9B48A');
  cus(waduk_tanggul(K, segs, Ht, wt, wb, 'lereng', .06), 0, RUMPUT[0], { noEdge: true });
  cus(waduk_tanggul(K, segs, Ht, wt, wb, 'dalam', .06), 0, TALUD, { noEdge: true });
  cus(waduk_lembar(K + 'hulu', [[-xi, zB, xi, zD0]]), yHulu, AIR, { noEdge: true });
  for (let k = 0; k < 2; k++) bx(1.6 + k * .5, .02, .08, -xi + 1.6 + k * 4.1, yHulu + .005, zB + .9 + k * 1.1, '#A9BCCB', { lod: 1, noEdge: true, noHull: true });   // riak
  // papan duga muka air di muka hulu bendung (merah-putih)
  for (let k = 0; k < 2; k++) bx(.18, .3, .05, -xi + .6, yHulu - .2 + k * .3, zD0 - .03, k % 2 ? '#E6E2D8' : '#B5473A', { lod: 1, noEdge: true });
  if (s === 1 || s === 3){ for (let k = 0; k < 4; k++) bx(.4, .16, .22, -xi + 1.4 + k * (2 * xi - 2.8) / 3, yHulu - .04, zD0 - 1.0, '#D9762B', { lod: 1 }); }
  if (s >= 2){ const f = R0.sub(-js * 2.0, yHulu, zB + 1.3, .3); taruh(f, 'box', .8, .3, 2.4, 0, .1, 0, '#8C6A48', { slot: 0 }); taruh(f, 'box', .6, .06, .3, 0, .28, .4, '#6B4A33', { slot: 0, lod: 1 }); }
  // ---- (2) bendung + pilar + pintu sorong + roda ----
  const DW = 2 * xi, yD = .06, yTop = Ht;
  bx(DW, yTop - yD, zD1 - zD0, 0, yD, (zD0 + zD1) / 2, BETON);
  const nG = 4, pw = .5, gw = (DW - (nG + 1) * pw) / nG, buka = [[1, 2], [0, 3], [0, 1, 2, 3], [js > 0 ? 1 : 2]][s];
  for (let k = 0; k <= nG; k++){ const x = -DW / 2 + pw / 2 + k * (gw + pw), ed = k === 0 || k === nG;
    bx(pw, yTop + 1.15 - yD, .7, clamp(x, -DW / 2 + pw / 2, DW / 2 - pw / 2), yD, zD1 + .3, BETON2); }
  for (let k = 0; k < nG; k++){ const x = -DW / 2 + pw + gw / 2 + k * (gw + pw), op = buka.includes(k), f = R0.sub(x, 0, zD1, 0);
    taruh(f, 'box', gw, 1.25, .08, 0, yD + 1.25 / 2 + (op ? .55 : 0), .1, BAJA, { slot: 0 });                         // daun pintu sorong
    if (op) taruh(f, 'box', gw - .1, .55, .05, 0, yD + .275, .03, '#2E3438', { slot: 0, attach: 'z+', noEdge: true });  // celah gelap
    taruh(f, 'cylLo', .7, .07, .7, 0, yTop + 1.1 + .45, .38, '#B5473A', { slot: 0, rx: Math.PI / 2 });                // roda pemutar
    if (op) taruh(f, 'box', gw, .04, 1.0, 0, yHilir + .02, .95, '#E6E8E4', { slot: 0, lod: 1, noEdge: true, noHull: true }); }   // buih
  bx(DW, .3, .5, 0, yTop + .8, zD1 + .25, BETON2);                                                                      // balok pengangkat menerus di atas pilar
  // pagar besi mercu bendung (depan & belakang) = jembatan inspeksi
  for (const zz of [zD0 + .08, zD1 - .08]) _jeruji(rangka(0, yTop, zz, 0), DW - .1, .9, 0, 0, 0, 9, '#3F4A4F', { batang: .04, rel: .05, lod: 1 });
  // ---- (3) sungai hilir: air rendah + talud depan + tepi samping ----
  cus(waduk_lembar(K + 'hilir', [[-hx, zD1 + .7, hx, zS1]]), yHilir, AIR, { noEdge: true });
  cus(waduk_lembar(K + 'hilir2', [[-xi, zD1, xi, zD1 + .7]]), yHilir, '#8FA1B2', { noEdge: true });
  bx(2 * hx, .55, .3, 0, .06, zS1 + .15, TALUD);
  for (const t of [-1, 1]){ const x0 = t * xi, x1 = t * hx; bx(Math.abs(x1 - x0), .55, .8 + zD1 * 0 + .7, (x0 + x1) / 2, .06, zD1 + .35, TALUD); }
  // ---- (4) jembatan kayu 1,0 + pagar menyeberang sungai di sisi js, tangga inspeksi naik ke mercu tanggul ----
  const xJ = js * (xi + .9), yJ = .7, L = zS1 + .3 - (zD1 + .7);
  { const f = R0.sub(xJ, 0, (zS1 + .3 + zD1 + .7) / 2, 0); taruh(f, 'box', 1.0, .12, L + .2, 0, yJ, 0, '#8C6A48', { slot: 0 });
    for (const t of [-1, 1]){ _jeruji(f.sub(t * .48, 0, 0, Math.PI / 2), L, .85, 0, yJ + .06, 0, 6, '#6B4A33', { batang: .06, rel: .06, lod: 1 }); }
    for (const t of [-1, 1]) taruh(f, 'box', .9, yJ - yHilir, .16, 0, yHilir + (yJ - yHilir) / 2, t * (L / 2 - .5), '#6B4A33', { slot: 0, lod: 1 }); }
  // tangga beton dari pelataran sisi (atas talud samping) naik ke mercu tanggul samping (5 anak tangga, sepanjang −z)
  for (let k = 0; k < 4; k++){ const h = .55 + (k + 1) * (Ht - .55) / 4; bx(.9, h - .06, .55, js * (xi + wt / 2 + .05), .06, zD1 - .25 - k * .55, BETON, { lod: k ? 1 : 0 }); }
  // ---- (5) halaman depan: rumah jaga, tugu nama, tembok muka, pohon, semak ----
  const zH0 = zS1 + .3, zW = hz - .12, rw = 3.2, rd = 2.4, rxc = -js * (hx - rw / 2 - .6), rzc = (zH0 + .5 + zW - 1.4) / 2, rzf = rzc + rd / 2;
  dinding(rw, LANTAI - .4, rd, rxc, 0, rzc, wl, { plinth: .4 });
  atapLimasan(rw, rd, rxc, LANTAI - .4, rzc, { sudut: 30, overhang: .45, c: gt, cWall: wl });
  pintu(rxc - js * .7, rzf, { wall: wl, c: KAYU, boven: false });
  jendela(rxc + js * .65, 1.0, rzf, { w: .9, h: 1.1, wall: wl, kusen: KUSEN });
  teks('POS JAGA', rxc + js * .65, 2.3, rzf, { tinggi: .2, lebarMaks: 1.3, c: '#3F6B62' });
  lampuDinding(rxc - js * .7, 2.45, rzf, {});
  // tugu papan nama beton di muka jalan
  const tx = js * 1.6, tf = rangka(tx, 0, zW - .5, 0);
  taruh(tf, 'box', 3.4, .3, .5, 0, .21, 0, BETON2, { slot: 0 }); taruh(tf, 'box', 3.0, .9, .3, 0, .81, 0, '#D9D4C8', { slot: 0 });
  _teks(tf, 'BENDUNGAN', 0, .6, .16, 2.6, .36, '#3F6B62');
  // tembok rendah muka jalan dengan bukaan masuk 2,4 di tengah
  for (const [x0, x1] of [[-hx, -1.2], [1.2, hx]]) bx(x1 - x0, .5, .2, (x0 + x1) / 2, .06, zW, '#D9D4C8');
  for (const t of [-1, 1]) bx(.34, .9, .34, t * 1.35, .06, zW, BETON2);
  // jalan paving dari bukaan ke rumah jaga & jembatan
  cus(waduk_lembar(K + 'jl' + s, [[-1.1, zH0 + .1, 1.1, zW - .1], [Math.min(rxc, xJ) * 0 - 1.1 + (js > 0 ? 0 : -(hx - 2.2)), zH0 + .15, (js > 0 ? hx - .3 : 1.1), zH0 + 1.2]]), .075, '#CFC6B8', { noEdge: true });
  // pohon + semak
  if (s === 3){ const x = js * (hx - 1.9), z = zW - 1.7; taruh(R0, 'cylLo', .24, 5.4, .24, x, .06 + 2.7, z, '#7A6A55', { slot: 0, noHull: true });
    for (let k = 0; k < 6; k++) taruh(R0.sub(x, 5.46, z, k / 6 * Math.PI * 2 + .3), 'box', .34, .04, 1.6, 0, -.28, .66, k % 2 ? '#5C7D3E' : '#6E9A45', { slot: 0, rx: .5, noEdge: true }); }
  else pohonKecil(js * (hx - 1.7), zW - 1.7, .9, {});
  pohonKecil(-js * (xi + 1.2), zB - .3 + 0, .85, {});                       // di lereng belakang (sisi rumah jaga)
  for (const [x, z] of [[2.5 * js, zW - .55], [-js * (hx - .7), zH0 + .9]]){
    const q = sphLo(.42, clamp(x, -hx + .45, hx - .45), .38, clamp(z, -hz + .45, hz - .45), PAL.semak, .32); q.lod = 1; q.noEdge = true; }
};
