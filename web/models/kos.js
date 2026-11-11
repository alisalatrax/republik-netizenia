/* kos (2×1) — spek-gaya §6 no. 3. Rumah kos 2–3 lantai (3,2/lantai) khas Indonesia, muka 2 kavling:
   3 unit muka (± 4,5 m, warna dinding beda, parapet beda tinggi ±,4) berisi kamar: pintu kamar + 2 jendela kecil per unit per lantai
   (6 jendela kecil/lantai), AC luar di atas jendela (selang-seling), lis lantai, plint;
   koridor luar tiap lantai atas (pelat menjorok 1,3 + pagar tembok/besi) dipikul kolom menerus dari tanah sampai dak,
   dak beton menaungi koridor teratas + parapet depan + papan nama 'KOS …' + spanduk 'TERIMA KOS' di pagar koridor,
   TANGGA LUAR beton tipe U (bordes belakang) di zona samping, dengan pegangan besi & kolom bordes,
   teras bawah dengan motor parkir, jemuran handuk di pagar koridor, 2 toren air di atap, pagar besi + gerbang di depan tangga.
   Varian seed: 0 tangga kiri + pagar koridor tembok · 1 tangga kiri + pagar besi · 2 tangga kanan + pagar tembok berroster ·
   3 tangga kanan + pagar besi hijau + kanopi seng di atas pintu kamar. Tetangga deret di sisi tangga → tangga pindah sisi;
   deret di kedua sisi → zona tangga ditutup dinding batas + dak (rapat ke batas, tanpa celah). Semua bagian di dalam kavling. */
// tangga cor satuan [-,5,,5]³: n anak tangga naik dari (z −,5, y −,5) ke (z ,5, y ,5); sisi gigi gergaji, soffit miring (tebal 2 anak tangga)
function kos_tanggaGeo(n, sisi){ sisi = sisi || 'lr'; const key = 'kosTangga|' + n + sisi; let G0 = _GEO.get(key); if (G0) return G0;
  const SX = (sisi.includes('l') ? [-.5] : []).concat(sisi.includes('r') ? [.5] : []);
  const t = [], e = [], d = 1 / n, a = 2 * d, zk = k => -.5 + k * d, top = k => -.5 + (k + 1) * d, ys = z => Math.max(-.5, z - a);
  const quad = (p, q, r, s, nn) => { const u = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], v = [r[0] - p[0], r[1] - p[1], r[2] - p[2]];
    const cr = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; if (cr[0] * nn[0] + cr[1] * nn[1] + cr[2] * nn[2] < 0){ const tmp = q; q = s; s = tmp; }
    t.push(...p, ...q, ...r, ...p, ...r, ...s); };
  for (let k = 0; k < n; k++){ const z0 = zk(k), z1 = zk(k + 1), yt = top(k), yb = k ? top(k - 1) : -.5;
    quad([-.5, yt, z0], [.5, yt, z0], [.5, yt, z1], [-.5, yt, z1], [0, 1, 0]);            // injakan
    quad([-.5, yb, z0], [.5, yb, z0], [.5, yt, z0], [-.5, yt, z0], [0, 0, -1]);           // tegakan
    for (const sx of SX) quad([sx, ys(z0), z0], [sx, ys(z1), z1], [sx, yt, z1], [sx, yt, z0], [Math.sign(sx), 0, 0]);
    e.push(-.5, yt, z0, .5, yt, z0);                                                        // garis tepi injakan (nosing)
    for (const sx of SX) e.push(sx, yb, z0, sx, yt, z0, sx, yt, z0, sx, yt, z1); }  // profil gigi gergaji (sisi tampak saja)
  quad([-.5, .5 - a, .5], [.5, .5 - a, .5], [.5, .5, .5], [-.5, .5, .5], [0, 0, 1]);      // ujung atas
  quad([-.5, -.5, -.5 + a], [.5, -.5, -.5 + a], [.5, .5 - a, .5], [-.5, .5 - a, .5], [0, -1, 1]);   // soffit
  for (const sx of SX) e.push(sx, -.5, -.5 + a, sx, .5 - a, .5);
  G0 = _geoFrom(t, e); _GEO.set(key, G0); return G0; }
