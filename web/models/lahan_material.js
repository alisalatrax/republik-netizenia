/* lahan_material (1×1) — spek-tata-kota § proyek negara: lahan penumpukan bahan bangunan negara (stage 'bangun', owner null).
   Pagar seng #8E979C 1,8 keliling (lembar beda nada + pita cat aksen negara + tiang) dengan gerbang terbuka 2,4, papan proyek 1,4×0,9
   di 2 tiang (tampak di atas pagar), tumpukan bata di palet kayu, pasir kerucut r1,2, split abu, sak semen di bawah los seng kecil,
   besi beton di bantalan, buis beton, drum, gerobak sorong, jalur ban.
   Varian seed: 0 los semen + 3 palet bata + pasir + split · 1 besi beton + buis beton + 2 palet + pasir besar · 2/3 = cermin 0/1
   (+ tumpukan bambu/kayu di 3). Grup lapang (tanpa badan bangunan). Semua bagian di dalam kavling; sudut tapak (|x|,|z| > 2,9) kosong
   untuk crane makeVisual (stage bangun). Muka +z menghadap jalan. */
CAT.lahan_material.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, m = s >= 2 ? -1 : 1, v = s & 1;
  const LW = fx + .8, LD = fz + .8, R0 = rangka(0, 0, 0, 0), X = x => m * x;
  const bx = (sx, sy, sz, x, y, z, col, o) => taruh(R0, 'box', sx, sy, sz, x, y + sy / 2, z, col, Object.assign({ slot: 0 }, o));
  const BATA = '#B5604A', KAYU2 = '#8C6A48', cP = c || PAL.negara;
  bx(fx * .96, .08, fz * .96, 0, 0, 0, campur(PAL.tanah, '#A9A398', .45), { noHull: true });
  // ---- pagar seng 1,8 + gerbang terbuka ----
  const hP = 1.8, e = .12, zF = LD / 2 - e, gx = -m * 1.1, gW = 2.4, g0 = gx - gW / 2, g1 = gx + gW / 2;
  bx(g0 - .1 - (-LW / 2 + e), hP, .05, (g0 - .1 + (-LW / 2 + e)) / 2, 0, zF, m > 0 ? '#8E979C' : '#99A1A5');
  const ra = g1 + .1, rb = LW / 2 - e, rm = (ra + rb) / 2;
  bx(rm - ra, hP, .05, (ra + rm) / 2, 0, zF, '#99A1A5'); bx(rb - rm, hP, .05, (rm + rb) / 2, 0, zF, '#858E93');
  for (const [a, b] of [[-LW / 2 + e, g0 - .1], [g1 + .1, LW / 2 - e]]) bx(b - a, .22, .03, (a + b) / 2, hP - .4, zF + .045, cP, { slot: 1, noEdge: true });   // pita: belakangnya ,005 di depan muka seng
  // muka depan (menghadap jalan) juga bersambungan + noda tanah (verifikasi 2: dulu polos, sisi belakang lebih detail)
  for (const [a, b] of [[-LW / 2 + e, g0 - .1], [g1 + .1, LW / 2 - e]]){ if (b - a < .6) continue; const f = rangka((a + b) / 2, 0, zF + .035, 0), w = b - a;
    taruh(f, 'custom', w, hP, 1, 0, hP / 2, 0, '#6F777C', { geo: jerujiGeo(2, .05 / w, 0, false, true).geo, edges: null, noHull: true, noEdge: true, slot: 0, lod: 1 }); }
  for (const sx of [-1, 1]){ bx(.05, hP - .02, LD - 2 * e, sx * (LW / 2 - e), 0, 0, sx > 0 ? '#858E93' : '#8E979C');
    _lahan_material_lapis(rangka(sx * (LW / 2 - e + .035), 0, 0, sx * Math.PI / 2), LD - 2 * e, hP - .02, 5, cP); }   // sambungan + lembar terang + pita + noda (muka luar)
  bx(LW - 2 * e - .1, hP - .02, .05, 0, 0, -LD / 2 + e, '#99A1A5');
  _lahan_material_lapis(rangka(0, 0, -LD / 2 + e - .035, Math.PI), LW - 2 * e - .1, hP - .02, 5, cP);
  for (const x of [g0 - .1, g1 + .1]) bx(.12, hP + .2, .12, x, 0, zF - .06, '#5E666C');
  bx(1.25, hP - .1, .04, m > 0 ? g0 - .75 : g1 + .75, .05, zF - .16, '#8E979C', { lod: 1 });   // daun gerbang terbuka (didorong ke dalam)
  for (const x of [-2.4, 2.4]) if (x < g0 - .3 || x > g1 + .3) bx(.07, hP + .05, .07, x, 0, zF - .07, '#6F6A60', { lod: 1 });
  bx(2.6, .03, 3.2, gx, .07, LD / 2 - 1.8, '#8F7B5E', { noEdge: true, noHull: true });                                  // jalur ban
  // ---- papan proyek 1,4×0,9 (tampak di atas pagar) ----
  { const px = X(1.75), pz = zF - .35, f = rangka(px, 1.95, pz, 0);
    for (const sx of [-1, 1]) bx(.08, 2.85, .08, px + sx * .6, 0, pz - .06, '#5E666C');
    taruh(f, 'box', 1.4, .9, .05, 0, .45, 0, '#E6E2D8', { slot: 0 });
    taruh(f, 'box', 1.4, .26, .03, 0, .77, .035, cP, { slot: 1, noEdge: true });
    _teks(f, 'PROYEK', 0, .69, .055, 1.2, .16, '#EDE8DC');
    for (let k = 0; k < 2; k++) taruh(f, 'box', 1.0 - k * .3, .06, .02, -.1 - k * .15, .45 - k * .17, .03, '#5E666C', { slot: 0, lod: 1, noEdge: true }); }
  // ---- tumpukan bata di palet ----
  const palet = (x, z, h) => { bx(1.0, .12, .85, x, .08, z, KAYU2); bx(.92, h, .78, x, .2, z, BATA); bx(.8, .2, .66, x + .03, .2 + h, z - .02, darken(BATA, .9), { lod: 1 }); };
  const nP = v ? 2 : 3; for (let k = 0; k < nP; k++) palet(X(-1.9 + k * 1.15), -2.4, .55 + ((k + s) % 3) * .2);
  // ---- pasir kerucut r1,2 + split ----
  cone(v ? 1.3 : 1.2, v ? 1.15 : 1.0, X(1.75), .08, -1.0, '#D3C293');
  if (!v) cone(.8, .65, X(-.4), .08, -.4, '#9BA0A6');
  // ---- los semen kecil (seed genap) / besi beton + buis beton (ganjil) ----
  if (s === 2){ for (const z of [-.5, 1.3]) bx(1.2, .12, .22, X(-2.0), .08, z, '#7A5A3A');   // seed 2: tumpukan pipa baja di bantalan (ganti los semen)
    for (const [x, y] of [[-2.35, .2], [-1.65, .2], [-2.0, .5]]) taruh(R0, 'cylLo', .34, 2.4, .34, X(x), y + .17, .4, '#7F878C', { rx: Math.PI / 2, slot: 0 });
  }
  else if (!v){ const sx0 = X(-2.25), sz0 = .6, f = rangka(sx0, 0, sz0, 0);
    for (const a of [-.7, .7]) for (const b of [-.6, .6]) bx(.08, b > 0 ? 2.15 : 1.95, .08, sx0 + a, 0, sz0 + b, '#6F6A60', { lod: 1 });
    taruh(f, 'box', 1.75, .06, 1.55, 0, 2.1, 0, '#8E979C', { rx: -8 * D2R, slot: 0 });
    bx(1.2, .12, .9, sx0, .08, sz0, KAYU2); bx(1.1, .5, .8, sx0, .2, sz0, '#D9D4C8'); bx(.75, .25, .55, sx0 + .1, .7, sz0, '#CFC9BC', { lod: 1 });
    taruh(f, 'box', 1.0, .14, .02, 0, .45, .41, '#4C6A96', { slot: 0, lod: 1, noEdge: true }); }   // tulisan merek (pita)
  else { for (const x of [-2.6, -.6]) bx(.22, .14, .4, X(x), .08, .4, '#7A5A3A', { lod: 1 });
    bx(2.6, .2, .3, X(-1.6), .22, .4, '#6B4A3A', { noEdge: true }); bx(2.4, .12, .24, X(-1.5), .42, .4, '#7A4E3C', { lod: 1, noEdge: true });   // besi beton
    if (s === 1) for (const [x, z] of [[X(-2.2), 1.6], [X(-1.2), 1.6]]){ cylLo(.45, .6, x, .08, z, '#A8A398'); cylLo(.33, .02, x, .68, z, '#5E5A55').lod = 1; }   // buis beton
    else { const f = rangka(X(1.95), 0, 1.6, -m * Math.PI / 2);   // seed 3: gudang/keet kecil (pintu 1,0×2,1) menghadap halaman
      taruh(f, 'box', 2.1, .2, 1.6, 0, .1, 0, '#6F6A60', { slot: 0 });
      taruh(f, 'box', 2.0, 2.3, 1.5, 0, .2 + 1.15, 0, '#D9D4C8', { slot: 0, wall: true });
      taruh(f, 'box', 2.3, .07, 1.75, 0, 2.55, -.05, SENG, { slot: 0, rx: -6 * D2R });
      taruh(f, 'box', 1.0, 2.1, .05, -.35, .2 + 1.05, .77, '#7A5A3A', { slot: 0 });
      taruh(f, 'box', .5, .4, .05, .6, 1.4 + .2, .77, '#EDE8DC', { slot: 0 }); _kaca(f, .38, .28, .6, 1.46, .79, null, { lod: 1 }); } }
  if (s === 3) bx(.6, .35, 2.6, X(-2.85), .08, -1.2, '#C9A86A');                                                                   // tumpukan bambu/kayu
  // ---- drum + gerobak sorong ----
  if (s === 3) cylLo(.28, .85, X(.9), .08, -2.4, '#3E6FB0'); else cylLo(.28, .85, X(2.6), .08, .6, s % 2 ? '#3E6FB0' : '#4F7A55');
  { const fw = s === 3 ? rangka(X(.25), 0, 1.9, m * .3) : rangka(X(1.2), 0, 1.1, m * .7); taruh(fw, 'box', .6, .28, .85, 0, .52, 0, '#4F555C', { slot: 0 });
    taruh(fw, 'cylLo', .36, .08, .36, 0, .18, .5, '#1E1C1A', { rx: Math.PI / 2, ry: Math.PI / 2, slot: 0, noEdge: true });
    for (const sx of [-1, 1]) taruh(fw, 'box', .05, .05, .8, sx * .24, .45, -.6, BESI, { slot: 0 }); }
};

/* lapisan muka luar pagar seng (tanpa kotak baru): n sambungan lembar gelap, 1 lembar lebih terang, pita cat aksen & noda tanah di kaki.
   f = rangka ,01 di depan muka seng (+z lokal = keluar). Segitiga: 2n + 3·4. */
function _lahan_material_lapis(f, w, h, n, cP){
  const q = (g, ww, hh, dx, yb, dz, c, sl) => taruh(f, 'custom', ww, hh, 1, dx, yb + hh / 2, dz, c, { geo: g.geo, edges: null, noHull: true, noEdge: true, slot: sl || 0, lod: 1 });
  const D = jerujiGeo(2, .5, 0, false, true), u = w / (n - 1);
  q(jerujiGeo(n, .05 / w, 0, false, true), w, h, 0, 0, 0, '#6F777C');
  q(D, u - .06, h - .02, -w / 2 + u * 1.5, .01, .01, '#A3AAAE');
  q(D, w, .18, 0, h - .4, .02, cP, 1); q(D, w, .3, 0, 0, .02, '#8F7B5E'); }
