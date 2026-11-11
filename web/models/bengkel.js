/* bengkel (2×1) — spek-gaya §6 no. 7. Bengkel pinggir jalan khas Indonesia, 1 lantai usaha (LANTAI_USAHA 4,2).
   Unsur tetap: 2 pintu gulung 3,0 (satu terbuka: ruang kerja gelap + papan perkakas + rak oli), papan nama berdiri di tepi kanopi,
   kanopi seng 1,6 kantilever berkonsol + talang, pelataran beton, tumpukan ban (ban per ban, warna selang-seling), kompresor tangki,
   2 drum oli, halaman samping berpagar kawat, atap seng bergaris sambungan, talang tegak, jendela samping, iklan cat tembok (seed genap).
   Varian seed: 0 BENGKEL MOTOR — pelana seng sejajar jalan, 2 bilik + kantor kasir (pintu + jendela), motor diservis, halaman kanan
                1 BAN VELG — dua pelana kembar menghadap jalan, kedua bilik terbuka, menara ban, papan 'TAMBAL BAN', halaman kiri
                2 LAS LISTRIK — atap dak + parapet + toren, panel teralis hasil las tersandar, tabung gas, meja las, halaman kanan
                3 BENGKEL MOBIL — gevel palsu tinggi berpapan nama, bilik mobil 4,0 + toko onderdil (pintu gulung tergulung + rak), halaman kiri
   Tapak sempit (diputar tanpa tukar w/h, LW < 12): 1 bilik + pintu, pelana menghadap jalan, halaman samping tetap.
   Semua tonjolan (kanopi, papan, ban, kompresor) berhenti di z ≤ LD/2 dan |x| ≤ LW/2. */
