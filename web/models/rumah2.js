/* rumah2 (1×1) — spek-gaya §6 no. 2. Rumah tingkat 2 lantai (2 × 3,2 = 6,4) khas perumahan/kampung Indonesia:
   teras berkolom yang sekaligus menyangga balkon lantai 2 (railing besi + pintu kaca dobel), pintu kayu berpanel + boven,
   jendela berkusen + ambang, lis lantai, plint batu, AC luar, talang paralon, toren air (menara besi / rangka di atas genteng),
   pagar (KOTA besi + gerbang, KAMPUNG tembok rendah, DESA kayu), pot, pohon halaman / jemuran, lampu teras, meteran, nomor rumah.
   Varian seed: 0 pelana 42° sejajar jalan + carport seng kanan (mobil di KOTA, motor di lainnya) ·
   1 pelana 42° + dormer di bidang depan + teras kiri · 2 pelana menghadap jalan (gevel dinding + roster) + carport seng kiri ·
   3 limasan 35° + dormer + teras kanan + jendela berdaun. Deret (adj): pelana bubungan sejajar deret, sisi itu rapat ke batas.
   Semua bagian di dalam kavling (teras, tangga, carport, pagar ≤ LD/2); muka +z menghadap jalan. */
// balkon besi hemat: pelat + jeruji satu muka (depan & 2 sisi) + pegangan
function rumah2_balkon(x, y, z, w, j, c, cLantai){ const f = rangka(x, y, z, 0), hr = .95;
  taruh(f, 'box', w, .15, j + .03, 0, .075, (j - .03) / 2, cLantai || '#BFB6A8', { slot: 0 });
  _jeruji(f, w - .04, hr - .2, 0, .15, j - .04, Math.max(5, Math.round(w / .15)), c, { lod: 0, satu: 1 });
  for (const sx of [-1, 1]) _jeruji(f.sub(sx * (w / 2 - .02), 0, (j - .04) / 2, sx * Math.PI / 2), j - .06, hr - .2, 0, .15, 0, Math.max(3, Math.round(j / .2)), c, { lod: 1, satu: 1 });
  taruh(f, 'box', w, .1, .12, 0, .15 + hr - .13, j - .04, c, { slot: 0 }); }
// dormer di bidang atap depan: dinding kecil (warna dinding) + jendela kecil + atap pelana kecil menghadap jalan.
// yTop(u) = tinggi permukaan atap utama pada jarak u ke dalam dari bidang muka (zf); dormer berdiri di u0 .. ke belakang sampai tenggelam.
function rumah2_dormer(x, zf, u0, yTop, ta, w, hw, c, wl, kusen){ const yb = yTop(u0), yD = yb + hw, sud = 32 * D2R, hr = (w / 2 + .12) * Math.tan(sud);
  const uE = (yD + hr - yTop(0)) / ta + .25, dd = uE - u0, zc = zf - u0 - dd / 2;   // memanjang ke belakang sampai bubungan kecil tenggelam di atap utama
  dinding(w, yD - (yb - .6), dd, x, yb - .6, zc, wl, { plinth: 0 });
  jendelaKecil(x, yb + .18, zf - u0, { w: Math.min(.8, w - .5), h: Math.min(.7, hw - .35), wall: wl, kusen });
  atapPelana(w, dd, x, yD, zc, { arah: 'z', gaya: 'pejal', sudut: 32, overhang: .12, ovL: .2, ovR: 0, c, cWall: wl, pita: false }); }
