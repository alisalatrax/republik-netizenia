/* warung (1×1) — spek-gaya §6 no. 4. Warung kampung/pinggir jalan khas Indonesia, 1 lantai (LANTAI 3,2), atap seng.
   Unsur tetap: muka terbuka (bukaan jualan + meja + etalase kaca kecil + rak barang + renceng sachet), tenda/terpal bergaris,
   bangku panjang kayu, kursi plastik, papan nama, spanduk kain, tong air, galon/LPG, lampu.
   Varian seed: 0 KOPI TUBRUK (warkop) — pelana seng sejajar jalan + emperan berkolom di bawah atap utama + papan nama berdiri di atas atap
                1 NASI RAMES (warteg) — dinding muka dipertinggi (gevel palsu) berpapan nama, etalase lauk berkaca, pintu berkanopi, tenda di atas etalase
                2 SEMBAKO — pelana menghadap jalan (gevel dinding + roster), emperan seng 1,75 berkolom + papan di tepi emperan, galon/LPG/krat
                3 PECEL LELE — dapur kecil di belakang + terpal di atas 4 tiang, spanduk keliling bertulisan, meja panjang + 2 bangku + gerobak
   Deret (adj): sisi itu rapat ke batas kavling, atap tanpa teritis di sisi itu (pelana sejajar deret, varian 2 dipaksa sejajar).
   Semua tonjolan (emperan, tenda, terpal, papan) berhenti di batas kavling depan (z ≤ LD/2). */
