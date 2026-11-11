/* penjara (2×1) — spek-gaya §6 no. 15. Lembaga pemasyarakatan kecil (Lapas) Indonesia.
     tembok keliling 3,5 tebal ,5 abu #8E979C TEPAT di dalam batas kavling (bukan di trotoar) + pilaster tiap ± 3 m + lis topi
     + kawat duri (tiang + 2 kawat) di atas tembok; 2 menara jaga silinder 8 sisi r ,8 dengan bilik kaca, lampu sorot dan atap limasan
     (hipGeo) di sudut berseberangan; gedung gerbang (portir) di muka tembok: gerbang besi dobel 3,0×3,2, papan 'LAPAS', 2 lampu,
     jendela pos, atap datar; blok sel 2 lantai di belakang halaman dengan 8 jendela berjeruji, pintu berjeruji, pita lantai, talang;
     halaman paving + jemuran baju tahanan + bangku + ring basket (seed).
   Varian seed: bit 0 = cermin (menara depan-kiri/belakang-kanan ↔ sebaliknya; gerbang bergeser) · 0 blok sel atap pelana genteng ·
     1 blok sel atap limasan + ring basket · 2 blok sel atap datar beton + tandon + kawat di atap · 3 dua blok sel (sayap) atap pelana
     seng + menara ketiga kecil di atas gerbang.
   Model parametrik pada LW×LD (uji NZ_FACING=1: 8×16). Semua bagian di dalam kavling; muka +z menghadap jalan. */
function penjara_lod(n0){ for (let k = n0; k < P.length; k++) P[k].lod = 1; }
// tembok lurus sepanjang x lokal di rangka f (muka luar +z): badan + lis topi + pilaster luar + kawat duri; L panjang, x0 pusat
function penjara_tembok(f, L, dx, h, t, c, o){ o = o || {};
  taruh(f, 'box', L, h, t, dx, h / 2, -t / 2, c, { slot: 0, wall: true });
  taruh(f, 'box', L, .14, t + .14, dx, h + .07, -t / 2, darken(c, .82), { slot: 0 });
  if (o.pilar){ taruh(f, 'box', L, .5, .05, dx, .25, .01, darken(c, .7), { slot: 0, attach: 'z+', noEdge: true, lod: 1 });
    taruh(f, 'box', L, .28, .05, dx, h - .45, .01, o.cPita || '#3F6B62', { slot: 0, attach: 'z+', noEdge: true, lod: 1 }); const np = Math.max(1, Math.round(L / 3.2)); for (let k = 1; k < np; k++) taruh(f, 'box', .34, h - .2, .12, dx - L / 2 + L * k / np, (h - .2) / 2, .04, darken(c, .9), { slot: 0, attach: 'z+', lod: 1 }); }
  _jeruji(f, L - .1, .55, dx, h + .14, -t / 2, Math.max(3, Math.round(L / 2.2) + 1), '#4A4F55', { satu: 1, batang: .05, rel: .03, lod: 1 }); }
// menara jaga: tiang silinder 8 sisi + bilik kaca + pagar + atap limasan + lampu sorot
function penjara_menara(x, z, h, rot, c){ const f = rangka(x, 0, z, rot), cw = 1.8;
  taruh(f, 'cylLo', 1.6, h, 1.6, 0, h / 2, 0, c, { slot: 0 });
  taruh(f, 'box', 2.0, .2, 2.0, 0, h + .1, 0, darken(c, .85), { slot: 0 });
  taruh(f, 'box', cw, 1.5, cw, 0, h + .2 + .75, 0, '#D6D0C0', { slot: 0, wall: true });
  taruh(f, 'box', cw + .04, .65, cw + .04, 0, h + .2 + .75 + .25, 0, KACA[0], { glow: true });
  _jeruji(f, 1.98, .9, 0, h + .2, 1.0, 5, BESI, { satu: 1, rel: .05, batang: .04, lod: 1 });
  taruh(f, 'box', .35, .25, .3, .55, h + 1.95, .95, LAMPU, { glow: true, noEdge: true });
  atapLimasan(cw, cw, f.at(0, 0, 0)[0], h + 1.7, f.at(0, 0, 0)[2], { sudut: 32, overhang: .25, c: '#5E6670', cWall: '#D6D0C0', rot, pita: false }); }
