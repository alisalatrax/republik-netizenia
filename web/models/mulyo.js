/* mulyo (2×2) — spek-gaya §6 no. 22. Rumah Pak Mulyo: rumah joglo besar warga (Jawa) di kavling 16×16.
   dalem 9×6,5 dinding #E3DED2 (seed 1/3: gebyok kayu) di atas kaki bata ,9 + atap joglo (limasan bawah landai + brunjung curam),
   4 jendela kayu berdaun, pintu dobel ukir (kusen emas + roster ukiran), pendopo 8,4×3,4 di depan (lantai umpak ,45 + 4 saka + atap
   limasan 22° / seed 2-3: joglo kecil), lampu gantung, sangkar burung, bangku tamu, kentongan; halaman: gapura (seed 0/1 paduraksa
   beratap, 2/3 bentar terbelah) + papan 'PAK MULYO', pagar kayu depan, tembok bata samping, kolam ikan berbatu, tiang bendera 8 m,
   2 pohon (mangga + sawo), jalan setapak batu, pot, lampu taman. Seed ganjil = denah dicermin (kolam/bendera bertukar sisi).
   Bukan tipe deret; semua bagian di dalam kavling. */
const mulyo_box = (...a) => { box(...a); return P[P.length - 1]; };
CAT.mulyo.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, sx = s & 1 ? -1 : 1, LW = fx + .8, LD = fz + .8, hx = LW / 2, hz = LD / 2, X = x => sx * x;
  const gebyok = s % 2 === 1, cDal = gebyok ? '#8C6A4A' : '#E3DED2', BATA = '#A8553B', KY = '#6B4A32', EMAS = '#C2913A', PARAS = '#A9A28E';
  const kusen = gebyok ? '#5A4636' : '#7A5A3A';
  // ---- dalem ----
  const dw = 9.0, H = 3.4, zb = -hz + 1.1, zf = -.4, dd = zf - zb, zc = (zb + zf) / 2;
  dinding(dw, H, dd, 0, 0, zc, cDal, { plinth: .9, cPlinth: BATA, lis: [H - .35], cLis: gebyok ? '#5A4636' : '#CFC6B4', slot: 0 });
  // pintu dobel ukir: daun kayu tua + kusen emas + roster ukiran + panel ukir (dekat)
  pintu(0, zf, { y: .9, w: 1.7, h: 2.3, daun: 2, c: KY, wall: cDal, kusen: EMAS, boven: 'roster' });
  for (const k of [-1, 1]) taruh(rangka(k * .42, .9 + 1.15, zf, 0), 'box', .5, 1.5, .03, 0, 0, .075, '#8A6440', { slot: 0, lod: 1, noEdge: true });
  box(2.4, .9, 1.0, 0, 0, zf + .5, PARAS);   // undakan ke pintu (lantai dalem ,9)
  mulyo_box(2.0, .45, .35, 0, 0, zf + 1.17, darken(PARAS, .92)).lod = 1;
  // 4 jendela kayu berdaun
  for (const x of [-3.4, -1.75, 1.75, 3.4]) jendela(x, 1.25, zf, { w: .9, h: 1.4, wall: cDal, kusen, daun: KY, palang: false, ambang: true });
  // samping & belakang
  for (const sd of [-1, 1]) jendela(sd * dw / 2, 1.25, zc - .8, { rot: sd * Math.PI / 2, w: .9, h: 1.4, wall: cDal, kusen, daun: false });
  jendelaKecil(0, 1.6, zb, { rot: Math.PI, w: .7, h: .7, wall: cDal, kusen });
  talang(-dw / 2 + .2, 0, H - .1, { z: zf }); talang(dw / 2 - .2, 0, H - .1, { z: zf });
  // atap joglo dalem
  atapJoglo(dw, dd, 0, H, zc, { overhang: 1.0, sudutBawah: 22, sudutAtas: 45, c: gt, cWall: cDal });
  // ---- pendopo: lantai umpak + 4 saka + atap ----
  const pw = 8.4, pz0 = 1.4, pz1 = 4.8, pd = pz1 - pz0, pzc = (pz0 + pz1) / 2, ph = .45, ps = 3.0;
  mulyo_box(pw, ph, pd, 0, 0, pzc, PARAS);
  mulyo_box(pw - .1, .04, pd - .1, 0, ph, pzc, '#B98C6E').noEdge = true;   // tegel terakota
  for (let k = 0; k < 2; k++) mulyo_box(2.4, ph * (2 - k) / 3, .32, 0, 0, pz1 + .16 + k * .3, darken(PARAS, .93 - k * .03)).lod = 1;
  const sk = [[-3.7, pz0 + .35], [3.7, pz0 + .35], [-3.7, pz1 - .35], [3.7, pz1 - .35]];
  for (const [x, z] of sk){ box(.26, ps, .26, x, ph, z, KY); const u = mulyo_box(.42, .22, .42, x, ph, z, '#8E8A84'); u.lod = 1; }
  // balok keliling (blandar) di atas saka
  for (const z of [pz0 + .35, pz1 - .35]) mulyo_box(7.66, .22, .22, 0, ph + ps - .22, z, KY).lod = 1;
  let rP;
  if (s < 2) rP = atapLimasan(7.6, pd - .4, 0, ph + ps, pzc, { sudut: 22, overhang: .6, c: gt, cWall: '#8C6A48' });
  else rP = atapJoglo(7.6, pd - .4, 0, ph + ps, pzc, { overhang: .6, sudutBawah: 20, sudutAtas: 40, c: gt, cWall: '#8C6A48' });
  // isi pendopo: lampu gantung, sangkar burung, kentongan, bangku tamu + meja
  taruh(rangka(0, ph + ps - .9, pzc, 0), 'box', .03, .6, .03, 0, .3, 0, BESI, { slot: 0 });
  taruh(rangka(0, ph + ps - 1.1, pzc, 0), 'sphLo', .22, .22, .22, 0, 0, 0, LAMPU, { glow: true, lod: 1 });
  taruh(rangka(X(2.6), ph + ps - 1.0, pz1 - .4, 0), 'cylLo', .38, .45, .38, 0, 0, 0, '#C9A86A', { slot: 0, lod: 1 });   // sangkar burung
  taruh(rangka(X(-3.7), ph + 1.3, pz1 - .2, 0), 'cylLo', .18, .6, .18, 0, 0, 0, '#8C6A48', { slot: 0, lod: 1 });       // kentongan di saka
  for (const k of [-1, 1]) box(.5, .45, 1.3, X(k * 1.1), ph, pzc - .1, '#7A5A3A');   // dingklik/bangku tamu
  box(1.0, .5, .6, X(0), ph, pzc - .1, KY);
  // ---- halaman depan: gapura + pagar kayu + jalan batu ----
  const zP = hz - .75, gW = 1.8, pil = .6;
  pagarHalaman(LW - .1, zP, { x0: 0, gaya: 'kayu', h: .95, gx: 0, gW: gW + 2 * pil - .3, c: '#8C6A48', gerbangBesi: false });
  for (const sd of [-1, 1]){ const px = sd * (gW / 2 + pil / 2);
    if (s < 2){ box(pil, 2.6, pil, px, 0, zP, BATA); box(pil + .1, .15, pil + .1, px, 2.6, zP, PARAS); }
    else { let y = 0; for (const [w, h, cc] of [[pil + .15, .4, PARAS], [pil, 1.6, BATA], [pil + .1, .15, PARAS], [pil - .15, .8, BATA], [pil - .05, .12, PARAS], [pil - .35, .45, BATA]]){ box(w, h, w, px + sd * (w - pil) / 2 * 0, y, zP, cc); y += h; } }
    taruh(rangka(px, 2.3, zP + pil / 2, 0), 'sphLo', .13, .13, .13, 0, 0, .02, LAMPU, { glow: true, lod: 1 }); }
  if (s < 2){ box(gW + 2 * pil + .2, .3, pil + .1, 0, 2.75, zP, BATA);
    const hr = .75, W = gW + 2 * pil + .9, D = pil + .6, Hg = hipGeo(W, D, hr); taruh(rangka(0, 3.05, zP, 0), 'custom', W, hr, D, 0, hr / 2, 0, gt, { geo: Hg.geo, edges: Hg.edges, slot: 3 });
    papanNama(0, 2.1, zP + pil / 2 - .02, { w: gW - .1, h: .45, c: KY, teks: 'PAK MULYO', cTeks: '#E6D8A8', bingkai: EMAS }); }
  else papanNama(X(-3.4), .25, zP + .1, { w: 2.0, h: .45, c: KY, teks: 'PAK MULYO', cTeks: '#E6D8A8', bingkai: EMAS });
  // jalan batu gerbang → pendopo
  mulyo_box(1.6, .06, zP - pz1 - .9, 0, .03, (pz1 + .8 + zP) / 2, '#BFB6A8').noEdge = true;
  // tembok bata samping (rendah) + belakang
  for (const sd of [-1, 1]){ const q = mulyo_box(.22, .9, LD - .7, sd * (hx - .17), 0, -.25, BATA); q.wall = true; mulyo_box(.3, .1, LD - .7, sd * (hx - .17), .9, -.25, PARAS).lod = 1; }
  // ---- kolam ikan berbatu (sisi kiri sebelum cermin) ----
  { const kx = X(-6.2), kz = 3.0, kw = 2.4, kd = 3.2;
    mulyo_box(kw - .2, .2, kd - .2, kx, .03, kz, '#6E8FA0').noEdge = true;
    for (const [w, d, dx, dz] of [[kw, .3, 0, kd / 2 - .15], [kw, .3, 0, -kd / 2 + .15], [.3, kd - .6, kw / 2 - .15, 0], [.3, kd - .6, -kw / 2 + .15, 0]]) mulyo_box(w, .35, d, kx + dx, 0, kz + dz, PARAS).lod = 1;
    for (const [dx, dz] of [[-.4, .5], [.3, -.6]]){ const q = mulyo_box(.4, .03, .4, kx + dx, .22, kz + dz, '#6E9245'); q.lod = 1; q.noEdge = true; }
    box(.5, .6, .5, kx + .55, 0, kz - kd / 2 + .55, '#8E8A84'); }
  // ---- tiang bendera, pohon, pot, lampu taman ----
  tiangBendera(X(6.3), 5.9, 8, {});
  pohonKecil(X(-6.6), -5.2, .9, { jenis: 'bulat' });
  pohonKecil(X(6.5), -3.6, .9, { jenis: 'bulat', c: '#5F8A3E' });
  for (const k of [-1, 1]) pot(k * 1.35, zP - .75, .9, { bunga: k > 0 ? '#C9503C' : null, kotak: s >= 2 });
  for (const k of [-1, 1]){ const lx = k * 5.0, lz = 6.4; box(.1, 1.2, .1, lx, 0, lz, BESI); taruh(rangka(lx, 1.2, lz, 0), 'sphLo', .16, .16, .16, 0, .12, 0, LAMPU, { glow: true, lod: 1 }); }
};
