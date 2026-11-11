/* taman (1×1) — spek-gaya §6 no. 10. Taman kota / taman RW khas Indonesia: rumput 2 nada bergaris diagonal 45°, jalur lingkar paving
   (r ≈ 2,2) + 4 jalur radial ke 4 pintu masuk, air mancur (kolam cincin batu + mangkuk + semburan), gazebo oktagonal beratap genteng
   (atau taman bermain ayunan + perosotan), 2 bedeng bunga, kanstin beton + pagar besi rendah dengan bukaan di tiap jalur, 4 bangku,
   2 lampu taman, papan 'TAMAN', tong sampah, pohon tabebuya (bunga merah muda) + 2 pohon bulat (pohonKecil/sphLo hemat).
   Varian seed: 0 gazebo kiri-belakang · 1 dicerminkan (gazebo kanan-belakang, tabebuya kiri) · 2 taman bermain ganti gazebo, 2 tabebuya
   (kiri-depan & kanan-belakang), pohon bulat kanan-depan, bangku pindah ke jalur belakang · 3 tata letak lain: jalur lurus bersilang +
   plaza persegi dengan pohon peneduh 3 gumpalan + bangku melingkar oktagonal di tengah, pergola memanjang berbunga bugenvil di kiri-belakang,
   kolam bundar + patung burung di kanan-belakang, tabebuya & pohon bulat di pojok depan. Rumput 2 nada diagonal 45° lebar 1,6 (lihat laporan:
   2,4 di kavling 8 m tertutup jalur → tidak terbaca). Semak berlapis 2 nada di pojok. Semua bagian di dalam kavling (|x| ≤ LW/2 − ,1). */
const TAMAN_GEO = new Map();
// geometri khusus berskala 1 (koordinat lokal = meter), di-cache per kunci. tri(a,b,c,n): urutan dibalik bila normal tidak searah n.
function taman_geo(key, build){ let g = TAMAN_GEO.get(key); if (g) return g; const t = [], e = [];
  const tri = (a, b, c, n) => { const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const cr = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] < 0) t.push(...a, ...c, ...b); else t.push(...a, ...b, ...c); };
  build(tri, (a, b) => e.push(...a, ...b)); g = _geoFrom(t, e.length ? e : null); TAMAN_GEO.set(key, g); return g; }
// lembar datar (poligon cembung [[x,z]..]) di y 0, menghadap atas
const taman_lembar = (key, polys) => taman_geo(key, tri => { for (const p of polys) for (let k = 1; k < p.length - 1; k++) tri([p[0][0], 0, p[0][1]], [p[k][0], 0, p[k][1]], [p[k + 1][0], 0, p[k + 1][1]], [0, 1, 0]); });
// cincin bersisi N (jalur lingkar, bibir kolam): atas + dinding luar + dinding dalam, y 0..h; garis = keliling atas luar & dalam
const taman_cincin = (r0, r1, h, N, a0) => taman_geo(['cc', r0, r1, h, N, a0].join('|'), (tri, ed) => {
  for (let k = 0; k < N; k++){ const a = a0 + k / N * Math.PI * 2, b = a0 + (k + 1) / N * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    const I0 = [r0 * sa, h, r0 * ca], I1 = [r0 * sb, h, r0 * cb], O0 = [r1 * sa, h, r1 * ca], O1 = [r1 * sb, h, r1 * cb], m = (a + b) / 2, no = [Math.sin(m), 0, Math.cos(m)];
    tri(I0, O0, O1, [0, 1, 0]); tri(I0, O1, I1, [0, 1, 0]);
    const O0b = [O0[0], 0, O0[2]], O1b = [O1[0], 0, O1[2]], I0b = [I0[0], 0, I0[2]], I1b = [I1[0], 0, I1[2]];
    tri(O0b, O1b, O1, no); tri(O0b, O1, O0, no); const ni = no.map(v => -v); tri(I0b, I1, I1b, ni); tri(I0b, I0, I1, ni);
    ed(O0, O1); ed(I0, I1); } });
