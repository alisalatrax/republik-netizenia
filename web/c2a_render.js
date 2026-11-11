
/* =====================================================================
   MESIN 3D
   ===================================================================== */
const MOBILE = Math.min(screen.width, screen.height) < 600;
// kualitas: ?hemat=0 paksa grafik penuh (alat uji), ?hemat=1 paksa hemat, ?hemat=2 grafik penuh TANPA shadow map; selain itu otomatis (pilihan menu / RAM ≤ 3 GB / ≤ 4 inti)
const HEMAT_Q = QS.get('hemat');
const LOW = HEMAT_Q === '0' || HEMAT_Q === '2' ? false : (HEMAT_Q === '1' || store.get('nz_hemat', false) === true || (navigator.deviceMemory && navigator.deviceMemory <= 3) || (navigator.hardwareConcurrency || 8) <= 4);
const NO_SHADOW = HEMAT_Q === '2';
const canvas = $('#gl');
// HP (layar < 600 px): tanpa MSAA, piksel ≤ 1,25× (performa November 2026; ?hemat=0 tetap kualitas penuh untuk alat uji)
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !MOBILE || HEMAT_Q === '0', powerPreference: 'high-performance', preserveDrawingBuffer: false });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, LOW ? 1 : MOBILE && HEMAT_Q !== '0' ? 1.25 : 1.5));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.LinearToneMapping;
/* Eksposur. Spek §2.1: .72, dihitung dengan warna cahaya PUTIH ((.62·1 + .78)·.72 = 1,01 → sisi terang ≈ albedo). Warna spek tidak putih:
   matahari #FBF0DA (lin G .87) dan langit #C9D6E2 (lin G .67) → luminansi rata berbobot ≈ .76, jadi .72 memberi sisi terang hanya ≈ .78 × albedo
   (dihitung dari ukuran EXPO .84: rumput rata-RGB ≈ 114/101, aspal V ≈ .23). EXPO = .72 / .76 ≈ .95 mengembalikan maksud spek; .96 diambil supaya rumput nada gelap ≥ 115. */
const EXPO = .96;
renderer.toneMappingExposure = EXPO;                 // applyTime: EXPO siang → EXPO − .08 malam
renderer.shadowMap.enabled = !NO_SHADOW;             // LOW tetap berbayangan (peta 1024); hanya ?hemat=2 yang mematikan shadow map
/* MENYIMPANG dari spek §2.4 (PCFShadowMap radius 1) — integrasi r2: PCF r128 = 17 cuplikan nearest di ±1/±½ texel → tepi bayangan bertangga yang,
   di permukaan penerima miring (dinding di bawah teritis, atap), terentang jadi rumbai/sisir vertikal ±10 px (verifikasi akhir2: padat-15 x 510–690
   y 420–470, kampung-15, sudut-15). PCFSoft r128 = 16 cuplikan dengan bobot bilinear → tepi tetap tajam (± 1,5 texel ≈ 2 px di dist 60–110) tanpa
   sisir. Biaya sama (16 vs 17 cuplikan), tanpa pass tambahan. A/B test/ri2/pcf (jam 15, 1280×720): V, V<0,4, run, tepi >0,25 berubah ≤ 0,003 / 0,2 %. */
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
/* Kabut: peta 217×217 petak × T 8 = 1.736 u. Fog linear 260/900 (rumus 41×41) akan menutup sisi jauh kota saat dilihat dari zoom terjauh
   dan menelan cincin gunung seluruhnya → FogExp2. Kerapatan ikut skala T (0,00075 × 6/8 = 0,00056): < 5 % sampai 400 u, ≈ 21 % di 870 u, ≈ 43 % di 1.330 u
   (jarak relatif terhadap peta sama dengan T 6). */
scene.fog = new THREE.FogExp2(0x8A98A5, .00075 * 6 / T * (MOBILE && HEMAT_Q !== '0' ? 1.35 : 1));   // HP: kabut sedikit lebih rapat menutup batas jarak gambar chunk (c2cz BCH_VIS)
/* Lensa (spek-gaya §4.6/§4.7): mode peta FOV 34 (potret 34 + (1 − aspek)·40), mode tokoh FOV 62 (potret 75) near ,2. setLens() (c2e) dipanggil resize/startWalk/stopWalk.
   near peta 1 (bukan ,5 spek): lapisan jalan/trotoar berjarak 5 mm; near ,5 menggandakan galat kedalaman di 300–800 u → kedip z di simpang. Jarak peta minimum 30 → tidak ada objek < 1 u. */
const camera = new THREE.PerspectiveCamera(34, 1, 1, 2400);
// lin(hex, wall): sRGB → linear dengan desaturasi 8 % (primitif dinding, wall true: 20 %; wall berupa angka = fraksi desaturasi itu), tanpa penggelapan tambahan.
// Hasil di-cache (objek Color bersama: salin, jangan ubah).
const lin = (() => { const cache = new Map(), grey = new THREE.Color(); return (hex, wall) => { const d = typeof wall === 'number' ? wall : wall ? .20 : .08, key = hex + '|' + d; let c = cache.get(key);
  if (!c){ c = new THREE.Color(hex); const l = c.r * .3 + c.g * .59 + c.b * .11; c.lerp(grey.setRGB(l, l, l), d).convertSRGBToLinear(); cache.set(key, c); } return c; }; })();

const hemi = new THREE.HemisphereLight(0xC9D6E2, 0x6E6A58, .78); scene.add(hemi);      // warna & kuat diatur applyTime (SKYKEYS)
const sun = new THREE.DirectionalLight(0xFBF0DA, .62); sun.castShadow = !NO_SHADOW;
const SHADOW_MAP = LOW || MOBILE ? 1024 : 2048;
sun.shadow.mapSize.set(SHADOW_MAP, SHADOW_MAP); sun.shadow.radius = 1;
Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 10, far: 600 });
sun.shadow.bias = -0.0002; sun.shadow.normalBias = .1;   // span, bias & normalBias dihitung ulang dari ukuran texel tiap frame (applyCam)
scene.add(sun, sun.target);

