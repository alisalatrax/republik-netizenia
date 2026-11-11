/* ---------- warga & kendaraan ---------- */
const WALKERS = LOW ? 50 : MOBILE ? 60 : 140, CARS = LOW ? 8 : MOBILE ? 10 : 16, ANGKOT = LOW ? 3 : MOBILE ? 4 : 6, OJEK = LOW ? 4 : MOBILE ? 6 : 9;
/* Badan manusia 1:6,5 (spek-gaya §4.4), satuan meter: kaki ,70 (engsel pinggul y ,70) · badan ,62 (,70–1,32) · leher ,12 · kepala ,26 → puncak 1,70.
   Bahu ,42 (engsel lengan ±,255, y 1,28; lengan ,62 → ujung jari ≈ ,66). Tanpa wajah. Dipakai NPC (6 InstancedMesh) dan tokoh pemain (buildRig).
   Tinta: kulit layar-konstan (spek §2.5; PX 1,4 peta / 1,8 tokoh, dibagi skala instans) untuk SEMUA bagian (hullAll: aturan min(s) < ,25 → tanpa kulit
   hanya untuk bangunan; anggota badan 10–22 cm tetap bergaris). ACTOR_INK.inkW = pengali tebal aktor (kriteria tahap 2: siluet NPC/tokoh 1,5–2,5 px). */
const ACTOR_INK = { hullAll: true, inkW: 1.08 };   // diukur (metode selisih): 1,0 → NPC 110 u 1,39 px (< 1,5); 1,12 → NPC 110 u 1,71 · NPC 6,5 u 1,63 · tokoh 6,5 u 2,46 (batas 2,5)
/* Kepala & kaki: inkW ,92. Kulit kotak hanya bergeser di 8 sudut (miter) → tepi yang dilihat MIRING tampak th·(cos α + sin α), s.d. 1,41 th:
   puncak kepala dari kamera peta (elevasi 41°) dan kaki yang dilihat 11° menyamping. Diukur (test/t22r2_tinta.js, verif22_ukur.py, tinta teori):
   1,08 → kaki NPC 6,5 u mode tokoh 2,57 / 2,62 px, puncak kepala NPC 110 u 2,61 (depan) / 1,90–2,01 (belakang) — batas 2,5;
   kaki 1,0 → 2,48. Lengan & badan tetap 1,08 (tepi tegak dilihat frontal: lengan NPC 110 u 1,60–1,64, batas bawah 1,5). */
