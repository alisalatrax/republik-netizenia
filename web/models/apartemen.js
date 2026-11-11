/* apartemen (2×2, Apartemen Netizenia, CBD) — spek-gaya §6 no. 27. 6 atau 12 lantai (floorsFor: ring 0 → 12, lain 6);
   lantai dasar LANTAI_USAHA 4,2 + 3,2 per lantai hunian. Hunian vertikal khas kota Indonesia:
     tiap lantai: balkon menerus (pelat + pagar besi/tembok) atau koridor luar (rusun), per unit bukaan pintu kaca + jendela
     dalam satu reveal, AC luar di lantai balkon, sekat antar-unit, jemuran baju di sebagian balkon; dinding samping/belakang
     berjendela; lantai dasar: lobby kaca + pintu kaca dobel + kanopi drop-off bernama, minimarket berpapan (muka lebar);
     atap datar parapet 1,0 + ruang mesin lift + 2 toren + parabola + papan nama atap; halaman: kolam renang 6×3 berbibir,
     2 kursi santai, 2 pohon kelapa/palem, 2 mobil, pagar besi + gerbang.
   Varian seed: 0 bilah lebar 13,6 × 7,6, balkon menerus pagar besi, kolam kiri · 1 menara sudut 9,4 × 9,4 (spek: di sudut kavling),
     balkon di muka & sisi kanan, kolam di sisi kanan · 2 bilah dengan sirip tegak antar-unit + balkon tembok, kolam kanan ·
     3 rusun: koridor luar + pintu/jendela nako per unit + jemuran di pagar koridor + menara tangga berroster di kiri.
   Detail kecil (sekat, jemuran, kursi, roda, sill) lod 1; AC tanpa garis lipatan (kulit siluet cukup) → garis ≤ 2.000 di 12 lantai. */
function apartemen_lod(n0){ for (let k = n0; k < P.length; k++) P[k].lod = 1; }
function apartemen_mobil(x, z, rot, c){ const f = rangka(x, 0, z, rot);
  taruh(f, 'box', 4.2, .62, 1.74, 0, .62, 0, c, { slot: 0 });
  taruh(f, 'box', 2.2, .52, 1.56, -.25, 1.19, 0, '#55687A', { slot: 0 });
  const n0 = P.length; taruh(f, 'box', 1.9, .07, 1.5, -.3, 1.48, 0, c, { slot: 0, noEdge: true });
  // roda: satu blok ban gelap per poros (selebar mobil + ,04) — 24 segitiga, bukan 4 silinder ±128 (anggaran 12 lantai)
  for (const a of [-1.35, 1.35]) taruh(f, 'box', .6, .58, 1.8, a, .29, 0, '#1E1C1A', { noEdge: true });
  apartemen_lod(n0); }
// palem/kelapa: batang + 6 pelepah miring + buah (pelepah tanpa garis lipatan)
function apartemen_palem(x, z, h, s){ cylLo(.17, h, x, 0, z, '#8C7A5E');
  for (let k = 0; k < 6; k++){ const a = k * 1.047 + s; taruh(rangka(x, h, z, a), 'box', .5, .05, 1.5, 0, -.25, .72, k % 2 ? '#5C7D3E' : '#4F7239', { rx: .38, slot: 0, noEdge: true }); }
  const q = sphLo(.32, x, h - .1, z, '#6B5A3A'); q.lod = 1; q.noEdge = true; }
// jendela hemat: reveal gelap + kaca 2 nada + ambang (lod 1)
function apartemen_jendela(f, x, y, w, h, wl, o_ambang){
  taruh(f, 'box', w + .2, h + .2, .07, x, y + h / 2, 0, darken(wl, .7), { attach: 'z+', slot: 0, ao: .8 });
  taruh(f, 'box', w, h, .06, x, y + h / 2, .02, KACA[0], { glow: true });
  if (o_ambang) taruh(f, 'box', w + .3, .1, .15, x, y - .1, .06, '#D9D4C8', { slot: 0, lod: 1, noEdge: true }); }