/* ---------- geometri dasar + penggabung ---------- */
const BASE = (() => {
  const pyr = new THREE.ConeGeometry(.5, 1, 4, 1); pyr.rotateY(Math.PI / 4); pyr.scale(Math.SQRT2, 1, Math.SQRT2);
  const pr = new THREE.BufferGeometry();
  const L0 = [-.5,-.5,-.5], L1 = [-.5,-.5,.5], L2 = [-.5,.5,0], R0 = [.5,-.5,-.5], R1 = [.5,-.5,.5], R2 = [.5,.5,0];
  const tris = [L0,L1,L2, R0,R2,R1, L0,R0,R1, L0,R1,L1, L1,R1,R2, L1,R2,L2, L0,L2,R2, L0,R2,R0];
  pr.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3)); pr.computeVertexNormals();
  return { box: new THREE.BoxGeometry(1,1,1).toNonIndexed(), pyr: pyr.toNonIndexed(), prism: pr,
           cyl: new THREE.CylinderGeometry(.5,.5,1,12).toNonIndexed(), cone: new THREE.ConeGeometry(.5,1,10).toNonIndexed(),
           sph: new THREE.SphereGeometry(.5,12,8).toNonIndexed(),
           // murah (spek §7.1, tata bahasa fasad c1b): bola bersegi 7×5 (56 segitiga) dan silinder 8 segmen (32 segitiga)
           sphLo: new THREE.SphereGeometry(.5,7,5).toNonIndexed(), cylLo: new THREE.CylinderGeometry(.5,.5,1,8).toNonIndexed() };
})();
/* ---------- garis tinta (spek-gaya §2.5–2.7) ----------
   SILUET: inverted hull bertebal KONSTAN DI LAYAR. Kulit = salinan segitiga A (lod 0 & berkulit) dengan urutan dibalik (flag 1) di geometri yang sama
   → satu draw call badan+kulit per objek. Shader (inkify) menggeser titik kulit sepanjang 'onormal' sejauh th = clamp(−z·uK, uMin, uMax) / skala objek,
   uK = PX·2·tan(fov/2) / innerHeight (px CSS; dihitung ulang tiap frame di applyCam: PX 1,4 peta / 1,8 tokoh).
   onormal = normal "miter" per titik, dihitung dari normal muka yang bertemu di titik itu (tabel posisi BASE dihitung SEKALI per BASE, tanpa hash per model):
   sudut kotak → (±1,±1,±1) sehingga tiap muka bergeser tepat th dan kulit tidak pecah di sudut; tepi silinder → radial + tutup; bola → normal halus.
   Disimpan Int8 ternormalisasi dibagi ONS (panjang miter ≤ 2 · lebar aktor ≤ 1,25).
   Warna tinta = warna-lokal linear × ,14 + (,010 ,007 ,006) (≈ ,42× sRGB, hangat), pohon/awan ×,20; dihitung CPU ke atribut color titik kulit.
   LIPATAN INTERIOR: tabel sisi satuan per primitif (BASE_EDGES) → userData.edges (Float32, ruang model) + edgeColor (Uint8n) → quad garis layar EDGE_LW px per bangunan (edgeGeoOf/EDGE_MAT). */
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v3 = new THREE.Vector3(), _s3 = new THREE.Vector3(), _nm = new THREE.Matrix3(), _e = new THREE.Euler(), _t = new THREE.Vector3(), _n = new THREE.Vector3();
const INK_U = { uK: { value: .001 }, uMin: { value: .006 }, uMax: { value: .35 } };   // uK diisi applyCam (c2e) tiap frame
const INK_PX = { peta: 1.4, tokoh: 1.8 };   // tebal siluet px CSS (spek §2.5)
const INK_MUL = .14, INK_MUL_SOFT = .20, INK_ADD = [.010, .007, .006], ONS = 2.5;
/* Pengali tebal kulit bangunan (merge opt.inkW di modelGeo) — MENYIMPANG dari spek (PX 1,4 untuk semua). Siluet bangunan = kulit + garis lipatan
   EDGE_LW px yang jatuh TEPAT di tepi siluet (separuhnya, ≈ ,65 px, di dalam badan). Diukur (test/r1_tinta.js + r1_ukur.py, metode selisih rata-RGB):
   kulit ,72 (≈ 1,0 px) + garis 1,3 px → siluet dinding 1,97 / 1,90 px di dist 22 / 110 (kriteria 1,2–1,8); ,48 → 1,40 / 1,49 / 1,40 / 1,25 px
   di dist 22 / 60 / 110 / 300; ,53 → 1,49 / 1,49 / 1,41 / 1,25. ,57 (kulit ≈ ,80 px) memusatkan rentang di dalam 1,2–1,8.
   PX global tetap spek (1,4 / 1,8): pohon & aktor tidak bergaris lipatan dan memakai PX penuh.
   Bangunan TANPA garis sama sekali (pratinjau penempatan, model tanpa sisi tepi luar, atau > EDGE_OUTER_CAM dari kamera — c2c setEdgeLevel) memakai
   VMAT_FAR: kulit dikali uInkB = BLD_INK_W_FAR / BLD_INK_W (kulit saja, tanpa garis). Tanpa ini siluet bangunan jauh hanya kulit ,57 ≈ 1,0 px
   (verifikasi 2.2: jauh2 1,00 px, kriteria 1,2–1,8). Diukur (test/t22r2_tinta.js bagian far/jauh2, kamera sama, EDGE_FAR 0): 1,0 (spek) → 1,54 / 1,73 / 1,75 px
   di dist 22 / 110 / 300 (rata 1,60 / 1,78 / 1,88, terlalu dekat batas 1,8); ,85 → 1,25 / 1,49 / 1,50, jauh2 (cam 200, rumah 128 u di belakang titik tatap) 1,49
   = sama dengan siluet bangunan dekat (kulit ,57 + garis: 1,49 / 1,49 / 1,48) → tidak ada lompatan tebal di batas EDGE_FAR.
   Program shader sama dengan VMAT (uniform per materi), tanpa pass tambahan. */
const BLD_INK_W = .57, BLD_INK_W_FAR = .85;
/* LOD garis lipatan (tahap 2 ronde 3): VMAT_FAR saja (kulit tebal, tanpa garis) gagal di bangunan jauh yang dilihat hampir frontal — kulit di kaki
   sisi tegak tertutup kedalaman alas/tanah (verifikasi 2.3 jauh-200: median 0,79 px bila titik tanpa tinta dihitung 0). Maka garis TIDAK lagi dibuang
   seluruhnya di luar EDGE_FAR: merge() menandai sisi "tepi luar" = sisi primitif berkulit (kelas A, min(s) ≥ ,25) dengan max(s) ≥ EDGE_OUTER_MIN
   (dinding, atap, plint, parapet; bukan kusen/lis/pagar/jeruji/AC) dan menaruhnya di depan array → edgeGeoOf membuat geometri kedua (rentang
   [0, nEdgeOuter), atribut & indeks dibagi). Bangunan jauh = VMAT (kulit ,57) + garis tepi luar → siluet sama dengan bangunan dekat (kulit + garis). */
const EDGE_OUTER_MIN = 1.2;
const GLOW_U = { value: new THREE.Color(1, 1, 1) };
const GLOWMAT = { color: GLOW_U.value };   // kompatibilitas: applyTime/thumbs mengubah warna nyala jendela lewat objek ini
// tabel posisi per geometri (BASE atau p.geo custom): pid[k] = indeks posisi unik titik k; reps[u] = titik wakil tiap normal BERBEDA di posisi u
function baseInfo(g){
  let I = g.userData.nzInfo; if (I) return I;
  const p = g.attributes.position.array, nr = g.attributes.normal.array, n = g.attributes.position.count, map = new Map(), pid = new Int32Array(n), reps = [];
  for (let k = 0; k < n; k++){
    const key = Math.round(p[k*3] * 1e4) + ',' + Math.round(p[k*3+1] * 1e4) + ',' + Math.round(p[k*3+2] * 1e4);
    let u = map.get(key); if (u === undefined){ u = reps.length; map.set(key, u); reps.push([]); }
    pid[k] = u; const r = reps[u];
    if (!r.some(q => nr[q*3] * nr[k*3] + nr[q*3+1] * nr[k*3+1] + nr[q*3+2] * nr[k*3+2] > .999)) r.push(k);
  }
  return (g.userData.nzInfo = { pid, reps });
}
/* Tabel sisi satuan per BASE (spek §2.6): kotak 12 · prism 9 (4 alas + 4 miring + bubungan) · pyr 8 · silinder 2 cincin · kerucut 1 cincin · bola/bidang 0.
   BASE lain (cyl8/cyl6/cone8/sph8/sphLo/cylLo … yang ditambah c2b/c2d) diturunkan sekali dari geometrinya: cincin titik ber-radius ≥ ,45 di y = ±,5 (sisi tegak tidak digaris). */