const ACTOR_INK_MIRING = { hullAll: true, inkW: .92 };
const NPC_S = 1;   // geometri sudah bermeter; varian tinggi per NPC ,93–1,03 (spek ,93–1,05; 1,05 × 1,70 = 1,79 → kepala ,56 dinding 3,2 > batas ,55 tahap 3)
const RIG = { hip: .70, shoulder: 1.28, neck: 1.32, armX: .255, legX: .085 };
const rigLimb = (w, h, d, c, c2, h2, ink) => { P = []; box(w, h, d, 0, -h, 0, c); if (c2) box(w + .015, h2, d + (h2 < .1 ? .05 : .015), 0, -h, h2 < .1 ? .025 : 0, c2); return merge(P, true, ink || ACTOR_INK); };   // engsel di ujung atas (y 0), menggantung ke −y
const rigHead = (skin, hair) => { P = []; box(.10, .12, .10, 0, 0, 0, skin); box(.21, .26, .23, 0, .12, 0, skin); box(.225, .07, .245, 0, .31, -.005, hair); return merge(P, true, ACTOR_INK_MIRING); };   // leher + kepala + rambut; puncak ,38 di atas engsel leher → 1,70
const NPC_GEO = (() => {
  const skin = '#E8B890', shoe = '#2A2320', hair = '#2E2A28';
  P = []; box(.40, .62, .22, 0, 0, 0, '#FFFFFF'); box(.41, .06, .23, 0, .56, 0, '#FAF3E8'); const torso = merge(P, true, ACTOR_INK);   // putih = pengali warna baju (instanceColor)
  return { torso, head: rigHead(skin, hair), armL: rigLimb(.10, .62, .11, skin), armR: rigLimb(.10, .62, .11, skin),   // lengan kulit (kaus lengan pendek di badan)
           legL: rigLimb(.15, .70, .16, '#FFFFFF', shoe, .09, ACTOR_INK_MIRING), legR: rigLimb(.15, .70, .16, '#FFFFFF', shoe, .09, ACTOR_INK_MIRING) };   // celana putih × instanceColor celana
})();
const NPC_OFF = { torso: [0, RIG.hip, 0], head: [0, RIG.neck, 0], armL: [-RIG.armX, RIG.shoulder, 0], armR: [RIG.armX, RIG.shoulder, 0], legL: [-RIG.legX, RIG.hip, 0], legR: [RIG.legX, RIG.hip, 0] };
const npcParts = Object.fromEntries(Object.entries(NPC_GEO).map(([k, g]) => { const m = new THREE.InstancedMesh(g, VMAT_I, WALKERS); m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(WALKERS * 3).fill(1), 3); m.castShadow = true; m.frustumCulled = false; inkInstanced(m); scene.add(m); return [k, m]; }));
/* Kaki NPC: materi sendiri (program shader sama dengan VMAT_I, hanya uniform uInkB berbeda; jumlah draw call tetap). Geometri kaki berkulit
   ACTOR_INK_MIRING (,92) agar kaki yang dilihat MIRING di mode tokoh (PX 1,8) ≤ 2,5 px; di mode peta (PX 1,4) kaki dilihat hampir frontal →
   ,92 × 1,4 ≈ 1,3 px (tahap 2 ronde 3, pindai kaki -,40/-,47/-,54 NPC idx84 dist 110: 1,30 / 1,27 px, kriteria 1,5–2,5). applyCam (c2e) memasang
   uInkB = NPC_LEG_INKB_PETA di mode peta (setara inkW 1,12: frontal ≈ 1,6–1,7 px, miring ≤ 1,12·1,4·1,41 ≈ 2,2 px) dan NPC_LEG_INKB_TOKOH
   di mode tokoh (,95: kaki NPC idx84 dist 6,5 terukur 2,51–2,53 px dengan tinta teori ,136 pada ,92 → ≈ 2,4; frontal ≈ 1,6). Tokoh pemain tidak terpengaruh. */
const NPC_LEG_MAT = inkify(toonMat({ vertexColors: true }), 1), NPC_LEG_INKB_PETA = 1.12 / ACTOR_INK_MIRING.inkW, NPC_LEG_INKB_TOKOH = .95;
npcParts.legL.material = npcParts.legR.material = NPC_LEG_MAT;
const walkerBody = npcParts.torso, walkerHead = npcParts.head;
// kepala & lengan putih (kulit dari warna verteks); kaki = warna celana (instanceColor) dengan sepatu gelap
const PANTS = ['#3B4752', '#2E3A40', '#4E3C2E', '#5E666C', '#3E5A82', '#6B5546'];
for (let i = 0; i < WALKERS; i++) npcParts.head.setColorAt(i, new THREE.Color(1, 1, 1));
/* Kendaraan §4.5 (putih = pengali instanceColor carCols/angkotCols; kaca #6A7F95, ban #1E1C1A). Roda: silinder sumbu x (rx = ry = π/2, 'YXZ').
   Mobil 1,8 × 4,3 (≤ 400 segitiga) muat di lajur kolektor 2,6; angkot 1,9 × 1,9 × 4,6; ojek 2,0 + pengendara. */