// satu muka hunian per lantai: balkon/koridor menerus sepanjang L (+ ujung), per unit bukaan + AC + sekat + jemuran
function apartemen_muka(f, L, y, j, nu, gaya, wl, seed, k, o){ o = o || {}; const cR = gaya === 'besi' ? '#3A3D40' : darken(wl, .92), xo = o.xo || 0, Lb = o.Lb || L;
  taruh(f, 'box', Lb, .2, j + .03, xo, y + .1, (j - .03) / 2, '#CFC9BC', { slot: 0 });   // pelat balkon (lantai beton menjorok)
  if (gaya === 'besi'){ _jeruji(f, Lb - .04, .8, xo, y + .2, j - .05, Math.round(Lb / .36), cR, { satu: 1, lod: 1, rel: .05, batang: .04 });
    taruh(f, 'box', Lb, .12, .14, xo, y + 1.06, j - .06, cR, { slot: 0 }); }
  else { taruh(f, 'box', Lb, .9, .12, xo, y + .2 + .45, j - .06, cR, { slot: 0, wall: true }); taruh(f, 'box', Lb + .04, .1, .2, xo, y + 1.15, j - .08, darken(cR, .85), { slot: 0, lod: 1, noEdge: true }); }
  for (const sx of o.ujung || [-1, 1]) if (gaya === 'besi') _jeruji(f.sub(xo + sx * (Lb / 2 - .03), 0, (j - .05) / 2, sx * Math.PI / 2), j - .08, .8, 0, y + .2, 0, 4, cR, { satu: 1, lod: 1, rel: .05, batang: .04 });
    else taruh(f, 'box', .12, .9, j - .1, xo + sx * (Lb / 2 - .06), y + .65, (j - .1) / 2, cR, { slot: 0, wall: true, lod: 1 });
  const uw = L / nu;
  for (let i = 0; i < nu; i++){ const ux = -L / 2 + uw * (i + .5);
    if (o.rusun){   // pintu kayu + jendela nako per unit
      taruh(f, 'box', .9, 2.1, .08, ux - .55, y + .2 + 1.05, .02, ['#5A4636', '#3F6B62', '#7A5A3A', '#4C6A96'][(i + seed + k) % 4], { attach: 'z+', slot: 0 });
      apartemen_jendela(f, ux + .75, y + 1.25, .9, .75, wl);
      if ((i + k + seed) % 2 === 0) for (let c2 = 0; c2 < 3; c2++) taruh(f, 'box', .5, .55 + (c2 % 2) * .15, .03, ux - .4 + c2 * .6, y + 1.12 - (.55 + (c2 % 2) * .15) / 2, j + .02, ['#B5473A', '#E6E2D8', '#4C6A96', '#C2913A', '#6F5E8C'][(c2 + i + k) % 5], { slot: 0, lod: 1, noEdge: true, noHull: true });
      continue; }
    taruh(f, 'box', 2.75, 2.3, .07, ux, y + .2 + 1.15, 0, darken(wl, .7), { attach: 'z+', slot: 0, ao: .8 });   // reveal bukaan unit
    taruh(f, 'box', 1.45, 2.05, .06, ux - .55, y + .22 + 1.025, .02, KACA[0], { glow: true });                // pintu geser kaca
    taruh(f, 'box', .9, 1.15, .06, ux + .82, y + 1.0 + .575, .02, KACA[0], { glow: true });                    // jendela
    if (!o.hemat || i === 0){ const a = ac(ux + .82, y + .21, .0, {}); a.noEdge = true; a.lod = 1; }   // muka samping (hemat): 1 AC per lantai
    if (i > 0 && !o.hemat) taruh(f, 'box', .1, 1.4, j - .1, ux - uw / 2, y + .2 + .7, (j - .1) / 2, darken(wl, .9), { slot: 0, lod: 1, noEdge: true });
    if ((i * 3 + k + seed) % 7 === 0){ const n0 = P.length; jemuran(0, 0, { y: 0, w: 1.0, h: 1.3, n: 2, warna: i + k }); const m = P.splice(n0);
      for (const q of m){ const p = f.at(ux - .55 + q.p[0], y + .2 + q.p[1], j * .55 + q.p[2]); q.p = p; q.ry = (q.ry || 0) + f.r; q.lod = 1; q.noEdge = true; P.push(q); } }
  } }