const BASE_EDGES = (() => {
  const box = []; for (let ax = 0; ax < 3; ax++){ const o1 = (ax + 1) % 3, o2 = (ax + 2) % 3;
    for (const s1 of [-.5, .5]) for (const s2 of [-.5, .5]){ const a = [0, 0, 0], b = [0, 0, 0]; a[o1] = b[o1] = s1; a[o2] = b[o2] = s2; a[ax] = -.5; b[ax] = .5; box.push(...a, ...b); } }
  const L0 = [-.5,-.5,-.5], L1 = [-.5,-.5,.5], L2 = [-.5,.5,0], R0 = [.5,-.5,-.5], R1 = [.5,-.5,.5], R2 = [.5,.5,0];
  const c = [[-.5,-.5,-.5], [.5,-.5,-.5], [.5,-.5,.5], [-.5,-.5,.5]], ap = [0, .5, 0];
  return { box: new Float32Array(box), prism: new Float32Array([L0,L1, R0,R1, L0,R0, L1,R1, L0,L2, L1,L2, R0,R2, R1,R2, L2,R2].flat()),
           pyr: new Float32Array([c[0],c[1], c[1],c[2], c[2],c[3], c[3],c[0], c[0],ap, c[1],ap, c[2],ap, c[3],ap].flat()) };
})();
function baseEdges(name){
  let e = BASE_EDGES[name]; if (e !== undefined) return e;
  const p = BASE[name].attributes.position.array, out = [];
  for (const y of [-.5, .5]){ const angs = new Set(); let rr = 0;
    for (let k = 0; k < p.length; k += 3){ const r = Math.hypot(p[k], p[k+2]); if (Math.abs(p[k+1] - y) < 1e-4 && r > .45){ angs.add(Math.round(Math.atan2(p[k], p[k+2]) * 1e5)); rr = r; } }
    const a = [...angs].sort((u, v) => u - v).map(v => v / 1e5); if (a.length < 3) continue;
    for (let k = 0; k < a.length; k++){ const a0 = a[k], a1 = a[(k + 1) % a.length]; out.push(rr * Math.sin(a0), y, rr * Math.cos(a0), rr * Math.sin(a1), y, rr * Math.cos(a1)); } }
  return (BASE_EDGES[name] = new Float32Array(out));
}
/* attach (spek §5 aturan 2): 'z+'/'z-'/'x+'/'x-' = arah muka primitif tempel → 4 sisi muka belakang (berimpit host) dibuang;
   'y+' = host DI ATAS (pita bawah atap §2.7) → 4 sisi atas dibuang; 'y-' = duduk di atas host → 4 sisi bawah dibuang. */
const ATTACH_DROP = { 'z+': [2, -.5], 'z-': [2, .5], 'x+': [0, -.5], 'x-': [0, .5], 'y+': [1, .5], 'y-': [1, -.5] };
// uji "di dalam benda padat" (ruang satuan primitif, marjin m per sumbu) untuk membuang sisi tersembunyi (mis. sisi belakang kusen yang terbenam di dinding)
const SOLID_IN = {
  box: (x, y, z, m) => Math.abs(x) < .5 - m[0] && Math.abs(y) < .5 - m[1] && Math.abs(z) < .5 - m[2],
  prism: (x, y, z, m) => Math.abs(x) < .5 - m[0] && y > -.5 + m[1] && y < .5 - 2 * Math.abs(z) - m[1] - m[2],
  pyr: (x, y, z, m) => y > -.5 + m[1] && Math.max(Math.abs(x) + m[0], Math.abs(z) + m[2]) < (.5 - y) / 2,
  cyl: (x, y, z, m) => Math.abs(y) < .5 - m[1] && Math.hypot(x, z) < .5 - Math.max(m[0], m[2]),
  cone: (x, y, z, m) => y > -.5 + m[1] && Math.hypot(x, z) < (.5 - y) / 2 - Math.max(m[0], m[2]),
  sph: (x, y, z, m) => Math.hypot(x, y, z) < .5 - Math.max(m[0], m[1], m[2]),
};
const solidOf = g => g === 'box' || g === 'prism' || g === 'pyr' ? g : /^cyl/.test(g) ? 'cyl' : /^cone/.test(g) ? 'cone' : /^sph/.test(g) ? 'sph' : null;
let _mit = new Float32Array(3 * 512);
const LUM = c => c.r * .2126 + c.g * .7152 + c.b * .0722;   // luminansi linear
/* merge(parts, ao, opt) → BufferGeometry non-indexed (rencana §2): position, normal, color (linear; titik kulit = warna tinta), flag (0 badan, 1 kulit, 2 nyala),
   onormal (Int8n, miter/ONS; badan A dan kulit), userData { nA, nAB, nABC, nHull, edges, edgeColor }.
   Urutan titik: [A lod0 & berkulit][B lod0 tanpa kulit][C lod1][kulit = salinan A][nyala].
   opt: ink (false/0 = tanpa kulit), soft (tinta ×,20: pohon/awan/bukit), inkW (pengali tebal: aktor), hullAll (semua primitif berkulit: aktor),
        copies:false (onormal saja tanpa salinan kulit, untuk INKMAT terpisah), edges (kumpulkan sisi interior: bangunan), glow (daftar G),
        edgeHost (warna linear dinding model: garis sisi memakai tinta yang lebih gelap antara primitif dan dinding).
   Aturan otomatis (spek §2.5, §5 aturan 3): batang tipis min(s) < ,12 && (mid < ,25 || maks < ,6) → lod 1 + noEdge; min(s) < ,25 → noHull.
   AO (spek §2.7): (,60 + ,40·clamp(y/1,8)) × (n.y < −,5 ? ,55 : 1) × p.ao; muka menghadap langit (n.y > ,5) tidak digelapkan (alas kavling/rumput/lantai = tanah sekitarnya). */
