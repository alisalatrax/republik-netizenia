/* ---------- bangunan: visual ---------- */
const vis = new Map(); const pickables = [];
const ghostMat = { sketsa: new THREE.MeshLambertMaterial({ color: lin('#5B8FD6'), transparent: true, opacity: .3, depthWrite: false }),
                   disetujui: new THREE.MeshLambertMaterial({ color: lin('#F2B531'), transparent: true, opacity: .34, depthWrite: false }) };
const edgeMat = { sketsa: new THREE.LineBasicMaterial({ color: lin('#2C5FA8') }), disetujui: new THREE.LineBasicMaterial({ color: lin('#B7860B') }) };
const scafMat = new THREE.LineBasicMaterial({ color: lin('#C2913A') });   // = crane spek §3 (garis tanpa cahaya: #E8833A tetap V .91 di malam hari)
const craneGeo = (() => { P = []; box(.6, 17, .6, 0, 0, 0, '#C2913A'); box(.9, .6, .9, 0, 17, 0, PAL.abuGelap); return merge(P, true); })();
const jibGeo = (() => { P = []; box(12, .5, .5, 3.5, 0, 0, '#C2913A'); box(1.8, 1, 1.4, -2.2, -.3, 0, PAL.abuGelap); box(1.2, 1.2, 1.2, 0, .6, 0, AKSEN[0]); cyl(.05, 5, 8.5, -5.2, 0, PAL.besi); box(.7, .5, .7, 8.5, -5.6, 0, AKSEN[2]); return merge(P, true); })();
const cranes = [];
// warna pemilik (nilai palet server / AKSEN); modelGeo memetakannya ke AKSEN untuk aksen (tenda, papan nama), bukan atap
function ownerColor(b){ if (b.owner_color) return b.owner_color; if (b.owner_kind === 'negara') return PAL.negara; if (b.owner_kind === 'npc') return AKSEN[hashStr(b.id) % AKSEN.length]; return COLORS[hashStr(b.owner_id || b.id) % COLORS.length]; }
/* Dinding: WALLS[hashStr(b.id) % 10]; bila sama dengan tetangga kiri (sumbu -x lokal model, mengikuti facing) → indeks berikutnya.
   CELL_ID = indeks petak → id bangunan yang sedang divisualkan (diisi makeVisual, dibuang dropVisual), jadi tidak bergantung urutan rebuildOcc di c3. */
const CELL_ID = new Map();
const LEFT_DIR = [[-1, 0], [0, 1], [1, 0], [0, -1]];   // arah -x lokal di dunia untuk facing 0..3 (inner.rotation.y = f·π/2)
// tetangga sisi (side −1 = kiri / −x lokal, +1 = kanan / +x lokal), dilihat di petak tengah sisi itu
function sideNeighbor(b, side){ const f = facingOfB(b), dx = -LEFT_DIR[f][0] * side, dz = -LEFT_DIR[f][1] * side;   // LEFT_DIR = arah −x lokal → kiri (side −1) = +LEFT_DIR
  const i = dx < 0 ? b.i - 1 : dx > 0 ? b.i + b.w : b.i + (b.w >> 1), j = dz < 0 ? b.j - 1 : dz > 0 ? b.j + b.h : b.j + (b.h >> 1);
  const id = CELL_ID.get(j * N + i); return id != null && id !== b.id ? S.buildings.get(id) || null : null; }
const leftNeighbor = b => sideNeighbor(b, -1);
/* deret rapat (spek-gaya §4.3): adj = {l, r} = tetangga kiri/kanan (sumbu x model) bertipe deret, stage 'jadi', menghadap arah yang sama
   (syarat hadap sama = tambahan: rumah pojok yang menghadap kolektor tidak disambung ke deret gang). Tapak sisi itu sampai batas kavling (celah 0). */
const ROW_TYPES = new Set(['rumah', 'rumah2', 'toko', 'kos', 'kafe', 'warung', 'bank', 'ruko']);
function adjOf(b){ const o = { l: 0, r: 0 }; if (b.stage !== 'jadi' || !ROW_TYPES.has(b.type)) return o; const f = facingOfB(b);
  for (const [k, side] of [['l', -1], ['r', 1]]){ const nb = sideNeighbor(b, side); if (nb && nb.stage === 'jadi' && ROW_TYPES.has(nb.type) && facingOfB(nb) === f) o[k] = 1; }
  return o; }
function wallIdx(b, depth){ const base = hashStr(b.id) % WALLS.length; if ((depth || 0) > 6) return base;
  const L = leftNeighbor(b); return L && L.stage === 'jadi' && wallIdx(L, (depth || 0) + 1) === base ? (base + 1) % WALLS.length : base; }
