/* proyek_rumah (1×1) — spek-tata-kota § proyek negara (stage 'bangun', owner null). Rumah negara setengah jadi khas kampung:
   pondasi batu kali + sloof, dinding bata ekspos #B5604A dengan bukaan pintu (1,0×2,1) & jendela (1,2×1,2) + latei beton, kolom praktis
   + besi stek, perancah bambu #D9B26A di muka (tiang luar/dalam, palang, papan pijak, silang), material di halaman samping (pasir kerucut,
   palet bata, sak semen, bak adukan, ember), besi beton di bantalan (belakang), papan proyek 1,4×0,9 di 2 tiang, 1 tukang berhelm.
   Varian seed: 0 dinding naik ±1,9 bertangga, belum berkusen · 1 dinding penuh 3,2 + ring balok + kuda-kuda kayu + gording + gevel bata
   · 2 cermin + kuda-kuda + genteng separuh terpasang + plester sebagian + kusen · 3 cermin + rumah 2 lantai: pelat cor dak + stek kolom
   + bata lantai 2 mulai naik. Zona: KOTA pagar seng di halaman material, DESA pagar bambu + gerbang, KAMPUNG tanpa pagar.
   Semua bagian di dalam kavling; sudut tapak (|x|,|z| > 2,9) kosong untuk crane makeVisual (stage bangun). Muka +z menghadap jalan. */
