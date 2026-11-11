
/* =====================================================================
   KAVLING KOSONG (tahap 7+9, kelompok "kavling"): rumput liar/ilalang berumpun, papan DIJUAL / TANAH NEGARA (huruf piksel FONT35 c1b),
   patok batas, tumpukan bata + karung pasir, jemuran. Isi deterministik dari hash (i,j); hanya kavling distrik terbuka yang BELUM terisi
   (S.occ ∪ CELL_ID) dan bukan tapak pratinjau penempatan; semua di dalam bidang kavling (±3,85 dari pusat petak).

   Anggaran (2 draw call, +1 di pass bayangan desktop; 0 program shader baru — hanya VMAT_I / DEPTH_NOINK_I yang sudah ada):
     kvTri  InstancedMesh SATU segitiga (1 segitiga/instans, tanpa kulit): bilah rumput, bercak rumpun, piksel huruf papan, cat merah patok.
            Persegi = 2 instans (segitiga + segitiga diputar 180° di bidangnya).
     kvBox  InstancedMesh SATU kotak berkulit tinta (24 segitiga/instans): papan, tiang, patok, bata, karung, tali & kain jemuran.
            Kulit tinta VMAT_I menskala tebal dengan skala-x instans → sumbu terpanjang tiap kotak diletakkan di x lokal
            (tiang tegak = kotak diputar 90° di z), sehingga garis tidak menebal di ujung.
   (Versi pertama memakai bitmask per instans + peta tulisan: program shader tambahan menambah ±1,1 dtk ke tugas terpanjang hp_perf
   → diganti pola ini.) Diisi ulang hanya lewat PROP_HOOKS (titik tatap pindah sel 48 u) dan saat okupansi/pratinjau berubah
   (paintLots, setPlaceAnchor, cancelPlace dibungkus di bawah; kunci kotor → tanpa kerja bila tak ada yang berubah). Tanpa kerja per frame.
   Radius: rumput desktop 240 u / HP 150 u, benda 170 / 110 u; terdekat dulu, dibatasi cap.
   ===================================================================== */
const KV_R = MOBILE ? 150 : 240, KV_RO = MOBILE ? 110 : 170;
// cap terburuk: desktop 14.000 × 1 + 420 × 24 = 24 rb segitiga; HP 5.000 + 160 × 24 = 8,8 rb
const KV_TRI_CAP = MOBILE ? (LOW ? 4000 : 5000) : LOW ? 7000 : 14000, KV_BOX_CAP = MOBILE ? (LOW ? 120 : 160) : LOW ? 220 : 420;

const KV_TRI_GEO = (() => { const g = new THREE.BufferGeometry(), lo = .8;   // segitiga siku (−,5,0) (,5,0) (−,5,1), muka +z; titik bawah sedikit gelap
  g.setAttribute('position', new THREE.Float32BufferAttribute([-.5, 0, 0, .5, 0, 0, -.5, 1, 0], 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute([lo, lo, lo, lo, lo, lo, 1, 1, 1], 3)); g.setAttribute('flag', new THREE.BufferAttribute(new Float32Array(3), 1));
  g.setAttribute('onormal', new THREE.BufferAttribute(new Int8Array(9), 3, true)); g.computeBoundingSphere(); return g; })();
const KV_BOX_GEO = merge([{ g: 'box', s: [1, 1, 1], p: [0, 0, 0], c: '#FFFFFF' }], false, { hullAll: true });   // kotak satuan berpusat di titik asal

const kvTri = new THREE.InstancedMesh(KV_TRI_GEO, VMAT_I, KV_TRI_CAP), kvBox = new THREE.InstancedMesh(KV_BOX_GEO, VMAT_I, KV_BOX_CAP);
for (const m of [kvTri, kvBox]){ m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(m.instanceMatrix.count * 3).fill(1), 3); m.count = 0; m.frustumCulled = false; m.receiveShadow = true; }
kvTri.castShadow = false; kvBox.castShadow = !LOW && !MOBILE; inkInstanced(kvBox); scene.add(kvTri, kvBox);