const wallOf = b => WALLS[wallIdx(b)];
const gentengOf = b => GENTENG[hashStr('g' + b.id) % GENTENG.length];   // 50 % terakota / 30 % abu-tulis / 10 % zaitun / 10 % cokelat
function centerOf(b){ return [wx(b.i) + (b.w - 1) * T / 2, wx(b.j) + (b.h - 1) * T / 2]; }
function dropVisual(id, keepNeighbors){
  const v = vis.get(id); if (!v) return; scene.remove(v.root); if (v.chunk != null) bchRemove(id, v.chunk);
  { const ob = v.b; for (let a = 0; a < ob.w; a++) for (let c = 0; c < ob.h; c++){ const k = (ob.j + c) * N + ob.i + a; if (CELL_ID.get(k) === id) CELL_ID.delete(k); } }
  v.root.traverse(o => { if (o.userData.own && o.geometry) o.geometry.dispose(); });
  const k = pickables.indexOf(v.pick); if (k >= 0) pickables.splice(k, 1);
  const c = cranes.indexOf(v.jib); if (c >= 0) cranes.splice(c, 1);
  if (v.label) v.label.remove(); vis.delete(id);
  // bangunan benar-benar dihapus (bukan dibangun ulang): tetangga deret kehilangan adj / warna kiri → bangun ulang bila kuncinya berubah
  if (!keepNeighbors) for (const nb of neighborsOf(v.b)){ const nv = vis.get(nb.id); if (nv && nv.key !== visualKey(nb)) makeVisual(nb); }
}
// varian model deterministik 0..3 (spek-gaya §5: bentuk atap, jumlah jendela, posisi pintu, balkon/carport) — sama di semua klien, tidak disimpan server
const seedOf = b => hashStr(String(b.id)) & 3;
function visualKey(b){ const a = adjOf(b); return [b.type, b.stage, b.i, b.j, b.w, b.h, b.facing, b.zone, b.floors, ownerColor(b), wallIdx(b), a.l, a.r, seedOf(b), b.proposal?.yes, b.proposal?.no, b.proposal?.status].join('|'); }
// facing: dari server (b.facing) atau rumus; lw/lh = tapak dalam ruang model; zona/lantai dari server atau rumus lokal
function facingOfB(b){ const ct = catOf(b.type); const f = b.facing ?? facingOf(b.i, b.j, b.w, b.h, ct.w, ct.h); return f == null ? 0 : f; }
function makeVisual(b){
  dropVisual(b.id, true);
  const ct = catOf(b.type), [cx, cz] = centerOf(b), fx = b.w * T - .8, fz = b.h * T - .8;   // tapak §4.3 (sketsa/perancah)
  for (let a = 0; a < b.w; a++) for (let c = 0; c < b.h; c++) CELL_ID.set((b.j + c) * N + b.i + a, b.id);
  const root = new THREE.Group(); root.position.set(cx, Y0, cz); root.userData.id = b.id;
  const v = { root, key: visualKey(b), b };
  if (b.stage === 'sketsa' || b.stage === 'disetujui'){
    const g = new THREE.Mesh(new THREE.BoxGeometry(fx, 5, fz), ghostMat[b.stage]); g.position.y = 2.5; g.userData.own = true; root.add(g);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(fx, 5, fz, 2, 1, 2)), edgeMat[b.stage]); e.position.y = 2.5; e.userData.own = true; root.add(e);
    v.pick = g;
  } else {
    const f = facingOfB(b), lw = f % 2 ? b.h : b.w, lh = f % 2 ? b.w : b.h;
    const zone = b.zone || zoneOfLot(b.i, b.j, b.w, b.h), floors = b.floors || floorsFor(b.type, ringOf(b.i, b.j), lotClass(b.i, b.j, b.w, b.h));
    const inner = new THREE.Group(); inner.rotation.y = f * Math.PI / 2;
    if (BCH_ON && b.stage === 'jadi'){   // tahap 5: badan + garis masuk geometri gabungan chunk (c2cz); di sini hanya proxy kotak untuk pemilihan
      const geo = modelGeo(b.type, ownerColor(b), wallOf(b), lw, lh, floors, zone, gentengOf(b), adjOf(b), seedOf(b), true);
      geo.body.computeBoundingBox(); const bb = geo.body.boundingBox, pk = bchPacket(geo.body, f, cx, Y0, cz); geo.body.dispose();
      const pm = new THREE.Mesh(BCH_BOX, BCH_PICK_MAT); bb.getCenter(pm.position); bb.getSize(pm.scale); pm.scale.max(_s3.set(.1, .1, .1)); inner.add(pm);
      root.add(inner); v.inner = inner; v.pick = pm; v.chunk = bchKeyOf(b.i, b.j); bchAdd(b.id, v.chunk, pk);
    } else {
    const geo = modelGeo(b.type, ownerColor(b), wallOf(b), lw, lh, floors, zone, gentengOf(b), adjOf(b), seedOf(b));
    const body = withInk(new THREE.Mesh(geo.body, VMAT)); body.castShadow = true; body.receiveShadow = true; inner.add(body);
    if (geo.edges){ const e = noRay(new THREE.Mesh(geo.edges, EDGE_MAT)); e.renderOrder = 1; inner.add(e); v.edges = e; v.edgeGeo = [null, geo.edgesOuter, geo.edges]; }   // lipatan interior (spek §2.6; quad garis EDGE_LW px) + set tepi luar (LOD garis)
    root.add(inner); v.inner = inner; v.pick = body; v.body = body; setEdgeLevel(v, edgeLevel(root.position));
    if (b.stage === 'bangun' && progressOf(b) < 1){   // crane/perancah tetap di root (tapak dunia), tidak ikut diputar
      const sc = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(fx * .92, 8, fz * .92, 3, 4, 3)), scafMat); sc.position.y = 4; sc.userData.own = true; root.add(sc); v.scaf = sc;
      const cr = withInk(new THREE.Mesh(craneGeo, VMAT)); cr.position.set(-fx * .46, 0, -fz * .46); cr.castShadow = true; root.add(cr);
      const jib = withInk(new THREE.Mesh(jibGeo, VMAT)); jib.position.set(-fx * .46, 17.5, -fz * .46); jib.rotation.y = hashStr(b.id) % 6; root.add(jib); v.jib = jib; cranes.push(jib);
      v.building = true; applyProgress(v);
    }
    }
  }
  v.pick.userData.id = b.id; pickables.push(v.pick);
  if (b.stage !== 'jadi'){ v.label = document.createElement('div'); v.label.className = 'lbl'; $('#labels').appendChild(v.label); updateLabel(v); }
  scene.add(root); vis.set(b.id, v);
  // tetangga yang "kiri"-nya bangunan ini mungkin kini berwarna dinding sama → bangun ulang bila kuncinya berubah (rantai terbatas oleh deret)
  if (b.stage === 'jadi') for (const nb of neighborsOf(b)){ const nv = vis.get(nb.id); if (nv && nv.key !== visualKey(nb)) makeVisual(nb); }
  return v;
}
/* LOD garis lipatan, dicek tiap frame (renderFrame), O(bangunan). Tingkat: 2 = semua sisi, 1 = sisi tepi luar saja (c2a EDGE_OUTER_MIN), 0 = tanpa garis.
   - Spek §2.6/§8.1: detail (kusen, lis, pagar, …) hanya ≤ EDGE_FAR (120 u) dari titik tatap → di luar itu tingkat 1, bukan 0 (MENYIMPANG dari spek
     "edges.visible = false"): siluet bangunan = kulit BLD_INK_W + garis di tepi siluet; tanpa garis (VMAT_FAR, kulit tebal) kaki sisi tegak bangunan
     jauh yang dilihat hampir frontal kehilangan tinta (kulit tertutup alas/tanah; verifikasi 2.3 jauh-200 median 0,79 px).
   - Detail juga hilang bila 1 m < EDGE_DETAIL_PXM px layar (≈ 240 u pada 800 px / FOV 34): pita rel pagar ,5 m & lis ,12 m tidak menjadi pita hitam
     (verifikasi 2.3: rel pagar dist 300 gelap 75 %).
   - Tingkat 0 (VMAT_FAR) hanya > EDGE_OUTER_CAM dari kamera (bangunan ≤ ±15 px) atau model tanpa sisi tepi luar.
   EDGE_FAR = let: alat uji boleh memaksa semua bangunan 'jauh' (EDGE_FAR = 0). */
