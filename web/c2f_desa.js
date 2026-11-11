/* =====================================================================
   DESA & DISTRIK TERTUTUP (tahap 7+9, kelompok "desa"): pematang sawah + setapak tanah, saung bambu, orang-orangan sawah,
   kerbau, bebek angon, rumpun bambu & pohon pisang di bahu gang tanah; distrik terbuka ring 2: rumpun bambu / pisang / bebek
   di DALAM kavling kosong zona DESA/KAMPUNG (hilang saat kavling terisi).
   Data blok sawah dibaca dari chunkOf/DIST_RECT (c2b, baca saja); tidak mengubah file lain.

   Anggaran (2 draw call, +2 di pass bayangan desktop; 0 program shader baru — hanya VMAT_I / DEPTH_NOINK_I yang sudah dipakai pohon/lampu):
     dsA  InstancedMesh SATU segitiga (1 segitiga/instans, tanpa kulit). Matriks instans = [normal | B−A | C−A | A] → segitiga sembarang
          dengan normal & arah putar benar (kolom 0 = normal satuan → normal VMAT_I tepat). Semua bagian tanpa kulit: pematang, setapak,
          bebek, tiang & lantai saung, orang-orangan, kaki/tanduk/ekor kerbau, batang & tajuk bambu, batang & daun pisang.
     dsB  InstancedMesh SATU kotak berkulit tinta (24 segitiga/instans, pola kvBox c2f_kavling): badan & kepala kerbau, dua bilah atap pelana saung.
          Sumbu terpanjang tiap kotak di x lokal (tebal tinta VMAT_I mengikuti skala-x instans).
   (Versi pertama: dua kit berbitmask + materi 'ink+lantai+desa'/'depth-desa' → 2 program shader dikompilasi saat props desa pertama
   tampil → layar beku ±2 dtk sekali di HP. Diganti pola ini: tanpa program baru.)
   Setiap benda ditaruh utuh atau tidak sama sekali (terdekat dulu, dibatasi cap segitiga & kotak).
   Diisi ulang hanya lewat PROP_HOOKS (titik tatap pindah sel 48 u) + saat okupansi/pratinjau berubah (paintLots/setPlaceAnchor/cancelPlace
   dibungkus, kunci kotor → tanpa kerja bila tak ada yang berubah). Tanpa kerja per frame.
   Radius (frustumCulled=false): pematang/bebek desktop 360 u / HP 260 u, benda 260 / 170 u.
   Cap terburuk: desktop (12.000 + 300 × 24) × 2 (bayangan) = 38,4 rb segitiga; HP (tanpa bayangan) 8.500 + 160 × 24 = 12,3 rb.
   ===================================================================== */
const DS_RA = MOBILE ? 260 : 360, DS_RB = MOBILE ? 170 : 260;
const DS_TRI_CAP = MOBILE ? (LOW ? 5000 : 8500) : LOW ? 7000 : 12000, DS_BOX_CAP = MOBILE ? (LOW ? 90 : 160) : LOW ? 160 : 300;

