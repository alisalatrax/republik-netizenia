/* polisi (2×1) — spek-gaya §6 no. 14 + spek-tata-kota setback gedung (depan 2,4 · samping 1,2; belakang ,75 agar badan 2 lantai muat).
   Kantor Polsek Indonesia 2 lantai (spek §6; floorsFor = 1 tidak dipakai untuk tinggi): lantai dasar LANTAI_USAHA 4,2 + lantai atas 3,2.
     badan 13,6×4,85 dinding krem #D8CBB2, plint & pita lantai biru tua #2B3A67, lis, 5 jendela per lantai (bawah: 4 + pintu),
     pintu kaca dobel + boven di bawah portiko beton berkolom dengan papan 'POLSEK' biru tua di tepinya + nomor telepon '110',
     atap limasan hipGeo abu #5E6670 (seed 2: atap datar parapet biru + menara antena radio).
     halaman: pos jaga beratap limasan (jendela + 'POS'), mobil patroli putih-biru dengan lampu rotator, tiang bendera 7 m, pagar besi
     + gerbang lebar dengan 2 lampu bola di pilar, pot, talang, AC, lampu dinding.
   Varian seed: bit 0 = cermin (pos jaga kanan/kiri, mobil di sisi lain) · 0 limasan + portiko datar · 1 limasan + teralis jendela
     bawah + kanopi pintu samping · 2 atap datar parapet + menara radio + jendela berluifel · 3 limasan + risalit tengah menjorok
     beratap pelana menghadap jalan (gevel + roster) + balkon tembok.
   Model parametrik pada LW×LD (uji NZ_FACING=1 tanpa tukar w/h: 8×16). Semua bagian di dalam kavling; muka +z menghadap jalan. */
function polisi_lod(n0){ for (let k = n0; k < P.length; k++) P[k].lod = 1; }
// mobil patroli: sedan putih, pintu biru tua, lampu rotator merah-biru; panjang di sumbu x lokal
function polisi_mobil(x, z, rot){ const f = rangka(x, 0, z, rot);
  taruh(f, 'box', 4.2, .62, 1.74, 0, .62, 0, '#E8E6DF', { slot: 0 });
  taruh(f, 'box', 2.1, .5, 1.56, -.25, 1.18, 0, '#55687A', { slot: 0 });
  taruh(f, 'box', 1.9, .07, 1.5, -.3, 1.46, 0, '#E8E6DF', { slot: 0 });
  taruh(f, 'box', 1.9, .3, 1.76, -.1, .78, 0, '#2B3A67', { slot: 0, noEdge: true });
  const n0 = P.length;
  for (const a of [-1.35, 1.35]) for (const b of [-.78, .78]) taruh(f, 'box', .62, .62, .24, a, .31, b, '#1E1C1A', { slot: 0, noEdge: true });
  taruh(f, 'box', .3, .14, .5, -.3, 1.57, -.3, '#B5473A', { glow: true, c2: '#E07060' });
  taruh(f, 'box', .3, .14, .5, -.3, 1.57, .3, '#3E6FB0', { glow: true, c2: '#7FA6D8' });
  _teks(f.sub(-.1, 0, .885, 0), 'POLISI', 0, .7, 0, 1.6, .18, '#EDE8DC'); polisi_lod(n0); }
// pos jaga 1,5×1,5: bilik + pita kaca + pintu samping + atap limasan kecil + papan 'POS'
function polisi_pos(x, z, rot, cW, cB){ const f = rangka(x, 0, z, rot), w = 1.5, h = 2.5;
  taruh(f, 'box', w, h, w, 0, h / 2, 0, cW, { slot: 0, wall: true });
  taruh(f, 'box', w + .06, .5, w + .06, 0, .25, 0, cB, { slot: 0 });
  taruh(f, 'box', 1.2, .75, .06, 0, 1.5, w / 2, KACA[0], { glow: true, attach: 'z+' });
  taruh(f, 'box', 1.32, .08, .14, 0, 1.08, w / 2 + .04, darken(cW, .8), { slot: 0, attach: 'z+' });
  taruh(f, 'box', .75, 1.95, .06, 0, .975, -w / 2, '#5E6670', { slot: 0, attach: 'z-' });
  taruh(f, 'box', .9, .26, .05, 0, 2.2, w / 2 + .01, cB, { slot: 0, attach: 'z+' });
  _teks(f, 'POS', 0, 2.12, w / 2 + .045, .7, .16, '#EDE8DC');
  atapLimasan(w, w, x, h, z, { sudut: 30, overhang: .3, c: '#5E6670', cWall: cW, rot }); }