CAT.proyek_rumah.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, m = s >= 2 ? -1 : 1;   // m: cermin (halaman material di sisi +m·x)
  const LW = fx + .8, LD = fz + .8, R0 = rangka(0, 0, 0, 0);
  const bx = (sx, sy, sz, x, y, z, col, o) => taruh(R0, 'box', sx, sy, sz, x, y + sy / 2, z, col, Object.assign({ slot: 0 }, o));
  const BATA = '#B5604A', BETON = '#A8A398', BAMBU = '#D9B26A', KAYU2 = '#8C6A48', TANAH = campur(PAL.tanah, '#A9A398', .4), KUDA = '#9C7A52';
  const genteng = gt || GENTENG[0];
  bx(fx * .96, .08, fz * .96, 0, 0, 0, TANAH, { noHull: true });
  // ---- tapak rumah ----
  const bw = 5.4, bd = 5.4, cx = -m * .25, xl = cx - bw / 2, xr = cx + bw / 2, zf = 2.45, zb = zf - bd, zc = (zf + zb) / 2;
  const Hw = s === 0 ? 1.9 : LANTAI, y0 = .5, t = .15;   // y0 = atas sloof (dinding mulai)
  bx(bw + .2, .32, bd + .2, cx, 0, zc, '#7E7468');                                   // pondasi batu kali (menonjol dari tanah)
  bx(bw + .04, .18, bd + .04, cx, .32, zc, BETON);                                   // sloof
  bx(bw - .4, .3, bd - .4, cx, .2, zc, '#C9B48A', { noEdge: true, lod: 1 });                 // urugan pasir di dalam
  // ---- dinding muka dengan bukaan (potongan bata di antara bukaan + latei beton + kusen) ----
  const ops = s % 2 === 0
    ? [{ a: -2.2, b: -1.0, y: .9 + y0, h: 1.2 }, { a: -.3, b: .7, y: y0, h: PINTU_H }, { a: 1.2, b: 2.3, y: .9 + y0, h: 1.2 }]
    : [{ a: -2.25, b: -1.25, y: y0, h: PINTU_H }, { a: -.6, b: .6, y: .9 + y0, h: 1.2 }, { a: 1.2, b: 2.3, y: .9 + y0, h: 1.2 }];
  const zW = zf - t / 2, pierH = s === 0 ? [1.9, 1.55, 1.9, 1.25] : null;   // seed 0: dinding naik tak rata (bertangga)
  let xa = -bw / 2;
  ops.forEach((o, k) => { const pa = xa, pb = o.a; if (pb > pa + .01){ const hP = pierH ? pierH[k] : Hw; bx(pb - pa, hP - y0, t, cx + (pa + pb) / 2, y0, zW, BATA); }
    if (o.y > y0 + .01) bx(o.b - o.a, o.y - y0, t, cx + (o.a + o.b) / 2, y0, zW, darken(BATA, .95));   // bawah jendela
    const yT = o.y + o.h; if (Hw > yT + .2){ bx(o.b - o.a + .02, .15, t + .04, cx + (o.a + o.b) / 2, yT, zW, BETON);   // latei
      bx(o.b - o.a, Hw - yT - .15, t, cx + (o.a + o.b) / 2, yT + .15, zW, darken(BATA, .97)); }
    if (s >= 1) _bingkai(R0, o.b - o.a, o.h, .08, cx + (o.a + o.b) / 2, o.y, zW + .04, .12, '#7A5A3A', o.y > y0 + .01);
    xa = o.b; });
  bx(bw / 2 - xa, (pierH ? pierH[3] : Hw) - y0, t, cx + (xa + bw / 2) / 2, y0, zW, BATA);
  if (s === 2){ const pc = '#C9C1B2', po = { noEdge: true }, ya = y0 + .1, yt = Hw - .2;   // plester sebagian (kanan), memutari bukaan pintu & jendela
    bx(.5, yt - ya, .03, cx + .95, ya, zf + .015, pc, po);                                   // pilar di antara pintu dan jendela
    if (yt - 2.65 > .05) bx(2.6, yt - 2.65, .03, cx + 1.25, 2.65, zf + .015, pc, po);        // pita di atas ambang
    if (1.35 - ya > .05) bx(1.1, 1.35 - ya, .03, cx + 1.75, ya, zf + .015, pc, po); }        // di bawah ambang jendela
  // ---- dinding samping & belakang (sisi kiri/-x: bukaan jendela gelap) ----
  const hS = s === 0 ? 1.45 : Hw;
  for (const sx of [-1, 1]) bx(t, hS - y0, bd - 2 * t, cx + sx * (bw / 2 - t / 2), y0, zc, sx < 0 ? BATA : darken(BATA, .93));
  bx(bw, (s === 0 ? 1.15 : Hw) - y0, t, cx, y0, zb + t / 2, darken(BATA, .9));
  if (s >= 1){ const f = rangka(xl, 0, zc - .6, -Math.PI / 2); taruh(f, 'box', 1.1, 1.1, t + .04, 0, y0 + 1.0 + .55, -t / 2, '#3A3430', { slot: 0, noHull: true }); }
  // ---- kolom praktis (beton, menonjol ,02) + besi stek di seed 0 ----
  const kol = [[xl + .1, zf - .1], [xr - .1, zf - .1], [xl + .1, zb + .1], [xr - .1, zb + .1], [cx + ops[1].a - .1, zf - .1]];
  for (const [x, z] of kol){ const hk = s === 0 ? (z > 0 ? 2.1 : 1.6) : Hw; bx(.19, hk - y0, .19, x, y0, z, BETON);
    if (s === 0) bx(.12, .7, .12, x, hk, z, '#6B4A3A', { lod: 1, noEdge: true }); }
  // ---- atas dinding: ring balok + kuda-kuda + gording + gevel (s1, s2) / pelat cor dak + stek + bata lt 2 (s3) ----
  if (s >= 1){ for (const [w, d, x, z] of [[bw + .04, .19, cx, zf - t / 2], [bw + .04, .19, cx, zb + t / 2], [.19, bd - .3, xl + t / 2, zc], [.19, bd - .3, xr - t / 2, zc]]) bx(w, .2, d, x, Hw, z, BETON); }
  const yR0 = Hw + .2;
  if (s === 1 || s === 2){ const a = 30 * D2R, rise = bd / 2 * Math.tan(a), ov = .45, run = bd / 2 + ov, L = run / Math.cos(a), yR = yR0 + rise;
    for (const sx of [-1, 1]) taruh(R0, 'prism', .15, rise, bd, cx + sx * (bw / 2 - .075), yR0 + rise / 2, zc, darken(BATA, .92), { slot: 0 });   // gevel bata
    for (const x of [-1.35, 0, 1.35]){ const X = cx + x;
      for (const sz of [-1, 1]) taruh(R0, 'box', .1, .14, L, X, yR - run / 2 * Math.tan(a) - .05, zc + sz * run / 2, KUDA, { rx: sz * a, slot: 0 });
      bx(.1, .14, bd, X, yR0, zc, KUDA); bx(.1, rise, .1, X, yR0, zc, KUDA, { lod: 1 }); }
    bx(bw + .5, .12, .12, cx, yR - .06, zc, KUDA);                                                         // nok
    for (const sz of [-1, 1]) for (const u of [.35, .7]){ const zz = zc + sz * (bd / 2) * u; bx(bw + .5, .1, .1, cx, yR0 + rise * (1 - u) - .02, zz, KUDA); }   // gording
    if (s === 2){ const xa2 = cx - bw / 2 - .25, xb2 = cx + .2, ww = xb2 - xa2;   // genteng separuh terpasang (bidang muka)
      taruh(R0, 'box', ww, .1, L, (xa2 + xb2) / 2, yR - run / 2 * Math.tan(a) + .2, zc + run / 2, genteng, { rx: a, slot: 3 });   // +,2: di atas kaso/gording (tak tembus)
      taruh(R0, 'box', ww, .1, L, (xa2 + xb2) / 2, yR - run / 2 * Math.tan(a) + .2, zc - run / 2, darken(genteng, .92), { rx: -a, slot: 3 });
      bx(.7, .4, .5, m * 3.25, .08, -.66, genteng, { slot: 3 }); }   // tumpukan genteng di halaman
  } else if (s === 3){ bx(bw + .3, .15, bd + .3, cx, Hw, zc, BETON);                                              // pelat cor dak
    for (const [x, z] of kol.slice(0, 4)){ bx(.19, .9, .19, x, Hw + .15, z, BETON); bx(.12, .6, .12, x, Hw + 1.05, z, '#6B4A3A', { lod: 1, noEdge: true }); }
    bx(bw - .4, .8, t, cx, Hw + .15, zb + t / 2 + .05, BATA); bx(t, .5, bd - .6, xl + t / 2 + .05, Hw + .15, zc, darken(BATA, .95)); }
  // ---- perancah bambu muka ----
  const hPr = s === 3 ? 4.6 : s === 0 ? 2.6 : 3.8, zO = zf + .95, zI = zf + .3, wPr = bw + .2;
  _jeruji(rangka(cx, 0, zO, 0), wPr, hPr, 0, 0, 0, 4, BAMBU, { batang: .09, rel: 0, lod: 0 });
  _jeruji(rangka(cx, 0, zI, 0), wPr, hPr - .3, 0, 0, 0, 4, darken(BAMBU, .92), { batang: .08, rel: 0, lod: 1 });
  const lifts = s === 0 ? [1.3] : [1.3, 3.3];   // jarak tingkat 2,0 > tukang 1,7 + helm (kepala ,1 di bawah papan atas)
  for (const y of lifts){ bx(wPr + .2, .08, .08, cx, y, zO, BAMBU); bx(wPr + .2, .07, .07, cx, y, zI, BAMBU, { lod: 1 });
    bx(wPr - .2, .04, .6, cx, y + .08, (zO + zI) / 2, KAYU2, { noEdge: true }); }                                // papan pijak
  { const fS = rangka(cx, 0, zO + .06, 0), w2 = wPr / 2, Ld = Math.hypot(w2, 2.4), a = Math.atan2(2.4, w2);
    for (const sx of [-1, 1]) taruh(fS, 'box', .07, .07, Ld - .1, sx * w2 / 2, 1.25, 0, BAMBU, { ry: Math.PI / 2, rx: sx * a, slot: 0, lod: 1 }); }
  // tukang di papan pijak
  { const f = rangka(cx - m * 1.2, lifts[0] + .12, (zO + zI) / 2, 0);
    for (const sx of [-1, 1]) taruh(f, 'box', .16, .8, .2, sx * .1, .4, 0, '#3A4250', { slot: 0, lod: 1 });
    const baju = s % 2 ? '#4C6A96' : '#D9762B';
    taruh(f, 'box', .42, .62, .24, 0, 1.11, 0, baju, { slot: 0, lod: 1 });
    for (const sx of [-1, 1]) taruh(f, 'box', .1, .56, .12, sx * .27, 1.1, .02, baju, { slot: 0, lod: 1, noEdge: true });
    taruh(f, 'box', .23, .25, .23, 0, 1.55, 0, '#C08A62', { slot: 0, lod: 1, noEdge: true });
    taruh(f, 'sphLo', .32, .2, .34, 0, 1.7, 0, '#D9B441', { slot: 0, lod: 1, noEdge: true }); taruh(f, 'box', .36, .03, .4, 0, 1.66, .02, '#D9B441', { slot: 0, lod: 1, noEdge: true }); }
  // ---- material di halaman samping (+m) & belakang ----
  { const X = v => m * v, xs = X(3.25);
    cone(.62, .75, xs, .08, -1.6, '#D3C293');                                                                    // pasir
    bx(.75, .12, .9, xs, .08, .1, KAYU2); bx(.7, .55, .82, xs, .2, .1, BATA); bx(.6, .25, .7, xs + .02, .75, .08, darken(BATA, .9), { lod: 1 });   // palet bata
    bx(.6, .3, .7, xs, .08, 1.35, '#D9D4C8'); bx(.4, .16, .5, xs, .38, 1.35, '#CFC9BC', { lod: 1 });          // sak semen
    bx(.9, .16, .6, X(2.95), .08, -2.55, '#6F6A60', { lod: 1 }); cylLo(.16, .28, X(2.6), .08, -2.15, '#3A3D40').lod = 1;   // bak adukan + ember
    bx(.22, .12, .3, -2, .08, -3.5, '#7A5A3A'); bx(.22, .12, .3, 1.6, .08, -3.5, '#7A5A3A');
    bx(4.4, .14, .26, -.2, .2, -3.5, '#6B4A3A', { noEdge: true }); }                                             // besi beton di bantalan
  // ---- papan proyek 1,4×0,9 di 2 tiang ----
  { const px = m * 1.95, pz = LD / 2 - .45, f = rangka(px, 1.3, pz, 0);
    for (const sx of [-1, 1]) bx(.08, 2.25, .08, px + sx * .6, 0, pz - .06, '#5E666C');
    taruh(f, 'box', 1.4, .9, .05, 0, .45, 0, '#E6E2D8', { slot: 0 });
    taruh(f, 'box', 1.4, .26, .03, 0, .77, .035, c || PAL.negara, { slot: 1, noEdge: true });
    _teks(f, 'PROYEK', 0, .69, .055, 1.2, .16, '#EDE8DC');
    for (let k = 0; k < 2; k++) taruh(f, 'box', 1.0 - k * .3, .06, .02, -.1 - k * .15, .45 - k * .17, .03, '#5E666C', { slot: 0, lod: 1, noEdge: true }); }
  // ---- pagar menurut zona ----
  if (zone === 'KOTA'){ const xa3 = m > 0 ? xr + .2 : -LW / 2 + .1, xb3 = m > 0 ? LW / 2 - .1 : xl - .2;   // seng menutup halaman material (muka + sisi)
    bx(xb3 - xa3, 1.8, .05, (xa3 + xb3) / 2, 0, LD / 2 - .12, '#8E979C'); bx(xb3 - xa3, .25, .03, (xa3 + xb3) / 2, 1.3, LD / 2 - .12 + .045, c || PAL.negara, { slot: 1, noEdge: true });   // pita: belakangnya ,005 di depan muka seng
    _proyek_rumah_lapis(rangka((xa3 + xb3) / 2, 0, LD / 2 - .12 + .035, 0), xb3 - xa3, 1.8, 3, '#6F777C', .3);   // sambungan lembar + noda tanah bawah (muka luar)
    bx(.05, 1.8, 2.8, m * (LW / 2 - .1), 0, LD / 2 - 1.55, '#99A1A5');
    _proyek_rumah_lapis(rangka(m * (LW / 2 - .1 + .035), 0, LD / 2 - 1.55, m * Math.PI / 2), 2.8, 1.8, 3, '#6F777C', .3); }   // sisi seng juga bersambungan + noda (verifikasi 2)
  else if (zone === 'DESA') pagarHalaman(LW - .3, LD / 2 - .15, { gaya: 'bambu', h: .9, gW: 1.4, gx: cx + (ops[1].a + ops[1].b) / 2 * 0 - m * .4, pilar: 2.5 });
};

/* lapisan muka seng satu sisi (tanpa kotak baru): n garis sambungan lembar gelap + pita noda tanah setinggi hn di kaki.
   f = rangka di bidang muka luar (+z lokal = keluar, ≥ ,01 di depan muka seng), w×h = ukuran lembar. Segitiga: 2n + 4. */
function _proyek_rumah_lapis(f, w, h, n, col, hn){
  const S = jerujiGeo(n, .04 / w, 0, false, true);
  taruh(f, 'custom', w, h, 1, 0, h / 2, 0, col, { geo: S.geo, edges: null, noHull: true, noEdge: true, slot: 0, lod: 1 });
  const D = jerujiGeo(2, .5, 0, false, true);
  taruh(f, 'custom', w, hn, 1, 0, hn / 2, .005, '#8F7B5E', { geo: D.geo, edges: null, noHull: true, noEdge: true, slot: 0, lod: 1 }); }