// limas bersisi N (atap gazebo oktagonal) alas y 0, puncak y h, dengan alas tertutup; garis = jurai + keliling alas
const taman_limas = (r, h, N, a0) => taman_geo(['lm', r, h, N, a0].join('|'), (tri, ed) => { const A = [0, h, 0];
  for (let k = 0; k < N; k++){ const a = a0 + k / N * Math.PI * 2, b = a0 + (k + 1) / N * Math.PI * 2, P0 = [r * Math.sin(a), 0, r * Math.cos(a)], P1 = [r * Math.sin(b), 0, r * Math.cos(b)], m = (a + b) / 2;
    tri(P0, P1, A, [Math.sin(m), .6, Math.cos(m)]); tri(P0, [0, 0, 0], P1, [0, -1, 0]); ed(P0, P1); ed(P0, A); } });
// potong poligon cembung dengan setengah bidang  n·p ≤ d
function taman_klip(poly, nx, nz, d){ const o = []; for (let k = 0; k < poly.length; k++){ const a = poly[k], b = poly[(k + 1) % poly.length], da = nx * a[0] + nz * a[1] - d, db = nx * b[0] + nz * b[1] - d;
  if (da <= 0) o.push(a); if ((da < 0) !== (db < 0) && da !== db){ const t = da / (da - db); o.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } } return o; }

// bola rendah 6×3 (24 segitiga, normal halus) untuk semak/gumpalan kecil — lebih hemat dari sphLo (56); satuan diameter 1 (taruh 'custom' s = ukuran)
function taman_bola(){ let g = TAMAN_GEO.get('bola'); if (g) return g; const t = [], N = 6, M = 3, P = (i, j) => { const th = j / M * Math.PI, ph = i / N * Math.PI * 2; return [.5 * Math.sin(th) * Math.cos(ph), .5 * Math.cos(th), .5 * Math.sin(th) * Math.sin(ph)]; };
  for (let j = 0; j < M; j++) for (let i = 0; i < N; i++){ const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
    if (j > 0) t.push(...a, ...b, ...c); if (j < M - 1) t.push(...a, ...c, ...d); else t.push(...a, ...b, ...c); }
  g = _geoFrom(t, null); const pa = g.geo.attributes.position.array, na = g.geo.attributes.normal.array;
  for (let k = 0; k < pa.length; k += 3){ const l = Math.hypot(pa[k], pa[k + 1], pa[k + 2]) || 1; na[k] = pa[k] / l; na[k + 1] = pa[k + 1] / l; na[k + 2] = pa[k + 2] / l; }
  TAMAN_GEO.set('bola', g); return g; }
// pengganti sphLo(r, x, y, z, c, ry) berbasis taman_bola
const taman_sph = (r, x, y, z, c, ry) => { const B = taman_bola(); return taruh(rangka(0, 0, 0, 0), 'custom', r * 2, (ry || r) * 2, r * 2, x, y, z, c, { geo: B.geo, edges: null, slot: 0, noEdge: true }); };

