/* ruko (1×1, BARU) — spek-tata-kota §2/§3.2 (zona CBD/RUKO/RUKO_KECIL, 2–4 lantai dari floorsFor: kelas 3 → 4, 2 → 3, lain 2).
   Rumah toko deret khas Indonesia, muka 1 kavling (± 7,2–8 m):
     lantai dasar usaha LANTAI_USAHA 4,2: emperan keramik ditinggikan ,3 + 1 anak tangga (di dalam kavling), bukaan usaha per seed,
       dak beton/kanopi cor menjorok sampai batas kavling depan (TIDAK ke trotoar) + papan nama berdiri di tepi dak + 2 lampu sorot,
     lantai atas (3,2): jendela berkusen + ambang, AC luar, lis lantai; seed 1 balkon besi + pintu kaca; seed 2 jendela lebar + teralis,
     puncak: parapet (tinggi beda per warna dinding & seed) dengan 4 bentuk: 0 lis profil ganda · 1 atap genteng tempel miring ·
       2 parapet bertingkat dengan panel angka tahun · 3 atap dak + pagar pita + rumah tangga + jemuran,
     atap: dak beton, toren air oranye/biru di rangka besi, antena/parabola, kompresor AC.
   Pilaster netral di kedua sisi muka (sisi deret = separuh lebar, rapat ke batas) → deret ruko menyatu (dak, papan, lis sama tinggi),
   beda warna dinding/papan/parapet. Sisi bebas (bukan deret): iklan cat tembok + talang + jendela kecil.
   Seed (ctx.seed): 0 toko sembako (rolling door terbuka + isi) · 1 apotek/optik (etalase + pintu kaca) ·
   2 toko tertutup (rolling door + pintu besi + motor) · 3 rumah makan (2 rolling door, satu terbuka). */
// lis profil (cornice) di muka: pita menonjol, sisi deret tidak melewati batas kavling
// balkon besi hemat: pelat + jeruji satu muka (dilihat dari jalan) + pegangan + konsol (balkon() bawaan memakai jeruji 2 muka)
function ruko_balkon(x, y, z, w, j, c){ const f = rangka(x, y, z, 0), hr = .95;
  taruh(f, 'box', w, .15, j + .03, 0, .075, (j - .03) / 2, '#BFB6A8', { slot: 0 });
  _jeruji(f, w - .04, hr - .2, 0, .15, j - .04, Math.max(5, Math.round(w / .15)), c, { lod: 0, satu: 1 });
  for (const sx of [-1, 1]) _jeruji(f.sub(sx * (w / 2 - .02), 0, (j - .04) / 2, sx * Math.PI / 2), j - .06, hr - .2, 0, .15, 0, 4, c, { lod: 1, satu: 1 });
  taruh(f, 'box', w, .1, .12, 0, .15 + hr - .13, j - .04, c, { slot: 0 });
  for (const sx of [-1, 1]) taruh(f, 'box', .1, .25, j * .7, sx * (w / 2 - .3), -.125, j * .35, '#A9A398', { slot: 0, lod: 1 }); }
function ruko_lisProfil(X0, X1, y, z, h, jorok, c, A){ const e = .06, x0 = X0 - (A.l ? 0 : e), x1 = X1 + (A.r ? 0 : e);
  return box(x1 - x0, h, jorok, (x0 + x1) / 2, y, z + jorok / 2 - .02, c); }
// motor parkir di atas lantai yang ditinggikan (motor() bawaan selalu di y=0): rangka sendiri di y; roda Ø,52, dek kaki gelap,
// bodi belakang + perisai kaki warna cerah, jok hitam terpisah, spakbor depan, setang. Menghadap +z lokal (2 silinder + 6 kotak ≈ 136 segitiga).
function ruko_motor(x, y, z, rot, c){ const f = rangka(x, y, z, rot), cb = campur(c, '#F2EEE6', .28);
  for (const zz of [-.6, .6]) taruh(f, 'cylLo', .52, .09, .52, 0, .26, zz, '#1E1C1A', { rx: Math.PI / 2, ry: Math.PI / 2, slot: 0, noEdge: true });
  taruh(f, 'box', .3, .1, .6, 0, .36, .02, '#3A3D40', { slot: 0 });                               // dek kaki
  const q = taruh(f, 'box', .34, .34, .66, 0, .6, -.32, cb, { slot: 0 });                       // bodi belakang (mesin + bagasi)
  taruh(f, 'box', .3, .1, .62, 0, .82, -.3, '#2B2B2B', { slot: 0 });                             // jok
  taruh(f, 'box', .34, .72, .14, 0, .7, .34, cb, { slot: 0 });                                  // perisai kaki + kepala setang
  taruh(f, 'box', .14, .06, .44, 0, .55, .6, cb, { slot: 0, lod: 1 });                          // spakbor depan
  taruh(f, 'box', .64, .045, .045, 0, 1.08, .34, BESI, { slot: 0 });                            // setang
  return q; }
