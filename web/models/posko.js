/* posko (1×1) — spek-gaya §6 no. 23. Posko Tukang: pos ronda kayu panggung khas kampung Indonesia + lapak material tukang (orisinal).
   pos ronda 2,4×2,4 lantai papan ,4 di 4 tiang kayu + 1 anak tangga + pagar pita (belakang & samping) + atap limasan genteng 30°
   (seed 1/3: pelana seng 20°), bohlam di bawah atap, kentongan bambu di tiang depan, bangku kayu, spanduk 'POSKO' di 2 tiang bambu,
   2 drum biru/oranye + jeriken (halaman depan), tumpukan bata 6 balok, gundukan pasir, 2 sak semen (depan), gerobak dorong (seed 0/1) atau molen pengaduk (seed 2/3),
   jalan setapak. Varian: bit 0 = cermin. Semua di dalam kavling; muka +z menghadap jalan. */
// gerobak dorong (arco) tukang: bak miring + roda + 2 pegangan + kaki; menghadap +z lokal
function posko_arco(x, z, rot){ const f = rangka(x, 0, z, rot);
  taruh(f, 'box', .62, .32, .9, 0, .55, .05, '#3E6FB0', { slot: 0, rx: .12 });
  taruh(f, 'box', .1, .36, .36, 0, .2, .62, '#1E1C1A', { slot: 0, lod: 1 });
  for (const s of [-1, 1]) taruh(f, 'box', .05, .05, 1.1, s * .26, .55, -.55, '#5E666C', { slot: 0 });
  taruh(f, 'box', .5, .3, .06, 0, .15, -.3, '#5E666C', { slot: 0, noEdge: true, lod: 1 }); }
// molen (pengaduk semen): drum miring + rangka + 2 roda; menghadap +z lokal
function posko_molen(x, z, rot){ const f = rangka(x, 0, z, rot);
  taruh(f, 'box', .9, .12, 1.3, 0, .55, 0, '#5E666C', { slot: 0 });
  taruh(f, 'cylLo', .9, 1.0, .9, 0, 1.05, .15, '#C2913A', { slot: 0, rx: -.6 });
  taruh(f, 'box', .12, .5, .12, 0, .3, -.45, '#5E666C', { slot: 0, lod: 1 });
  taruh(f, 'box', .9, .44, .12, 0, .22, .4, '#1E1C1A', { slot: 0, noEdge: true, lod: 1 }); }
