/* lapangan (2×2) — spek-gaya §6 no. 11. Tanah lapang / lapangan bola kampung: rumput 2 nada 6 strip 2,4 u, garis kapur putih ,12
   (batas, tengah, lingkaran tengah, 2 kotak penalti, titik tengah), 2 gawang (tiang + mistar + jaring), tribun beton 2 tingkat di belakang
   (atap seng miring 'YXZ' turun ke arah lapangan), jaring kawat tinggi di belakang gawang (kiri/kanan), tembok rendah + gerbang di muka
   jalan, 2 tiang lampu 10 m (nyala malam), papan nama, bangku cadangan.
   Varian seed: 0 tribun beratap seng + tiang bendera · 1 tribun tanpa atap (kursi warna aksen) + umbul-umbul merah-putih di muka ·
   2 rumput aus (tanah di depan gawang & lingkaran tengah), gawang bambu, saung kayu ganti tribun beratap · 3 tribun beratap warna aksen
   + papan skor manual + 2 bangku cadangan beratap. Bangku/bangku cadangan selalu di sisi muka yang bukan gerbang (gerbang = satu-satunya
   akses dari jalan, bukaannya bebas). Semua bagian di dalam kavling. Tanpa badan bangunan. */
const LAPANGAN_GEO = new Map();
function lapangan_geo(key, build){ let g = LAPANGAN_GEO.get(key); if (g) return g; const t = [], e = [];
  const tri = (a, b, c, n) => { const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const cr = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] < 0) t.push(...a, ...c, ...b); else t.push(...a, ...b, ...c); };
  build(tri, (a, b) => e.push(...a, ...b)); g = _geoFrom(t, e.length ? e : null); LAPANGAN_GEO.set(key, g); return g; }