let EDGE_FAR = MOBILE ? 80 : 120;   // HP: detail garis lipatan lebih dekat (performa)
const EDGE_DETAIL_PXM = 5.5, EDGE_OUTER_CAM = 600;
let _edgeDetailD = 240;   // jarak kamera maks untuk detail, dari EDGE_DETAIL_PXM & lensa (updateEdgeVis)
function edgeLevel(p){
  const dc = camera.position.distanceTo(p);
  if (dc > EDGE_OUTER_CAM) return 0;
  return (p.x - cam.tx) ** 2 + (p.z - cam.tz) ** 2 < EDGE_FAR * EDGE_FAR && dc < _edgeDetailD ? 2 : 1; }
function setEdgeLevel(v, lv){ const g = v.edges ? v.edgeGeo[lv] || null : null;
  if (v.edges){ v.edges.visible = !!g; if (g && v.edges.geometry !== g) v.edges.geometry = g; }
  const m = g ? VMAT : VMAT_FAR; if (v.body.material !== m) v.body.material = m; }
const setEdgeNear = (v, near) => setEdgeLevel(v, near ? 2 : 0);   // kompatibilitas alat uji lama
function updateEdgeVis(){ if (BCH_ON) bchFlush(); _edgeDetailD = Math.max(1, innerHeight) / (2 * Math.tan(camera.fov * Math.PI / 360) * EDGE_DETAIL_PXM);
  for (const v of vis.values()) if (v.body) setEdgeLevel(v, edgeLevel(v.root.position)); }
