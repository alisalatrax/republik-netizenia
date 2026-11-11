/* pln (1×1) — spek-gaya §6 no. 18. Gardu distribusi listrik kampung/kota Indonesia (desain orisinal):
   gardu beton 3,0×2,4×2,8 abu #BFC7CC (plint, lis, dak beton + teritis / atap seng / limasan genteng), pintu besi dobel berkisi,
   tanda petir kuning (segitiga + kilat merah), plat 'PLN' + nomor gardu, kisi ventilasi, lampu jaga, meteran;
   trafo 1 di landasan beton (badan silinder 8 sisi + sirip radiator + 3 isolator), panel kabel tegangan rendah,
   trafo 2 di tiang listrik beton 8,0 m (seed 0/2: satu tiang + palang + trafo tergantung; seed 1/3: gardu portal 2 tiang + lantai kerja),
   pagar kawat (depan + samping) dengan gerbang besi + plat 'BAHAYA', tembok belakang, alas kerikil, papan informasi 2 kaki.
   Varian: bit 0 = cermin (gardu kiri/kanan) · seed 0 dak beton · 1 dak + portal · 2 atap seng pelana · 3 limasan genteng + portal.
   Semua bagian di dalam kavling (|x|,|z| ≤ 4); muka +z = jalan. */
function pln_tri(key, tris){ let G0 = _GEO.get(key); if (!G0){ G0 = _geoFrom(tris, null); _GEO.set(key, G0); } return G0; }
// tanda petir: segitiga kuning + kilat merah (bidang tipis menempel dinding, detail dekat)
function pln_petir(f, dx, dy, dz, s){
  const T0 = pln_tri('pln_segitiga', [-.5, -.5, 0, .5, -.5, 0, 0, .5, 0]);
  const B0 = pln_tri('pln_kilat', [.12, .42, 0, -.2, -.06, 0, .06, -.02, 0, -.08, .06, 0, .18, .02, 0, -.12, -.42, 0]);
  taruh(f, 'custom', s, s * .9, 1, dx, dy, dz, '#D9A441', { geo: T0.geo, edges: null, noHull: true, noEdge: true, lod: 1, slot: 0 });
  taruh(f, 'custom', s * .55, s * .6, 1, dx, dy - s * .08, dz + .012, '#B5473A', { geo: B0.geo, edges: null, noHull: true, noEdge: true, lod: 1, slot: 0 }); }
// pagar kawat hemat: jaring (jeruji 2 muka, jarak ,3) + rel atas + tiang tiap ≤ 2,5 m; rangka g: pusat sisi, sumbu x = panjang
function pln_kawat(g, len, h, tiang){ _jeruji(g, len, h, 0, .05, 0, Math.max(4, Math.round(len / .62)), '#8E979C', { batang: .03, rel: .05, lod: 1 });
  for (const t of tiang) taruh(g, 'box', .1, h + .15, .1, t * (len / 2 - .05), (h + .15) / 2, 0, '#6F6A60', { slot: 0 }); }
// kisi ventilasi beton: bingkai gelap + 2 bilah (lod 1); rangka f di bidang dinding
function pln_kisi(f, dx, dy, w, h){ taruh(f, 'box', w + .12, h + .12, .06, dx, dy + h / 2, 0, '#5E666C', { attach: 'z+', slot: 0 });
  taruh(f, 'box', w, .05, .06, dx, dy + h / 2, .04, '#BFC7CC', { slot: 0 }); }
// trafo: badan silinder + tutup + 2 sirip radiator + 3 isolator (bushing) + papan nama kecil; alas di (x, y, z), hadap rot
function pln_trafo(x, y, z, rot, s){ const f = rangka(x, y, z, rot || 0), r = .42 * s, h = 1.15 * s, cT = '#7E8A8F';
  taruh(f, 'cylLo', r * 2, h, r * 2, 0, h / 2, 0, cT, { slot: 0 });
  for (const k of [-1, 0, 1]) taruh(f, 'box', .13, .36 * s, .13, k * r * .6, h + .1 + .18 * s, -r * .2, '#8E5A3A', { slot: 0 }); }
// tiang listrik beton 8 m + palang + 3 isolator; trafo tergantung opsional (sisi +z pemasangan)
function pln_tiang(x, z, h, rot, trafo, arm){ const f = rangka(x, 0, z, rot || 0);
  taruh(f, 'cylLo', .28, h, .28, 0, h / 2, 0, '#B8B4AA', { slot: 0 });
  if (arm === false) return f;
  taruh(f, 'box', 1.7, .12, .14, 0, h - .5, 0, '#6F6A60', { slot: 0 });
  for (const k of [-.7, 0, .7]) taruh(f, 'box', .1, .26, .1, k, h - .5 + .19, 0, '#8E5A3A', { slot: 0 });
  if (trafo){ taruh(f, 'box', .9, .1, .1, 0, h - 3.4, .2, '#6F6A60', { slot: 0 }); pln_trafo(f.at(0, 0, .55)[0], h - 3.35, f.at(0, 0, .55)[2], f.r, .75);
    taruh(f, 'box', .03, 2.0, .03, 0, h - 1.6, .3, '#2B2B2B', { slot: 0 }); }   // kabel turun (lod 1 otomatis)
  return f; }