/* ---------- primitif (non-indexed, normal per muka) untuk menyusun kit lewat merge(..., { ink: 0 }) ---------- */
const DS_PRIM = (() => {
  const geo = pos => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g; };
  const fan = n => { const t = []; for (let k = 0; k < n; k++){ const a0 = k / n * Math.PI * 2, a1 = (k + 1) / n * Math.PI * 2; t.push(Math.sin(a0) * .5, -.5, Math.cos(a0) * .5, Math.sin(a1) * .5, -.5, Math.cos(a1) * .5, 0, .5, 0); } return geo(t); };   // limas/kerucut tanpa alas
  // kerucut ganda (tajuk bambu): kerucut atas 6 sisi (puncak y = ,5, sabuk y = −,1) + kerucut bawah pendek (dasar y = −,5) → tertutup, 12 segitiga
  const bicone = (() => { const t = [], yb = -.1; for (let k = 0; k < 6; k++){ const a0 = k / 6 * Math.PI * 2, a1 = (k + 1) / 6 * Math.PI * 2, p0 = [Math.sin(a0) * .5, yb, Math.cos(a0) * .5], p1 = [Math.sin(a1) * .5, yb, Math.cos(a1) * .5];
    t.push(...p0, ...p1, 0, .5, 0, ...p1, ...p0, 0, -.5, 0); } return geo(t); })();
  const prism3 = (() => { const t = []; for (let k = 0; k < 3; k++){ const a0 = k / 3 * Math.PI * 2, a1 = (k + 1) / 3 * Math.PI * 2, b0 = [Math.sin(a0) * .5, Math.cos(a0) * .5], b1 = [Math.sin(a1) * .5, Math.cos(a1) * .5];
    t.push(b0[0], -.5, b0[1], b1[0], -.5, b1[1], b1[0], .5, b1[1], b0[0], -.5, b0[1], b1[0], .5, b1[1], b0[0], .5, b0[1]); } return geo(t); })();   // tiang 3 sisi tanpa tutup (6 segitiga)
  const pyrSq = (() => { const c = [[-.5, .5], [.5, .5], [.5, -.5], [-.5, -.5]], t = []; for (let k = 0; k < 4; k++){ const a = c[k], b = c[(k + 1) % 4]; t.push(a[0], -.5, a[1], b[0], -.5, b[1], 0, .5, 0); } return geo(t); })();   // limas alas persegi
  const boxF = faces => { const b = new THREE.BoxGeometry(1, 1, 1).toNonIndexed(), p = b.attributes.position.array, out = [];   // muka terpilih (+x −x +y −y +z −z)
    for (const f of faces) for (let k = f * 6; k < f * 6 + 6; k++) out.push(p[k*3], p[k*3+1], p[k*3+2]); return geo(out); };
  return { spike3: fan(3), cone6: fan(6), bicone, prism3, pyrSq, boxNB: boxF([0, 1, 2, 4, 5]), bund: boxF([2, 4, 5]), top: boxF([2]) };
})();
const dsP = (geo, s, p, c, o) => Object.assign({ g: 'custom', geo: DS_PRIM[geo], s, p, c, noHull: true, noEdge: true }, o || {});
// bagian berarah: sumbu +y primitif diarahkan ke d (satuan) dari titik a sepanjang len (Euler 'YXZ': ry = atan2(dx, dz), rx = acos(dy))
const dsDir = (geo, a, d, len, w, c) => { const l = Math.hypot(d[0], d[1], d[2]), x = d[0] / l, y = d[1] / l, z = d[2] / l;
  return dsP(geo, [w, len, w], [a[0] + x * len / 2, a[1] + y * len / 2, a[2] + z * len / 2], c, { rx: Math.acos(clamp(y, -1, 1)), ry: Math.atan2(x, z) }); };

/* ---------- kit benda → larik datar ----------
   spec: { parts: [dsP …] (merge tanpa kulit, AO merge), raw: [[A, B, C, hex] …] (segitiga langsung), boxes: [[x, y, z, rx, ry, rz, sx, sy, sz, hex] …] }
   fit: { rx, rz } (batas |x| / |z| lokal) atau { r } (batas jari-jari mendatar, benda yang diputar bebas di kavling) → x,z diskalakan agar muat.
   t: per segitiga 15 angka [A(3) e1=B−A(3) e2=C−A(3) n(3) warna linear(3)]; b: per kotak 15 angka [kolom 0..3 (12, lokal) warna(3)] */
function dsKit(spec, fit){
  const T3 = [];   // [ax, ay, az, bx, by, bz, cx, cy, cz, r, g, b]
  if (spec.parts && spec.parts.length){ const g = merge(spec.parts, true, { ink: 0 }), P = g.attributes.position.array, C = g.attributes.color.array;
    for (let v = 0; v < g.attributes.position.count; v += 3){ const q = []; for (let k = 0; k < 9; k++) q.push(P[v * 3 + k]);
      for (let a = 0; a < 3; a++) q.push((C[v * 3 + a] + C[v * 3 + 3 + a] + C[v * 3 + 6 + a]) / 3); T3.push(q); } }
  for (const [A, B, Cc, hex] of spec.raw || []){ const c = lin(hex), cy = (A[1] + B[1] + Cc[1]) / 3, f = .6 + .4 * clamp(cy / 1.8, 0, 1);
    T3.push([...A, ...B, ...Cc, c.r * f, c.g * f, c.b * f]); }
  const BX = (spec.boxes || []).map(b => b.slice());
  let sx = 1, sz = 1;
  if (fit){ let mx = 0, mz = 0, mr = 0; const see = (x, z) => { mx = Math.max(mx, Math.abs(x)); mz = Math.max(mz, Math.abs(z)); mr = Math.max(mr, Math.hypot(x, z)); };
    for (const q of T3) for (let k = 0; k < 9; k += 3) see(q[k], q[k + 2]);
    for (const b of BX){ _e.set(b[3], b[4], b[5], 'YXZ'); _q.setFromEuler(_e); _m4.compose(_v3.set(b[0], b[1], b[2]), _q, _s3.set(b[6], b[7], b[8]));
      for (const cx of [-.5, .5]) for (const cy of [-.5, .5]) for (const cz of [-.5, .5]){ _t.set(cx, cy, cz).applyMatrix4(_m4); see(_t.x, _t.z); } }
    if (fit.r){ sx = sz = Math.min(1, fit.r / Math.max(mr, 1e-6)); } else { sx = Math.min(1, fit.rx / Math.max(mx, 1e-6)); sz = Math.min(1, fit.rz / Math.max(mz, 1e-6)); } }
  const t = [];
  for (const q of T3){ const A = [q[0] * sx, q[1], q[2] * sz], B = [q[3] * sx, q[4], q[5] * sz], Cc = [q[6] * sx, q[7], q[8] * sz];
    const e1 = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], e2 = [Cc[0] - A[0], Cc[1] - A[1], Cc[2] - A[2]];
    const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]], l = Math.hypot(n[0], n[1], n[2]); if (l < 1e-7) continue;
    t.push(...A, ...e1, ...e2, n[0] / l, n[1] / l, n[2] / l, q[9], q[10], q[11]); }
  const b = [];
  for (const q of BX){ _e.set(q[3], q[4], q[5], 'YXZ'); _q.setFromEuler(_e); _m4.compose(_v3.set(q[0] * sx, q[1], q[2] * sz), _q, _s3.set(q[6], q[7], q[8]));
    const E = _m4.elements, c = lin(q[9]); b.push(E[0], E[1], E[2], E[4], E[5], E[6], E[8], E[9], E[10], E[12], E[13], E[14], c.r, c.g, c.b); }
  return { t: new Float32Array(t), b: new Float32Array(b), nt: t.length / 15, nb: b.length / 15 };
}
// segitiga/quad dua muka (daun): muka belakang sedikit lebih pucat
const dsTri2 = (L, A, B, C, hex, back) => { L.push([A, B, C, hex], [A, C, B, back || hex]); };
const dsQuad2 = (L, A, B, C, D, hex, back) => { dsTri2(L, A, B, C, hex, back); dsTri2(L, A, C, D, hex, back); };

