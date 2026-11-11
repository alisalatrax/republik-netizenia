/* kantor (2×2) — spek-gaya §6 no. 9 + spek-tata-kota setback gedung (depan 2,4–3,2 · samping 1,2 · belakang 1,0).
   Gedung kantor Indonesia 4–8 lantai (floors dari floorsFor: lantai dasar LANTAI_USAHA 4,2 + 3,2 per lantai atas).
     lantai dasar: lobby kaca (2 etalase lebar + pintu kaca dobel + boven), plint granit, kanopi drop-off beton 2 kolom bulat
       dengan nama gedung di tepinya, anak tangga, 2 pot; sisi: pita kaca + pintu servis belakang.
     menara (varian seed): 0 ribbon window (pita kaca melingkar + spandrel + mullion) · 1 kisi sirip beton tegak + lis tiap lantai
       (gaya kantor pemerintahan) · 2 dinding tirai kaca di tengah muka diapit pilon masif berjendela celah + pita kaca samping ·
       3 podium 2 lantai + menara mundur (teras atap podium berpagar & pot) dengan ribbon window.
     tiap lantai atas: AC luar di dinding samping (1 per sisi), lis; atap datar parapet 1,0 + ruang mesin lift 2,4×2,4×2,8 + 2 chiller
       + 2 toren + antena + papan nama atap berteks.
     halaman depan: jalan masuk aspal, pagar besi + gerbang lebar, pos satpam, mobil parkir, 3 motor, tiang bendera merah putih.
   Semua bagian di dalam kavling; muka +z menghadap jalan. Detail kecil lod 1 (anggaran +450 per lantai dipakai ± 150–250). */
function kantor_lod(n0){ for (let k = n0; k < P.length; k++) P[k].lod = 1; }
// mobil sedan (panjang di sumbu x lokal): badan + kabin kaca gelap + atap + 4 roda (lod 1)
function kantor_mobil(x, z, rot, c){ const f = rangka(x, 0, z, rot);
  taruh(f, 'box', 4.2, .62, 1.74, 0, .62, 0, c, { slot: 0 });
  taruh(f, 'box', 2.2, .52, 1.56, -.25, 1.19, 0, '#55687A', { slot: 0 });
  taruh(f, 'box', 1.9, .07, 1.5, -.3, 1.48, 0, c, { slot: 0, lod: 1 });
  const n0 = P.length; for (const a of [-1.35, 1.35]) for (const b of [-.78, .78]) taruh(f, 'cylLo', .64, .22, .64, a, .32, b, '#1E1C1A', { rx: Math.PI / 2, noEdge: true });
  taruh(f, 'box', .06, .14, 1.2, 2.1, .78, 0, '#E8E2C8', { slot: 0 }); kantor_lod(n0); }
// pos satpam: bilik 1,6×1,6 + jendela pita + pintu samping + atap dak menjorok + papan 'POS'
function kantor_posSatpam(x, z, rot){ const f = rangka(x, 0, z, rot);
  taruh(f, 'box', 1.6, 2.5, 1.6, 0, 1.25, 0, '#E3DED2', { slot: 0, wall: true });
  taruh(f, 'box', 1.66, .45, 1.66, 0, .225, 0, '#8E8A84', { slot: 0 });
  taruh(f, 'box', 1.25, .8, .06, 0, 1.55, .81, KACA[0], { glow: true, attach: 'z+' });
  taruh(f, 'box', 2.1, .16, 2.1, 0, 2.58, 0, '#CFC9BC', { slot: 0 });
  taruh(f, 'box', 1.1, .3, .05, 0, 2.2, .81, '#4C6A96', { slot: 0, attach: 'z+' });
  _teks(f, 'POS', 0, 2.08, .84, .9, .2, '#EDE8DC'); }
