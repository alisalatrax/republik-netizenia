/* proyek_gedung (2×2) — spek-tata-kota § proyek negara (stage 'bangun', owner null). Lokasi proyek gedung negara:
   rangka beton bertingkat (12 kolom ,45 + pelat cor ,3 + balok tepi) di atas lantai kerja, dinding bata ekspos #B5604A pada lantai bawah
   (bukaan jendela + kusen di varian 3), lantai teratas = bekisting multipleks + tiang perancah + anyaman besi (atau stek kolom + besi tunggu),
   perancah besi di muka + papan pijak + jaring pengaman hijau, pagar seng 2,2 (lembar beda nada + pita cat aksen + tiang), gerbang geser terbuka,
   papan proyek 3,0×1,6 di 2 tiang ('PROYEK NEGARA'), rambu K3, direksi keet (kantor proyek) + toren biru + lampu sorot, molen oranye,
   pasir & split kerucut, palet bata, sak semen, besi beton di bantalan, tumpukan kayu bekisting, jalur ban berlumpur, 2 pekerja berhelm.
   Tinggi rangka mengikuti target gedung (CBD 4 pelat, RUKO 3; seed 1 kurang 1), bukan 'floors' (= 1 untuk tipe proyek di floorsFor).
   Varian seed: 0 bekisting di atas + jaring muka · 1 pelat selesai + stek kolom, bata 2 lantai, jaring sisi saja · 2 cermin halaman (gerbang kiri)
   + jaring muka + inti lift menjulang · 3 cermin + bata 2 lantai berkusen + plester sebagian.
   Sudut kavling (|x|,|z| > 6,4) dibiarkan kosong: crane makeVisual (stage bangun) berdiri di salah satu sudut tapak (±fx·,46). */
