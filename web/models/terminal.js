/* terminal (4×2, CBD) — spek-tata-kota (tipe BARU; batas segitiga ≈ stadion 3.600). Terminal angkot kota:
   - gedung ruang tunggu 1 lantai usaha (4,2) di belakang: loket berkaca + pintu kaca ganda + papan 'TERMINAL' + jam dinding + AC + talang + lampu
   - peron beratap panjang di muka gedung (emperan seng berkolom) + bangku tunggu
   - pulau peron di tengah halaman (lantai naik + kanopi pelana/kupu-kupu) + bangku + papan jurusan
   - jalur angkot beraspal + marka putih/kuning + 5 angkot diam (primitif) di dalam kavling
   - gapura masuk 'TERMINAL' + pos jaga, tembok rendah + pot, tiang lampu PJU, blok toilet/musala, parkir ojek, tong sampah.
   Varian seed: 0 gedung tengah atap dak + menara jam · 1 gedung kiri atap limasan genteng · 2 gedung kanan atap pelana seng
                3 gedung tengah atap dak bertingkat + kanopi pulau kupu-kupu. Warna angkot & jurusan berbeda per seed.
   Tapak diputar (muka sempit 16 m, dalam 32 m): gedung lebih sempit, 2 pulau peron. Semua bagian di dalam kavling, muka (+z) ke jalan. */