CAT.warung.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, A = ctx.adj || {}, aL = !!A.l, aR = !!A.r, deret = aL || aR;
  const LW = fx + .8, LD = fz + .8, H = LANTAI, ZE = LD / 2 - .05;
  const ia = Math.max(0, AKSEN.indexOf(c));
  const SENGW = ['#8E979C', '#7E5A44', '#6E7F8A', '#8C6A55'][s], KAYUW = '#7A5A3A';
  const xl = aL ? -LW / 2 : -2.85, xr = aR ? LW / 2 : 2.85, bw = xr - xl, cx = (xl + xr) / 2;
  const R0 = rangka(0, 0, 0, 0);
  // kotak: y = alas (seperti box()), flag lewat o
  const bx = (sx, sy, sz, x, y, z, col, o) => taruh(R0, 'box', sx, sy, sz, x, y + sy / 2, z, col, Object.assign({ slot: 0 }, o));
  // kursi plastik: dudukan + sandaran miring + blok kaki gelap (sandaran & kaki = detail dekat)
  const kursi = (x, z, rot, col) => { const f = rangka(x, 0, z, rot);
    taruh(f, 'box', .4, .05, .4, 0, .44, 0, col, { slot: 0 });
    taruh(f, 'box', .4, .38, .05, 0, .66, -.19, col, { slot: 0, lod: 1, rx: -.15 });
    taruh(f, 'box', .3, .42, .3, 0, .21, .02, darken(col, .85), { slot: 0, lod: 1 }); };
  // tong air plastik
  const tong = (x, z, col) => cylLo(.27, .78, x, 0, z, col);
  const lpg = (x, y, z) => { const q = cylLo(.15, .34, x, y, z, '#6E9A45'); q.lod = 1; q.noEdge = true; return q; };
  // bukaan jualan (kios): reveal gelap + bidang dalam + rak + barang + renceng sachet + meja kayu + etalase kaca kecil
  const kios = (ox, zw, ow, oy, oh, wc) => {
    bx(ow + .2, oh + .2, .07, ox, oy - .1, zw, darken(wc, .7), { attach: 'z+', ao: .8 });
    bx(ow, oh, .03, ox, oy, zw + .045, '#3A3430', { noEdge: true });
    bx(ow * .92, .05, .24, ox, oy + .66, zw + .14, '#6B5546', { lod: 1, noEdge: true });
    for (let k = 0; k < 3; k++) bx(ow * .26, .26 + ((k + s) % 2) * .12, .18, ox - ow * .3 + k * ow * .3, oy + .71, zw + .14, BARANG[(k * 3 + s) % BARANG.length], { lod: 1, noEdge: true });
    for (let k = 0; k < 3; k++) bx(.13, .66, .02, ox - ow * .36 + k * ow * .36, oy + oh - .7, zw + .1 + k * .006, BARANG[(k * 2 + 1 + s) % BARANG.length]);   // renceng (tipis → lod 1)
    bx(ow + .3, .92, .5, ox, 0, zw + .22, KAYUW, {});                                           // meja jualan (menembus dinding ,03)
    taruh(R0, 'box', Math.min(1.5, ow * .5), .48, .38, ox - ow * .17, .92 + .24, zw + .26, KACA[0], { glow: true });   // etalase kaca kecil
  };
  const wc = wl, SPANDUK = ['GORENGAN', 'SOTO AYAM', 'ISI GAS', 'AYAM GORENG'][s];
  // spanduk di dinding samping yang bebas (bukan sisi deret); kembali false bila kedua sisi rapat
  const spandukSamping = (zb, zr, y) => { const L = Math.min(3.0, zr - zb - .7); if (L < 1.2) return false;
    if (!aL){ spanduk(xl, y, (zb + zr) / 2, { rot: -Math.PI / 2, w: L, h: .8, c: '#E6E2D8', teks: SPANDUK, cTeks: '#B5473A' }); return true; }
    if (!aR){ spanduk(xr, y, (zb + zr) / 2, { rot: Math.PI / 2, w: L, h: .8, c: '#E6E2D8', teks: SPANDUK, cTeks: '#B5473A' }); return true; }
    return false; };
  const KCOL = ['#B4443A', '#3E6FB0', '#4F8F5E', '#C2913A'];
  // garis sambungan seng gelombang di kedua bidang atap pelana: n pita gelap ,1 m menuruni lereng (satu primitif custom/bidang, detail dekat lod 1)
  // (x,z) = pusat atap, rot = 0 bubungan sejajar x lokal / π/2 sejajar z, dx = geser x lokal (teritis tak simetris), L = panjang atap, run = datar teritis→bubungan
  const sengGaris = (x, z, rot, dx, L, run, sud, yEave, col, jarak) => {
    const a = sud * D2R, n = Math.max(3, Math.round(L / (jarak || 1.0))), wu = .05 / L, key = 'seng|' + n + '|' + wu.toFixed(4);
    let G0 = _GEO.get(key); if (!G0){ const t = []; for (let i = 0; i < n; i++){ const xc = -.5 + (i + .5) / n; t.push(xc - wu, 0, -.5, xc - wu, 0, .5, xc + wu, 0, .5, xc - wu, 0, -.5, xc + wu, 0, .5, xc + wu, 0, -.5); }
      G0 = _geoFrom(t, null); _GEO.set(key, G0); }
    const f = rangka(x, 0, z, rot || 0), Ls = run / Math.cos(a) - .04;
    for (const sd of [1, -1]) taruh(f, 'custom', L - .04, 1, Ls, dx || 0, yEave + run * Math.tan(a) / 2 + .025 * Math.cos(a), sd * (run / 2 + .025 * Math.sin(a)), col, { geo: G0.geo, edges: null, rx: sd * a, noHull: true, noEdge: true, lod: 1, slot: 0 }); };

  if (s === 0){
    // ===== WARKOP: ruang 4,0 + emperan 1,3 di bawah satu atap pelana seng 15° (sejajar jalan) =====
    const zb = -3.0, zr = 1.0, zF = 2.3, S = zF - (zb - .35), zm = (zb - .35 + zF) / 2;
    dinding(bw, H, zr - zb, cx, 0, (zb + zr) / 2, wc, { plinth: .45, adj: A });
    atapPelana(bw, S, cx, H, zm, { arah: 'x', sudut: 15, overhang: 0, ovD: 0, ovL: aL ? 0 : .3, ovR: aR ? 0 : .3, c: SENGW, pita: false });
    sengGaris(cx + ((aR ? 0 : .3) - (aL ? 0 : .3)) / 2, zm, 0, 0, bw + (aL ? 0 : .3) + (aR ? 0 : .3), S / 2, 15, H, darken(SENGW, .8));
    bx(bw - (aL ? 0 : .04) - (aR ? 0 : .04), .12, zF - zr, cx, 0, (zr + zF) / 2, '#BFB6A8', { ao: .85 });   // lantai emperan
    for (const kx of [xl + .22, xr - .22]) bx(.14, H - .1, .14, kx, .12, zF - .22, KAYUW, {});        // 2 kolom kayu
    tenda(cx, H - .06, zF, { w: bw - .5, dalam: Math.min(.95, ZE - zF), miring: 18, c, c2: '#E6E2D8', strip: 4, slot: 1, penyangga: false });
    // papan nama berdiri di atas atap (tepi depan); bingkai & papan menembus atap
    const sw = Math.min(3.4, bw - 1.6), zs = zF - .35, ys = H + .04;
    bx(sw + .14, .84, .06, cx, ys - .07, zs - .07, '#C9B37A', {});
    bx(sw, .7, .1, cx, ys, zs, c, { slot: 1 });
    teks('KOPI TUBRUK', cx, ys + .15, zs + .05, { tinggi: .4, lebarMaks: sw - .3, c: '#EDE8DC', dz: .012 });
    // muka: bukaan jualan + pintu kayu
    const ow = Math.min(3.2, bw - 2.05), ox = xl + .42 + ow / 2;
    kios(ox, zr, ow, .95, 1.5, wc);
    pintu(xr - .85, zr, { w: .9, h: 2.1, y: .12, c: KAYU, wall: wc, kusen: KUSEN, panel: false });
    lampuDinding(xr - 1.75 > ox + ow / 2 + .2 ? xr - 1.75 : ox, 2.75, zr, {});
    bangku(ox, zr + .86, { w: Math.min(2.2, ow - .2), y: .12, sandaran: false, c: '#8C6A48' });
    // meja kecil + kursi plastik di bawah tenda
    const mx = cx + Math.min(1.3, bw / 2 - 1.0), mz = zF + .5;
    bx(.7, .04, .55, mx, .7, mz, '#E6E2D8', {}); bx(.08, .7, .08, mx, 0, mz, BESI, {});
    kursi(mx - .62, mz, Math.PI / 2, KCOL[ia % 4]); kursi(mx + .62, mz, -Math.PI / 2, KCOL[(ia + 1) % 4]); kursi(cx - .9, zF + .45, .25, KCOL[(ia + 2) % 4]);
    tong(xl + .42, zF + .38, '#3E6FB0');
    lpg(xr - .32, .12, zr + .5);
    if (!spandukSamping(zb, zr, 1.1)) spanduk(ox, 2.62, zr, { w: ow, h: .48, c: '#E6E2D8', teks: SPANDUK, cTeks: '#B5473A' });
  } else if (s === 1){
    // ===== WARTEG: dinding muka dipertinggi 1,3 (papan nama) menutupi atap pelana di belakangnya =====
    const zb = -3.0, zr = 1.5, Hf = H + 1.3, cTegel = campur(c, '#8E979C', .35);
    dinding(bw, H, zr - zb, cx, 0, (zb + zr) / 2, wc, { plinth: .85, cPlinth: cTegel, adj: A });
    bx(bw, Hf - H, .22, cx, H, zr - .11, wc, { wall: true, slot: 2 });                                   // gevel palsu
    const lw0 = bw + (aL ? -.01 : .04) + (aR ? -.01 : .04), lx0 = cx + ((aR ? -.01 : .04) - (aL ? -.01 : .04)) / 2;
    bx(lw0, .12, .32, lx0, H - .06, zr - .12, darken(wc, .85), { noEdge: true });                          // lis sambungan
    bx(lw0, .1, .34, lx0, Hf, zr - .13, darken(wc, .85), {});                                              // topi gevel
    atapPelana(bw, zr - .22 - (zb - .35), cx, H, (zr - .22 + zb - .35) / 2, { arah: 'x', sudut: 15, overhang: 0, ovD: 0, ovL: aL ? 0 : .3, ovR: aR ? 0 : .3, c: SENGW, pita: false });
    sengGaris(cx + ((aR ? 0 : .3) - (aL ? 0 : .3)) / 2, (zr - .22 + zb - .35) / 2, 0, 0, bw + (aL ? 0 : .3) + (aR ? 0 : .3), (zr - .22 - (zb - .35)) / 2, 15, H, darken(SENGW, .8));
    papanNama(cx, H + .25, zr, { w: Math.min(4.4, bw - .9), h: .85, c, slot: 1, teks: 'NASI RAMES', cTeks: '#EDE8DC' });
    // etalase lauk + pintu berkaca dengan kanopi seng
    const ex = cx - .95, xd = cx + 1.35;
    etalase(ex, zr, { w: 2.4, h: 1.25, y: .85, wall: wc, ambang: cTegel, bagi: 1.2 });
    pintu(xd, zr, { w: 1.0, h: 2.2, y: .1, c, slot: 1, kaca: true, kusen: KUSEN, wall: wc, kanopi: true, cKanopi: SENGW });
    bx(bw - (aL ? 0 : .04) - (aR ? 0 : .04), .1, 1.0, cx, 0, zr + .48, '#C9BFA6', { ao: .9 });          // lantai keramik muka
    tenda(ex, 2.55, zr, { w: 2.7, dalam: .85, miring: 20, c, c2: '#E6E2D8', strip: 5, slot: 1 });
    bangku(ex, zr + 1.05, { w: 2.2, sandaran: true, c: '#8C6A48' });
    const mx = cx + .9, mz = ZE - .55;
    bx(.7, .04, .55, mx, .7, mz, '#E6E2D8', {}); bx(.08, .7, .08, mx, 0, mz, BESI, {});
    kursi(mx - .62, mz, Math.PI / 2, KCOL[ia % 4]); kursi(mx + .62, mz, -Math.PI / 2, KCOL[(ia + 1) % 4]); kursi(cx - 2.0, ZE - .4, .3, KCOL[(ia + 3) % 4]);
    tong(xl + .42, zr + .72, '#4F8F5E');
    spandukSamping(zb, zr, 1.15);
    if (!aR) jendelaKecil(xr, 1.4, zb + 1.1, { rot: Math.PI / 2, w: .8, h: .8, wall: wc });
    if (!aL) talang(xl, 0, H - .1, { z: zr - .3, rot: -Math.PI / 2 });
  } else if (s === 2){
    // ===== SEMBAKO: pelana menghadap jalan (gevel), emperan seng 1,75 berkolom + papan di tepi emperan =====
    const zb = -3.1, zr = 1.0, d = 1.75, yE = 2.95, a = 10 * D2R, zc = (zb + zr) / 2;
    dinding(bw, H, zr - zb, cx, 0, zc, wc, { plinth: .4, adj: A });
    if (!deret){ atapPelana(bw, zr - zb, cx, H, zc, { arah: 'z', gaya: 'dinding', sudut: 26, overhang: .35, ovL: .3, ovR: .3, c: SENGW, cWall: wc, lisplang: 'semua' });
      sengGaris(cx, zc, Math.PI / 2, 0, zr - zb + .6, bw / 2 + .35, 26, H + .02 + .12 / Math.cos(26 * D2R) - .35 * Math.tan(26 * D2R), darken(SENGW, .8)); }
    else { atapPelana(bw, zr - zb, cx, H, zc, { arah: 'x', sudut: 18, overhang: .3, ovL: aL ? 0 : .3, ovR: aR ? 0 : .3, c: SENGW, cWall: wc });
      sengGaris(cx + ((aR ? 0 : .3) - (aL ? 0 : .3)) / 2, zc, 0, 0, bw + (aL ? 0 : .3) + (aR ? 0 : .3), (zr - zb) / 2 + .3, 18, H, darken(SENGW, .8)); }
    const ew = bw - (aL ? 0 : .06) - (aR ? 0 : .06), exm = cx + ((aL ? 0 : .03) - (aR ? 0 : .03));
    emperan(exm, zr, { w: ew, d, y: yE, miring: 10, c: '#8E979C', kolomX: [-ew / 2 + .2, ew / 2 - .2], cKolom: KAYUW, cLantai: '#BFB6A8' });
    // papan nama berdiri di tepi emperan
    const sw = Math.min(3.6, bw - 1.4), zs = zr + d - .3, ys = yE - (d - .3) * Math.tan(a) - .03;
    bx(sw + .14, .76, .06, cx, ys, zs - .07, '#C9B37A', {});
    bx(sw, .68, .1, cx, ys, zs, c, { slot: 1 });
    teks('SEMBAKO', cx, ys + .14, zs + .05, { tinggi: .4, lebarMaks: sw - .3, c: '#EDE8DC', dz: .012 });
    // bukaan toko lebar (tanpa pintu: bukaan = jalan masuk) + papan penutup kayu tersandar
    const ow = Math.min(3.6, bw - 1.9), ox = cx - .25;
    kios(ox, zr, ow, .15 + .8, 1.6, wc);
    for (let k = 0; k < 2; k++) bx(.28, 2.1, .04, ox + ow / 2 + .32 + k * .3, .15, zr + .1 + k * .04, ['#8C6A48', '#9C7A52'][k], { lod: 1, rx: -.06 });   // papan penutup
    // galon, LPG, krat minuman, karung beras di emperan
    galon(xl + .45, zr + .45, { y: .15 }); lpg(xl + .45, .15, zr + .9);
    bx(.5, .3, .36, ox + ow / 2 + .55, .15, zr + .95, '#B5473A', { lod: 1 }); bx(.5, .3, .36, ox + ow / 2 + .55, .45, zr + .95, '#3E6FB0', { lod: 1 });
    bx(.45, .55, .32, cx - ow / 2 + .1, .15, zr + 1.25, '#E6E2D8', { lod: 1 });
    bangku(ox + .6, zr + d + .55 < ZE - .25 ? zr + d + .55 : ZE - .25, { w: 1.6, sandaran: false, c: '#8C6A48' });
    kursi(xr - .7, ZE - .35, -.4, KCOL[ia % 4]);
    tong(xr - .45, zr + d - .55, '#3E6FB0');
    if (!spandukSamping(zb, zr, 1.1)) spanduk(ox, 2.0, zr + d - .02, { w: Math.min(2.4, ow), h: .4, c: '#E6E2D8', teks: SPANDUK, cTeks: '#B5473A' });
    if (!aL) jendelaKecil(xl, 1.4, zb + 1.0, { rot: -Math.PI / 2, w: .8, h: .8, wall: wc });
  } else {
    // ===== PECEL LELE: dapur 2,3 di belakang + terpal di atas 4 tiang, spanduk keliling, meja panjang, gerobak =====
    const zb = -3.1, zr = -.8, zc = (zb + zr) / 2, zt = ZE - .1, yB = 2.7, yF = 2.4;
    dinding(bw, H, zr - zb, cx, 0, zc, wc, { plinth: .4, adj: A });
    atapPelana(bw, zr - zb, cx, H, zc, { arah: 'x', sudut: 20, overhang: .3, ovL: aL ? 0 : .3, ovR: aR ? 0 : .3, c: SENGW, cWall: wc });
    sengGaris(cx + ((aR ? 0 : .3) - (aL ? 0 : .3)) / 2, zc, 0, 0, bw + (aL ? 0 : .3) + (aR ? 0 : .3), (zr - zb) / 2 + .3, 20, H, darken(SENGW, .8));
    pintu(xl + (aL ? 1.0 : .95), zr, { w: .9, h: 2.1, c: '#6B5546', wall: wc, kusen: KUSEN });
    jendelaKecil(cx + .9, 1.3, zr, { w: 1.0, h: .8, wall: wc, nako: true });
    // terpal: dari dinding dapur (y 2,7) turun ke tiang depan (y 2,4)
    const tw = bw - (aL ? 0 : .1) - (aR ? 0 : .1), tcx = cx + ((aL ? 0 : .05) - (aR ? 0 : .05)), L = zt - zr, ang = Math.atan2(yB - yF, L);
    const cT = ['#3C6FA8', '#D9762B', '#3C6FA8', '#4F7A55'][(ia + s) % 4];
    taruh(R0, 'box', tw, .05, Math.hypot(L, yB - yF) + .04, tcx, (yB + yF) / 2, (zr + zt) / 2, cT, { slot: 0, rx: ang });
    const tx0 = tcx - tw / 2 + .08, tx1 = tcx + tw / 2 - .08;
    for (const px of [tx0, tx1]) for (const pz of [zr + .2, zt - .08]) bx(.12, (pz > 0 ? yF : yB) - .02, .12, px, 0, pz, '#9C9A92', {});   // tiang besi
    // spanduk keliling: depan (judul) + 2 sisi
    bx(tw, .55, .03, tcx, yF - .55, zt - .015, '#E6E2D8', {});
    teks('PECEL LELE', tcx, yF - .47, zt, { tinggi: .36, lebarMaks: tw - .4, c: '#B5473A', dz: .012 });
    bx(tw, .07, .035, tcx, yF - .62, zt - .015, '#B5473A', {});   // pita merah bawah spanduk (tipis → detail dekat)
    for (const [px, sx] of [[tx0 - .06, -1], [tx1 + .06, 1]]){ if ((sx < 0 && aL) || (sx > 0 && aR)) continue;
      const g = rangka(px, 0, (zr + zt) / 2 + .1, sx * Math.PI / 2); taruh(g, 'box', L - .3, .42, .03, 0, yF - .03 - .21, 0, cT, { slot: 0 });
      if (sx < 0 || aL) teks(sx < 0 ? SPANDUK : 'SEAFOOD', px + sx * .02, yF - .03 - .35, (zr + zt) / 2 + .1, { rot: sx * Math.PI / 2, tinggi: .28, lebarMaks: L - .8, c: '#EDE8DC', dz: .01 }); }
    // meja panjang + 2 bangku, gerobak di pojok depan, lampu gantung
    const mx = cx - .7, mz = zr + 1.75;
    bx(2.5, .05, .75, mx, .72, mz, '#C9BFA6', {}); for (const sx of [-1, 1]) bx(.05, .72, .6, mx + sx * 1.05, 0, mz, '#6B5546', {});
    bangku(mx, mz - .68, { w: 2.3, sandaran: false, c: '#8C6A48' }); bangku(mx, mz + .68, { w: 2.3, sandaran: false, c: '#8C6A48' });
    gerobak(tx1 - 1.05, zt - .62, { c: '#E6E2D8', teks: 'LELE' });
    taruh(R0, 'box', .14, .18, .14, mx, yB - .45, mz, LAMPU, { glow: true }); bx(.02, .2, .02, mx, yB - .3, mz, BESI, {});
    tong(xl + (aL ? .4 : .45), zr + .45, '#3E6FB0');
    kursi(mx + 1.75, mz - .1, -Math.PI / 2, KCOL[ia % 4]);
    if (!aR) talang(xr, 0, H - .05, { z: zr - .25, rot: Math.PI / 2 });
  }
};