function neighborsOf(b){ const ids = new Set();
  for (let a = -1; a <= b.w; a++) for (let c = -1; c <= b.h; c++){ if ((a < 0 || a >= b.w) === (c < 0 || c >= b.h)) continue; const id = CELL_ID.get((b.j + c) * N + b.i + a); if (id != null && id !== b.id) ids.add(id); }
  return [...ids].map(id => S.buildings.get(id)).filter(Boolean); }
function progressOf(b){
  if (b.stage === 'jadi') return 1; if (b.stage !== 'bangun' || !b.started_at) return 0;
  return clamp((now() - Date.parse(b.started_at)) / 3600000 / Math.max(.01, Number(b.build_hours)) + Number(b.boost || 0), 0, 1);
}
function applyProgress(v){ const p = progressOf(v.b); if (v.inner) v.inner.scale.y = .06 + .94 * p; if (p >= 1 && v.building){ v.building = false; const b = v.b; b.stage = 'jadi'; makeVisual(b); celebrate(b); } }
function updateLabel(v){
  const b = v.b, el = v.label; if (!el) return; const mine = S.me && b.owner_id === S.me.id;
  el.classList.toggle('mine', !!mine);
  if (b.stage === 'bangun'){ const p = progressOf(b); el.className = 'lbl' + (mine ? ' mine' : ''); el.innerHTML = `<span>${esc(b.label || catOf(b.type).n)} · ${Math.floor(p * 100)}%</span><span class="bar"><i style="width:${p * 100}%"></i></span>`; }
  else if (b.proposal){ const pr = b.proposal; el.className = 'lbl vote'; const left = Date.parse(pr.ends_at) - now();
    el.innerHTML = `<span>${esc(b.label || catOf(b.type).n)}</span><span class="vb"><span class="y">▲ ${pr.yes}</span><span class="n">▼ ${pr.no}</span><span>${pr.status === 'menunggu_kas' ? 'tunggu kas' : left > 0 ? fmtLeft(left) : 'dihitung'}</span></span>`; }
  else { el.className = 'lbl'; el.innerHTML = `<span>${esc(b.label || catOf(b.type).n)}</span>`; }
}
// kembang api kecil saat bangunan selesai
const sparks = [];
function celebrate(b){ if (LOW) return; const [x, z] = centerOf(b); const geo = new THREE.BufferGeometry(), n = 60, p = new Float32Array(n * 3), vel = [];
  for (let k = 0; k < n; k++){ p[k*3] = x; p[k*3+1] = 8; p[k*3+2] = z; vel.push([(Math.random() - .5) * 18, 10 + Math.random() * 14, (Math.random() - .5) * 18]); }
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: lin(AKSEN[hashStr(b.id) % AKSEN.length]), size: 1.4, toneMapped: false, transparent: true })); scene.add(pts); sparks.push({ pts, vel, t: 0 }); }
function stepSparks(dt){ for (let k = sparks.length - 1; k >= 0; k--){ const s = sparks[k]; s.t += dt; const a = s.pts.geometry.attributes.position; for (let q = 0; q < s.vel.length; q++){ s.vel[q][1] -= 18 * dt; a.array[q*3] += s.vel[q][0] * dt; a.array[q*3+1] += s.vel[q][1] * dt; a.array[q*3+2] += s.vel[q][2] * dt; } a.needsUpdate = true; s.pts.material.opacity = 1 - s.t / 1.8; if (s.t > 1.8){ scene.remove(s.pts); s.pts.geometry.dispose(); s.pts.material.dispose(); sparks.splice(k, 1); } } }

// seleksi & bayangan penempatan
const selMesh = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: lin('#F2B531') })); selMesh.visible = false; scene.add(selMesh);
function showSel(i, j, w, h){ selMesh.visible = true; selMesh.scale.set(w * T - .5, 1.4, h * T - .5); selMesh.position.set(wx(i) + (w - 1) * T / 2, Y0 + .7, wx(j) + (h - 1) * T / 2); }
const placeGhost = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: lin('#2F8F5B'), transparent: true, opacity: .35, depthWrite: false })); placeGhost.visible = false; scene.add(placeGhost);
const PREVIEW_MAT = inkify(toonMat({ vertexColors: true, transparent: true, opacity: .82 }), BLD_INK_W_FAR / BLD_INK_W);   // pratinjau penempatan tanpa garis lipatan → kulit tebal penuh
let placePreview = null;