// motor parkir di atas lantai yang ditinggikan (motor() bawaan selalu di y=0): rangka sendiri di y; roda Ø,52, dek kaki gelap,
// bodi belakang + perisai kaki warna cerah, jok hitam terpisah, spakbor depan, setang. Menghadap +z lokal (2 silinder + 6 kotak ≈ 136 segitiga).
function rumah2_motor(x, y, z, rot, c){ const f = rangka(x, y, z, rot), cb = campur(c, '#F2EEE6', .28);
  for (const zz of [-.6, .6]) taruh(f, 'cylLo', .52, .09, .52, 0, .26, zz, '#1E1C1A', { rx: Math.PI / 2, ry: Math.PI / 2, slot: 0, noEdge: true });
  taruh(f, 'box', .3, .1, .6, 0, .36, .02, '#3A3D40', { slot: 0 });                               // dek kaki
  const q = taruh(f, 'box', .34, .34, .66, 0, .6, -.32, cb, { slot: 0 });                       // bodi belakang (mesin + bagasi)
  taruh(f, 'box', .3, .1, .62, 0, .82, -.3, '#2B2B2B', { slot: 0 });                             // jok
  taruh(f, 'box', .34, .72, .14, 0, .7, .34, cb, { slot: 0 });                                  // perisai kaki + kepala setang
  taruh(f, 'box', .14, .06, .44, 0, .55, .6, cb, { slot: 0, lod: 1 });                          // spakbor depan
  taruh(f, 'box', .64, .045, .045, 0, 1.08, .34, BESI, { slot: 0 });                            // setang
  return q; }
