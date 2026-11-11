/* ---------- tahap 5: gabung bangunan per chunk (BCH) + LOD ----------
   Bangunan 'jadi' tidak lagi digambar sebagai 2 mesh per bangunan (badan + garis). Geometri badannya (merge() c2a) diubah ke koordinat dunia
   dan disimpan sebagai "paket" ringkas per bangunan; tiap chunk BCH_CELLS×BCH_CELLS petak menggabungkan paketnya menjadi:
     - 1 mesh badan (VMAT / VMAT_FAR) + bayangannya, urutan titik [utama: A, B, kulit, nyala][C: lod 1 (batang tipis)]
       → LOD segitiga: dekat = semua, jauh = drawRange [0, nMain) (detail tipis C dibuang, spek §6 triJauh)
     - 1 mesh garis lipatan (EDGE_MAT), urutan [sisi tepi luar semua bangunan][sisi lainnya]
       → LOD garis: tingkat 2 = semua, 1 = tepi luar saja, 0 = tanpa garis (VMAT_FAR, kulit tebal), aturan sama dengan c2c edgeLevel
   Paket ringkas (±25 B/titik): posisi Float32, normal Int8n, warna Uint16n (linear; Uint8 terlalu kasar untuk tinta gelap), flag Uint8, onormal Int8n.
   Larik gabungan chunk dilepas dari memori JS setelah diunggah ke GPU (onUpload) — sumber kebenaran = paket.
   Bangunan yang sedang dibangun / sketsa / disetujui tetap mesh sendiri (animasi skala, crane, transparan).
   Pemilihan (tap): proxy kotak tak terlihat seukuran badan bangunan (Raycaster r128 tidak memeriksa visible).
   Pembangunan ulang chunk dicicil per frame (BCH_SLICE_MS) di bchFlush(), dipanggil dari updateEdgeVis().
   ?chunk=0 mematikan penggabungan (alat uji model_view membaca geometri per bangunan). */
const BCH_ON = new URLSearchParams(location.search).get('chunk') !== '0';
// HP: chunk yang titik terdekatnya > BCH_VIS dari kamera (datar) tidak digambar; kabut HP sedikit lebih rapat (c2a)
const BCH_VIS = MOBILE && QS.get('hemat') !== '0' ? 460 : Infinity;
const BCH_CELLS = 8, BCH_NC = Math.ceil(N / BCH_CELLS), BCH_SLICE_MS = 6;
const BCH = new Map();          // kunci chunk → { items: Map(id → paket), dirty, body, edges, nMain, nEdge, nOuter, x0, x1, z0, z1, lv }
const BCH_DIRTY = new Set();
const BCH_BOX = new THREE.BoxGeometry(1, 1, 1), BCH_PICK_MAT = new THREE.MeshBasicMaterial({ visible: false });
const bchKeyOf = (i, j) => Math.floor(j / BCH_CELLS) * BCH_NC + Math.floor(i / BCH_CELLS);
const _bchRelease = function(){ this.array = null; };   // three r128: larik JS dilepas setelah unggah GPU (count tetap)
// paket dunia dari geometri badan model (ruang model: +z muka jalan) dengan rotasi f·90° di sumbu y lalu geser (tx, ty, tz)
function bchPacket(body, f, tx, ty, tz){
  const u = body.userData, A = body.attributes, n = A.position.count, nAB = u.nAB, nABC = u.nABC;
  const c = [1, 0, -1, 0][f & 3], s = [0, 1, 0, -1][f & 3];   // THREE Ry: x' = c·x + s·z, z' = −s·x + c·z
  const mk = cnt => ({ n: cnt, pos: new Float32Array(cnt * 3), nor: new Int8Array(cnt * 3), col: new Uint16Array(cnt * 3), flag: new Uint8Array(cnt), onr: new Int8Array(cnt * 3) });
  const nC = nABC - nAB, main = mk(n - nC), cc = mk(nC);
  const P = A.position.array, Nr = A.normal.array, C = A.color.array, F = A.flag.array, O = A.onormal.array;
  let im = 0, ic = 0, x0 = 1e9, x1 = -1e9, y1 = 0, z0 = 1e9, z1 = -1e9;
  for (let k = 0; k < n; k++){
    const isC = k >= nAB && k < nABC, d = isC ? cc : main, o = isC ? ic++ : im++, a = k * 3, b = o * 3;
    const x = P[a], y = P[a + 1], z = P[a + 2], wx_ = c * x + s * z + tx, wz_ = -s * x + c * z + tz;
    d.pos[b] = wx_; d.pos[b + 1] = y + ty; d.pos[b + 2] = wz_;
    if (wx_ < x0) x0 = wx_; if (wx_ > x1) x1 = wx_; if (wz_ < z0) z0 = wz_; if (wz_ > z1) z1 = wz_; if (y > y1) y1 = y;
    const nx = Nr[a], ny = Nr[a + 1], nz = Nr[a + 2];
    d.nor[b] = Math.round((c * nx + s * nz) * 127); d.nor[b + 1] = Math.round(ny * 127); d.nor[b + 2] = Math.round((-s * nx + c * nz) * 127);
    d.col[b] = Math.round(clamp(C[a], 0, 1) * 65535); d.col[b + 1] = Math.round(clamp(C[a + 1], 0, 1) * 65535); d.col[b + 2] = Math.round(clamp(C[a + 2], 0, 1) * 65535);
    d.flag[o] = F[k];
    const ox = O[a], oz = O[a + 2]; d.onr[b] = c * ox + s * oz; d.onr[b + 1] = O[a + 1]; d.onr[b + 2] = -s * ox + c * oz;
  }
  let ep = null; const ue = u.edges;
  if (ue && ue.length){ ep = new Float32Array(ue.length);
    for (let k = 0; k < ue.length; k += 3){ const x = ue[k], z = ue[k + 2]; ep[k] = c * x + s * z + tx; ep[k + 1] = ue[k + 1] + ty; ep[k + 2] = -s * x + c * z + tz; } }
  return { main, c: cc, ep, ec: ep ? u.edgeColor : null, nOuter: ep ? (u.nEdgeOuter || 0) : 0, box: [x0, z0, x1, z1, y1 + ty] };
}
function bchGet(key){ let ch = BCH.get(key); if (ch) return ch;
  const ci = key % BCH_NC, cj = Math.floor(key / BCH_NC), half = T / 2;
  ch = { key, items: new Map(), body: null, edges: null, nMain: 0, nAll: 0, nEdge: 0, nOuter: 0, lv: -1,
         x0: wx(ci * BCH_CELLS) - half, x1: wx(Math.min(N, (ci + 1) * BCH_CELLS) - 1) + half, z0: wx(cj * BCH_CELLS) - half, z1: wx(Math.min(N, (cj + 1) * BCH_CELLS) - 1) + half };
  BCH.set(key, ch); return ch; }