CAT.polisi.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, mir = s & 1 ? -1 : 1, X = x => mir * x;
  const LW = fx + .8, LD = fz + .8, H = LANTAI_USAHA + LANTAI;
  const cW = '#D8CBB2', NAVY = '#2B3A67', cAtap = '#5E6670', cKus = '#EDE8DC';
  const ov = .6, x1 = LW / 2 - 1.2, bw = 2 * x1, zb = -LD / 2 + ov + .15, zf = LD / 2 - 2.4, bd = zf - zb, zc = (zb + zf) / 2;
  // ---- badan ----
  dinding(bw, H, bd, 0, 0, zc, cW, { plinth: .9, cPlinth: NAVY, lis: [LANTAI_USAHA - .06], cLis: darken(cW, .8), slot: 0 });
  taruh(rangka(0, 0, zc, 0), 'box', bw + .1, .45, bd + .1, 0, LANTAI_USAHA + .05 + .225, 0, NAVY, { slot: 0, noEdge: true });   // pita biru tua lantai
  // ---- risalit tengah (seed 3) ----
  const rw = Math.min(3.6, bw * .34), rj = .7;
  if (s === 3){ dinding(rw, H, rj + .3, 0, 0, zf + rj / 2 - .15, cW, { plinth: .9, cPlinth: NAVY, slot: 0 });
    taruh(rangka(0, 0, zf + rj / 2 - .15, 0), 'box', rw + .1, .45, rj + .4, 0, LANTAI_USAHA + .275, 0, NAVY, { slot: 0, noEdge: true }); }
  const zr = s === 3 ? zf + rj : zf;   // bidang muka bagian tengah
  // ---- jendela ----
  const nU = Math.max(2, Math.round(bw / 2.7)), nB = Math.max(2, nU - 1);
  const ux = [...Array(nU)].map((_, k) => -bw / 2 + bw * (k + .5) / nU);
  for (const x of ux){ const tengah = Math.abs(x) < rw / 2;
    if (s === 3 && tengah){ balkon(x, LANTAI_USAHA + .05, zr, { w: 2.2, jorok: .55, gaya: 'tembok', cTembok: cW, konsol: false });
      pintu(x, zr, { y: LANTAI_USAHA + .2, w: 1.0, h: 2.2, c: '#3A3F44', kaca: true, kusen: cKus, wall: cW }); continue; }
    jendela(x, LANTAI_USAHA + .95, tengah ? zr : zf, { w: 1.3, h: 1.5, wall: cW, kusen: cKus, palang: false, topi: s === 2, cTopi: cW, ambang: s !== 2 }); }
  // lantai dasar: pintu di tengah, jendela di kiri-kanan (berjarak dari reveal pintu)
  const bx = [...Array(nB + 1)].map((_, k) => -bw / 2 + bw * (k + .5) / (nB + 1)).filter(x => Math.abs(x) > 1.9);
  for (const x of bx) jendela(x, 1.15, zf, { w: 1.3, h: 1.6, wall: cW, kusen: cKus, palang: false, palangH: true, teralis: s === 1, ambang: true });
  pintu(0, zr, { w: 1.8, h: 2.4, y: .3, daun: 2, kaca: true, c: '#3A3F44', kusen: BINGKAI, wall: cW, boven: true });
  // ---- portiko pintu masuk: pelat beton + 2 kolom + papan POLSEK di tepi ----
  { const pd = Math.min(1.7, LD / 2 - .7 - zr), py = 3.15, pw = 3.6, f = rangka(0, 0, zr, 0);
    taruh(f, 'box', pw, .3, pd + .04, 0, py + .15, (pd - .04) / 2, '#E3DED2', { slot: 0 });
    for (const sx of [-1, 1]) taruh(f, 'box', .3, py, .3, sx * (pw / 2 - .25), py / 2, pd - .25, '#E3DED2', { slot: 0 });
    taruh(f, 'box', pw - .2, .3, pd, 0, .15, pd / 2, '#BFB6A8', { slot: 0 });
    taruh(f, 'box', 1.9, .15, .32, 0, .075, pd + .16, darken('#BFB6A8', .92), { slot: 0 });
    papanNama(0, py + .32, zr + pd - .02, { w: pw - .2, h: .62, c: NAVY, bingkai: '#C2913A', teks: 'POLSEK', cTeks: '#EDE8DC' });
    taruh(f, 'box', .06, .06, .3, 0, py - .05, pd - .15, BESI, { slot: 0 }); }
  // papan '110' + lampu dinding
  for (const sx of [-1, 1]) lampuDinding(sx * 1.55, 2.85, zr, {});
  teks('110', X(-bw / 2 + .9), LANTAI_USAHA - .55, zf, { tinggi: .28, c: NAVY, dz: .02 });
  // ---- samping & belakang ----
  for (const sx of [-1, 1]){ const rr = sx * Math.PI / 2;
    for (const y of [LANTAI_USAHA + .95]) jendelaKecil(sx * x1, y, zc + .2, { rot: rr, w: 1.0, h: 1.3, wall: cW, kusen: cKus, ambang: false });
    talang(sx * x1, 0, H - .1, { z: zf - .25, rot: rr });
    ac(sx * x1, LANTAI_USAHA + .3, zc - bd * .3, { rot: rr }); }
  { const g = rangka(X(-3), 0, zb, Math.PI);   // pintu servis belakang (reveal + daun)
    taruh(g, 'box', 1.25, 2.25, .06, 0, 1.125, 0, darken(cW, .7), { slot: 0, attach: 'z+' }); taruh(g, 'box', 1.0, 2.1, .08, 0, 1.05, .02, '#5E6670', { slot: 0, attach: 'z+' }); }
  // ---- atap ----
  if (s === 2){ atapDatar(bw, bd, 0, H, zc, { parapet: .8, c: '#B8B2A6', cParapet: NAVY, lis: true });
    const yA = H + .12; tandon(X(bw / 2 - 1.2), yA, zb + 1.0, { c: 'biru', r: .5, h: 1.1, kaki: 0 });
    { const f = rangka(X(-bw / 2 + 1.3), yA, zc, 0);   // menara antena radio (rangka segitiga ramping)
      for (const sx of [-1, 1]) taruh(f, 'box', .08, 6.0, .08, sx * .25, 3.0, 0, '#B5473A', { slot: 0 });
      for (let k = 1; k < 6; k += 2) taruh(f, 'box', .5, .05, .05, 0, k, 0, '#E6E2D8', { slot: 0 });
      taruh(f, 'box', .5, .5, .5, 0, .25, 0, '#8E8A84', { slot: 0 }); }
  }
  else { const r = atapLimasan(bw, bd, 0, H, zc, { sudut: 28, overhang: ov, c: cAtap, cWall: cW });
    if (s === 3) atapPelana(rw, rj + .3, 0, H, zf + rj / 2 - .15, { arah: 'z', gaya: 'dinding', sudut: 32, overhang: .35, ovR: 0, c: cAtap, cWall: cW, roster: true });
    antena(X(bw * .25), r.yPuncak - .1, zc, { h: 2.6 }); }
  // ---- halaman depan ----
  const zP = LD / 2 - .2, gW = 3.4, yard = zP - zf;
  pagarHalaman(LW - .3, zP, { gaya: 'besi', h: 1.0, gx: 0, gW, pilar: 3.2, jarakBesi: .4, cPilar: '#E3DED2', c: NAVY });
  for (const sx of [-1, 1]){ const lx = sx * (gW / 2 + .15); taruh(rangka(lx, 0, zP, 0), 'box', .16, .2, .16, 0, 1.6, 0, BESI, { slot: 0 });
    taruh(rangka(lx, 0, zP, 0), 'box', .3, .3, .3, 0, 1.85, 0, LAMPU, { glow: true, noEdge: true }); }
  const lebar = LW >= 12;
  if (lebar && yard >= 2.1){
    polisi_pos(X(bw / 2 - .9), zP - 1.05, 0, '#E3DED2', NAVY);
    polisi_mobil(X(-bw / 2 + 2.3), zf + 1.12, mir > 0 ? 0 : Math.PI);
    tiangBendera(X(3.4), zP - .75, 7.0, { rot: mir > 0 ? 0 : Math.PI }); }
  else { polisi_pos(X(LW / 2 - 1.15), zf + 1.2, 0, '#E3DED2', NAVY); tiangBendera(X(-LW / 2 + .8), zP - .5, 7.0, { rot: mir > 0 ? 0 : Math.PI });
    if (yard > 5) polisi_mobil(X(-1.0), zf + 2.6, Math.PI / 2); }
  { const n0 = P.length; pot(X(1.3), zr + .4, .95, { kotak: true, c: '#8E8A84', bunga: '#C9708A' }); polisi_lod(n0); }
};
