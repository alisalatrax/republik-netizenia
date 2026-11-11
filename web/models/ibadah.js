/* ibadah (2×1) — spek-gaya §6 no. 17. Tempat ibadah warga, tiga wujud menurut seed:
   seed 0/1 MASJID khas Nusantara: ruang utama dinding #E3DED2 + plint hijau + pita kaligrafi, serambi depan 4 pilar bulat beratap seng hijau,
     atap tumpang (0: 3 tingkat hijau · 1: 2 tingkat biru-hijau + cermin denah) dengan drum & mustaka, menara (kaki, badan, balkon azan,
     kepala berpengeras suara, kubah kecil), jendela lengkung, pintu dobel, bedug di serambi, tempat wudhu beratap seng dengan kran,
     pagar tembok + gerbang + papan nama, 2 palem.
   seed 2 GEREJA: badan pelana curam 50° menghadap jalan (gevel + roset + salib), pintu dobel lengkung, jendela lancet, menara lonceng 9 m
     beratap limas + salib, pagar besi, pohon.
   seed 3 PURA: tembok penyengker bata + candi bentar (gerbang terbelah bertingkat), meru beratap ijuk 3 tingkat di atas bebaturan,
     bale beratap ijuk 4 tiang, bale kulkul, penjor bambu melengkung, palem.
   Denah menyesuaikan arah: kavling lebar (16×8, muka 2 petak) atau sempit-dalam (8×16, NZ_FACING 1/3). Semua bagian di dalam kavling. */
const ibadah_box = (...a) => { box(...a); return P[P.length - 1]; };
// setengah cakram (ruang satuan: alas y −,5, jari-jari x ,5, tinggi 1) — lengkung jendela/pintu; muka depan saja, sisi = busur (garis tinta)
function ibadah_busurGeo(n){ n = n || 6; const key = 'ibBusur|' + n; let G0 = _GEO.get(key); if (G0) return G0; const t = [], e = [];
  for (let k = 0; k < n; k++){ const a0 = Math.PI * k / n, a1 = Math.PI * (k + 1) / n, p0 = [.5 * Math.cos(a0), -.5 + Math.sin(a0), 0], p1 = [.5 * Math.cos(a1), -.5 + Math.sin(a1), 0];
    t.push(0, -.5, 0, ...p0, ...p1); e.push(...p0, ...p1); }
  G0 = _geoFrom(t, e); _GEO.set(key, G0); return G0; }
// jendela lengkung: reveal + kaca + busur reveal di atas reveal + busur kaca (nyala) + ambang. (x,y,z) = tengah-bawah kaca di bidang dinding
function ibadah_jendelaLengkung(x, y, z, rot, w, h, wl, o){ o = o || {}; const f = rangka(x, y, z, rot), rv = darken(wl, .62), B = ibadah_busurGeo(6), rw = w + .22;
  taruh(f, 'box', rw, h + .11, .07, 0, (h + .11) / 2 - .05, 0, rv, { attach: 'z+', ao: .8, slot: 0 });
  _kaca(f, w, h, 0, 0, .02);
  taruh(f, 'custom', rw, rw / 2, 1, 0, h + .06 + rw / 4, .035, rv, { geo: B.geo, edges: B.edges, noHull: true, slot: 0 });
  taruh(f, 'custom', w - .04, (w - .04) / 2, 1, 0, h + .1 + (w - .04) / 4, .055, KACA[1], { geo: B.geo, edges: null, noHull: true, noEdge: true, glow: true });
  if (o.ambang !== false) taruh(f, 'box', w + .34, .1, .18, 0, -.1, .06, darken(wl, .8), { attach: 'z+', slot: 0, lod: 1 });
  if (o.palang) taruh(f, 'box', .05, h, .05, 0, h / 2, .07, KUSEN, { slot: 0 }); }
// palem: batang + 6 pelepah miring + buah (detail dekat)
function ibadah_palem(x, z, s, lw2, ld2){ const h = 4.2 * s, r = .9 * s;
  x = clamp(x, -lw2 + r + .05, lw2 - r - .05); z = clamp(z, -ld2 + r + .05, ld2 - r - .05);
  cylLo(.13 * s, h, x, 0, z, '#8C7A5E');
  for (let k = 0; k < 6; k++){ const a = k * Math.PI / 3 + .3; taruh(rangka(x, h, z, a), 'box', .34 * s, .05, r, 0, -.18 * s, r / 2 - .05, k % 2 ? '#5C7D3E' : '#6E9245', { rx: .42, slot: 0, noEdge: true }); }
  taruh(rangka(x, h - .3, z, 0), 'box', .34, .3, .34, 0, 0, 0, '#7A6A3A', { slot: 0, lod: 1, noEdge: true }); }
