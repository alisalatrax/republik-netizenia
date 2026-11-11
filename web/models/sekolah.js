/* sekolah (2×2) — spek-gaya §6 no. 12. SD negeri khas Indonesia: gedung kelas 2 lantai bentuk L (blok belakang 13,7 + sayap 6,0×7,6),
   selasar/koridor depan kelas tiap lantai (pelat + pagar tembok + kolom dari tanah sampai teritis), pintu kelas + papan kelas,
   jendela kelas lebar berpalang + roster ventilasi di atasnya, plint gelap, lis lantai, talang, lapangan upacara paving bergaris,
   tiang bendera 7,5, gapura sekolah (2 pilar + papan 'SD NETIZENIA') di gerbang, pagar tembok/besi depan + tembok samping,
   pohon peneduh, bangku, pot, rak sepatu/sepeda, lampu. Selalu 2 lantai (spek §6; floorsFor = 1 tidak menentukan tinggi tipe ini).
   Varian seed: 0 sayap kanan + limasan + pagar tembok · 1 sayap kiri + limasan + pagar besi · 2 sayap kanan + pelana + pagar besi
   + kanopi pintu · 3 sayap kiri + pelana + pagar tembok. Semua bagian di dalam kavling 16×16 (bukan tipe deret). */
// selasar lantai atas: pelat + pagar tembok depan saja (sisi terbuka → menyambung ke selasar lain) + lis topi; rangka f (muka dinding, +z = luar)
function sekolah_selasar(f, w, j, y, cPagar, besi){
  taruh(f, 'box', w, .16, j, 0, y + .08, j / 2, '#CFC9BC', { slot: 0 });
  if (besi){ _jeruji(f, w - .1, .8, 0, y + .16, j - .06, Math.max(6, Math.round(w / .45)), "#3F6B62", { lod: 1, satu: 1, rel: .06 });
    taruh(f, 'box', w, .1, .14, 0, y + 1.0, j - .07, '#3F6B62', { slot: 0 }); }
  else { taruh(f, 'box', w, .85, .12, 0, y + .16 + .425, j - .06, cPagar, { wall: true, slot: 0 });
    taruh(f, 'box', w + .04, .08, .2, 0, y + 1.05, j - .06, darken(cPagar, .85), { slot: 0 }); } }
// pintu kelas hemat: reveal gelap + daun + kusen cincin + roster boven (≈ 54 segitiga)
function sekolah_pintu(x, y, z, rot, c, wl, kusen){ const f = rangka(x, y, z, rot), w = .9, h = 2.1;
  taruh(f, 'box', w + .26, h + .5, .06, 0, (h + .5) / 2, 0, darken(wl, .70), { attach: 'z+', ao: .8, slot: 0 });
  taruh(f, 'box', w, h, .08, 0, h / 2, .02, c, { attach: 'z+', slot: 0 });
  _bingkai(f, w + .2, h + .06, .09, 0, 0, .03, .09, kusen, false);
  taruh(f, 'box', w, .26, .05, 0, h + .22, .02, '#4E4740', { slot: 0, lod: 1, noEdge: true }); }