// lembar datar persegi panjang [x0,z0,x1,z1].. di y 0 menghadap atas
const lapangan_lembar = (key, rects) => lapangan_geo(key, tri => { for (const [x0, z0, x1, z1] of rects){ tri([x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [0, 1, 0]); tri([x0, 0, z0], [x1, 0, z1], [x0, 0, z1], [0, 1, 0]); } });
// cincin datar (garis lingkaran) / cakram datar (r0 = 0) bersisi N di y 0
const lapangan_cincin = (r0, r1, N) => lapangan_geo(['cc', r0, r1, N].join('|'), tri => { for (let k = 0; k < N; k++){ const a = k / N * Math.PI * 2, b = (k + 1) / N * Math.PI * 2;
  const I0 = [r0 * Math.sin(a), 0, r0 * Math.cos(a)], I1 = [r0 * Math.sin(b), 0, r0 * Math.cos(b)], O0 = [r1 * Math.sin(a), 0, r1 * Math.cos(a)], O1 = [r1 * Math.sin(b), 0, r1 * Math.cos(b)];
  tri(I0, O0, O1, [0, 1, 0]); if (r0 > 0) tri(I0, O1, I1, [0, 1, 0]); } });

CAT.lapangan.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, LW = fx + .8, LD = fz + .8, hx = LW / 2 - .1, hz = LD / 2 - .1, R0 = rangka(0, 0, 0, 0);
  const PUTIH = '#E6E2D8', BETON = '#BFB6A8', aus = s === 2;
  const bx = (sx, sy, sz, x, y, z, col, o) => taruh(R0, 'box', sx, sy, sz, x, y + sy / 2, z, col, Object.assign({ slot: 0 }, o));
  const cus = (geo, x, y, z, col, o) => taruh(R0, 'custom', 1, 1, 1, x, y, z, col, Object.assign({ geo: geo.geo, edges: geo.edges, slot: 0, noHull: true, noEdge: true }, o));

  // ---- tata letak: tribun di belakang (z−), lapangan bergaris di tengah, tembok rendah di muka ----
  const zT = -hz, dT = 1.0, zF0 = zT + 2 * dT + .9, zF1 = hz - 1.0, zc = (zF0 + zF1) / 2, fw = Math.min(13.4, 2 * hx - 2.0), fd = zF1 - zF0;   // garis lapangan
  // ---- rumput 2 nada: 6 strip 2,4 tegak lurus sumbu panjang + tepi; dua lembar tanpa tumpang ----
  const sw = 2.4, xs = [-hx]; for (let k = -3; k <= 3; k++) xs.push(k * sw); xs.push(hx); xs[1] = Math.max(xs[1], -hx + .01); xs[xs.length - 2] = Math.min(xs[xs.length - 2], hx - .01);
  const pit = [[], []]; for (let k = 0; k < xs.length - 1; k++) pit[k % 2].push([xs[k], -hz, xs[k + 1], hz]);
  for (let j = 0; j < 2; j++) cus(lapangan_lembar('rp' + j + '|' + hx + '|' + hz, pit[j]), 0, .08, 0, RUMPUT[j]);
  if (aus){ for (const sx of [-1, 1]){ const t = taruh(R0, 'cylLo', 2.6, .01, 1.8, sx * (fw / 2 - 1.1), .085, zc, '#B8A07A', { slot: 0, noEdge: true, noHull: true }); }
    taruh(R0, 'cylLo', 2.2, .01, 2.0, 0, .085, zc, '#B3A27E', { slot: 0, noEdge: true, noHull: true }); }
  // ---- garis kapur ,12 (detail dekat otomatis: batang tipis) ----
  const lw = .12, yl = .08, GR = [], gl = (sx, sz, x, z) => GR.push([x - sx / 2, z - sz / 2, x + sx / 2, z + sz / 2]);
  gl(fw + lw, lw, 0, zF0); gl(fw + lw, lw, 0, zF1); gl(lw, fd, -fw / 2, zc); gl(lw, fd, fw / 2, zc); gl(lw, fd, 0, zc);
  cus(lapangan_cincin(1.55, 1.67, 16), 0, yl + .02, zc, PUTIH, { lod: 1 }); cus(lapangan_cincin(0, .16, 6), 0, yl + .02, zc, PUTIH, { lod: 1 });
  const pd = 2.2, pw = Math.min(6.4, fd - 1.4);
  for (const sx of [-1, 1]){ const xi = sx * (fw / 2 - pd); gl(lw, pw, xi, zc); gl(pd, lw, sx * (fw / 2 - pd / 2), zc - pw / 2); gl(pd, lw, sx * (fw / 2 - pd / 2), zc + pw / 2);
    cus(lapangan_cincin(0, .12, 6), sx * (fw / 2 - 1.6), yl + .02, zc, PUTIH, { lod: 1 }); }
  cus(lapangan_lembar('gr|' + GR.map(r => r.map(v => v.toFixed(2)).join(',')).join(';'), GR), 0, yl + .02, 0, PUTIH, { lod: 1 });
  // ---- 2 gawang: tiang + mistar ,12 putih (bambu: coklat muda), jaring belakang + atas (detail dekat) ----
  const gw = 3.2, gh = 2.0, gdp = 1.0, cG = aus ? '#C9A86A' : PUTIH;
  for (const sx of [-1, 1]){ const f = rangka(sx * fw / 2, .08, zc, -sx * Math.PI / 2);   // +z lokal = ke tengah lapangan
    for (const t of [-1, 1]) taruh(f, 'box', .12, gh, .12, t * gw / 2, gh / 2, 0, cG, { slot: 0 });
    taruh(f, 'box', gw + .12, .12, .12, 0, gh + .06, 0, cG, { slot: 0 });
    _jeruji(f, gw, gh, 0, 0, -gdp, Math.round(gw / .4), '#D9D4C8', { batang: .02, rel: .03, lod: 1 });
    taruh(f, 'box', gw, .03, gdp, 0, gh + .02, -gdp / 2, '#D9D4C8', { slot: 0, lod: 1, noEdge: true, noHull: true }); }

  // ---- tribun 2 tingkat (beton + bangku 2 warna) atau saung (seed 2) ----
  const tw = Math.min(10, 2 * hx - 4.6), cK = [s === 1 ? c : '#4C6A96', s === 1 ? '#E6E2D8' : '#C2913A'];
  if (!aus){
    for (let k = 0; k < 2; k++){ const h = .5 + k * .5, z = zT + (1 - k) * dT + dT / 2 + .0;
      bx(tw, h, dT + (k ? 0 : .02), 0, .06, z, k ? '#C9C1B2' : '#BFB6A8'); bx(tw - .2, .14, .34, 0, .06 + h, z + .2, cK[k], { slot: s === 1 && k === 0 ? 1 : 0 }); }
    for (const sx of [-1, 1]) bx(.25, 1.25, 2 * dT, sx * (tw / 2 + .12), .06, zT + dT, '#C9C1B2');   // dinding ujung tribun
    if (s !== 1){ const cR = s === 3 ? darken(c, .9) : SENG, yR = 3.5, a = 10 * D2R;
      for (const sx of [-1, 1]) for (const t of [0, 1]) bx(.12, (t ? yR - .2 : yR + .1) - .06, .12, sx * (tw / 2 - .3), .06, zT + .2 + t * (2 * dT + .3), '#5E666C');
      taruh(R0, 'box', tw + .3, .06, 2 * dT + 1.0, 0, yR - .1, zT + dT + .45, cR, { slot: s === 3 ? 1 : 0, rx: a }); }
  } else {
    // saung kayu panggung (beratap genteng) + 2 bangku
    const f = rangka(-2.5, .06, zT + 1.3, 0);
    taruh(f, 'box', 3.0, .45, 2.0, 0, .225, 0, '#8C6A48', { slot: 0 });
    for (const a of [-1, 1]) for (const b of [-1, 1]) taruh(f, 'box', .12, 2.1, .12, a * 1.35, 1.05 + .45, b * .85, '#6B4A33', { slot: 0 });
    const h = hipGeo(3.6, 2.6, 1.0); taruh(f, 'custom', 3.6, 1.0, 2.6, 0, 2.55 + .5, 0, gt, { geo: h.geo, edges: h.edges, slot: 3 });
    for (const x of [1.6, 4.4]) bangku(x, zT + 1.2, { w: 1.8, c: '#8C6A48' });
  }
  // ---- jaring kawat tinggi di belakang gawang (kiri & kanan), tiang tiap ±4 m ----
  for (const sx of [-1, 1]){ const g = rangka(sx * (hx - .06), .06, 0, Math.PI / 2), len = 2 * hz - .1;
    _jeruji(g, len, 3.0, 0, 0, 0, Math.round(len / .8), '#8E979C', { batang: .018, rel: .04, lod: 1 });
    for (let k = 0; k <= 2; k++) taruh(g, 'box', .09, 3.1, .09, -len / 2 + .05 + (len - .1) * k / 2, 1.55, 0, '#6F6A60', { slot: 0 }); }
  // ---- tembok rendah + gerbang di muka jalan ----
  const gW = 2.4, gX = s % 2 ? 3.5 : -3.5, zW = hz - .1;
  for (const [x0, x1] of [[-hx + .12, gX - gW / 2], [gX + gW / 2, hx - .12]]){ bx(x1 - x0, .7, .2, (x0 + x1) / 2, .06, zW, '#D9D4C8', { noHull: true }); }
  for (const t of [-1, 1]) bx(.32, 1.4, .32, gX + t * (gW / 2 + .02), .06, zW - .02, '#C9C1B2');
  // papan nama di atas gerbang (2 tiang)
  const fp = rangka(gX, .06, zW - .02, 0); taruh(fp, 'box', gW + .3, .5, .08, 0, 2.15, 0, '#3F6B62', { slot: 0 }); for (const t of [-1, 1]) taruh(fp, 'box', .1, .75, .1, t * (gW / 2 + .02), 1.75, 0, '#5E666C', { slot: 0 });
  _teks(fp, 'LAPANGAN', 0, 2.0, .05, gW, .26, '#EDE8DC');
  // ---- 2 tiang lampu 10 m di belakang (kepala lampu menghadap lapangan) ----
  for (const sx of [-1, 1]){ const x = sx * (tw / 2 + .85), z = zT + .55; cylLo(.14, 10, x, .06, z, '#8A939A');
    const f = rangka(x, 10.0, z, 0); taruh(f, 'box', 1.5, .8, .18, 0, 0, .12, '#5E666C', { slot: 0, rx: -.35 }); taruh(f, 'box', 1.3, .6, .06, 0, 0, .24, LAMPU, { glow: true, rx: -.35 }); }
  // ---- varian: tiang bendera (0) · umbul-umbul (1) · papan skor + bangku cadangan beratap (3) ----
  if (s === 0) tiangBendera(hx - 1.6, zT + 1.0, 7);
  // bangku (cadangan) di sisi muka yang BUKAN gerbang: tidak ada objek di x ∈ [gX − gW/2 − ,3, gX + gW/2 + ,3] pada z > zF1 (akses dari jalan)
  const sg = Math.sign(gX), xB = s === 3 ? [-sg * 1.45, -sg * 4.45] : [-sg * 2.2];
  if (s === 1) for (let k = 0; k < 10; k++){ const x = -hx + 1.0 + k * 1.5; if (Math.abs(x - gX) < gW / 2 + .4 || xB.some(b => Math.abs(x - b) < 1.4)) continue; const f = rangka(x, .06, zW - .5, 0);
    taruh(f, 'box', .06, 4.2, .06, 0, 2.1, 0, '#C9A86A', { slot: 0 }); taruh(f, 'box', .5, 1.4, .02, .26, 3.4, 0, '#B5473A', { slot: 0, noHull: true }); taruh(f, 'box', .5, 1.4, .02, .26, 2.0, 0, PUTIH, { slot: 0, noHull: true, lod: 1 }); }
  if (s === 3){ const f = rangka(hx - 1.4, .06, zT + 1.0, 0); for (const t of [-1, 1]) taruh(f, 'box', .1, 2.6, .1, t * .8, 1.3, 0, '#5E666C', { slot: 0 });
    taruh(f, 'box', 1.9, 1.0, .12, 0, 2.3, 0, '#2B3A36', { slot: 0 }); _teks(f, '2-1', 0, 2.05, .07, 1.2, .5, '#F2CF8A');
    for (const xb of xB){ const g = rangka(xb, .06, zF1 + .55, Math.PI); taruh(g, 'box', 2.0, .45, .4, 0, .225, 0, '#8C6A48', { slot: 0 }); taruh(g, 'box', 2.2, .05, .8, 0, 1.6, -.05, c, { slot: 1, rx: .1 });
      for (const t of [-1, 1]) taruh(g, 'box', .08, 1.6, .08, t * 1.0, .8, -.4, '#5E666C', { slot: 0 }); } }
  else bangku(xB[0], zF1 + .5, { w: 2.0, rot: Math.PI, c: '#8C6A48' });
};