CAT.terminal.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3;
  const LW = fx + .8, LD = fz + .8, R0 = rangka(0, 0, 0, 0), ia = Math.max(0, AKSEN.indexOf(c));
  const bx = (sx, sy, sz, x, y, z, col, o) => taruh(R0, 'box', sx, sy, sz, x, y + sy / 2, z, col, Object.assign({ slot: 0 }, o));
  // angkot diam (≈ 100 segitiga): badan bawah + kabin + pita kaca (menyala malam) + strip putih + atap rak + 4 roda + bemper + lampu; panjang searah x lokal (rot)
  const ANGKOT = [['#3C6FA8', '#3F8A5E', '#C2913A', '#B4443A', '#3F7D92'], ['#3F8A5E', '#C2913A', '#3C6FA8', '#6F5E8C', '#B4443A'], ['#C2913A', '#3C6FA8', '#B4443A', '#3F8A5E', '#C9A86A'], ['#B4443A', '#3F7D92', '#3F8A5E', '#C2913A', '#3C6FA8']][s];
  const angkot = (x, z, rot, col, k) => { const f = rangka(x, 0, z, rot), L = 4.0;
    taruh(f, 'box', L, .85, 1.66, 0, .3 + .425, 0, col, { slot: 0 });
    taruh(f, 'box', L - .6, .78, 1.6, -.3, 1.15 + .39, 0, col, { slot: 0 });
    taruh(f, 'box', L - .7, .42, 1.64, -.3, 1.2 + .3, 0, KACA[0], { glow: true });
    taruh(f, 'box', L + .02, .1, 1.68, 0, .95, 0, '#E6E2D8', { slot: 0, noEdge: true });
    taruh(f, 'box', .5, .42, 1.5, L / 2 - .25, 1.15 + .21, 0, KACA[1], { glow: true, rx: 0 });
    taruh(f, 'box', 2.2, .12, 1.3, -.5, 1.93 + .06, 0, BESI, { slot: 0, lod: 1 });
    for (const a of [-1, 1]) for (const b of [-1, 1]) taruh(f, 'box', .56, .56, .14, a * 1.25, .28, b * .78, '#1E1C1A', { slot: 0, noEdge: true });
    taruh(f, 'box', .08, .2, 1.6, L / 2 + .02, .45, 0, '#9C9A92', { slot: 0, lod: 1 });
    _teks(f, ['01', '05', '12', '07', '03'][(k + s) % 5], 0, 1.62, .83, .8, .3, '#EDE8DC'); };
  const bangkuP = (x, z, rot, w, y) => bangku(x, z, { rot, w: w || 1.6, c: '#8E979C', y: y || 0 });
  const pjuP = (x, z, rot) => { const f = rangka(x, 0, z, rot);
    taruh(f, 'box', .14, 6.0, .14, 0, 3.0, 0, '#5E666C', { slot: 0 }); taruh(f, 'box', .08, .08, 1.3, 0, 5.95, .6, '#5E666C', { slot: 0 });
    taruh(f, 'box', .34, .1, .5, 0, 5.88, 1.15, LAMPU, { glow: true }); };
  const potP = (x, z) => { bx(.6, .45, .6, x, 0, z, '#9C9A92', {}); const d = sphLo(.34, x, .75, z, '#5F7A3F', .3); d.lod = 1; d.noEdge = true; };
  const motorP = (x, z, rot, col) => { const f = rangka(x, 0, z, rot);
    for (const zz of [-.62, .62]) taruh(f, 'box', .09, .48, .48, 0, .26, zz, '#1E1C1A', { slot: 0 });                // roda
    taruh(f, 'box', .3, .34, .72, 0, .62, -.3, col, { slot: 0 });                                                   // bodi belakang
    taruh(f, 'box', .29, .1, .66, 0, .84, -.28, '#2B2B2B', { slot: 0 });                                             // jok
    taruh(f, 'box', .36, .72, .12, 0, .68, .36, col, { slot: 0, rx: -.28 });                                         // tameng kaki (miring)
    taruh(f, 'box', .22, .2, .16, 0, 1.0, .5, darken(col, .8), { slot: 0 });                                         // kepala lampu
    taruh(f, 'box', .64, .05, .05, 0, 1.12, .44, BESI, { slot: 0 }); };

  const sempit = LW < 24;
  // ---------- gedung ruang tunggu ----------
  const BW = sempit ? LW - 3.2 : 17.6, BD = 4.6, H = LANTAI_USAHA, cw = wl;
  const bxC = sempit ? 0 : [0, -LW / 2 + 1.2 + BW / 2, LW / 2 - 1.2 - BW / 2, 0][s];
  const zb = -LD / 2 + .9, zf = zb + BD, zc = (zb + zf) / 2;
  dinding(BW, H, BD, bxC, 0, zc, cw, { plinth: .45, cPlinth: '#8E8A84', lis: [3.05] });
  // muka: 2 loket (jendela + papan LOKET) | pintu kaca ganda | jendela ruang tunggu; posisi relatif dari lebar gedung
  const xL = bxC - BW / 2, u = BW / 6;
  for (const k of [0, 1]){ const x = xL + u * (k + .55);
    jendela(x, 1.0, zf, { w: 1.3, h: 1.1, wall: cw, kusen: BINGKAI, ambang: true, palangH: false, teralis: false });
    bx(1.2, .3, .08, x, 2.45, zf + .02, AKSEN[(ia + 2) % 10], { attach: 'z+', noHull: true });
    teks('LOKET ' + (k + 1), x, 2.5, zf + .07, { tinggi: .2, lebarMaks: 1.1, c: '#EDE8DC', dz: .012 }); }
  pintu(bxC, zf, { w: 1.8, h: 2.4, daun: 2, kaca: true, c: '#3A3F44', kusen: BINGKAI, wall: cw, boven: true });
  for (const k of [0, 1]) jendela(bxC + u * (1.3 + k * 1.2), 1.0, zf, { w: 1.2, h: 1.5, wall: cw, kusen: KUSEN, palang: true });
  papanNama(bxC, 3.25, zf, { w: Math.min(7.2, BW - 2), h: .78, c, slot: 1, teks: 'TERMINAL', cTeks: '#EDE8DC' });
  // jam dinding bulat-persegi di atas pintu (dekat) + AC + talang + lampu dinding
  bx(.5, .5, .1, bxC + Math.min(3.6, BW / 2 - 1) + .6, 3.35, zf + .03, '#E6E2D8', { attach: 'z+' });
  bx(.04, .2, .02, bxC + Math.min(3.6, BW / 2 - 1) + .6, 3.6, zf + .09, BESI, { lod: 1 });
  for (const x of [xL + u * 1.6, bxC + u * 2.5]) ac(x, 2.05, zf, {});
  for (const sx of [-1, 1]) talang(bxC + sx * (BW / 2 - .05), 0, H - .1, { z: zf - .3, rot: sx * Math.PI / 2 });
  // atap gedung per seed
  if (s === 1) atapLimasan(BW, BD, bxC, H, zc, { sudut: 24, overhang: .5, c: gt, cWall: cw });
  else if (s === 2){ atapPelana(BW, BD, bxC, H, zc, { arah: 'x', sudut: 18, overhang: .45, c: '#7E8A93', slot: 0, cWall: cw }); }
  else { atapDatar(BW, BD, bxC, H, zc, { parapet: .7, cParapet: cw, slotParapet: 2, c: '#B8B2A6' });
    tandon(bxC - BW / 2 + 1.4, H + .12, zb + 1.2, { c: s ? 'biru' : '#D9762B', kaki: .6 });
    if (s === 0){ // menara jam kecil di atap tengah
      bx(1.8, 2.4, 1.8, bxC, H, zc - .4, cw, { wall: true, slot: 2 }); bx(2.1, .14, 2.1, bxC, H + 2.4, zc - .4, darken(cw, .8), {});
      bx(1.0, 1.0, .08, bxC, H + 1.05, zc - .4 + .92, '#E6E2D8', { attach: 'z-' }); bx(.05, .38, .02, bxC, H + 1.5, zc - .4 + .97, BESI, { lod: 1 });
      taruh(R0, 'pyr', 2.0, .8, 2.0, bxC, H + 2.54 + .4, zc - .4, gt, { slot: 3 }); }
    else { bx(BW * .4, 1.0, BD * .55, bxC - BW * .15, H + .12, zc - .5, darken(cw, .95), { wall: true, slot: 0 });   // ruang mesin/kantor atas
      jendelaKecil(bxC - BW * .15 - 1.2, H + .4, zc - .5 + BD * .275, { w: .9, h: .5, wall: cw, gelap: true });
      jendelaKecil(bxC - BW * .15 + 1.2, H + .4, zc - .5 + BD * .275, { w: .9, h: .5, wall: cw, gelap: true }); } }
  // ---------- peron muka gedung: emperan seng berkolom + lantai naik + bangku ----------
  const PD = 2.4, nk = Math.max(3, Math.round(BW / 4.2) + 1), kolX = [...Array(nk)].map((_, k) => -BW / 2 + .3 + (BW - .6) * k / (nk - 1));
  emperan(bxC, zf, { w: BW, d: PD, y: 3.0, miring: 8, c: '#7E8A93', kolomX: kolX, cKolom: '#D9D4C8', cLantai: '#BFB6A8', tinggiLantai: .22 });
  for (const sx of [-1, 1]) bangkuP(bxC + sx * u * 1.9, zf + 1.1, 0, 1.6, .22);
  potP(bxC - BW / 2 + .5, zf + PD - .45); potP(bxC + BW / 2 - .5, zf + PD - .45);
  // ---------- halaman: aspal + marka + pulau peron + angkot ----------
  const zy0 = zf + PD + .05, zy1 = LD / 2 - .5, yd = zy1 - zy0;
  bx(LW - 1.0, .03, yd, 0, .06, (zy0 + zy1) / 2, '#6E6A66', { noHull: true, noEdge: true });
  const nP = sempit && yd > 16 ? 2 : 1, laneW = (yd - nP * 2.0) / (nP + 1);
  const PW = sempit ? LW - 4.6 : LW * .55, pxC = sempit ? -.6 : [0, 3.5, -3.5, 0][s];
  for (let pi = 0; pi < nP; pi++){
    const pz = zy0 + laneW * (pi + 1) + 2.0 * pi + 1.0;
    bx(PW, .25, 2.0, pxC, .06, pz, '#C9C1B2', { ao: .9 }); bx(PW + .1, .06, 2.1, pxC, .31, pz, '#D9C56A', { noEdge: true, noHull: true });   // tepi kuning
    const nK = Math.max(2, Math.round(PW / 4.5) + 1), xs = [...Array(nK)].map((_, k) => pxC - PW / 2 + .5 + (PW - 1) * k / (nK - 1));
    for (const x of xs) bx(.16, 2.75, .16, x, .31, pz, '#5E666C', {});
    if (s === 3){ // kanopi kupu-kupu (V): dua bidang miring ke dalam
      for (const sd of [-1, 1]) taruh(R0, 'box', PW + .4, .07, 1.6, pxC, 3.2, pz + sd * .75, '#8E979C', { rx: sd * -10 * D2R }); }
    else { const kc = s === 1 ? '#4F7A55' : s === 2 ? '#9C4935' : '#7E8A93';
      taruh(R0, 'prism', PW + .4, .55, 2.9, pxC, 3.06 + .275, pz, kc, {});
      bx(PW + .4, .22, 2.9, pxC, 2.84, pz, '#D9D4C8', { attach: 'y+' }); }
    for (let k = 0; k < Math.min(3, nK - 1); k++) bangkuP((xs[k] + xs[k + 1]) / 2, pz - .2, 0, 1.8, .31);
    // papan jurusan menggantung + tong sampah
    const JUR = [['KOTA', 'PASAR'], ['STASIUN', 'KAMPUS'], ['ALUN ALUN', 'DESA'], ['TERMINAL B', 'PELABUHAN']][(s + pi) % 4];
    for (let k = 0; k < 2; k++){ const x = pxC + (k ? 1 : -1) * PW * .25; bx(2.0, .42, .08, x, 2.3, pz + .05, k ? '#3F6B62' : '#4C6A96', { noHull: true });
      teks(JUR[k], x, 2.4, pz + .09, { tinggi: .24, lebarMaks: 1.8, c: '#EDE8DC', dz: .012 }); }
    cylLo(.22, .7, pxC + PW / 2 - .35, .31, pz + .55, '#4F7A55');
    // angkot di jalur depan & belakang pulau (sejajar x)
    const za = pz - 1.0 - laneW / 2, zb2 = pz + 1.0 + laneW / 2, nA = sempit ? 1 : 3;
    for (let k = 0; k < nA; k++){ const x = pxC + (nA === 1 ? -PW * .18 : -PW / 2 + 2.3 + k * 4.6); if (Math.abs(x) + 2.3 < LW / 2 - .4) angkot(x, za, 0, ANGKOT[k], k); }
    if (pi === nP - 1){ const x2 = pxC + (sempit ? PW * .15 : PW * .12); angkot(x2, zb2 - .1, sempit ? 0 : Math.PI, ANGKOT[3], 3); if (!sempit) angkot(x2 - 5.0, zb2 - .1, Math.PI, ANGKOT[4], 4); }
    // marka garis putih tepi jalur
    bx(PW, .01, .12, pxC, .09, za - 1.2, '#E8E6DF', { noEdge: true, noHull: true });
  }
  // ---------- gapura masuk 'TERMINAL' + pos jaga + tembok rendah, PJU ----------
  const gx = sempit ? 0 : [-6, -8, 8, 6][s], gw = 7.2, gz = LD / 2 - .45, gh = 4.6;
  for (const sx of [-1, 1]){ bx(.6, gh, .6, gx + sx * gw / 2, 0, gz, '#D9D4C8', { wall: true }); bx(.8, .2, .8, gx + sx * gw / 2, gh, gz, darken(cw, .8), {}); }
  bx(gw + .4, .9, .4, gx, gh - 1.1, gz, c, { slot: 1 });
  teks('TERMINAL', gx, gh - 1.0, gz + .2, { tinggi: .55, lebarMaks: gw - 1, c: '#EDE8DC', dz: .012 });
  if (!sempit){ const px = gx + (gx < 0 ? -1 : 1) * (gw / 2 + 1.5);   // pos jaga: kotak + jendela + atap dak tipis
    bx(1.8, 2.5, 1.6, px, 0, gz - .8, '#E6E2D8', { wall: true });
    jendelaKecil(px, 1.1, gz, { w: 1.2, h: .8, wall: '#E6E2D8', gelap: true });
    bx(2.2, .14, 2.0, px, 2.5, gz - .85, c, { slot: 1 });
    // tembok rendah depan di sisi yang tidak ada gapura/pos + pot
    const tx0 = gx < 0 ? gx + gw / 2 + .4 : -LW / 2 + .4, tx1 = gx < 0 ? LW / 2 - .4 : gx - gw / 2 - .4;
    bx(tx1 - tx0, .6, .25, (tx0 + tx1) / 2, 0, gz + .1, '#C9BBA0', { wall: true }); bx(tx1 - tx0, .08, .33, (tx0 + tx1) / 2, .6, gz + .1, darken('#C9BBA0', .86), { noEdge: true });
    for (const t of [.3, .7]) potP(tx0 + (tx1 - tx0) * t, gz - .25);
    // blok toilet/musala di sisi gedung yang kosong
    const sideX = bxC === 0 ? -(LW / 2 - 2.6) : (bxC < 0 ? LW / 2 - 2.8 : -(LW / 2 - 2.8)), tw = 4.0;
    if (Math.abs(sideX) - tw / 2 > Math.abs(bxC) + BW / 2 + .3 || bxC !== 0){
      bx(tw, 3.0, 3.2, sideX, 0, zb + 1.6, '#DDD0B4', { wall: true });
      pintu(sideX - .8, zb + 3.2, { w: .8, h: 2.0, c: '#4F6D5A', wall: '#DDD0B4', panel: true });
      jendelaKecil(sideX + .9, 1.6, zb + 3.2, { w: .8, h: .5, wall: '#DDD0B4', nako: true });
      bx(tw + .3, .14, 3.5, sideX, 3.0, zb + 1.6, '#9C9A92', {});
      teks(s % 2 ? 'MUSALA' : 'TOILET', sideX, 2.35, zb + 3.2, { tinggi: .3, lebarMaks: 2.4, c: '#3A3430', dz: .012 }); }
    // parkir ojek (3 motor miring) di sisi lain
    const mX = bxC === 0 ? LW / 2 - 2.4 : (bxC < 0 ? LW / 2 - 6.5 : -(LW / 2 - 6.5));
    for (let k = 0; k < 3; k++) motorP(mX + (k - 1) * .9, zb + 1.4, .45, ['#B4443A', '#3E5A82', '#2E3A40'][(k + s) % 3]);
  }
  for (const [x, z] of sempit ? [[LW / 2 - .5, LD / 2 - 3.0], [-LW / 2 + .5, 0]] : [[-LW / 2 + .5, LD / 2 - 2.6], [LW / 2 - .5, LD / 2 - 2.6], [LW / 2 - .5, zf + 3.5]])
    pjuP(x, z, x < 0 ? Math.PI / 2 : -Math.PI / 2);
};