const DS_HALF_X = 3 * T - .35, DS_HALF_Z = T - .35;      // tepi luar pematang (bidang sawah c2b: 6T − ,6 × 2T − ,6)
const DS_CROSS = [-11.5, 12];                            // pematang melintang (+ setapak di x = ,5) → 4 × 2 petak ±12 × 7,5 m
const DS_PATH_X = .5, DS_VERGE_Z = T + 1.35;              // setapak tanah melintang; bahu gang: tepi blok 8,0 … aspal/tanah gang 10,7
// posisi lokal benda di blok (pusat blok, +z = sisi bahu) [x, z, putaran tambahan]
const DS_POS = { bebek: [-6, 3.6, 0], saung: [3.2, -3.7, 0], orang: [-16.5, 3.8, .4], kerbau: [17, 3.4, .25], bambu: [-7.5, DS_VERGE_Z, 0], pisang: [-19.0, DS_VERGE_Z, 0] };

const DS_SPEC = (() => {
  const S = {}, K = PAL.kayu, BAMBU = '#C2A266';
  { const PM = PAL.pematang, BH = .15, BW = .45;   // pematang: bilah tanah ,45 × ,15 (muka atas + dua sisi panjang); setapak ,9 warna jalan tanah, ,03 lebih tinggi
    S.pem = { parts: [dsP('bund', [2 * DS_HALF_X + BW, BH, BW], [0, BH / 2, -DS_HALF_Z], PM), dsP('bund', [2 * DS_HALF_X + BW, BH, BW], [0, BH / 2, DS_HALF_Z], PM),
      dsP('bund', [2 * DS_HALF_Z, BH, BW], [-DS_HALF_X, BH / 2, 0], PM, { ry: Math.PI / 2 }), dsP('bund', [2 * DS_HALF_Z, BH, BW], [DS_HALF_X, BH / 2, 0], PM, { ry: Math.PI / 2 }),
      dsP('bund', [2 * DS_HALF_X, BH - .02, .38], [0, (BH - .02) / 2, 0], PM),
      ...DS_CROSS.map(x => dsP('bund', [2 * DS_HALF_Z, BH - .01, BW], [x, (BH - .01) / 2, 0], PM, { ry: Math.PI / 2 })),
      dsP('bund', [2 * DS_HALF_Z + BW, BH + .03, .9], [DS_PATH_X, (BH + .03) / 2, 0], PAL.tanah, { ry: Math.PI / 2 })] }; }
  // bebek angon: 4 ekor (badan limas + kepala), dua putih dua cokelat
  S.bebek = { parts: [] };
  [[0, 0, '#EDE8DC', .3], [.65, .35, '#8C6A48', -.4], [-.45, .55, '#EDE8DC', .9], [.3, -.5, '#7A5A3A', .2]].forEach(([x, z, c, a]) => {
    S.bebek.parts.push(dsP('pyrSq', [.42, .24, .24], [x, .12, z], c, { ry: a }), dsP('spike3', [.12, .2, .12], [x + Math.cos(a) * .16, .25, z - Math.sin(a) * .16], c)); });
  // saung: 4 tiang bambu, lantai pelupuh, atap pelana ijuk = dua bilah kotak berkulit tinta (bubungan sejajar x) + segitiga tebeng di kedua ujung
  { const P = [], R = [], th = .55, w = 1.75, ry = 2.75;
    for (const a of [-.95, .95]) for (const b of [-.85, .85]) P.push(dsP('prism3', [.13, 2.2, .13], [a, 1.1, b], BAMBU));   // puncak tiang = bidang atap di z ±,85
    P.push(dsP('boxNB', [2.2, .1, 2.0], [0, .55, 0], '#C9A86A'), dsP('prism3', [.1, 2.0, .1], [-.95, .62, 0], BAMBU, { rx: Math.PI / 2 }), dsP('prism3', [.1, 2.0, .1], [.95, .62, 0], BAMBU, { rx: Math.PI / 2 }));
    const gz = Math.cos(th) * w * .8, gy = ry - Math.sin(th) * w * .8;
    for (const s of [-1, 1]){ const x = s * 1.25; dsTri2(R, [x, gy, -gz], [x, gy, gz], [x, ry - .05, 0], '#9A8556', '#7A6A44'); }
    S.saung = { parts: P, raw: R, boxes: [[0, ry - Math.sin(th) * w / 2, Math.cos(th) * w / 2, th, 0, 0, 3.0, .09, w, '#8A7448'], [0, ry - Math.sin(th) * w / 2, -Math.cos(th) * w / 2, -th, 0, 0, 3.0, .09, w, '#806B42']] }; }
  // orang-orangan sawah: tiang, lengan, baju merah, kepala karung, caping
  S.orang = { parts: [dsP('prism3', [.09, 1.75, .09], [0, .875, 0], K[0]), dsP('prism3', [.07, 1.3, .07], [0, 1.38, 0], K[0], { rx: Math.PI / 2, ry: Math.PI / 2 }),
    dsP('boxNB', [.5, .55, .2], [0, 1.25, 0], AKSEN[0]), dsP('pyrSq', [.22, .26, .22], [0, 1.66, 0], '#D9C9A0'), dsP('cone6', [.66, .26, .66], [0, 1.86, 0], '#D8C48A')] };
  // kerbau: badan & kepala kotak berkulit tinta (menghadap +x), 4 kaki, tanduk melengkung ke belakang-atas (2 limas per sisi), ekor
  { const C = '#55504B', D = '#47423E', H = '#CFC6B0', P = [];
    for (const x of [-.62, .62]) for (const z of [-.3, .3]) P.push(dsP('prism3', [.22, .66, .22], [x, .33, z], D));
    for (const s of [-1, 1]){ const a = [1.12, 1.2, s * .16], d1 = [-.25, .3, s], l1 = .34, n1 = Math.hypot(...d1), b = [a[0] + d1[0] / n1 * l1, a[1] + d1[1] / n1 * l1, a[2] + d1[2] / n1 * l1];
      P.push(dsDir('spike3', a, d1, l1 + .04, .13, H), dsDir('spike3', b, [-.55, .8, s * .25], .3, .09, H)); }
    P.push(dsDir('prism3', [-.95, 1.25, 0], [-.35, -1, 0], .62, .06, D), dsP('pyrSq', [.1, .14, .1], [-1.17, .66, 0], '#2E2B28'));
    S.kerbau = { parts: P, boxes: [[0, 1.0, 0, 0, 0, 0, 1.9, .8, .95, C], [1.17, .98, 0, 0, 0, -.38, .56, .42, .4, '#4A4541']] }; }
  // rumpun bambu: 5 batang 2 ruas melengkung keluar (sepanjang ±x), tajuk = kerucut ganda kecil di ruas atas → siluet "air mancur" bergerombol (bukan kerucut cemara)
  const bambu = (spread, seed) => { const r = rng(hashStr('bambu' + seed)), P = [];
    const CUL = [[Math.PI / 2 + .2, .16, 6.0], [-Math.PI / 2 - .25, .18, 5.6], [Math.PI / 2 - .4, .06, 6.6], [-Math.PI / 2 + .35, .08, 6.3]];
    CUL.forEach(([az, lean, h], k) => { const l1 = lean * spread, l2 = (lean + .42) * spread + .06, b = [Math.sin(az) * .3, -.05, Math.cos(az) * .3];
      const d1 = [Math.sin(az) * Math.sin(l1), Math.cos(l1), Math.cos(az) * Math.sin(l1)], L1 = h * .58, m = [b[0] + d1[0] * L1, b[1] + d1[1] * L1, b[2] + d1[2] * L1];
      const d2 = [Math.sin(az) * Math.sin(l2), Math.cos(l2), Math.cos(az) * Math.sin(l2)], L2 = h * .45;
      const cc = ['#A3A24E', '#94A04A', '#B3A85A'][k % 3];
      P.push(dsDir('prism3', b, d1, L1, .16, cc), dsDir('spike3', m, d2, L2 + .1, .13, cc));
      const tw = (1.25 + .85 * spread) * (.85 + r() * .3), G = ['#6F8F3C', '#7E9E44', '#5E7F34', '#8AA84A'];
      const at = (f, sc, hh) => { const p = [m[0] + d2[0] * L2 * f, m[1] + d2[1] * L2 * f - hh * .3, m[2] + d2[2] * L2 * f];
        P.push(dsP('bicone', [tw * sc, hh, tw * sc * .85], p, G[(k + Math.round(f * 3)) % 4], { rx: l2 * .5, ry: az })); };
      at(.92, 1, 2.1); at(.3, .85, 1.7); });
    P.push(dsP('bicone', [1.7 * (.6 + .4 * spread), 2.0, 1.5 * (.6 + .4 * spread)], [0, 6.4, 0], '#6A8A3A'));   // pucuk tengah rumpun
    return { parts: P }; };
  S.bambu = bambu(1, 'v'); S.bambuL = bambu(.35, 'l');
  // pisang: batang semu + 6 daun lebar (≥ ,5 m, panjang 1,8: ruas naik ,9 + ruas terkulai ,9, lipatan V di tulang daun, dua muka) + 1 daun kering + anak pisang
  const pisang = (az0) => { const P = [dsP('prism3', [.32, 2.5, .32], [0, 1.2, 0], '#8A9A55'), dsP('prism3', [.16, 1.1, .16], [.62, .5, -.35], '#8FA05A')], R = [];
    const leaf = (o, az, up, dn, L1, L2, W, hex, back) => { const h = [Math.sin(az), 0, Math.cos(az)], s = [Math.cos(az), 0, -Math.sin(az)];
      const p0 = [o[0] + h[0] * .06, o[1], o[2] + h[2] * .06], p1 = [p0[0] + h[0] * Math.sin(up) * L1, p0[1] + Math.cos(up) * L1, p0[2] + h[2] * Math.sin(up) * L1];
      const p2 = [p1[0] + h[0] * Math.cos(dn) * L2, p1[1] - Math.sin(dn) * L2, p1[2] + h[2] * Math.cos(dn) * L2], fold = W * .18;
      for (const sg of [-1, 1]){ const q0 = [p0[0] + s[0] * sg * .06, p0[1] - .02, p0[2] + s[2] * sg * .06], q1 = [p1[0] + s[0] * sg * W / 2, p1[1] - fold, p1[2] + s[2] * sg * W / 2];
        const qm = [p1[0] + h[0] * Math.cos(dn) * L2 * .5 + s[0] * sg * W * .42, p1[1] - Math.sin(dn) * L2 * .5 - fold, p1[2] + h[2] * Math.cos(dn) * L2 * .5 + s[2] * sg * W * .42];
        if (sg > 0) dsTri2(R, q0, q1, p1, hex, back); else dsTri2(R, q0, p1, q1, hex, back);   // ruas naik: pangkal sempit → lebar penuh
        if (sg > 0) dsTri2(R, q1, qm, p2, hex, back); else dsTri2(R, q1, p2, qm, hex, back);   // ruas terkulai: tepi daun q1 → qm → ujung (tulang daun p1–p2 dipakai bersama sisi lain)
        if (sg > 0) dsTri2(R, p1, q1, p2, hex, back); else dsTri2(R, p1, p2, q1, hex, back); } };
    const top = [0, 2.42, 0];
    [[az0 + Math.PI / 2 + .45, .62, .45, '#6E9A40'], [az0 + Math.PI / 2 - .7, .85, .7, '#86B24C'], [az0 - Math.PI / 2 + .3, .7, .55, '#5F8C38'],
     [az0 - Math.PI / 2 - .55, .9, .8, '#6E9A40'], [az0 + Math.PI + .2, .5, .35, '#7AA646'], [az0 + .9, .35, .25, '#86B24C']].forEach(([a, up, dn, c], k) =>
      leaf(top, a, up, dn, .9, .9, .56 - (k > 4 ? .04 : 0), c, '#9DBB66'));
    leaf([0, 2.3, 0], az0 + Math.PI - .6, 2.75, 1.2, .55, .6, .4, '#A8935A', '#B8A46A');   // daun kering menggantung
    for (const a of [az0 + Math.PI / 2, az0 + Math.PI + .5]) leaf([.62, 1.02, -.35], a, .55, .4, .4, .4, .28, '#86B24C', '#9DBB66');
    return { parts: P, raw: R }; };
  S.pisang = pisang(0); S.pisangL = pisang(.8);
  return S;
})();
// bahu gang: |z| ≤ 1,2 (bahu 8,0 … 10,7 dari pusat blok, titik 9,35); kavling ring 2: jari-jari mendatar dari titik ≤ 1,25 / 1,6 (bidang kavling ±3,85)
const DS_KIT = { pem: dsKit(DS_SPEC.pem), bebek: dsKit(DS_SPEC.bebek), saung: dsKit(DS_SPEC.saung), orang: dsKit(DS_SPEC.orang), kerbau: dsKit(DS_SPEC.kerbau),
  bambu: dsKit(DS_SPEC.bambu, { rx: 3.2, rz: 1.2 }), pisang: dsKit(DS_SPEC.pisang, { rx: 2.6, rz: 1.2 }),
  bambuL: dsKit(DS_SPEC.bambuL, { r: 1.25 }), pisangL: dsKit(DS_SPEC.pisangL, { r: 1.6 }), bebekL: dsKit(DS_SPEC.bebek, { r: .95 }) };