CAT.rumah2.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, A = ctx.adj || {}, aL = !!A.l, aR = !!A.r, deret = aL || aR;
  const LW = fx + .8, LD = fz + .8, H1 = LANTAI, H = 2 * LANTAI, kota = zone === 'KOTA', desa = zone === 'DESA';
  const iw = Math.max(0, WALLS.indexOf(wl)), ia = Math.max(0, AKSEN.indexOf(c));
  // ---- tapak: sisi bebas mundur ,55 (teritis ,45 muat), sisi deret rapat ke batas; carport (seed genap) di sisi kanan (0) / kiri (2) ----
  const cp = s === 0 ? 'r' : s === 2 ? 'l' : null, cpW = 2.75;
  let xl = aL ? -LW / 2 : -LW / 2 + .55, xr = aR ? LW / 2 : LW / 2 - .55;
  const xcL = aL ? -LW / 2 : -LW / 2 + .05, xcR = aR ? LW / 2 : LW / 2 - .05;   // batas carport (kavling)
  if (cp === 'r') xr = xcR - cpW; else if (cp === 'l') xl = xcL + cpW;
  const bw = xr - xl, cx = (xl + xr) / 2;
  const zf = LD / 2 - (kota ? 2.0 : 1.4), zb = -LD / 2 + .65, bd = zf - zb, zc = (zb + zf) / 2;
  const kusen = [KUSEN, KUSEN, '#7A5A3A', '#5E4630'][s], cPlint = s === 2 ? '#7E7468' : darken(wl, .78), cPintu = [KAYU, '#7A5A3A', c, '#4E3C2E'][s];
  // ---- badan 2 lantai + lis lantai ----
  dinding(bw, H, bd, cx, 0, zc, wl, { plinth: .45, cPlinth: cPlint, lis: [H1 - .06], adj: { l: aL && !(cp === 'l'), r: aR && !(cp === 'r') } });
  // ---- teras (lantai ,3 + anak tangga) + 2 kolom menyangga balkon lantai 2 ----
  const tR = cp === 'r' || s === 3, tw = Math.min(2.7, bw * .5), td = kota ? 1.25 : .75, tt = .3;
  const tx0 = tR ? xr - tw : xl, tx1 = tR ? xr : xl + tw, tcx = (tx0 + tx1) / 2, pin = tR ? -1 : 1;   // pin = arah ke tengah rumah
  const cTeras = ['#C9BFA6', '#B98C6E', '#CFC3AE', '#BFB6A8'][s];
  teras(tw, td, tcx, zf, { tinggi: tt, tangga: 1, tanggaW: 1.2, tanggaX: -pin * .3, c: cTeras });
  for (const kx of [tx0 + .14, tx1 - .14]) box(.22, H1 - tt, .22, kx, tt, zf + td - .14, '#E6E2D8');
  rumah2_balkon(tcx, H1, zf, tw, td, BESI, '#CFC9BC');
  box(tw - .04, .06, .06, tcx, H1 - .05, zf + td - .03, '#9C968C');   // tetes air tepi pelat balkon
  // ---- lantai dasar: pintu (di teras) + jendela ruang tamu ----
  const xP = tcx + pin * (tw / 2 - .75);
  pintu(xP, zf, { y: tt, wall: wl, c: cPintu, slot: s === 2 ? 1 : 0, kusen, boven: s % 2 ? 'roster' : true });
  const wx0 = tR ? xl : tx1, wx1 = tR ? tx0 : xr, wcx = (wx0 + wx1) / 2, ww = wx1 - wx0;   // bidang muka di luar teras
  const nWin = ww > 3.4 ? 2 : 1, jw = nWin === 2 ? Math.min(s === 3 ? .88 : 1.1, ww / 2 - .55) : Math.min(s === 3 ? .9 : 1.3, ww - .8);
  const winX = k => wcx + (nWin === 2 ? (k ? 1 : -1) * ww * .24 : 0), kAC = nWin === 2 ? (tR ? 0 : 1) : 0;   // AC di bawah jendela atas terjauh dari teras
  for (let k = 0; k < nWin; k++){ const x = winX(k);
    jendela(x, 1.0, zf, { w: jw, h: 1.45, wall: wl, kusen, topi: s === 0 || s === 2, daun: s === 3 ? c : false, daunSlot: 1, teralis: s === 1 && !kota }); }
  // jendela kecil kedua di teras (antara pintu & kolom luar) bila bidang muka hanya muat 1 jendela (seed carport) → 'pintu + 2 jendela';
  // meteran listrik pindah ke bawahnya. Bila tidak ada ruang, meteran tetap di samping pintu.
  { const eO = xP - pin * .65, pI = tR ? tx1 - .25 : tx0 + .25, av = Math.abs(pI - eO), xw2 = (eO + pI) / 2;
    if (nWin === 1 && av >= .6){ jendelaKecil(xw2, 1.3, zf, { w: Math.min(.45, av - .2), h: .62, wall: wl, kusen, palang: false, ambang: false });
      meteranListrik(tcx - pin * (tw / 2 - .4), .5, zf, {}); }
    else meteranListrik(tcx - pin * (tw / 2 - .4), 1.35, zf, {}); }
  // ---- lantai 2: pintu kaca dobel ke balkon + jendela + AC ----
  pintu(tcx - pin * .1, zf, { y: H1 + .17, w: 1.4, h: 2.15, daun: 2, c: '#3A3F44', kaca: true, kusen, wall: wl });
  for (let k = 0; k < nWin; k++){ const x = winX(k);
    jendela(x, H1 + .95, zf, { w: jw, h: 1.4, wall: wl, kusen, daun: s === 3 ? c : false, daunSlot: 1, palangH: s === 1 }); }
  { const n0 = P.length; ac(winX(kAC), H1 + .14, zf, {}); lampuDinding(tcx - pin * (tw / 2 - .45), 2.35, zf, {}); for (let k = n0; k < P.length; k++) P[k].lod = 1; }   // detail kecil → lod 1
  if (s % 2 === 0 && !kota) jemuran(tcx, zf + td * .5, { y: H1 + .15, w: tw - .5, h: 1.25, n: 3, warna: s });
  // detail khas: roster (lubang angin) di atas jendela bawah, kotak surat di dekat pintu, keset di teras
  for (let k = 0; k < nWin; k++) taruh(rangka(winX(k), 2.72, zf, 0), 'box', Math.min(.9, jw * .7), .22, .06, 0, .11, 0, '#4E4740', { attach: 'z+', slot: 0 });
  taruh(rangka(xP - pin * .95, .95, zf, 0), 'box', .32, .26, .14, 0, .13, .06, darken(c, .9), { attach: 'z+', slot: 0, lod: 1 });
  taruh(rangka(xP, tt, zf + .38, 0), 'box', .7, .02, .42, 0, .01, 0, '#8C6A48', { slot: 0, lod: 1, noEdge: true });
  // ---- samping: jendela sisi bebas (kiri tampak dari jalan) ----
  if (!aL || cp === 'l') jendela(xl, H1 + .95, zb + bd * .4, { rot: -Math.PI / 2, w: .9, h: 1.3, wall: wl, kusen });
  // ---- atap ----
  const ovD = .55, ovS = .45, oL = aL && cp !== 'l' ? 0 : ovS, oR = aR && cp !== 'r' ? 0 : ovS;
  let r, yTop, ta;
  if (deret || s === 0 || s === 1){ const sud = 42; ta = Math.tan(sud * D2R); const t = .12, ca = Math.cos(sud * D2R);
    r = atapPelana(bw, bd, cx, H, zc, { arah: 'x', gaya: 'dinding', sudut: sud, ovD, ovL: oL, ovR: oR, c: gt, cWall: wl, lisplang: true });
    yTop = u => H + .02 + t / ca + u * ta; }
  else if (s === 2){ r = atapPelana(bw, bd, cx, H, zc, { arah: 'z', gaya: 'dinding', sudut: 38, overhang: .45, ovL: .5, ovR: .45, c: gt, cWall: wl }); }
  else { const sud = 35, ov = .5; ta = Math.tan(sud * D2R); r = atapLimasan(bw, bd, cx, H, zc, { sudut: sud, overhang: ov, c: gt, cWall: wl }); yTop = u => H + (ov + u) * ta; }
  if (s === 1 || s === 3) rumah2_dormer(cx + (tR ? -1 : 1) * bw * .18, zf, .55, yTop, ta, 1.5, .95, gt, wl, kusen);
  const hT = r.yTepi !== undefined && s !== 3 ? r.yTepi - .05 : H - .05;
  talang(tR ? xl + .14 : xr - .14, 0, hT, { z: zf });
  talang(tR ? xr - .12 : xl + .12, H1 + .15, hT - H1 - .15, { z: zf });
  // ---- toren air: menara besi di carport (seed genap) / rangka di atas genteng belakang (ganjil) ----
  if (cp){ const xT = cp === 'r' ? (xr + xcR) / 2 : (xcL + xl) / 2, zT = zb + .55, hT2 = H + .3;
    for (const a of [-1, 1]) for (const b of [-1, 1]) box(.07, hT2, .07, xT + a * .38, 0, zT + b * .38, '#5E666C');
    box(.9, .08, .9, xT, hT2, zT, '#5E666C'); for (const yy of [2.2, 4.4]) box(.82, .05, .05, xT, yy, zT + .38, '#5E666C');
    tandon(xT, hT2 + .08, zT, { c: (iw + s) % 2 ? 'biru' : '#D9762B', kaki: 0 }); }
  else tandon(cx - (tR ? -1 : 1) * bw * .22, r.yPuncak - 1.05, zb + .55, { c: (iw + s) % 2 ? 'biru' : '#D9762B', kaki: .55 });
  // ---- carport: 4 tiang besi + atap seng/polikarbonat miring ke jalan, mobil (KOTA) atau motor ----
  if (cp){ const x0 = cp === 'r' ? xr + .02 : xcL, x1 = cp === 'r' ? xcR : xl - .02, ccx = (x0 + x1) / 2, cw = x1 - x0, z0 = zb + 1.2, z1 = LD / 2 - .35, cd = z1 - z0, ccz = (z0 + z1) / 2;
    carport(ccx, ccz, cw, cd, { h: 2.75, miring: 4, c: s === 0 ? '#9FB3B8' : '#8E979C' });
    box(cw, .09, cd + .4, ccx, 0, ccz - .2, '#BFB6A8');   // lantai carport (beton)
    if (kota && s === 0){ const g = rangka(ccx, .09, ccz - .1, 0), cc = ['#C9D3DC', '#E5E1D8', '#3E5A82', '#B4443A'][iw % 4];
      taruh(g, 'box', 1.7, .62, 3.9, 0, .55, 0, cc, { slot: 0 }); taruh(g, 'box', 1.5, .55, 2.0, 0, 1.13, -.25, cc, { slot: 0 });
      taruh(g, 'box', 1.44, .42, .05, 0, 1.13, .76, KACA[0], { glow: true, rx: -.5 }); taruh(g, 'box', 1.52, .36, 1.6, 0, 1.12, -.25, '#6A7F95', { slot: 0, lod: 1, noEdge: true });
      for (const a of [-1, 1]) for (const b of [-1, 1]) taruh(g, 'cylLo', .62, .2, .62, a * .78, .31, b * 1.25, '#1E1C1A', { rx: Math.PI / 2, ry: Math.PI / 2, noEdge: true, slot: 0 });
      for (const a of [-1, 1]) taruh(g, 'box', .3, .12, .04, a * .6, .7, 1.96, '#E6E2D8', { slot: 0, lod: 1 }); }
    else rumah2_motor(ccx, .09, ccz + .3, .15, ['#B4443A', '#3E5A82', '#2E3A40', '#C9D3DC'][iw % 4]); }
  // ---- halaman depan: pagar + gerbang, jalan setapak, pot, pohon / jemuran ----
  const zP = LD / 2 - .17, fx0 = aL ? -LW / 2 : -LW / 2 + .05, fx1 = aR ? LW / 2 : LW / 2 - .05;
  const gaya = kota ? 'besi' : desa ? 'kayu' : 'tembok';
  const gx = cp ? (cp === 'r' ? (xr + xcR) / 2 : (xcL + xl) / 2) : clamp(xP, fx0 + 1.0, fx1 - 1.0), gW = cp ? 2.4 : 1.25;
  pagarHalaman(fx1 - fx0, zP, { x0: (fx0 + fx1) / 2, gaya, h: kota ? 1.0 : .85, gx, gW, adj: A, c: gaya === 'tembok' ? campur(wl, '#C9BBA0', .55) : undefined, cGerbang: s === 1 ? darken(c, .7) : BESI, gerbangBesi: gaya !== 'kayu' });
  if (gaya !== 'kayu'){ const gp = clamp(gx + (gx < 0 ? 1 : -1) * (gW / 2 + .15), fx0 + .15, fx1 - .15), gh = (kota ? 1.0 : .85) + .5;
    box(.16, .06, .16, gp, gh, zP, '#3A3D40'); taruh(rangka(gp, gh + .06, zP, 0), 'box', .2, .26, .2, 0, .13, 0, LAMPU, { glow: true, noEdge: true }); }
  if (!cp){ const z0 = zf + td + .35, z1 = zP - .1; if (z1 - z0 > .1) box(1.2, .09, z1 - z0, clamp(xP, fx0 + .7, fx1 - .7), 0, (z0 + z1) / 2, '#C9BFA6'); }
  pot(tR ? tx0 - .45 : tx1 + .45, zf + .45, .9, { bunga: s % 2 ? '#C9503C' : null, kotak: s === 2 });
  if (kota && !cp) pohonKecil(tR ? Math.max(xl + .7, -LW / 2 + .8) : Math.min(xr - .7, LW / 2 - .8), zf + 1.1, .8, { jenis: 'bulat' });
  else if (!kota && !cp) pohonKecil(tR ? Math.max(xl + .6, -LW / 2 + .8) : Math.min(xr - .6, LW / 2 - .8), zf + .55, .7, { jenis: 'pisang' });   // jangkauan daun ,94·s
  teks(String(21 + iw * 2 + s), tR ? tx0 - .02 : tx1 + .02, 2.2, zf, { tinggi: .16, c: darken(wl, .45), dz: .012 });
};