CAT.proyek_gedung.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, m = s >= 2 ? -1 : 1;   // m: cermin tata halaman (gerbang/keet/material)
  const LW = fx + .8, LD = fz + .8, R0 = rangka(0, 0, 0, 0), cbd = zone === 'CBD';
  const bx = (sx, sy, sz, x, y, z, col, o) => taruh(R0, 'box', sx, sy, sz, x, y + sy / 2, z, col, Object.assign({ slot: 0 }, o));
  const BETON = '#A8A398', BETON2 = '#9E9A90', BATA = '#B5604A', TANAH = campur(PAL.tanah, '#A9A398', .45), BEKIS = '#8A5A3E', BAMBU = '#D9B26A';
  const SC = '#8A939A';   // pipa perancah
  // ---- alas tanah proyek + jalur ban berlumpur dari gerbang ----
  bx(fx * .96, .1, fz * .96, 0, 0, 0, TANAH, { noHull: true });
  const gx = m * 1.6, gW = 4.4;
  bx(3.2, .05, 4.6, gx, .07, LD / 2 - 2.6, '#8F7B5E', { noEdge: true, noHull: true });
  // ---- rangka beton ----
  const bw = 11.6, bd = 8.4, zf = 2.0, zb = zf - bd, zc = (zf + zb) / 2;
  const nS = (cbd ? 4 : 3) - (s === 1 ? 1 : 0), Y = [.25, LANTAI_USAHA]; for (let k = 2; k <= nS; k++) Y.push(LANTAI_USAHA + (k - 1) * LANTAI);
  const bekisting = s === 0 || s === 2, yTop = Y[nS];
  bx(bw + .8, .25, bd + .8, 0, 0, zc, BETON2);                                  // lantai kerja
  const cxs = [0, 1, 2, 3].map(k => -bw / 2 + .225 + (bw - .45) * k / 3), czs = [0, 1, 2].map(k => zf - .225 - (bd - .45) * k / 2);
  const hKol = bekisting ? yTop - .3 : yTop - .05;
  for (const x of cxs) for (const z of czs) bx(.45, hKol - .25, .45, x, .25, z, BETON);
  for (let k = 1; k <= nS; k++){ const y = Y[k], form = bekisting && k === nS;
    bx(bw + .3, .3, bd + .3, 0, y - .3, zc, form ? BEKIS : (k % 2 ? BETON : BETON2));                        // pelat (atau bekisting)
    if (!form) bx(bw - .1, .35, .3, 0, y - .62, zf - .2, BETON); }   // balok tepi muka
  if (bekisting){   // tiang perancah di bawah bekisting + anyaman besi di atasnya + tepi bekisting kayu
    const y0 = Y[nS - 1], hp = yTop - .3 - y0;
    for (const z of [zf - 1.4, zc, zb + 1.4]) _jeruji(rangka(0, y0, z, 0), 8.3, hp, 0, 0, 0, 4, SC, { batang: .07, rel: .06, lod: 1 });   // tiang perancah (4 per baris + palang)
    const J = jerujiGeo(34, .03 / (bw - .2), 0, false, false);
    taruh(R0, 'custom', bw - .2, bd - .2, 1, 0, yTop + .03, zc, '#5A4A40', { geo: J.geo, edges: null, noHull: true, noEdge: true, lod: 1, slot: 0, rx: -Math.PI / 2 });
    bx(bw + .3, .25, .05, 0, yTop - .02, zf + .16, '#C9A86A', { noEdge: true });
  } else {          // stek kolom + besi tunggu untuk lantai berikut
    for (const x of cxs) for (const z of czs){ if (z === czs[0] || (z === czs[2] && s === 1)) bx(.45, .9, .45, x, yTop, z, BETON2, z === czs[0] ? undefined : { lod: 1 }); if (z === czs[0]) bx(.22, .9, .22, x, yTop + .9, z, '#6B4A3A', { lod: 1, noEdge: true }); } }
  // inti tangga/lift (belakang kiri), seed 2 menjulang 1 lantai di atas pelat teratas
  const coreH = yTop + (s === 2 ? 3.2 : .9) - .25; bx(2.8, coreH, 2.6, -bw / 2 + 2.2, .25, zb + 1.9, BETON2);
  // ---- dinding bata ekspos di antara kolom (bukaan jendela; varian 3: kusen kayu + plester sebagian) ----
  const bay = (rot, cx, cz, w, y0, h, k, tone) => { const f = rangka(cx, y0, cz, rot), ow = Math.min(1.8, w - 1.2), sill = .95, oh = Math.min(1.6, h - 1.5), col = darken(BATA, tone);
    const pz = 0; taruh(f, 'box', w, h, .2, 0, h / 2, pz, col, { slot: 0 });
    taruh(f, 'box', ow, oh, .2, 0, sill + oh / 2, pz + .03, '#3A3430', { slot: 0, noHull: true });             // bukaan (gelap, ruang dalam)
    taruh(f, 'box', ow + .1, .15, .26, 0, sill + oh + .075, pz + .01, BETON, { slot: 0 });                         // latei beton
    if (s === 3 && k === 1) _bingkai(f, ow, oh, .08, 0, sill, pz + .1, .1, '#7A5A3A', true); };
  const nBata = s === 1 || s === 3 ? 2 : 1;
  for (let k = 1; k <= Math.min(nBata, nS - 1); k++){ const y0 = Y[k], h = Y[k + 1] - .62 - y0;
    for (let i = 0; i < 3; i++){ const xa = cxs[i] + .225, xb = cxs[i + 1] - .225; bay(0, (xa + xb) / 2, zf - .2, xb - xa, y0, h, k, i === 1 ? .94 : 1); }
    if (k === 1) for (const sx of [-1, 1]) for (let i = 0; i < 2; i++){ const za = czs[i] - .225, zb2 = czs[i + 1] + .225; bx(.2, h, za - zb2, sx * (bw / 2 - .2), y0, (za + zb2) / 2, darken(BATA, i ? .95 : 1)); } }   // sisi: bata penuh
  if (s === 3){ const xa = cxs[0] + .225, xb = cxs[1] - .225, w = xb - xa, h = Y[2] - .62 - Y[1], ow = Math.min(1.8, w - 1.2), oh = Math.min(1.6, h - 1.5), sill = .95;
    const xm = (xa + xb) / 2, yl = sill + oh + .15, ws = (w - ow - .1) / 2, PL = '#C9C1B2', zP = zf - .07, oP = { noEdge: true };   // plester sebagian: 4 potong mengelilingi bukaan + latei
    const u = v => v / w, yy = v => v / (h - .1) - .5;   // bidang satuan: lebar w, tinggi h - ,1 dari Y[1] + ,1; quad satu muka (8 segitiga)
    _proyek_gedung_bidang(rangka(xm, Y[1] + .1, zf - .08, 0), w, h - .1, [[-.5, .5, -.5, yy(sill - .1)], [-.5, .5, yy(yl - .1), yy(h - .3)],
      [-.5, u(ws) - .5, yy(sill - .1), yy(yl - .1)], [.5 - u(ws), .5, yy(sill - .1), yy(yl - .1)]], PL); void zP; void oP; }
  // dinding bata lantai dasar sisi (gudang sementara) + pintu
  bx(.2, 2.6, bd - 1.6, -m * (bw / 2 - .2), .25, zc - .4, darken(BATA, .92));
  // ---- perancah besi muka + papan pijak + bracing + jaring pengaman hijau ----
  const zS = zf + 1.15, xS0 = -bw / 2 - .4, xS1 = bw / 2 + .4, nSt = 7, topS = yTop + 1.1;
  _jeruji(rangka(0, 0, zS, 0), xS1 - xS0, topS, 0, 0, 0, nSt, SC, { batang: .07, rel: 0, lod: 0 });          // tiang luar (bidang jeruji 2 muka)
  _jeruji(rangka(0, 0, zf + .4, 0), xS1 - xS0, topS - 1, 0, 0, 0, nSt, SC, { batang: .06, rel: 0, lod: 1 });   // tiang dalam
  for (let k = 1; k <= nS; k++){ const y = Y[k];
    bx(xS1 - xS0 + .1, .05, .8, 0, y, zf + .75, '#8C6A48', { noEdge: true });                       // papan pijak
    bx(xS1 - xS0, .06, .06, 0, y + 1.0, zS, SC, { lod: 1 }); }
  { const fS = rangka(0, 0, zS + .05, 0), L = Math.hypot(xS1 - xS0, Y[1]), a = Math.atan2(Y[1], xS1 - xS0) * (m > 0 ? 1 : -1);
    taruh(fS, 'box', .06, .06, L - .2, 0, Y[1] / 2 + .05, 0, SC, { ry: Math.PI / 2, rx: a, slot: 0, lod: 1 }); }
  const netFront = s !== 1, netY0 = Y[Math.min(nBata + 1, nS)] - .2;
  if (netFront){ const nN = 7, wN = (xS1 - xS0) / nN;
    const hN = topS - netY0;
    for (const par of [0, 1]){ const R = []; for (let k = par; k < nN; k += 2){ if (s === 2 && k === 4) continue;   // satu lembar belum dipasang
        R.push([(k + .03) / nN - .5, (k + .97) / nN - .5, -.5, .5 - (k % 3 === 1 ? .35 / hN : 0)]); }
      _proyek_gedung_jaring(rangka(0, netY0, zS + .1 + par * .04, 0), xS1 - xS0, hN, R, par ? '#56805A' : '#4F7A55'); }
    for (let k = Math.min(nBata + 1, nS); k <= nS; k++) bx(xS1 - xS0, .08, .02, 0, Y[k] + .95, zS + .16, '#3F5E44', { lod: 1, noEdge: true }); }   // tali pengikat jaring di tiap tingkat
  // perancah + jaring sisi kanan (di luar sudut crane)
  { const sx = m, xN = sx * (bw / 2 + 1.0), z0 = zb + 1.2, z1 = zf + 1.1;
    _jeruji(rangka(xN, 0, (z0 + z1) / 2, Math.PI / 2), z1 - z0, topS, 0, 0, 0, 3, SC, { batang: .07, rel: 0, lod: 0 });
    for (let k = 1; k <= nS; k++) bx(.06, .06, z1 - z0, xN, Y[k] + 1.0, (z0 + z1) / 2, SC, { lod: 1 });
    const nN = 4, wN = (z1 - z0) / nN, y0 = s === 1 ? Y[1] : netY0;
    for (const par of [0, 1]){ const R = []; for (let k = par; k < nN; k += 2) R.push([(k + .03) / nN - .5, (k + .97) / nN - .5, -.5, .5]);
      _proyek_gedung_jaring(rangka(xN + sx * (.1 + par * .04), y0, (z0 + z1) / 2, Math.PI / 2), z1 - z0, topS - y0, R, par ? '#56805A' : '#4F7A55'); } }
  // ---- pagar seng 2,2 + pita cat aksen + tiang; gerbang geser terbuka ----
  const hP = 2.2, e = .1, zF = LD / 2 - e, xL = -LW / 2 + e, cP = c || PAL.negara;
  const g0 = gx - gW / 2, g1 = gx + gW / 2, SENGS = ['#8E979C', '#99A1A5', '#858E93'];
  const panelRun = (a, b) => { const n = Math.max(1, Math.round((b - a) / 1.8)); for (let k = 0; k < n; k++){ const x0 = a + (b - a) * k / n, x1 = a + (b - a) * (k + 1) / n;
      bx(x1 - x0, hP, .05, (x0 + x1) / 2, 0, zF, SENGS[(k + (a < 0 ? 0 : 1)) % 3]); } };
  panelRun(-LW / 2 + e, g0 - .12); panelRun(g1 + .12, LW / 2 - e);
  for (const [a, b] of [[-LW / 2 + e, g0 - .12], [g1 + .12, LW / 2 - e]]) bx(b - a, .32, .03, (a + b) / 2, hP - .45, zF + .045, cP, { slot: 1, noEdge: true });   // pita cat: belakangnya ,005 di depan muka seng (tak sebidang)
  for (const sx of [-1, 1]){ bx(.05, hP - .02, LD - 2 * e, sx * (LW / 2 - e), 0, 0, SENGS[sx > 0 ? 2 : 0]);
    _proyek_gedung_lapis(rangka(sx * (LW / 2 - e + .035), 0, 0, sx * Math.PI / 2), LD - 2 * e, hP - .02, 7, cP); }   // sambungan + lembar beda nada + noda (muka luar)
  bx(LW - 2 * e - .1, hP, .05, 0, 0, -LD / 2 + e, SENGS[1]);
  _proyek_gedung_lapis(rangka(0, 0, -LD / 2 + e - .035, Math.PI), LW - 2 * e - .1, hP, 7, cP);
  for (const x of [-6, -3, 3, 6]) if (x < g0 - .4 || x > g1 + .4) bx(.08, hP + .1, .08, x, 0, zF - .08, '#6F6A60', { lod: 1 });
  for (const x of [g0 - .12, g1 + .12]) bx(.2, hP + .4, .2, x, 0, zF - .05, '#5E666C');                  // tiang gerbang
  for (const k of [0, 1]){ const xg = (m > 0 ? g1 + .3 + 1.05 : g0 - .3 - 1.05) + (m > 0 ? 1 : -1) * k * .0; bx(2.1, hP - .1, .05, xg, .05, zF - .22 - k * .12, SENGS[k], { lod: 1 }); }   // daun gerbang geser (di balik pagar)
  // ---- papan proyek 3,0×1,6 di 2 tiang (di dalam pagar, tampak di atas pagar) ----
  { const px = gx - m * (gW / 2 + 2.1), pz = zF - .3, f = rangka(px, 2.35, pz, 0);
    for (const sx of [-1, 1]) bx(.12, 4.0, .12, px + sx * 1.35, 0, pz - .1, '#5E666C');
    taruh(f, 'box', 3.12, 1.72, .06, 0, .8, -.02, '#2B2F33', { slot: 0, lod: 1 });
    taruh(f, 'box', 3.0, 1.6, .06, 0, .8, .02, '#E6E2D8', { slot: 0, attach: 'z-' });
    taruh(f, 'box', 3.0, .42, .03, 0, 1.39, .065, cP, { slot: 1, noEdge: true });
    _teks(f, 'PROYEK NEGARA', 0, 1.25, .085, 2.7, .26, '#EDE8DC');
    for (let k = 0; k < 4; k++) taruh(f, 'box', 2.4 - k * .4, .07, .02, -.1 - k * .2, .95 - k * .2, .06, '#5E666C', { slot: 0, lod: 1, noEdge: true }); }
  // rambu K3 di pagar (muka luar) + lampu sorot
  { const kx = g1 + m * 0 + (m > 0 ? 1.5 : -gW - 1.5 - 0) ; const f = rangka(m > 0 ? g1 + 1.6 : g0 - 1.6, 1.1, zF + .03, 0);
    taruh(f, 'box', .9, .7, .03, 0, .35, 0, '#D9A441', { slot: 0, noEdge: true }); _teks(f, 'K3', 0, .2, .02, .6, .32, '#2B2F33'); void kx; }
  // ---- direksi keet (kantor proyek) + toren biru + lampu sorot ----
  { const kx = -m * 5.6, kz = 4.9, f = rangka(kx, 0, kz, m * Math.PI / 2);   // menghadap halaman (ke arah gerbang)
    taruh(f, 'box', 2.6, .3, 3.4, 0, .15, 0, '#6F6A60', { slot: 0 });
    taruh(f, 'box', 2.4, 2.3, 3.2, 0, .3 + 1.15, 0, '#D9D4C8', { slot: 0, wall: true });
    taruh(f, 'box', 2.9, .08, 3.7, 0, 2.75, 0, SENG, { slot: 0, rx: 0, ry: 0 });
    taruh(f, 'box', 1.0, 2.1, .06, .1, .3 + 1.05, 1.61, '#7A5A3A', { slot: 0 });                                   // pintu
    taruh(f, 'box', .9, .7, .06, -.85, 1.3 + .35, 1.61, '#EDE8DC', { slot: 0 }); _kaca(f, .74, .54, -.85, 1.38, 1.63, null, { lod: 1 });
    { const p = f.at(.85, 0, 1.6); spanduk(p[0], 1.85, p[2], { w: .6, h: .3, c: cP, rot: m * Math.PI / 2 }); }
    const tx = kx - m * .2, tz = kz - .5; bx(.8, .3, .8, tx, 2.79, tz, '#5E666C'); cylLo(.42, 1.0, tx, 3.09, tz, '#3E6FB0');
    bx(.08, 4.2, .08, -m * 4.4, 0, 6.75, '#5E666C'); { const f2 = rangka(-m * 4.4, 4.0, 6.75, Math.PI); taruh(f2, 'box', .45, .32, .22, 0, 0, .1, '#3A3D40', { slot: 0 }); _kaca(f2, .36, .22, 0, -.11, .22, LAMPU, { lod: 1 }); } }
  // ---- material di halaman ----
  { const X = v => m * v;
    cone(1.15, 1.05, X(5.6), .1, 4.4, '#D3C293'); cone(.75, .7, X(4.1), .1, 5.0, '#9BA0A6');                   // pasir & split
    for (const [x, z, hb] of [[6.7, 5.4, .8], [6.7, 4.2, .5]]){ bx(1.0, .12, .9, X(x), .1, z, '#8C6A48', { lod: 1 }); bx(.95, hb, .85, X(x), .22, z, BATA); }
    bx(1.2, .12, .8, X(4.3), .1, 3.7, '#8C6A48', { lod: 1 }); bx(1.1, .45, .72, X(4.3), .22, 3.7, '#D9D4C8'); bx(.75, .22, .5, X(4.2), .67, 3.72, '#CFC9BC', { lod: 1 });   // sak semen
    // molen (oranye) + 2 roda + rangka
    const fm = rangka(X(4.6), 0, 6.7, m * .5);
    taruh(fm, 'box', 1.4, .25, .7, 0, .55, 0, '#5E666C', { slot: 0 });
    taruh(fm, 'cylLo', .9, 1.0, .9, .1, 1.2, 0, '#D9762B', { rx: .9, ry: Math.PI / 2, slot: 0 });
    for (const sz of [-1, 1]) taruh(fm, 'box', .45, .45, .1, -.3, .25, sz * .4, '#1E1C1A', { slot: 0, lod: 1 });
    // besi beton di bantalan + kayu bekisting (halaman belakang, jauh dari sudut crane)
    for (const x of [-4, 0, 4]) bx(.2, .15, .8, x, .1, -7.25, '#7A5A3A', { lod: 1 });
    bx(9.4, .22, .5, 0, .25, -7.25, '#6B4A3A', { noEdge: true }); bx(9.0, .12, .4, .2, .47, -7.25, '#7A4E3C', { lod: 1, noEdge: true });
    bx(1.1, .5, 2.4, X(-7.0), .1, -2.6, '#C9A86A'); bx(1.0, .3, 2.2, X(-7.0), .6, -2.5, '#B89A5E', { lod: 1 });
    // gerobak sorong
    const fw = rangka(X(2.8), 0, 4.0, m * -.6); taruh(fw, 'box', .6, .28, .85, 0, .52, 0, '#4F555C', { slot: 0 });
    taruh(fw, 'cylLo', .36, .08, .36, 0, .18, .5, '#1E1C1A', { rx: Math.PI / 2, ry: Math.PI / 2, slot: 0, noEdge: true }); taruh(fw, 'box', .5, .05, .7, 0, .45, -.75, BESI, { slot: 0, lod: 1, noEdge: true }); }
  // ---- pekerja berhelm (skala manusia 1,7) di papan pijak & halaman ----
  const pekerja = (x, y, z, rot, helm) => { const f = rangka(x, y, z, rot);
    for (const sx of [-1, 1]) taruh(f, 'box', .16, .8, .2, sx * .1, .4, 0, '#3A4250', { slot: 0, lod: 1 });
    taruh(f, 'box', .42, .62, .24, 0, 1.11, 0, '#D9762B', { slot: 0, lod: 1 });
    for (const sx of [-1, 1]) taruh(f, 'box', .1, .56, .12, sx * .27, 1.1, .02, '#D9762B', { slot: 0, lod: 1, noEdge: true });   // lengan (rompi oranye)
    taruh(f, 'box', .23, .25, .23, 0, 1.55, 0, '#C08A62', { slot: 0, lod: 1, noEdge: true });
    taruh(f, 'sphLo', .32, .2, .34, 0, 1.7, 0, helm, { slot: 0, lod: 1, noEdge: true }); taruh(f, 'box', .36, .03, .4, 0, 1.66, .02, helm, { slot: 0, lod: 1, noEdge: true }); };
  pekerja(-2.2, Y[1] + .05, zf + .7, 0, '#E6E2D8'); if (s === 1) pekerja(m * 3.2, .1, 5.9, m * 2.4, '#D9B441');
};

