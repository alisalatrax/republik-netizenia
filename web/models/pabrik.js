/* pabrik (2×2) — spek-gaya §6 no. 28. Pabrik kecil-menengah khas kawasan industri pinggir kota Indonesia (desain orisinal):
   hall 13,7×7,5 tinggi 4,0 dinding abu hangat + plint, atap gergaji 4 gigi (seed 3: 5) seng #6E7F8A dengan kaca menghadap belakang,
   tembok depan ber-parapet dengan tulisan cat 'PABRIK', 2 rolling door 2,8/3,0 (satu terbuka: lantai kerja gelap), 6 jendela besi (2 depan + 4 samping)
   + 5 jalusi ventilasi tinggi (3 samping seberang + 2 belakang),
   2 cerobong bata 9 m bercincin putih, tangki/silo di 4 kaki + tangga, kantor depan 1 lantai (pintu kaca, jendela, AC, papan nama produk:
   KERUPUK / TEKSTIL / SABUN / KERAMIK), truk engkel kuning ber-bak kayu hijau, palet + 4 peti kayu, 1 drum, pagar besi depan dengan gerbang
   geser lebar, pagar kawat samping, lampu sorot. Varian: bit 0 = cermin · seed 2 truk parkir melintang + 2 silo · seed 3 atap 5 gigi.
   Semua bagian di dalam kavling (|x|,|z| ≤ 8); muka +z = jalan. floors = 1 (hall satu lantai tinggi 4,0 + gigi 1,4). */
function pabrik_kawat(g, len, h){ _jeruji(g, len, h, 0, .05, 0, Math.max(4, Math.round(len / 1.0)), '#8E979C', { batang: .03, rel: .05, lod: 1 });
  const np = Math.max(1, Math.round(len / 7.5)); for (let k = 0; k <= np; k++) taruh(g, 'box', .1, h + .15, .1, -len / 2 + .05 + (len - .1) * k / np, (h + .15) / 2, 0, '#6F6A60', { slot: 0, lod: 1 }); }
// jalusi ventilasi hemat: lubang gelap menempel dinding (1 kotak) + 3 bilah horizontal satu muka (lod 1); rangka f di bidang dinding, alas y
function pabrik_jalusi(f, w, h, cW){ taruh(f, 'box', w, h, .06, 0, h / 2, 0, darken(cW, .55), { attach: 'z+', slot: 0 });
  taruh(f, 'custom', w - .08, h - .08, 1, 0, h / 2, .04, darken(cW, .85), { geo: pabrik_bilahGeo().geo, edges: null, noHull: true, noEdge: true, slot: 0, lod: 1 }); }
function pabrik_bilahGeo(){ let G0 = _GEO.get('pabrik_bilah'); if (G0) return G0; const t = [];
  for (const y of [-.25, 0, .25]) t.push(-.5, y - .06, 0, .5, y - .06, 0, .5, y + .06, 0, -.5, y - .06, 0, .5, y + .06, 0, -.5, y + .06, 0);
  G0 = _geoFrom(t, null); _GEO.set('pabrik_bilah', G0); return G0; }
// tangga silo: 2 ibu tangga + n anak tangga sebagai bidang tipis dua muka (satuan [-,5,,5]); 4 segitiga per batang
function pabrik_tanggaGeo(n){ const key = 'pabrik_tangga|' + n; let G0 = _GEO.get(key); if (G0) return G0; const t = [];
  const quad = (x0, y0, x1, y1) => t.push(x0, y0, 0, x1, y0, 0, x1, y1, 0, x0, y0, 0, x1, y1, 0, x0, y1, 0);   // satu muka (menghadap jalan)
  quad(-.5, -.5, -.36, .5); quad(.36, -.5, .5, .5);
  for (let k = 1; k <= n; k++){ const y = -.5 + k / (n + 1); quad(-.36, y - .012, .36, y + .012); }
  G0 = _geoFrom(t, null); _GEO.set(key, G0); return G0; }