/* ---------- huruf piksel: persegi panjang per string (algoritma gabung baris-lalu-tegak sama dengan textGeo c1b) ---------- */
function kvRects(str){ const rects = []; let x = 0;
  for (const ch of str){ const gl = FONT35[ch] || FONT35[' ']; let act = [];
    for (let row = 0; row < 5; row++){ const runs = []; let b = 0; while (b < 3){ if (gl[row] & (4 >> b)){ let e = b; while (e + 1 < 3 && (gl[row] & (4 >> (e + 1)))) e++; runs.push([b, e]); b = e + 1; } else b++; }
      const nx = []; for (const [b0, e0] of runs){ const r = act.find(a => a.b === b0 && a.e === e0); if (r){ r.y1 = row + 1; nx.push(r); } else { const q = { b: b0, e: e0, y0: row, y1: row + 1, x }; rects.push(q); nx.push(q); } } act = nx; }
    x += 4; }
  return { cols: str.length * 4 - 1, rects: rects.map(r => [r.x + r.b, r.x + r.e + 1, r.y0, r.y1]) }; }

/* ---------- isi per zona: p = peluang kavling diisi, g = jumlah rumpun [min,maks], s = skala rumpun, dry = ilalang kering,
   jual/neg = papan, pat = patok tanpa papan, mat = bata + karung, jem = jemuran. KOTA/CBD rapi, KAMPUNG sedang, DESA rimbun. ---------- */
const KV_ZONE = {
  CBD:        { p: .40, g: [0, 2], s: [.55, .8],  dry: .30, jual: .30, neg: .04, pat: .04, mat: .08, jem: 0 },
  RUKO:       { p: .45, g: [1, 3], s: [.6, .9],   dry: .35, jual: .24, neg: .04, pat: .06, mat: .10, jem: 0 },
  KOTA:       { p: .45, g: [1, 3], s: [.7, 1.0],  dry: .20, jual: .20, neg: .03, pat: .10, mat: .08, jem: .04 },
  KAMPUNG:    { p: .55, g: [3, 6], s: [.8, 1.2],  dry: .35, jual: .07, neg: .06, pat: .06, mat: .12, jem: .16 },
  RUKO_KECIL: { p: .50, g: [3, 5], s: [.85, 1.3], dry: .45, jual: .14, neg: .05, pat: .10, mat: .08, jem: .05 },
  DESA:       { p: .62, g: [6, 10], s: [1.0, 1.55], dry: .60, jual: .05, neg: .12, pat: .18, mat: .04, jem: .12 } };