CAT.ibadah.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, LW = fx + .8, LD = fz + .8, hx = LW / 2, hz = LD / 2, lebar = LW >= LD;
  const sx = s === 1 ? -1 : 1, zP = hz - .2;
  if (s === 3) return ibadah_pura(LW, LD, lebar, wl, gt, c);
  if (s === 2) return ibadah_gereja(LW, LD, lebar, wl, gt, c);
  // ================= MASJID =================
  const cW = s ? '#DDE3D6' : '#E3DED2', cPl = '#5F7F6C', cAtap = s ? '#3F6B62' : '#4F6D5A', H = 4.0;
  const hw = lebar ? 7 : 6.2, hd = lebar ? 4.6 : 6.0, hcx = lebar ? -sx * 1.9 : 0, zb = lebar ? -hz + .75 : -hz + .85, zf = zb + hd, sd = 1.65, zs = zf + sd;
  dinding(hw, H, hd, hcx, 0, (zb + zf) / 2, cW, { plinth: .7, cPlinth: cPl, lis: [H - .45], cLis: cPl, slot: 0 });
  taruh(rangka(hcx, 3.33, zf, 0), 'box', hw - .6, .16, .05, 0, .08, -.005, '#C2913A', { attach: 'z+', slot: 0, lod: 1, noEdge: true });   // pita kaligrafi emas
  // ---- serambi: lantai keramik + 2 anak tangga + 4 pilar bulat + atap seng hijau miring + lisplang ----
  teras(hw, sd, hcx, zf, { tinggi: .35, tangga: 2, tanggaW: 2.0, c: '#D6D0C4' });
  for (const kx of [-hw / 2 + .3, -1.0, 1.0, hw / 2 - .3]){ cylLo(.17, 3.3, hcx + kx, .35, zs - .25, '#EDE8DC'); }
  emperan(hcx, zf, { w: hw + .1, d: sd + .05, y: 3.95, miring: 13, c: cAtap, kolom: 0, lantai: false, talang: false });
  const yDep = 3.95 - (sd + .05) * Math.tan(13 * D2R);
  taruh(rangka(hcx, yDep - .3, zs - .25, 0), 'box', hw + .1, .3, .3, 0, .15, 0, '#EDE8DC', { slot: 0 });   // balok depan serambi
  // ---- muka utama: pintu dobel + 2 jendela lengkung; samping (ke halaman terbuka): 3 jendela lengkung ----
  pintu(hcx, zf, { y: .35, w: 1.6, h: 2.4, daun: 2, c: '#5A4636', wall: cW, kusen: KUSEN, boven: false });
  { const B = ibadah_busurGeo(6); taruh(rangka(hcx, .35 + 2.48, zf, 0), 'custom', 1.9, .95, 1, 0, .475, .035, darken(cW, .62), { geo: B.geo, edges: B.edges, noHull: true, slot: 0 }); }
  for (const k of [-1, 1]) ibadah_jendelaLengkung(hcx + k * (hw / 2 - 1.15), 1.05, zf, 0, .9, 1.55, cW, { palang: true });
  const xS = hcx + (lebar ? sx : sx) * hw / 2, rS = sx * Math.PI / 2;
  for (const z of lebar ? [zb + 1.0, zb + 2.3, zb + 3.6] : [zb + 1.2, zb + 3.0, zb + 4.8]) ibadah_jendelaLengkung(xS, 1.05, z, rS, .9, 1.55, cW, { ambang: false });
  ac(hcx - sx * hw / 2, 2.4, zb + 1.2, { rot: -rS, lod: 1 });
  talang(hcx - sx * (hw / 2 - .15), 0, H - .1, { z: zf });
  // ---- atap tumpang ----
  atapTumpang(hw, hd, hcx, H, (zb + zf) / 2, { tingkat: s ? 2 : 3, sudut: s ? [28, 42] : [25, 35, 50], overhang: .5, c: cAtap, cDrum: cW, jarak: .8 });
  // ---- menara: kaki + badan + balkon azan + kepala + pengeras suara + kubah kecil ----
  const mx = lebar ? sx * (hx - 1.6) : sx * (hx - 1.1), mz = lebar ? zb + .7 : zs + 1.4;
  box(1.6, 1.0, 1.6, mx, 0, mz, cPl);
  cylLo(.6, 8.3, mx, 1.0, mz, cW);
  for (const yy of [3.5, 6.0]) taruh(rangka(mx, yy, mz, 0), 'box', .2, .8, .1, 0, .4, .58, '#4E4740', { slot: 0, lod: 1, noEdge: true });
  cylLo(.95, .2, mx, 9.3, mz, '#D6D0C4');
  cylLo(.88, .55, mx, 9.5, mz, cAtap);
  cylLo(.55, 1.4, mx, 10.05, mz, cW);
  for (const a of [0, 2.1]) taruh(rangka(mx, 10.6, mz, a + .4), 'box', .22, .26, .3, 0, 0, .66, '#9C9A92', { slot: 0, lod: 1 });   // toa
  sphLo(.72, mx, 11.45, mz, cAtap, .62);
  taruh(rangka(mx, 12.05, mz, 0), 'cone', .12, .55, .12, 0, .27, 0, '#C2913A', { slot: 0 });
  // ---- tempat wudhu: dinding keramik + bak + kran + atap seng di 2 tiang ----
  { const wx = lebar ? sx * (hx - 2.6) : -sx * (hx - 1.3), wz = lebar ? zf - .1 : zs + 2.3, rot = lebar ? 0 : -sx * Math.PI / 2, f = rangka(wx, 0, wz, rot), ww = 2.4;
    taruh(f, 'box', ww, 1.6, .2, 0, .8, -.45, '#BFC7CC', { slot: 0, wall: true });
    taruh(f, 'box', ww, .55, .4, 0, .275, -.15, '#9FB3B8', { slot: 0 });
    for (let k = 0; k < 4; k++) taruh(f, 'box', .06, .06, .2, -ww / 2 + .35 + k * .57, 1.0, -.27, '#9C9A92', { slot: 0 });
    for (const sd2 of [-1, 1]) taruh(f, 'box', .1, 2.3, .1, sd2 * (ww / 2 - .05), 1.15, .45, '#6F6A60', { slot: 0 });
    taruh(f, 'box', ww + .3, .07, 1.25, 0, 2.38, 0, SENG, { rx: 8 * D2R, slot: 0 }); }
  // ---- bedug di ujung serambi ----
  { const bx = hcx - sx * (hw / 2 - .65), f = rangka(bx, .35, zf + .8, 0);
    taruh(f, 'box', .9, .55, .5, 0, .275, 0, '#7A5A3A', { slot: 0 });
    taruh(f, 'cylLo', .85, .9, .85, 0, 1.0, 0, '#9C6A3E', { rx: Math.PI / 2, ry: Math.PI / 2, slot: 0 }); }
  // ---- pagar tembok + gerbang + papan nama di pagar + lampu ----
  const gx = hcx, gW = 2.0;
  pagarHalaman(LW - .1, zP, { x0: 0, gaya: 'tembok', h: .95, gx, gW, c: '#E3DED2', cPilar: '#D6D0C4', cGerbang: '#3F6B62' });
  const px = lebar ? hcx + sx * 2.7 : hcx - sx * 2.1, pw = lebar ? 2.6 : 1.9;
  papanNama(px, .18, zP + .09, { w: pw, h: .62, c: '#3F6B62', teks: 'MASJID', cTeks: '#EDE8DC', bingkai: '#C2913A' });
  for (const sd2 of [-1, 1]){ const lx = gx + sd2 * (gW / 2 + .15); taruh(rangka(lx, 1.4, zP, 0), 'sphLo', .18, .18, .18, 0, .18, 0, LAMPU, { glow: true, lod: 1 }); }
  // ---- palem ----
  if (lebar){ ibadah_palem(-sx * (hx - .95), hz - 1.2, 1, hx, hz); ibadah_palem(sx * 3.4, hz - 1.15, .9, hx, hz); }
  else { ibadah_palem(-sx * (hx - .95), hz - 1.0, 1, hx, hz); ibadah_palem(sx * (hx - 1.0), hz - 1.0, .9, hx, hz); }
  pot(hcx + 1.6, zs + .3, .8, {}); pot(hcx - 1.6, zs + .3, .8, { bunga: '#C9503C' });
};
// ================= GEREJA (seed 2) =================
function ibadah_gereja(LW, LD, lebar, wl, gt, c){ const hx = LW / 2, hz = LD / 2, zP = hz - .2, cW = '#E6E2D8', cPl = '#8E8A84', H = 4.2;
  const nw = lebar ? 6.0 : 5.6, nd = lebar ? 5.4 : 7.6, ncx = lebar ? -1.4 : 0, zb = -hz + .7, zf = zb + nd, ncz = (zb + zf) / 2;
  dinding(nw, H, nd, ncx, 0, ncz, cW, { plinth: .6, cPlinth: cPl, lis: [H - .4], slot: 0 });
  const r = atapPelana(nw, nd, ncx, H, ncz, { arah: 'z', gaya: 'dinding', sudut: 50, overhang: .45, ovL: .3, ovR: .45, c: '#8E3E34', cWall: cW, lisplang: 'semua', roster: false });
  // gevel: roset bundar + salib di puncak
  taruh(rangka(ncx, H + 1.3, zf, 0), 'cylLo', 1.1, .08, 1.1, 0, .55, .0, KACA[1], { rx: Math.PI / 2, slot: 0, noEdge: true });
  taruh(rangka(ncx, H + 1.3, zf, 0), 'cylLo', 1.35, .06, 1.35, 0, .55, -.01, darken(cW, .62), { rx: Math.PI / 2, slot: 0 });
  box(.14, 1.2, .14, ncx, r.yPuncak - .05, zf + .1, '#C2913A'); box(.7, .14, .14, ncx, r.yPuncak + .6, zf + .1, '#C2913A');
  // muka: pintu dobel lengkung + 2 jendela lancet + tangga; samping: 3 lancet
  teras(3.0, .9, ncx, zf, { tinggi: .3, tangga: 2, tanggaW: 2.2, c: '#D6D0C4' });
  pintu(ncx, zf, { y: .3, w: 1.6, h: 2.5, daun: 2, c: '#6B3E2E', wall: cW, kusen: KUSEN });
  { const B = ibadah_busurGeo(6); taruh(rangka(ncx, .3 + 2.58, zf, 0), 'custom', 1.9, .95, 1, 0, .475, .035, darken(cW, .62), { geo: B.geo, edges: B.edges, noHull: true, slot: 0 }); }
  for (const k of [-1, 1]) ibadah_jendelaLengkung(ncx + k * (nw / 2 - 1.05), 1.1, zf, 0, .6, 1.9, cW, {});
  for (const z of lebar ? [zb + 1.1, zb + 2.7, zb + 4.3] : [zb + 1.3, zb + 3.8, zb + 6.3]) ibadah_jendelaLengkung(ncx + nw / 2, 1.1, z, Math.PI / 2, .6, 1.9, cW, { ambang: false });
  talang(ncx - nw / 2 + .15, 0, H - .5, { z: zf });
  // menara lonceng: badan bujur sangkar + lubang lonceng + atap limas runcing + salib
  const tw = 1.9, tx = lebar ? ncx + nw / 2 + 1.8 : hx - 1.2, tz = lebar ? zf - 1.4 : zf + 2.2, th = 7.0;
  dinding(tw, th, tw, tx, 0, tz, '#DDD9CE', { plinth: .6, cPlinth: cPl, lis: [3.0, 5.0], slot: 0 });
  for (const [rot, dx, dz] of [[0, 0, tw / 2], [-Math.PI / 2, -tw / 2, 0], [Math.PI / 2, tw / 2, 0]]){
    const f = rangka(tx + dx, 5.35, tz + dz, rot); taruh(f, 'box', .7, 1.2, .06, 0, .6, .0, '#3A3430', { attach: 'z+', slot: 0 });
    const B = ibadah_busurGeo(5); taruh(f, 'custom', .7, .35, 1, 0, 1.2 + .175, .03, '#3A3430', { geo: B.geo, edges: B.edges, noHull: true, slot: 0, lod: 1 }); }
  jendelaKecil(tx, 1.4, tz + tw / 2, { w: .5, h: .9, wall: '#DDD9CE' });
  const hp = 2.2; taruh(rangka(tx, th, tz, 0), 'custom', tw + .5, hp, tw + .5, 0, hp / 2, 0, '#5E6670', { geo: hipGeo(tw + .5, tw + .5, hp).geo, edges: hipGeo(tw + .5, tw + .5, hp).edges, slot: 0 });
  box(.12, 1.1, .12, tx, th + hp - .05, tz, '#C2913A'); box(.6, .12, .12, tx, th + hp + .55, tz, '#C2913A');
  // halaman: pagar besi + gerbang, papan nama, pohon, lampu taman, pot
  pagarHalaman(LW - .1, zP, { x0: 0, gaya: 'besi', h: 1.0, gx: ncx, gW: 2.2, jarakBesi: .3, c: '#D6D0C4' });
  const px = lebar ? ncx - 2.4 : -hx + 1.4;
  papanNama(px, .5, zP + .1, { w: lebar ? 1.9 : 1.6, h: .5, c: '#4C6A96', teks: 'GEREJA', bingkai: '#E6E2D8' });
  if (lebar){ pohonKecil(-hx + 1.0, zf - 1.6, .95, { jenis: 'bulat' }); pohonKecil(hx - 1.0, hz - 1.1, .75, { jenis: 'bulat' }); }
  else pohonKecil(-hx + 1.0, hz - 1.5, .9, { jenis: 'bulat' });
  for (const k of [-1, 1]) pot(ncx + k * 1.9, zf + .55, .85, { bunga: k > 0 ? '#C9503C' : null });
  lampuDinding(ncx + 1.35, 2.6, zf, {});
}
// ================= PURA (seed 3) =================
function ibadah_pura(LW, LD, lebar, wl, gt, c){ const hx = LW / 2, hz = LD / 2, zP = hz - .3, zC = hz - .75, BATA = '#A8553B', PARAS = '#A9A28E', IJUK = '#3A3430';
  // tembok penyengker depan (bata + topi paras) di kedua sisi candi bentar
  const gW = 1.5, cbW = 1.7, xg0 = gW / 2 + cbW;
  for (const sd of [-1, 1]){ const x0 = sd * xg0, x1 = sd * (hx - .05), w = Math.abs(x1 - x0), cx = (x0 + x1) / 2;
    const q = ibadah_box(w, 1.5, .4, cx, 0, zP, BATA); q.wall = true; box(w + .04, .18, .5, cx, 1.5, zP, PARAS);
    const np = Math.max(1, Math.round(w / 2.2)); for (let k = 0; k <= np; k++){ const x = clamp(x0 + (x1 - x0) * k / np, -hx + .3, hx - .3); box(.5, 2.0, .55, x, 0, zP, BATA); box(.6, .25, .62, x, 2.0, zP, PARAS); } }
  // tembok samping (rendah)
  for (const sd of [-1, 1]) { const q = ibadah_box(.3, 1.3, LD - .9, sd * (hx - .15), 0, -.3, BATA); q.wall = true; }
  // candi bentar: 2 pilar bertingkat mengecil ke atas (bata + pita paras), muka dalam rata (terbelah)
  for (const sd of [-1, 1]){ const xi = sd * gW / 2; let y = 0;
    for (const [w, h, cc] of [[cbW, .5, PARAS], [cbW - .1, 1.6, BATA], [cbW + .05, .22, PARAS], [cbW - .3, 1.3, BATA], [cbW - .2, .2, PARAS], [cbW - .6, 1.1, BATA], [cbW - .5, .18, PARAS], [cbW - .9, .7, BATA], [.5, .5, PARAS]]){
      box(w, h, Math.min(1.3, w * .8), xi + sd * w / 2, y, zC, cc); y += h; }
    for (const yy of [1.0, 2.9]) taruh(rangka(xi + sd * (cbW - .1) / 2, yy, zC + Math.min(1.3, (cbW - .1) * .8) / 2, 0), 'box', .7, .5, .05, 0, .25, .0, PARAS, { attach: 'z+', slot: 0, lod: 1 }); }   // relief
  box(gW, .12, 1.0, 0, 0, zC, PARAS);   // undakan gerbang
  // penjor (bambu melengkung) di samping gerbang
  { const pxj = -(xg0 + .6), pz = zP - .65; let x = pxj, y = 0;
    const segs = [[2.2, 0], [2.0, .12], [1.6, .4], [1.2, .85], [.9, 1.3]];
    for (const [L, a] of segs){ const dx = Math.sin(a) * L, dy = Math.cos(a) * L;
      taruh(rangka(x + dx / 2, y + dy / 2, pz, Math.PI / 2), 'box', .09, L, .09, 0, 0, 0, '#C9A86A', { rx: a, slot: 0 }); x += dx; y += dy; }
    taruh(rangka(x, y - .5, pz, 0), 'box', .25, .6, .08, 0, 0, 0, '#D9C27A', { slot: 0, lod: 1, noEdge: true }); }
  // meru: bebaturan paras + badan bata + pintu kecil + atap ijuk 3 tingkat
  const mx = lebar ? -3.6 : 0, mz = lebar ? -.9 : -hz + 3.0, bs = lebar ? 3.4 : 3.6;
  box(bs, .9, bs, mx, 0, mz, PARAS); box(bs - .5, .25, bs - .5, mx, .9, mz, darken(PARAS, .9));
  dinding(2.0, 2.0, 2.0, mx, 1.15, mz, BATA, { plinth: 0, slot: 0 });
  pintu(mx, mz + 1.0, { y: 1.15, w: .7, h: 1.4, c: '#B8922E', wall: BATA, kusen: '#C2913A', panel: false });
  box(1.0, .2, .6, mx, .9, mz + bs / 2 - .3, PARAS);
  atapTumpang(2.0, 2.0, mx, 3.15, mz, { tingkat: 3, sudut: [32, 40, 48], overhang: .55, c: IJUK, cDrum: BATA, jarak: .45, mustaka: true });
  // bale (paviliun) 4 tiang di atas lantai paras, atap ijuk limasan
  const bw = lebar ? 3.6 : 3.4, bd = lebar ? 2.8 : 3.0, bx = lebar ? 3.4 : 0, bz = lebar ? -1.0 : 1.6;
  box(bw + .4, .6, bd + .4, bx, 0, bz, PARAS);
  for (const a of [-1, 1]) for (const b of [-1, 1]) box(.2, 2.3, .2, bx + a * (bw / 2 - .15), .6, bz + b * (bd / 2 - .15), '#7A5A3A');
  atapLimasan(bw, bd, bx, 2.9, bz, { sudut: 34, overhang: .45, c: IJUK, cWall: '#7A5A3A' });
  box(bw - .4, .12, bd - .6, bx, 1.1, bz, '#8C6A48');   // balai-balai
  // bale kulkul (menara kentongan) di pojok depan
  const kx = lebar ? hx - 1.3 : hx - 1.2, kz = lebar ? zP - 1.3 : zP - 2.0;
  box(1.5, 2.6, 1.5, kx, 0, kz, BATA); box(1.7, .2, 1.7, kx, 2.6, kz, PARAS);
  for (const a of [-1, 1]) for (const b of [-1, 1]) box(.14, 1.4, .14, kx + a * .6, 2.8, kz + b * .6, '#7A5A3A');
  taruh(rangka(kx, 3.3, kz, 0), 'cylLo', .25, 1.0, .25, 0, .5, 0, '#8C6A48', { slot: 0, lod: 1 });
  atapLimasan(1.4, 1.4, kx, 4.2, kz, { sudut: 40, overhang: .3, c: IJUK, cWall: '#7A5A3A', pita: false });
  taruh(rangka(kx, 1.0, kz + .75, 0), 'box', .7, .6, .05, 0, .3, .0, PARAS, { attach: 'z+', slot: 0, lod: 1 });
  // papan nama, palem, payung/umbul kain (aksen), pot
  papanNama(-(xg0 + (hx - xg0) / 2), .3, zP + .2, { w: Math.min(1.6, hx - xg0 - .6), h: .5, c: '#3A3430', teks: 'PURA', cTeks: '#D9C27A', bingkai: '#C2913A' });
  ibadah_palem(lebar ? -hx + 1.0 : -hx + 1.0, lebar ? -hz + 1.0 : 2.8, .95, hx, hz);
  for (const sd of [-1, 1]){ const ux = sd * (gW / 2 + .15), uz = zP - 1.0; cylLo(.04, 2.2, ux, 0, uz, '#8C6A48');
    taruh(rangka(ux, 2.2, uz, 0), 'cone', .9, .35, .9, 0, .17, 0, sd > 0 ? '#E6E2D8' : '#C2913A', { slot: 0 }); }
  pot(lebar ? 1.4 : -1.6, zP - 1.6, .8, { bunga: '#D9A441' });
  // nyala malam (tahap 7+9): pura tanpa jendela → 2 lampu bulat di puncak pilar tembok pengapit candi bentar, lampion di bale, 2 pelita di undakan meru
  for (const sd of [-1, 1]) taruh(rangka(sd * xg0, 2.25, zP, 0), 'sphLo', .36, .36, .36, 0, .18, 0, LAMPU, { glow: true, lod: 1 });
  taruh(rangka(bx, 2.35, bz, 0), 'box', .32, .4, .32, 0, 0, 0, LAMPU, { glow: true, noEdge: true });
  for (const k of [-1, 1]) taruh(rangka(mx + k * .35, 1.1, mz + bs / 2 - .3, 0), 'sphLo', .16, .16, .16, 0, .08, 0, LAMPU, { glow: true, lod: 1 });
}