function bchAdd(id, key, pk){ const ch = bchGet(key); ch.items.set(id, pk); BCH_DIRTY.add(key); }
function bchRemove(id, key){ const ch = BCH.get(key); if (ch && ch.items.delete(id)) BCH_DIRTY.add(key); }
function bchDispose(ch){
  for (const m of [ch.body, ch.edges]) if (m){ scene.remove(m); m.geometry.dispose(); }
  ch.body = ch.edges = null; }
// susun ulang geometri gabungan satu chunk dari paketnya
function bchBuild(ch){
  bchDispose(ch); ch.lv = -1; if (!ch.items.size){ BCH.delete(ch.key); return; }
  let nm = 0, nc = 0, ne = 0, no = 0, x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9, y1 = 1;
  for (const pk of ch.items.values()){ nm += pk.main.n; nc += pk.c.n; if (pk.ep){ ne += pk.ep.length / 6; no += pk.nOuter; }
    const b = pk.box; if (b[0] < x0) x0 = b[0]; if (b[1] < z0) z0 = b[1]; if (b[2] > x1) x1 = b[2]; if (b[3] > z1) z1 = b[3]; if (b[4] > y1) y1 = b[4]; }
  const tot = nm + nc, pos = new Float32Array(tot * 3), nor = new Int8Array(tot * 3), col = new Uint16Array(tot * 3), flag = new Uint8Array(tot), onr = new Int8Array(tot * 3);
  let o = 0; const put = d => { pos.set(d.pos, o * 3); nor.set(d.nor, o * 3); col.set(d.col, o * 3); flag.set(d.flag, o); onr.set(d.onr, o * 3); o += d.n; };
  for (const pk of ch.items.values()) put(pk.main);
  for (const pk of ch.items.values()) put(pk.c);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).onUpload(_bchRelease)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3, true).onUpload(_bchRelease));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3, true).onUpload(_bchRelease)); g.setAttribute('flag', new THREE.BufferAttribute(flag, 1).onUpload(_bchRelease));
  g.setAttribute('onormal', new THREE.BufferAttribute(onr, 3, true).onUpload(_bchRelease));
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, Y0 + y1 / 2, cz), Math.hypot(x1 - x0, y1 + 2, z1 - z0) / 2 + 2);
  const body = noRay(new THREE.Mesh(g, VMAT)); body.castShadow = true; body.receiveShadow = true; body.matrixAutoUpdate = false; noInkShadow(body);
  scene.add(body); ch.body = body; ch.nMain = nm; ch.nAll = tot;
  // garis lipatan: quad layar per sisi (sama dengan c2a edgeGeoOf), sisi tepi luar semua bangunan lebih dulu
  ch.nEdge = ne; ch.nOuter = no;
  if (ne){ const epos = new Float32Array(ne * 12), oth = new Float32Array(ne * 12), side = new Int8Array(ne * 4), ecol = new Uint8Array(ne * 12), idx = ne * 4 > 65535 ? new Uint32Array(ne * 6) : new Uint16Array(ne * 6);
    let s = 0;
    const quad = (e, ec, a) => { const v = s * 4;
      for (let k = 0; k < 4; k++){ const own = k < 2 ? a : a + 3, ot = k < 2 ? a + 3 : a, d = (v + k) * 3;
        for (let q = 0; q < 3; q++){ epos[d + q] = e[own + q]; oth[d + q] = e[ot + q]; ecol[d + q] = ec[a + q]; } side[v + k] = k % 2 ? -1 : 1; }
      idx[s*6] = v; idx[s*6+1] = v + 3; idx[s*6+2] = v + 2; idx[s*6+3] = v; idx[s*6+4] = v + 2; idx[s*6+5] = v + 1; s++; };
    for (const pk of ch.items.values()) if (pk.ep) for (let k = 0; k < pk.nOuter; k++) quad(pk.ep, pk.ec, k * 6);
    for (const pk of ch.items.values()) if (pk.ep){ const m = pk.ep.length / 6; for (let k = pk.nOuter; k < m; k++) quad(pk.ep, pk.ec, k * 6); }
    const eg = new THREE.BufferGeometry(); eg.setIndex(new THREE.BufferAttribute(idx, 1).onUpload(_bchRelease));
    eg.setAttribute('position', new THREE.BufferAttribute(epos, 3).onUpload(_bchRelease)); eg.setAttribute('eo', new THREE.BufferAttribute(oth, 3).onUpload(_bchRelease));
    eg.setAttribute('es', new THREE.BufferAttribute(side, 1).onUpload(_bchRelease)); eg.setAttribute('color', new THREE.BufferAttribute(ecol, 3, true).onUpload(_bchRelease));
    eg.boundingSphere = g.boundingSphere.clone();
    const em = noRay(new THREE.Mesh(eg, EDGE_MAT)); em.renderOrder = 1; em.matrixAutoUpdate = false; scene.add(em); ch.edges = em; }
  bchApplyLevel(ch, bchLevel(ch));
}
// tingkat LOD chunk = aturan c2c edgeLevel, diukur di titik chunk terdekat ke titik tatap (detail) dan ke kamera (jarak kamera)
function bchLevel(ch){
  const cp = camera.position, px = clamp(cp.x, ch.x0, ch.x1), pz = clamp(cp.z, ch.z0, ch.z1);
  const dc = Math.hypot(cp.x - px, cp.y - Y0, cp.z - pz); if (dc > EDGE_OUTER_CAM) return 0;
  // detail: pusat chunk ≤ EDGE_FAR + BCH_EDGE_PAD dari titik tatap (rata-rata bangunan di chunk ≈ aturan per bangunan c2c; titik terdekat terlalu murah hati:
  // chunk 64 u → radius detail efektif ±165 u, garis 2× lebih banyak), atau titik tatap di dalam chunk
  const qx = (ch.x0 + ch.x1) / 2, qz = (ch.z0 + ch.z1) / 2, inside = cam.tx >= ch.x0 && cam.tx <= ch.x1 && cam.tz >= ch.z0 && cam.tz <= ch.z1;
  return (inside || Math.hypot(qx - cam.tx, qz - cam.tz) < EDGE_FAR + BCH_EDGE_PAD) && dc < _edgeDetailD ? 2 : 1; }