const KV_BIT = { jual: 1, negara: 2, patok: 4, bahan: 8, jemuran: 16 };
// kotak larangan rumpun (koordinat kit: pusat kavling, +z = sisi jalan) per bagian: [x0, x1, z0, z1]
const KV_KEEP = { 1: [[-2.4, -.6, 2.3, 3.6]], 2: [[-2.4, -.6, 2.3, 3.6]], 4: [[-3.8, -3.0, 3.0, 3.8], [3.0, 3.8, 3.0, 3.8]], 8: [[.6, 2.8, -2.2, 1.0]], 16: [[-3.0, .5, -2.3, -1.3]] };
const KV_COL = {}; const kvc = hex => KV_COL[hex] || (KV_COL[hex] = lin(hex));
// kit benda: tiap butir [jenis 0 segitiga / 1 kotak, x, y, z, rx, ry, rz, sx, sy, sz, warna] (koordinat kit; Euler 'YXZ'; putaran kavling ditambahkan ke ry)
const KV_KIT = (() => { const K = {}, H = Math.PI / 2;
  const box = (L, x, y, z, sx, sy, sz, c, ry) => L.push([1, x, y, z, 0, ry || 0, 0, sx, sy, sz, c]);
  const post = (L, x, z, h, w, c) => L.push([1, x, h / 2, z, 0, 0, H, h, w, w, c]);                       // tiang tegak: sumbu panjang di x lokal
  const rect = (L, x0, x1, y0, y1, z, c) => { const w = x1 - x0, h = y1 - y0;                             // persegi tegak menghadap +z = 2 segitiga
    L.push([0, x0 + w / 2, y0, z, 0, 0, 0, w, h, 1, c], [0, x0 + w / 2, y1, z, 0, 0, Math.PI, w, h, 1, c]); };
  const flat = (L, x, z, y, w, d, c) => L.push([0, x, y, z + d / 2, -H, 0, 0, w, d, 1, c], [0, x, y, z - d / 2, -H, 0, Math.PI, w, d, 1, c]);   // persegi datar (normal ke atas)
  const text = (L, s, cx, yb, z, maxW, maxH, c) => { const R = kvRects(s); let px = maxH / 5; if (R.cols * px > maxW) px = maxW / R.cols; const x0 = cx - R.cols * px / 2, yt = yb + 5 * px;
    for (const [a, b, r0, r1] of R.rects) rect(L, x0 + a * px, x0 + b * px, yt - r1 * px, yt - r0 * px, z, c); };
  const BX = -1.5, BZ = 2.95, BY = 1.2, BW = 1.3, BH = .75, FZ = BZ + .025 + .01, BM = BY + BH / 2;   // papan: kiri depan; muka huruf ,01 di depan papan
  let L = K.jual = []; post(L, BX, BZ - .07, BY + BH + .1, .08, '#B59A6A'); box(L, BX, BM, BZ, BW, BH, .05, '#E9E2CF');
  for (const [x0, x1, y0, y1] of [[-.6, .6, .3, .34], [-.6, .6, -.34, -.3], [-.6, -.56, -.3, .3], [.56, .6, -.3, .3]]) rect(L, BX + x0, BX + x1, BM + y0, BM + y1, FZ, '#B5473A');   // bingkai merah
  text(L, 'DIJUAL', BX, BY + .32, FZ, 1.0, .26, '#B5473A'); rect(L, BX - .36, BX + .36, BY + .14, BY + .19, FZ, '#2B2B2B');   // garis "nomor telepon"
  L = K.negara = []; post(L, BX, BZ - .07, BY + BH + .1, .08, '#B59A6A'); box(L, BX, BM, BZ, BW, BH, .05, '#E6E2D8');
  rect(L, BX - .62, BX + .62, BY + BH - .15, BY + BH - .04, FZ, '#B5473A');                                  // pita merah (merah-putih)
  text(L, 'TANAH', BX, BY + .33, FZ, 1.15, .2, '#1E2A44'); text(L, 'NEGARA', BX, BY + .07, FZ, 1.15, .2, '#1E2A44');
  L = K.patok = []; for (const s of [-1, 1]){ post(L, s * 3.45, 3.45, .45, .12, '#DDD9CE'); flat(L, s * 3.45, 3.45, .456, .12, .12, '#B5473A'); }
  L = K.bahan = []; box(L, 2.0, .225, -1.6, 1.2, .45, .8, '#A8553B'); box(L, 1.85, .575, -1.65, .7, .25, .45, '#B5603F', .25);
  box(L, 1.55, .13, .25, .8, .26, .5, '#D3C293', -.2); box(L, 1.75, .38, .2, .75, .24, .48, '#C9BFA6', .15);   // karung pasir & semen
  L = K.jemuran = []; const JY = 1.65, JZ = -1.8, JX0 = -2.6, JX1 = .2; post(L, JX0, JZ, JY + .1, .06, PAL.kayu[0]); post(L, JX1, JZ, JY + .1, .06, PAL.kayu[0]);
  box(L, (JX0 + JX1) / 2, JY, JZ, JX1 - JX0, .02, .02, '#3A3A36');
  box(L, -2.05, JY - .37, JZ, .6, .72, .03, '#3E6FB0'); box(L, -1.3, JY - .26, JZ, .5, .5, .03, '#E6E2D8'); box(L, -.5, JY - .3, JZ, .72, .58, .03, '#8C5A3A');
  return K; })();
const KV_KITS = [[KV_BIT.jual, KV_KIT.jual], [KV_BIT.negara, KV_KIT.negara], [KV_BIT.patok, KV_KIT.patok], [KV_BIT.bahan, KV_KIT.bahan], [KV_BIT.jemuran, KV_KIT.jemuran]];