// toren air hemat: tangki silinder di atas 2 rangka kaki pipih + pelat (tandon() bawaan: 4 kaki + tutup ≈ 124 segitiga → 68)
function ruko_tandon(x, y, z, c, kk){ const r = .5;
  for (const a of [-1, 1]) box(.06, kk, r * 1.4, x + a * r * .7, y, z, BESI);
  box(r * 2 + .1, .08, r * 2 + .1, x, y + kk, z, BESI); return cylLo(r, 1.1, x, y + kk + .08, z, c === 'biru' ? '#3E6FB0' : c); }
CAT.ruko.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, A = ctx.adj || {}, aL = !!A.l, aR = !!A.r;
  const LW = fx + .8, LD = fz + .8, n = clamp(floors || 3, 2, 4), H = LANTAI_USAHA + (n - 1) * LANTAI;
  const X0 = aL ? -LW / 2 : -fx / 2, X1 = aR ? LW / 2 : fx / 2, bw = X1 - X0, cx = (X0 + X1) / 2;
  const zF = LD / 2 - .05;                                   // tepi depan yang boleh dipakai (tangga, dak, papan) — tidak ke trotoar
  const zf = LD / 2 - 1.45, zb = -LD / 2 + .5, dep = zf - zb, zc = (zb + zf) / 2;
  const iw = Math.max(0, WALLS.indexOf(wl)), ia = Math.max(0, AKSEN.indexOf(c));
  const PIL = '#D6D0C4', pwL = aL ? .16 : .32, pwR = aR ? .16 : .32;      // pilaster netral: sisi deret separuh (dua ruko → satu pilaster ,32)
  const xi0 = X0 + pwL, xi1 = X1 - pwR, iwd = xi1 - xi0, icx = (xi0 + xi1) / 2;   // bidang muka di antara pilaster
  const tT = .3, yDak = 3.38, tDak = .22, yDakA = yDak + tDak;               // emperan ,3 · dak cor (bawah 3,38, atas 3,60) — sama untuk semua seed (deret menyatu)
  const ph = [.95, 1.15, .75, .55][s] + (iw % 3) * .3;                       // tinggi parapet beda per seed & warna dinding
  const kusen = [KUSEN, '#7A5A3A', KUSEN, '#5E666C'][s];
  // ---- badan + lis lantai ----
  const lis = []; for (let f = 1; f < n; f++) lis.push(LANTAI_USAHA + (f - 1) * LANTAI - .06);
  dinding(bw, H, dep, cx, 0, zc, wl, { plinth: .45, cPlinth: '#8E8A84', lis, adj: A });
  // ---- pilaster muka: bawah (emperan → dak) & atas (dak → parapet + kepala) ----
  const yPil = H + ph + .12;
  for (const [x0, w] of [[X0, pwL], [X1 - pwR, pwR]]){
    box(w, yDak - tT, .2, x0 + w / 2, tT, zf + .1, PIL);
    box(w, yPil - yDakA, .2, x0 + w / 2, yDakA, zf + .1, PIL);
    const kw = w > .2 ? w + .08 : w; box(kw, .14, .28, x0 + w / 2, yPil, zf + .1, darken(PIL, .86)); }   // kepala pilaster (sisi deret: tidak melewati batas)
  // ---- emperan keramik + anak tangga (semua di dalam kavling) ----
  const cLant = ['#C9BFA6', '#B6AFA2', '#CFC3AE', '#BFB6A8'][s];
  box(bw, tT, zF - .32 - zf, cx, 0, (zf + zF - .32) / 2, cLant);
  box(bw - (aL ? 0 : .2) - (aR ? 0 : .2), .15, .3, cx + ((aL ? 0 : .2) - (aR ? 0 : .2)) / 2, 0, zF - .17, darken(cLant, .9));
  // ---- dak cor (kanopi beton) sampai batas depan + papan nama berdiri di tepinya + lampu sorot ----
  box(bw, tDak, zF - zf, cx, yDak, (zf + zF) / 2, '#CFC9BC');
  box(bw - .04, .08, .06, cx, yDak - .06, zF - .05, '#9C968C');   // tetes air (garis bawah tepi dak)
  const KATA = [['SEMBAKO', 'GROSIR', 'TOKO 88', 'KELONTONG'], ['APOTEK', 'OPTIK', 'KLINIK', 'PULSA HP'], ['ELEKTRONIK', 'MEBEL', 'BENGKEL', 'MATERIAL'], ['WARTEG', 'BAKSO', 'SOTO', 'MIE AYAM']][s];
  const kata = KATA[(iw + ia) % 4], cTeks = (iw + s) % 3 === 0 ? '#E8C76A' : '#EDE8DC';
  papanNama(cx, yDakA + .03, zF - .17, { w: bw - .42, h: .78, c, slot: 1, teks: kata, cTeks });
  for (const k of [-1, 1]) taruh(rangka(icx + k * iwd * .28, yDak - .04, zf + .55, 0), 'box', .28, .05, .28, 0, 0, 0, LAMPU, { glow: true, noEdge: true });
  // ---- lantai dasar per seed (bukaan di bidang muka antara pilaster, alas di atas emperan) ----
  if (s === 0){   // toko sembako: rolling door hampir tergulung penuh + rak + meja kaca; kardus & galon di emperan
    rollingDoor(icx, zf, { y: tT, w: iwd - .8, h: 2.75, buka: .82, wall: wl, isi: true, meja: true, seedIsi: iw });
    kardus(xi0 + .45, tT, zf + .45, { n: 3 }); galon(xi1 - .4, zf + .35, { y: tT });
  } else if (s === 1){   // apotek/optik: etalase + pintu kaca + boven; pot di emperan; stiker
    const we = iwd - 2.15; etalase(xi0 + .3 + we / 2, zf, { y0: tT, y: .45, w: we, h: 2.25, wall: wl, ambang: '#7E8790', teks: ['BUKA', '24 JAM', 'BUKA', 'OBAT'][iw % 4] });
    pintu(xi1 - .25 - .6, zf, { y: tT, w: 1.05, h: 2.25, c: '#3A3F44', kaca: true, kusen: BINGKAI, wall: wl, boven: true });
    if (n > 2) pot(xi1 - .3, zF - .55, .8, { y: tT, kotak: true, bunga: '#C9708A' });
  } else if (s === 2){   // toko tertutup: rolling door + pintu besi samping; motor parkir sejajar muka
    const wr = iwd - 1.75; rollingDoor(xi0 + .3 + wr / 2, zf, { y: tT, w: wr, h: 2.75, buka: 0, wall: wl, c: '#8E979C', jarakGaris: .42 });
    pintu(xi1 - .25 - .5, zf, { y: tT, w: .9, h: 2.2, c: '#5E666C', panel: true, kusen: '#5E666C', wall: wl });
    ruko_motor(icx - .2, tT, zf + .62, Math.PI / 2 + .12, ['#B4443A', '#3E5A82', '#2E3A40', '#C9D3DC'][iw % 4]);
  } else {   // rumah makan: dua rolling door, kiri tertutup, kanan terbuka (meja + etalase lauk), spanduk di dak
    const wd = (iwd - .9) / 2;
    rollingDoor(xi0 + .3 + wd / 2, zf, { y: tT, w: wd, h: 2.75, buka: 0, wall: wl, c: '#8A939A', jarakGaris: .45 });
    rollingDoor(xi1 - .3 - wd / 2, zf, { y: tT, w: wd, h: 2.75, buka: .85, wall: wl, isi: true, meja: true, seedIsi: iw + 3 });
    if (n > 2) bangku(xi0 + .3 + wd / 2, zf + .55, { w: 1.5, y: tT, c: '#8C6A48' });
  }
  meteranListrik(xi1 - .12, 1.55, zf, { rot: 0 }); { const xn = X0 + .17, zn = zf + .2;   // pelat nomor di muka pilaster kiri (bebas dari reveal/rel rolling door)
    taruh(rangka(xn, 2.5, zn, 0), 'box', .3, .22, .03, 0, .11, .015, '#3A3D40', { slot: 0, noHull: true });
    teks(String(10 + iw * 3 + s), xn, 2.535, zn, { tinggi: .15, lebarMaks: .26, c: '#EDE8DC', dz: .04 }); }
  // ---- lantai atas ----
  for (let f = 1; f < n; f++){ const yF = LANTAI_USAHA + (f - 1) * LANTAI, top = f === n - 1;
    if (s === 1 && f === 1){   // balkon besi + pintu kaca dobel + jendela kecil; pot di balkon
      ruko_balkon(icx - .35, yF + .02, zf, iwd - 1.6, .75, BESI);
      pintu(icx - .75, zf, { y: yF + .17, w: 1.5, h: 2.25, daun: 2, c: '#3A3F44', kaca: true, kusen: KUSEN, wall: wl });
      jendelaKecil(xi1 - .65, yF + 1.1, zf, { w: .7, h: 1.0, wall: wl, kusen });
      ac(xi1 - .65, yF + .25, zf, {}); taruh(rangka(icx - .35 + (iwd - 1.6) * .25, yF + .02 + 1.0, zf + .8, 0), 'box', .55, .5, .03, 0, -.22, .02, ['#B5473A', '#4C6A96', '#C2913A', '#E6E2D8'][iw % 4], { slot: 0, lod: 1, noEdge: true, noHull: true });   // handuk dijemur di pegangan balkon
      continue; }
    if (s === 2){   // jendela lebar 3 daun + teralis (lantai tengah) / jendela kecil kamar mandi + AC
      jendela(icx - .55, yF + .95, zf, { w: 2.7, h: 1.4, wall: wl, kusen, palang: true, palangH: true, teralis: !top, topi: top });
      jendelaKecil(xi1 - .55, yF + 1.55, zf, { w: .55, h: .55, wall: wl, kusen, nako: true });
      ac(xi1 - .6, yF + .3, zf, {}); continue; }
    const nW = 2, ww = s === 3 ? .95 : 1.15;
    for (let k = 0; k < nW; k++){ const x = icx - iwd / 2 + iwd * (k + .5) / nW;
      jendela(x, yF + .9, zf, { w: ww, h: 1.55, wall: wl, kusen, palangH: s === 0, topi: s === 0, daun: s === 3 && top ? c : false, daunSlot: 1 }); }
    ac(icx, yF + .22, zf, {});
  }
  // ---- puncak muka per seed ----
  const R = atapDatar(bw, dep, cx, H, zc, { parapet: ph, cParapet: wl, slotParapet: 2, c: '#B8B2A6', adj: A });
  if (s === 0){ ruko_lisProfil(xi0, xi1, H - .05, zf, .16, .26, darken(wl, .85), { l: 1, r: 1 }); ruko_lisProfil(xi0, xi1, H + ph - .42, zf, .12, .2, darken(wl, .85), { l: 1, r: 1 }); }
  else if (s === 1){   // atap genteng tempel miring di muka (slot 3), di antara pilaster, tepi bawah di depan parapet
    const a = 34 * D2R, L = 1.0, zt = zf + .02, y0 = H + ph - .15, zc2 = zt + L * Math.cos(a) / 2 - .1, yc = y0 - L * Math.sin(a) / 2;
    taruh(rangka(icx, yc, zc2, 0), 'box', iwd, .1, L, 0, 0, 0, gt, { rx: a, slot: 3 });
    taruh(rangka(icx, yc - .06, zc2, 0), 'box', iwd - .04, .05, L - .06, 0, 0, 0, campur(darken(wl, .74), '#9BA0A6', .1), { rx: a, noEdge: true });
  } else if (s === 2){   // parapet bertingkat: panel tengah lebih tinggi + angka tahun
    const pw2 = Math.min(3.2, iwd * .5), py = H + ph; box(pw2, .75, .25, icx, py, zf - .125, wl); box(pw2 + .16, .1, .33, icx, py + .75, zf - .125, darken(wl, .85));
    teks(String(1978 + (iw * 7 + ia * 3) % 40), icx, py + .2, zf, { tinggi: .34, c: darken(wl, .55), dz: .012 });
  } else {   // atap dak: pagar pita di atas parapet rendah + rumah tangga (pintu) + jemuran
    const fr = rangka(icx, H + ph, zf - .12, 0); _jeruji(fr, iwd - .04, .72, 0, 0, 0, Math.max(6, Math.round(iwd / .3)), '#3A3D40', { lod: 0, satu: 1, rel: .05 });
    taruh(fr, 'box', iwd, .07, .1, 0, .74, 0, '#5E666C', {});
    if (n > 2){ const kt = rangka(xi1 - 1.15, H + .12, zb + 1.2, 0); taruh(kt, 'box', 1.8, 2.3, 2.0, 0, 1.15, 0, darken(wl, .92), { wall: true, slot: 0 });
      taruh(kt, 'box', 2.0, .12, 2.2, 0, 2.36, 0, '#B8B2A6', {}); taruh(kt, 'box', .85, 1.9, .06, -.2, .95, 1.01, '#5A5048', { attach: 'z+' }); }
    if (n > 3) jemuran(icx - .9, zc - .3, { y: H + .12, w: 2.2, h: 1.5, n: 4, warna: iw, rot: .05 });
  }
  // ---- isi atap: toren air, antena/parabola, kompresor AC ----
  const xT = s % 2 ? xi0 + .9 : xi1 - .9; ruko_tandon(xT, H + .12, zb + .95, (iw + s) % 2 ? 'biru' : '#D9762B', .75);
  if (s === 2 && n > 3) parabola(cx - (s % 2 ? -1.2 : 1.2), H + .12, zb + 1.2, { rot: .6 }); else if (s !== 3) antena(cx - 1.1, H + .12, zb + 1.5, { h: 2.6 });
  ac(s % 2 ? xi1 - 1.0 : xi0 + 1.0, H + .12, zc + .6, { rot: 0 });
  // ---- sisi bebas (bukan deret): iklan cat tembok + talang + jendela kecil + AC + bekas rembesan (kiri) · jendela per lantai + AC + pipa (kanan) ----
  const noda = (xs, rot, zz, w) => taruh(rangka(xs, 0, zz, rot), 'box', w, 2.2, .02, 0, H - 1.1, 0, darken(wl, .9), { attach: 'z+', slot: 0, lod: 1, noEdge: true, noHull: true });
  if (!aL){ const g = rangka(X0, 0, zc + .35, -Math.PI / 2), dw = Math.min(3.6, dep - 1.4), cI = ['#C2913A', '#3F7D92', '#9C4935', '#4F7A55'][(iw + s) % 4];
    taruh(g, 'box', dw, 1.5, .04, 0, LANTAI_USAHA + .9 + .75, 0, cI, { attach: 'z+', noHull: true });
    teks(['CAT TEMBOK', 'SEMEN', 'OLI', 'KOPI'][(iw + s) % 4], X0, LANTAI_USAHA + 1.15, zc + .35, { rot: -Math.PI / 2, tinggi: .75, lebarMaks: dw - .5, c: '#EDE8DC', dz: .035 });
    talang(X0, 0, H - .1, { z: zf - .3, rot: -Math.PI / 2 });
    for (let f = 2; f < n; f++){ const zw = zb + 1.2 + (f % 2) * 1.6, yw = LANTAI_USAHA + (f - 1) * LANTAI;
      jendelaKecil(X0, yw + 1.3, zw, { rot: -Math.PI / 2, w: .6, h: .7, wall: wl, kusen, palang: false, ambang: false });
      if (f === n - 1) ac(X0, yw + .35, zw + (f % 2 ? -1.0 : 1.0), { rot: -Math.PI / 2, lod: 1 }); }
    noda(X0, -Math.PI / 2, zb + .7, .5); }
  if (!aR){ talang(X1, 0, H - .1, { z: zf - .3, rot: Math.PI / 2 }); talang(X1, LANTAI_USAHA, H - LANTAI_USAHA - .1, { z: zb + .35, rot: Math.PI / 2, c: '#8C8A84' });
    for (let f = 1; f < n; f++){ const yw = LANTAI_USAHA + (f - 1) * LANTAI, zw = zb + 1.3 + (f % 2 ? 0 : 1.5);
      jendelaKecil(X1, yw + 1.4, zw, { rot: Math.PI / 2, w: .6, h: .7, wall: wl, kusen, palang: false, ambang: false });
      if (f === n - 1) ac(X1, yw + .4, zw + 1.1, { rot: Math.PI / 2, lod: 1 }); }
    noda(X1, Math.PI / 2, zf - 1.0, .45); }
};