function merge(parts, ao, opt){
  opt = opt || {};
  const glow = opt.glow || [], hull = opt.ink === undefined ? true : !!opt.ink, copies = hull && opt.copies !== false, mul = opt.soft ? INK_MUL_SOFT : INK_MUL;
  const inkW = (opt.inkW || 1) / ONS, wantE = !!opt.edges, geoOf = p => p.g === 'custom' ? p.geo : BASE[p.g], eHost = opt.edgeHost || null;
  const cls = [[], [], []];
  for (const p of parts){ const s = p.s, mn = Math.min(s[0], s[1], s[2]), mx = Math.max(s[0], s[1], s[2]), mid = s[0] + s[1] + s[2] - mn - mx, cu = p.g === 'custom';
    const thin = !cu && mn < .12 && (mid < .25 || mx < .6), lod = p.lod || (thin ? 1 : 0);
    const noHull = !hull || !!p.noHull || (!opt.hullAll && !cu && mn < .25);
    const k = noHull ? (lod ? 2 : 1) : (lod && !opt.hullAll ? 2 : 0);
    cls[k].push({ p, hull: k === 0, noEdge: !!(p.noEdge || thin) }); }
  const cnt = list => list.reduce((s, q) => s + geoOf(q.p).attributes.position.count, 0);
  const nA = cnt(cls[0]), nB = cnt(cls[1]), nC = cnt(cls[2]), nG = glow.reduce((s, p) => s + geoOf(p).attributes.position.count, 0);
  const nBody = nA + nB + nC, H0 = nBody, nH = copies ? nA : 0, total = nBody + nH + nG;
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), col = new Float32Array(total * 3), flag = new Float32Array(total), onr = new Int8Array(total * 3);
  const occ = wantE ? [] : null, pend = wantE ? [] : null;
  let o = 0;
  const put = (q, isGlow) => {
    const p = q.p, g = geoOf(p), gp = g.attributes.position.array, gn = g.attributes.normal.array, n = g.attributes.position.count;
    _e.set(p.rx || 0, p.ry || 0, 0, 'YXZ'); _q.setFromEuler(_e); _m4.compose(_v3.set(p.p[0], p.p[1], p.p[2]), _q, _s3.set(p.s[0], p.s[1], p.s[2])); _nm.getNormalMatrix(_m4);
    const c = lin(p.c || '#FFFFFF', p.wall || false), pa = p.ao === undefined ? 1 : p.ao;
    // kaca 2 nada (bagian nyala berbentuk box): muka +z BoxGeometry non-indexed = verteks 24–29; 24–26 (segitiga kiri-atas) warna c, sisanya c2 → belahan diagonal tanpa segitiga tambahan
    const c2 = isGlow && p.g === 'box' ? lin(p.c2 || (p.c === KACA[0] ? KACA[1] : p.c || '#FFFFFF')) : c;
    for (let k = 0; k < n; k++){
      _t.set(gp[k*3], gp[k*3+1], gp[k*3+2]).applyMatrix4(_m4); _n.set(gn[k*3], gn[k*3+1], gn[k*3+2]).applyMatrix3(_nm).normalize();
      const i3 = (o + k) * 3; pos[i3] = _t.x; pos[i3+1] = _t.y; pos[i3+2] = _t.z; nor[i3] = _n.x; nor[i3+1] = _n.y; nor[i3+2] = _n.z;
      const f = ao && !isGlow ? (_n.y > .5 ? 1 : .60 + .40 * clamp(_t.y / 1.8, 0, 1)) * (_n.y < -.5 ? .55 : 1) * pa : 1;
      const cc = c2 !== c && (k < 24 || k > 26) ? c2 : c;
      col[i3] = cc.r * f; col[i3+1] = cc.g * f; col[i3+2] = cc.b * f; flag[o + k] = isGlow ? 2 : 0;
    }
    if (!isGlow && q.hull){
      const I = baseInfo(g), np = I.reps.length; if (_mit.length < np * 3) _mit = new Float32Array(np * 6);
      for (let u = 0; u < np; u++){ const r = I.reps[u]; let dx = 0, dy = 0, dz = 0;
        for (const v of r){ const i3 = (o + v) * 3; dx += nor[i3]; dy += nor[i3+1]; dz += nor[i3+2]; }
        let l = Math.hypot(dx, dy, dz); if (l < 1e-6){ const i3 = (o + r[0]) * 3; dx = nor[i3]; dy = nor[i3+1]; dz = nor[i3+2]; l = 1; }
        dx /= l; dy /= l; dz /= l; let mn = 1; for (const v of r){ const i3 = (o + v) * 3; mn = Math.min(mn, dx * nor[i3] + dy * nor[i3+1] + dz * nor[i3+2]); }
        const a = inkW / Math.max(mn, .5); _mit[u*3] = dx * a; _mit[u*3+1] = dy * a; _mit[u*3+2] = dz * a; }
      const ir = c.r * mul + INK_ADD[0], ig = c.g * mul + INK_ADD[1], ib = c.b * mul + INK_ADD[2];
      for (let k = 0; k < n; k++){ const u = I.pid[k] * 3, i3 = (o + k) * 3; for (let a = 0; a < 3; a++) onr[i3 + a] = Math.round(clamp(_mit[u + a], -1, 1) * 127); }
      if (copies) for (let t = 0; t < n; t += 3) for (let qq = 0; qq < 3; qq++){ const s3 = (o + t + (qq === 1 ? 2 : qq === 2 ? 1 : 0)) * 3, d = H0 + o + t + qq, d3 = d * 3;
        for (let a = 0; a < 3; a++){ pos[d3 + a] = pos[s3 + a]; nor[d3 + a] = nor[s3 + a]; onr[d3 + a] = onr[s3 + a]; }
        col[d3] = ir; col[d3+1] = ig; col[d3+2] = ib; flag[d] = 1; }
    }
    if (occ){ const so = p.g === 'custom' ? null : solidOf(p.g);
      if (so){ const inv = _m4.clone().invert(), mg = [.004 / Math.max(p.s[0], 1e-4), .004 / Math.max(p.s[1], 1e-4), .004 / Math.max(p.s[2], 1e-4)];
        const bb = new THREE.Box3(); for (const cx of [-.5, .5]) for (const cy of [-.5, .5]) for (const cz of [-.5, .5]) bb.expandByPoint(_t.set(cx, cy, cz).applyMatrix4(_m4));
        occ.push({ id: occ.length, so, inv, mg, bb }); } else occ.push(null);
      if (!isGlow && !q.noEdge){ const ue = p.g === 'custom' ? p.edges : baseEdges(p.g);
        // warna garis = tinta warna yang LEBIH GELAP antara primitif dan dinding model (opt.edgeHost): kusen/lis terang di dinding gelap tetap bergaris gelap di dua sisi
        const ce = eHost && LUM(eHost) < LUM(c) ? eHost : c;
        // sisi "tepi luar" (LOD garis, c2c setEdgeLevel): primitif berkulit (kelas A) yang cukup besar — dinding, atap, plint, parapet
        const outer = q.hull && Math.max(p.s[0], p.s[1], p.s[2]) >= EDGE_OUTER_MIN ? 1 : 0;
        if (ue && ue.length){ const drop = p.attach ? ATTACH_DROP[p.attach] : null, er = ce.r * INK_MUL + INK_ADD[0], eg = ce.g * INK_MUL + INK_ADD[1], eb = ce.b * INK_MUL + INK_ADD[2];
          for (let k = 0; k < ue.length; k += 6){
            if (drop && ue[k + drop[0]] === drop[1] && ue[k + 3 + drop[0]] === drop[1]) continue;
            _t.set(ue[k], ue[k+1], ue[k+2]).applyMatrix4(_m4); _n.set(ue[k+3], ue[k+4], ue[k+5]).applyMatrix4(_m4);
            if (_t.y <= .005 && _n.y <= .005) continue;   // sisi di bidang tanah model (kaki dinding, alas kavling) berimpit pelataran → tidak digaris
            pend.push([_t.x, _t.y, _t.z, _n.x, _n.y, _n.z, er, eg, eb, occ.length - 1, outer]); } } }
    }
    o += n;
  };
  for (const list of cls) for (const q of list) put(q, false);
  o = nBody + nH; for (const p of glow) put({ p, hull: false, noEdge: true }, true);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('flag', new THREE.BufferAttribute(flag, 1)); geo.setAttribute('onormal', new THREE.BufferAttribute(onr, 3, true));
  geo.userData = { nA, nAB: nA + nB, nABC: nBody, nHull: nH, edges: null, edgeColor: null };
  if (pend && pend.length){
    // sisi yang titik tengahnya terbenam di primitif padat lain (sisi belakang kusen/papan di dinding, tepi atap di dalam dinding, …) tidak pernah terlihat → dibuang
    const keep = [], m = new THREE.Vector3();
    for (const e of pend){ m.set((e[0] + e[3]) / 2, (e[1] + e[4]) / 2, (e[2] + e[5]) / 2); let hid = false;
      for (const s of occ){ if (!s || s.id === e[9] || !s.bb.containsPoint(m)) continue; _t.copy(m).applyMatrix4(s.inv); if (SOLID_IN[s.so](_t.x, _t.y, _t.z, s.mg)){ hid = true; break; } }
      if (!hid) keep.push(e); }
    keep.sort((a, b) => b[10] - a[10]);   // sisi tepi luar lebih dulu → set "luar" = rentang [0, nEdgeOuter) dari array yang sama
    const ep = new Float32Array(keep.length * 6), ec = new Uint8Array(keep.length * 6);
    keep.forEach((e, k) => { for (let a = 0; a < 6; a++) ep[k*6 + a] = e[a]; for (let a = 0; a < 3; a++) ec[k*6 + a] = ec[k*6 + 3 + a] = Math.round(clamp(e[6 + a], 0, 1) * 255); });
    geo.userData.edges = ep; geo.userData.edgeColor = ec; geo.userData.nEdgeOuter = keep.reduce((s, e) => s + e[10], 0);
  }
  geo.computeBoundingSphere(); return geo;
}
/* Geometri garis lipatan dari userData.edges (di-cache pada geometri): tiap sisi = quad layar 4 titik / 6 indeks (EDGE_MAT di bawah).
   position = ujung sendiri, eo = ujung lain, es = sisi ±1; warna Uint8n per titik. */