const DS_LOT_AT = { bambuL: [2.5, -2.55], pisangL: [2.2, -2.2], bebekL: [-.4, .9] };   // titik lokal kavling (+z = sisi jalan), bebas dari kit c2f_kavling

/* ---------- mesh: satu segitiga satuan (bidang yz, normal +x) & satu kotak satuan berkulit ---------- */
const DS_TRI_GEO = (() => { const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 1, 0, 0, 0, 1], 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute([1, 0, 0, 1, 0, 0, 1, 0, 0], 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute([1, 1, 1, 1, 1, 1, 1, 1, 1], 3)); g.setAttribute('flag', new THREE.BufferAttribute(new Float32Array(3), 1));
  g.setAttribute('onormal', new THREE.BufferAttribute(new Int8Array(9), 3, true)); g.computeBoundingSphere(); return g; })();
const DS_BOX_GEO = merge([{ g: 'box', s: [1, 1, 1], p: [0, 0, 0], c: '#FFFFFF' }], false, { hullAll: true });
const dsA = new THREE.InstancedMesh(DS_TRI_GEO, VMAT_I, DS_TRI_CAP), dsB = new THREE.InstancedMesh(DS_BOX_GEO, VMAT_I, DS_BOX_CAP);
for (const m of [dsA, dsB]){ m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(m.instanceMatrix.count * 3).fill(1), 3); m.count = 0; m.visible = false;
  m.frustumCulled = false; m.receiveShadow = true; m.castShadow = !LOW && !MOBILE; inkInstanced(m); scene.add(m); }

