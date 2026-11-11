/* tugu (2×2, CBD) — spek-gaya §6 no. 21. Alun-alun Tugu Kuda: plaza paving bundar r 5 (cincin pola warna), 4 jalur paving ke 4 tepi,
   4 petak rumput di pojok, monumen di tengah: 4 undakan oktagonal + pedestal 3 tingkat (granit, prasasti 'NETIZENIA') + patung
   kuda berpenunggang perunggu ×1,33 skala hidup (penunggang mengacungkan pedang / bendera / keris), 8 patok + rantai keliling monumen,
   4 lampu hias 1 lentera bertopi di ujung lengan (nyala malam), 8 pot cemara (topiari kerucut), 4 bangku beton-kayu, 2 pohon beringin (atau 2 palem).
   Kuda: dada/perut/pinggul meruncing, leher miring, kepala panjang menunduk + moncong, telinga, surai, ekor, kaki ramping 3 ruas
   (paha, betis, kuku; kaki depan terangkat bertekuk); seluruh patung serong 24° ke muka jalan (s3: kaki terangkat dicerminkan, arah serong sama).
   Varian seed: 0 kuda melangkah (1 kaki depan terangkat) + pedang, beringin belakang · 1 kuda berdiri dua kaki (mendongak) + bendera
   merah-putih, palem · 2 kuda berdiri tegak + keris, beringin depan · 3 kolam cincin di kaki monumen + kuda melangkah dicerminkan.
   Semua bagian di dalam kavling; tanpa badan bangunan (grup lapang). */
const TUGU_GEO = new Map();
function tugu_geo(key, build){ let g = TUGU_GEO.get(key); if (g) return g; const t = [], e = [];
  const tri = (a, b, c, n) => { const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const cr = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] < 0) t.push(...a, ...c, ...b); else t.push(...a, ...b, ...c); };
  build(tri, (a, b) => e.push(...a, ...b)); g = _geoFrom(t, e.length ? e : null); TUGU_GEO.set(key, g); return g; }
// cakram / cincin bersisi N, tinggi h (h = 0 → lembar datar tanpa sisi); garis keliling atas luar bila h > 0
const tugu_cincin = (r0, r1, h, N) => tugu_geo(['cc', r0, r1, h, N].join('|'), (tri, ed) => {
  for (let k = 0; k < N; k++){ const a = k / N * Math.PI * 2, b = (k + 1) / N * Math.PI * 2, m = (a + b) / 2, no = [Math.sin(m), 0, Math.cos(m)];
    const I0 = [r0 * Math.sin(a), h, r0 * Math.cos(a)], I1 = [r0 * Math.sin(b), h, r0 * Math.cos(b)], O0 = [r1 * Math.sin(a), h, r1 * Math.cos(a)], O1 = [r1 * Math.sin(b), h, r1 * Math.cos(b)];
    tri(I0, O0, O1, [0, 1, 0]); if (r0 > 0) tri(I0, O1, I1, [0, 1, 0]);
    if (h > 0){ tri([O0[0], 0, O0[2]], [O1[0], 0, O1[2]], O1, no); tri([O0[0], 0, O0[2]], O1, O0, no); ed(O0, O1); } } });
