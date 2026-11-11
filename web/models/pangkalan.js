/* pangkalan (2×1) — spek-tata-kota (tipe BARU; batas segitiga ≈ pkl 1.000). Pangkalan ojek & angkot pinggir jalan:
   gubuk/halte kecil beratap seng (lantai semen naik, 4 tiang, dinding papan setengah di belakang, bangku panjang, helm), papan 'PANGKALAN',
   motor-motor parkir miring ±30° menghadap jalan, rak bensin eceran (botol kuning), papan tarif, angkot ngetem, pohon peneduh, tong.
   Varian seed: 0 OJEK — gubuk kayu atap seng miring, 5 motor, rak bensin, pohon mangga
                1 ANGKOT — halte besi atap seng, angkot ngetem + 3 motor, papan trayek
                2 OJEK + warung kopi — gubuk + meja kopi + termos + 4 motor + pohon pisang
                3 ANGKOT + OJEK — papan PANGKALAN berdiri di 2 tiang, angkot + 4 motor + rak bensin
   Tapak diputar (muka 8 m, dalam 16 m): gubuk di belakang, motor 2 baris, angkot sejajar muka. Semua bagian di dalam kavling. */
CAT.pangkalan.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3;
  const LW = fx + .8, LD = fz + .8, R0 = rangka(0, 0, 0, 0), ia = Math.max(0, AKSEN.indexOf(c));
  const bx = (sx, sy, sz, x, y, z, col, o) => taruh(R0, 'box', sx, sy, sz, x, y + sy / 2, z, col, Object.assign({ slot: 0 }, o));
  const motorP = (x, z, rot, col, helm) => { const f = rangka(x, 0, z, rot);
    for (const zz of [-.62, .62]) taruh(f, 'box', .09, .48, .48, 0, .26, zz, '#1E1C1A', { slot: 0 });                // roda
    taruh(f, 'box', .3, .34, .72, 0, .62, -.3, col, { slot: 0 });                                                   // bodi belakang
    taruh(f, 'box', .29, .1, .66, 0, .84, -.28, '#2B2B2B', { slot: 0 });                                             // jok
    taruh(f, 'box', .36, .72, .12, 0, .68, .36, col, { slot: 0, rx: -.28 });                                         // tameng kaki (miring)
    taruh(f, 'box', .22, .2, .16, 0, 1.0, .5, darken(col, .8), { slot: 0 });                                         // kepala lampu
    taruh(f, 'box', .64, .05, .05, 0, 1.12, .44, BESI, { slot: 0 });
    if (helm) taruh(f, 'box', .26, .2, .28, 0, .99, -.3, helm, { slot: 0, lod: 1 }); };
  const angkot = (x, z, rot, col) => { const f = rangka(x, 0, z, rot), L = 4.0;
    taruh(f, 'box', L, .85, 1.66, 0, .3 + .425, 0, col, { slot: 0 });
    taruh(f, 'box', L - .6, .78, 1.6, -.3, 1.15 + .39, 0, col, { slot: 0 });
    taruh(f, 'box', L - .7, .42, 1.64, -.3, 1.2 + .3, 0, KACA[0], { glow: true });
    taruh(f, 'box', L + .02, .1, 1.68, 0, .95, 0, '#E6E2D8', { slot: 0, noEdge: true });
    taruh(f, 'box', .5, .42, 1.5, L / 2 - .25, 1.15 + .21, 0, KACA[1], { glow: true });
    for (const a of [-1, 1]) for (const b of [-1, 1]) taruh(f, 'box', .56, .56, .14, a * 1.25, .28, b * .78, '#1E1C1A', { slot: 0, noEdge: true });
    _teks(f, ['05', '12', '07', '03'][s], 0, 1.62, .83, .8, .3, '#EDE8DC'); };
  const MC = ['#B4443A', '#3E5A82', '#2E3A40', '#4F7A55', '#C9C1B2', '#2B2B2B'];
  const HELM = ['#4F7A55', '#C2913A', '#E6E2D8', '#B4443A'];
  const lebar = LW >= 12, ojek = s !== 1, adaAngkot = s === 1 || s === 3;
  // pelat semen + garis parkir + selokan depan
  bx(LW - .5, .08, LD - .5, 0, 0, 0, '#C9C1B2', { noHull: true, ao: .9 });
  bx(LW - .6, .02, .3, 0, .08, LD / 2 - .45, '#6F6A60', { noEdge: true, noHull: true });
  // ---------- gubuk / halte ----------
  const gw = 4.2, gd = 2.6, ga = 12 * D2R, gh = 2.75;
  const gx = lebar ? (s % 2 ? LW / 2 - .5 - gw / 2 : -LW / 2 + .5 + gw / 2) : 0, gz = lebar ? -LD / 2 + .5 + gd / 2 : -LD / 2 + .5 + gd / 2;
  bx(gw, .22, gd, gx, .08, gz, '#BFB6A8', { ao: .85 });
  const tiangC = s === 1 ? '#5E666C' : '#7A5A3A';
  for (const a of [-1, 1]) for (const b of [-1, 1]) bx(.12, gh - (b > 0 ? gd * Math.tan(ga) : 0) - .3 + (b > 0 ? .25 : 0), .12, gx + a * (gw / 2 - .12), .3, gz + b * (gd / 2 - .12), tiangC, {});
  taruh(R0, 'box', gw + .4, .06, (gd + .3) / Math.cos(ga), gx, gh - .02 + .05, gz + .05, ['#8E979C', '#8E979C', '#7E5A44', '#6E7F8A'][s], { rx: ga });
  bx(gw - .2, 1.15, .06, gx, .3, gz - gd / 2 + .12, s === 1 ? '#8FA0AA' : '#8C6A48', {});                                   // dinding papan belakang
  if (s !== 1) for (let k = 0; k < 3; k++) bx(.03, 1.1, .02, gx - gw / 2 + .9 + k * .9, .32, gz - gd / 2 + .16, darken('#8C6A48', .75), { noEdge: true, lod: 1 });
  bangku(gx, gz - .5, { w: gw - .8, y: .3, c: '#7A5A3A', sandaran: false });
  bx(.28, .22, .3, gx - .7, .83, gz - .5, HELM[s], { lod: 1 }); bx(.28, .22, .3, gx + .5, .83, gz - .5, HELM[(s + 2) % 4], { lod: 1 });
  // papan PANGKALAN di tepi depan atap (s0–2) atau di 2 tiang sendiri (s3)
  const nama = ojek ? 'PANGKALAN OJEK' : 'PANGKALAN', yA = gh - (gd / 2 + .15) * Math.tan(ga) + .05;
  if (s !== 3){ bx(gw - .2, .5, .08, gx, yA, gz + gd / 2 + .12, c, { slot: 1, noHull: true });
    teks(nama, gx, yA + .12, gz + gd / 2 + .16, { tinggi: .26, lebarMaks: gw - .5, c: '#EDE8DC', dz: .012 }); }
  else { const px = lebar ? gx - gw / 2 - 1.6 : LW / 2 - 1.5, pz = lebar ? gz + .6 : gz + gd / 2 + 1.2;
    for (const sx of [-1, 1]) bx(.1, 2.9, .1, px + sx * 1.1, 0, pz, '#5E666C', {});
    bx(2.5, .8, .1, px, 2.1, pz, c, { slot: 1, noHull: true });
    teks('PANGKALAN', px, 2.35, pz + .05, { tinggi: .32, lebarMaks: 2.2, c: '#EDE8DC', dz: .012 });
    bx(2.0, .35, .08, px, 1.6, pz, '#E6E2D8', { noHull: true }); teks('OJEK ANGKOT', px, 1.66, pz + .04, { tinggi: .2, lebarMaks: 1.8, c: '#3A3430', dz: .012 }); }
  // papan tarif kecil di tiang depan gubuk
  bx(.6, .45, .04, gx + gw / 2 - .12, 1.3, gz + gd / 2 - .04, '#E6E2D8', { noHull: true, lod: 1 });
  // ---------- motor parkir miring (±30°) menghadap jalan ----------
  const nM = [4, 3, 4, 4][s], mrot = (s % 2 ? -1 : 1) * .5;
  const mz = LD / 2 - 1.35, mx0 = lebar ? (s % 2 ? -LW / 2 + 1.2 : gx + gw / 2 + 1.0) : -LW / 2 + 1.1;
  for (let k = 0; k < nM; k++){ const row = lebar ? 0 : (k >= 4 ? 1 : 0), kk = lebar ? k : k % 4;
    motorP(mx0 + kk * (lebar ? 1.45 : 1.75), mz - row * 2.1 - (lebar ? 0 : 0), mrot, MC[(k + s * 2) % 6], k % 2 ? HELM[(k + s) % 4] : null); }
  // ---------- angkot ngetem ----------
  if (adaAngkot){ const ax = lebar ? (s === 1 ? 0 : -1.8) : 0, az = lebar ? (s === 1 ? LD / 2 - 1.45 : -LD / 2 + 1.6) : (s === 1 ? 2.2 : 0);
    angkot(ax, az, 0, s === 1 ? '#3C6FA8' : '#3F8A5E'); }
  // ---------- rak bensin eceran (s0, s3) / meja kopi (s2) ----------
  if (s === 0 || s === 3){ const rx = lebar ? gx + (s ? -1 : 1) * (gw / 2 + .6) : -LW / 2 + .7, rz = gz + (lebar ? -.4 : gd / 2 + .8);
    bx(.9, 1.05, .4, rx, 0, rz, '#8C6A48', {});
    for (const y of [.5, .9]) bx(.76, .3, .16, rx, y, rz + .1, '#D9B441', { lod: 1 });                                // botol bensin (deret)
    bx(.8, .26, .05, rx, 1.3, rz + .1, '#E6E2D8', { noHull: true }); teks('BENSIN', rx, 1.34, rz + .13, { tinggi: .16, lebarMaks: .7, c: '#B5473A', dz: .01 }); }
  if (s === 2){ const tx = gx + gw / 2 + .9, tz = gz;
    bx(1.0, .72, .6, tx, 0, tz, '#7A5A3A', {}); bx(.18, .38, .18, tx - .25, .72, tz, '#B5473A', { lod: 1 }); for (let k = 0; k < 2; k++) bx(.12, .14, .12, tx + .1 + k * .2, .72, tz, '#E6E2D8', { lod: 1, noEdge: true }); }
  // ---------- peneduh & tong ----------
  if (s === 0){ pohonKecil(lebar ? LW / 2 - 1.5 : LW / 2 - 1.2, lebar ? -LD / 2 + 1.5 : -LD / 2 + 4.2, lebar ? 1.3 : 1.0, { jenis: 'bulat' });
    if (lebar) bangku(LW / 2 - 3.3, -LD / 2 + 1.0, { w: 1.8, c: '#8C6A48' }); }   // bangku di bawah pohon
  if (s === 2) pohonKecil(lebar ? LW / 2 - 1.2 : LW / 2 - 1.0, lebar ? -LD / 2 + 1.3 : -LD / 2 + 4.0, 1.0, { jenis: 'pisang' });
  cylLo(.25, .72, lebar ? (gx < 0 ? -LW / 2 + .45 : LW / 2 - .45) : LW / 2 - .45, 0, gz + gd / 2 + .5, '#4F7A55');
};