/* ---------- isi per blok distrik tertutup (deterministik; cache per blok) ---------- */
const DS_BLOCK = new Map();
function dsBlock(k, cx, cz, isField, trees){
  const key = k + ':' + cx + ',' + cz + (isField ? 'f' : 'k'); let L = DS_BLOCK.get(key); if (L) return L;
  const r = rng(hashStr('desa' + key)), ja = Math.round((cz - T / 2) / T + HALF);
  const rot = r() < .5 ? 0 : Math.PI, sgn = rot ? -1 : 1, vergeOK = roadJ(rot ? ja - 1 : ja + 2) === 1;   // bahu hanya di sisi gang tanah (bukan arteri)
  const fa = [], fb = [];
  if (isField){ fa.push('pem'); if (r() < .18) fa.push('bebek'); if (r() < .38) fb.push('saung'); if (r() < .4) fb.push('orang'); if (r() < .16) fb.push('kerbau'); }
  if (vergeOK){ const want = []; if (r() < .32) want.push('bambu'); if (r() < .36) want.push('pisang');
    // bahu: jangan bertumpuk dengan pohon tepi blok c2b (pohon liar ±(T + 1,6))
    for (const n of want){ const px = cx + sgn * DS_POS[n][0], pz = cz + sgn * DS_POS[n][1]; if (!trees.some(t => (t[0] - px) ** 2 + (t[1] - pz) ** 2 < 9)) fb.push(n); } }
  L = { rot, fa, fb, tint: .9 + r() * .14 }; DS_BLOCK.set(key, L); return L;
}
/* ---------- kavling kosong distrik terbuka ring 2 (zona DESA/KAMPUNG): satu benda per kavling, di sudut belakang-kanan (bebas dari kit kavling) ---------- */
const DS_LOT = new Map();
/* Integrasi tahap 7+9: satu pemilik per kavling. dsLotKind = pilihan desa (deterministik, murah) — dibaca juga oleh kvLot (c2f_kavling) agar
   tumpukan bahan kavling tidak dipasang di kavling yang sudah memuat bambu/pisang desa. Arah kavling: ikut kvLot (sisi jalan yang sama). */