const tugu_lembar = (key, rects) => tugu_geo(key, tri => { for (const [x0, z0, x1, z1] of rects){ tri([x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [0, 1, 0]); tri([x0, 0, z0], [x1, 0, z1], [x0, 0, z1], [0, 1, 0]); } });

// bola rendah 6×3 (24 segitiga, normal halus) untuk gumpalan tajuk kecil — lebih hemat dari sphLo (56); satuan diameter 1 (taruh 'custom' s = ukuran)
function tugu_bola(){ let g = TUGU_GEO.get('bola'); if (g) return g; const t = [], N = 6, M = 3, P = (i, j) => { const th = j / M * Math.PI, ph = i / N * Math.PI * 2; return [.5 * Math.sin(th) * Math.cos(ph), .5 * Math.cos(th), .5 * Math.sin(th) * Math.sin(ph)]; };
  for (let j = 0; j < M; j++) for (let i = 0; i < N; i++){ const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
    if (j > 0) t.push(...a, ...b, ...c); if (j < M - 1) t.push(...a, ...c, ...d); else t.push(...a, ...b, ...c); }
  g = _geoFrom(t, null); const pa = g.geo.attributes.position.array, na = g.geo.attributes.normal.array;
  for (let k = 0; k < pa.length; k += 3){ const l = Math.hypot(pa[k], pa[k + 1], pa[k + 2]) || 1; na[k] = pa[k] / l; na[k + 1] = pa[k + 1] / l; na[k + 2] = pa[k + 2] / l; }
  TUGU_GEO.set('bola', g); return g; }
// pengganti sphLo(r, x, y, z, c, ry) berbasis tugu_bola
const tugu_sph = (r, x, y, z, c, ry) => { const B = tugu_bola(); return taruh(rangka(0, 0, 0, 0), 'custom', r * 2, (ry || r) * 2, r * 2, x, y, z, c, { geo: B.geo, edges: null, slot: 0, noEdge: true }); };

// kerucut 6 sisi tanpa alas (6 segitiga; topiari cemara di pot — alas tak terlihat), satuan [-,5,,5]³
function tugu_kerucut(){ let g = TUGU_GEO.get('kr6'); if (g) return g; const t = [], N = 6;
  for (let i = 0; i < N; i++){ const a = i / N * Math.PI * 2, b = (i + 1) / N * Math.PI * 2; t.push(.5 * Math.sin(a), -.5, .5 * Math.cos(a), .5 * Math.sin(b), -.5, .5 * Math.cos(b), 0, .5, 0); }
  g = _geoFrom(t, null); TUGU_GEO.set('kr6', g); return g; }

CAT.tugu.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, LW = fx + .8, LD = fz + .8, hx = LW / 2 - .1, hz = LD / 2 - .1, R0 = rangka(0, 0, 0, 0);
  const PV = '#D9D0C0', PV2 = '#C6B898', GRANIT = '#9E9A90', GRANIT2 = '#B9AE98', BATU = '#C9C1B2', PERUNGGU = '#5C5242';
  const bx = (sx, sy, sz, x, y, z, col, o) => taruh(R0, 'box', sx, sy, sz, x, y + sy / 2, z, col, Object.assign({ slot: 0 }, o));
  const cus = (geo, x, y, z, col, o) => taruh(R0, 'custom', 1, 1, 1, x, y, z, col, Object.assign({ geo: geo.geo, edges: geo.edges, slot: 0 }, o));
  const rP = Math.min(5, Math.min(hx, hz) - 1.6);

  // ---- alas: rumput pojok (lembar), 4 jalur paving, plaza bundar + cincin pola ----
  cus(tugu_lembar('rp|' + hx + '|' + hz, [[-hx, -hz, hx, hz]]), 0, .08, 0, RUMPUT[0], { noHull: true, noEdge: true });
  const jw = 2.6;
  bx(jw, .08, hz - rP + .3, 0, .06, (hz + rP - .3) / 2, PV, { attach: 'z-', noHull: true }); bx(jw, .08, hz - rP + .3, 0, .06, -(hz + rP - .3) / 2, PV, { attach: 'z+', noHull: true });
  bx(hx - rP + .3, .08, jw, (hx + rP - .3) / 2, .06, 0, PV, { attach: 'x-', noHull: true }); bx(hx - rP + .3, .08, jw, -(hx + rP - .3) / 2, .06, 0, PV, { attach: 'x+', noHull: true });
  cus(tugu_cincin(0, rP, .14, 16), 0, .06, 0, PV, { noHull: true });
  cus(tugu_cincin(rP - .9, rP - .45, 0, 16), 0, .21, 0, PV2, { noHull: true, noEdge: true });
  // kanstin rumput sepanjang jalur (garis tegas di tepi rumput)
  // ---- monumen: 4 undakan oktagonal (atau kolam cincin, seed 3) + pedestal 3 tingkat ----
  let y = .2; const und = s === 3 ? [3.6, 3.0, 2.6] : [3.9, 3.4, 2.95, 2.55];
  if (s === 3){ cus(tugu_cincin(3.95, 4.3, .5, 8), 0, y, 0, BATU); const w = cylLo(4.0, .36, 0, y, 0, PAL.air); w.noEdge = true; w.noHull = true; }
  for (const r of und){ cylLo(r, .2, 0, y, 0, r === und[0] ? GRANIT2 : BATU).noHull = r !== und[0]; y += .2; }
  const y0 = y;
  bx(3.2, 1.0, 3.6, 0, y0, 0, GRANIT); bx(3.36, .14, 3.76, 0, y0 + 1.0, 0, GRANIT2);
  bx(2.4, 1.5, 2.9, 0, y0 + 1.14, 0, BATU); bx(2.56, .14, 3.06, 0, y0 + 2.64, 0, GRANIT2);
  bx(1.5, .9, 3.0, 0, y0 + 2.78, 0, GRANIT); const yS = y0 + 3.68;
  // prasasti perunggu di muka pedestal + teks
  const fp = rangka(0, y0 + 1.14, 1.45, 0); taruh(fp, 'box', 1.7, .8, .06, 0, .75, .02, '#5E4E38', { slot: 0 }); _teks(fp, 'NETIZENIA', 0, .82, .06, 1.4, .26, '#D9C9A0'); _teks(fp, '1945', 0, .48, .06, .8, .2, '#D9C9A0');
  // ---- patung kuda berpenunggang (×1,33), rangka lokal +z = arah hadap; badan serong ψ ke muka jalan (siluet 3/4 terbaca dari arah datang);
  //      pitch untuk kuda mendongak (s1). Rotasi 'YXZ': ry = ψ lalu rx lokal. ----
  const k = 1.33, cm = s === 3 ? -1 : 1, pitch = s === 1 ? -.42 : 0, pv = [0, .1, -.62], psi = .42, cP = Math.cos(psi), sP = Math.sin(psi);
  const kuda = (x, yy, z, sx, sy, sz, rx, col, o, bebas) => { let py = yy, pz = z; if (!bebas && pitch){ const dy = yy - pv[1], dz = z - pv[2], cs = Math.cos(pitch), sn = Math.sin(pitch); py = pv[1] + dy * cs - dz * sn; pz = pv[2] + dy * sn + dz * cs; }
    const lx = x * cm * k, lz = pz * k;
    return taruh(R0, 'box', sx * k, sy * k, sz * k, lx * cP + lz * sP, yS + py * k, -lx * sP + lz * cP, col || PERUNGGU, Object.assign({ slot: 0, ry: psi, rx: (rx || 0) + (bebas ? 0 : pitch) }, o)); };
  // badan: dada, perut, pinggul (meruncing), leher miring, kepala panjang menunduk + moncong, telinga, surai, ekor
  kuda(0, 1.32, .5, .5, .66, .56, .12); kuda(0, 1.3, -.05, .46, .58, .7); kuda(0, 1.36, -.6, .52, .62, .5, -.12);
  kuda(0, 1.88, .86, .24, .82, .34, .62);                                    // leher (atas condong ke depan)
  kuda(0, 2.12, 1.24, .2, .24, .56, .62);                                    // kepala (moncong turun ±35°)
  kuda(0, 1.94, 1.5, .16, .17, .2, .62, null, { lod: 1 });                   // moncong
  for (const t of [-1, 1]) kuda(t * .07, 2.4, 1.0, .05, .16, .06, -.2, null, { lod: 1 });   // telinga
  kuda(0, 1.98, .7, .07, .7, .1, .62, '#3A3430', { lod: 1 });                // surai
  kuda(0, 1.12, -.98, .1, .72, .13, .32, null, null, true);                  // ekor (pangkal di pinggul, ujung ke belakang)
  // kaki: paha + betis ramping + kuku; belakang tetap di alas
  const kaki = (x, z, angkat, bebas) => { if (angkat){ kuda(x, 1.0, z + .14, .14, .48, .18, -.75, null, null, bebas); kuda(x, .66, z + .26, .1, .42, .11, .35, null, null, bebas); kuda(x, .44, z + .2, .12, .08, .14, .35, null, { lod: 1 }, bebas); }
    else { kuda(x, .95, z, .16, .5, .2, 0, null, null, bebas); kuda(x, .4, z + .02, .1, .62, .11, 0, null, null, bebas); kuda(x, .04, z + .04, .13, .08, .16, 0, null, { lod: 1 }, bebas); } };
  for (const sx of [-1, 1]) kaki(sx * .17, -.62, false, true);
  if (s === 2) for (const sx of [-1, 1]) kaki(sx * .17, .55, false);
  else for (const sx of [-1, 1]) kaki(sx * .17, .55, s === 1 || sx > 0);
  // penunggang: kaki, badan, kepala berpeci, lengan + senjata/bendera
  for (const sx of [-1, 1]) kuda(sx * .34, 1.42, .05, .14, .62, .18, .25);
  kuda(0, 2.08, -.02, .44, .66, .3, -.08); kuda(0, 2.42, -.02, .5, .14, .32, 0, '#5E4E38', { lod: 1 });
  const kp = kuda(0, 2.66, 0, .22, .26, .24); kuda(0, 2.83, 0, .24, .1, .26, 0, '#3A3430');
  if (s === 1){ kuda(.32, 2.6, .05, .1, .62, .1, -.25); kuda(.36, 3.05, .05, .06, 1.9, .06, 0, '#8A7A5A');
    kuda(.36, 3.78, -.32, .03, .34, .7, 0, '#B5473A', { noHull: true }); kuda(.36, 3.44, -.32, .03, .34, .7, 0, '#E6E2D8', { noHull: true }); }
  else if (s === 2){ kuda(.3, 2.2, .3, .1, .55, .1, 1.3); kuda(.3, 2.25, .72, .05, .05, .5, 0, '#8A7A5A', { lod: 1 }); kuda(-.3, 2.0, .05, .1, .55, .1, .2); }
  else { kuda(.32, 2.68, .12, .1, .66, .1, .5); kuda(.32, 3.28, .45, .06, .72, .06, .5, '#8A7A5A'); kuda(-.3, 2.0, .1, .1, .55, .1, .35); }
  // ---- 8 patok + rantai keliling monumen (rantai = batang tipis melendut, detail dekat) ----
  const rR = (s === 3 ? 4.6 : und[0] + .45), np = 8;
  for (let i = 0; i < np; i++){ const a = (i + .5) / np * Math.PI * 2, b = (i + 1.5) / np * Math.PI * 2, xa = Math.sin(a) * rR, za = Math.cos(a) * rR, xb = Math.sin(b) * rR, zb = Math.cos(b) * rR;
    bx(.16, .8, .16, xa, .2, za, '#5E666C', { lod: 1 });
    const L = Math.hypot(xb - xa, zb - za), ry = Math.atan2(xb - xa, zb - za);
    taruh(R0, 'box', .035, .06, L, (xa + xb) / 2, .86, (za + zb) / 2, '#3A3D40', { slot: 0, ry }); }
  // ---- 4 lampu hias (tiang + lengan + 1 lentera) di plaza, diagonal ----
  for (let i = 0; i < 4; i++){ const a = Math.PI / 4 + i * Math.PI / 2, x = Math.sin(a) * (rP - .35), z = Math.cos(a) * (rP - .35), f = rangka(x, .2, z, a);
    taruh(f, 'box', .16, 3.6, .16, 0, 1.8, 0, '#2F3A36', { slot: 0 }); taruh(f, 'box', .62, .08, .08, .27, 3.4, 0, '#2F3A36', { slot: 0 });
    taruh(f, 'box', .24, .36, .24, .5, 3.2, 0, LAMPU, { glow: true }); taruh(f, 'box', .3, .1, .3, .5, 3.43, 0, '#2F3A36', { slot: 0, lod: 1 }); }
  // ---- 8 pot cemara (topiari kerucut) di tepi jalur + 4 bangku menghadap monumen ----
  for (const [ax, az] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) for (const t of [-1, 1]){
    const d = rP + .9, x = ax * d + az * t * (jw / 2 + .45), z = az * d + ax * t * (jw / 2 + .45);
    bx(.6, .55, .6, x, .06, z, '#B9AE98', { lod: 1 }); { const K = tugu_kerucut(); taruh(R0, 'custom', .7, 1.3, .7, x, .61 + .65, z, '#4F7A55', { geo: K.geo, edges: null, slot: 0, lod: 1, noEdge: true }); } }
  for (let i = 0; i < 4; i++){ const a = i * Math.PI / 2 + Math.PI / 4, r = rP + 1.05; bangku(Math.sin(a) * r, Math.cos(a) * r, { w: 1.6, rot: a + Math.PI, y: .08, c: '#8C6A48' }); }
  // ---- pohon: beringin (batang besar + 2 tajuk lebar) atau palem ----
  const pz = s === 2 ? 1 : -1, px = hx - 2.2, pzz = pz * (hz - 2.2);
  for (const sx of [-1, 1]){ const x = sx * px;
    if (s === 1){ cylLo(.16, 5.2, x, .06, pzz, '#8C7A5A'); for (let j = 0; j < 5; j++){ const a = j * 1.256, f = rangka(x + Math.sin(a) * .8, 5.15, pzz + Math.cos(a) * .8, a); taruh(f, 'box', .5, .06, 1.9, 0, 0, 0, j % 2 ? '#5F8A3E' : '#4F7A55', { slot: 0, rx: .45, noEdge: true }); } }
    else { cylLo(.36, 2.6, x, .06, pzz, '#5E4630');
      const a = sphLo(2.0, x, 3.9, pzz, '#4F7A3F', 1.2); a.noEdge = true; tugu_sph(1.3, x - sx * .7, 4.8, pzz + .3, '#5F8A3E', .9).lod = 1; } }
};