/* jaring pengaman: persegi panjang satuan [x0,x1,y0,y1] di bidang z = 0 sebagai quad 2 muka + garis tepi (4 segitiga/lembar, bukan 12 kotak).
   f = rangka (alas di y f), w×h = ukuran bidang. */
const _proyek_gedung_GEO = new Map();
function _proyek_gedung_jaring(f, w, h, R, col){
  const key = R.map(r => r.map(v => v.toFixed(3)).join(',')).join('|'); let G0 = _proyek_gedung_GEO.get(key);
  if (!G0){ const t = [], e = [];
    for (const [x0, x1, y0, y1] of R){ t.push(x0, y0, 0, x1, y0, 0, x1, y1, 0, x0, y0, 0, x1, y1, 0, x0, y1, 0,  x0, y0, 0, x1, y1, 0, x1, y0, 0, x0, y0, 0, x0, y1, 0, x1, y1, 0);
      e.push(x0, y0, 0, x1, y0, 0,  x1, y0, 0, x1, y1, 0,  x1, y1, 0, x0, y1, 0,  x0, y1, 0, x0, y0, 0); }
    G0 = _geoFrom(t, e); _proyek_gedung_GEO.set(key, G0); }
  return taruh(f, 'custom', w, h, 1, 0, h / 2, 0, col, { geo: G0.geo, edges: G0.edges, noHull: true, slot: 0 }); }