function dsLotKind(i, j){
  const z = zoneOfLot(i, j, 1, 1); if (z !== 'DESA' && z !== 'KAMPUNG') return null;
  const r = rng(hashStr('desaLot' + i + ',' + j)), u = r(), duck = r() < (z === 'DESA' ? .05 : .02);
  const kind = u < (z === 'DESA' ? .08 : .04) ? 'bambuL' : u < (z === 'DESA' ? .17 : .08) ? 'pisangL' : null;
  return kind || duck ? { r, kind, duck } : null;
}
function dsLot(i, j){
  const key = j * N + i; let L = DS_LOT.get(key); if (L !== undefined) return L;
  L = null; const K = dsLotKind(i, j);
  if (K){ const { r, kind, duck } = K; let rot = null; try { const kv = kvLot(i, j); if (kv.rot !== undefined) rot = kv.rot; } catch (_) {}
    { const f = fronts(i, j, 1, 1), sides = [[f.S, 0], [f.E, Math.PI / 2], [f.N, Math.PI], [f.W, -Math.PI / 2]].filter(s => s[0] > 0).sort((p, q) => q[0] - p[0]);
      if (rot === null) rot = sides.length ? sides[0][1] : 0; const c = Math.cos(rot), s = Math.sin(rot), at = p => [wx(i) + p[0] * c + p[1] * s, wx(j) - p[0] * s + p[1] * c];   // lokal kavling: +z = sisi jalan
      L = []; const tint = .9 + r() * .14;
      if (kind) L.push([kind, ...at(DS_LOT_AT[kind]), r() * 6.28, tint]);   // jari-jari benda dibatasi (dsKit fit r) → putaran bebas tetap di dalam kavling
      if (duck) L.push(['bebekL', ...at(DS_LOT_AT.bebekL), r() * 6.28, 1]); } }
  DS_LOT.set(key, L); return L;
}