CAT.pln.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, m = s & 1 ? -1 : 1, LW = fx + .8, LD = fz + .8, hx = LW / 2, hz = LD / 2;
  const cG = '#BFC7CC', cPl = '#8E979C', portal = s === 1 || s === 3;
  // ---- alas kerikil di dalam pagar ----
  box(LW - .5, .05, LD - .5, 0, .03, 0, '#A9A398'); P[P.length - 1].noEdge = true;
  // ---- gardu beton ----
  const gw = 3.0, gd = 2.4, gh = 2.8, gx = -m * (hx - .35 - gw / 2), zf = .7, gz = zf - gd / 2;
  dinding(gw, gh, gd, gx, 0, gz, cG, { plinth: .45, cPlinth: cPl, slot: 0 });
  // pintu besi dobel + kisi atas
  pintu(gx, zf, { w: 1.5, h: 2.1, daun: 2, c: '#5E666C', kusen: '#3A3F44', wall: cG, panel: false });
  const f0 = rangka(gx, 0, zf, 0);
  pln_petir(f0, -.42, 1.05, .085, .38);
  // plat PLN + nomor gardu di atas pintu, lampu jaga, kisi ventilasi kiri-kanan pintu
  // plat di bawah teritis (seed 3 limasan: plat 2,2–2,58 & teritis ,25 agar tidak tertutup); lampu jaga di atas kisi kiri (kisi s.d. y 2,16)
  papanNama(gx, s === 3 ? 2.2 : 2.3, zf, { w: 1.3, h: s === 3 ? .38 : .4, c: '#3F7D92', teks: 'PLN', cTeks: '#EDE8DC', bingkai: false });
  lampuDinding(gx - gw / 2 + .3, 2.5, zf, {});
  for (const sx of [-1, 1]) pln_kisi(f0, sx * 1.15, 1.55, .4, .55);
  // samping: 2 kisi + meteran; belakang: kisi
  const sSamping = m > 0 ? Math.PI / 2 : -Math.PI / 2, xs = gx + m * gw / 2;
  meteranListrik(xs, 1.0, gz, { rot: sSamping });
  // ---- atap gardu ----
  if (s === 2) atapPelana(gw, gd, gx, gh, gz, { arah: 'z', sudut: 18, overhang: .3, c: '#8E979C', cWall: cG, gaya: 'pejal', pita: false });
  else if (s === 3) atapLimasan(gw, gd, gx, gh, gz, { sudut: 28, overhang: .25, c: gt, cWall: cG });
  else { box(gw + .5, .22, gd + .5, gx, gh, gz, '#D2D6D6');
    talang(gx + m * (gw / 2 - .2), 0, gh - .05, { z: zf }); }
  // ---- trafo 1 di landasan + panel tegangan rendah ----
  const tx = m * (hx - 1.35), tz = .15;
  box(1.7, .3, 1.5, tx, 0, tz, '#B8B2A6');
  pln_trafo(tx, .3, tz, 0, 1);
  const pf = rangka(tx - m * .2, 0, tz + 1.35, 0);
  taruh(pf, 'box', .9, 1.3, .38, 0, .65, 0, '#9AA3A8', { slot: 0 });
  taruh(pf, 'box', .02, 1.1, .02, 0, .65, .2, '#5E666C', { slot: 0 });   // garis pintu panel
  pln_petir(pf, -.22, 1.0, .2, .22);
  // ---- trafo 2: tiang tunggal (seed 0/2) atau gardu portal (1/3) di belakang ----
  const pz = -hz + .55, px = m * (hx - 1.6);
  if (!portal){ pln_tiang(px, pz, 8.0, 0, true); }
  else { const pw = 2.2; for (const k of [-1, 1]) pln_tiang(px + k * pw / 2, pz, 7.2, 0, false, false);
    const fp = rangka(px, 0, pz, 0);
    taruh(fp, 'box', pw + .5, .14, .9, 0, 4.0, .25, '#6F6A60', { slot: 0 });   // lantai kerja trafo
    pln_trafo(px, 4.07, pz + .25, 0, .85);
    taruh(fp, 'box', pw + .2, .12, .14, 0, 6.3, 0, '#6F6A60', { slot: 0 });
    for (const k of [-.8, .8]) taruh(fp, 'box', .1, .3, .1, k, 6.44 + .15, 0, '#8E5A3A', { slot: 0 }); }
  // ---- tembok belakang + pagar kawat depan/samping + gerbang ----
  box(LW - .2, 1.6, .2, 0, 0, -hz + .12, '#C9BBA0');
  const zP = hz - .2, gW = 2.0, gcx = m * 1.2, kh = 1.8;
  for (const [a, b, t] of [[-hx + .2, gcx - gW / 2 - .1, [-1]], [gcx + gW / 2 + .1, hx - .2, [1]]]) pln_kawat(rangka((a + b) / 2, 0, zP, 0), b - a, kh, t);
  for (const sx of [-1, 1]) pln_kawat(rangka(sx * (hx - .2), 0, (zP - hz + .25) / 2, Math.PI / 2), zP - (-hz + .25), kh, [0]);
  // gerbang besi 2 daun + plat BAHAYA
  const gf = rangka(gcx, 0, zP, 0);
  for (const k of [-1, 1]){ taruh(gf, 'box', .16, kh + .35, .16, k * (gW / 2 + .05), (kh + .35) / 2, 0, '#5E666C', { slot: 0 });
    _jeruji(gf, gW / 2 - .06, kh - .1, k * gW / 4, .08, 0, 5, '#5E666C', { batang: .045, rel: .07, lod: 0 }); }
  taruh(gf, 'box', .7, .4, .03, -gW / 4, 1.05, .05, '#B5473A', { slot: 0, noHull: true });
  _teks(gf, 'BAHAYA', -gW / 4, 1.12, .07, .6, .16, '#EDE8DC');
  pln_petir(gf, gW / 4, 1.25, .05, .36);
};
