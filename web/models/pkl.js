/* pkl (2×1) — spek-gaya §6 no. 29. Zona pedagang kaki lima: 4 gerobak dorong (badan kayu 1,5×,9×,7 + etalase kaca + 2 roda + atap seng
   miring 12° 'YXZ' + tulisan dagangan) menghadap jalan, tenda terpal 6×2,6 di atas meja + bangku + kursi plastik / tikar lesehan, spanduk di 2 tiang,
   lampu tiang (menyala malam), tong sampah, pelat paving + selokan.
   Tata letak mengikuti tapak: muka lebar (16 m) → 4 gerobak sebaris; muka sempit (8 m, diputar 90°) → 2 baris × 2.
   Varian seed: urutan & jenis gerobak (BAKSO/SATE/ES/MARTABAK/SIOMAY/NASGOR), warna & letak terpal, meja-kursi vs tikar lesehan, teks spanduk.
   Semua bagian di dalam kavling; tanpa badan bangunan (grup lapang). */
CAT.pkl.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3;
  const LW = fx + .8, LD = fz + .8, R0 = rangka(0, 0, 0, 0), ia = Math.max(0, AKSEN.indexOf(c));
  const bx = (sx, sy, sz, x, y, z, col, o) => taruh(R0, 'box', sx, sy, sz, x, y + sy / 2, z, col, Object.assign({ slot: 0 }, o));
  const JEN = ['BAKSO', 'SATE', 'ES', 'MARTABAK', 'SIOMAY', 'NASGOR'];
  const CB = ['#E6E2D8', '#C9A86A', '#8C6A48', '#DDD0B4', '#8FA0AA', '#C9A4A0'];
  // gerobak dorong (≈ 170 segitiga): badan + lis bawah + etalase kaca + atap seng 12° (YXZ) + 2 tiang + 2 roda + kaki + pegangan + isi khas + teks
  const gerobakP = (x, z, j, k) => { const f = rangka(x, 0, z, 0), cb = CB[(j + k + s) % 6], nama = JEN[j];
    taruh(f, 'box', 1.5, .78, .72, 0, .32 + .39, 0, cb, { slot: 0 });
    taruh(f, 'box', .9, .5, .5, -.18, 1.1 + .25, -.04, KACA[0], { glow: true });
    for (const sx of [-1, 1]) taruh(f, 'box', .05, 1.05, .05, sx * .7, 1.1 + .525, -.3, BESI, { slot: 0 });
    taruh(f, 'box', 1.75, .05, 1.02, 0, 2.18, 0, ['#8E979C', '#7E8A93', '#9C4935', '#4C6A96'][(k + s) % 4], { rx: 12 * D2R, slot: 0 });
    taruh(f, 'cylLo', .5, .07, .5, .45, .25, .4, '#1E1C1A', { rx: Math.PI / 2, slot: 0, noEdge: true });                       // roda muka (roda belakang tertutup badan)
    taruh(f, 'box', .08, .08, .86, .45, .25, 0, BESI, { slot: 0 });                                                            // as roda
    taruh(f, 'box', .45, .04, .6, -.95, .95, 0, '#8C6A48', { slot: 0, noEdge: true });                                          // pegangan dorong
    if (nama === 'BAKSO' || nama === 'SIOMAY') taruh(f, 'cylLo', .42, .34, .42, .45, 1.1 + .17, 0, '#AEB6BA', { slot: 0 });       // dandang
    else if (nama === 'SATE') { taruh(f, 'box', .9, .14, .26, .2, 1.1 + .07, .22, '#3A3430', { slot: 0 }); taruh(f, 'box', .8, .06, .2, .2, 1.18 + .03, .22, '#C9503C', { slot: 0, lod: 1, noEdge: true }); }
    else if (nama === 'ES') taruh(f, 'box', .5, .4, .45, .45, 1.1 + .2, 0, '#3E6FB0', { slot: 0 });                                  // kotak pendingin
    else { taruh(f, 'box', .42, .2, .42, .45, 1.1 + .1, 0, '#3A3430', { slot: 0 }); taruh(f, 'cylLo', .46, .06, .46, .45, 1.3 + .03, 0, '#5E5A55', { slot: 0, lod: 1 }); }   // kompor + wajan
    _teks(f, nama, -.0, .55, .375, 1.3, .3, AKSEN[(ia + j * 3) % 10]); };
  const kursi = (x, z, rot, col) => { const f = rangka(x, 0, z, rot);
    taruh(f, 'box', .4, .05, .4, 0, .44, 0, col, { slot: 0 });
    taruh(f, 'box', .4, .36, .05, 0, .65, -.19, col, { slot: 0, lod: 1, rx: -.15 });
    taruh(f, 'box', .3, .42, .3, 0, .21, .02, darken(col, .85), { slot: 0, lod: 1 }); };
  const KC = ['#B4443A', '#3E6FB0', '#4F8F5E', '#C2913A'];
  const lebar = LW >= 12, cols = lebar ? 4 : 2, rows = 4 / cols;
  // pelat paving sedikit lebih tinggi + selokan depan + garis petak lapak
  bx(LW - .5, .1, LD - .5, 0, 0, 0, '#C6B898', { noHull: true, ao: .9 });
  bx(LW - .6, .02, .3, 0, .1, LD / 2 - .45, '#6F6A60', { noEdge: true, noHull: true });
  // ---- gerobak: muka lebar → 4 sebaris rapat di depan; muka sempit → 2 di depan + 2 di belakang tenda ----
  const order = [[0, 1, 2, 3], [4, 2, 5, 1], [3, 0, 4, 2], [5, 1, 0, 3]][s];
  const gz0 = LD / 2 - 1.3, gxC = [-.6, .4, .8, -.2][s], sp = lebar ? 3.0 : 3.4;
  const rowZ = lebar ? [gz0] : [gz0, gz0 - 7.3];
  let k = 0;
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++){
    const x = (lebar ? gxC : .25) + sp * (q - (cols - 1) / 2) + (r % 2 ? .3 : 0);
    gerobakP(x, rowZ[r], order[k], k); k++; }
  // ---- tenda terpal lebar 6×2,6 di 4 tiang, miring ke depan (YXZ) + meja/bangku/kursi atau tikar lesehan ----
  const TER = ['#3C6FA8', '#3C6FA8', '#4F7A55', '#C2913A'][s];
  const tw = Math.min(6.0, LW - 1.4), td = 2.6, tA = 8 * D2R, ty = 2.5;
  const tz = lebar ? -LD / 2 + .5 + td / 2 : gz0 - 3.65, tx = lebar ? [-2, 0, 2, -1][s] : 0;
  for (const a of [-1, 1]) for (const b of [-1, 1]) bx(.07, ty - b * td / 2 * Math.tan(tA) - .02, .07, tx + a * (tw / 2 - .1), 0, tz + b * (td / 2 - .1), '#8C8A84', {});
  taruh(R0, 'box', tw + .2, .05, (td + .2) / Math.cos(tA), tx, ty, tz, TER, { rx: tA });
  bx(tw + .2, .25, .04, tx, ty - (td / 2 + .1) * Math.tan(tA) - .25, tz + td / 2 + .1, TER, { noHull: true });   // rumbai depan
  for (const sx of [-1, 1]){ const mx = tx + sx * tw / 4;
    if (s % 2 === 0){
      bx(2.0, .05, .7, mx, .72, tz + .2, '#E6E2D8', {}); bx(1.8, .7, .5, mx, 0, tz + .2, '#7A5A3A', { lod: 1 });   // meja panjang
      bangku(mx, tz - .55, { w: 1.9, c: '#8C6A48', sandaran: false });
      kursi(mx + .5 * sx, tz + .85, Math.PI, KC[(ia + sx + 1) % 4]);
    } else {
      bx(2.4, .03, 1.9, mx, .1, tz, sx < 0 ? '#C9503C' : '#4C6A96', { noEdge: true, noHull: true });           // tikar lesehan
      bx(1.2, .3, .6, mx, .1, tz, '#7A5A3A', {});                                                                // meja pendek
      for (let q = 0; q < 2; q++) bx(.2, .1, .2, mx - .3 + q * .6, .4, tz, '#E6E2D8', { lod: 1, noEdge: true });   // piring/gelas
    } }
  // ---- spanduk di 2 tiang (sisi lain dari tenda), lampu tiang, tong sampah, krat ----
  const SP = ['KULINER', 'PUJASERA', 'JAJANAN', 'MAKAN'][s];
  const spx = lebar ? (tx > 0 ? -5.4 : 5.4) : 0, spz = -LD / 2 + .6;
  spanduk(spx, 1.6, spz, { w: 3.6, h: .75, c: '#E6E2D8', teks: SP, cTeks: '#B5473A', tiang: true });
  const lx = lebar ? (tx > 0 ? LW / 2 - .5 : -LW / 2 + .5) : LW / 2 - .45, lz = lebar ? -LD / 2 + 1.2 : tz - 1.7;
  bx(.1, 3.2, .1, lx, 0, lz, '#3A3D40', {}); bx(.08, .08, .7, lx, 3.1, lz + .3, '#3A3D40', {});
  taruh(R0, 'box', .26, .12, .26, lx, 3.0, lz + .55, LAMPU, { glow: true });
  const ox = lebar ? (spx > 0 ? LW / 2 - .5 : -LW / 2 + .5) : -LW / 2 + .5;
  cylLo(.25, .75, ox, 0, lebar ? -LD / 2 + 2.2 : -LD / 2 + 2.0, ['#4F7A55', '#3E6FB0', '#C2913A', '#4F7A55'][s]);
  bx(.5, .45, .4, lebar ? spx + (spx > 0 ? -2.4 : 2.4) : LW / 2 - .6, 0, lebar ? -LD / 2 + .5 : -LD / 2 + 2.0, '#3E6FB0', { lod: 1 });   // kotak es / krat
};