// isi satu kavling (dunia), disimpan rata per butir 13 angka: [jenis, x, y, z, rx, ry, rz, sx, sy, sz, r, g, b]
const KV_CACHE = new Map();
function kvLot(i, j){
  const key = j * N + i; let L = KV_CACHE.get(key); if (L) return L;
  if (KV_CACHE.size > (MOBILE ? 2500 : 6000)) KV_CACHE.clear();   // batas memori (isi deterministik, aman dibuang)
  const r = rng(hashStr('kav' + i + ',' + j)), Z = KV_ZONE[zoneOfLot(i, j, 1, 1)] || KV_ZONE.KAMPUNG;
  L = { obj: null, nObjTri: 0, nObjBox: 0, grass: null };
  if (r() >= Z.p){ KV_CACHE.set(key, L); return L; }
  const f = fronts(i, j, 1, 1), sides = [[f.S, 0], [f.E, Math.PI / 2], [f.N, Math.PI], [f.W, -Math.PI / 2]].filter(s => s[0] > 0).sort((a, b) => b[0] - a[0]);
  const rot = sides.length ? sides[sides.length > 1 && sides[1][0] === sides[0][0] && r() < .5 ? 1 : 0][1] : 0;   // +z kit menghadap jalan
  const u = r(); let m = 0;
  if (u < Z.jual) m |= KV_BIT.jual; else if (u < Z.jual + Z.neg) m |= KV_BIT.negara;
  if ((m && r() < .6) || (!m && r() < Z.pat)) m |= KV_BIT.patok;
  if (r() < Z.mat) m |= KV_BIT.bahan;
  { const dk = typeof dsLotKind === "function" ? dsLotKind(i, j) : null; if (dk && dk.kind) m &= ~KV_BIT.bahan; }   // integrasi: sudut belakang-kanan milik bambu/pisang c2f_desa
  if (r() < Z.jem) m |= KV_BIT.jemuran;
  L.m = m; L.rot = rot;
  const c = Math.cos(rot), s = Math.sin(rot), cx = wx(i), cz = wx(j), y0 = YL.kavling;
  const toW = (out, it, tint) => { const x = it[1], z = it[3], col = typeof it[10] === 'string' ? kvc(it[10]) : it[10];
    out.push(it[0], cx + x * c + z * s, y0 + it[2], cz - x * s + z * c, it[4], it[5] + rot, it[6], it[7], it[8], it[9], col.r * tint, col.g * tint, col.b * tint); };
  const obj = [], tint = .93 + r() * .1;
  for (const [bit, kit] of KV_KITS) if (m & bit) for (const it of kit){ toW(obj, it, tint); if (it[0]) L.nObjBox++; else L.nObjTri++; }
  if (obj.length) L.obj = new Float32Array(obj);
  // rumpun: 1–2 pusat, rumpun ±1,3 di sekitarnya, tepi ±2,9 (rumpun terbesar ±,55 × 1,55 → tetap di dalam ±3,85).
  // Tiap rumpun 13 segitiga: bercak datar hijau tua (3, terbaca dari drone) + 5 bilah tegak (hijau / ilalang kering) × 2 muka
  const blocked = (x, z) => { for (const b of [1, 2, 4, 8, 16]) if (m & b) for (const q of KV_KEEP[b]) if (x > q[0] && x < q[1] && z > q[2] && z < q[3]) return true; return false; };
  const ng = Z.g[0] + Math.floor(r() * (Z.g[1] - Z.g[0] + 1)), centers = [[(r() - .5) * 4.4, (r() - .5) * 4.4], [(r() - .5) * 4.4, (r() - .5) * 4.4]], gr = [];
  for (let k = 0; k < ng; k++){ const ce = centers[k % (ng > 3 ? 2 : 1)];
    for (let t = 0; t < 4; t++){ const x = clamp(ce[0] + (r() - .5) * 2.6, -2.9, 2.9), z = clamp(ce[1] + (r() - .5) * 2.6, -2.9, 2.9); if (blocked(x, z)) continue;
      const sc = Z.s[0] + r() * (Z.s[1] - Z.s[0]), dry = r() < Z.dry, a0 = r() * 6.28;
      const dark = { r: .11 * (.88 + r() * .2), g: .18 * (.88 + r() * .2), b: .06 };   // linear
      // bercak: 3 segitiga datar berpusat (titik siku di pusat rumpun, diputar 120°) → bentuk kincir tak beraturan, bukan persegi
      for (let q = 0; q < 3; q++){ const a = a0 + q * 2.094, w = (.32 + r() * .16) * sc, d = (.28 + r() * .16) * sc;
        toW(gr, [0, x + .5 * w * Math.cos(a), .012, z - .5 * w * Math.sin(a), -Math.PI / 2, a, 0, w, d, 1, dark], 1); }
      // 5 bilah, tiap bilah 2 segitiga punggung-ke-punggung (ry + π; condong berlawanan) → terlihat dari segala arah
      for (let q = 0; q < 5; q++){ const h = (.45 + r() * .4) * sc, w = (.09 + r() * .05) * sc, a = r() * 6.28, d = r() * .22 * sc, ry = r() * 6.28, lean = (r() - .5) * .5;
        const col = dry ? { r: .42 + r() * .08, g: .38 + r() * .06, b: .15 } : { r: .16 + r() * .06, g: .27 + r() * .08, b: .07 + r() * .03 };
        for (const k2 of [0, Math.PI]) toW(gr, [0, x + Math.cos(a) * d, -.01, z + Math.sin(a) * d, lean, ry + k2, 0, w, h, 1, col], 1); }
      break; } }
  if (gr.length) L.grass = new Float32Array(gr);
  KV_CACHE.set(key, L); return L;
}