// satu lengan tangga: lebar w, naik h dari alas yb, panjang datar L; arah +1 = naik ke +z (ke jalan), −1 = naik ke −z; ujung bawah di zBawah
function kos_lengan(x, yb, zBawah, w, h, L, arah, c, n, sisi){ const G0 = kos_tanggaGeo(n, sisi), f = rangka(x, yb, zBawah + arah * L / 2, arah > 0 ? 0 : Math.PI);
  return taruh(f, 'custom', w, h, L, 0, h / 2, 0, c, { geo: G0.geo, edges: G0.edges, slot: 0 }); }
// pegangan besi miring + 2 tiang di sisi lengan (sx = −1/+1 sisi lokal)
function kos_pegangan(x, yb, zBawah, w, h, L, arah, sx, c){ const f = rangka(x, yb, zBawah + arah * L / 2, arah > 0 ? 0 : Math.PI), th = Math.atan2(h, L), Ls = Math.hypot(h, L);
  taruh(f, 'box', .05, .06, Ls, sx * (w / 2 - .05), h / 2 + .9, 0, c, { rx: -th, slot: 0 });
  for (const dz of [-L / 2 + .2, L / 2 - .2]){ const yn = h / 2 + dz * h / L; taruh(f, 'box', .045, .9, .045, sx * (w / 2 - .05), yn + .45, dz, c, { slot: 0 }); } }
// detail kecil → lod 1 (dibuang di LOD jauh): semua primitif P yang didorong fn
function kos_lod1(fn){ const n0 = P.length; fn(); for (let k = n0; k < P.length; k++) P[k].lod = 1; }
// pintu kamar kos hemat: daun + kusen cincin (± 30 segitiga; reveal gelap dibuang demi anggaran)
function kos_pintu(x, y, z, c, wl, kusen){ const f = rangka(x, y, z, 0), w = .85, h = 2.1;
  taruh(f, 'box', w, h, .08, 0, h / 2, .02, c, { attach: 'z+', slot: 0 });
  _bingkai(f, w + .2, h + .06, .09, 0, 0, .03, .09, kusen, false); }
// motor parkir di atas lantai yang ditinggikan (motor() bawaan selalu di y=0): rangka sendiri di y; roda Ø,52, dek kaki gelap,
// bodi belakang + perisai kaki warna cerah, jok hitam terpisah, spakbor depan, setang. Menghadap +z lokal (2 silinder + 6 kotak ≈ 136 segitiga).
function kos_motor(x, y, z, rot, c){ const f = rangka(x, y, z, rot), cb = campur(c, '#F2EEE6', .28);
  for (const zz of [-.6, .6]) taruh(f, 'cylLo', .52, .09, .52, 0, .26, zz, '#1E1C1A', { rx: Math.PI / 2, ry: Math.PI / 2, slot: 0, noEdge: true });
  taruh(f, 'box', .3, .1, .6, 0, .36, .02, '#3A3D40', { slot: 0 });                               // dek kaki
  const q = taruh(f, 'box', .34, .34, .66, 0, .6, -.32, cb, { slot: 0 });                       // bodi belakang (mesin + bagasi)
  taruh(f, 'box', .3, .1, .62, 0, .82, -.3, '#2B2B2B', { slot: 0 });                             // jok
  taruh(f, 'box', .34, .72, .14, 0, .7, .34, cb, { slot: 0 });                                  // perisai kaki + kepala setang
  taruh(f, 'box', .14, .06, .44, 0, .55, .6, cb, { slot: 0, lod: 1 });                          // spakbor depan
  taruh(f, 'box', .64, .045, .045, 0, 1.08, .34, BESI, { slot: 0 });                            // setang
  return q; }
