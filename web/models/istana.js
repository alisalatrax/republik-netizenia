/* istana (2×2) — spek-gaya §6 no. 20. Istana Negara Republik Netizenia — desain orisinal (bukan salinan bangunan nyata):
   gedung putih tulang #E3DED2 2 lantai (4,2 + 3,3 = 7,5) 13,7×7,0 di atas podium batu ,9; serambi 8 kolom raksasa (cylLo r ,35) + kepala
   kolom, balok entablatur bertulisan 'ISTANA', pediment segitiga dengan medali emas; kubah emas di atas drum + pucuk; 12 jendela tinggi
   berkusen + topi (6 per lantai di muka) + jendela samping; pintu kayu dobel berukir + boven; tangga 4 anak selebar serambi;
   balustrade atap (seed 0/2) atau atap limasan abu (seed 1/3); seed 2/3: 2 sayap depan menjorok 2,2 m beratap limasan sendiri + pilaster sudut; halaman: jalan paving tengah,
   2 kolam (bulat: seed genap · persegi + air mancur: seed ganjil), 2 petak rumput, tiang bendera 10 m merah putih di sumbu, 4 palem,
   4 lampu taman, pagar besi + pilar putih + gerbang besi lebar + 2 gardu jaga beratap limasan.
   Semua bagian di dalam kavling (|x|,|z| ≤ 8); muka +z = jalan. floors = 1 dari floorsFor (istana tidak berlantai dinamis; tinggi tetap spek). */
function istana_palem(x, z, h, a0){ cylLo(.16, h, x, 0, z, '#8C7A5E');
  for (let k = 0; k < 5; k++){ const a = a0 + k * 1.2566; taruh(rangka(x, h, z, a), 'box', .42, .05, 1.35, 0, -.22, .62, k % 2 ? '#5C7D3E' : '#4F7239', { rx: .42, slot: 0, noEdge: true }); } }
// jendela tinggi hemat: reveal gelap + kaca 2 nada + topi (lis atas) + ambang tipis (lod 1)
function istana_jendela(f, dx, y, w, h, cW){
  taruh(f, 'box', w + .24, h + .24, .07, dx, y + h / 2, 0, darken(cW, .66), { attach: 'z+', slot: 0 });
  taruh(f, 'box', w, h, .06, dx, y + h / 2, .02, KACA[0], { glow: true });
  taruh(f, 'box', w + .6, .16, .3, dx, y + h + .3, .1, darken(cW, .9), { attach: 'z+', slot: 0, lod: 1 });
  taruh(f, 'box', .06, h, .06, dx, y + h / 2, .06, KUSEN, { slot: 0 });
  taruh(f, 'box', w, .06, .06, dx, y + h * .68, .06, KUSEN, { slot: 0 }); }
// gardu jaga gerbang: bilik + pita kaca + atap limasan kecil
function istana_gardu(x, z, cW){ const f = rangka(x, 0, z, 0), w = 1.3, h = 2.4;
  taruh(f, 'box', w, h, w, 0, h / 2, 0, cW, { slot: 0, wall: true });
  taruh(f, 'box', 1.0, .7, .06, 0, 1.45, w / 2, KACA[0], { glow: true, attach: 'z+' });
  atapLimasan(w, w, x, h, z, { sudut: 30, overhang: .25, c: '#5E6670', cWall: cW, pita: false }); }