const BCH_EDGE_PAD = 16;
function bchApplyLevel(ch, lv){
  if (!ch.body) return; if (lv === 1 && !ch.nOuter) lv = 0; if (ch.lv === lv) return; ch.lv = lv;
  ch.body.geometry.setDrawRange(0, lv === 2 ? ch.nAll : ch.nMain);
  ch.body.material = lv ? VMAT : VMAT_FAR;
  if (ch.edges){ ch.edges.visible = lv > 0; ch.edges.geometry.setDrawRange(0, (lv === 2 ? ch.nEdge : ch.nOuter) * 6); } }
// dipanggil tiap frame (updateEdgeVis): bangun ulang chunk kotor dalam irisan waktu, lalu perbarui LOD semua chunk
function bchFlush(){
  if (BCH_DIRTY.size){ const t0 = performance.now();
    for (const key of [...BCH_DIRTY]){ BCH_DIRTY.delete(key); const ch = BCH.get(key); if (ch) bchBuild(ch); if (performance.now() - t0 > BCH_SLICE_MS) break; } }
  const cp = camera.position;
  for (const ch of BCH.values()){ bchApplyLevel(ch, bchLevel(ch));
    if (ch.body){ const show = Math.hypot(cp.x - clamp(cp.x, ch.x0, ch.x1), cp.z - clamp(cp.z, ch.z0, ch.z1)) <= BCH_VIS; ch.body.visible = show; if (ch.edges) ch.edges.visible = show && ch.lv > 0; } } }
// alat uji/konsol: ringkasan chunk
function bchStat(){ let tris = 0, trisFar = 0, edges = 0, bytes = 0, items = 0;
  for (const ch of BCH.values()){ items += ch.items.size; tris += ch.nAll / 3; trisFar += ch.nMain / 3; edges += ch.nEdge;
    for (const pk of ch.items.values()){ for (const d of [pk.main, pk.c]) bytes += d.n * 25; if (pk.ep) bytes += pk.ep.byteLength + pk.ec.byteLength; } }
  return { chunks: BCH.size, items, tris: Math.round(tris), trisFar: Math.round(trisFar), edges, paketMB: +(bytes / 1e6).toFixed(1), dirty: BCH_DIRTY.size }; }