// truk engkel: kabin kuning + kaca + bak kayu hijau + 4 roda; menghadap +z lokal (kabin di depan)
function pabrik_truk(x, z, rot, cK){ const f = rangka(x, 0, z, rot);
  taruh(f, 'box', 2.0, 1.55, 1.6, 0, 1.35, 2.0, cK, { slot: 0 });
  taruh(f, 'box', 1.8, .6, .06, 0, 1.75, 2.82, KACA[0], { glow: true, attach: 'z-' });
  taruh(f, 'box', 2.06, .3, .2, 0, .55, 2.85, '#3A3D40', { slot: 0 });
  taruh(f, 'box', 2.1, .3, 3.9, 0, .75, -.75, '#3A3D40', { slot: 0 });                         // sasis
  taruh(f, 'box', 2.1, .95, 3.9, 0, 1.38, -.75, '#4F7A55', { slot: 0 });                        // bak kayu
  taruh(f, 'box', 1.9, .08, 3.7, 0, 1.82, -.75, '#7A5A3A', { slot: 0, lod: 1, noEdge: true });  // muatan karung
  for (const a of [-1, 1]) for (const b of [1.9, -1.8]) taruh(f, 'box', .3, .8, .8, a * .95, .4, b, '#1E1C1A', { slot: 0, noEdge: true, lod: 1 });
  for (const a of [-1, 1]) taruh(f, 'box', .2, .14, .06, a * .75, .78, 2.86, LAMPU, { glow: true, lod: 1 }); }