/* lapisan muka luar pagar seng (tanpa kotak baru): n sambungan lembar gelap, 2 lembar beda nada, pita cat aksen ,22 & noda tanah ,35 di kaki.
   f = rangka ,01 di depan muka seng (+z lokal = keluar). Segitiga: 2n + 4·4. */
function _proyek_gedung_lapis(f, w, h, n, cP){
  const q = (g, ww, hh, dx, yb, dz, c, sl) => taruh(f, 'custom', ww, hh, 1, dx, yb + hh / 2, dz, c, { geo: g.geo, edges: null, noHull: true, noEdge: true, slot: sl || 0, lod: 1 });
  const D = jerujiGeo(2, .5, 0, false, true), u = w / (n - 1);
  q(jerujiGeo(n, .05 / w, 0, false, true), w, h, 0, 0, 0, '#6F777C');
  for (const k of [1, n - 3]) q(D, u - .06, h - .02, -w / 2 + u * (k + .5), .01, .01, '#A3AAAE');   // lembar lebih terang
  q(D, w, .22, 0, h - .45, .02, cP, 1); q(D, w, .35, 0, 0, .02, '#8F7B5E'); }
/* bidang satu muka (+z lokal) dari persegi panjang satuan [x0,x1,y0,y1], tanpa garis: 2 segitiga/potong. f = rangka (alas di y f). */
function _proyek_gedung_bidang(f, w, h, R, col){
  const key = 'b|' + R.map(r => r.map(v => v.toFixed(3)).join(',')).join('|'); let G0 = _proyek_gedung_GEO.get(key);
  if (!G0){ const t = []; for (const [x0, x1, y0, y1] of R) t.push(x0, y0, 0, x1, y0, 0, x1, y1, 0, x0, y0, 0, x1, y1, 0, x0, y1, 0);
    G0 = _geoFrom(t, null); _proyek_gedung_GEO.set(key, G0); }
  return taruh(f, 'custom', w, h, 1, 0, h / 2, 0, col, { geo: G0.geo, edges: null, noHull: true, noEdge: true, slot: 0 }); }