// pemeriksaan tata letak halaman (temuan verifikator r1): batang/mahkota palem & mobil tidak boleh masuk tapak bangunan + balkon
// [x0−j .. x1+j] × [zb .. zf+j] dan mahkota palem (jangkauan 1,45) tidak boleh keluar kavling. Pelanggaran → console.warn (tidak memutus render).
function apartemen_cekHalaman(palm, cars, o){ const bx0 = o.x0 - o.j, bx1 = o.x1 + o.j, bz1 = o.zf + o.j, msg = [];
  const kena = (xa, xb, za, zb2) => xb > bx0 && xa < bx1 && zb2 > o.zb && za < bz1;
  palm.forEach(([x, z], k) => { const r = 1.45; if (kena(x - r, x + r, z - r, z + r)) msg.push('palem ' + k + ' menyentuh tapak/balkon');
    if (Math.abs(x) + r > o.LW / 2 || Math.abs(z) + r > o.LD / 2) msg.push('palem ' + k + ' keluar kavling'); });
  cars.forEach(([x, z, r], k) => { const hx = r ? .89 : 2.1, hz = r ? 2.1 : .89; if (kena(x - hx, x + hx, z - hz, z + hz)) msg.push('mobil ' + k + ' menyentuh tapak');
    for (const [px, pz] of palm) if (Math.abs(px - x) < hx + .2 && Math.abs(pz - z) < hz + .2) msg.push('mobil ' + k + ' menabrak palem'); });
  if (msg.length) console.warn('apartemen seed ' + o.s + ': ' + msg.join('; ')); return msg; }