CAT.pabrik.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, m = s & 1 ? -1 : 1, LW = fx + .8, LD = fz + .8, hx = LW / 2, hz = LD / 2;
  const cH = '#C9C1B2', cPl = '#8E8A84', H = 4.0, PRODUK = ['KERUPUK', 'TEKSTIL', 'SABUN', 'KERAMIK'][s];
  // ---- hall ----
  const bw = 13.7, zb = -hz + .45, zf = zb + 7.5, bd = zf - zb, zc = (zb + zf) / 2;
  dinding(bw, H, bd, 0, 0, zc, cH, { plinth: .9, cPlinth: cPl, slot: 0 });
  atapGergaji(bw - .1, bd - .1, 0, H, zc, { n: s === 3 ? 5 : 4, tinggi: 1.4, c: '#6E7F8A' });
  // parapet depan bertulisan cat (lis topi), menembus muka dinding
  const pf = rangka(0, H, zf, 0);
  taruh(pf, 'box', bw + .1, .9, .3, 0, .45, -.1, cH, { slot: 0, wall: true });
  taruh(pf, 'box', bw + .2, .1, .4, 0, .95, -.1, darken(cH, .82), { slot: 0 });
  _teks(pf, 'PABRIK', -m * 3.2, .2, .06, 5, .5, '#4C6A96', { lod: 0 });
  // ---- muka hall: 2 rolling door + 3 jendela besi + lampu sorot ----
  // jarak bebas: reveal pintu A [-5,85,-2,75] · B [-2,45,,85] · jendela [-6,68,-6,02] & [1,12,2,18] (celah ≥ ,17 ke reveal, ,27 ke kantor)
  const dA = -m * 4.3, dB = -m * .8;
  rollingDoor(dA, zf, { w: 2.8, h: 3.0, buka: .75, isi: false, wall: cH, c: '#8A939A', cDalam: '#3A3430' });
  rollingDoor(dB, zf, { w: 3.0, h: 3.0, buka: 0, wall: cH, c: '#8A939A', jarakGaris: .75 });
  for (const [x, w] of [[-m * 6.35, .5], [m * 1.65, .9]]) jendelaKecil(x, 2.2, zf, { w, h: .8, wall: cH, gelap: true, palang: true, ambang: false });
  lampuDinding((dA + dB) / 2, 3.6, zf, {});
  // samping (sisi truk): 3 jendela besi + talang
  const sr = -m * Math.PI / 2, xs = -m * bw / 2;
  for (const k of [-1.5, -.5, .5, 1.5]) jendelaKecil(xs, 2.2, zc + k * 1.75, { rot: sr, w: 1.0, h: .8, wall: cH, gelap: true, palang: true, ambang: false });
  talang(xs, 0, H - .05, { z: zf - .3, rot: sr });
  // samping seberang: 3 jalusi ventilasi tinggi + talang · belakang: 2 jalusi (dinding tidak polos)
  const sr2 = m * Math.PI / 2, xs2 = m * bw / 2;
  for (const k of [-1, 0, 1]) pabrik_jalusi(rangka(xs2, 2.75, zc + k * 2.3, sr2), 1.2, .5, cH);
  talang(xs2, 0, H - .05, { z: zb + .3, rot: sr2 });
  for (const x of [-3.4, 3.4]) pabrik_jalusi(rangka(x, 2.75, zb, Math.PI), 1.5, .5, cH);
  // ---- cerobong bata 9 m + cincin putih (2) ----
  for (const [x, z] of [[-m * 4.8, zb + 1.3], [-m * 3.1, zb + 1.5]]){ cylLo(.5, 9, x, 0, z, '#A8553B'); const q1 = cylLo(.56, .35, x, 7.6, z, '#E6E2D8'); q1.noEdge = true;
  }
  // ---- kantor depan 1 lantai ----
  const ow = 4.4, od = 3.6, ox = m * (bw / 2 - ow / 2), oz = zf + od / 2 - .05, ozf = zf + od - .05, oH = LANTAI_USAHA, cO = '#E3DED2';
  dinding(ow, oH, od, ox, 0, oz, cO, { plinth: .5, cPlinth: cPl, slot: 0 });
  atapDatar(ow, od, ox, oH, oz, { parapet: .4, cParapet: cO, c: '#B8B2A6' });
  pintu(ox - m * 1.2, ozf, { w: 1.0, h: 2.3, c: '#3A3F44', kaca: true, kusen: BINGKAI, wall: cO, kanopi: true });
  jendela(ox + m * .8, 1.0, ozf, { w: 1.6, h: 1.4, wall: cO, kusen: KUSEN, palang: true, ambang: true });
  papanNama(ox, oH + .45, ozf, { w: ow - .4, h: .75, c, slot: 1, teks: PRODUK, cTeks: '#EDE8DC' });
  const so = m * Math.PI / 2; ac(ox + m * ow / 2, 2.6, oz, { rot: so });
  // ---- tangki / silo ----
  const silo = (x, z, r, h) => { for (const a of [-1, 1]) for (const b of [-1, 1]) box(.14, 1.3, .14, x + a * r * .6, 0, z + b * r * .6, '#5E666C');
    cylLo(r, h, x, 1.3, z, '#D8D8D2'); cone(r, .7, x, 1.3 + h, z, '#BFC3C6'); P[P.length - 1].lod = 1;
    taruh(rangka(x, 0, z + r + .06, 0), 'custom', .4, h + 1.2, 1, 0, (h + 1.2) / 2, 0, '#8E979C', { geo: pabrik_tanggaGeo(Math.round(h / .45)).geo, edges: null, noHull: true, noEdge: true, slot: 0, lod: 1 }); };   // tangga: 2 ibu tangga + anak tangga
  if (s === 2){ silo(m * 5.7, hz - 2.2, .85, 2.8);   // + tangki solar rebah di 2 pelana beton
    const tf = rangka(m * 3.3, 0, hz - 2.0, 0); for (const k of [-1, 1]) taruh(tf, 'box', .25, .5, 1.1, k * .8, .25, 0, '#B8B2A6', { slot: 0 });
    taruh(tf, 'cylLo', 1.1, 2.4, 1.1, 0, 1.0, 0, '#3F7D92', { slot: 0, rx: Math.PI / 2, ry: Math.PI / 2 }); }
  else silo(m * 6.5, hz - 1.7, .95, 3.0);
  // ---- truk + palet & peti + drum ----
  if (s === 2) pabrik_truk(-m * 2.6, hz - 2.1, m * Math.PI / 2, '#D9A441');
  else pabrik_truk(dA, zf + 3.7, 0, ['#D9A441', '#3E6FB0', '', '#D9A441'][s] || '#D9A441');
  { const px = dB + m * .2, pz = zf + 1.2; box(1.6, .15, 1.2, px, 0, pz, '#B8945F');
    for (let k = 0; k < 4; k++){ box(.72, .6, .55, px + (k % 2 ? .38 : -.38), .15 + (k >> 1) * .6, pz + (k === 3 ? .1 : 0), k % 2 ? '#B8945F' : '#C2A06A'); P[P.length - 1].lod = 1; } }
  cylLo(.3, .9, -m * 6.4, 0, zf + .6, '#3E6FB0').lod = 1;   // drum (satu: anggaran segitiga)
  // ---- pagar besi depan + gerbang lebar, pagar kawat samping ----
  const zP = hz - .2, gw = 5.0, gx = -m * 4.4;
  pagarHalaman(LW - .3, zP, { gaya: 'besi', h: 1.2, gx, gW: gw, pilar: 3.2, jarakBesi: .32, c: cH, cPilar: '#B8B2A6' });
  for (const sx of [-1, 1]) pabrik_kawat(rangka(sx * (hx - .15), 0, (zP + zb) / 2, Math.PI / 2), zP - zb - .4, 1.8);
};