CAT.posko.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, m = s & 1 ? -1 : 1, LW = fx + .8, LD = fz + .8, hx = LW / 2, hz = LD / 2;
  const KY = '#7A5A3A', KYg = '#5E4630', pelana = s === 1 || s === 3;
  // ---- pos ronda panggung ----
  const W = 2.4, px = -m * 1.55, pz = -.7, ph = .42, hT = 2.55, zf = pz + W / 2;
  const f = rangka(px, 0, pz, 0);
  taruh(f, 'box', W + .1, .12, W + .1, 0, ph - .06, 0, '#A8865E', { slot: 0 });                       // lantai papan
  for (const a of [-1, 1]) for (const b of [-1, 1]) taruh(f, 'box', .14, hT, .14, a * (W / 2 - .02), hT / 2, b * (W / 2 - .02), KYg, { slot: 0 });
  taruh(f, 'box', 1.1, .2, .34, m * .45, .1, W / 2 + .2, '#8C6A48', { slot: 0, lod: 1 });                       // anak tangga
  // pagar pita (papan) belakang + 2 samping, setinggi ,55 di atas lantai
  taruh(f, 'box', W - .1, .5, .05, 0, ph + .45, -W / 2 + .02, KY, { slot: 0, noHull: true });
  for (const a of [-1, 1]) taruh(f, 'box', .05, .5, W - .1, a * (W / 2 - .02), ph + .45, 0, KY, { slot: 0, noHull: true });
  // atap
  if (pelana) atapPelana(W, W, px, hT, pz, { arah: 'x', sudut: 20, overhang: .45, c: '#8E979C', cWall: '#C9BBA0', gaya: 'pejal', pita: false });
  else atapLimasan(W, W, px, hT, pz, { sudut: 30, overhang: .45, c: gt, cWall: '#C9BBA0', pita: false });
  taruh(f, 'box', W + .3, .16, W + .3, 0, hT - .08, 0, KYg, { slot: 0 });                              // balok keliling (pita bawah atap)
  gbox(.16, .2, .16, px, hT - .4, pz, LAMPU);                                                           // bohlam
  // isi: tikar + termos + papan jadwal ronda di pagar belakang
  taruh(f, 'box', 1.6, .03, 1.2, -m * .2, ph, -.3, '#B5473A', { slot: 0, lod: 1, noEdge: true });
  taruh(f, 'box', .7, .5, .03, m * .5, ph + .5, -W / 2 + .06, '#E6E2D8', { slot: 0, lod: 1, noEdge: true });
  // kentongan bambu tergantung di tiang depan sisi dalam kavling
  const kx = px + m * (W / 2 + .12);
  taruh(rangka(kx, 0, zf, 0), 'cylLo', .2, .6, .2, 0, 1.55, 0, '#C9A86A', { slot: 0, lod: 1 });
  taruh(rangka(kx, 0, zf, 0), 'box', .08, .04, .08, 0, 1.92, 0, '#3A3430', { slot: 0 });
  // motor tukang diparkir di halaman depan
  motor(-m * 2.7, hz - 1.6, { rot: m * 2.4, c: ['#B4443A', '#3E5A82', '#2E3A40', '#B4443A'][s] });
  // bangku panjang di depan
  bangku(px - m * .2, zf + 1.1, { w: 1.6, c: '#8C6A48', sandaran: false });
  // ---- material tukang ----
  const mx = m;   // sisi material = seberang pos
  // tumpukan bata 2 kolom × 3 lapis (6 balok)
  for (let k = 0; k < 6; k++){ const col = k % 2, row = k >> 1; box(.88, .26, .55, mx * (1.55 + col * .92), row * .26, -.9 + (row % 2) * .04, row % 2 ? '#9C4935' : '#A8553B'); if (row) P[P.length - 1].lod = 1; }
  // gundukan pasir + sekop
  pyr(1.8, .8, 1.5, mx * 2.6, 0, -2.85, PAL.pasir);
  taruh(rangka(mx * 2.1, 0, -2.4, .6), 'box', .05, .05, 1.1, 0, .6, 0, '#7A5A3A', { slot: 0, rx: -.7 });
  // 2 sak semen
  // halaman depan (sisi jalan) diisi: 2 sak semen, 2 drum + jeriken di belakang spanduk, gerobak/molen maju ke depan
  for (let k = 0; k < 2; k++){ box(.7, .2, .45, mx * (1.0 + k * .08), k * .2, 2.45 - k * .05, k ? '#D8D2C2' : '#CFC8B6'); P[P.length - 1].lod = 1; }
  cylLo(.3, .9, mx * 3.35, 0, 1.45, '#3E6FB0'); cylLo(.3, .9, mx * 3.3, 0, 2.2, '#D9762B');
  box(.32, .42, .2, mx * 2.75, 0, 2.6, '#D9A441'); P[P.length - 1].lod = 1;   // jeriken
  if (s < 2) posko_arco(mx * 2.0, 1.1, mx * .5); else posko_molen(mx * 2.0, 1.0, mx * -.6);
  // ---- spanduk POSKO di 2 tiang bambu + jalan setapak ----
  spanduk(m * 1.8, 1.55, hz - .55, { w: 2.8, h: .85, c: '#E6E2D8', teks: 'POSKO', cTeks: '#B5473A', tiang: true });
  box(1.2, .06, hz - .2 - zf - .3, px + m * .45, 0, (zf + .3 + hz - .2) / 2, '#C9BFA6'); P[P.length - 1].noEdge = true;
};