function edgeGeoOf(geo){ const u = geo.userData; if (u.edgeGeo !== undefined) return u.edgeGeo; if (!u.edges || !u.edges.length) return (u.edgeGeo = null);
  const e = u.edges, ec = u.edgeColor, ns = e.length / 6, pos = new Float32Array(ns * 12), oth = new Float32Array(ns * 12), side = new Int8Array(ns * 4), col = new Uint8Array(ns * 12);
  const idx = ns * 4 > 65535 ? new Uint32Array(ns * 6) : new Uint16Array(ns * 6);
  for (let s = 0; s < ns; s++){ const a = s * 6, v = s * 4;
    for (let k = 0; k < 4; k++){ const own = k < 2 ? a : a + 3, ot = k < 2 ? a + 3 : a, d = (v + k) * 3;
      for (let c = 0; c < 3; c++){ pos[d + c] = e[own + c]; oth[d + c] = e[ot + c]; col[d + c] = ec[a + c]; } side[v + k] = k % 2 ? -1 : 1; }
    idx[s*6] = v; idx[s*6+1] = v + 3; idx[s*6+2] = v + 2; idx[s*6+3] = v; idx[s*6+4] = v + 2; idx[s*6+5] = v + 1; }   // A+ B− B+ / A+ B+ A− (B± = sisi berlawanan di layar)
  const g = new THREE.BufferGeometry(); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('eo', new THREE.BufferAttribute(oth, 3));
  g.setAttribute('es', new THREE.BufferAttribute(side, 1)); g.setAttribute('color', new THREE.BufferAttribute(col, 3, true)); g.computeBoundingSphere();
  // set "tepi luar" (LOD garis): geometri kedua berbagi atribut & indeks, drawRange = sisi [0, nEdgeOuter) (merge mengurutkan sisi luar lebih dulu)
  const no = u.nEdgeOuter || 0; if (no > 0){ const go = new THREE.BufferGeometry(); go.setIndex(g.index); for (const k in g.attributes) go.setAttribute(k, g.attributes[k]);
    go.setDrawRange(0, no * 6); go.boundingSphere = g.boundingSphere.clone(); u.edgeGeoOuter = go; } else u.edgeGeoOuter = null;
  return (u.edgeGeo = g); }
/* Gaya "ilustrasi tinta" (spek-gaya §2.2): toon 2 tingkat [160,255] → muka membelakangi matahari 0,627, muka menghadap 1,0 (permukaan datar tidak pernah melompat).
   Kontras utama datang dari BAYANGAN JATUH: cahaya langsung tidak lagi dinolkan shadow map; seluruh cahaya permukaan dalam bayangan dikali lantai
   uFloorG (permukaan datar, normal y > .5) / uFloorW (dinding), diberi rona uShTint (bayangan sedikit biru, dihitung applyTime). */
const TOON_GRAD = (() => { const t = new THREE.DataTexture(new Uint8Array([160, 255]), 2, 1, THREE.LuminanceFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.unpackAlignment = 1; t.needsUpdate = true; return t; })();
/* Lantai bayangan jatuh (linear). uFloorG spek .27 → rumput terang/bayangan sRGB .545; .25 → ≈ .53 (kriteria .50–.60) dan paving/trotoar dalam bayangan
   turun dari V .40–.43 ke < .40 (cadangan kriteria piksel V<0,4 ≥ 10 % di ink-dekat). uFloorW spek .62 → bayangan jatuh di dinding sRGB .84 (kriteria tugas
   .55–.65 pada dinding yang sama) → .30 (≈ .60). */
const FLOOR_U = { uFloorG: { value: .25 }, uFloorW: { value: .30 }, uShTint: { value: new THREE.Color(1, 1, 1) } };
const LIGHTS_FLOOR = THREE.ShaderChunk.lights_fragment_begin.replace('directLight.color *= all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( directionalShadowMap[ i ]', 'shK = all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( directionalShadowMap[ i ]');
if (LIGHTS_FLOOR === THREE.ShaderChunk.lights_fragment_begin) console.warn('lantai bayangan: pola lights_fragment_begin tidak ditemukan (versi three berubah?)');
const FLOOR_APPLY = `#if NUM_DIR_LIGHTS > 0
	if ( dot( normal, directionalLights[ 0 ].direction ) < 0.0 ) shK = 1.0;   // muka membelakangi matahari sudah 0,627 oleh toon; shadow map (sisi belakang + normalBias) jangan menumpuk bayangan jatuh
#endif
	outgoingLight *= mix( ( vNy > 0.5 ? uFloorG : uFloorW ) * uShTint, vec3( 1.0 ), shK );
	gl_FragColor = vec4( outgoingLight, diffuseColor.a );`;
function floorPatch(sh){
  Object.assign(sh.uniforms, FLOOR_U);
  sh.vertexShader = 'varying float vNy;\n' + sh.vertexShader.replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n\tvNy = objectNormal.y;');   // chunk/props/NPC hanya berotasi sumbu Y → normal objek y = normal dunia y
  sh.fragmentShader = 'varying float vNy;\nfloat shK = 1.0;\nuniform float uFloorG, uFloorW;\nuniform vec3 uShTint;\n' + sh.fragmentShader
    .replace('#include <lights_fragment_begin>', LIGHTS_FLOOR)
    .replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );', FLOOR_APPLY);
}
const toonMat = (opts) => { const m = new THREE.MeshToonMaterial(Object.assign({ gradientMap: TOON_GRAD }, opts || {})); m.onBeforeCompile = floorPatch; return m; };
const GLOW_W = { value: 0 };   // malam: warna kaca ditarik ke putih sebelum dikali nyala hangat (jendela menyala rata, tidak hijau-zaitun)
// geser titik kulit (flag 1 di geometri gabungan; semua titik pada INKMAT terpisah) sepanjang onormal sejauh th px CSS konstan (spek §2.5)
const INK_VERT = (gate) => `#include <begin_vertex>
	${gate ? 'if ( flag > 0.5 && flag < 1.5 ) {' : '{'}
	#ifdef USE_INSTANCING
		mat4 inkM = modelMatrix * instanceMatrix;
	#else
		mat4 inkM = modelMatrix;
	#endif
		float inkS = length( inkM[ 0 ].xyz );                      // skala objek (abaikan skala y non-uniform saat 'bangun')
		vec4 inkP = viewMatrix * inkM * vec4( transformed, 1.0 );
		transformed += onormal * ( ${ONS.toFixed(1)}${gate ? ' * uInkB' : ''} * clamp( -inkP.z * uK, uMin, uMax ) / inkS );
	}`;