let dsTx = null, dsTz = 0, dsKey = '', dsOcc = null, dsOpen = null;
let DS_LAST = [];   // [kit, x, z, rot, t0, nt, b0, nb] benda yang tampil (dibaca alat uji)
function dsPut(kit, x, y, z, rot, tint, nt, nb){
  const c = Math.cos(rot), s = Math.sin(rot), K = DS_KIT[kit], TA = K.t, BA = K.b, MA = dsA.instanceMatrix.array, CA = dsA.instanceColor.array, MB = dsB.instanceMatrix.array, CB = dsB.instanceColor.array;
  // putar sumbu Y: (x, z) → (x c + z s, −x s + z c) (sama dengan Matrix4.makeRotationY)
  for (let k = 0, o = 0; k < K.nt; k++, o += 15){ const m = (nt + k) * 16, cc = (nt + k) * 3;
    MA[m] = TA[o + 9] * c + TA[o + 11] * s; MA[m + 1] = TA[o + 10]; MA[m + 2] = -TA[o + 9] * s + TA[o + 11] * c; MA[m + 3] = 0;
    MA[m + 4] = TA[o + 3] * c + TA[o + 5] * s; MA[m + 5] = TA[o + 4]; MA[m + 6] = -TA[o + 3] * s + TA[o + 5] * c; MA[m + 7] = 0;
    MA[m + 8] = TA[o + 6] * c + TA[o + 8] * s; MA[m + 9] = TA[o + 7]; MA[m + 10] = -TA[o + 6] * s + TA[o + 8] * c; MA[m + 11] = 0;
    MA[m + 12] = x + TA[o] * c + TA[o + 2] * s; MA[m + 13] = y + TA[o + 1]; MA[m + 14] = z - TA[o] * s + TA[o + 2] * c; MA[m + 15] = 1;
    CA[cc] = TA[o + 12] * tint; CA[cc + 1] = TA[o + 13] * tint; CA[cc + 2] = TA[o + 14] * tint; }
  for (let k = 0, o = 0; k < K.nb; k++, o += 15){ const m = (nb + k) * 16, cc = (nb + k) * 3;
    for (let col = 0; col < 4; col++){ const a = o + col * 3, d = m + col * 4;
      MB[d] = BA[a] * c + BA[a + 2] * s; MB[d + 1] = BA[a + 1]; MB[d + 2] = -BA[a] * s + BA[a + 2] * c; MB[d + 3] = col === 3 ? 1 : 0; }
    MB[m + 12] += x; MB[m + 13] += y; MB[m + 14] += z;
    CB[cc] = BA[o + 12] * tint; CB[cc + 1] = BA[o + 13] * tint; CB[cc + 2] = BA[o + 14] * tint; }
}
function dsFill(){
  if (dsTx === null){ dsTx = Math.round(cam.tx / 48) * 48; dsTz = Math.round(cam.tz / 48) * 48; }
  let open, occ, pl = null; try { open = openSet; occ = S.occ; } catch (_) { return; }   // S (c3) belum terinisialisasi saat kait pertama
  try { if (place && place.i !== null) pl = [place.i, place.j, place.w, place.h]; } catch (_) {}
  const key = dsTx + ',' + dsTz + '|' + occ.size + '|' + CELL_ID.size + '|' + open.size + '|' + (pl ? pl.join(',') : '');
  if (key === dsKey && occ === dsOcc && open === dsOpen) return; dsKey = key; dsOcc = occ; dsOpen = open;   // tak ada yang berubah → tanpa kerja
  const RA2 = DS_RA * DS_RA, RB2 = DS_RB * DS_RB, list = [];   // [d2, kit, x, z, rot, tint]
  for (const k of DISTRICTS){ const [i0, j0, i1, j1] = DIST_RECT[k];
    const x0 = wx(i0) - T / 2, x1 = wx(Math.min(i1, N) - 1) + T / 2, z0 = wx(j0) - T / 2, z1 = wx(Math.min(j1, N) - 1) + T / 2;
    const ex = Math.max(x0 - dsTx, 0, dsTx - x1), ez = Math.max(z0 - dsTz, 0, dsTz - z1); if (ex * ex + ez * ez > RA2) continue;
    if (!open.has(k)){
      const c = chunkOf(k, open), fs = new Set(c.fields.map(f => f[0] + ',' + f[1]));
      for (let bx = 0; bx < 6; bx++) for (let by = 0; by < 14; by++){ const cx = wx(i0 + 2 + bx * 7) + 2.5 * T, cz = wx(j0 + 2 + by * 3) + T / 2, d2 = (cx - dsTx) ** 2 + (cz - dsTz) ** 2;
        if (d2 > RA2) continue; const L = dsBlock(k, cx, cz, fs.has(cx + ',' + cz), c.trees), cr = Math.cos(L.rot), sr = Math.sin(L.rot);
        const add = n => { const p = DS_POS[n] || [0, 0, 0]; list.push([d2, n, cx + p[0] * cr + p[1] * sr, cz - p[0] * sr + p[1] * cr, L.rot + p[2], n === 'pem' ? 1 : L.tint]); };
        for (const n of L.fa) add(n); if (d2 < RB2) for (const n of L.fb) add(n); } }
    else if (distRing(k) === 2 && ex * ex + ez * ez <= RB2){
      const rc = Math.ceil(DS_RB / T), ci = Math.round(dsTx / T + HALF), cj = Math.round(dsTz / T + HALF);
      for (let j = Math.max(j0, cj - rc); j <= Math.min(j1 - 1, cj + rc); j++){ if (roadJ(j)) continue;
        for (let i = Math.max(i0, ci - rc); i <= Math.min(i1 - 1, ci + rc); i++){ if (!isLot(i, j)) continue; const d2 = (wx(i) - dsTx) ** 2 + (wx(j) - dsTz) ** 2; if (d2 > RB2) continue;
          const q = j * N + i; if (occ.has(q) || CELL_ID.has(q)) continue; if (pl && i >= pl[0] && i < pl[0] + pl[2] && j >= pl[1] && j < pl[1] + pl[3]) continue;
          const L = dsLot(i, j); if (L) for (const e of L) list.push([d2, ...e]); } } } }
  list.sort((p, q) => p[0] - q[0]);
  let nt = 0, nb = 0; const y = YL.kavling + .005; DS_LAST = [];
  for (const [, kit, x, z, rot, tint] of list){ const K = DS_KIT[kit];
    if (nt + K.nt > DS_TRI_CAP || nb + K.nb > DS_BOX_CAP) continue;   // benda utuh atau tidak sama sekali
    dsPut(kit, x, y, z, rot, tint, nt, nb); DS_LAST.push([kit, x, z, rot, nt, K.nt, nb, K.nb]); nt += K.nt; nb += K.nb;
    if (nt >= DS_TRI_CAP - 30) break; }
  for (const [m, n] of [[dsA, nt], [dsB, nb]]){ m.count = n; m.visible = n > 0; m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; }
}
PROP_HOOKS.push((tx0, tz0) => { dsTx = tx0; dsTz = tz0; dsFill(); });
// okupansi / pratinjau penempatan berubah → kavling kosong ring 2 diisi ulang (fungsi c3/c4 di-hoist; dibungkus tanpa mengubah file lain; kunci kotor menyaring)
{ const _pl = paintLots; paintLots = function(){ const r = _pl.apply(this, arguments); dsFill(); return r; }; }
{ const _sp = setPlaceAnchor; setPlaceAnchor = function(){ const r = _sp.apply(this, arguments); dsFill(); return r; }; }
{ const _cp = cancelPlace; cancelPlace = function(){ const r = _cp.apply(this, arguments); dsFill(); return r; }; }