CAT.penjara.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, mir = s & 1 ? -1 : 1, X = x => mir * x;
  const LW = fx + .8, LD = fz + .8, hT = 3.5, t = .5, cT = '#8E979C', cB = '#D6D0C0', cPl = '#7E8790';
  const xe = LW / 2 - .1, ze = LD / 2 - .1, zg = ze - .5;   // muka luar tembok ,1 di dalam batas (pilaster menonjol ,1)
  // ---- halaman paving (lapangan) di dalam tembok ----
  taruh(rangka(0, 0, 0, 0), 'box', LW - 2 * t, .05, LD - 2 * t, 0, .065, 0, '#BFB6A8', { slot: 0, noHull: true, noEdge: true });
  // ---- gedung gerbang (portir) di muka ----
  const gw = Math.min(4.6, LW - 3.0), gd = Math.min(2.6, LD * .3), gH = 4.6, gx = LW >= 12 ? X(-1.2) : 0, gz = zg - gd / 2;
  dinding(gw, gH, gd, gx, 0, gz, cB, { plinth: .6, cPlinth: cPl, slot: 0 });
  atapDatar(gw, gd, gx, gH, gz, { parapet: .45, c: '#B8B2A6', cParapet: cB });
  { const f = rangka(gx, 0, zg, 0);
    taruh(f, 'box', 3.3, 3.45, .06, 0, 1.725, 0, darken(cB, .62), { slot: 0, attach: 'z+', ao: .8 });           // reveal gerbang
    taruh(f, 'box', 3.0, 3.2, .06, 0, 1.6, .01, '#3A3D40', { slot: 0, attach: 'z+' });                         // daun gerbang (pelat)
    _jeruji(f, 2.96, 2.0, 0, 1.1, .07, 14, '#23262A', { satu: 1, rel: .06, batang: .05, lod: 0 });             // jeruji atas
    taruh(f, 'box', .06, 3.2, .1, 0, 1.6, .06, '#23262A', { slot: 0 });                                        // celah dua daun
    papanNama(gx, 3.6, zg, { w: 3.4, h: .7, c: '#3F6B62', bingkai: '#C2913A', teks: 'LAPAS', cTeks: '#EDE8DC' });
    for (const sx of [-1, 1]) lampuDinding(gx + sx * 1.95, 3.15, zg, {}); }
  // pos portir: jendela kaca kecil di samping gerbang (sisi dalam) + nomor
  jendelaKecil(gx + gw / 2, 1.3, gz, { rot: Math.PI / 2, w: .9, h: .8, wall: cB, kusen: '#EDE8DC' });
  if (s === 3) penjara_menara(gx, gz - .2, gH + .2, 0, cT);   // menara ketiga di atas gerbang (tiang menembus atap)
  // ---- tembok keliling (muka luar di batas kavling) ----
  const gl = gx - gw / 2, gr = gx + gw / 2;
  penjara_tembok(rangka(0, 0, ze, 0), gl + xe, (-xe + gl) / 2, hT, t, cT, { pilar: true });
  penjara_tembok(rangka(0, 0, ze, 0), xe - gr, (gr + xe) / 2, hT, t, cT, { pilar: true });
  penjara_tembok(rangka(0, 0, -ze, Math.PI), LW, 0, hT, t, cT, {});
  for (const sx of [-1, 1]) penjara_tembok(rangka(sx * xe, 0, 0, sx * Math.PI / 2), LD - 2 * t, 0, hT, t, cT, { pilar: true });
  // ---- menara jaga di sudut berseberangan ----
  const mx = xe - 1.15, mz = ze - 1.15, hM = 6.5, lebar = LW >= 12;
  penjara_menara(X(-mx), lebar ? mz : 0, hM, 0, cT); penjara_menara(X(mx), -mz, hM, Math.PI, cT);
  // ---- blok sel 2 lantai ----
  const zb = -ze + t + .05, cd = clamp(LD * .36, 2.8, 5.0), zf = zb + cd, zc = (zb + zf) / 2, H = 2 * LANTAI;
  const sayap = s === 3 && lebar;
  const cx0 = -xe + t + (lebar ? 2.5 : .2), cx1 = xe - t - 2.5;
  const blok = sayap ? [[cx0, -.4], [.4, cx1]] : [[cx0, cx1]];
  for (const [a, b] of blok){ const bw = b - a, bx = (a + b) / 2;
    dinding(bw, H, cd, bx, 0, zc, cB, { plinth: .5, cPlinth: cPl, lis: [LANTAI - .06], cLis: '#7E8790', slot: 0 });
    const nj = Math.max(2, Math.round(bw / (sayap ? 2.2 : 2.6)));
    for (let k = 0; k < nj; k++){ const x = a + bw * (k + .5) / nj;
      for (const yy of [1.3, LANTAI + 1.2]) if (!(yy < 2 && Math.abs(x - bx) < .9 && !sayap)) jendelaJeruji(x, yy, zf, { w: .8, h: .9, wall: cB, kusen: '#9C9A92', ambang: false }); }
    if (!sayap){ const f = rangka(bx, 0, zf, 0);   // pintu sel berjeruji
      taruh(f, 'box', 1.4, 2.35, .06, 0, 1.175, 0, darken(cB, .62), { slot: 0, attach: 'z+' }); taruh(f, 'box', 1.1, 2.2, .06, 0, 1.1, .01, '#2E3236', { slot: 0, attach: 'z+' });
      _jeruji(f, 1.06, 2.16, 0, .02, .07, 7, '#8E979C', { satu: 1, rel: .06, batang: .05, lod: 1 }); }
    talang(b, 0, H - .1, { z: zf - .25, rot: Math.PI / 2 });
    if (s === 2){ atapDatar(bw, cd, bx, H, zc, { parapet: .5, c: '#B8B2A6', cParapet: cB }); }
    else if (s === 1) atapLimasan(bw, cd, bx, H, zc, { sudut: 28, overhang: .45, c: gt, cWall: cB });
    else atapPelana(bw, cd, bx, H, zc, { arah: 'x', sudut: 28, overhang: .45, c: s === 3 ? '#7E8A93' : gt, cWall: cB }); }
  if (s === 2) tandon(X(cx1 - 1.0), H + .12, zc, { c: 'biru', r: .5, h: 1.1, kaki: 0 });
  // jendela samping blok (menghadap tembok samping)
  jendelaJeruji(cx0, LANTAI + 1.2, zc, { rot: -Math.PI / 2, w: .7, h: .8, wall: cB, ambang: false, lod: 1 });
  // ---- isi halaman ----
  const yz0 = zf + .5, yz1 = gz - gd / 2 - .3;
  { const n0 = P.length;
    if (lebar){ jemuran(X(3.6), (zf + ze - t) / 2 + .1, { w: 2.4, h: 1.6, n: 5, warna: 3, rot: 0 });
      bangku(X(-4.6) + (gx > 0 ? 0 : 0), zf + .8, { w: 1.5, sandaran: false, c: '#8E8A84' });
      if (s === 1){ const f = rangka(X(5.6), 0, zf + .35, 0); taruh(f, 'box', .12, 3.05, .12, 0, 1.525, 0, BESI, { slot: 0 }); taruh(f, 'box', 1.0, .7, .06, 0, 3.0, .12, '#E6E2D8', { slot: 0 }); taruh(f, 'box', .45, .04, .45, 0, 2.8, .4, '#B5473A', { slot: 0 }); } }
    else jemuran(0, (zf + gz - gd / 2) / 2, { w: 2.0, h: 1.6, n: 4, warna: 3 });
    penjara_lod(n0); }
};