// inkB: pengali tebal kulit per MATERI (uniform uInkB, bukan bersama): 1 = apa adanya; VMAT_FAR / PREVIEW_MAT = BLD_INK_W_FAR / BLD_INK_W (bangunan tanpa garis lipatan)
function inkify(m, inkB){
  const base = m.onBeforeCompile, UB = { value: inkB == null ? 1 : inkB }; m.userData.uInkB = UB;
  m.onBeforeCompile = sh => { base.call(m, sh); Object.assign(sh.uniforms, INK_U); sh.uniforms.uGlow = GLOW_U; sh.uniforms.uGlowW = GLOW_W; sh.uniforms.uInkB = UB;
    sh.vertexShader = 'attribute float flag;\nattribute vec3 onormal;\nuniform float uK, uMin, uMax, uInkB;\nvarying float vFlag;\n' + sh.vertexShader.replace('#include <begin_vertex>', INK_VERT(true) + '\n\tvFlag = flag;');
    // kulit tinta: warna titik kulit = warna tinta linear (merge; × instanceColor/diffuse); materi tanpa warna verteks: diffuse × ,14 + hangat.
    // Nyala & tinta: linear → sRGB, tanpa tone mapping, tetap ikut kabut
    sh.fragmentShader = 'varying float vFlag;\nuniform vec3 uGlow;\nuniform float uGlowW;\n' + sh.fragmentShader
      .replace('#include <fog_fragment>', `#ifdef USE_COLOR
	vec3 flatC = vColor.rgb; vec3 inkC = diffuseColor.rgb;
#else
	vec3 flatC = vec3( 1.0 ); vec3 inkC = diffuseColor.rgb * ${INK_MUL.toFixed(2)} + vec3( ${INK_ADD.join(', ')} );
#endif
	if ( vFlag > 1.5 ) gl_FragColor = linearToOutputTexel( vec4( mix( flatC, vec3( 1.0 ), uGlowW ) * uGlow, diffuseColor.a ) );
	else if ( vFlag > 0.5 ) gl_FragColor = linearToOutputTexel( vec4( inkC, diffuseColor.a ) );
#include <fog_fragment>`)
      .replace('#include <tonemapping_fragment>', '#if defined( TONE_MAPPING )\n if (vFlag < 0.5) gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );\n#endif'); };
  m.customProgramCacheKey = () => 'ink+lantai'; return m;
}
const VMAT = inkify(toonMat({ vertexColors: true }));
const VMAT_I = inkify(toonMat({ vertexColors: true })); // khusus InstancedMesh (r128 tidak boleh berbagi material dengan Mesh biasa)
const VMAT_FAR = inkify(toonMat({ vertexColors: true }), BLD_INK_W_FAR / BLD_INK_W);   // badan bangunan yang garis lipatannya disembunyikan (c2c setEdgeNear)
/* Kulit terpisah (spek §2.5 inkMat): BackSide pada region A geometri yang sama (drawRange [0, nA), onormal sudah ada di titik A; merge copies:false).
   Warna = diffuse × warna verteks × mul + hangat. Dipakai awan (c2b) dan disiapkan untuk kulit per chunk (tahap 5). */
function inkMat(mul, uMax){ const m = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, toneMapped: false, fog: true });
  const U = { uK: INK_U.uK, uMin: INK_U.uMin, uMax: uMax == null ? INK_U.uMax : { value: uMax } };
  m.onBeforeCompile = sh => { Object.assign(sh.uniforms, U);
    sh.vertexShader = 'attribute vec3 onormal;\nuniform float uK, uMin, uMax;\n' + sh.vertexShader.replace('#include <begin_vertex>', INK_VERT(false));
    sh.fragmentShader = sh.fragmentShader.replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );', `gl_FragColor = vec4( diffuseColor.rgb * ${mul.toFixed(2)} + vec3( ${INK_ADD.join(', ')} ), 1.0 );`); };
  m.customProgramCacheKey = () => 'tinta|' + mul + '|' + uMax; return m; }
const INKMAT = inkMat(INK_MUL), INKMAT_I = inkMat(INK_MUL), INKMAT_SOFT = inkMat(INK_MUL_SOFT, .15);   // SOFT: pohon, awan, gunung (uMax ,15)
/* Lipatan interior (spek §2.6): vertexColors, opacity 1, renderOrder 1 — digambar sebagai QUAD LAYAR selebar EDGE_LW px CSS, bukan GL_LINES.
   Alasan: garis GL selalu 1 px perangkat (0,67 px CSS pada dpr 1,5; ≈ 1,0 px pada dpr 1) → garis kusen terukur 0,81–0,99 px di dist 22–110,
   di bawah kriteria tahap 2 (1,0–1,6 px). Spek §2.6 menyediakan opsi cadangan untuk kegagalan ini: LineSegments2/LineMaterial r128 linewidth 1,3
   (+2 segitiga/sisi). Tekniknya sama (quad 2 segitiga yang dilebarkan di layar, ujung di belakang kamera dipotong ke bidang dekat), ditulis sendiri
   (± 1 KB) agar tetap 1 draw call per bangunan dengan atribut warna Uint8, kabut, dan bias kedalaman di bawah, tanpa bundel 28 KB.
   Ujung diperpanjang ½ lebar → sudut kotak bersambung rapat. Lebar tidak bergantung devicePixelRatio (px CSS, uRes = ukuran kanvas CSS diisi applyCam).
   Spek memakai polygonOffset (factor 1, units 1) di VMAT; di sini DIGANTI bias kedalaman di garis: posisi pandang garis ditarik ke kamera sebesar
   uEB × jaraknya (layar tidak berubah). Alasan: polygonOffset faktor 1 pada muka datar di elevasi 41° menggeser badan ≈ 1 px kedalaman (≈ ,10 u di
   dist 110) → alas kavling (,06 di atas pelataran) kalah z dari pelataran. Sisi tersembunyi di dalam benda padat lain sudah dibuang di merge(). */
const EDGE_LW = 1.3;   // px CSS (spek §2.6 opsi cadangan: linewidth 1,3)
const EDGE_U = { uEB: { value: 6e-4 }, uLW: { value: EDGE_LW }, uRes: { value: new THREE.Vector2(1280, 800) } };
const EDGE_MAT = (() => { const m = new THREE.MeshBasicMaterial({ vertexColors: true, fog: true, toneMapped: false, side: THREE.DoubleSide });
  m.onBeforeCompile = sh => { Object.assign(sh.uniforms, EDGE_U);
    sh.vertexShader = 'attribute vec3 eo;\nattribute float es;\nuniform float uEB, uLW;\nuniform vec2 uRes;\n' + sh.vertexShader.replace('#include <project_vertex>', `vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );
	vec4 eB = modelViewMatrix * vec4( eo, 1.0 );
	float eNear = - 0.5 * projectionMatrix[ 3 ][ 2 ] / projectionMatrix[ 2 ][ 2 ];   // z bidang dekat (perspektif)
	if ( mvPosition.z > eNear && eB.z < eNear ) mvPosition.xyz = mix( eB.xyz, mvPosition.xyz, ( eNear - eB.z ) / ( mvPosition.z - eB.z ) );
	else if ( eB.z > eNear && mvPosition.z < eNear ) eB.xyz = mix( mvPosition.xyz, eB.xyz, ( eNear - mvPosition.z ) / ( eB.z - mvPosition.z ) );
	vec4 cA = projectionMatrix * vec4( mvPosition.xyz * ( 1.0 - uEB ), 1.0 );
	vec4 cB = projectionMatrix * vec4( eB.xyz * ( 1.0 - uEB ), 1.0 );
	vec2 eD = ( cB.xy / cB.w - cA.xy / cA.w ) * uRes; float eL = length( eD );
	vec2 eDir = eL > 1e-5 ? eD / eL : vec2( 1.0, 0.0 );
	gl_Position = cA;
	gl_Position.xy += ( vec2( - eDir.y, eDir.x ) * es - eDir ) * ( uLW / uRes ) * cA.w;`); };
  m.customProgramCacheKey = () => 'garis-quad'; return m; })();