CAT.istana.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, LW = fx + .8, LD = fz + .8, hx = LW / 2, hz = LD / 2;
  const cW = '#E3DED2', cB = '#CFC6B2', EMAS = '#C2913A', datar = s === 0 || s === 2, sayap = s >= 2;
  const yP = .9, H = 7.5, bw = 13.7, zb = -hz + 1.0, zf = zb + 7.0, zc = (zb + zf) / 2, yT = yP + H;
  // ---- podium + tangga 4 anak ----
  const pd = 2.6, ptw = 10.4;   // dalam & lebar serambi
  box(bw + .6, yP, zf + pd - zb + .2, 0, 0, (zb - .2 + zf + pd) / 2, cB);
  box(bw + .7, .1, zf + pd - zb + .3, 0, yP - .1, (zb - .2 + zf + pd) / 2, darken(cB, .86)); P[P.length - 1].noEdge = true;
  for (let k = 0; k < 4; k++){ const hk = yP * (4 - k) / 5; box(ptw - .6, hk, .38, 0, 0, zf + pd + .19 + k * .36, k % 2 ? cB : darken(cB, .95)); }
  // ---- gedung utama ----
  dinding(bw, H, 7.0, 0, yP, zc, cW, { plinth: 0, lis: [LANTAI_USAHA - .06], cLis: darken(cW, .86), slot: 0 });
  box(bw + .4, .35, 7.4, 0, yT, zc, darken(cW, .92));                                                     // kornis
  // sayap depan menjorok (seed 2/3)
  const sw = (bw - ptw) / 2 - .05, sxc = ptw / 2 + sw / 2 + .05;
  // sayap menjorok 2,2 (seed 2/3) dengan atap limasan sendiri + pilaster sudut → siluet beda nyata dari seed 0/1
  const sD = 2.2;
  if (sayap) for (const sx of [-1, 1]){ dinding(sw, H - .4, sD, sx * sxc, yP, zf + sD / 2 - .05, cW, { plinth: 0, lis: [LANTAI_USAHA - .06], cLis: darken(cW, .86), slot: 0 });
    box(sw + .3, .3, sD + .3, sx * sxc, yP + H - .4, zf + sD / 2, darken(cW, .92));
    for (const k of [-1, 1]) box(.24, H - .4, .24, sx * sxc + k * (sw / 2 - .02), yP, zf + sD - .07, darken(cW, .95));
    atapLimasan(sw, sD, sx * sxc, yP + H - .1, zf + sD / 2, { sudut: 32, overhang: .15, c: '#5E6670', cWall: cW, pita: false }); }
  const zS = sayap ? zf + sD - .05 : zf;   // bidang muka sayap
  // ---- jendela: 6 per lantai di muka (2 di sayap + 4 di balik kolom) + 2 per sisi samping ----
  const fF = rangka(0, 0, zf, 0), fS = rangka(0, 0, zS, 0);
  for (const [y, h] of [[yP + 1.0, 2.3], [yP + LANTAI_USAHA + .6, 1.9]]){
    for (const sx of [-1, 1]) istana_jendela(fS, sx * sxc, y, 1.0, h, cW);
    for (const x of [-3.25, -1.95, 1.95, 3.25]) istana_jendela(fF, x, y, .8, h, cW);
    for (const sx of [-1, 1]) istana_jendela(rangka(sx * bw / 2, 0, zc - 1.2, sx * Math.PI / 2), 0, y, 1.0, h, cW); }
  // pintu utama dobel + boven + balkon kecil lantai 2 di atasnya
  pintu(0, zf, { y: yP, w: 1.9, h: 3.0, daun: 2, c: '#6B4A32', kusen: EMAS, wall: cW, boven: true, panel: true });
  istana_jendela(fF, 0, yP + LANTAI_USAHA + .6, 1.3, 1.9, cW);
  // 2 pot besar di kepala tangga
  for (const sx of [-1, 1]) pot(sx * (ptw / 2 - .4), zf + pd - .35, 1.6, { y: yP, kotak: true, c: '#CFC6B2', bunga: sx > 0 ? '#C9503C' : null });
  // ---- serambi: 8 kolom + kepala kolom + entablatur + pediment + medali ----
  const zk = zf + pd - .45, yE = yP + 6.2;
  for (let k = 0; k < 8; k++){ const x = -ptw / 2 + .55 + k * (ptw - 1.1) / 7;
    cylLo(.35, 6.2, x, yP, zk, '#ECE8DE'); box(.9, .3, .9, x, yE - .3, zk, darken(cW, .93)); P[P.length - 1].lod = 1; box(.85, .2, .85, x, yP, zk, darken(cB, .92)); P[P.length - 1].lod = 1; }
  box(ptw, .85, pd + .1, 0, yE, zf + pd / 2 - .05, cW);
  box(ptw + .2, .14, pd + .3, 0, yE + .85, zf + pd / 2 - .05, darken(cW, .88)); P[P.length - 1].noEdge = true;
  const fE = rangka(0, 0, zf + pd + .0, 0); taruh(fE, 'box', 3.6, .5, .05, 0, yE + .42, .0, '#B8A880', { attach: 'z+', slot: 0, noHull: true, lod: 1 });
  _teks(fE, 'ISTANA', 0, yE + .25, .03, 3.2, .36, '#5A4636', { lod: 1 });
  roof(pd + .2, 1.9, ptw + .3, 0, yE + .99, zf + pd / 2 - .05, cW, Math.PI / 2);                           // pediment (prisma, bidang segitiga ke jalan)
  taruh(rangka(0, 0, zf + pd + .02, 0), 'cylLo', .8, .12, .8, 0, yE + 1.55, 0, EMAS, { slot: 0, rx: Math.PI / 2, lod: 1 });    // medali emas bundar di timpanum
  // ---- atap: balustrade datar atau limasan ----
  let yDome = yT + .35;
  if (datar){ atapDatar(bw, 7.0, 0, yT + .35, zc, { parapet: .25, c: '#C9C1B2', cParapet: cW, lis: false, sisi: 'blr' });
    const bf = rangka(0, yT + .35, zf + .05, 0);
    for (const sx of [-1, 1]){ const L = (bw - ptw) / 2 + 1.2, cx = sx * (bw / 2 - L / 2);
      _jeruji(bf, L, .55, cx, .05, 0, Math.round(L / .28), cW, { batang: .1, rel: .1, lod: 1, satu: 1 });
      taruh(bf, 'box', L, .12, .3, cx, .66, 0, darken(cW, .9), { slot: 0 }); } }
  else { const r = atapLimasan(bw, 7.0, 0, yT + .35, zc, { sudut: 26, overhang: .35, c: '#5E6670', cWall: cW, pita: false }); yDome = r.yPuncak - 1.1; }
  // kubah emas di atas drum (selalu, spek: kubah kecil) + pucuk
  const dz = zc + .3, dh = datar ? 1.2 : 1.6;
  cylLo(1.95, dh, 0, yDome, dz, cW); box(4.2, .16, 4.2, 0, yDome + dh - .08, dz, darken(cW, .88)); P[P.length - 1].noEdge = true;
  sphLo(1.85, 0, yDome + dh + .02, dz, EMAS, 1.55);
  cylLo(.14, .7, 0, yDome + dh + 1.45, dz, EMAS); const pq = sphLo(.22, 0, yDome + dh + 2.25, dz, EMAS); pq.lod = 1;
  // talang di sudut belakang
  for (const sx of [-1, 1]) talang(sx * bw / 2, yP, H - .1, { z: zb + .4, rot: sx * Math.PI / 2 });
  // ---- halaman depan ----
  const z0 = zf + pd + 1.6, zP = hz - .2, pw = 3.0;
  box(pw, .05, zP - z0, 0, .03, (z0 + zP) / 2, '#D8D0C0'); P[P.length - 1].noEdge = true;                  // jalan paving tengah
  for (const sx of [-1, 1]){ const gx = sx * (pw / 2 + 2.9), kx = sx * 4.7, kz = z0 + 1.5;
    box(5.2, .05, zP - z0 - .6, gx, .03, (z0 + zP) / 2 - .1, '#8FA462'); P[P.length - 1].noEdge = true;    // petak rumput
    if (s % 2 === 0){ cylLo(1.2, .35, kx, 0, kz, '#D8D0C0'); const w0 = cylLo(1.02, .05, kx, .33, kz, PAL.air); w0.noEdge = true; }
    else { box(2.5, .35, 2.0, kx, 0, kz, '#D8D0C0'); box(2.15, .05, 1.65, kx, .33, kz, PAL.air); P[P.length - 1].noEdge = true;
      box(.12, .7, .12, kx, .35, kz, '#E6E2D8'); P[P.length - 1].lod = 1; }
    istana_palem(sx * 6.6, z0 + .1, 4.6, sx * .5); istana_palem(sx * 6.6, zP - 1.5, 5.2, sx * 1.1);
    for (const lz of [z0 + .5, zP - .9]){ const lx = sx * (pw / 2 + .35); box(.1, 2.2, .1, lx, 0, lz, '#2B2B2B'); gbox(.28, .34, .28, lx, 2.2, lz, LAMPU); G[G.length - 1].lod = 1; } }
  box(1.4, .25, 1.4, 0, 0, z0 + 1.3, '#CFC6B2');
  tiangBendera(0, z0 + 1.3, 10, {});
  // pagar besi + gerbang + gardu jaga
  const gW = 3.6;
  pagarHalaman(LW - .3, zP, { gaya: 'besi', h: 1.3, gx: 0, gW, pilar: 2.6, jarakBesi: .26, c: cW, cPilar: cW, cBesi: '#2E3A30', cGerbang: '#2E3A30' });
  for (const sx of [-1, 1]) istana_gardu(sx * (gW / 2 + .85), zP - 1.0, cW);
};