CAT.bengkel.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3;
  const LW = fx + .8, LD = fz + .8, H = LANTAI_USAHA, ZE = LD / 2 - .05, lebar = LW >= 12;
  const kanan = s % 2 === 0, yard = lebar ? 2.4 : 2.0, bw = LW - .55 - yard;   // sisi tanpa halaman: ,5 dari batas (teritis ,45 tetap di kavling)
  const xl = kanan ? -LW / 2 + .5 : -LW / 2 + yard + .05, xr = xl + bw, cx = (xl + xr) / 2;
  const zf = LD / 2 - 2.45, zb = -LD / 2 + .5, bd = zf - zb, zc = (zb + zf) / 2;
  const yx0 = kanan ? xr : -LW / 2 + .05, yx1 = kanan ? LW / 2 - .05 : xl, ycx = (yx0 + yx1) / 2, yw = yx1 - yx0, sx0 = kanan ? 1 : -1;   // halaman samping
  const ia = Math.max(0, AKSEN.indexOf(c)), SENGB = ['#8E979C', '#6E7F8A', '#8E979C', '#7E5A44'][s], BAN = '#1E1C1A';
  const R0 = rangka(0, 0, 0, 0);
  const bx = (sx, sy, sz, x, y, z, col, o) => taruh(R0, 'box', sx, sy, sz, x, y + sy / 2, z, col, Object.assign({ slot: 0 }, o));
  // ---- tumpukan ban: satu primitif per ban (pita 8 sisi = 16 segitiga; ban teratas + tutup 6), warna selang-seling + kulit siluet per ban
  //      → terbaca sebagai tumpukan ban, bukan drum. Geometri sendiri di-cache di _GEO (c1b). ----
  const banGeo = n => { const key = 'bengkel|ban|' + n, G1 = _GEO.get(key); if (G1) return G1;   // n = 1 tanpa tutup / 2 dengan tutup atas (satu ban)
    const seg = 8, P0 = (a, y, r) => [Math.cos(a) * r, y, Math.sin(a) * r], t = [], e = [];
    const tri = (a, b, d, out) => { const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
      const nx = u[1] * v[2] - u[2] * v[1], ny = u[2] * v[0] - u[0] * v[2], nz = u[0] * v[1] - u[1] * v[0];
      if (nx * out[0] + ny * out[1] + nz * out[2] < 0) t.push(...a, ...d, ...b); else t.push(...a, ...b, ...d); };
    for (let k = 0; k < seg; k++){ const a0 = k / seg * Math.PI * 2, a1 = (k + 1) / seg * Math.PI * 2, am = (a0 + a1) / 2, out = [Math.cos(am), 0, Math.sin(am)];
      const A = P0(a0, -.5, .5), B = P0(a1, -.5, .5), Cc = P0(a1, .5, .5), D = P0(a0, .5, .5);
      tri(A, B, Cc, out); tri(A, Cc, D, out); e.push(...D, ...Cc, ...A, ...B);
      if (n === 2){ tri([0, .5, 0], D, Cc, [0, 1, 0]); } }
    const G2 = _geoFrom(t, e); _GEO.set(key, G2); return G2; };
  const ban = (x, z, n, lod) => { let q; for (let k = 0; k < n; k++){ const G0 = banGeo(k === n - 1 ? 2 : 1), dx = ((k * 7) % 3 - 1) * .025, dz = ((k * 5) % 3 - 1) * .025;
    q = taruh(R0, 'custom', .66, .2, .66, x + dx, .1 + k * .205, z + dz, k % 2 ? '#34312E' : BAN, { geo: G0.geo, edges: G0.edges, slot: 0, lod }); } return q; };
  const banTegak = (x, y, z, rot) => taruh(rangka(x, y, z, rot || 0), 'cylLo', .66, .2, .66, 0, .33, 0, BAN, { rx: Math.PI / 2, slot: 0 });
  const drum = (x, z, col) => { const q = cylLo(.29, .88, x, 0, z, col); q.lod = 1; return q; };
  const kompresor = (x, z, rot) => { const f = rangka(x, 0, z, rot || 0);
    taruh(f, 'cylLo', .56, 1.05, .56, 0, .5, 0, '#B4443A', { rx: Math.PI / 2, ry: Math.PI / 2, slot: 0 });   // tangki (sumbu x lokal)
    taruh(f, 'box', .42, .3, .3, -.15, .92, 0, '#3A3F44', { slot: 0 });                                     // motor listrik
    for (const s2 of [-1, 1]) taruh(f, 'box', .06, .22, .3, s2 * .38, .11, 0, BESI, { slot: 0 }); };        // kaki (tipis → dekat)
  const papanBan = (x, z) => { bx(.1, 2.5, .1, x, 0, z, '#7A5A3A', {});
    bx(1.4, .5, .05, x, 1.95, z + .08, '#E6E2D8', {}); teks('TAMBAL BAN', x, 2.05, z + .105, { tinggi: .26, lebarMaks: 1.25, c: '#B5473A', dz: .01 });
    banTegak(x, 1.0, z + .2, 0); };
  // ruang kerja terbuka: papan perkakas + rak oli (detail dekat) di depan bidang gelap pintu gulung
  const isiBilik = (x, w) => { bx(1.5, .9, .03, x - w * .2, 1.25, zf + .07, '#8C6A48', { lod: 1, noEdge: true });
    for (let k = 0; k < 2; k++) bx(.07, .45 + k * .1, .03, x - w * .2 - .3 + k * .6, 1.4, zf + .1, ['#B4443A', '#3E6FB0'][k], {});
    bx(.9, .05, .25, x + w * .25, 1.1, zf + .13, '#6B5546', { lod: 1, noEdge: true });
    for (let k = 0; k < 2; k++) bx(.24, .3, .14, x + w * .25 - .2 + k * .4, 1.15, zf + .13, ['#C2913A', '#4F7A55', '#B4443A'][(k + s) % 3], { lod: 1, noEdge: true }); };
  // pagar kawat: jaring jeruji 2 muka + rel, tiang di kedua ujung
  const pagarKawatSegmen = (x0, x1, z, h) => { const L = x1 - x0, f = rangka((x0 + x1) / 2, 0, z, 0);
    _jeruji(f, L, h, 0, 0, 0, Math.max(4, Math.round(L / .2)), '#8E979C', { batang: .025, rel: .05, lod: 0, satu: 0 });
    for (const px of [-L / 2 + .04, L / 2 - .04]) taruh(f, 'box', .08, h + .1, .08, px, (h + .1) / 2, 0, '#6F6A60', { slot: 0 }); };

  // garis sambungan seng gelombang di kedua bidang atap pelana: n pita gelap ,1 m menuruni lereng (satu primitif custom/bidang, detail dekat lod 1)
  // (x,z) = pusat atap, rot = 0 bubungan sejajar x lokal / π/2 sejajar z, dx = geser x lokal (teritis tak simetris), L = panjang atap, run = datar teritis→bubungan
  const sengGaris = (x, z, rot, dx, L, run, sud, yEave, col, jarak) => {
    const a = sud * D2R, n = Math.max(3, Math.round(L / (jarak || .9))), wu = .05 / L, key = 'seng|' + n + '|' + wu.toFixed(4);
    let G0 = _GEO.get(key); if (!G0){ const t = []; for (let i = 0; i < n; i++){ const xc = -.5 + (i + .5) / n; t.push(xc - wu, 0, -.5, xc - wu, 0, .5, xc + wu, 0, .5, xc - wu, 0, -.5, xc + wu, 0, .5, xc + wu, 0, -.5); }
      G0 = _geoFrom(t, null); _GEO.set(key, G0); }
    const f = rangka(x, 0, z, rot || 0), Ls = run / Math.cos(a) - .04;
    for (const sd of [1, -1]) taruh(f, 'custom', L - .04, 1, Ls, dx || 0, yEave + run * Math.tan(a) / 2 + .025 * Math.cos(a), sd * (run / 2 + .025 * Math.sin(a)), col, { geo: G0.geo, edges: null, rx: sd * a, noHull: true, noEdge: true, lod: 1, slot: 0 }); };
  // ---- badan ----
  dinding(bw, H, bd, cx, 0, zc, wl, { plinth: .55, cPlinth: '#6F6A60', lis: s === 2 ? [] : [3.25] });
  // ---- atap ----
  if (s === 1 && lebar){
    // teritis depan/belakang kedua atap beda 4 cm → segitiga gevel & pita di lembah tengah tidak sebidang (anti z-fight)
    for (const k of [-1, 1]){ atapPelana(bw / 2, bd, cx + k * bw / 4, H, zc, { arah: 'z', sudut: 22, overhang: .3, ovL: k < 0 ? .35 : .39, ovR: k < 0 ? .3 : .34, c: SENGB, cWall: wl });
      sengGaris(cx + k * bw / 4, zc, Math.PI / 2, -.025, bd + (k < 0 ? .65 : .73), bw / 4 + .3, 22, H, darken(SENGB, .8), 1.0); }
  } else if (s === 2){
    atapDatar(bw, bd, cx, H, zc, { parapet: .7, c: '#B8B2A6', cParapet: wl, slotParapet: 2 });
    bx(1.3, .3, 1.3, xl + bw * .22, H + .12, zb + 1.0, '#9E9A90', {}); tandon(xl + bw * .22, H + .42, zb + 1.0, { c: '#D9762B', kaki: 0 });   // toren di atas umpak beton
  } else if (s === 3 && lebar){
    const Hf = H + 1.5;
    bx(bw, Hf - H, .25, cx, H, zf - .125, wl, { wall: true, slot: 2 });
    bx(bw + .1, .12, .4, cx, Hf, zf - .15, darken(wl, .82), {});
    const zr0 = zb - .4, zr1 = zf - .25;   // atap berhenti di balik gevel palsu (teritis depan tidak menembus muka)
    atapPelana(bw, zr1 - zr0, cx, H, (zr0 + zr1) / 2, { arah: 'x', sudut: 18, overhang: 0, ovD: 0, ovL: .4, ovR: .4, c: SENGB, cWall: wl });
    sengGaris(cx, (zr0 + zr1) / 2, 0, 0, bw + .8, (zr1 - zr0) / 2, 18, H, darken(SENGB, .8), 1.2);
  } else { atapPelana(bw, bd, cx, H, zc, { arah: lebar ? 'x' : 'z', sudut: 20, overhang: .45, c: SENGB, cWall: wl });
    sengGaris(cx, zc, lebar ? 0 : Math.PI / 2, 0, (lebar ? bw : bd) + .9, (lebar ? bd : bw) / 2 + .45, 20, H, darken(SENGB, .8), 1.2); }

  // papan nama berdiri di tepi depan kanopi (terlihat dari jalan & dari atas; papan di dinding tertutup kanopi 1,6)
  const kd = 1.6, ky = 3.22, a8 = 8 * D2R;
  const papanKanopi = (x, w) => { const zs = zf + kd - .14, ys = ky - (kd - .14) * Math.tan(a8) - .04;
    bx(w + .14, .8, .06, x, ys, zs - .08, '#C9B37A', {}); bx(w, .72, .1, x, ys, zs, c, { slot: 1 });
    teks(NAMA, x, ys + .16, zs + .05, { tinggi: .4, lebarMaks: w - .4, c: '#EDE8DC', dz: .012 }); };
  // ---- muka: bilik, pintu, jendela, papan nama ----
  const b1 = xl + .45 + 1.65, b2 = b1 + 3.6, dw = 3.0, bk = lebar ? b1 : xl + 1.95;
  const NAMA = lebar ? ['BENGKEL MOTOR', 'BAN VELG', 'LAS LISTRIK', 'BENGKEL MOBIL'][s] : ['BENGKEL', 'BAN', 'LAS', 'BENGKEL'][s];
  if (lebar){
    if (s === 3){
      // bilik mobil lebar (4,0) + toko onderdil (pintu gulung tergulung + rak barang)
      const bm = xl + .45 + 2.15;
      rollingDoor(bm, zf, { w: 4.0, h: 3.0, buka: .82, isi: false, wall: wl, c: '#8A939A' }); isiBilik(bm, 4.0);
      { const cm = ['#C9D3DC', '#3E5A82', '#B4443A', '#E5E1D8'][ia % 4], mx = bm + .2, mz = zf + .85;   // mobil diservis, separuh di dalam bilik
        bx(1.75, .62, 2.0, mx, .32, mz - .1, cm, {}); bx(1.55, .55, 1.0, mx, .94, mz - .7, darken(cm, .92), {});
        taruh(R0, 'box', 1.4, .48, .05, mx, 1.2, mz - .18, '#6A7F95', { slot: 0, rx: -.5 });   // kaca depan (tidak menyala malam)
        bx(1.6, .2, .06, mx, .45, mz + .9, '#2B2B2B', {}); for (const sx of [-1, 1]){ bx(.24, .62, .62, mx + sx * .82, .0, mz + .35, BAN, {}); } }
      rollingDoor(bm + 4.45, zf, { w: dw - .4, h: 2.8, buka: .8, isi: true, meja: false, wall: wl, c: '#8A939A', seedIsi: s });
      papanNama(cx, H + .3, zf, { w: Math.min(8.5, bw - 1.6), h: 1.0, c, slot: 1, teks: NAMA, cTeks: '#EDE8DC' });
      const xo = bm + 6.65; pintu(xo, zf, { w: .9, h: 2.1, c: '#6B5546', wall: wl, kusen: KUSEN, panel: false });
      jendela(xo + 1.72, 1.1, zf, { w: 1.2, h: 1.3, wall: wl });
    } else {
      rollingDoor(b1, zf, { w: dw, h: 3.0, buka: s === 1 ? .85 : .72, isi: false, wall: wl, c: '#8A939A' }); isiBilik(b1, dw);
      if (s === 1) rollingDoor(b2, zf, { w: dw, h: 3.0, buka: .6, isi: false, wall: wl, c: '#8A939A' });
      else rollingDoor(b2, zf, { w: dw, h: 3.0, buka: 0, wall: wl, c: '#8E979C', jarakGaris: .5 });
      papanKanopi((b1 + b2) / 2, 6.4);
      const xo = b2 + 2.4;
      if (s === 1){ ban(b2 - .55, zf + .45, 4, 1); ban(b2 + .35, zf + .5, 3, 1); ban(xo + .3, zf + .45, 5); }   // menara ban jualan
      else if (xo + .6 < xr - .3){ pintu(xo, zf, { w: .9, h: 2.1, c: s === 2 ? '#3A3F44' : '#6B5546', wall: wl, kusen: KUSEN, panel: false });
        if (xo + 2.0 < xr - .3) jendela(xo + 1.55, 1.1, zf, { w: 1.3, h: 1.3, wall: wl, kusen: KUSEN });
        if (s !== 2) lampuDinding(xo, 2.65, zf, {}); }
    }
  } else {
    rollingDoor(bk, zf, { w: dw, h: 3.0, buka: .72, isi: false, wall: wl, c: '#8A939A' }); isiBilik(bk, dw);
    pintu(xr - .75, zf, { w: .85, h: 2.1, c: '#6B5546', wall: wl, kusen: KUSEN, panel: false });
    papanKanopi(cx, bw - 1.0);
    lampuDinding(xr - .75, 2.6, zf, {});
  }
  // ---- kanopi seng kantilever + konsol, pelataran beton bernoda oli ----
  const kw = bw - .2;
  emperan(cx, zf, { w: kw, d: kd, y: ky, miring: 8, c: SENGB, kolomX: [], lantai: false });
  const nk = lebar ? 4 : 2; for (let k = 0; k < nk; k++){ const x = cx - kw / 2 + .4 + k * (kw - .8) / (nk - 1), dz = kd - .25, dy = .6, L = Math.hypot(dz, dy);
    taruh(R0, 'box', .06, .06, L, x, ky - .03 - dz * Math.tan(8 * D2R) - dy / 2, zf + dz / 2, BESI, { slot: 0, rx: -Math.atan2(dy, dz) }); }
  bx(LW - .14, .1, ZE - zf + .05, 0, 0, (zf - .05 + ZE) / 2, '#9E9A90', { ao: .9 });
  if (s === 1 || s === 2) bx(1.4, .02, .9, bk + .3, .1, zf + 1.0, '#6F6A60', { lod: 1, noEdge: true });   // noda oli
  // ---- isi pelataran per varian ----
  if (s === 0 || (!lebar && s !== 2)) motor(bk + .2, zf + 1.3, { rot: .15, c: ['#B4443A', '#3E5A82', '#2E3A40', '#B4443A'][(s + ia) % 4] });
  if (s === 2) bx(.5, .28, .28, bk - 1.0, .1, zf + .55, '#B4443A', { lod: 1 });      // kotak perkakas
  ban(xl + .5, zf + .45, 3);
  if (s === 1) papanBan(lebar ? b1 + .2 : cx, ZE - .25);
  if (s === 2){ // panel teralis/pagar hasil las tersandar + tabung gas + meja las
    for (let k = 0; k < 2; k++) _jeruji(rangka(b2 - .8 + k * 1.3, 0, zf + .5 + k * .08, 0), 1.2, 1.6, 0, .1, 0, 6, ['#2B2B2B', '#4F7A55'][k], { batang: .05, rel: .07, lod: 0, satu: 1 });
    for (let k = 0; k < 2; k++) cylLo(.13, 1.25, b2 + 1.15 + k * .3, .1, zf + .3, ['#3F7D92', '#B4443A'][k]);
    bx(1.1, .06, .6, bk + .2, .82, zf + 1.4, '#5E666C', {}); bx(.9, .72, .5, bk + .2, .1, zf + 1.4, '#3A3F44', { lod: 1 }); }
  // ---- halaman samping: pagar kawat (sisi jalan), kompresor di luar, drum + ban bekas di dalam ----
  if (yw > 1.2){
    const zp = zf - .25;
    pagarKawatSegmen(yx0 + (kanan ? .08 : 0), yx1 - (kanan ? 0 : .08), zp, 1.8);
    drum(ycx - sx0 * .35, zp - .7, '#3E6FB0'); drum(ycx + sx0 * .4, zp - 1.25, ['#4F7A55', '#B4443A'][s % 2]);
    if (s !== 2) ban(ycx + sx0 * .3, zb + 1.1, 2, 1);
    kompresor(ycx, zf + .75, sx0 > 0 ? Math.PI / 2 : -Math.PI / 2);
  }
  // ---- samping: talang, jendela samping ----
  talang(kanan ? xl : xr, 0, H - .1, { z: zf - .3, rot: kanan ? -Math.PI / 2 : Math.PI / 2 });
  if (s !== 1) jendelaKecil(kanan ? xl : xr, 2.2, zc - 1.0, { rot: kanan ? -Math.PI / 2 : Math.PI / 2, w: 1.2, h: .7, wall: wl });
  if (s % 2 === 0 && bd > 3.5){ const xs = kanan ? xl : xr, rs = kanan ? -Math.PI / 2 : Math.PI / 2, g = rangka(xs, 0, zc + .9, rs), dw2 = Math.min(3.0, bd - 2.2), cI = ['#C2913A', '#3F7D92', '#4F7A55', '#9C4935'][(s + ia) % 4];   // iklan cat tembok
    taruh(g, 'box', dw2, 1.2, .04, 0, 1.25, 0, cI, { attach: 'z+', slot: 0, noHull: true });
    teks(s === 2 ? 'LAS' : 'OLI', xs, .95, zc + .9, { rot: rs, tinggi: .6, lebarMaks: dw2 - .4, c: '#EDE8DC', dz: .035 }); }
};