BASE.cyl8 = new THREE.CylinderGeometry(.5, .5, 1, 8).toNonIndexed();   // roda 8 segmen (spek §4.5)
const wheel = (r, w, x, y, z) => P.push({ g: 'cyl8', s: [r * 2, w, r * 2], p: [x, y, z], c: PAL.ban, rx: Math.PI / 2, ry: Math.PI / 2 });
const carGeo = (() => { P = []; box(1.8, .55, 4.3, 0, .35, 0, '#FFFFFF'); box(1.7, .12, 1.2, 0, .9, 1.5, '#FFFFFF'); box(1.6, .65, 2.0, 0, .9, -.1, '#6A7F95'); box(1.5, .06, 1.7, 0, 1.55, -.15, '#FFFFFF'); box(1.7, .1, .8, 0, .9, -1.7, '#FFFFFF');
  box(.36, .14, .06, -.6, .68, 2.15, '#E8E6DF'); box(.36, .14, .06, .6, .68, 2.15, '#E8E6DF'); box(.3, .12, .06, -.65, .7, -2.15, '#B4443A'); box(.3, .12, .06, .65, .7, -2.15, '#B4443A');
  for (const a of [-1, 1]) for (const b of [-1.35, 1.35]) wheel(.34, .25, a * .775, .34, b); return merge(P, false); })();   // roda di dalam lebar bodi 1,8
const angkotGeo = (() => { P = []; box(1.9, 1.45, 4.6, 0, .42, 0, '#FFFFFF'); box(1.94, .55, 3.3, 0, 1.15, -.3, '#6A7F95'); box(1.96, .16, 4.62, 0, .85, 0, PAL.putih[0]); box(1.8, .08, 4.4, 0, 1.87, 0, '#FFFFFF');
  for (const a of [-1, 1]) for (const b of [-1.5, 1.5]) wheel(.36, .26, a * .82, .36, b); return merge(P, false); })();
const ojekGeo = (() => { P = []; box(.32, .4, 1.5, 0, .35, 0, PAL.bingkai); box(.3, .12, .7, 0, .75, -.25, '#2E2A28'); box(.5, .08, .08, 0, 1.0, .55, PAL.logam); wheel(.3, .12, 0, .3, .72); wheel(.3, .12, 0, .3, -.72);
  box(.38, .58, .24, 0, .82, -.2, AKSEN[1]); box(.2, .24, .22, 0, 1.42, -.17, '#E8B890'); box(.25, .14, .27, 0, 1.6, -.17, AKSEN[1]); for (const s of [-1, 1]) box(.13, .5, .14, s * .12, .3, -.05, '#3B4752'); return merge(P, false); })();   // pengendara 1,7 m ber-helm
const vehMat = toonMat({ vertexColors: true });
const VEH_Y = YL.arteri;   // roda (alas lokal y 0) tepat di muka aspal arteri (kolektor 5 mm lebih rendah)
const carMesh = new THREE.InstancedMesh(carGeo, vehMat, CARS), angkotMesh = new THREE.InstancedMesh(angkotGeo, vehMat, ANGKOT), ojekMesh = new THREE.InstancedMesh(ojekGeo, vehMat, OJEK);
for (const m of [carMesh, angkotMesh, ojekMesh]){ m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; inkInstanced(m); scene.add(m); }
const movers = []; let openSet = new Set(OPEN_AT_START);
// graf movers: simpul = (kolom roadI>0) × (baris roadJ>0); arteri 2 petak = satu simpul di tengah pasangan. Simpul sah bila salah satu dari 4 sel sudutnya di distrik terbuka.
function nodeOK(a, b){ const c = COLS[a], r = ROWS[b]; if (!c || !r) return false; for (const i of [c.c0, c.c1]) for (const j of [r.c0, r.c1]){ if (!inMap(i, j)) continue; if (openSet.has(districtOf(i, j))) return true; } return false; }
// mobil/angkot hanya segmen kelas ≥ 2: sepanjang baris butuh baris arteri; sepanjang kolom selalu kolektor/arteri
function edgeOK(kind, a0, b0, a1, b1){ if (!nodeOK(a1, b1)) return false; if (kind === 'w' || kind === 'ojek') return true; if (b0 === b1) return ROWS[b0].cls >= 2; return COLS[a0].cls >= 2; }
/* posisi lateral dari as jalan (profil §4.8): pejalan di tengah trotoar (arteri 6,8 · kolektor 3,3 · gang 1,0 di tepi paving);
   mobil/angkot di tengah lajur kiri (kolektor ±1,3; arteri lajur dalam 1,625 / luar 3,875); ojek dekat tepi */