const noRay = o => { o.raycast = () => {}; return o; };   // quad garis tidak ikut raycast (pilih bangunan / uji tertutup)
/* Pass bayangan TANPA kulit tinta: kulit (flag 1, segitiga terbalik) ikut ter-render ke shadow map sebagai muka terdekat ke matahari
   dan membayangi dinding sendiri (belang "acne" vertikal). Semua pelempar bayangan dari merge() memakai materi kedalaman ini (Mesh / InstancedMesh). */
const mkDepthNoInk = () => { const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  // segitiga kulit dibuang di verteks (semua titik di luar volume klip) — tanpa discard di fragmen supaya early-z tetap jalan
  m.onBeforeCompile = sh => { sh.vertexShader = 'attribute float flag;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n if ( flag > 0.5 && flag < 1.5 ) gl_Position = vec4( 2.0, 2.0, 2.0, 1.0 );'); };
  m.customProgramCacheKey = () => 'depth-tanpa-tinta'; return m; };
const DEPTH_NOINK = mkDepthNoInk(), DEPTH_NOINK_I = mkDepthNoInk();   // r128: materi Mesh & InstancedMesh dipisah
const noInkShadow = o => { if (o && o.geometry && o.geometry.attributes.flag) o.customDepthMaterial = o.isInstancedMesh ? DEPTH_NOINK_I : DEPTH_NOINK; return o; };
// kompatibilitas API lama: kulit tinta kini bagian geometri, fungsi ini tidak membuat mesh tambahan (hanya memasang materi bayangan tanpa kulit)
function withInk(mesh){ return noInkShadow(mesh); }
function inkInstanced(m){ noInkShadow(m); return null; }
function syncInk(){}
/* Desaturasi genteng: spek §2.1 8 % → atap merah jam 15 terukur S .646–.673 (kriteria .55–.65, matahari sore hangat menambah S); 20 % (= dinding) → .593–.618.
   .16 → S ≈ .61–.64 (penyimpangan terkecil dari spek yang tetap di dalam kriteria). */
const GENTENG_DESAT = .16;
const GEO_CACHE = new Map();
/* modelGeo(type, color, wall, lw, lh, floors, zone, roofC, adj, seed): sisi +z model = muka jalan, pusat kavling di titik asal.
   Tapak spek-gaya §4.3 (T 8): fx = lw·T − ,8, fz = lh·T − ,8 (7,2 / 15,2 / 31,2), model berpusat di kavling (kerangka setback F tetap dikirim untuk model yang memakainya).
   adj = {l, r} tetangga deret di sumbu x model (c2c adjOf) → ctx.adj: tapak sisi itu sampai batas kavling (celah 0), atap tanpa overhang di sisi itu.
   Argumen ke-9 model: ctx = { adj, lw, lh, floors, zone, seed } (rencana §2).
   seed (parameter TERAKHIR, bawaan 0 → pemanggil lama tetap jalan): varian deterministik 0..3 = hashStr(String(b.id)) & 3 (c2c seedOf), masuk kunci cache. */
function modelGeo(type, color, wall, lw, lh, floors, zone, roofC, adj, seed, noCache){   // noCache: tahap 5 (c2cz) — geometri sekali pakai, tidak disimpan, tanpa quad garis
  const ct = catOf(type); lw = lw || ct.w; lh = lh || ct.h; floors = floors || 1; zone = zone || 'KAMPUNG'; adj = { l: adj && adj.l ? 1 : 0, r: adj && adj.r ? 1 : 0 }; seed = (seed | 0) & 3;
  // palet v2: warna pemilik → AKSEN; dinding & genteng hanya dari WALLS/GENTENG (nilai lama dari pemanggil lama dipetakan ke indeks 0)
  color = aksenOf(color || COLORS[0]); wall = WALLS.includes(wall) ? wall : WALLS[0]; roofC = GENTENG.includes(roofC) ? roofC : GENTENG[0];
  const key = [type, color, wall, roofC, lw, lh, floors, zone, adj.l, adj.r, seed].join('|'); let g = noCache ? null : GEO_CACHE.get(key); if (g) return g;
  const sb = setbackOf(type, zone), F = frame(lw, lh, sb); P = []; G = [];
  box(lw * T - .1, .06, lh * T - .1, 0, 0, 0, ZONE_BASE[zone] || '#D9CDB5');   // alas kavling: paving/beton (KAMPUNG/RUKO/CBD) atau rumput (KOTA/DESA)
  const n0 = P.length; ct.m(lw * T - .8, lh * T - .8, color, wall, F, floors, zone, roofC, { adj, lw, lh, floors, zone, seed });
  for (let k = n0; k < P.length; k++){ if (P[k].c === wall) P[k].wall = true; else if (GENTENG.includes(P[k].c)) P[k].wall = GENTENG_DESAT; }   // dinding 20 % (spek §2.1); genteng lihat GENTENG_DESAT
  const body = merge(P, true, { glow: G, edges: true, inkW: BLD_INK_W, edgeHost: lin(wall, true) });   // + sisi interior (quad garis per bangunan di makeVisual; per chunk di tahap 5)
  if (noCache) return { body, glow: null, edges: null, edgesOuter: null };
  const edges = edgeGeoOf(body);
  g = { body, glow: null, edges, edgesOuter: edges ? body.userData.edgeGeoOuter : null }; GEO_CACHE.set(key, g); return g;
}