CAT.kos.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, A = ctx.adj || {}, aL = !!A.l, aR = !!A.r;
  const LW = fx + .8, LD = fz + .8, n = clamp(floors || 2, 2, 3), H = n * LANTAI;
  const X0 = aL ? -LW / 2 : -LW / 2 + .2, X1 = aR ? LW / 2 : LW / 2 - .2, cxAll = (X0 + X1) / 2, WA = X1 - X0;
  const iw = Math.max(0, WALLS.indexOf(wl)), ia = Math.max(0, AKSEN.indexOf(c));
  // ---- zona tangga (lebar 2,25: dua lengan + celah) di sisi seed, pindah bila sisi itu deret; tertutup bila deret kedua sisi ----
  let sd = s < 2 ? -1 : 1; if ((sd < 0 ? aL : aR) && !(sd < 0 ? aR : aL)) sd = -sd;
  const tutup = sd < 0 ? aL : aR, zw = 2.25;
  const XZ0 = sd < 0 ? X0 : X1 - zw, XZ1 = XZ0 + zw;                       // zona tangga
  const XB0 = sd < 0 ? XZ1 : X0, XB1 = sd < 0 ? X1 : XZ0, bw = XB1 - XB0;   // badan kamar
  const nb = bw >= 11 ? 3 : bw >= 7 ? 2 : 1, ub = bw / nb;
  const jk = 1.3, zf = LD / 2 - 1.7, zb = -LD / 2 + .4, dep = zf - zb, zc = (zb + zf) / 2, zK = zf + jk;   // zK = tepi depan koridor
  const cols = [WALLS[(iw + 3 + s % 2) % 10], wl, WALLS[(iw + 6 + (s >> 1)) % 10]].slice(0, nb);
  if (nb === 2) cols[1] = WALLS[(iw + 5) % 10]; if (nb === 1) cols[0] = wl;
  const kusen = [KUSEN, '#7A5A3A', KUSEN, '#5E666C'][s], cPintu = [KAYU, '#4E6B5A', '#7A5A3A', c][s];
  const NETRAL = '#D6D0C4', besi = s === 1 || s === 3, cBesi = s === 3 ? '#3F6B62' : BESI;
  // ---- badan per unit: dinding + lis lantai; kamar per lantai: pintu + jendela kecil (kaca nako) + jendela kamar mandi + AC ----
  const lis = []; for (let k = 1; k < n; k++) lis.push(k * LANTAI - .06);
  for (let b = 0; b < nb; b++){ const bx0 = XB0 + b * ub, bcx = bx0 + ub / 2, col = cols[b], fl = bx0 + (sd < 0 ? 0 : 0);
    const uA = { l: b === 0 ? (sd < 0 ? 0 : aL) : 1, r: b === nb - 1 ? (sd > 0 ? 0 : aR) : 1 };
    dinding(ub, H, dep, bcx, 0, zc, col, { plinth: .4, cPlinth: '#8E8A84', lis, adj: uA, slot: col === wl ? 2 : 0 });
    for (let k = 0; k < n; k++){ const y = k * LANTAI + (k ? 0 : .15), m = ub > 3.9;
      const xd = fl + .92, xw = fl + (m ? 2.15 : ub - .75), xm = fl + ub - .62;
      kos_pintu(xd, y, zf, cPintu, col, kusen);
      jendelaKecil(xw, y + .95, zf, { w: .9, h: .85, wall: col, kusen, palang: false });
      if (m) taruh(rangka(xm, y + 1.62, zf, 0), 'box', .56, .3, .06, 0, .15, 0, '#4E4740', { attach: 'z+', slot: 0, lod: 1 });   // roster kamar mandi
      if ((b + k + s) % 2 === 0) kos_lod1(() => ac(xw, y + 2.12, zf, {}));
    }
    // ---- atap: dak per unit (meliputi koridor) + parapet beda tinggi; sisi antar-unit tanpa parapet ----
    const ph = .5 + ((b + s + iw) % 3) * .2;
    atapDatar(ub, dep + jk, bcx, H, (zb + zK) / 2, { parapet: ph, cParapet: col, slotParapet: col === wl ? 2 : 0, c: '#B8B2A6', adj: uA });
    if (b !== 1 || nb < 3) tandon(bcx + (b ? -1 : 1) * ub * .15, H + .12, zb + .95, { c: (b + iw) % 2 ? 'biru' : '#D9762B', kaki: .7 });
  }
  // ---- teras bawah (lantai ,15) + motor parkir sejajar muka ----
  box(bw, .15, jk, (XB0 + XB1) / 2, 0, zf + jk / 2, ['#C9BFA6', '#BFB6A8', '#CFC3AE', '#B6AFA2'][s]);
  const nm = 1; for (let m = 0; m < nm; m++){ const bx0 = XB0 + (m * 2 % nb) * ub; kos_motor(bx0 + Math.min(2.6, ub - .9), .15, zf + .62, Math.PI / 2 + (m ? -.1 : .1), ['#B4443A', '#3E5A82', '#2E3A40', '#C9D3DC'][(iw + m) % 4]); }
  // ---- koridor luar tiap lantai atas: pelat menerus (termasuk bordes depan zona tangga) + pagar ----
  const cPelat = '#CFC9BC', cPagar = s === 2 ? campur(NETRAL, wl, .25) : NETRAL;
  for (let k = 1; k < n; k++){ const y = k * LANTAI;
    box(WA, .2, jk, cxAll, y - .2, zf + jk / 2, cPelat);
    kos_lod1(() => box(WA - .04, .07, .06, cxAll, y - .26, zK - .04, '#9C968C'));   // tetes air
    if (!besi){ box(WA, .9, .12, cxAll, y, zK - .06, cPagar); box(WA, .08, .2, cxAll, y + .9, zK - .07, darken(cPagar, .86));
      if (s === 2) for (let b = 0; b < nb; b++) kos_lod1(() => box(1.2, .26, .04, XB0 + b * ub + ub * .55, y + .38, zK + .005, '#4E4740'));   // roster lubang angin per unit
    } else { const fr = rangka(cxAll, y, zK - .05, 0); _jeruji(fr, WA - .06, .82, 0, .04, 0, Math.max(8, Math.round(WA / .3)), cBesi, { lod: 1, satu: 1, rel: .05 });
      taruh(fr, 'box', WA, .07, .12, 0, .9, 0, cBesi, { slot: 0 }); box(WA, .1, .1, cxAll, y, zK - .05, darken(cPelat, .9)); }
    // pagar ujung koridor (sisi bebas), handuk & kain dijemur di pagar
    for (const xe of [X0 + .06, X1 - .06]) box(.12, .9, jk - .12, xe, y, zf + (jk - .12) / 2, cPagar);
    const cs = ['#B5473A', '#E6E2D8', '#4C6A96', '#C2913A', '#6F5E8C'];
    for (let h = 0; h < 2; h++){ const xh = XB0 + bw * (h * 2 + .5 + (k % 2) * .25) / 3.4; taruh(rangka(xh, y + .9, zK + .01, 0), 'box', .45 + (h % 2) * .15, .55, .03, 0, -.25, .02, cs[(h + k + s) % 5], { slot: 0, lod: 1, noEdge: true, noHull: true }); }
  }
  // spanduk TERIMA KOS di pagar koridor lantai 2 (unit tengah/kanan)
  if (!besi) spanduk(XB0 + bw * (nb === 3 ? .5 : .55), LANTAI + .12, zK, { w: Math.min(2.8, bw * .4), h: .62, c: '#E6E2D8', teks: 'TERIMA KOS', cTeks: '#B5473A', lod: 1 });
  // ---- kolom koridor menerus dari tanah ke dak, di depan pagar (tidak sebidang) ----
  const kxs = [X0 + .14, X1 - .14]; for (let b = 0; b <= nb; b++) kxs.push(XB0 + b * ub); kxs.push(sd < 0 ? XZ1 : XZ0);
  for (const kx of [...new Set(kxs.map(v => +clamp(v, X0 + .14, X1 - .14).toFixed(2)))]) box(.26, H, .26, kx, 0, zK - .1, '#E3DED2');
  // ---- dak di atas bordes zona tangga + parapet; zona tertutup (deret dua sisi): dinding batas + dak penuh ----
  const zzc = (XZ0 + XZ1) / 2;
  if (tutup){ dinding(.2, H, dep, sd < 0 ? XZ0 + .1 : XZ1 - .1, 0, zc, cols[sd < 0 ? 0 : nb - 1], { plinth: .4, cPlinth: '#8E8A84', adj: { l: 1, r: 1 }, slot: 0 });
    atapDatar(zw, dep + jk, zzc, H, (zb + zK) / 2, { parapet: .45, cParapet: NETRAL, c: '#B8B2A6', adj: { l: sd > 0 ? 1 : 1, r: 1 } }); }
  else atapDatar(zw, jk, zzc, H, zf + jk / 2, { parapet: .45, cParapet: NETRAL, c: '#B8B2A6', sisi: sd < 0 ? 'fl' : 'fr', adj: {} });
  // ---- tangga luar beton tipe U: lengan luar naik ke belakang, bordes belakang, lengan dalam naik ke depan (per lantai) ----
  const nT = 7, L = 1.9, wT = 1.05, xo = sd < 0 ? XZ0 + .05 + wT / 2 : XZ1 - .05 - wT / 2, xi2 = sd < 0 ? XZ1 - .05 - wT / 2 : XZ0 + .05 + wT / 2;
  const cT = ['#BFB6A8', '#C9BFA6', '#B6AFA2', '#C6B898'][s], zBo = zf - L - 1.0;
  for (let k = 0; k < n - 1; k++){ const y0 = k * LANTAI, hh = LANTAI / 2;
    kos_lengan(xo, y0, zf, wT, hh, L, -1, cT, nT, tutup ? '-' : (sd < 0 ? 'r' : 'l')); kos_lengan(xi2, y0 + hh, zf - L, wT, hh, L, 1, cT, nT, '-');
    box(zw - .1, .2, 1.02, zzc, y0 + hh - .2, zBo + .5, cT);                            // bordes belakang
    if (!tutup){ kos_pegangan(xo, y0, zf, wT, hh, L, -1, sd < 0 ? 1 : -1, cBesi);         // sisi luar lengan luar (dari arah lokal terbalik)
      box(.12, .9, .88, sd < 0 ? XZ0 + .1 : XZ1 - .1, y0 + hh, zBo + .56, NETRAL); box(zw - .1, .9, .12, zzc, y0 + hh, zBo + .06, NETRAL);   // tembok pagar bordes
      box(zw - .1, .07, .16, zzc, y0 + hh + .9, zBo + .06, darken(NETRAL, .86)); }
    box(.12, hh + .9, L, (xo + xi2) / 2, y0, zf - L / 2, campur(cT, NETRAL, .4));      // tembok tengah antar-lengan
  }
  box(.24, (n - 1) * LANTAI - LANTAI / 2 - .2, .24, sd < 0 ? XZ0 + .17 : XZ1 - .17, 0, zBo + .15, '#E3DED2');   // kolom bordes
  // ---- papan nama KOS di parapet depan unit tengah + lampu ----
  const NAMA = ['KOS PUTRI', 'KOS PUTRA', 'KOS CAMPUR', 'KOS PUTRI'][(s + iw) % 4];
  const bxN = XB0 + ub * Math.floor(nb / 2) + ub / 2;
  papanNama(bxN, H + .08, zK, { w: Math.min(3.4, ub - .4), h: .72, c, slot: 1, teks: NAMA, cTeks: '#EDE8DC' });
  lampuDinding(XB0 + ub - .25, 2.45, zf, {});
  // ---- pagar besi depan + gerbang di depan zona tangga; meteran & talang ----
  const zP = LD / 2 - .17, fx0 = aL ? -LW / 2 : -LW / 2 + .05, fx1 = aR ? LW / 2 : LW / 2 - .05;
  pagarHalaman(fx1 - fx0, zP, { x0: (fx0 + fx1) / 2, gaya: 'besi', h: .9, gx: zzc, gW: 1.7, adj: A, jarakBesi: .4, pilar: 5, c: campur(NETRAL, '#C9BBA0', .5), cBesi: cBesi });
  kos_lod1(() => meteranListrik(XB0 + .22, 1.5, zf, {})); teks(String(5 + iw * 3 + s), XB0 + .22, 2.3, zf, { tinggi: .16, c: darken(cols[0], .45), dz: .012 });
  // dinding ujung bebas (sisi tanpa tangga & tanpa tetangga deret): talang + jendela kecil per lantai
  if (!(sd < 0 ? aR : aL)){ const xe = sd < 0 ? XB1 : XB0, re = sd < 0 ? Math.PI / 2 : -Math.PI / 2; talang(xe, 0, H - .1, { z: zf - .3, rot: re });
    for (let k = 0; k < n; k++) jendelaKecil(xe, k * LANTAI + 1.2, zb + dep * .45 + (k % 2) * .9, { rot: re, w: .75, h: .8, wall: cols[sd < 0 ? nb - 1 : 0], kusen, palang: false });
    { const zw = zb + dep * .45, kt = n - 1, za = zw + (kt % 2 ? -1.1 : 1.3); taruh(rangka(xe, kt * LANTAI + .45, za, re), 'box', .8, .55, .17, 0, .275, .085, '#D8D8D2', { attach: 'z+', slot: 0, lod: 1 });   // AC kamar ujung (tipis: dinding hanya ,2 dari batas kavling)
      talang(xe, LANTAI, H - LANTAI - .1, { z: zb + .3, rot: re, c: '#8C8A84' });                                                       // pipa buangan
      taruh(rangka(xe, 0, zb + dep * .78, re), 'box', .5, 2.4, .02, 0, H - 1.2, 0, darken(cols[sd < 0 ? nb - 1 : 0], .9), { attach: 'z+', slot: 0, lod: 1, noEdge: true, noHull: true }); } }   // bekas rembesan
};
