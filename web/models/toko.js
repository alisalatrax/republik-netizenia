/* toko (2×1) — spek-gaya §6 no. 6. Ruko deret 3 unit muka (± 5 m), 1–4 lantai sesuai 'floors' (lantai dasar LANTAI_USAHA 4,2 + 3,2/lantai).
   Tiap unit beda warna dinding, tinggi parapet, kedalaman muka (±,15) dan jenis usaha:
     A = toko kelontong terbuka (rolling door tergulung, rak barang, renceng sachet, meja kaca + toples) + kanopi seng berkolom + kardus
     B = etalase kaca + pintu kaca + tenda kain bergaris + pot
     C = rolling door tertutup + pintu samping + kanopi seng + motor parkir
   Papan nama per unit (teks piksel: TOKO, SEMBAKO, APOTEK, FOTOKOPI, BENGKEL, …), lis lantai, lantai atas 2 jendela + AC per unit
   (seed 1/3: satu unit berbalkon), atap datar beton + parapet + lis topi, toren air, jemuran/antena di atap.
   Semua tonjolan (kanopi, tenda, emperan) berhenti di batas kavling depan (z ≤ LD/2); sisi deret (adj) rapat ke batas tanpa tonjolan. */
CAT.toko.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => {
  ctx = ctx || {}; const s = (ctx.seed || 0) & 3, A = ctx.adj || {}, aL = !!A.l, aR = !!A.r;
  const LW = fx + .8, LD = fz + .8, n = clamp(floors || 1, 1, 4), H = LANTAI_USAHA + (n - 1) * LANTAI;
  // jumlah unit muka mengikuti lebar muka (2×1 normal: 3 unit ≈ 5 m; muka sempit, mis. uji NZ_FACING=1 tanpa tukar w/h: 1–2 unit)
  const nu = LW >= 14 ? 3 : LW >= 10 ? 2 : 1, X0 = aL ? -LW / 2 : -fx / 2, X1 = aR ? LW / 2 : fx / 2, uw = (X1 - X0) / nu;
  const zb = -LD / 2 + .5, zf0 = LD / 2 - 1.45;   // dinding belakang; muka toko (emperan 1,35–1,5 di depannya, di dalam kavling)
  const iw = Math.max(0, WALLS.indexOf(wl)), ia = Math.max(0, AKSEN.indexOf(c));
  const cols = [WALLS[(iw + 3 + s % 2) % 10], wl, WALLS[(iw + 6 + (s >> 1)) % 10]];
  const jenis = [['A', 'B', 'C'], ['B', 'A', 'C'], ['C', 'A', 'B'], ['A', 'C', 'B']][s];
  const KATA = { A: ['TOKO', 'SEMBAKO', 'KELONTONG', 'GROSIR'], B: ['APOTEK', 'FOTOKOPI', 'PULSA', 'ROTI'], C: ['BENGKEL', 'LAUNDRY', 'MEBEL', 'JAHIT'] };
  const ySign = 3.25, yAtapEmp = 3.05, zfs = [...Array(nu)].map((_, k) => zf0 - ((s + k) % 3 === 1 && nu > 1 ? .15 : 0));   // kedalaman muka beda per unit
  for (let k = 0; k < nu; k++){
    const ux0 = X0 + uw * k, ucx = ux0 + uw / 2, col = cols[k], J = jenis[k];
    const zf = zfs[k], dep = zf - zb, zc = (zb + zf) / 2;
    const uA = { l: k === 0 ? aL : 1, r: k === nu - 1 ? aR : 1 };   // sisi antar-unit = rapat (tanpa tonjolan lis/plint)
    const lis = []; for (let f = 1; f < n; f++) lis.push(LANTAI_USAHA + (f - 1) * LANTAI - .06);
    dinding(uw, H, dep, ucx, 0, zc, col, { plinth: .35, cPlinth: '#8E8A84', lis, adj: uA, slot: k === 1 ? 2 : 0 });
    const ca = k === 1 ? c : AKSEN[(ia + 3 + k * 2) % 10], ow = uw - 1.3, d = LD / 2 - .05 - zf;   // lebar bukaan, dalam emperan
    // emperan seng: lebar unit (sisi bebas mundur ,1); kolom di kedua tepi kecuali tepi kiri yang sudah dipikul kolom unit kiri
    const ew = uw - (k === 0 && !aL ? .1 : 0) - (k === nu - 1 && !aR ? .1 : 0), ex = ucx + ((k === 0 && !aL ? .05 : 0) - (k === nu - 1 && !aR ? .05 : 0));
    const kolX = (k > 0 && jenis[k - 1] !== 'B') ? [ew / 2 - .12] : [-ew / 2 + .12, ew / 2 - .12];
    // ---- lantai dasar ----
    if (J === 'A'){
      rollingDoor(ucx, zf, { w: ow, h: 2.9, buka: .78, wall: col, isi: true, meja: true, seedIsi: s + k });
      emperan(ex, zf, { w: ew, d, y: yAtapEmp, miring: 9, c: '#8E979C', kolomX: kolX, cKolom: '#D9D4C8', cLantai: '#BFB6A8' });
      kardus(ucx - ow / 2 + .1, .15, zf + .45, { n: 3 });
      lampuDinding(ucx + ow / 2 + .3, 2.75, zf, {});
    } else if (J === 'B'){
      // bukaan: reveal etalase + celah ,1 + reveal pintu (reveal tidak boleh bertumpuk: dua muka sebidang)
      const we = ow - 1.7; etalase(ucx - ow / 2 + (we + .3) / 2, zf, { w: we, h: 2.4, y: .5, wall: col, ambang: '#7E8790', teks: s % 2 ? 'BUKA' : null });
      pintu(ucx + ow / 2 - .65, zf, { w: 1.0, h: 2.4, c: '#3A3F44', kaca: true, kusen: BINGKAI, wall: col, y: .15 });
      emperan(ex, zf, { w: ew, d, atap: false, cLantai: '#C9BFA6' });   // lantai keramik saja; tenda kain sebagai peneduh
      tenda(ucx, yAtapEmp, zf, { w: uw - .3, dalam: Math.min(1.25, d - .05), miring: 20, c: ca, c2: '#E6E2D8', strip: 6, slot: k === 1 ? 1 : 0 });
      pot(ucx - ow / 2 - .05, zf + .35, .85, { kotak: true, y: .15, bunga: '#C9708A' });
    } else {
      const wr = ow - 1.55; rollingDoor(ucx - ow / 2 + (wr + .3) / 2, zf, { w: wr, h: 2.9, buka: 0, wall: col, c: '#8E979C', jarakGaris: .5 });
      pintu(ucx + ow / 2 - .575, zf, { w: .85, h: 2.2, c: '#6B5546', kusen: KUSEN, wall: col, y: .15, panel: true });
      emperan(ex, zf, { w: ew, d, y: yAtapEmp, miring: 9, c: '#7E8A93', kolomX: kolX, cKolom: '#D9D4C8', cLantai: '#B6AFA2' });
      motor(ucx - .3, zf + d * .55, { rot: Math.PI / 2 + .25 * (k - 1), c: ['#B4443A', '#3E5A82', '#2E3A40'][(s + k) % 3] });
    }
    papanNama(ucx, ySign, zf, { w: uw - .5, h: .72, c: ca, slot: k === 1 ? 1 : 0, teks: KATA[J][(s + k) % 4], cTeks: '#EDE8DC' });
    // ---- lantai atas: 2 jendela + AC per unit; seed 1/3 → unit tengah lantai 2 berbalkon dengan pintu kaca ----
    for (let f = 1; f < n; f++){ const yf = LANTAI_USAHA + (f - 1) * LANTAI;
      if (f === 1 && s % 2 === 1 && k === 1){ balkon(ucx, yf + .02, zf, { w: uw - 1.4, jorok: .75, gaya: 'tembok', cTembok: darken(col, .95), konsol: false });
        pintu(ucx - .6, zf, { y: yf + .17, w: .9, h: 2.2, c: '#3A3F44', kaca: true, kusen: KUSEN, wall: col }); jendelaKecil(ucx + .8, yf + 1.0, zf, { w: 1.0, h: 1.4, wall: col });
        ac(ucx + 1.9, yf + 2.25, zf, {}); continue; }
      for (const sx of [-1, 1]) jendelaKecil(ucx + sx * uw * .22, yf + .9, zf, { w: 1.1, h: 1.5, wall: col, kusen: (s + k) % 2 ? KUSEN : '#7A5A3A', nako: (k + f) % 3 === 2 });
      ac(ucx + ((k + f) % 2 ? 1 : -1) * uw * .22 + .05, yf + .12, zf, {});
    }
    // ---- atap datar per unit (parapet beda tinggi), sisi antar-unit tanpa parapet ----
    atapDatar(uw, dep, ucx, H, zc, { parapet: .55 + ((s + k * 2) % 3) * .35, cParapet: col, slotParapet: k === 1 ? 2 : 0, c: '#B8B2A6', adj: uA });
    if (k === s % nu) tandon(ucx + uw * .22, H + .12, zb + 1.1, { c: (s + k) % 2 ? 'biru' : '#D9762B', kaki: n > 1 ? .7 : .4 });
    // isi atap: kompresor AC (semua) + kotak tangga beratap dak dengan pintu (≥ 2 lantai) di unit lain
    if (k === (s + 2) % nu){ ac(ucx + uw * (s % 2 ? .25 : -.25), H + .12, zb + .55, { rot: 0 });
      if (n > 1){ const kt = rangka(ucx - uw * .18, H + .12, zb + 1.3, 0); taruh(kt, 'box', 1.8, 2.3, 2.0, 0, 1.15, 0, darken(col, .92), { wall: true, slot: 0 });
        taruh(kt, 'box', .85, 1.9, .06, .2, .95, 1.01, '#5A5048', { attach: 'z+', slot: 0 }); } }
    if (k === (s + 1) % nu){ if (s % 2) jemuran(ucx - uw * .1, zb + 1.6, { y: H + .12, w: 2.2, h: 1.5, n: 3, warna: k, rot: .1 }); else antena(ucx - uw * .25, H + .12, zb + 1.4, { h: 2.6 }); }
  }
  // iklan cat tembok di dinding samping kiri yang bebas (khas ruko Indonesia): bidang warna + teks piksel
  if (!aL){ const g = rangka(X0, 0, (zb + zfs[0]) / 2 + .3, -Math.PI / 2), dw = Math.min(3.2, zfs[0] - zb - 1.4), cI = ['#C2913A', '#3F7D92', '#9C4935', '#4F7A55'][s];
    taruh(g, 'box', dw, 1.3, .04, 0, 2.15, .0, cI, { attach: 'z+', slot: 0, noHull: true });
    teks(['PULSA', 'SEMEN', 'CAT', 'OLI'][s], X0, 1.85, (zb + zfs[0]) / 2 + .3, { rot: -Math.PI / 2, tinggi: .7, lebarMaks: dw - .4, c: '#EDE8DC', dz: .035 }); }
  // talang paralon di dinding samping yang bebas (bukan sisi deret), dekat sudut depan
  if (!aL) talang(X0, 0, H - .1, { z: zfs[0] - .35, rot: -Math.PI / 2 }); if (!aR) talang(X1, 0, H - .1, { z: zfs[nu - 1] - .35, rot: Math.PI / 2 });
};