/* ---------- langit + siklus siang-malam (jam WIB nyata) ---------- */
const sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top:{value:new THREE.Color()}, hor:{value:new THREE.Color()}, bot:{value:new THREE.Color()}, sunDir:{value:new THREE.Vector3(0,1,0)}, sunCol:{value:new THREE.Color()}, stars:{value:0} },
  vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform vec3 top; uniform vec3 hor; uniform vec3 bot; uniform vec3 sunDir; uniform vec3 sunCol; uniform float stars; varying vec3 vP;
    void main(){ vec3 d = normalize(vP); float h = d.y;
      vec3 c = h > 0.0 ? mix(hor, top, pow(clamp(h,0.0,1.0), 0.5)) : mix(hor, bot, clamp(-h*6.0,0.0,1.0));
      float s = max(dot(d, normalize(sunDir)), 0.0); c += sunCol * (pow(s, 900.0) * 1.4 + pow(s, 10.0) * 0.12);
      if (stars > 0.01 && h > 0.02){ vec3 q = floor(d * 220.0); float r = fract(sin(dot(q, vec3(12.9898,78.233,37.719))) * 43758.5453); c += vec3(step(0.9972, r)) * stars * smoothstep(0.02, 0.3, h); }
      gl_FragColor = vec4(c, 1.0); }`
}));
sky.renderOrder = -1; scene.add(sky);
// kunci waktu: jam, langit atas, cakrawala, warna & kuat matahari, kuat cahaya langit, nyala jendela, bintang
const SKYKEYS = [   // spek-gaya §2.3 (langit siang S ≤ .16; .25 hanya fajar/senja). Kuat cahaya MALAM (0/4.6/19/24) dinaikkan dari .10–.15/.30–.32:
                   // jam 20 + hemi spek #4A5470 terukur: sun .24/hemi .62 → V rata .27–.28, .18/.50 → .24–.25 (nilai spek lebih gelap lagi); .34–.36/.76–.78 → .31–.33 (kriteria .30–.40)
                   // Integrasi r1: kota berisi (k11 dimuat) jam 20 = .286, desa .289 (< .30) → ×1,32 (.45/1,0 …). Terukur ×1,12: desa .300 / kampung .297 (test/ri1/t1 N1);
                   // ×1,25: desa .317, kampung .313, adegan padat .299 (test/ri1/c1); ×1,32: .307–.350, padat .307 (test/ri1/t4 W80N).
                   // Siang (integrasi r1, adegan acuan = distrik terlihat dimuat): kunci 12 spek (#FBF0DA .62/.78) → kavling kosong jam 12 V .662–.672 (> .66) dan
                   // jalan/arteri S .173/.176 (< .20; cahaya total 12:00 netral sehingga paving krem S ≈ hex). Matahari 12 dihangatkan #F6E2C2 + .62/.76:
                   // luminansi −6,6 %, paving S +.02 (test/ri1/t1 L1: atas-12 .670 → .655, sudut .672 → .657, jalan S .173 → .191); .61/.75 menambah ruang ke .66.
                   // Kunci 16.3 .60/.74 → .668/.818: jam 15 = 70 % kunci 16.3; kampung berisi jam 15 .569 → .576 dengan .64/.79 (t1 L1), .583 dengan .67/.82 (test/ri1/c1).
                   // Batas atas: ink-dekat jam 15 (kavling kosong, 1280×800) .662 dengan .67/.82 → .668/.818 + kavling PAVING[5] (c2b LOTC). Rentang .58–.66 hampir habis:
                   // selisih bingkai berisi vs kosong ±.08 datang dari komposisi (dinding/atap gelap vs paving terang), bukan dari cahaya (uFloorG/W, toon, hemi bawah ±.002, test/ri1/t5).
                   // Lantai bayangan uFloorW .30 → .36/.45 hanya +.001–.002 V (test/ri1/t2) → FLOOR_U tetap.
  [0,   '#141B2E','#2B3447','#8C9BC2', .45,1.0, 1, 1],
  [4.6, '#1A2238','#343D52','#8C9BC2', .45,1.03,1,.9],
  [5.6, '#737E99','#C9A9A0','#E8B48C', .40,.55,.7,.2],
  [7,   '#A4B5C4','#D9D8CC','#F3E3C4', .58,.70, 0, 0],
  [12,  '#AFBCC9','#D9D8CC','#F6E2C2', .61,.75, 0, 0],
  [16.3,'#B3B9C3','#DCD3C4','#F2D5AE', .668,.818, 0, 0],
  [17.8,'#8F94BE','#CDA7A4','#E59A78', .45,.55,.45,0],
  [19,  '#2F3552','#5C5468','#8C96B8', .48,1.03,1,.6],
  [24,  '#141B2E','#2B3447','#8C9BC2', .45,1.0, 1, 1],
];
/* Rona bayangan jatuh (linear, RELATIF terhadap sisi terang permukaan yang sama): R/G, B/G. Diukur di aspal netral & sebagai rasio bayangan÷terang
   (bukan absolut di paving hangat): sRGB R/G ≈ 1,0, B/G ≈ 1,10. Konstan sepanjang hari (spek §2.2 tidak memberi rona; tanpa rona bayangan = warna terang × lantai). */
const SH_TINT = [.98, 1.18];
FLOOR_U.uShTint.value.setRGB(SH_TINT[0], 1, SH_TINT[1]);
const HEMI_NIGHT = ['#4A5470', '#1E2A3A'];   // hemi malam (spek §2.3): langit, tanah
const _ca = new THREE.Color(), _cb = new THREE.Color();
const mixHex = (a, b, t, out) => out.set(a).lerp(_cb.set(b), t);
let nightGlow = 0, lastSkyH = -1;
function applyTime(force){
  const h = wibHours(); if (!force && Math.abs(h - lastSkyH) < .01) return; lastSkyH = h;
  let k = 0; while (k < SKYKEYS.length - 2 && h >= SKYKEYS[k+1][0]) k++;
  const A = SKYKEYS[k], B = SKYKEYS[k+1], t = clamp((h - A[0]) / (B[0] - A[0]), 0, 1);
  const U = sky.material.uniforms;
  mixHex(A[1], B[1], t, U.top.value); mixHex(A[2], B[2], t, U.hor.value); U.bot.value.copy(U.hor.value).multiplyScalar(.9);
  mixHex(A[3], B[3], t, U.sunCol.value); U.stars.value = lerp(A[7], B[7], t) * .8;   // bintang ≤ 0,8 → malam tanpa piksel V > 0,9
  // r128 mencampur kabut SETELAH encoding sRGB (fog_fragment sesudah encodings_fragment) → warna kabut ditulis dalam ruang sRGB, sama dengan langit
  scene.fog.color.copy(U.hor.value).lerp(_cb.set('#8A98A5'), .45);
  const sunI = lerp(A[4], B[4], t), hemiI = lerp(A[5], B[5], t); nightGlow = lerp(A[6], B[6], t);
  const ph = (h - 6) / 12 * Math.PI, day = h > 5.4 && h < 18.8;
  const dir = day ? _v3.set(Math.cos(ph), Math.max(.40, Math.sin(ph)), .38).normalize() : _v3.set(.35, .75, .45).normalize();   // pagi dari timur (+x), elevasi min 23,6°
  U.sunDir.value.copy(dir);
  sun.color.copy(U.sunCol.value).convertSRGBToLinear(); sun.intensity = sunI;
  sun.userData.dir = dir.clone();
  hemi.intensity = hemiI;
  hemi.color.copy(_ca.set('#C9D6E2').lerp(_cb.set(HEMI_NIGHT[0]), nightGlow)).convertSRGBToLinear();
  hemi.groundColor.copy(_ca.set('#6E6A58').lerp(_cb.set(HEMI_NIGHT[1]), nightGlow)).convertSRGBToLinear();
  // kaca siang = 2 nada × #8E9AA6; malam = nyala #F2CF8A ×0,80 (maks sRGB ≈ 219). Integrasi r1: ×0,85 (226) + pendar lampu jalan di depan etalase → 286 px V > ,9
  // di adegan padat jam 20; ×0,80 + pusat pendar ,7 (c2b glowTex) → 177 px (test/ri1/t4), semua preset scene_view 0 px.
  GLOWMAT.color.copy(_ca.set('#8E9AA6').convertSRGBToLinear().lerp(_cb.set(LAMPU).convertSRGBToLinear().multiplyScalar(.80), nightGlow)); GLOW_W.value = .65 * nightGlow;
  // kepala lampu malam LAMPU ×,55 (sRGB R ≈ ,72) + pendar aditif ×,32: kepala ×,80 + pendar ×,38 → 31 px V > ,9 di arteri-20 (pendar menumpuk di atas kepala,
  // +,07–,14); ×,55/,32 → 0 px (test/ri1/t1 N1)
  LAMP_HEAD.color.copy(_ca.set('#8E8F94').convertSRGBToLinear().lerp(_cb.set(LAMPU).convertSRGBToLinear().multiplyScalar(.55), nightGlow));
  lampGlow.material.opacity = nightGlow * .32; lampGlow.visible = nightGlow > .05;   // pendar aditif: tumpang-tindih tidak boleh melewati V .9
  CLOUD_MAT.color.copy(_ca.set('#EDE9E0').lerp(_cb.set('#5B6A8F'), clamp(nightGlow * 1.2, 0, 1))).convertSRGBToLinear();
  CLOUD_INK.color.copy(CLOUD_MAT.color);   // tinta awan = warna awan × ,20 (malam ikut gelap)
  renderer.toneMappingExposure = EXPO - nightGlow * .08;
  renderHudClock();
}