const LAT = { w: { 1: 1.0, 2: ROADP[2].hw + ROADP[2].side / 2, 3: ROADP[3].hw + ROADP[3].strip + 1.2 }, car: { 1: .65, 2: ROADP[2].lane }, ojek: { 1: .7, 2: 2.0, 3: 4.3 } };
function initMovers(){
  movers.length = 0; const r = rng(31); const ok = [], near = []; for (let a = 0; a < COLS.length; a++) for (let b = 0; b < ROWS.length; b++) if (nodeOK(a, b)){ ok.push([a, b]); if (districtOf(clamp(COLS[a].c0, 0, N - 1), clamp(ROWS[b].c0, 0, N - 1)) === 'k12') near.push([a, b]); }
  const npc = S.npcs || []; const total = WALKERS + CARS + ANGKOT + OJEK;
  const carCols = ['#C9D3DC','#D8622F','#8FA67E','#E5E1D8','#3E5A82','#B4443A','#2E3A40'], angkotCols = ['#3C6FA8','#3F8A5E','#C2913A','#B5473A'];   // palet §3
  for (let k = 0; k < total; k++){
    const kind = k < WALKERS ? 'w' : k < WALKERS + CARS ? 'car' : k < WALKERS + CARS + ANGKOT ? 'angkot' : 'ojek';
    const pool = (near.length && r() < .6) ? near : ok; let n = pool[Math.floor(r() * pool.length)] || [Math.floor(COLS.length / 2), Math.floor(ROWS.length / 2)];
    if (kind === 'car' || kind === 'angkot'){ for (let q = 0; q < 20 && ROWS[n[1]].cls < 3 && COLS[n[0]].cls < 2; q++) n = pool[Math.floor(r() * pool.length)]; }
    const person = kind === 'w' && npc.length ? npc[k % npc.length] : null;
    // kecepatan (m/dtk): pejalan 1,2–1,8 · mobil/angkot 9–13 · ojek 10–14
    const m = { kind, idx: kind === 'w' ? k : kind === 'car' ? k - WALKERS : kind === 'angkot' ? k - WALKERS - CARS : k - WALKERS - CARS - ANGKOT,
      a: n[0], b: n[1], ta: n[0], tb: n[1], t: 1, wait: 0, sp: kind === 'w' ? 1.2 + r() * .6 : kind === 'ojek' ? 10 + r() * 4 : 9 + r() * 4, side: r() < .5 ? 1 : -1, ph: r() * 9, x: COLS[n[0]].x, z: ROWS[n[1]].z, person,
      hs: .93 + r() * .10, lane: r() < .5 ? 0 : 1 };
    const col = kind === 'w' ? lin(profColor(person?.[2] || Object.keys(PROF)[k % 12])) : kind === 'car' ? lin(carCols[k % carCols.length]) : kind === 'angkot' ? lin(angkotCols[k % angkotCols.length]) : lin('#FFFFFF');
    const mesh = kind === 'w' ? walkerBody : kind === 'car' ? carMesh : kind === 'angkot' ? angkotMesh : ojekMesh; mesh.setColorAt(m.idx, col);
    if (kind === 'w'){ const pc = lin(PANTS[k % PANTS.length]); for (const p of ['legL', 'legR']) npcParts[p].setColorAt(m.idx, pc); }
    movers.push(m);
  }
  for (const m of [walkerBody, carMesh, angkotMesh, ojekMesh, npcParts.legL, npcParts.legR]) if (m.instanceColor) m.instanceColor.needsUpdate = true;
}
const UP = new THREE.Vector3(0, 1, 0), _base = new THREE.Matrix4(), _part = new THREE.Matrix4(), _q2 = new THREE.Quaternion(), _one = new THREE.Vector3(1, 1, 1);
function stepMovers(dt){
  const nowS = performance.now() / 1000;
  for (const o of movers){
    if (o.wait > 0){ o.wait -= dt; } else {
      const x0 = COLS[o.a].x, z0 = ROWS[o.b].z, x1 = COLS[o.ta].x, z1 = ROWS[o.tb].z, len = Math.hypot(x1 - x0, z1 - z0) || 1;
      o.t += dt * o.sp / len;
      if (o.t >= 1){ o.a = o.ta; o.b = o.tb; o.t = 0;
        if (o.kind === 'angkot' && COLS[o.a].cls === 2 && ROWS[o.b].cls === 3) o.wait = 4;   // ngetem di simpang kolektor × arteri
        const opts = [[1,0],[-1,0],[0,1],[0,-1]].map(([dx, dy]) => [o.a + dx, o.b + dy]).filter(([a, b]) => a >= 0 && b >= 0 && a < COLS.length && b < ROWS.length && edgeOK(o.kind, o.a, o.b, a, b));
        const n = opts[Math.floor(Math.random() * opts.length)] || [o.a, o.b]; o.ta = n[0]; o.tb = n[1]; }
    }
    const x0 = COLS[o.a].x, z0 = ROWS[o.b].z, x1 = COLS[o.ta].x, z1 = ROWS[o.tb].z, dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz) || 1;
    const cls = o.a === o.ta ? COLS[o.a].cls : ROWS[o.b].cls;
    const off = o.kind === 'w' ? LAT.w[cls] * o.side : o.kind === 'ojek' ? LAT.ojek[cls] * o.side : (cls === 3 ? ROADP[3].lanes[o.lane] : LAT.car[cls]) * o.side, nx = -dz / len * off, nz = dx / len * off;
    o.x = x0 + dx * o.t + nx; o.z = z0 + dz * o.t + nz; _q.setFromAxisAngle(UP, Math.atan2(dx, dz));
    if (o.kind === 'w'){ const mv = o.wait <= 0 && len > 1; const ph = (nowS + o.ph) * 5.5, sw = mv ? Math.sin(ph) * .5 : 0, bob = mv ? Math.abs(Math.sin(ph)) * .03 : 0;
      _base.compose(_v3.set(o.x, Y0 + .008 + bob, o.z),   // +8 mm: ujung sepatu saat ayunan kaki tidak menembus Y0
         _q, _s3.set(NPC_S * o.hs, NPC_S * o.hs, NPC_S * o.hs));
      for (const k in NPC_OFF){ const of = NPC_OFF[k]; const rx = k === 'armL' ? -sw : k === 'armR' ? sw : k === 'legL' ? sw : k === 'legR' ? -sw : 0;
        _e.set(rx, 0, k === 'armL' ? .06 : k === 'armR' ? -.06 : 0); _q2.setFromEuler(_e); _part.compose(_v3.set(of[0], of[1], of[2]), _q2, _one); _m4.multiplyMatrices(_base, _part); npcParts[k].setMatrixAt(o.idx, _m4); } }
    else { const mesh = o.kind === 'car' ? carMesh : o.kind === 'angkot' ? angkotMesh : ojekMesh; _m4.compose(_v3.set(o.x, VEH_Y, o.z), _q, _s3.set(1,1,1)); mesh.setMatrixAt(o.idx, _m4); }
  }
  for (const k in npcParts) npcParts[k].instanceMatrix.needsUpdate = true;
  carMesh.instanceMatrix.needsUpdate = angkotMesh.instanceMatrix.needsUpdate = ojekMesh.instanceMatrix.needsUpdate = true;
}
