/* kafe (1×1) — spek-gaya §6 no. 5. Kedai kopi kekinian khas kota Indonesia: 1 lantai usaha (LANTAI_USAHA 4,2), atap datar beton
   + parapet, etalase kaca besar, pintu kaca, tenda kain di y 3,0, papan nama di y 3,3, 2 lampu dinding, teras depan dengan
   2 meja payung + kursi, pot tanaman & pot pagar hidup (bush), papan menu berdiri, unit AC luar di atap/samping.
   Varian seed: 0 kisi kayu tegak di pita atas fasad (papan nama di depannya), tenda polos, dek kayu
                1 kaca penuh berbingkai besi hitam + teras atap (pagar besi, meja payung di atap, rumah tangga)
                2 bangunan menyisi + teras samping berpergola kayu dengan tanaman rambat
                3 'tempo doeloe': pilaster, jendela tinggi berdaun, pintu ganda berboven, gevel parapet bertahun
   Deret (adj): sisi itu rapat ke batas kavling, parapet/lis tidak melewati batas. Semua tonjolan berhenti di z ≤ LD/2. */
CAT.kafe.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, A = ctx.adj || {}, aL = !!A.l, aR = !!A.r;
  const LW = fx + .8, LD = fz + .8, H = LANTAI_USAHA, ZE = LD / 2 - .05, wc = wl;
  const ia = Math.max(0, AKSEN.indexOf(c)), cGelap = darken(c, .55);
  const R0 = rangka(0, 0, 0, 0);
  const bx = (sx, sy, sz, x, y, z, col, o) => taruh(R0, 'box', sx, sy, sz, x, y + sy / 2, z, col, Object.assign({ slot: 0 }, o));
  // kursi kafe (kayu/rotan): dudukan + sandaran + blok kaki
  const kursi = (x, z, rot, col) => { const f = rangka(x, 0, z, rot);
    taruh(f, 'box', .42, .05, .42, 0, .46, 0, col, { slot: 0, lod: 1 });
    taruh(f, 'box', .42, .42, .05, 0, .7, -.19, col, { slot: 0, lod: 1, rx: -.1 });
    taruh(f, 'box', .32, .44, .3, 0, .22, .02, darken(col, .8), { slot: 0, lod: 1 }); };
  // meja payung: daun meja persegi + kaki + tiang + payung kerucut 10 segi (+ 1–2 kursi di kiri/kanan)
  const mejaPayung = (x, z, y0, cP, nK) => {
    const t = bx(.72, .05, .72, x, y0 + .7, z, '#E6E2D8', { lod: 1 }); bx(.07, .7, .07, x, y0, z, BESI, {});
    bx(.04, 1.6, .04, x, y0 + .75, z, '#D8D8D2', {});                                    // tiang payung (tipis → detail dekat)
    const p = P.push({ g: 'cone', s: [1.5, .42, 1.5], p: [x, y0 + 2.12, z], c: cP }); P[p - 1].slot = 0;
    const kc = ['#8C6A48', '#5E4630', '#C9A86A'][(s + ia) % 3];
    if (nK > 0) kursi(x - .62, z, Math.PI / 2, kc); if (nK > 1) kursi(x + .62, z, -Math.PI / 2, kc);
    return t; };
  // pot tanaman: pot kotak semen + perdu kerucut dipangkas (murah: 12 + 30 segitiga)
  const potKerucut = (x, z, h) => { bx(.42, .42, .42, x, 0, z, '#9E9A90', {}); const q = P.push({ g: 'cone', s: [.6, h, .6], p: [x, .42 + h / 2, z], c: '#4F7239' }); P[q - 1].noEdge = true; };
  const pagarHidup = (x, z, w) => { bx(w, .45, .42, x, 0, z, '#8E8A84', {}); bx(w - .1, .42, .34, x, .45, z, '#5F7A3F', { noEdge: true }); };   // bak tanaman + perdu dipangkas
  const menu = (x, z) => { const f = rangka(x, 0, z, .3); taruh(f, 'box', .55, .85, .05, 0, .45, .12, '#2E3A40', { slot: 0, rx: -.22 }); taruh(f, 'box', .55, .85, .05, 0, .45, -.12, '#2E3A40', { slot: 0, rx: .22, lod: 1 });
  };
  const xl = aL ? -LW / 2 : -3.0, xr = aR ? LW / 2 : 3.0;
  const zb = -LD / 2 + .5, zf = s === 1 ? 2.05 : 2.15;
  const NAMA = ['KEDAI KOPI', 'KOPI SUSU', 'NGOPI DULU', 'KOPI DOELOE'][s];

  if (s === 2){
    // ===== bangunan menyisi (4,5 m) + teras samping berpergola =====
    const kiri = !(aL && !aR), bw = 4.5, bxl = kiri ? xl : xr - bw, bxr = bxl + bw, bcx = (bxl + bxr) / 2, zc = (zb + zf) / 2;
    const Ab = { l: kiri ? aL : 0, r: kiri ? 0 : aR };
    dinding(bw, H, zf - zb, bcx, 0, zc, wc, { plinth: .4, cPlinth: '#6F6A60', adj: Ab });
    atapDatar(bw, zf - zb, bcx, H, zc, { parapet: .5, c: '#B8B2A6', cParapet: wc, slotParapet: 2, adj: Ab });
    const ex = bcx - .65, xd = bcx + 1.45;
    etalase(ex, zf, { w: 2.4, h: 2.5, y: .5, wall: wc, bingkai: BINGKAI, bagi: 1.2 });
    pintu(xd, zf, { w: 1.0, h: 2.4, c: '#3A3F44', kaca: true, kusen: BINGKAI, wall: wc, y: .1 });
    tenda(bcx, 3.0, zf, { w: bw - .4, dalam: .9, miring: 20, c, c2: '#E6E2D8', strip: 4, slot: 1 });
    papanNama(bcx, 3.3, zf, { w: bw - 1.4, h: .7, c: cGelap, teks: NAMA, cTeks: '#EDE8DC' });
    for (const sx of [-1, 1]) lampuDinding(bcx + sx * (bw / 2 - .38), 3.75, zf, {});
    // teras samping: dek + pergola (4 tiang, 2 balok, 3 kasau) + tanaman rambat
    const px0 = kiri ? bxr : (aL ? -LW / 2 : -LW / 2 + .1), px1 = kiri ? (aR ? LW / 2 : LW / 2 - .1) : bxl, pw = px1 - px0, pcx = (px0 + px1) / 2;
    const pz0 = zb + 1.6, pz1 = ZE - .1, pd = pz1 - pz0, pzc = (pz0 + pz1) / 2, hp = 2.75;
    bx(pw - .04, .1, pd, pcx, 0, pzc, '#8C6A48', { ao: .9 });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(.14, hp, .14, pcx + sx * (pw / 2 - .15), .1, pzc + sz * (pd / 2 - .15), '#6B5546', {});
    for (const sx of [-1, 1]) bx(.12, .2, pd, pcx + sx * (pw / 2 - .15), hp + .1, pzc, '#5E4630', {});
    for (let k = 0; k < 3; k++) bx(pw - .1, .12, .08, pcx, hp + .3, pz0 + .3 + k * (pd - .6) / 2, '#7A5A3A', { lod: 1 });
    for (let k = 0; k < 3; k++) bx(pw * (.35 + (k % 2) * .2), .14, .55, pcx + (k - 1) * pw * .22, hp + .38, pz0 + .6 + k * (pd - 1.2) / 2, '#5F7A3F', { noEdge: true, lod: 1 });   // daun rambat
    bx(.3, hp - .2, .06, pcx + (kiri ? 1 : -1) * (pw / 2 - .15), .2, pz1 - .25, '#5F7A3F', { noEdge: true, lod: 1 });
    // lampu tali di bawah pergola (detail malam)
    for (let k = 0; k < 2; k++) taruh(R0, 'box', .08, .1, .08, pcx + (k - .5) * pw * .45, hp - .1, pzc, LAMPU, { glow: true, lod: 1 });
    mejaPayung(pcx, pzc - .4, .1, '#E6E2D8', 1);
    // teras depan bangunan: 1 meja payung + pot
    bx(bw - .04, .1, ZE - zf + .02, bcx, 0, (zf + ZE) / 2, '#C9C1B2', { ao: .9 });
    mejaPayung(ex - .3, ZE - .8, .1, AKSEN[(ia + 3) % 10], 1);
    potKerucut(xd + .78 < bxr - .2 ? xd + .78 : xd - .78, zf + .35, .9); potKerucut(bxl + .3 + (kiri ? 0 : 0), ZE - .3, .8);
    pagarHidup(pcx, ZE - .25, Math.min(1.6, pw - .6));
    menu(xd, ZE - .35);
    const sw = kiri ? bxl : bxr; if (!(kiri ? aL : aR)){ ac(sw, 2.6, zb + 1.2, { rot: kiri ? -Math.PI / 2 : Math.PI / 2 }); talang(sw, 0, H, { z: zf - .3, rot: kiri ? -Math.PI / 2 : Math.PI / 2 }); }
    ac(bcx + .8, H + .12, zb + .8, {});
    return;
  }

  const bw = xr - xl, cx = (xl + xr) / 2, zc = (zb + zf) / 2;
  if (s === 0){
    // ===== kisi kayu + tenda polos + dek kayu =====
    dinding(bw, H, zf - zb, cx, 0, zc, wc, { plinth: .4, cPlinth: '#5E5A55', adj: A });
    atapDatar(bw, zf - zb, cx, H, zc, { parapet: .4, c: '#B8B2A6', cParapet: wc, slotParapet: 2, adj: A });
    const ex = cx - 1.25, xd = cx + 1.3;
    etalase(ex, zf, { w: 3.0, h: 2.5, y: .5, wall: wc, bingkai: '#3A3430', bagi: 1.5 });
    pintu(xd, zf, { w: 1.1, h: 2.4, c: '#3A3430', kaca: true, kusen: '#3A3430', wall: wc, y: .1 });
    // pita atas: kisi kayu tegak (bidang jeruji satu muka) dari atas tenda sampai bawah parapet
    _jeruji(rangka(cx, 0, zf, 0), bw - (aL ? 0 : .2) - (aR ? 0 : .2), 1.15, 0, 3.0, .04, Math.round(bw / .17), '#8C6A48', { batang: .07, rel: 0, satu: 1, lod: 0 });
    bx(bw - (aL ? 0 : .2) - (aR ? 0 : .2), .1, .12, cx, 2.95, zf + .02, '#5E4630', { attach: 'z+' });   // balok kisi
    tenda(cx - .1, 3.0, zf, { w: Math.min(5.0, bw - .9), dalam: .9, miring: 18, c, strip: 0, slot: 1, gerigi: true, cGerigi: darken(c, .8) });
    papanNama(cx, 3.3, zf + .08, { w: 3.6, h: .7, c: cGelap, teks: NAMA, cTeks: '#E6D3A8', bingkai: '#C9B37A' });
    for (const sx of [-1, 1]) lampuDinding(cx + sx * 2.3, 3.85, zf + .08, {});
    bx(bw - .04, .1, ZE - zf + .02, cx, 0, (zf + ZE) / 2, '#8C6A48', { ao: .9 });                         // dek kayu
    mejaPayung(cx - 2.05, ZE - .8, .1, '#E6E2D8', 2); mejaPayung(cx - .1, ZE - .8, .1, AKSEN[(ia + 3) % 10], 1);
    potKerucut(xd + .9, zf + .3, .95); potKerucut(cx - 2.85 + .25, zf + .3, .8);
    pagarHidup(cx + 1.75, ZE - .25, 1.3);
    menu(xd - .1, ZE - .5);
    if (!aR){ ac(xr, 2.4, zb + 1.3, { rot: Math.PI / 2, rak: true }); talang(xr, 0, H, { z: zf - .3, rot: Math.PI / 2 }); }
    if (!aL) jendelaKecil(xl, 1.6, zb + 1.6, { rot: -Math.PI / 2, w: .9, h: .9, wall: wc });
    ac(cx + 1.2, H + .12, zb + .7, {}); ac(cx + 2.1, H + .12, zb + .7, {});
  } else if (s === 1){
    // ===== kaca penuh berbingkai besi hitam + teras atap =====
    dinding(bw, H, zf - zb, cx, 0, zc, wc, { plinth: .25, cPlinth: '#3A3F44', adj: A });
    atapDatar(bw, zf - zb, cx, H, zc, { parapet: .3, c: '#A9A398', cParapet: '#3A3F44', adj: A, sisi: 'blr' });
    const ex = cx - 1.0, xd = cx + 1.75;
    etalase(ex, zf, { w: 3.6, h: 2.9, y: .3, wall: wc, bingkai: BINGKAI, bagi: .9, palangH: true, ambang: '#3A3F44' });
    pintu(xd, zf, { w: 1.0, h: 2.6, c: BINGKAI, kaca: true, kusen: BINGKAI, wall: wc, y: .05 });
    tenda(ex, 3.45, zf, { w: 3.9, dalam: .85, miring: 16, c, strip: 0, slot: 1, gerigi: false });
    // papan kotak-lampu (menyala malam) + huruf
    bx(3.4, .55, .12, cx + .2, 3.55, zf + .04, '#2E3A40', { attach: 'z+' });
    teks(NAMA, cx + .2, 3.66, zf + .1, { tinggi: .32, lebarMaks: 3.0, c: LAMPU, dz: .012 });
    for (const sx of [-1, 1]) lampuDinding(cx + .2 + sx * 2.15, 3.95, zf, {});
    bx(bw - .04, .1, ZE - zf + .02, cx, 0, (zf + ZE) / 2, '#9E9A90', { ao: .9 });
    mejaPayung(cx - 1.6, ZE - .8, .1, '#2E3A40', 2);
    potKerucut(xd + .78 < xr - .25 ? xd + .78 : xd - .8, zf + .32, 1.0); potKerucut(cx - 2.6, ZE - .3, .8);
    pagarHidup(cx + .55, ZE - .25, 1.2);
    menu(xd, ZE - .45);
    // teras atap: pagar besi depan + sisi, meja payung, rumah tangga beratap dak
    const yA = H + .12, rz0 = zc - .2, rz1 = zf - .15;
    _jeruji(rangka(cx, yA, zf - .12, 0), bw - (aL ? 0 : .2) - (aR ? 0 : .2), .95, 0, 0, 0, Math.round(bw / .2), BESI, { lod: 0, rel: .06, satu: 1 });
    bx(bw - (aL ? 0 : .2) - (aR ? 0 : .2), .08, .12, cx, yA + .95, zf - .12, '#3A3F44', {});
    for (const [sx, adj] of [[-1, aL], [1, aR]]) if (!adj){ const g = rangka(cx + sx * (bw / 2 - .12), yA, (rz0 + rz1) / 2, sx * Math.PI / 2);
      _jeruji(g, rz1 - rz0, .95, 0, 0, 0, Math.round((rz1 - rz0) / .25), BESI, { lod: 1, rel: .06, satu: 1 }); }
    mejaPayung(cx + .3, (rz0 + rz1) / 2 + .2, yA, c, 2);
    const kt = rangka(cx - bw / 2 + 1.25 + (aL ? .1 : 0), yA, zb + 1.27, 0);   // ,07 dari parapet belakang (tidak sebidang)
    taruh(kt, 'box', 1.9, 2.3, 2.0, 0, 1.15, 0, darken(wc, .9), { wall: true, slot: 0 });
    taruh(kt, 'box', 2.1, .14, 2.2, 0, 2.37, 0, '#A9A398', { slot: 0 });
    taruh(kt, 'box', .85, 1.95, .06, .3, .98, 1.01, '#3A3F44', { attach: 'z+', slot: 0 });
    { const px = cx + bw / 2 - .55, pz = (rz0 + rz1) / 2 - .3; bx(.42, .42, .42, px, yA, pz, '#9E9A90', {}); const q = P.push({ g: 'cone', s: [.6, .9, .6], p: [px, yA + .42 + .45, pz], c: '#4F7239' }); P[q - 1].noEdge = true; }
    if (!aR){ ac(xr, 2.5, zb + 1.3, { rot: Math.PI / 2, rak: true }); talang(xr, 0, H, { z: zf - .3, rot: Math.PI / 2 }); }
    if (!aL) jendelaKecil(xl, 1.7, zb + 2.0, { rot: -Math.PI / 2, w: 1.2, h: 1.0, wall: wc, gelap: true });
    ac(cx + 1.6, yA, zb + .6, {});
  } else {
    // ===== 'tempo doeloe': pilaster, gevel parapet bertahun, jendela tinggi berdaun, pintu ganda =====
    dinding(bw, H, zf - zb, cx, 0, zc, wc, { plinth: .55, adj: A, pilaster: true, lis: [3.15] });
    atapDatar(bw, zf - zb, cx, H, zc, { parapet: .6, c: '#B8B2A6', cParapet: wc, slotParapet: 2, adj: A });
    // gevel tengah bertangga di atas parapet depan + tahun
    bx(2.6, .55, .22, cx, H + .6, zf - .11, wc, { wall: true, slot: 2 }); bx(1.4, .4, .22, cx, H + 1.15, zf - .11, wc, { wall: true, slot: 2 });
    bx(2.7, .08, .3, cx, H + 1.15, zf - .11, darken(wc, .85), {});
    teks('1928', cx, H + .72, zf, { tinggi: .3, lebarMaks: 1.2, c: darken(wc, .6), dz: .012 });
    // pintu ganda berboven di tengah, etalase multi-panel kiri, jendela tinggi berdaun kanan. Lebar bersih antar-pilaster 5,36:
    // reveal etalase 1,9 + ,1 + reveal pintu 1,7 + ,1 + jendela+daun 1,52 (tidak ada reveal/daun yang bertumpuk atau sebidang dengan pilaster)
    const ex = cx - 1.71, xd = cx + .19, xj = cx + 1.9;
    pintu(xd, zf, { w: 1.4, h: 2.4, daun: 2, c: '#3F6B62', kaca: true, kusen: KUSEN, wall: wc, boven: true });
    etalase(ex, zf, { w: 1.6, h: 2.3, y: .6, wall: wc, bingkai: '#3F6B62', bagi: .55, palangH: true, ambang: darken(wc, .75) });
    jendela(xj, .9, zf, { w: .7, h: 2.0, wall: wc, kusen: KUSEN, daun: c, daunSlot: 1 });
    tenda(xd, 3.0, zf, { w: 1.9, dalam: .8, miring: 24, c, c2: '#E6E2D8', strip: 4, slot: 1, gerigi: false });
    tenda(ex, 3.0, zf, { w: 1.85, dalam: .8, miring: 24, c, c2: '#E6E2D8', strip: 4, slot: 1, penyangga: false, gerigi: false });
    papanNama(cx, 3.35, zf, { w: 3.4, h: .6, c: cGelap, teks: NAMA, cTeks: '#E6D3A8' });
    for (const sx of [-1, 1]) lampuDinding(cx + sx * 2.3, 3.7, zf, {});
    bx(bw - .04, .1, ZE - zf + .02, cx, 0, (zf + ZE) / 2, '#C9BFA6', { ao: .9 });
    mejaPayung(ex - .25, ZE - .8, .1, '#E6E2D8', 1); mejaPayung(xj - .1, ZE - .8, .1, AKSEN[(ia + 1) % 10], 1);
    potKerucut(xd - 1.0, zf + .3, .85); potKerucut(xd + 1.0, zf + .3, .85);
    pagarHidup(cx - .2, ZE - .25, 1.2);
    if (!aR) talang(xr, 0, H + .4, { z: zf - .5, rot: Math.PI / 2 });   // di belakang pilaster sudut
    ac(cx + 1.3, H + .12, zb + .7, {});
  }
};