let kvTx = null, kvTz = 0, kvKey = '', kvOcc = null, kvOpen = null;
const kvPut = (A, k, mesh, n) => { _e.set(A[k + 4], A[k + 5], A[k + 6], 'YXZ'); _q.setFromEuler(_e); _m4.compose(_v3.set(A[k + 1], A[k + 2], A[k + 3]), _q, _s3.set(A[k + 7], A[k + 8], A[k + 9]));
  mesh.setMatrixAt(n, _m4); const ca = mesh.instanceColor.array; ca[n * 3] = A[k + 10]; ca[n * 3 + 1] = A[k + 11]; ca[n * 3 + 2] = A[k + 12]; };
function kvFill(){
  if (kvTx === null){ kvTx = Math.round(cam.tx / 48) * 48; kvTz = Math.round(cam.tz / 48) * 48; }
  let occ, pl = null; try { occ = S.occ; } catch (_) { return; }   // S/place (c3/c4) belum terinisialisasi saat kait pertama
  try { if (place && place.i !== null) pl = [place.i, place.j, place.w, place.h]; } catch (_) {}
  const key = kvTx + ',' + kvTz + '|' + occ.size + '|' + CELL_ID.size + '|' + openSet.size + '|' + (pl ? pl.join(',') : '');
  if (key === kvKey && occ === kvOcc && openSet === kvOpen) return; kvKey = key; kvOcc = occ; kvOpen = openSet;   // tak ada yang berubah → tanpa kerja
  const R2 = KV_R * KV_R, RO2 = KV_RO * KV_RO, rc = Math.ceil(KV_R / T), ci = Math.round(kvTx / T + HALF), cj = Math.round(kvTz / T + HALF), list = [];
  for (let j = cj - rc; j <= cj + rc; j++){ if (j < 0 || j >= N || roadJ(j)) continue; const dz = wx(j) - kvTz;
    for (let i = ci - rc; i <= ci + rc; i++){ if (!isLot(i, j)) continue; const dx = wx(i) - kvTx, d2 = dx * dx + dz * dz; if (d2 > R2) continue;
      const k = j * N + i; if (occ.has(k) || CELL_ID.has(k) || !openSet.has(districtOf(i, j))) continue;
      if (pl && i >= pl[0] && i < pl[0] + pl[2] && j >= pl[1] && j < pl[1] + pl[3]) continue;
      const L = kvLot(i, j); if (L.obj || L.grass) list.push([d2, L]); } }
  list.sort((a, b) => a[0] - b[0]);
  let nt = 0, nb = 0;
  for (const [d2, L] of list){
    if (L.obj && d2 < RO2 && nt + L.nObjTri <= KV_TRI_CAP && nb + L.nObjBox <= KV_BOX_CAP)   // benda utuh atau tidak sama sekali (huruf tak terpotong)
      for (let k = 0; k < L.obj.length; k += 13){ if (L.obj[k]) kvPut(L.obj, k, kvBox, nb++); else kvPut(L.obj, k, kvTri, nt++); }
    if (L.grass) for (let k = 0; k < L.grass.length && nt < KV_TRI_CAP; k += 13) kvPut(L.grass, k, kvTri, nt++);
    if (nt >= KV_TRI_CAP) break; }
  kvTri.count = nt; kvBox.count = nb;
  for (const m of [kvTri, kvBox]){ m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; }
}
PROP_HOOKS.push((tx0, tz0) => { kvTx = tx0; kvTz = tz0; kvFill(); });
/* Okupansi berubah (rebuildOcc → paintLots di c3; penempatan/batal di c4): isi ulang segera (kunci kotor menyaring panggilan yang hanya
   mengubah warna kavling). Fungsi dideklarasikan (hoisted) di file berikut; dibungkus di sini tanpa mengubah file kelompok lain. */
{ const _pl = paintLots; paintLots = function(){ const r = _pl.apply(this, arguments); kvFill(); return r; }; }
{ const _sp = setPlaceAnchor; setPlaceAnchor = function(){ const r = _sp.apply(this, arguments); kvFill(); return r; }; }
{ const _cp = cancelPlace; cancelPlace = function(){ const r = _cp.apply(this, arguments); kvFill(); return r; }; }
