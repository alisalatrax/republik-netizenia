/* pasar (2×2) — spek-gaya §6 no. 16. Pasar rakyat: bangunan utama 'PASAR' di belakang (los kios berderet, rolling door) + 4 los terbuka
   beratap seng di 4 tiang (2×2) dengan 12 lapak (meja kayu + tumpukan buah/sayur/ikan/kain) + 6 payung lapak pudar + motor + 2 tong.
   Varian seed: 0 gedung 2 lantai atap dak + parapet + toren · los limas
                1 hall tinggi 1 lantai, atap pelana seng + atap angin (monitor) · los pelana
                2 gedung 2 lantai atap limasan genteng · los limas
                3 hall 1 lantai bergevel muka bertangga ('PASAR' di gevel), atap seng landai · los pelana
   Semua bagian di dalam kavling (|x| ≤ LW/2, |z| ≤ LD/2); muka (+z) menghadap jalan. Bukan tipe deret (adj diabaikan). */
CAT.pasar.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3;
  const LW = fx + .8, LD = fz + .8, R0 = rangka(0, 0, 0, 0), ia = Math.max(0, AKSEN.indexOf(c));
  const bx = (sx, sy, sz, x, y, z, col, o) => taruh(R0, 'box', sx, sy, sz, x, y + sy / 2, z, col, Object.assign({ slot: 0 }, o));
  // motor parkir hemat (≈ 60 segitiga): 2 roda pipih + badan + jok + setang; menghadap +z lokal
  const motorP = (x, z, rot, col) => { const f = rangka(x, 0, z, rot);
    for (const zz of [-.62, .62]) taruh(f, 'box', .09, .48, .48, 0, .26, zz, '#1E1C1A', { slot: 0 });                // roda
    taruh(f, 'box', .3, .34, .72, 0, .62, -.3, col, { slot: 0 });                                                   // bodi belakang
    taruh(f, 'box', .29, .1, .66, 0, .84, -.28, '#2B2B2B', { slot: 0 });                                             // jok
    taruh(f, 'box', .36, .72, .12, 0, .68, .36, col, { slot: 0, rx: -.28 });                                         // tameng kaki (miring)
    taruh(f, 'box', .22, .2, .16, 0, 1.0, .5, darken(col, .8), { slot: 0 });                                         // kepala lampu
    taruh(f, 'box', .64, .05, .05, 0, 1.12, .44, BESI, { slot: 0 }); };
  const dua = s === 0 || s === 2, H = dua ? LANTAI_USAHA + LANTAI : 5.2;
  // ---------- bangunan utama (belakang) ----------
  const XM = Math.min(6.8, LW / 2 - 1.1), bw = XM * 2, zb = -LD / 2 + .75, zf = zb + 5.0, zc = (zb + zf) / 2, dep = zf - zb;
  const cw = wl;
  dinding(bw, H, dep, 0, 0, zc, cw, { plinth: .5, cPlinth: '#8E8A84', lis: dua ? [LANTAI_USAHA - .06] : [3.9] });
  // lantai dasar: pintu masuk tengah (rolling door hampir terbuka, lorong gelap) + 4 kios (2 terbuka berisi, 2 tertutup)
  rollingDoor(0, zf, { w: 2.6, h: 3.0, buka: .85, isi: false, wall: cw, c: '#8E979C' });
  const kx = [-XM + 1.6, XM - 1.6], buka = [s % 2 ? 0 : .8, s % 2 ? .8 : 0];
  kx.forEach((x, k) => { rollingDoor(x, zf, { w: 1.75, h: 2.6, buka: buka[k], isi: false, wall: cw, c: k % 2 ? '#8A939A' : '#7E8A93', jarakGaris: .85 });
    if (buka[k]){ bx(1.5, .9, .4, x, 0, zf + .2, '#7A5A3A', {});                                              // meja kios + dagangan
      for (let q = 0; q < 2; q++) bx(.62, .34, .3, x - .36 + q * .72, .9, zf + .2, BARANG[(k * 3 + q + s) % BARANG.length], { lod: 1, noEdge: true });
      } });
  // papan nama besar di atas pintu masuk (+ teks), papan kecil per kios ditiadakan (anggaran); lampu dinding di kiri-kanan pintu
  const yP = dua ? 3.35 : 3.75;
  papanNama(0, yP, zf, { w: 5.2, h: .78, c, slot: 1, teks: s === 3 ? 'SEMBAKO' : 'PASAR', cTeks: '#EDE8DC' });
  for (const sx of [-1, 1]){ const kanopi = rangka(sx * 2.05, 0, zf, 0); taruh(kanopi, 'box', .08, .3, .2, 0, 2.95, .08, BESI, { attach: 'z+' });   // lampu dinding hemat
    taruh(kanopi, 'box', .2, .2, .2, 0, 2.7, .14, LAMPU, { glow: true, lod: 1 }); }
  // kolom pengapit pintu masuk
  for (const sx of [-1, 1]) bx(.32, 3.2, .2, sx * 1.62, 0, zf + .07, darken(cw, .9), { wall: true });
  for (const sx of [-1, 1]) talang(sx * (XM - .05), 0, H - .1, { z: zf - .3, rot: sx * Math.PI / 2 });
  if (dua){
    // lantai 2: 5 jendela nako + 2 AC + kanopi beton tipis di atas kios (luifel) + spanduk promosi
    const yf = LANTAI_USAHA;
    for (let k = 0; k < 4; k++){ const x = -XM + 1.3 + (bw - 2.6) * k / 3; if (s === 2 && (k === 1 || k === 2)) continue;
      jendelaKecil(x, yf + .9, zf, { w: 1.2, h: 1.3, wall: cw, nako: k % 2 === 0, kusen: s ? KUSEN : '#7A5A3A' }); }
    if (s === 2) spanduk(0, yf + .75, zf, { w: 2.6, h: .9, c: '#E6E2D8', teks: 'LOS DAGING', cTeks: '#9C4935' });
    for (const x of [-XM + 2.45, XM - 2.45]) ac(x, yf + .25, zf, {});
    bx(bw - .4, .1, .6, 0, 3.05, zf + .27, darken(cw, .88), { attach: 'z-' });   // luifel (lis topi) di atas kios
    if (s === 0){
      atapDatar(bw, dep, 0, H, zc, { parapet: .8, cParapet: cw, slotParapet: 2, c: '#B8B2A6' });
      tandon(-XM + 1.6, H + .12, zb + 1.3, { c: 'biru', kaki: .7 });
    } else atapLimasan(bw, dep, 0, H, zc, { sudut: 24, overhang: .45, c: gt, cWall: cw });
  } else if (s === 1){
    // hall tinggi: jendela atas (clerestory) + roster ventilasi, atap pelana seng + atap angin (monitor) di bubungan
    for (let k = 0; k < 4; k++){ const x = -XM + 1.7 + (bw - 3.4) * k / 3; if (Math.abs(x) < 1.5) continue; jendelaKecil(x, 4.15, zf, { w: 1.3, h: .7, wall: cw, gelap: true }); }
    for (let k = 0; k < 2; k++) bx(1.2, .5, .06, -XM + 1.7 + (bw - 3.4) * (k * 3) / 3, 4.25, zf + .02, '#4E4740', { attach: 'z+', noEdge: true });
    const r = atapPelana(bw, dep, 0, H, zc, { arah: 'x', sudut: 20, overhang: .45, c: '#7E8A93', slot: 0, cWall: cw });
    atapPelana(bw * .55, dep * .32, 0, r.yPuncak - .35, zc, { arah: 'x', sudut: 20, overhang: .35, c: '#6E7F8A', slot: 0, pita: false });
    bx(bw * .55, .45, dep * .3, 0, r.yPuncak - .75, zc, '#4E4740', { noEdge: true });   // celah ventilasi gelap di bawah atap angin
  } else {
    // gevel muka bertangga (pasar Inpres): dinding muka naik di atas atap + papan 'PASAR' + lis; atap seng landai di belakangnya
    const g1 = 1.2, g2 = .9;
    bx(bw, g1, .3, 0, H, zf - .15, cw, { wall: true, slot: 2 });
    bx(5.6, g2, .3, 0, H + g1, zf - .15, cw, { wall: true, slot: 2 });
    bx(bw + .12, .12, .42, 0, H + g1, zf - .15, darken(cw, .8), { noEdge: true });
    bx(5.72, .12, .42, 0, H + g1 + g2, zf - .15, darken(cw, .8), { noEdge: true });
    teks('PASAR', 0, H + g1 + .12, zf, { tinggi: .62, lebarMaks: 4.6, c: AKSEN[(ia + 7) % 10], dz: .02 });
    for (let k = 0; k < 4; k++){ const x = -XM + 1.7 + (bw - 3.4) * k / 3; if (Math.abs(x) < 1.5) continue; jendelaKecil(x, 4.2, zf, { w: 1.1, h: .6, wall: cw, gelap: true, nako: true }); }
    atapPelana(bw, dep - .3, 0, H, zc - .15, { arah: 'x', sudut: 12, overhang: .4, ovD: .4, c: '#8E979C', slot: 0, cWall: cw, pita: false });
  }
  // ---------- 4 los terbuka (2×2) beratap seng ----------
  const LS = 3.8, ov = .25, xL = Math.min(3.5, LW / 2 - LS / 2 - ov - .3), z1 = zf + .55 + LS / 2 + ov, z2 = z1 + LS + 2 * ov + .35;
  const SENGL = ['#6E7F8A', '#7E8A93', '#6E7F8A', '#8C6A55'][s], tiangH = 2.55, hipH = (LS / 2 + ov) * Math.tan(22 * D2R);
  const JENIS = ['BUAH', 'SAYUR', 'IKAN', 'KAIN'];
  const ISI = { BUAH: ['#D9762B', '#D9B441', '#7FA850', '#B5473A'], SAYUR: ['#5F8F4E', '#7FA850', '#B5473A', '#D9762B'], IKAN: ['#AEB6BA', '#9CA6AC', '#3E6FB0', '#AEB6BA'], KAIN: ['#B5473A', '#4C6A96', '#C2913A', '#6F5E8C'] };
  let li = 0;
  for (const zl of [z1, z2]) for (const sx of [-1, 1]){
    const x = sx * xL, J = JENIS[(li + s) % 4], col = ISI[J]; li++;
    bx(LS - .2, .18, LS - .2, x, 0, zl, '#BFB6A8', { ao: .85 });                                // lantai los (beton)
    for (const a of [-1, 1]) for (const b of [-1, 1]) bx(.14, tiangH, .14, x + a * (LS / 2 - .2), .18, zl + b * (LS / 2 - .2), '#5E666C', {});
    if (s % 2 === 0){ const H0 = hipGeo(LS + 2 * ov, LS + 2 * ov, hipH);
      taruh(R0, 'custom', LS + 2 * ov, hipH, LS + 2 * ov, x, .18 + tiangH + hipH / 2, zl, SENGL, { geo: H0.geo, edges: H0.edges }); }
    else { taruh(R0, 'prism', LS + 2 * ov, hipH, LS + 2 * ov, x, .18 + tiangH + hipH / 2, zl, SENGL, { ry: Math.PI / 2 });
      bx(LS + 2 * ov, .1, .18, x, .18 + tiangH + hipH - .06, zl, darken(SENGL, .8), { ry: Math.PI / 2 }); }
    // 3 lapak per los: meja kayu + 3 tumpukan dagangan (limas) + keranjang/baskom
    const lap = [[-.85, .75, 1.5], [.85, .75, 1.5], [0, -.95, 2.6]];
    lap.forEach(([dx, dz, w], k) => { const mx = x + dx, mz = zl + dz;
      bx(w, .62, .75, mx, .18, mz, '#8C6A48', {});
      if (J === 'KAIN'){ for (let q = 0; q < 3; q++) bx(w / 3 - .1, .12 + (q % 2) * .08, .55, mx - w / 3 + q * w / 3, .8, mz, col[(q + k) % 4], { noEdge: true, lod: q === 1 ? 1 : 0 }); }
      else for (let q = 0; q < 2; q++) taruh(R0, 'pyr', w / 2 - .1, .3, .55, mx - w / 4 + q * w / 2, .8 + .15, mz, col[(q + k + s) % 4], { noEdge: true, lod: 1 });
      if (k === 0 && zl === z2) bx(.4, .3, .4, mx + (dx < 0 ? -1 : 1) * (w / 2 - .3), .18, mz + .55, J === 'IKAN' ? '#3E6FB0' : '#B8945F', { lod: 1, noEdge: true });   // keranjang/baskom di lantai
    });
    // lampu gantung (menyala malam) + papan jenis los di sisi muka (los depan saja)
    if (zl === z2){ taruh(R0, 'box', .18, .14, .18, x, .18 + tiangH - .25, zl, LAMPU, { glow: true, lod: 1 }); bx(1.6, .42, .08, x, .18 + tiangH - .62, zl + LS / 2 - .2, AKSEN[(ia + li * 3) % 10], { noHull: true });
      teks(J, x, .18 + tiangH - .55, zl + LS / 2 - .2 + .04, { tinggi: .28, lebarMaks: 1.4, c: '#EDE8DC', dz: .012 }); }
  }
  // ---------- 6 payung lapak pudar: 2 di lorong tengah, 4 di sisi luar ----------
  const PAY = ['#C9A86A', '#B5473A', '#4C6A96', '#4F7A55', '#C2913A', '#E6E2D8'].map(v => campur(v, '#E6E2D8', .28));
  const xs = LW / 2 - 1.0, pos = [[0, z1], [0, z2], [-xs, z1], [xs, z1], [-xs, z2], [xs, z2]];
  pos.forEach(([px, pz], k) => { const r = k < 2 ? .85 : .8;
    bx(.05, 2.05, .05, px, 0, pz, '#5E5A55', {});
    taruh(R0, 'pyr', r * 2, .45, r * 2, px, 2.05 + .225, pz, PAY[(k + s) % 6], {});
    if (k >= 2) bx(1.1, .6, .6, px, 0, pz + .1, '#7A5A3A', { lod: 1 });                              // meja/peti lapak
    if (k >= 2 && k < 4) taruh(R0, 'pyr', .9, .26, .45, px, .6 + .13, pz, ISI.BUAH[(k + s) % 4], { noEdge: true, lod: 1 });
  });
  // ---------- motor parkir, 2 tong, selokan depan ----------
  motorP(s % 2 ? -1.4 : 1.4, LD / 2 - .85, Math.PI / 2 + (s % 2 ? .35 : -.35), ['#B4443A', '#3E5A82', '#2E3A40', '#4F7A55'][s]);
  cylLo(.27, .78, -LW / 2 + .45, 0, zf + .4, '#3E6FB0'); cylLo(.27, .78, LW / 2 - .45, 0, zf + .4, '#4F7A55');
  bx(LW - .4, .02, .3, 0, .06, LD / 2 - .2, '#6F6A60', { noEdge: true, noHull: true });
};