// box yang mengembalikan primitifnya (box() c1_core mengembalikan panjang P)
const sekolah_box = (...a) => { box(...a); return P[P.length - 1]; };
CAT.sekolah.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, sx = s & 1 ? -1 : 1, LW = fx + .8, LD = fz + .8, hx = LW / 2, hz = LD / 2;
  const n = 2, H = n * LANTAI, t0 = .3, X = x => sx * x, R = r => sx * r;   // R: rotasi muka samping ikut cermin
  const pel = s >= 2, cPagarSel = campur(wl, '#E6E2D8', .45), cPl = s % 2 ? '#7E7468' : darken(wl, .62), kusen = s === 1 ? '#7A5A3A' : KUSEN;
  const cPintu = ['#4F6D5A', '#5A4636', '#4C6A96', '#7A5A3A'][s];
  // ---- denah (koordinat sebelum cermin sx): blok belakang + sayap kanan ----
  const bx0 = -6.85, bx1 = 6.85, zb = -7.15, zf = -2.4, jk = 1.6, zK = zf + jk;          // blok belakang: kelas z zb..zf + selasar sampai zK
  const wx0 = 2.45, wx1 = 6.85, wz1 = 5.0, kx = wx0 - jk;                                // sayap: kelas x wx0..wx1, z zf..wz1; selasar x kx..wx0
  const lis = [LANTAI - .06];
  dinding(bx1 - bx0, H, zf - zb, X((bx0 + bx1) / 2), 0, (zb + zf) / 2, wl, { plinth: .6, cPlinth: cPl, lis });
  dinding(wx1 - wx0, H, wz1 - zf + .02, X((wx0 + wx1) / 2), 0, (zf + wz1) / 2 - .01, wl, { plinth: .6, cPlinth: cPl, lis });
  // lantai selasar bawah (ditinggikan t0) + tangga di ujung
  box(kx - bx0, t0, jk, X((bx0 + kx) / 2), 0, zf + jk / 2, '#C9BFA6');
  box(jk, t0, wz1 - zf, X((kx + wx0) / 2), 0, (zf + wz1) / 2, '#C9BFA6');
  box(1.4, .15, .35, X(-1.0), 0, zK + .17, darken('#C9BFA6', .92));
  box(.35, .15, 1.4, X(kx - .17), 0, 3.4, darken('#C9BFA6', .92));
  // ---- selasar lantai 2 (blok belakang: x bx0..kx; sayap: z zK..wz1; sudut: pelat saja) ----
  const fB = rangka(X((bx0 + kx) / 2), 0, zf, 0), fW = rangka(X(wx0), 0, (zK + wz1) / 2, R(-Math.PI / 2));
  sekolah_selasar(fB, kx - bx0, jk, LANTAI, cPagarSel, s === 1 || s === 2);
  sekolah_selasar(fW, wz1 - zK, jk, LANTAI, cPagarSel, s === 1 || s === 2);
  box(jk, .16, jk, X((kx + wx0) / 2), LANTAI, zf + jk / 2, '#CFC9BC');
  // pagar ujung selasar (ujung depan sayap & ujung kiri blok belakang) — tidak ada pelat terbuka tanpa pengaman
  for (const [w, d, x, z] of [[jk - .12, .12, (kx + wx0) / 2 - .06, wz1 - .06], [.12, jk - .12, bx0 + .06, zf + jk / 2 + .06]]){
    const besiS = s === 1 || s === 2; sekolah_box(w, besiS ? .1 : .85, d, X(x), LANTAI + (besiS ? .95 : .16), z, besiS ? '#3F6B62' : cPagarSel).wall = !besiS; }
  // kolom selasar: dari tanah sampai teritis (memikul pelat & atap)
  const kol = []; for (let k = 0; k < 4; k++) kol.push([bx0 + .2 + k * (kx - .2 - bx0 - .2) / 3, zK - .15]);
  for (let k = 1; k < 4; k++) kol.push([kx + .15, zK + (wz1 - .2 - zK) * k / 3]);
  kol.push([kx + .15, zK - .15]);
  for (const [x, z] of kol) box(.26, H - t0, .26, X(x), t0, z, '#E6E2D8');
  // ---- bukaan: kelas blok belakang (muka z = zf), 2 kelas per lantai: pintu kelas + jendela lebar berpalang + roster ventilasi ----
  for (let k = 0; k < n; k++){ const y = k ? LANTAI + .16 : t0;
    for (const [cx0, cw] of [[bx0, 3.9], [bx0 + 3.9, kx - bx0 - 3.9]]){
      const xd = cx0 + .75, xw = cx0 + cw * .62;
      sekolah_pintu(X(xd), y, zf, 0, cPintu, wl, kusen);
      if (s === 2 && k === 0) taruh(rangka(X(xd), y + 2.75, zf, 0), 'box', 1.5, .07, .75, 0, -.08, .37, SENG, { rx: 14 * D2R, slot: 0 });   // kanopi seng kecil
      jendela(X(xw), y + .85, zf, { w: 2.3, h: 1.35, wall: wl, kusen, palang: true, ambang: false });
      taruh(rangka(X(xw), y + 2.42, zf, 0), 'box', 2.5, .26, .06, 0, .13, .01, '#5E5850', { attach: 'z+', slot: 0, lod: 1, noEdge: true }); }
    // sayap: muka selasar (−x sebelum cermin) 1 pintu + 1 jendela; muka depan (+z, ke jalan) 1 jendela lebar + roster
    const rS = R(-Math.PI / 2);
    sekolah_pintu(X(wx0), y, 0.9, rS, cPintu, wl, kusen);
    jendela(X(wx0), y + .85, 3.0, { rot: rS, w: 2.0, h: 1.35, wall: wl, kusen, palang: true, ambang: false });
    jendela(X((wx0 + wx1) / 2), y + .85, wz1, { w: 2.6, h: 1.35, wall: wl, kusen, palang: true, ambang: k === 0, topi: k === 1 });
    taruh(rangka(X((wx0 + wx1) / 2), y + 2.42, wz1, 0), 'box', 2.8, .24, .06, 0, .12, .01, '#5E5850', { attach: 'z+', slot: 0, lod: 1, noEdge: true });
    if (k === 1) ac(X(wx1), y + 1.0, 1.0, { rot: R(Math.PI / 2), lod: 1 });
  }
  teks('KELAS', X(bx0 + 1.95), t0 + 2.85, zf, { tinggi: .2, c: darken(wl, .4), dz: .015 });
  // samping & belakang: jendela kecil (siluet & malam)
  jendelaKecil(X(bx0), 4.4, -4.8, { rot: R(-Math.PI / 2), w: .8, h: .8, wall: wl, kusen });
  // papan pengumuman di dinding sayap (muka selasar)
  taruh(rangka(X(wx0), 1.1, 4.3, R(-Math.PI / 2)), 'box', 1.2, .8, .06, 0, .4, .02, '#6B5546', { attach: 'z+', slot: 0 });
  taruh(rangka(X(wx0), 1.1, 4.3, R(-Math.PI / 2)), 'box', 1.0, .6, .02, 0, .4, .06, '#D9D2BC', { slot: 0, lod: 1, noEdge: true });
  // ---- atap: blok belakang (meliputi selasar) + sayap ----
  const ov = .6, dB = zK - zb, zcB = (zb + zK) / 2, dW = wz1 - zK + .01, zcW = (zK + wz1) / 2;
  let rB, rW;
  if (!pel){ rB = atapLimasan(bx1 - bx0, dB, 0, H, zcB, { sudut: 30, overhang: ov, c: gt, cWall: wl });
    rW = atapLimasan(wx1 - kx, dW, X((kx + wx1) / 2), H, zcW, { sudut: 30, overhang: ov, c: gt, cWall: wl }); }
  else { rB = atapPelana(bx1 - bx0, dB, 0, H, zcB, { arah: 'x', sudut: 30, overhang: ov, c: gt, cWall: wl });
    rW = atapPelana(wx1 - kx, dW, X((kx + wx1) / 2), H, zcW, { arah: 'z', sudut: 30, overhang: ov, ovL: ov, ovR: 0, c: gt, cWall: wl }); }
  talang(X(bx0 + .3), t0, H - t0 - .1, { z: zK + .02 }); talang(X(wx1 - .3), 0, H - .1, { z: wz1 });
  // ---- lapangan upacara (paving 7,6×6,2) + garis putih + tiang bendera ----
  const lx0 = -7.3, lx1 = kx - .35, lz0 = zK + .25, lz1 = 6.3, lcx = (lx0 + lx1) / 2, lw = lx1 - lx0, ld = lz1 - lz0;
  sekolah_box(lw, .05, ld, X(lcx), .04, (lz0 + lz1) / 2, '#C9C1B2').noEdge = true;
  for (const [w, d, x, z] of [[lw - .5, .06, lcx, lz0 + .25], [lw - .5, .06, lcx, lz1 - .25], [.06, ld - .5, lx0 + .25, (lz0 + lz1) / 2], [.06, ld - .5, lx1 - .25, (lz0 + lz1) / 2]])
    { const q = sekolah_box(w, .03, d, X(x), .09, z, '#E6E2D8'); q.noEdge = true; q.lod = 1; }
  tiangBendera(X(lcx), lz0 + 1.1, 7.5, { rot: 0 });
  box(2.6, .25, .9, X(lcx), 0, lz0 + .5, '#BFB6A8');   // mimbar upacara kecil
  // ---- pagar depan + gapura sekolah + papan nama ----
  const zP = hz - .32, gx = lcx, gW = 2.6;
  const besiP = s === 1 || s === 2;
  pagarHalaman(LW - .1, zP, { x0: 0, gaya: besiP ? 'besi' : 'tembok', h: 1.1, gx: X(gx), gW, c: campur(wl, '#C9BBA0', .5), jarakBesi: .3, cBesi: '#3F6B62', cGerbang: '#3F6B62' });
  for (const sd of [-1, 1]) box(.4, 3.0, .4, X(gx) + sd * (gW / 2 + .45), 0, zP, campur(wl, '#C9BBA0', .3));
  papanNama(X(gx), 2.35, zP + .02, { w: gW + .45, h: .62, c: '#3F6B62', teks: 'SD NETIZENIA', cTeks: '#EDE8DC', bingkai: '#E6E2D8' });
  box(gW + 1.5, .12, .5, X(gx), 3.0, zP, darken(campur(wl, '#C9BBA0', .3), .8));
  for (const sd of [-1, 1]) taruh(rangka(X(gx) + sd * (gW / 2 + .45), 3.12, zP, 0), 'box', .22, .26, .22, 0, .13, 0, LAMPU, { glow: true, lod: 1 });   // lampu kotak di atas pilar
  // tembok samping (kiri/kanan kavling) rendah
  for (const sd of [-1, 1]){ const q = sekolah_box(.16, 1.0, LD - .5, sd * (hx - .1), 0, -.1, campur(wl, '#C9BBA0', .5)); q.wall = true; }
  // jalan masuk gerbang → lapangan
  sekolah_box(gW, .06, zP - .1 - lz1, X(gx), .04, (lz1 + zP - .1) / 2, '#BFB6A8').noEdge = true;
  // ---- halaman: pohon peneduh, pot, bangku selasar, rak sepeda ----
  pohonKecil(X(wx1 - .9), 6.8, .85, { jenis: 'bulat' });
  pohonKecil(X(-7.0), -1.0 + .0, .7, { jenis: s % 2 ? 'pepaya' : 'bulat' });
  for (const x of [wx0 + .5, wx1 - .5]) pot(X(x), wz1 + .45, .8, { bunga: x > 4 ? '#C9503C' : null, kotak: s % 2 === 1 });
  bangku(X(kx + .5), 2.0, { w: 1.4, y: t0, rot: R(Math.PI / 2), c: '#7A5A3A' });
};