CAT.kantor.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, mir = s & 1 ? -1 : 1;
  const LW = fx + .8, LD = fz + .8, n = clamp(floors || 4, 2, 10), H = LANTAI_USAHA + (n - 1) * LANTAI;
  const iw = Math.max(0, WALLS.indexOf(wl)), ia = Math.max(0, AKSEN.indexOf(c));
  const x0 = -LW / 2 + 1.2, x1 = LW / 2 - 1.2, bw = x1 - x0, zb = -LD / 2 + 1.0, zf = LD / 2 - 3.2, bd = zf - zb, zc = (zf + zb) / 2;
  const yF = k => LANTAI_USAHA + (k - 1) * LANTAI;   // alas lantai ke-k (k = 1 lantai kedua)
  const MUL = '#5E666C', cGran = ['#8E8A84', '#7E8790', '#6F6A60', '#8E8A84'][s];
  // ---- menara: tapak & podium per seed ----
  const nPod = s === 3 ? Math.min(2, n - 1) : 1, yT = yF(nPod);
  const tx0 = s === 3 ? x0 + 1.3 : x0, tx1 = s === 3 ? x1 - 1.3 : x1, tzb = s === 3 ? zb + .4 : zb, tzf = s === 3 ? zf - 2.2 : zf;
  const tw = tx1 - tx0, td = tzf - tzb, tcx = (tx0 + tx1) / 2, tzc = (tzf + tzb) / 2, hT = H - yT;
  const cPod = s === 2 ? '#D8CBB2' : wl;
  // ---- podium (lantai dasar, + lantai 2 untuk seed 3) ----
  const lisPod = []; for (let k = 1; k < nPod; k++) lisPod.push(yF(k) - .06);
  dinding(bw, yT, bd, 0, 0, zc, cPod, { plinth: .55, cPlinth: cGran, lis: lisPod, slot: cPod === wl ? 2 : 0 });
  const fr = rangka(0, 0, zf, 0);
  // lobby: pintu kaca dobel di tengah + 2 etalase lebar (reveal tidak bertumpuk: celah ,1)
  pintu(0, zf, { w: 2.0, h: 2.6, y: .3, daun: 2, kaca: true, c: '#3A3F44', kusen: BINGKAI, wall: cPod, boven: true });
  for (const sx of [-1, 1]) etalase(sx * 3.45, zf, { w: 4.1, h: 2.85, y: .5, wall: cPod, ambang: cGran, bagi: 1.4, bingkai: BINGKAI });
  // pita kaca podium di sisi kiri/kanan & belakang (detail jendela), lis atas lantai dasar
  for (const sx of [-1, 1]) taruh(rangka(sx * bw / 2, 0, zc, sx * Math.PI / 2), 'box', bd - 2.2, 2.3, .1, 0, 1.0 + 1.15, 0, KACA[0], { glow: true });
  // revisi r1 (sisi tidak polos): mullion tegak + ambang granit + lis ambang atas pada pita kaca samping, 2 AC luar berak di atasnya (semua lod 1)
  for (const sx of [-1, 1]){ const fs = rangka(sx * bw / 2, 0, zc, sx * Math.PI / 2), L = bd - 2.2, n0 = P.length;
    _jeruji(rangka(sx * (bw / 2 + .06), 0, zc, sx * Math.PI / 2), L - .1, 2.3, 0, 1.0, 0, Math.round(L / 1.4) + 1, MUL, { satu: 1, rel: 0, batang: .07, lod: 1 });
    taruh(fs, 'box', L + .3, .14, .2, 0, .93, .06, cGran, { slot: 0, attach: 'z+', noEdge: true });
    taruh(fs, 'box', L + .3, .1, .14, 0, 3.36, .04, darken(cPod, .82), { slot: 0, attach: 'z+', noEdge: true });
    kantor_lod(n0); for (const t of [-.28, .22]) ac(sx * bw / 2, 3.47, zc + sx * t * L, { rot: sx * Math.PI / 2, rak: true, lod: 1 }); }
  pintu(mir > 0 ? x0 + 1.6 : x1 - 1.6, zb, { rot: Math.PI, w: 1.0, h: 2.2, c: '#5E666C', wall: cPod, panel: false });
  for (const sx of [0, -.25]) jendelaKecil(mir * sx * bw, 2.0, zb, { rot: Math.PI, w: 1.6, h: .9, wall: cPod, gelap: true });
  // ---- lantai 2 podium (seed 3): ribbon + teras atap podium ----
  for (let k = 1; k < nPod; k++){ const y = yF(k);
    taruh(rangka(0, 0, zc, 0), 'box', bw + .1, 1.7, bd + .1, 0, y + .9 + .85, 0, KACA[0], { glow: true });
    for (const [g, L] of [[rangka(0, 0, zf + .06, 0), bw], [rangka(x1 + .06, 0, zc, Math.PI / 2), bd], [rangka(x0 - .06, 0, zc, -Math.PI / 2), bd]])
      _jeruji(g, L - .2, 1.7, 0, y + .9, .0, Math.round(L / 1.7) + 1, MUL, { satu: 1, rel: 0, batang: .06, lod: 1 }); }
  // ---- menara ----
  if (s === 3){ atapDatar(bw, bd, 0, yT, zc, { parapet: 0, c: '#B8B2A6' });
    const yr = yT + .12;   // teras atap podium: pagar pita depan + pot + bangku
    taruh(rangka(0, yr, zf - .1, 0), 'box', bw - .1, 1.0, .12, 0, .5, 0, '#5E666C', { slot: 0, noHull: true });
    taruh(rangka(0, yr, zf - .1, 0), 'box', bw, .12, .2, 0, 1.06, 0, '#BFC3C6', { slot: 0 });
    const n0 = P.length; for (const px of [-.38, -.13, .13, .38]) pot(px * bw, zf - .8, 1.1, { y: yr, kotak: true, c: '#8E8A84' }); bangku(-mir * 2.5, zf - 1.4, { y: yr, w: 1.6 }); kantor_lod(n0); }
  if (tw > 0 && hT > 0){
    if (s !== 3) { /* tapak sama dengan podium: badan menara lanjut */ }
    dinding(tw, hT, td, tcx, yT, tzc, wl, { plinth: 0 });
    for (let k = nPod; k < n; k++){ const y = yF(k);
      if (s === 0 || s === 3){   // ribbon window: pita kaca melingkar (1 kotak) + mullion 4 muka
        taruh(rangka(tcx, 0, tzc, 0), 'box', tw + .1, 1.75, td + .1, 0, y + .85 + .875, 0, KACA[0], { glow: true });
        taruh(rangka(tcx, 0, tzc, 0), 'box', tw + .24, .1, td + .24, 0, y + .8, 0, darken(wl, .82), { slot: 0, noHull: true });
        for (const [g, L] of [[rangka(tcx, 0, tzf + .06, 0), tw], [rangka(tx1 + .06, 0, tzc, Math.PI / 2), td], [rangka(tx0 - .06, 0, tzc, -Math.PI / 2), td], [rangka(tcx, 0, tzb - .06, Math.PI), tw]])
          _jeruji(g, L - .2, 1.75, 0, y + .85, 0, Math.round(L / 1.6) + 1, MUL, { satu: 1, rel: 0, batang: .06, lod: 1 });
      } else if (s === 1){   // kisi: pita kaca 2,1 + lis lantai melingkar (sirip tegak dipasang sekali di bawah)
        taruh(rangka(tcx, 0, tzc, 0), 'box', tw + .1, 2.1, td + .1, 0, y + .72 + 1.05, 0, KACA[0], { glow: true });
        taruh(rangka(tcx, 0, tzc, 0), 'box', tw + .5, .16, td + .5, 0, y - .02, 0, darken(wl, .86), { slot: 0 });
      } else {   // s2: dinding tirai di tengah muka (sekali di bawah) + pilon berjendela celah + pita kaca samping & belakang
        const cw = tw * .46, pc = (cw / 2 + tw / 2) / 2;
        for (const sx of [-1, 1]) jendelaKecil(tcx + sx * pc, y + .75, tzf, { w: .8, h: 1.75, wall: wl, kusen: '#D9D4C8', palang: false });
        for (const sx of [-1, 1]) taruh(rangka(sx > 0 ? tx1 : tx0, 0, tzc, sx * Math.PI / 2), 'box', td - 1.4, 1.75, .1, 0, y + .85 + .875, 0, KACA[0], { glow: true });
        taruh(rangka(tcx, 0, tzb, Math.PI), 'box', tw - 1.4, 1.75, .1, 0, y + .85 + .875, 0, KACA[0], { glow: true });
        taruh(rangka(tcx, 0, tzf, 0), 'box', tw + .14, .14, .14, 0, y - .07, .04, darken(wl, .84), { slot: 0, noEdge: true });
      }
      // AC luar di dinding samping (spandrel), sisi kiri & kanan
      ac(tx0, y + .18, tzb + td * ((k + s) % 2 ? 2.5 : 1.5) / 5, { rot: -Math.PI / 2 }); ac(tx1, y + .18, tzb + td * ((k + s) % 2 ? .5 : 3.5) / 5, { rot: Math.PI / 2 });
    }
    if (s === 1){   // sirip beton tegak sepanjang menara (muka depan + 2 sisi)
      const nf = 7, ns = 6;
      for (let i = 0; i < nf; i++) taruh(rangka(tcx - tw / 2 + .2 + (tw - .4) * i / (nf - 1), yT, tzf, 0), 'box', .28, hT + .1, .6, 0, (hT + .1) / 2, .25, darken(wl, .93), { slot: 0, attach: 'z+' });
      for (const sx of [-1, 1]) for (let i = 1; i < ns - 1; i++) taruh(rangka(sx > 0 ? tx1 : tx0, yT, tzb + td * i / (ns - 1), sx * Math.PI / 2), 'box', .28, hT + .1, .6, 0, (hT + .1) / 2, .25, darken(wl, .93), { slot: 0, attach: 'z+' });
    }
    if (s === 2){   // dinding tirai: kaca menerus + mullion tegak (1 geometri) + garis lantai (lod 1)
      const cw = tw * .46, g = rangka(tcx, 0, tzf, 0);
      taruh(g, 'box', cw, hT - .5, .12, 0, yT + .3 + (hT - .5) / 2, .03, KACA[0], { glow: true });
      _jeruji(rangka(tcx, 0, tzf + .1, 0), cw - .1, hT - .5, 0, yT + .3, 0, Math.round(cw / 1.5) + 1, MUL, { satu: 1, rel: 0, batang: .07, lod: 0 });
      // mahkota: bingkai tirai menjulang di atas atap
      taruh(g, 'box', cw + .4, 1.6, .3, 0, H + .8, -.1, darken(wl, .9), { slot: 0 });
      taruh(g, 'box', cw - .2, 1.0, .06, 0, H + .8, .06, KACA[1], { slot: 0, attach: 'z+' });
    }
  }
  // lis atas lantai dasar (pemisah podium) di muka & sisi
  taruh(rangka(0, 0, zc, 0), 'box', bw + .24, .22, bd + .24, 0, LANTAI_USAHA - .11, 0, s === 2 ? '#C2913A' : darken(cPod, .84), { slot: 0 });
  // ---- atap ----
  const cAtap = '#B8B2A6';
  atapDatar(tw, td, tcx, H, tzc, { parapet: 1.0, c: cAtap, cParapet: wl, slotParapet: 2 });
  const yA = H + .12, lx = tcx + mir * (tw / 2 - 2.0);
  { const f = rangka(lx, yA, tzb + 2.2, 0);   // ruang mesin lift
    taruh(f, 'box', 2.4, 2.8, 2.4, 0, 1.4, 0, darken(wl, .94), { slot: 0, wall: true });
    taruh(f, 'box', 2.7, .15, 2.7, 0, 2.87, 0, darken(wl, .8), { slot: 0 });
    taruh(f, 'box', .9, 2.0, .06, 0, 1.0, 1.21, '#5E666C', { slot: 0, attach: 'z+' });
    taruh(f, 'box', .6, .4, .06, -mir * .8, 2.2, 1.21, '#3A3D40', { slot: 0, attach: 'z+', lod: 1 }); }
  for (const i of [0, 1]){ const f = rangka(tcx - mir * (1.2 + i * 2.2), yA, tzb + 1.4, 0);   // chiller AC sentral
    taruh(f, 'box', 1.8, 1.1, 1.2, 0, .55, 0, '#BFC3C6', { slot: 0 });
    const n0 = P.length; for (const dx of [-.45, .45]) taruh(f, 'cylLo', .7, .06, .7, dx, 1.13, 0, '#5E666C', { noEdge: true }); kantor_lod(n0); }
  tandon(tcx - mir * (tw / 2 - 1.1), yA, tzc + .3, { c: (s + iw) % 2 ? 'biru' : '#D9762B', r: .6, h: 1.3, kaki: .9 });
  tandon(tcx - mir * (tw / 2 - 1.1), yA, tzc + 1.8, { c: (s + iw) % 2 ? 'biru' : '#D9762B', r: .6, h: 1.3, kaki: .9 });
  antena(lx + mir * .6, yA + 2.95, tzb + 2.0, { h: 3.4 });
  if (s !== 2) parabola(tcx + mir * 1.5, yA, tzc + 1.0, { rot: mir * .6 });
  // papan nama atap (huruf di atas tiang, di belakang parapet depan)
  const NAMA = ['GRAHA NUSA', 'WISMA 45', 'MENARA NZ', 'PLAZA RAYA'][(s + ia) % 4];
  if (s !== 2){ const pw = Math.min(7.2, tw - 2), fb = rangka(tcx, yA, tzf - .7, 0);
    for (const sx of [-1, 1]) taruh(fb, 'box', .14, 1.6, .14, sx * pw * .38, .8, -.1, BESI, { slot: 0 });
    papanNama(tcx, yA + 1.35, tzf - .7, { w: pw, h: 1.2, c, slot: 1, teks: NAMA, cTeks: '#EDE8DC', bingkai: '#D9D4C8' }); }
  else teks(NAMA, tcx, H + .3, tzf + .17, { tinggi: .55, lebarMaks: tw * .44, c: '#EDE8DC', dz: .02 });
  // papan nama tegak di sudut muka menara (seed 0/3): huruf bertumpuk
  if ((s === 0 || s === 3) && n >= 4){ const kata = NAMA.split(' ')[0], hs = kata.length * .78 + .7, xs = tcx + mir * (tw / 2 - .75), ys = yF(nPod) + .35, fs = rangka(xs, ys, tzf, 0);
    taruh(fs, 'box', .95, hs, .45, 0, hs / 2, .195, c, { slot: 1 }); taruh(fs, 'box', 1.05, .12, .5, 0, hs + .06, .2, '#D9D4C8', { slot: 0 });
    for (let i = 0; i < kata.length; i++) teks(kata[i], xs, ys + hs - .45 - (i + 1) * .78 + .2, tzf + .42, { tinggi: .55, c: '#EDE8DC', dz: .01 }); }
  // ---- kanopi drop-off di depan lobby (di dalam kavling) ----
  const kd = 2.55, ky = 3.62, kw = 5.4;
  taruh(fr, 'box', kw, .38, kd + .05, 0, ky + .19, (kd - .05) / 2, '#CFC9BC', { slot: 0 });
  taruh(fr, 'box', kw + .04, .1, .1, 0, ky - .02, kd - .1, '#9C968C', { slot: 0 });
  for (const sx of [-1, 1]) cylLo(.2, ky, sx * (kw / 2 - .35), 0, zf + kd - .4, '#E3DED2');
  teks(NAMA, 0, ky + .07, zf + kd, { tinggi: .24, lebarMaks: kw - .6, c: '#5A4636', dz: .015 });   // r1: teks gelap di fasia krem untuk semua seed (emas di krem tak terbaca)
  for (const k of [-1, 1]) taruh(rangka(k * 1.4, ky - .04, zf + 1.2, 0), 'box', .3, .05, .3, 0, 0, 0, LAMPU, { glow: true, noEdge: true });
  // anak tangga + lantai teras lobby
  taruh(fr, 'box', kw + .6, .3, 1.0, 0, .15, .5, '#BFB6A8', { slot: 0 });
  taruh(fr, 'box', 3.0, .15, .35, 0, .075, 1.17, darken('#BFB6A8', .92), { slot: 0 });
  // ---- halaman depan ----
  const zP = LD / 2 - .2, xg = 0;
  taruh(rangka(xg, 0, (zf + 1.0 + zP) / 2, 0), 'box', 4.6, .03, zP - zf - 1.0, 0, .075, 0, '#6F7074', { slot: 0, noHull: true, noEdge: true });   // jalan masuk aspal
  pagarHalaman(LW - .3, zP, { gaya: 'besi', h: 1.0, gerbang: true, gW: 3.6, gx: xg, pilar: 2.6, cPilar: '#CFC9BC', c: '#BFB6A8' });
  kantor_posSatpam(mir * 3.45, zP - .95, 0);
  const cMob = ['#2E3A40', '#C9D3DC', '#E5E1D8', '#3E5A82'][(s + iw) % 4];
  kantor_mobil(-mir * 4.85, zf + 1.6, s & 2 ? Math.PI : 0, cMob);
  { const n0 = P.length; for (let i = 0; i < 3; i++) motor(mir * (5.05 + i * .8), zf + 1.25, { rot: .15 * (i - 1), c: ['#B4443A', '#2E3A40', '#3E5A82', '#C9D3DC'][(i + s) % 4] }); kantor_lod(n0); }
  tiangBendera(-mir * 7.35, zP - .5, 7.5, { rot: mir > 0 ? 0 : Math.PI });
  { const n0 = P.length; for (const sx of [-1, 1]) pot(sx * 1.95, zf + .55, 1.15, { y: .3, kotak: true, c: '#8E8A84', bunga: sx > 0 ? '#C9708A' : null }); kantor_lod(n0); }
  // talang & lampu dinding
  for (const sx of [-1, 1]) talang(sx > 0 ? tx1 : tx0, LANTAI_USAHA, H - LANTAI_USAHA - .1, { z: tzf - .3, rot: sx * Math.PI / 2 });
  for (const sx of [-1, 1]) lampuDinding(sx * 6.1, 3.0, zf, {});
};