CAT.taman.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, LW = fx + .8, LD = fz + .8, hx = LW / 2 - .1, hz = LD / 2 - .1, R0 = rangka(0, 0, 0, 0);
  const cm = s === 1 ? -1 : 1, silang = s === 3;      // cermin kiri-kanan (seed 1) · tata letak silang (seed 3)
  const PV = '#CFC6B8', BATU = '#C9C1B2', KANSTIN = '#BFB6A8', KAYUB = '#8C6A48';
  const bx = (sx, sy, sz, x, y, z, col, o) => taruh(R0, 'box', sx, sy, sz, x, y + sy / 2, z, col, Object.assign({ slot: 0 }, o));
  const cus = (geo, x, y, z, col, o) => taruh(R0, 'custom', 1, 1, 1, x, y, z, col, Object.assign({ geo: geo.geo, edges: geo.edges, slot: 0 }, o));

  // ---- rumput 2 nada: pita diagonal 45° lebar 1,6 (dua lembar, tidak bertumpuk → tanpa z-fight) ----
  const sq = [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]], bw = 1.6, um = (hx + hz) / Math.SQRT2, nb = Math.ceil(um * 2 / bw) + 1, pit = [[], []];
  for (let k = 0; k < nb; k++){ const u0 = -nb * bw / 2 + k * bw, u1 = u0 + bw; let p = taman_klip(sq, 1 / Math.SQRT2, 1 / Math.SQRT2, u1); p = taman_klip(p, -1 / Math.SQRT2, -1 / Math.SQRT2, -u0); if (p.length >= 3) pit[k % 2].push(p); }
  for (let j = 0; j < 2; j++) cus(taman_lembar('rp' + j + '|' + hx + '|' + hz + '|' + bw, pit[j]), 0, .08, 0, RUMPUT[j], { noHull: true, noEdge: true });

  const yP = .14, rw = 1.1;
  if (!silang){
    // ---- jalur lingkar + 4 radial (paving, muka atas sama tinggi & warna; ujung radial di dalam cincin tanpa garis) ----
    const rIn = 1.85, rOut = 2.6;
    cus(taman_cincin(rIn, rOut, yP - .06, 12, 0), 0, .06, 0, PV, { noHull: true });
    const r0 = rOut - .12, L = hz - r0;
    bx(rw, yP - .06, L, 0, .06, r0 + L / 2, PV, { attach: 'z-', noHull: true }); bx(rw, yP - .06, L, 0, .06, -r0 - L / 2, PV, { attach: 'z+', noHull: true });
    const Lx = hx - r0; bx(Lx, yP - .06, rw, r0 + Lx / 2, .06, 0, PV, { attach: 'x-', noHull: true }); bx(Lx, yP - .06, rw, -r0 - Lx / 2, .06, 0, PV, { attach: 'x+', noHull: true });
    // ---- air mancur: bibir kolam batu (cincin) + air + tiang + mangkuk + semburan (nyala lembut) ----
    const rK = 1.55;
    cus(taman_cincin(rK - .2, rK, .5, 8, 0), 0, .06, 0, BATU);
    cylLo(rK - .18, .3, 0, .06, 0, PAL.air).noEdge = true;
    cylLo(.2, .72, 0, .36, 0, BATU);
    cylLo(.62, .14, 0, 1.0, 0, BATU).lod = 1;
    const air2 = cylLo(.48, .06, 0, 1.12, 0, PAL.air); air2.lod = 1; air2.noEdge = true;
    taruh(R0, 'sphLo', .36, .5, .36, 0, 1.38, 0, '#DCE6EC', { glow: true, lod: 1 });
  } else {
    // ---- jalur lurus bersilang + plaza persegi 3,2 (5 potong tanpa tumpang → tanpa z-fight) ----
    const pq = 1.6, L = hz - pq, Lx = hx - pq;
    bx(2 * pq, yP - .06, 2 * pq, 0, .06, 0, PV, { noHull: true });
    bx(rw, yP - .06, L, 0, .06, pq + L / 2, PV, { attach: 'z-', noHull: true }); bx(rw, yP - .06, L, 0, .06, -pq - L / 2, PV, { attach: 'z+', noHull: true });
    bx(Lx, yP - .06, rw, pq + Lx / 2, .06, 0, PV, { attach: 'x-', noHull: true }); bx(Lx, yP - .06, rw, -pq - Lx / 2, .06, 0, PV, { attach: 'x+', noHull: true });
    // pohon peneduh (ketapang/trembesi kecil) 3 gumpalan + bangku melingkar oktagonal (dudukan kayu di atas kaki beton)
    cus(taman_cincin(.62, 1.12, .3, 8, Math.PI / 8), 0, yP, 0, BATU, { noHull: true });
    cus(taman_cincin(.66, 1.18, .06, 8, Math.PI / 8), 0, yP + .3, 0, KAYUB);
    cylLo(.2, 2.3, 0, yP, 0, '#5E4630');
    const t1 = sphLo(1.35, 0, 3.0, 0, '#5F8A3E', .95); t1.noEdge = true;
    const t2 = taman_sph(.95, .75, 3.55, -.45, '#6A9245', .7); t2.lod = 1;
    const t3 = taman_sph(.85, -.7, 3.45, .5, '#4F7A3F', .65); t3.lod = 1;
    // pergola memanjang (kayu) berbunga bugenvil di kiri-belakang + bangku di bawahnya
    const pg = rangka(-2.35, .06, -2.6, 0), pL = 2.5;
    for (const a of [-1, 1]) for (const b of [-1, 1]) taruh(pg, 'box', .12, 2.3, .12, a * (pL / 2 - .1), 1.15, b * .6, '#6B4A33', { slot: 0 });
    for (const b of [-1, 1]) taruh(pg, 'box', pL + .2, .14, .1, 0, 2.37, b * .6, '#6B4A33', { slot: 0 });
    for (let k = 0; k < 5; k++) taruh(pg, 'box', .08, .08, 1.6, -pL / 2 + .15 + k * (pL - .3) / 4, 2.48, 0, '#7A5A3A', { slot: 0, lod: 1 });
    taruh(pg, 'sphLo', 2.2, .42, 1.5, -.3, 2.66, -.05, '#B0607A', { slot: 0, noEdge: true }); { const B = taman_bola(); taruh(pg, 'custom', 1.3, .36, 1.0, .75, 2.62, .15, '#5F8A3E', { geo: B.geo, edges: null, slot: 0, noEdge: true, lod: 1 }); }
    bangku(-2.35, -2.6, { w: 1.6, c: KAYUB });
    // kolam bundar + patung burung di kanan-belakang
    const kx = 2.3, kz = -2.3;
    cus(taman_cincin(.82, 1.02, .42, 8, Math.PI / 8), kx, .06, kz, BATU);
    cylLo(.84, .26, kx, .06, kz, PAL.air).noEdge = true;
    { const f = rangka(kx, .32, kz, -.7); taruh(f, 'box', .3, .4, .3, 0, .2, 0, BATU, { slot: 0 }); taruh(f, 'box', .22, .26, .5, 0, .53, 0, '#7A6A4E', { slot: 0, lod: 1 }); taruh(f, 'box', .14, .22, .2, 0, .73, .26, '#7A6A4E', { slot: 0, lod: 1, rx: -.4 }); }
    bangku(kx - .1, kz + 1.5, { w: 1.3, rot: Math.PI, c: KAYUB });
  }

  // ---- kanstin beton keliling + pagar besi rendah, bukaan 1,5 di tiap jalur ----
  const kt = .18, kh = .26, gap = .78;
  for (const sz of [-1, 1]) for (const sx of [-1, 1]){ const x0 = sx * gap, x1 = sx * hx, len = Math.abs(x1 - x0), xc = (x0 + x1) / 2;
    bx(len, kh, kt, xc, .06, sz * (hz - kt / 2), KANSTIN, { noHull: true });
    _jeruji(rangka(xc, .06 + kh, sz * (hz - kt / 2), 0), len - .06, .55, 0, 0, 0, Math.max(3, Math.round(len / 1.0)), '#2F3A36', { batang: .03, rel: .04, lod: 1 }); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]){ const z0 = sz * gap, z1 = sz * (hz - kt + .03), len = Math.abs(z1 - z0), zc = (z0 + z1) / 2;
    bx(kt, kh, len, sx * (hx - kt / 2), .06, zc, KANSTIN, { noHull: true });
    _jeruji(rangka(sx * (hx - kt / 2), .06 + kh, zc, Math.PI / 2), len - .06, .55, 0, 0, 0, Math.max(3, Math.round(len / 1.0)), '#2F3A36', { batang: .03, rel: .04, lod: 1 }); }
  // tiang pagar di ujung bukaan (pilar kecil beton)
  for (const [x, z] of [[-gap, hz], [gap, hz], [-gap, -hz], [gap, -hz]]) bx(.24, .95, .24, x + Math.sign(x) * .12, .06, z - Math.sign(z) * .12, '#D9D4C8', { noHull: true });

  // ---- gazebo oktagonal (seed 0,1) atau taman bermain (seed 2) di pojok belakang ----
  const gx = -2.42 * cm, gz = -2.42;
  if (s < 2){
    cylLo(1.18, .34, gx, .06, gz, '#B9AE98');                                                   // lantai batu
    const st = rangka(gx, 0, gz, Math.atan2(-gx, -gz)); taruh(st, 'box', .9, .18, .4, 0, .15, 1.28, '#B9AE98', { slot: 0 });   // anak tangga menghadap air mancur
    for (let k = 0; k < 4; k++){ const a = Math.PI / 4 + k * Math.PI / 2; bx(.13, 2.12, .13, gx + Math.sin(a) * .9, .4, gz + Math.cos(a) * .9, '#6B4A33'); }
    cus(taman_limas(1.42, 1.05, 8, Math.PI / 8), gx, 2.6, gz, gt, { slot: 3 });
    bx(.1, .45, .1, gx, 3.6, gz, '#C2913A', { lod: 1 });
  } else if (s === 2){
    // ayunan 2 dudukan (rangka A besi) + perosotan
    const f = rangka(gx, .06, gz, Math.PI / 4);
    for (const sx of [-1, 1]){ taruh(f, 'box', .09, 2.1, .09, sx * 1.1, 1.0, -.35, '#3E6FB0', { slot: 0, rx: .17 }); taruh(f, 'box', .09, 2.1, .09, sx * 1.1, 1.0, .35, '#3E6FB0', { slot: 0, rx: -.17 }); }
    taruh(f, 'box', 2.35, .09, .09, 0, 2.05, 0, '#3E6FB0', { slot: 0 });
    for (const sx of [-.45, .45]){ taruh(f, 'box', .03, 1.55, .03, sx - .18, 1.25, 0, '#8A939A', { slot: 0 }); taruh(f, 'box', .03, 1.55, .03, sx + .18, 1.25, 0, '#8A939A', { slot: 0 }); taruh(f, 'box', .45, .05, .2, sx, .47, 0, '#C2913A', { slot: 0 }); }
    const g2 = rangka(gx + 1.35, .06, gz - .1, Math.PI / 2);   // perosotan
    taruh(g2, 'box', .7, 1.4, .7, 0, .7, -.6, '#C2913A', { slot: 0 }); taruh(g2, 'box', .6, .06, 1.7, 0, .78, .45, '#A9463A', { slot: 0, rx: .72 });
    cylLo(1.25, .02, gx, .07, gz, '#C9B48A').noEdge = true;   // alas pasir
  }

  // ---- pohon: tabebuya (bunga merah muda) + bulat 2 gumpalan; posisi per varian ----
  const tabe = (x, z) => { cylLo(.14, 2.1, x, .06, z, '#6B4A33'); const a = sphLo(1.0, x, 2.75, z, '#D49AAE', .78); a.noEdge = true; const b = taman_sph(.62, x + .45, 3.25, z - .25, '#E3B4C2', .5); b.lod = 1; return a; };
  const bulat = (x, z, r, col) => { cylLo(.13, 1.9, x, .06, z, '#5E4630'); const a = sphLo(r, x, 1.95 + r * .7, z, col, r * .82); a.noEdge = true;
    const b = taman_sph(r * .62, x - r * .45, 2.0 + r * 1.25, z + r * .3, campur(col, '#A9C46A', .3), r * .5); b.lod = 1; return a; };
  const bedeng = (x, z, col) => { cus(taman_cincin(0, .74, .24, 6, 0), x, .06, z, '#8C5A40', { noHull: true });
    for (const [dx, dz, k] of [[-.4, .3, 0], [.38, -.3, 1]]){ const q = taman_sph(.3, x + dx, .4, z + dz, k ? '#5F8A3E' : col, .24); q.lod = 1; } };
  // semak berlapis 2 nada (pojok dalam pagar)
  const semak = (x, z, col, r) => { r = r || .45; taman_sph(r, x, r * .85, z, col, r * .78); };
  const BUNGA = ['#C9503C', '#D9A441', '#B0607A', '#E6E2D8'][s];
  if (s < 2){
    tabe(2.55 * cm, 2.5); bulat(2.6 * cm, -2.55, 1.15, '#6A9245'); bulat(-2.6 * cm, 2.55, 1.0, '#5F8A3E');
    bedeng(-2.6 * cm, 2.55, BUNGA); bedeng(2.6 * cm, -2.55, ['#D9A441', '#C9503C'][s]);
    semak(1.55 * cm, -3.2, '#4F7A3F'); semak(1.6 * cm, 3.2, '#5F8A3E');
  } else if (s === 2){
    tabe(-2.55, 2.5); tabe(2.55, -2.5); bulat(2.6, 2.55, 1.15, '#7FA850');
    bedeng(2.6, 2.55, BUNGA); semak(3.2, -3.2, '#4F7A3F'); semak(1.55, 3.2, '#5F8A3E');
  } else {
    tabe(2.55, 2.5); bulat(-2.6, 2.55, 1.0, '#5F8A3E'); bedeng(-2.6, 2.55, BUNGA);
    semak(3.2, 1.25, '#4F7A3F'); semak(-3.2, -1.25, '#5F8A3E'); bangku(-3.1, .98, { w: 1.15, rot: Math.PI, c: KAYUB });
  }

  // ---- bangku: s0/s1 jalur kiri & kanan · s2 jalur belakang + kiri · s3 (bangku melingkar + 2 di atas) ----
  if (s < 2) for (const sx of [-1, 1]) for (const sz of [-1, 1]) bangku(sx * 3.1, sz * .98, { w: 1.15, rot: sz > 0 ? Math.PI : 0, c: KAYUB });
  else if (s === 2){ bangku(.98, -3.05, { w: 1.15, rot: -Math.PI / 2, c: KAYUB }); bangku(3.1, -.98, { w: 1.15, c: KAYUB });
    bangku(-3.1, .98, { w: 1.15, rot: Math.PI, c: KAYUB }); bangku(3.1, .98, { w: 1.15, rot: Math.PI, c: KAYUB }); }
  // ---- 2 lampu taman di pintu depan + papan nama + tong sampah ----
  for (const sx of [-1, 1]){ const x = sx * .95, z = hz - .5; bx(.12, 3.0, .12, x, .06, z, '#2F3A36');
    taruh(R0, 'box', .22, .32, .22, x, 2.9, z, LAMPU, { glow: true }); }
  const fp = rangka(-1.85 * cm, .06, hz - .55, 0);
  for (const sx of [-1, 1]) taruh(fp, 'box', .08, 1.35, .08, sx * .7, .675, 0, '#2F3A36', { slot: 0 });
  taruh(fp, 'box', 1.6, .42, .06, 0, 1.15, .04, '#3F6B62', { slot: 0 }); _teks(fp, 'TAMAN', 0, .98, .08, 1.3, .26, '#EDE8DC');
  if (s === 2) bx(.4, .65, .4, -3.2, .06, 1.75, '#4F7A55', { lod: 1 }); else bx(.4, .65, .4, 3.15 * cm, .06, 2.05 - (s === 3 ? 3.0 : 0), '#4F7A55', { lod: 1 });
};