CAT.apartemen.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3;
  const LW = fx + .8, LD = fz + .8, n = clamp(floors || 6, 2, 14), H = LANTAI_USAHA + (n - 1) * LANTAI, yF = k => LANTAI_USAHA + (k - 1) * LANTAI;
  const iw = Math.max(0, WALLS.indexOf(wl)), ia = Math.max(0, AKSEN.indexOf(c));
  // ---- tapak per seed ----
  const T0 = [{ x0: -6.8, x1: 6.8, zb: -7.0, zf: .6 }, { x0: -6.8, x1: 2.6, zb: -7.0, zf: 2.4 }, { x0: -6.8, x1: 6.8, zb: -7.0, zf: .4 }, { x0: -5.0, x1: 6.8, zb: -7.0, zf: .0 }][s];
  const { x0, x1, zb, zf } = T0, tw = x1 - x0, td = zf - zb, cx = (x0 + x1) / 2, zc = (zf + zb) / 2;
  const gaya = s === 2 ? 'tembok' : 'besi', j = s === 3 ? 1.4 : 1.1, nu = s === 1 ? 3 : 4;
  const cGr = '#8E8A84';
  // ---- badan + lis per lantai ----
  const lis = []; for (let k = 1; k < n; k++) lis.push(yF(k) - .06);
  dinding(tw, H, td, cx, 0, zc, wl, { plinth: .6, cPlinth: cGr, lis: s === 2 ? lis : [LANTAI_USAHA - .06] });
  const fF = rangka(cx, 0, zf, 0), fR = rangka(x1, 0, zc, Math.PI / 2), fL = rangka(x0, 0, zc, -Math.PI / 2), fB = rangka(cx, 0, zb, Math.PI);
  // ---- lantai hunian ----
  for (let k = 1; k < n; k++){ const y = yF(k);
    if (s === 1){ apartemen_muka(fF, tw, y, j, nu, gaya, wl, s, k, { Lb: tw + j, xo: j / 2 }); apartemen_muka(fR, td, y, j, 2, gaya, wl, s + 1, k, { ujung: [1], hemat: true }); }
    else apartemen_muka(fF, tw, y, j, nu, gaya, wl, s, k, { rusun: s === 3 });
    // jendela samping & belakang
    for (const [g, L, m] of s === 1 ? [[fL, td, 1], [fB, tw, 1]] : [[fL, td, 1], [fR, td, 1], [fB, tw, 2]])
      for (let i = 0; i < m; i++) apartemen_jendela(g, -L / 2 + L * (i + .5) / m + (m === 1 ? (k % 2 ? 1.2 : -1.2) : 0), y + .95, 1.1, 1.3, wl);
  }
  // sirip tegak antar-unit (seed 2) sepanjang lantai hunian
  if (s === 2) for (let i = 0; i <= nu; i++){ const xi = -tw / 2 + tw * i / nu, ww = i % nu === 0 ? .4 : .3;
    taruh(fF, 'box', ww, H - LANTAI_USAHA + .9, j + .25, clamp(xi, -tw / 2 + ww / 2, tw / 2 - ww / 2), LANTAI_USAHA + (H - LANTAI_USAHA + .9) / 2 - .1, (j + .25) / 2 - .05, darken(wl, .9), { slot: 0, attach: 'z+' }); }
  // menara tangga rusun (seed 3) dengan roster
  if (s === 3){ const tx = -6.8 + .9, tz = zf - 1.9, th = H + 2.4, f = rangka(tx, 0, tz, 0);
    taruh(f, 'box', 1.8, th, 3.8, 0, th / 2, 0, darken(wl, .95), { slot: 0, wall: true });
    taruh(f, 'box', 2.1, .2, 4.1, 0, th + .1, 0, '#B8B2A6', { slot: 0 });
    for (let k = 1; k < n; k++){ const g = rangka(tx, 0, tz + 1.9, 0); taruh(g, 'box', 1.2, 2.0, .06, 0, yF(k) + .6 + 1.0, .02, '#B9B0A0', { slot: 0, attach: 'z+' });
      _jeruji(g, 1.1, 1.9, 0, yF(k) + .65, .06, 6, '#5E5850', { satu: 1, rel: .06, batang: .06, lod: 1 }); }
    apartemen_jendela(rangka(tx - .9, 0, tz, -Math.PI / 2), 0, 1.0, .8, 1.0, wl);
    // kolom koridor dari tanah
    for (const xk of [-tw / 2 + .3, -tw * .2, tw / 2 - .3]) taruh(fF, 'box', .3, H - .2, .3, xk, (H - .2) / 2, j - .2, '#D9D4C8', { slot: 0 }); }
  // ---- lantai dasar: lobby + kanopi + minimarket ----
  const xl = 0, lebar = tw >= 12;
  pintu(xl + cx, zf, { w: 1.8, h: 2.5, y: .3, daun: 2, kaca: true, c: '#3A3F44', kusen: BINGKAI, wall: wl, boven: true });
  for (const sx of [-1, 1]) etalase(cx + xl + sx * 2.3, zf, { w: 2.0, h: 2.6, y: .5, wall: wl, ambang: cGr, bagi: 1.1 });
  if (lebar && s !== 3){ const sm = s === 2 ? -1 : 1;
    etalase(cx + sm * 4.5, zf, { w: 1.5, h: 2.3, y: .6, wall: wl, ambang: cGr, teks: 'BUKA', bagi: 2 });
    pintu(cx + sm * 6.1, zf, { w: .9, h: 2.3, y: .15, kaca: true, c: '#3A3F44', kusen: BINGKAI, wall: wl });
    papanNama(cx + sm * 5.25, 3.15, zf, { w: 2.8, h: .65, c, slot: 1, teks: 'MART 24', cTeks: '#EDE8DC' });
    for (const k of [0, 1]) apartemen_jendela(fF, -sm * (4.5 + k * 1.6), 1.2, 1.0, 1.4, wl); }
  else if (s === 3){ apartemen_jendela(fF, xl - 4.3, 1.2, 1.0, 1.4, wl); papanNama(x1 - .95, 2.25, zf, { w: 1.5, h: .6, c, slot: 1, teks: 'RUSUN', cTeks: '#EDE8DC' }); }
  for (const g of [fL, fB]) apartemen_jendela(g, 0, 1.2, 1.4, 1.5, wl);
  { const kd = 2.4, ky = 3.55, kw = 5.0, kx = cx + xl, f = rangka(kx, 0, zf, 0);
    taruh(f, 'box', kw, .36, kd + .05, 0, ky + .18, (kd - .05) / 2, '#CFC9BC', { slot: 0 });
    taruh(f, 'box', kw, .5, .14, 0, ky + .25, kd - .05, c, { slot: 1 });
    for (const sx of [-1, 1]) cylLo(.18, ky, kx + sx * (kw / 2 - .3), 0, zf + kd - .35, '#E3DED2');
    teks(s === 3 ? 'RUSUN NZ' : 'NETIZENIA', kx, ky + .09, zf + kd + .02, { tinggi: .32, lebarMaks: kw - .7, c: '#EDE8DC', dz: .01 });
    taruh(f, 'box', kw + .6, .3, 1.0, 0, .15, .5, '#BFB6A8', { slot: 0 });
    for (const k of [-1, 1]) taruh(rangka(kx + k * 1.3, ky - .03, zf + 1.2, 0), 'box', .3, .05, .3, 0, 0, 0, LAMPU, { glow: true, noEdge: true }); }
  // ---- atap ----
  atapDatar(tw, td, cx, H, zc, { parapet: 1.0, c: '#B8B2A6', cParapet: wl, slotParapet: 2 });
  const yA = H + .12, mr = s & 1 ? -1 : 1;
  { const f = rangka(cx + mr * (tw / 2 - 2.0), yA, zb + 2.0, 0);
    taruh(f, 'box', 2.4, 2.8, 2.4, 0, 1.4, 0, darken(wl, .94), { slot: 0, wall: true }); taruh(f, 'box', 2.7, .15, 2.7, 0, 2.87, 0, darken(wl, .8), { slot: 0 });
    taruh(f, 'box', .9, 2.0, .06, 0, 1.0, 1.21, '#5E666C', { slot: 0, attach: 'z+' }); }
  for (const i of [0, 1]) tandon(cx - mr * (tw / 2 - 1.1), yA, zc - 1.2 + i * 1.6, { c: i ? 'biru' : '#D9762B', r: .6, h: 1.3, kaki: .9 });
  parabola(cx + mr * 1.0, yA, zc + .5, { rot: mr * .5 });
  if (s === 3){ jemuran(cx + 1.0, zc - 1.2, { y: yA, w: 3.0, h: 1.6, n: 5, warna: 2 }); jemuran(cx + 1.0, zc + 1.0, { y: yA, w: 3.0, h: 1.6, n: 4, warna: 4 }); }
  else { const pw = Math.min(6.4, tw - 2.4), fb = rangka(cx, yA, zf - .8, 0);
    for (const sx of [-1, 1]) taruh(fb, 'box', .14, 1.7, .14, sx * pw * .38, .85, -.1, BESI, { slot: 0 });
    papanNama(cx, yA + 1.4, zf - .8, { w: pw, h: 1.1, c, slot: 1, teks: 'NETIZENIA', cTeks: '#EDE8DC', bingkai: '#D9D4C8' }); }
  // ---- halaman: kolam, kursi, palem, mobil, pagar ----
  const zP = LD / 2 - .16, gx = cx + xl;
  const pool = [{ x: -5.7, z: 4.4, r: 1 }, { x: 5.7, z: -3.5, r: 1 }, { x: 5.7, z: 4.3, r: 1 }, { x: -5.75, z: 4.4, r: 1 }][s];   // r 1 = memanjang z
  { const W = pool.r ? 3 : 6, D = pool.r ? 6 : 3, f = rangka(pool.x, 0, pool.z, 0);
    taruh(f, 'box', W, .26, D, 0, .13, 0, '#86A9B8', { slot: 0 });
    for (const sz of [-1, 1]){ taruh(f, 'box', W + .6, .32, .3, 0, .16, sz * (D / 2 + .15), '#D9D4C8', { slot: 0 }); taruh(f, 'box', .3, .32, D, sz * (W / 2 + .15), .16, 0, '#D9D4C8', { slot: 0 }); }
    const n0 = P.length; for (const k of [-1, 1]) taruh(rangka(pool.x + (pool.x > 0 ? -1 : 1) * (W / 2 + .7), 0, pool.z + k * 1.3, 0), 'box', .6, .35, 1.7, 0, .3, 0, '#E6E2D8', { slot: 0, rx: -.12 });
    apartemen_lod(n0); }
  const palm = [[[-2.4, 6.2], [4.92, 6.0]], [[-6.2, 6.2], [6.3, 1.2]], [[2.4, 6.2], [-6.4, 6.4]], [[-2.6, 6.2], [4.6, 6.3]]][s];
  palm.forEach(([px, pz], k) => apartemen_palem(px, pz, 4.6 + k * .8, k + s));
  const cMob = ['#C9D3DC', '#B4443A', '#E5E1D8', '#2E3A40', '#3E5A82'];
  const cars = [[[3.55, 4.6, Math.PI / 2], [6.3, 4.6, Math.PI / 2]], [[3.2, 5.0, 0], [3.2, 6.9, 0]], [[-3.9, 3.9, Math.PI / 2], [-6.15, 3.9, Math.PI / 2]], [[4.4, 3.6, Math.PI / 2], [6.7, 3.6, Math.PI / 2]]][s];
  cars.push([cx + xl, zf + 3.55, 0]);   // mobil ke-3: berhenti di jalur drop-off depan kanopi (di luar kolom kanopi)
  cars.forEach(([px, pz, r], k) => apartemen_mobil(px, pz, r, cMob[(k + iw + s) % 5]));
  apartemen_cekHalaman(palm, cars, { x0, x1, zb, zf, j, s, LW, LD });
  pagarHalaman(LW - .3, zP, { gaya: 'besi', h: 1.0, gerbang: true, gW: 3.6, gx, pilar: 2.6, c: '#CFC9BC', cPilar: '#D9D4C8' });
  { const n0 = P.length; for (const sx of [-1, 1]) pot(gx + sx * 1.9, zf + .5, 1.1, { y: .3, kotak: true, c: cGr }); apartemen_lod(n0); }
  talang(x1, 0, H - .1, { z: zf - .3, rot: Math.PI / 2 }); talang(x0, 0, H - .1, { z: zf - .3, rot: -Math.PI / 2 });
};
