/* rumah (1×1) — spek-gaya §6 no. 1. Rumah tapak satu lantai khas perumahan/kampung Indonesia (tipe 36/45):
   teras berkolom di pojok depan (menjorok ke dalam, di bawah atap utama), lantai ditinggikan + 2 anak tangga, pintu kayu berpanel
   + boven/roster, ruang depan dengan 2 jendela (atau 1 jendela lebar berdaun), plint batu, talang paralon, pagar + gerbang besi,
   pot, jemuran (kampung/desa), pohon halaman (kota), antena TV, nomor rumah, meteran listrik, lampu teras.
   Varian seed: 0 limasan + teras kiri · 1 limasan + teras kanan + jendela lebar berdaun · 2 pelana menghadap jalan (gevel dinding
   + roster) + teras kiri · 3 joglo kecil + teras kanan. Deret (adj): pelana dengan bubungan sejajar deret, rapat ke batas kavling.
   Zona: KOTA halaman 1,9 rumput + pagar besi/tembok; KAMPUNG/DESA halaman 1,3 paving + tembok rendah / pagar bambu + jemuran. */
CAT.rumah.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, A = ctx.adj || {}, aL = !!A.l, aR = !!A.r, deret = aL || aR;
  const LW = fx + .8, LD = fz + .8, H = LANTAI, kota = zone === 'KOTA', desa = zone === 'DESA', kampung = !kota && !desa;
  // tapak: lebar ,9·fx (sisi deret rapat ke batas kavling); teritis harus muat di kavling → halaman belakang = teritis + ,08
  const ov = deret ? .55 : .7;
  const xl = aL ? -LW / 2 : -fx * .45, xr = aR ? LW / 2 : fx * .45, bw = xr - xl, cx = (xl + xr) / 2;
  const zf = LD / 2 - (kota ? 1.9 : 1.3), zb = -LD / 2 + ov + .1, bd = zf - zb, zc = (zb + zf) / 2;
  // teras menjorok ke dalam di pojok depan (kiri: seed 0,2 · kanan: 1,3), lantai ,3
  const kiri = s === 0 || s === 2, pw = 2.7, pd = 1.5, zt = zf - pd, tt = .3;
  const px0 = kiri ? xl : xr - pw, px1 = kiri ? xl + pw : xr, pcx = (px0 + px1) / 2, pin = kiri ? 1 : -1;   // pin = arah ke dalam (ke ruang depan)
  const rx0 = kiri ? px1 : xl, rx1 = kiri ? xr : px0, rcx = (rx0 + rx1) / 2, rw = rx1 - rx0;
  const kusen = s % 2 ? KUSEN : '#7A5A3A', cPlint = s === 2 ? '#7E7468' : darken(wl, .78);
  const cPintu = [KAYU, c, '#7A5A3A', '#4E3C2E'][s];

  // ---- badan: ruang belakang selebar rumah + ruang depan di samping teras ----
  dinding(bw, H, zt - zb, cx, 0, (zb + zt) / 2, wl, { plinth: .45, cPlinth: cPlint, adj: A });
  dinding(rw, H, pd + .02, rcx, 0, zt + pd / 2 - .01, wl, { plinth: .45, cPlinth: cPlint, adj: { l: kiri ? 0 : aL, r: kiri ? aR : 0 } });
  // ---- teras: lantai keramik ,3 + 2 anak tangga + kolom (bebas di pojok luar, menempel di pojok ruang depan) ----
  const kolX = kiri ? [-pw / 2 + .2, pw / 2 - .1] : [-pw / 2 + .1, pw / 2 - .2];
  // gerbang & anak tangga segaris, digeser ke dalam bila teras di tepi kavling (deret): pilar gerbang tetap di kavling
  const fx0 = aL ? -LW / 2 : -LW / 2 + .05, fx1 = aR ? LW / 2 : LW / 2 - .05, gx = clamp(pcx - pin * .45, fx0 + 1.0, fx1 - 1.0);
  teras(pw + .04, pd, pcx + pin * .02, zt, { tinggi: tt, tangga: 2, tanggaW: 1.3, tanggaX: gx - pcx - pin * .02, c: s % 2 ? '#C9BFA6' : '#B98C6E', kolom: kolX,
    kolomH: deret || s === 2 ? H + .22 : H + .02, cKolom: '#E6E2D8' });   // atap pelana papan: bidang bawah naik ke dalam → kolom ,2 lebih tinggi menembus papan
  pintu(kiri ? px1 - .95 : px0 + .95, zt, { y: tt, wall: wl, c: cPintu, slot: s === 1 ? 1 : 0, kusen, boven: s % 2 ? 'roster' : true });
  if (s % 2 === 0) jendelaKecil(kiri ? px0 + .62 : px1 - .62, 1.25, zt, { w: .55, h: .9, wall: wl, kusen, nako: true });
  lampuDinding(kiri ? px1 - 1.75 : px0 + 1.75, 2.45, zt, {});
  // dinding samping ruang depan yang menghadap teras: meteran PLN + nomor rumah
  const rSisi = kiri ? -Math.PI / 2 : Math.PI / 2;
  meteranListrik(px1 * (kiri ? 1 : 0) + px0 * (kiri ? 0 : 1), 1.45, zt + .55, { rot: rSisi });
  teks(String(3 + s * 7 + (kota ? 10 : 0)), kiri ? px1 : px0, 2.25, zt + .75, { rot: rSisi, tinggi: .18, c: darken(wl, .45), dz: .012 });
  bangku(pcx - pin * .35, zt + .45, { w: 1.1, y: tt, c: '#8C6A48', sandaran: false });
  // ---- ruang depan: 2 jendela + luifel (seed 0) / + teralis (2) · 1 jendela lebar berdaun (1) · 2 jendela sempit berdaun (3) ----
  if (s % 2 === 0){ for (const k of [-1, 1]) jendela(rcx + k * .92, 1.0, zf, { w: .95, h: 1.45, wall: wl, kusen, topi: s === 0, teralis: s === 2 }); }
  else if (s === 1) jendela(rcx, 1.0, zf, { w: 1.6, h: 1.45, wall: wl, kusen, daun: c, daunSlot: 1, palangH: true, topi: true });
  else for (const k of [-1, 1]) jendela(rcx + k * .9, 1.05, zf, { w: .74, h: 1.4, wall: wl, kusen, daun: c, daunSlot: 1 });
  // ---- samping & belakang ----
  if (!aL) jendela(xl, 1.0, (zb + zt) / 2 - .3, { rot: -Math.PI / 2, w: 1.0, h: 1.4, wall: wl, kusen });
  if (!aR){ jendelaKecil(xr, 1.5, zb + 1.1, { rot: Math.PI / 2, w: .6, h: .6, wall: wl, kusen }); if (s === 1) ac(xr, 2.2, zt - .9, { rot: Math.PI / 2 }); }
  jendelaKecil(cx + bw * .22, 1.5, zb, { rot: Math.PI, w: .6, h: .6, wall: wl, kusen });
  // ---- atap ----
  let r;
  if (deret) r = atapPelana(bw, bd, cx, H, zc, { arah: 'x', gaya: 'dinding', sudut: 33, ovD: ov, ovL: aL ? 0 : .45, ovR: aR ? 0 : .45, c: gt, cWall: wl, lisplang: true });
  else if (s === 2) r = atapPelana(bw, bd, cx, H, zc, { arah: 'z', gaya: 'dinding', sudut: 35, overhang: .5, c: gt, cWall: wl });
  else if (s === 3) r = atapJoglo(bw, bd, cx, H, zc, { overhang: ov, c: gt, cWall: wl, sudutBawah: 24, sudutAtas: 44 });
  else r = atapLimasan(bw, bd, cx, H, zc, { sudut: 30, overhang: ov, c: gt, cWall: wl });
  const hT = deret || s === 2 ? H - .45 : H - .05;
  talang(kiri ? xr - .12 : xl + .12, 0, hT, { z: zf });
  talang(kiri ? xl + .14 : xr - .14, 0, hT, { z: zt });
  if (s === 0 || s === 3 || (kampung && s === 1)) antena(cx + (kiri ? .3 : -.3), r.yPuncak - .08, zc, { h: 2.4 });
  // ---- halaman depan ----
  const zP = LD / 2 - .17;   // garis pagar
  const gaya = kota ? (s === 1 ? 'tembok' : 'besi') : desa ? 'bambu' : (s === 3 ? 'besi' : 'tembok');
  pagarHalaman(fx1 - fx0, zP, { x0: (fx0 + fx1) / 2, gaya, h: kota ? .9 : .8, gx, gW: 1.3, adj: A, c: gaya === 'tembok' ? campur(wl, '#C9BBA0', .6) : undefined, cGerbang: s === 1 ? darken(c, .7) : BESI, gerbangBesi: gaya !== 'bambu' });
  // jalan setapak gerbang → tangga
  const z0 = zf + .6, z1 = zP - .1; if (z1 - z0 > .1) box(1.3, .08, z1 - z0, gx, 0, (z0 + z1) / 2, '#C9BFA6');
  pot(gx + pin * .95, zf + .32, .9, { bunga: s % 2 ? '#C9503C' : null, kotak: s === 2 });   // di sisi dalam tangga (tetap di kavling walau deret)
  if (kota) pohonKecil(kiri ? Math.min(xr - .55, LW / 2 - .75) : Math.max(xl + .55, -LW / 2 + .75), zf + 1.05, .82, { jenis: 'bulat' });
  else jemuran(rcx, zf + .75, { w: Math.min(2.2, rw - .5), h: 1.65, n: 4, warna: s });
};
