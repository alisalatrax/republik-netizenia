/* ---------- tanah, jalan (3 profil), trotoar per blok, kavling ---------- */
const MAP = N * T, LHALF = MAP / 2, KT = T / 6;   // KT: faktor skala lingkungan terhadap tata letak lama (T 6) — sungai, bukit, hutan, awan ikut T
/* Lantai dunia = Y0 (muka pelataran blok). Lapisan tipis di bawahnya (muka atas, relatif Y0) supaya tidak z-fight:
   tanah −.06 · gang −.04 · kolektor −.035 · arteri −.03 · marka −.02 · trotoar −.015 · pelataran 0 · kavling +.02. Tidak ada benda berdiri di bawah Y0. */
const YL = { tanah: Y0 - .06, gang: Y0 - .04, kolektor: Y0 - .035, arteri: Y0 - .03, marka: Y0 - .02, trotoar: Y0 - .015, kavling: Y0 + .02 };
const RIVER_Z = -LHALF - 29 * KT, RIVER_W = 22 * KT;   // sungai di utara peta
(function buildGround(){
  const size = MAP + 1200, seg = 140, g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, c = new Float32Array(p.count * 3), r = rng(5);
  const g1 = lin(RUMPUT[0]), g2 = lin(RUMPUT[1]), sand = lin(PAL.pasir);   // rumput 2 nada (strip 2,4 u menyusul di tahap lingkungan)
  for (let k = 0; k < p.count; k++){
    const x = p.getX(k), z = p.getZ(k), n = (Math.sin(x * .021) + Math.cos(z * .017) + Math.sin((x + z) * .045)) / 3 + (r() - .5) * .3;
    const cc = n < -.1 ? g2 : g1; let col = _ca.copy(cc);
    if (z < -LHALF - 14 * KT && z > -LHALF - 44 * KT) col = _ca.copy(sand).lerp(cc, .35);
    c[k*3] = col.r; c[k*3+1] = col.g; c[k*3+2] = col.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  const m = new THREE.Mesh(g, toonMat({ vertexColors: true })); m.position.y = YL.tanah; m.receiveShadow = true; scene.add(m);
  // jembatan di utara (ujung kolektor tengah i=108, x=0): lajur kolektor 5,2 menerus + dek 7 × 45 (spek §4.1)
  P = []; box(ASPAL, .03, 90, 0, YL.kolektor - .03, -LHALF - 45, PAL.aspal); box(7, .6, 45, 0, Y0, RIVER_Z, '#9E9A90'); for (const s of [-1, 1]){ box(.3, 1, 45, s * 3.35, Y0 + .6, RIVER_Z, '#6F6A60'); for (let z = -22; z <= 22; z += 4) box(.4, 1.2, .4, s * 3.35, Y0 + .4, RIVER_Z + z, '#6F6A60'); }
  const br = withInk(new THREE.Mesh(merge(P, true), VMAT)); br.castShadow = true; br.receiveShadow = true; scene.add(br);
})();
/* Jalan — 3 profil (spek-gaya §4.8, menggantikan ROAD_W/SIDE_W). hw = setengah lebar badan jalan dari as (arteri: termasuk median),
   side = lebar zona tepi per sisi dari tepi badan jalan sampai batas kavling (hw + side = setengah lebar petak jalan):
   kelas 3 arteri (2 petak = 16 u): median rumput 1,0 + 2 × aspal 4,5 (2 lajur 2,25) + 2 × (strip tanam 0,6 + trotoar 2,4)
   kelas 2 kolektor (1 petak = 8 u): aspal 5,2 (2 lajur 2,6) + 2 × trotoar 1,4
   kelas 1 gang (1 petak = 8 u): paving 2,6 + 2 × bahu 0,4; sisa 2,3 per sisi = pelataran blok (muka Y0, depan rumah) */
const ROADP = { 1: { hw: 1.3, side: 2.7, bahu: .4 }, 2: { hw: ASPAL / 2, side: TROTOAR, lane: 1.3 }, 3: { hw: 5.0, side: 3.0, med: .5, strip: .6, lanes: [1.625, 3.875] } };
const COLS = [], ROWS = [];            // simpul graf movers: satu per garis jalan (arteri = satu simpul di tengah pasangan)
for (let i = 0; i < N; i++){ const c = roadI(i); if (!c || (c === 3 && i % PD === 1)) continue; COLS.push({ i, x: c === 3 ? wx(i) + T / 2 : wx(i), cls: c, c0: i - 1, c1: i + (c === 3 ? 2 : 1) }); }
for (let j = 0; j < N; j++){ const c = roadJ(j); if (!c || (c === 3 && j % PD === 1)) continue; ROWS.push({ j, z: c === 3 ? wx(j) + T / 2 : wx(j), cls: c, c0: j - 1, c1: j + (c === 3 ? 2 : 1) }); }
const isProtokol = (i, j) => ((i === 86 || i === 129) && j >= 86 && j <= 130) || ((j === 86 || j === 129) && i >= 86 && i <= 130);
const distOpen = (k, open) => open.has(k);
// potong selang [lo, hi] dengan daftar celah [a, b] → segmen tersisa (median & garis tepi terputus di simpang)
function segs(lo, hi, cuts){ const out = []; let s = lo; for (const [a, b] of cuts.slice().sort((p, q) => p[0] - q[0])){ if (b <= s || a >= hi) continue; if (a > s) out.push([s, a]); s = Math.max(s, b); } if (s < hi) out.push([s, hi]); return out; }
let roadMesh = null, dashMesh = null, zebraMesh = null;
const SIDEWALKS = {};   // k -> Mesh trotoar per blok (satu geometri per distrik)
function buildRoads(open){
  if (roadMesh){ scene.remove(roadMesh); roadMesh.geometry.dispose(); roadMesh = null; }
  P = []; const A = ROADP[3];
  // strip memanjang: sepanjang z (kolom) atau x (baris); muka atas di y
  const strip = (alongZ, o, a0, a1, w, y, c, h) => { h = h || .03; const L = a1 - a0, m = (a0 + a1) / 2; if (L <= 0) return; alongZ ? box(w, h, L, o, y - h, m, c) : box(L, h, w, m, y - h, o, c); };
  const span = (k, axis) => { const [i0, j0, i1, j1] = DIST_RECT[k]; return axis === 'x' ? [wx(i0) - T / 2, wx(Math.min(i1, N - 1)) + T / 2] : [wx(j0) - T / 2, wx(Math.min(j1, N - 1)) + T / 2]; };
  // arteri (selalu aspal = kerangka negara): 2 badan aspal 4,5 + median rumput 1,0 bertepi curb + garis tepi .1 (curb luar ±4,85, median ±,62); median & garis terputus di simpang
  const artCuts = (alongZ) => alongZ ? ROWS.filter(r => r.cls === 3).map(r => [r.z - T, r.z + T]) : COLS.filter(c => c.cls >= 2).map(c => [c.x - ROADP[c.cls].hw - .4, c.x + ROADP[c.cls].hw + .4]);
  const artery = (alongZ, o) => {
    for (const s of [-1, 1]) strip(alongZ, o + s * (A.med + (A.hw - A.med) / 2), -LHALF, LHALF, A.hw - A.med, YL.arteri, PAL.aspal);
    // alas aspal di bawah median sepanjang arteri: celah median di simpang (artCuts) dulu kosong → kolektor tanah distrik tertutup / tanah rumput
    // terlihat sebagai strip oranye/hijau melintang aspal simpang (verifikasi akhir3, desa-15 x 1040–1080 y 422–427). Tertutup median di luar simpang.
    strip(alongZ, o, -LHALF, LHALF, 2 * A.med + .02, YL.arteri, PAL.aspal);
    for (const [a0, a1] of segs(-LHALF, LHALF, artCuts(alongZ))){
      strip(alongZ, o, a0 + .3, a1 - .3, 2 * A.med - .24, YL.arteri + .15, RUMPUT[0], .18);                                   // median rumput (muka Y0 + ,12)
      for (const s of [-1, 1]){ strip(alongZ, o + s * (A.med - .06), a0 + .3, a1 - .3, .12, YL.arteri + .17, PAL.curb, .2);     // curb median
        strip(alongZ, o + s * 4.85, a0, a1, .1, YL.arteri + .005, PAL.marka); strip(alongZ, o + s * (A.med + .12), a0, a1, .1, YL.arteri + .005, PAL.marka); } }
  };
  for (const c of COLS) if (c.cls === 3) artery(true, c.x);
  for (const r of ROWS) if (r.cls === 3) artery(false, r.z);
  // kolektor (aspal 5,2) & gang (paving 2,6) per segmen distrik (aspal/tanah); garis tepi kolektor ±2,45 terputus di baris arteri
  // integrasi r3: ruas kolektor/gang sebuah distrik dipotong di TEPI LAJUR arteri pembatasnya (as pasangan arteri ± A.hw), bukan di tepi luar petak arteri.
  // Dulu ruas dua distrik bertetangga bertumpuk sebidang di zona trotoar arteri (3 u) → aspal (terbuka) vs tanah (tertutup) saling tembus; kini tiap lengan
  // simpang milik distrik di sisinya saja (zebra lengan kolektor memakai aturan yang sama, lihat armOpen).
  for (const k of DISTRICTS){ const [i0, j0, i1, j1] = DIST_RECT[k], ring = distRing(k), isOpen = distOpen(k, open);
    const zx0 = wx(i0) + T / 2 + A.hw - .05, zx1 = wx(Math.min(i1, N - 1)) + T / 2 - A.hw + .05, zz0 = j0 === 0 ? -LHALF : wx(j0) + T / 2 + A.hw - .05, zz1 = wx(Math.min(j1, N - 1)) + T / 2 - A.hw + .05;
    for (const c of COLS) if (c.cls === 2 && c.i >= i0 && c.i < i1){ strip(true, c.x, zz0, zz1, ASPAL, YL.kolektor, isOpen ? PAL.aspal : PAL.tanah);
      if (isOpen) for (const s of [-1, 1]) strip(true, c.x + s * 2.45, wx(j0 + 2) - T / 2, wx(Math.min(j1, N) - 1) + T / 2, .1, YL.kolektor + .005, PAL.marka); }
    for (const r of ROWS) if (r.cls === 1 && r.j >= j0 && r.j < j1) strip(false, r.z, zx0, zx1, 2 * ROADP[1].hw, YL.gang, isOpen && ring < 2 ? PAVING[1] : PAL.tanah); }
  roadMesh = new THREE.Mesh(merge(P, false, { ink: 0 }), toonMat({ vertexColors: true })); roadMesh.receiveShadow = true; scene.add(roadMesh);
  // marka putus 1,6 × ,15 jarak 4 (as kolektor terbuka + pembagi lajur arteri ±2,75 di samping distrik terbuka) & zebra 2,6 × ,5 jarak ,45 (simpang yang melibatkan arteri)
  if (dashMesh){ scene.remove(dashMesh); dashMesh.dispose(); } if (zebraMesh){ scene.remove(zebraMesh); zebraMesh.dispose(); }
  const dashes = [], zebra = [], DP = 4;
  const nearArt = s => { const j = Math.round(s / T + HALF); return roadJ(clamp(j, 0, N - 1)) === 3 || roadJ(clamp(Math.round((s - 6) / T + HALF), 0, N - 1)) === 3 || roadJ(clamp(Math.round((s + 6) / T + HALF), 0, N - 1)) === 3; };
  const nearArtI = s => { const i = Math.round(s / T + HALF); return roadI(clamp(i, 0, N - 1)) >= 2 || roadI(clamp(Math.round((s - 6) / T + HALF), 0, N - 1)) >= 2 || roadI(clamp(Math.round((s + 6) / T + HALF), 0, N - 1)) >= 2; };
  for (const c of COLS){ const lo = clamp(c.c0, 0, N - 1), hi = clamp(c.c1, 0, N - 1);
    for (let s = -LHALF + 2; s < LHALF - 2; s += DP){ if (nearArt(s)) continue; const j = clamp(Math.round(s / T + HALF), 0, N - 1); if (!open.has(districtOf(lo, j)) && !open.has(districtOf(hi, j))) continue;
      if (c.cls === 2) dashes.push([c.x, s, 1]); else if (c.cls === 3) dashes.push([c.x - 2.75, s, 1], [c.x + 2.75, s, 1]); } }
  for (const r of ROWS) if (r.cls === 3){ const lo = clamp(r.c0, 0, N - 1), hi = clamp(r.c1, 0, N - 1);
    for (let s = -LHALF + 2; s < LHALF - 2; s += DP){ if (nearArtI(s)) continue; const i = clamp(Math.round(s / T + HALF), 0, N - 1); if (!open.has(districtOf(i, lo)) && !open.has(districtOf(i, hi))) continue; dashes.push([s, r.z - 2.75, 0], [s, r.z + 2.75, 0]); } }
  for (const c of COLS) for (const r of ROWS){ if (c.cls < 2 || r.cls < 2 || (c.cls < 3 && r.cls < 3)) continue; const hx = ROADP[c.cls].hw, hz = ROADP[r.cls].hw;
    for (let z = r.z - hz + .45; z <= r.z + hz - .4; z += .95){ if (Math.abs(z - r.z) < (ROADP[r.cls].med || 0) + .2) continue; zebra.push([c.x - hx - 1.6, z, 0], [c.x + hx + 1.6, z, 0]); }
    // zebra melintang kolektor: hanya di lengan kolektor beraspal (distrik terbuka); kolektor distrik tertutup = jalan tanah tanpa marka (integrasi r3: desa-15 zebra di atas tanah)
    // lengan utara (z < r.z) milik distrik baris r.c0, lengan selatan milik baris r.c1 (petak trotoar arteri ikut lengan, sama dengan potongan ruas di atas)
    const armOpen = s => c.cls === 3 || open.has(districtOf(c.i, clamp(s < 0 ? r.c0 : r.c1, 0, N - 1)));
    for (let x = c.x - hx + .45; x <= c.x + hx - .4; x += .95){ if (Math.abs(x - c.x) < (ROADP[c.cls].med || 0) + .2) continue; for (const s of [-1, 1]) if (armOpen(s)) zebra.push([x, r.z + s * (hz + 1.6), 1]); } }
  const inst = (geo, color, list, y) => { const im = new THREE.InstancedMesh(geo, toonMat({ color: lin(color) }), Math.max(1, list.length)); const yq = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI/2), q0 = new THREE.Quaternion();
    list.forEach((d, k) => { _m4.compose(_v3.set(d[0], y, d[1]), d[2] ? yq : q0, _s3.set(1,1,1)); im.setMatrixAt(k, _m4); }); im.count = list.length; im.receiveShadow = true; im.frustumCulled = false; scene.add(im); return im; };
  const pl = (w, d) => { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); return g; };
  dashMesh = inst(pl(1.6, .15), PAL.marka, dashes, YL.marka); zebraMesh = inst(pl(2.6, .5), PAL.zebra, zebra, YL.marka);
}
/* trotoar per blok (6 × 2 kavling): slab trotoar (muka YL.trotoar) selebar zona tepi tiap sisi (arteri 3,0 · kolektor 1,4 · gang 2,7),
   pelataran (muka Y0) = blok + lis ,2 (sisi gang: + 2,3 sampai bahu ,4), strip tanam rumput ,6 di sisi arteri, curb gelap ,18 di tepi luar sisi arteri/kolektor */
function buildSidewalks(open){
  for (const k of DISTRICTS){
    if (!SIDEWALKS[k]){ const [i0, j0, i1, j1] = DIST_RECT[k], ring = distRing(k); P = []; const col = ring < 2 ? PAVING[3] : PAVING[4], pel = ring < 2 ? PAVING[2] : PAVING[5];   // integrasi r1: trotoar #CFC9BC (S .09) → PAVING[3], pelataran PAVING[1] → [2] (lihat LOTC.paving)
      for (let bx = 0; bx < 6; bx++) for (let by = 0; by < 14; by++){ const ia = i0 + 2 + bx * 7, ja = j0 + 2 + by * 3;
        const cW = roadI(ia - 1), cE = roadI(ia + 6), cN = roadJ(ja - 1), cS = roadJ(ja + 2), sW = ROADP[cW].side, sE = ROADP[cE].side, sN = ROADP[cN].side, sS = ROADP[cS].side;
        const x0 = wx(ia) - T / 2, x1 = wx(ia + 5) + T / 2, z0 = wx(ja) - T / 2, z1 = wx(ja + 1) + T / 2, sx0 = x0 - sW, sx1 = x1 + sE, sz0 = z0 - sN, sz1 = z1 + sS;
        box(sx1 - sx0, .1, sz1 - sz0, (sx0 + sx1) / 2, YL.trotoar - .1, (sz0 + sz1) / 2, col);
        const pz0 = z0 - (cN === 1 ? sN - ROADP[1].bahu : .2), pz1 = z1 + (cS === 1 ? sS - ROADP[1].bahu : .2);
        box(x1 - x0 + .4, .1, pz1 - pz0, (x0 + x1) / 2, Y0 - .1, (pz0 + pz1) / 2, pel);
        // curb luar (muka Y0 + ,015) & strip tanam di sisi arteri / kolektor
        if (cW >= 2) box(.18, .13, sz1 - sz0, sx0 + .09, YL.trotoar - .1, (sz0 + sz1) / 2, PAL.curb); if (cE >= 2) box(.18, .13, sz1 - sz0, sx1 - .09, YL.trotoar - .1, (sz0 + sz1) / 2, PAL.curb);
        if (cN >= 2) box(sx1 - sx0, .13, .18, (sx0 + sx1) / 2, YL.trotoar - .1, sz0 + .09, PAL.curb); if (cS >= 2) box(sx1 - sx0, .13, .18, (sx0 + sx1) / 2, YL.trotoar - .1, sz1 - .09, PAL.curb);
        if (ring < 2){ const st = ROADP[3].strip;
          if (cW === 3) box(st, .1, z1 - z0, sx0 + .18 + st / 2, YL.trotoar - .094, (z0 + z1) / 2, RUMPUT[0]); if (cE === 3) box(st, .1, z1 - z0, sx1 - .18 - st / 2, YL.trotoar - .094, (z0 + z1) / 2, RUMPUT[0]);
          if (cN === 3) box(x1 - x0, .1, st, (x0 + x1) / 2, YL.trotoar - .094, sz0 + .18 + st / 2, RUMPUT[0]); if (cS === 3) box(x1 - x0, .1, st, (x0 + x1) / 2, YL.trotoar - .094, sz1 - .18 - st / 2, RUMPUT[0]); } }
      const m = new THREE.Mesh(merge(P, false, { ink: 0 }), toonMat({ vertexColors: true })); m.receiveShadow = true; scene.add(m); SIDEWALKS[k] = m; }
    SIDEWALKS[k].visible = open.has(k);
  }
}
// kavling: bidang datar per kavling (25.200 instance, 2 segitiga); berwarna saat mode bangun
const lotList = [], lotIndex = new Map();
for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (isLot(i, j)){ lotIndex.set(j * N + i, lotList.length); lotList.push([i, j]); }
const lotMesh = new THREE.InstancedMesh((() => { const g = new THREE.PlaneGeometry(T - .3, T - .3); g.rotateX(-Math.PI / 2); return g; })(), toonMat({ color: 0xffffff }), lotList.length);
lotMesh.receiveShadow = true; lotMesh.frustumCulled = false; scene.add(lotMesh);   // InstancedMesh r128: bounding sphere hanya geometri → jangan di-cull
{ lotList.forEach(([i, j], k) => { _m4.makeTranslation(wx(i), YL.kavling, wx(j)); lotMesh.setMatrixAt(k, _m4); lotMesh.setColorAt(k, lin(RUMPUT[0])); }); }
const LOTC = { lawn: [RUMPUT[0], RUMPUT[1], RUMPUT[0]].map(c => lin(c)), forest: lin('#5E7A44'), free: lin('#BCD27A'), bad: lin('#C97A68'), nofront: lin(PAVING[1]), mine: lin('#E6C96F'), paving: lin(PAVING[5]) };   // paving kavling kosong (lama: PAVING[2] (kanal maks = PAVING[0], S .16 vs .11))
/* Integrasi r1 — paving lebih hangat, tetap dari palet spek §3 (PAVING): jalan/arteri jam 12 S .173/.176 (< .20) karena ±57 % bingkai = paving krem S .09–.16
   (kavling kosong PAVING[2] .159, pelataran PAVING[1] .114, trotoar #CFC9BC .092). Kavling PAVING[4] (.174), pelataran PAVING[2], trotoar PAVING[3] (.130):
   bersama matahari 12 #F6E2C2 → jalan-12 S .204, arteri-12 .204, jalan-15 .213, arteri-15 .216 (test/ri1/t1 P1). Aspal #45464A tetap (pengukur rona bayangan).
   Kavling kosong lalu PAVING[5] (#C6B898, V .776, S .232): kunci 16.3 yang dinaikkan (kampung berisi ≥ .58) membuat ink-dekat jam 15 (sebagian besar kavling kosong)
   V .6619 > .66; PAVING[5] → .6603 (test/ri1/t6). Kavling kosong tertutup bangunan di adegan berisi, jadi warna ini hampir hanya mengubah bingkai kosong. */

/* ---------- props per chunk distrik: pohon, sawah/kebun per blok, gubuk (LOD radius 2 distrik, anggaran instance) ---------- */
Object.assign(BASE, { cyl6: new THREE.CylinderGeometry(.5, .5, 1, 6).toNonIndexed(), sph8: new THREE.SphereGeometry(.5, 7, 4).toNonIndexed(), cone8: new THREE.ConeGeometry(.5, 1, 8).toNonIndexed() });
Object.assign(BASE, { plane: (() => { const g = new THREE.PlaneGeometry(1, 1).toNonIndexed(); g.rotateX(-Math.PI / 2); return g; })() });
const TREE_GEOS = (() => {   // poli rendah: ≈ 60-110 segitiga per pohon; pelepah palem/pisang radial (ry = π/2 − sudut; dulu tangensial → bentuk roda gigi)
  const cyl6 = (r, h, x, y, z, c) => P.push({ g: 'cyl6', s: [r*2, h, r*2], p: [x, y+h/2, z], c });
  const sph8 = (r, x, y, z, c, ry) => P.push({ g: 'sph8', s: [r*2, (ry||r)*2, r*2], p: [x, y, z], c });
  P = []; cyl6(.22, 1.6, 0, 0, 0, PAL.pohon.batang); sph8(1.35, 0, 2.6, 0, PAL.pohon.tengah, 1.15); sph8(.9, .55, 3.3, -.3, PAL.pohon.atas); const round = merge(P, true, { soft: true });
  P = []; cyl6(.2, 1.2, 0, 0, 0, PAL.cemara[0]); P.push({ g: 'cone8', s: [3, 2.6, 3], p: [0, 2.4, 0], c: PAL.cemara[1] }); P.push({ g: 'cone8', s: [2, 2.2, 2], p: [0, 3.9, 0], c: PAL.cemara[2] }); const pine = merge(P, true, { soft: true });
  /* palem/kelapa (verifikasi akhir3: batang r ,18 × skala ≈ 1,5 → ±,85 m dengan kulit; tajuk 5 bilah datar "baling-baling"):
     batang 2 ruas cyl6 r ,13/,125 (dunia ≈ ,17–,22 m pada skala 1,3–1,7; ≥ ,25 tebal → tetap berkulit), ruas atas condong ,12 rad ('YXZ');
     6 pelepah 2 ruas: pangkal box ,5 × 1,3 naik 20°, ujung pyr ,5 × 1,9 meruncing melengkung turun 35°/54° bergantian; mahkota cone8 + tandan kelapa sph8.
     ≈ 226 segitiga badan (spek §7.1 pohon hi ≤ 250) + kulit batang/mahkota/tandan. */
  P = []; { const L2 = 2.0, th = .12, b2 = 2.25, top = [0, b2 + L2 * Math.cos(th), L2 * Math.sin(th)];
    cyl6(.13, 2.3, 0, 0, 0, PAL.kayu[0]); P.push({ g: 'cyl6', s: [.25, L2, .25], p: [0, b2 + L2 / 2 * Math.cos(th), L2 / 2 * Math.sin(th)], c: PAL.kayu[0], rx: th });
    for (let a = 0; a < 6; a++){ const an = a / 6 * Math.PI * 2 + .3, ca = Math.cos(an), sa = Math.sin(an), up = .35, dn = a % 2 ? .62 : .95, LA = 1.3, LB = 1.9;
      const dA = [ca * Math.cos(up), Math.sin(up), sa * Math.cos(up)], eA = [top[0] + dA[0] * LA, top[1] + dA[1] * LA, top[2] + dA[2] * LA], dB = [ca * Math.cos(dn), -Math.sin(dn), sa * Math.cos(dn)], hb = LB / 2 - .05;
      P.push({ g: 'box', s: [.5, .06, LA], p: [top[0] + dA[0] * LA / 2, top[1] + dA[1] * LA / 2, top[2] + dA[2] * LA / 2], c: PAL.palem, ry: Math.PI / 2 - an, rx: -up });   // +z lokal → dA
      P.push({ g: 'pyr', s: [.5, LB, .06], p: [eA[0] + dB[0] * hb, eA[1] + dB[1] * hb, eA[2] + dB[2] * hb], c: PAL.palem, ry: Math.PI / 2 - an, rx: Math.PI / 2 + dn }); }   // puncak +y lokal → dB
    P.push({ g: 'cone8', s: [.5, .45, .5], p: [top[0], top[1] + .05, top[2]], c: PAL.kayu[2] }); sph8(.17, top[0] + .16, top[1] - .28, top[2] - .05, PAL.kayu[1]); }
  const palm = merge(P, true, { soft: true });
  P = []; cyl6(.14, 2.2, 0, 0, 0, PAL.kayu[0]); for (let a = 0; a < 4; a++){ const an = a / 4 * Math.PI * 2 + .4; box(.9, .1, 2, Math.cos(an) * .8, 2.2, Math.sin(an) * .8, PAL.pohon.atas, Math.PI / 2 - an); } const pisang = merge(P, true, { soft: true });
  return { round, pine, palm, pisang };
})();
/* Tahap 5 LOD pohon: pohon > TREE_NEAR dari titik tatap memakai bentuk jauh (siluet sama, segitiga ±⅓): batang tanpa kulit, tajuk satu bola/kerucut berkulit.
   Diukur (test/trisrc.js, drone dist 160): pohon ±350 rb segitiga (4 jenis × ratusan instance, tidak di-cull) dari total dunia ±780 rb. */
const TREE_NEAR = MOBILE ? 110 : 170;
const TREE_FAR_GEOS = (() => {
  const cyl6 = (r, h, x, y, z, c) => P.push({ g: 'cyl6', s: [r*2, h, r*2], p: [x, y+h/2, z], c, noHull: true });
  const sph8 = (r, x, y, z, c, ry) => P.push({ g: 'sph8', s: [r*2, (ry||r)*2, r*2], p: [x, y, z], c });
  P = []; cyl6(.22, 1.6, 0, 0, 0, PAL.pohon.batang); sph8(1.5, .15, 2.8, -.08, PAL.pohon.tengah, 1.35); const round = merge(P, true, { soft: true });
  P = []; cyl6(.2, 1.2, 0, 0, 0, PAL.cemara[0]); P.push({ g: 'cone8', s: [3, 4.2, 3], p: [0, 3.0, 0], c: PAL.cemara[1] }); const pine = merge(P, true, { soft: true });
  P = []; cyl6(.15, 4.2, 0, 0, 0, PAL.kayu[0]); P.push({ g: 'cone8', s: [4.4, .9, 4.4], p: [0, 4.15, .25], c: PAL.palem }); const palm = merge(P, true, { soft: true });
  P = []; cyl6(.14, 2.2, 0, 0, 0, PAL.kayu[0]); box(2.4, .1, .9, 0, 2.2, 0, PAL.pohon.atas); box(.9, .1, 2.4, 0, 2.25, 0, PAL.pohon.atas); const pisang = merge(P, true, { soft: true });
  return { round, pine, palm, pisang };
})();
const TREE_CAP = LOW ? 1500 : 3200, PROP_CAP = LOW ? 4500 : 9000;   // aktif per frame (semua jenis)
const treeMeshes = Object.fromEntries([...Object.entries(TREE_GEOS), ...Object.entries(TREE_FAR_GEOS).map(([k, g]) => [k + '_j', g])].map(([k, g]) => { const m = new THREE.InstancedMesh(g, VMAT_I, TREE_CAP); m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(TREE_CAP * 3).fill(1), 3); m.castShadow = !LOW && !MOBILE; m.receiveShadow = true; m.count = 0; m.frustumCulled = false; inkInstanced(m); scene.add(m); return [k, m]; }));
const fieldGeo = (() => { P = []; const pl = (w, d, x, y, z, c) => P.push({ g: 'plane', s: [w, 1, d], p: [x, y, z], c }); pl(6 * T - .6, 2 * T - .6, 0, 0, 0, PAL.padi[1]); for (let k = 0; k < 7; k++){ pl(6 * T - 1.2, .9, 0, .01, -T + .9 + k * 1.55, PAL.padi[0]); pl(6 * T - 1.2, .35, 0, .015, -T + 1.6 + k * 1.55, PAL.sawahAir); } return merge(P, false, { ink: 0 }); })();
// kebun: tanah bedeng basah kayu[1] #5E4630 (V .37); kayu[2] (V .48) membuat cincin desa nyaris tanpa nada gelap (V<0,4 desa 8,5 %)
const kebunGeo = (() => { P = []; P.push({ g: 'plane', s: [6 * T - .6, 1, 2 * T - .6], p: [0, 0, 0], c: PAL.kayu[1] }); for (let r = 0; r < 2; r++) for (let k = 0; k < 7; k++) P.push({ g: 'pyr', s: [1.5, 1.1, 1.5], p: [(-15 + k * 5) * KT, .55, (-2.6 + r * 5.2) * KT], c: r % 2 ? PAL.semak : PAL.bedeng }); return merge(P, true, { ink: 0 }); })();
const hutGeo = (() => { P = []; for (const a of [-.9, .9]) for (const b of [-.9, .9]) box(.16, 1.2, .16, a, 0, b, PAL.kayu[1]); box(2.6, 1.6, 2.4, 0, 1.2, 0, '#C9A86A'); roof(3.2, 1.2, 3, 0, 2.8, 0, GENTENG[9]); box(.9, 1.1, .08, 0, 1.4, 1.22, PAL.pintu2); return merge(P, true); })();
const fieldMesh = new THREE.InstancedMesh(fieldGeo, VMAT_I, 2800), kebunMesh = new THREE.InstancedMesh(kebunGeo, VMAT_I, 1200), hutMesh = new THREE.InstancedMesh(hutGeo, VMAT_I, 900);
for (const m of [fieldMesh, kebunMesh, hutMesh]) m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(m.instanceMatrix.count * 3).fill(1), 3);   // VMAT_I dipakai bersama: semua pemakainya wajib punya instanceColor (r128)
fieldMesh.receiveShadow = true; kebunMesh.receiveShadow = true; hutMesh.castShadow = true; hutMesh.receiveShadow = true; inkInstanced(hutMesh); fieldMesh.count = kebunMesh.count = hutMesh.count = 0; fieldMesh.frustumCulled = kebunMesh.frustumCulled = hutMesh.frustumCulled = false; scene.add(fieldMesh, kebunMesh, hutMesh);
const CHUNKS = new Map();   // key -> { trees:[[x,z,s,rot,kind]], fields:[[x,z]], kebun:[[x,z]], huts:[[x,z,rot]] }
function chunkOf(k, open){
  const ck = k + (open.has(k) ? ':b' : ':t'); let c = CHUNKS.get(ck); if (c) return c;
  const r = rng(hashStr('chunk' + ck)), [i0, j0, i1, j1] = DIST_RECT[k], ring = distRing(k), isOpen = open.has(k);
  c = { trees: [], fields: [], kebun: [], huts: [] };
  const tree = (x, z, s, kind) => c.trees.push([x, z, s, r() * 6.28, kind]);
  // skala pohon (1 unit = 1 m; geometri bulat ≈ 4,2 tinggi): pohon jalan/kampung × 2,6 (5,5–7,6 m), pohon liar distrik tertutup × 1,4
  const TS = 2.6, TW = 1.4;
  if (isOpen){
    // pohon tepi jalan: kolektor 1 sisi tiap 3 petak (40 %), median arteri tiap 2 petak (protokol) / 6 petak (lainnya), gang desa pohon kelapa
    for (const col of COLS) if (col.i >= i0 && col.i < i1 + 1) for (let j = j0 + 2; j < j1; j += (col.cls === 3 ? 2 : 3)){ if (roadJ(j) || !isLot(Math.max(0, col.c0), j)) continue;
      if (col.cls === 3){ if ((isProtokol(col.i, j) && j % 4 === 0) || j % 8 === 0) tree(col.x, wx(j) + (r() - .5) * 2, (.5 + r() * .15) * TS, r() < .4 ? 'palm' : 'round'); }
      else if (r() < .3) tree(col.x + (r() < .5 ? -1 : 1) * (ROADP[2].hw + ROADP[2].side / 2), wx(j) + (r() - .5) * 2, (.5 + r() * .2) * TS, ring === 2 ? 'palm' : r() < .3 ? 'palm' : 'round'); }
    for (const row of ROWS) if (row.cls === 3 && row.j >= j0 - 1 && row.j < j1 + 1) for (let i = i0 + 2; i < i1; i += 2){ if (roadI(i)) continue; if ((isProtokol(i, row.j) && i % 4 === 0) || i % 8 === 0) tree(wx(i) + (r() - .5) * 2, row.z, (.5 + r() * .15) * TS, r() < .4 ? 'palm' : 'round'); }
    if (ring === 2) for (let bx = 0; bx < 6; bx++) for (let by = 0; by < 14; by++) if (r() < .5) tree(wx(i0 + 2 + bx * 7 + Math.floor(r() * 6)) + (r() - .5) * T * .5, wx(j0 + 2 + by * 3 + 1) + T * .6 + (r() - .5), (.5 + r() * .2) * TS * .85, r() < .6 ? 'pisang' : 'palm');
  } else {
    // distrik tertutup: 60 % blok sawah bergaris, 25 % kebun, 10 % pohon liar, 5 % gubuk (hutan rapat hanya di luar peta)
    for (let bx = 0; bx < 6; bx++) for (let by = 0; by < 14; by++){ const ia = i0 + 2 + bx * 7, ja = j0 + 2 + by * 3, cx = wx(ia) + 2.5 * T, cz = wx(ja) + T / 2, h = hashStr(k + ':' + bx + ',' + by) % 100;
      if (h < 60) c.fields.push([cx, cz]); else if (h < 85) c.kebun.push([cx, cz]);
      else if (h < 95){ for (let q = 0; q < 2 + Math.floor(r() * 3); q++) tree(cx + (r() - .5) * (6 * T - 2), cz + (r() - .5) * (2 * T - 2), (.8 + r() * .6) * TW, r() < .5 ? 'round' : r() < .7 ? 'pine' : 'palm'); }
      else { c.huts.push([cx + (r() - .5) * 20 * KT, cz + (r() - .5) * 6 * KT, Math.floor(r() * 4) * Math.PI / 2]); tree(cx + 12 * KT, cz + 3 * KT, .6 * TS * .85, 'pisang'); tree(cx - 12 * KT, cz - 3 * KT, .55 * TS * .85, 'palm'); }
      if (r() < .15) tree(cx + (r() - .5) * 36 * KT, cz + (r() < .5 ? -1 : 1) * (T + 1.6), (.5 + r() * .3) * TS * .85, r() < .5 ? 'palm' : 'pisang'); }
  }
  CHUNKS.set(ck, c); return c;
}
const FOREST = (() => { const r = rng(99), out = []; for (let k = 0; k < (LOW ? 220 : 420); k++){ const a = r() * Math.PI * 2, d = LHALF + 18 * KT + Math.pow(r(), .7) * 230 * KT; const x = Math.cos(a) * d, z = Math.sin(a) * d; if (z < -LHALF - 10 * KT && z > -LHALF - 48 * KT) continue; if (Math.abs(x) < 8 && z < 0) continue; out.push([x, z, (1 + r() * 1.2) * 1.4, r() * 6.28, r() < .55 ? 'pine' : 'round']); } return out; })();
let chunkKey = '';
/* Tahap 5: lampu jalan & tiang listrik hanya dalam LAMP_R dari titik tatap (dulu seluruh peta: 3.324 tiang × 36 segitiga + kepala, tanpa cull).
   Di 560 u tiang ,14 m ≈ ,3 px — batas tidak terbaca. Diisi ulang bersama pohon (refreshChunks, sel 48 u). */
const LAMP_R = MOBILE ? 380 : 560; let LAMP_SPOTS = null, ELEC_SPOTS = null;
/* Tahap 7+9: kait props tambahan (file c2f_*.js mendaftar fungsi (tx0, tz0) di sini). Dipanggil saat titik tatap pindah sel 48 u
   (refreshChunks) — isi ulang InstancedMesh props di sekitar titik tatap. Jangan kerja per frame di sini. */
const PROP_HOOKS = [];
function refreshChunks(force){
  const ci = clamp(Math.floor((cam.tx / T + HALF) / PD), 0, 4), cj = clamp(Math.floor((cam.tz / T + HALF) / PD), 0, 4);
  const key = ci + ',' + cj + '|' + Math.round(cam.tx / 48) + ',' + Math.round(cam.tz / 48) + '|' + [...openSet].sort().join(',');   // + sel 48 u: batas LOD pohon ikut titik tatap
  if (!force && key === chunkKey) return; chunkKey = key;   // tahap 7+9 integrasi: pernyataan ini sempat tertelan komentar → refreshChunks + PROP_HOOKS jalan tiap 1 dtk
  const order = DISTRICTS.map(k => { const n = +k.slice(1), dx = n % 5 - ci, dy = Math.floor(n / 5) - cj; return [Math.max(Math.abs(dx), Math.abs(dy)), Math.abs(dx) + Math.abs(dy), k]; }).filter(d => d[0] <= 2).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const spots = { round: [], pine: [], palm: [], pisang: [], round_j: [], pine_j: [], palm_j: [], pisang_j: [] }, fields = [], kebun = [], huts = []; let used = 0;
  const tx0 = Math.round(cam.tx / 48) * 48, tz0 = Math.round(cam.tz / 48) * 48, kindOf = t => (t[0] - tx0) ** 2 + (t[1] - tz0) ** 2 < TREE_NEAR * TREE_NEAR ? t[4] : t[4] + '_j';
  const r = rng(7);
  for (const t of FOREST){ spots[kindOf(t)].push(t); used++; }
  for (const [, , k] of order){ const c = chunkOf(k, openSet);
    for (const f of c.fields) fields.push(f); for (const f of c.kebun) kebun.push(f); for (const h of c.huts) huts.push(h); used += c.fields.length + c.kebun.length + c.huts.length;
    for (const t of c.trees){ const kd = kindOf(t); if (used >= PROP_CAP || spots[kd].length >= TREE_CAP) break; spots[kd].push(t); used++; } }
  for (const [kind, list] of Object.entries(spots)){ const m = treeMeshes[kind]; list.forEach((t, k) => { _q.setFromAxisAngle(_v3.set(0,1,0), t[3]); _m4.compose(_v3.set(t[0], Y0, t[1]), _q, _s3.set(t[2], t[2], t[2])); m.setMatrixAt(k, _m4); m.setColorAt(k, _ca.setRGB(.85 + r() * .25, .85 + r() * .25, .85 + r() * .2)); });
    m.count = list.length; syncInk(m); m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
  const put = (m, list, y) => { list.slice(0, m.instanceMatrix.count).forEach((d, k) => { _q.setFromAxisAngle(_v3.set(0,1,0), d[2] || 0); _m4.compose(_v3.set(d[0], y, d[1]), _q, _s3.set(1,1,1)); m.setMatrixAt(k, _m4); }); m.count = Math.min(list.length, m.instanceMatrix.count); syncInk(m); m.instanceMatrix.needsUpdate = true; };
  put(fieldMesh, fields, YL.kavling + .005); put(kebunMesh, kebun, YL.kavling + .005); put(hutMesh, huts, YL.kavling);
  fillLamps(tx0, tz0); for (const h of PROP_HOOKS) h(tx0, tz0);   // di atas bidang kavling (Y0 + .02); di YL.tanah sawah/kebun tertutup kavling 'hutan' distrik tertutup
}
function paintTrees(open){ refreshChunks(true); }

/* ---------- sungai, bukit, gunung, awan ---------- */
const riverGeo = new THREE.PlaneGeometry(MAP + 300, RIVER_W, LOW ? 40 : 140, 4); riverGeo.rotateX(-Math.PI / 2);
const river = new THREE.Mesh(riverGeo, toonMat({ color: lin(PAL.air), transparent: true, opacity: .94 }));   // toon tanpa kilap specular
river.position.set(0, Y0 + .2, RIVER_Z); river.receiveShadow = true; scene.add(river);   // ombak ±.26 → lembah ombak tetap ≥ tanah
const riverBase = riverGeo.attributes.position.array.slice();
(function hills(){
  P = []; const r = rng(7);
  for (let k = 0; k < 30; k++){ const a = k / 30 * Math.PI * 2, d = LHALF + (70 + r() * 110) * KT, s = (40 + r() * 55) * KT; cone(s, s * .7, Math.cos(a) * d, -2, Math.sin(a) * d, r() < .5 ? '#7F9469' : '#8CA072'); }
  for (let k = 0; k < 14; k++){ const a = k / 14 * Math.PI * 2 + .2, d = LHALF + (330 + r() * 150) * KT, s = (110 + r() * 90) * KT; cone(s, s * 1.05, Math.cos(a) * d, -4, Math.sin(a) * d, '#8A969A'); cone(s * .3, s * .3, Math.cos(a) * d, s * .74, Math.sin(a) * d, '#A3B0B6'); }
  const m = new THREE.Mesh(merge(P, false, { soft: true }), VMAT); scene.add(m);   // tinta lembut ×,20 (spek §2.5: gunung INKMAT_SOFT)
})();
const CLOUD_MAT = toonMat({ color: lin('#EDE9E0'), emissive: lin('#3A4A5C'), emissiveIntensity: .35 });
const CLOUD_INK = inkMat(INK_MUL_SOFT, .15);   // kulit awan (spek §2.8: INKMAT_SOFT uMax ,15), warna diikat ke CLOUD_MAT di applyTime
const clouds = (() => { P = []; sph(9, 0, 0, 0, '#FFFFFF', 6); sph(7, 8, 1, 2, '#FFFFFF', 5); sph(6.5, -8, -.5, -1, '#FFFFFF', 4.5); sph(5, 3, 3, -4, '#FFFFFF', 4);   // putih = pengali; warna dari CLOUD_MAT
  // geometri badan saja + onormal (copies:false); kulit = InstancedMesh kedua (BackSide CLOUD_INK) berbagi instanceMatrix. Awan donatur memakai geometri badan yang sama.
  const m = new THREE.InstancedMesh(merge(P, false, { soft: true, hullAll: true, copies: false }), CLOUD_MAT, 16); const r = rng(11); m.userData.list = [];
  for (let k = 0; k < 16; k++) m.userData.list.push({ x: (r() - .5) * 1100 * KT, y: (150 + r() * 70) * KT, z: (r() - .5) * 1100 * KT, s: (.8 + r() * 1.4) * KT, sp: 1.5 + r() * 2 });
  const ink = new THREE.InstancedMesh(m.geometry, CLOUD_INK, 16); ink.instanceMatrix = m.instanceMatrix; ink.frustumCulled = m.frustumCulled; m.userData.ink = ink;
  scene.add(m, ink); return m; })();

/* ---------- awan donatur (1 jam tayang per Rp1.000, maks 6) ---------- */
const DONOR_MAT = new THREE.MeshLambertMaterial({ color: lin('#FFE7A0'), emissive: lin('#F2B531'), emissiveIntensity: .35, transparent: true, opacity: .82, depthWrite: false });
const donorClouds = [];
function setDonorClouds(list){
  for (const d of donorClouds){ scene.remove(d.mesh); d.label.remove(); } donorClouds.length = 0;
  const t = now(); const act = (list || []).filter(d => d.amount >= 1000 && Date.parse(d.at) + Math.floor(d.amount / 1000) * 3600000 > t).slice(0, 6);
  act.forEach((d, k) => { const mesh = new THREE.Mesh(clouds.geometry, DONOR_MAT); const s = (.55 + Math.min(.6, Math.log10(d.amount / 1000 + 1) * .25)) * KT; mesh.scale.set(s, s * .8, s);
    const lab = document.createElement('div'); lab.className = 'lbl donor'; lab.innerHTML = `<span>💛 ${esc(d.name)}</span>`; lab.dataset.donor = d.id; lab.dataset.act = 'open-donatur'; $('#labels').appendChild(lab);
    scene.add(mesh); donorClouds.push({ mesh, label: lab, d, a: k / Math.max(1, act.length) * Math.PI * 2 + .6, r: 60 + (k % 3) * 30, y: 120 + (k % 2) * 14 }); });   // di atas kamera peta bawaan (72,6 m di dist 110; 99 m di dist 150): lensa 41° tidak melihat langit, awan lebih rendah menutup kota
}
function stepDonorClouds(dt){ for (const c of donorClouds){ c.a += dt * .03; c.mesh.position.set(wx(108) + Math.cos(c.a) * c.r, c.y, wx(108) + Math.sin(c.a) * c.r); } }

/* ---------- lampu jalan (profil §4.8: arteri tiap 2 petak di strip tanam dua sisi + lampu ganda di median tiap 4 petak; kolektor terbuka tiap 3 petak di trotoar barat)
   + tiang listrik beton 7,5 m di bahu gang & kabel ---------- */
const LAMP_CAP = 6000, ELEC_CAP = 2600, LAMP_ARM = 1.3, LAMP_Y = 5.42, POLE_H = 7.5;
P = []; box(.14, 5.6, .14, 0, 0, 0, PAL.besi); box(1.5, .1, .14, -.7, 5.45, 0, PAL.besi);   // tiang lampu 5,6 m + lengan 1,5 ke −x lokal (diputar ke arah badan jalan)
const lampPoles = new THREE.InstancedMesh(merge(P, true, { ink: 0 }), VMAT_I, LAMP_CAP);
/* instanceColor WAJIB dialokasikan di sini (pola elecPoles/pohon): count diset 0 di bawah sebelum buildLamps, dan setColorAt r128 membuat atribut
   sepanjang this.count·3 = 0 → warna instans terbaca 0 → tiang hitam murni (0,0,0) (verifikasi akhir2: 3.324 instans), dan atribut instans lebih pendek
   dari jumlah instans bisa memicu INVALID_OPERATION di sebagian implementasi WebGL. Warna tiang = PAL.besi #2B2B2B (spek §3) × 1. */
lampPoles.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(LAMP_CAP * 3).fill(1), 3);
const LAMP_HEAD = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
const lampHeads = new THREE.InstancedMesh(new THREE.BoxGeometry(.6, .16, .34), LAMP_HEAD, LAMP_CAP);
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(255,225,150,.7)'); g.addColorStop(.35,'rgba(255,200,110,.40)'); g.addColorStop(1,'rgba(255,190,90,0)'); x.fillStyle = g; x.fillRect(0,0,64,64); return new THREE.CanvasTexture(c); })();
// pendar: pusat alfa ,7 (lama 1) / ,40 di 35 % jari-jari (lama ,45) — integrasi r1: pendar di atas kepala lampu & etalase melewati V ,9 (c2a applyTime)
/* Campuran "screen" (hasil = src·(1 − dst) + dst, src = warna × alfa), bukan aditif: pendar di atas piksel terang (jendela malam ≤ sRGB ,86) hanya
   menambah src·(1 − ,86) → tidak pernah melewati V ,9 walau tumpang-tindih jendela; di atas tanah gelap hampir sama dengan aditif (×,7–,85).
   Verifikasi akhir3: aditif → arteri-20 1 px V ,937 (jendela 215 + pendar jauh α ≈ ,1). Tanpa pass tambahan. */
const lampGlow = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ map: glowTex, size: 9, transparent: true, depthWrite: false, toneMapped: false, premultipliedAlpha: true,
  blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneMinusDstColorFactor, blendDst: THREE.OneFactor }));
lampPoles.castShadow = true; noInkShadow(lampPoles); lampPoles.count = lampHeads.count = 0; lampPoles.frustumCulled = lampHeads.frustumCulled = lampGlow.frustumCulled = false; scene.add(lampPoles, lampHeads, lampGlow);
P = []; box(.2, POLE_H, .2, 0, 0, 0, PAL.beton); box(1.4, .1, .1, 0, POLE_H - .5, 0, PAL.beton);   // tiang listrik beton
const elecPoles = new THREE.InstancedMesh(merge(P, true, { ink: 0 }), VMAT_I, ELEC_CAP); elecPoles.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(ELEC_CAP * 3).fill(1), 3); elecPoles.count = 0; elecPoles.frustumCulled = false; scene.add(elecPoles);
/* Kabel memudar menurut jarak DATAR dari titik tatap kamera: penuh ≤ CABLE_FADE[0], hilang ≥ CABLE_FADE[1]. Verifikasi akhir3: kabel 1 px perangkat
   seluruh distrik terbuka bertumpuk jadi pita gelap di cakrawala pandangan rendah (jalan-15 y 40–47: 33–40 % piksel V<.28; jalan-20 67–70 %);
   FogExp2 hanya ±21 % di 870 u. Spek §2.6/§7.6: kabel = bagian garis chunk dan garis chunk > 120 u dari titik tatap dimatikan → di sini pudar halus
   (bukan putus tiba-tiba) di 150–210 u; tetap satu draw call, tanpa pass. uCT diisi onBeforeRender (cam dari c2e). */
const CABLE_FADE = [150, 210], CABLE_U = { uCT: { value: new THREE.Vector2() } };
const cableMat = new THREE.LineBasicMaterial({ color: lin(PAL.besi), transparent: true, depthWrite: false }); let cables = null;
cableMat.onBeforeCompile = sh => { Object.assign(sh.uniforms, CABLE_U);
  sh.vertexShader = 'uniform vec2 uCT;\nvarying float vCD;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n\tvCD = distance( ( modelMatrix * vec4( transformed, 1.0 ) ).xz, uCT );');
  sh.fragmentShader = 'varying float vCD;\n' + sh.fragmentShader.replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
    `gl_FragColor = vec4( outgoingLight, diffuseColor.a * ( 1.0 - smoothstep( ${CABLE_FADE[0].toFixed(1)}, ${CABLE_FADE[1].toFixed(1)}, vCD ) ) );`); };
cableMat.customProgramCacheKey = () => 'kabel-pudar';
function fillLamps(tx0, tz0){
  if (!LAMP_SPOTS) return; const R2 = LAMP_R * LAMP_R, near = (x, z) => (x - tx0) ** 2 + (z - tz0) ** 2 < R2, gp = []; let n = 0;
  const _up = _t.set(0, 1, 0);
  for (const [x, z, a] of LAMP_SPOTS){ if (n >= LAMP_CAP) break; if (!near(x, z)) continue; _q.setFromAxisAngle(_up, a); _m4.compose(_v3.set(x, Y0, z), _q, _s3.set(1, 1, 1)); lampPoles.setMatrixAt(n, _m4);
    const hx = x - Math.cos(a) * LAMP_ARM, hz = z + Math.sin(a) * LAMP_ARM; _m4.compose(_v3.set(hx, Y0 + LAMP_Y, hz), _q, _s3.set(1, 1, 1)); lampHeads.setMatrixAt(n, _m4); gp.push(hx, Y0 + LAMP_Y - .3, hz); n++; }
  lampPoles.count = lampHeads.count = n; lampPoles.instanceMatrix.needsUpdate = lampHeads.instanceMatrix.needsUpdate = true;
  lampGlow.geometry.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); lampGlow.geometry.computeBoundingSphere();
  let m = 0; if (ELEC_SPOTS) for (const [x, z] of ELEC_SPOTS){ if (!near(x, z)) continue; _m4.makeTranslation(x, Y0, z); elecPoles.setMatrixAt(m++, _m4); }
  elecPoles.count = m; elecPoles.instanceMatrix.needsUpdate = true; }
function buildLamps(open){
  const spots = [], gp = [], A = ROADP[3], sx = A.hw + .3;   // lampu arteri di tengah strip tanam (5,0–5,6)
  const _up = new THREE.Vector3(0, 1, 0), rot = (x, z, a) => { _q.setFromAxisAngle(_up, a); return _q; };   // jangan pakai _v3 di sini: _v3 sedang membawa posisi
  // sudut a: lengan (−x lokal) mengarah ke (−cos a, 0, sin a) → a = π lengan ke +x, 0 ke −x, π/2 ke +z, −π/2 ke −z
  for (const c of COLS){
    if (c.cls === 3) for (let j = 2; j < N; j += 2){ if (roadJ(j)) continue; spots.push([c.x - sx, wx(j), Math.PI], [c.x + sx, wx(j), 0]); if (j % 4 === 2) spots.push([c.x, wx(j) + T / 2, 0], [c.x, wx(j) + T / 2, Math.PI]); }
    else for (let j = 2; j < N; j += 3){ if (roadJ(j) || !inMap(c.c0, j) || !open.has(districtOf(c.c0, j))) continue; spots.push([c.x - ROADP[2].hw - .35, wx(j), Math.PI]); } }
  for (const r of ROWS) if (r.cls === 3) for (let i = 2; i < N; i += 2){ if (roadI(i)) continue; spots.push([wx(i), r.z - sx, Math.PI / 2], [wx(i), r.z + sx, -Math.PI / 2]); if (i % 4 === 2) spots.push([wx(i) + T / 2, r.z, Math.PI / 2], [wx(i) + T / 2, r.z, -Math.PI / 2]); }
  LAMP_SPOTS = spots;
  // tiang listrik: bahu gang sisi selatan (as gang + 1,5), pitch 3 petak (distrik terbuka ring 0-1); kabel 7,0 melendut ke 6,55
  const ep = [], lines = [], yK = Y0 + POLE_H - .5, yS = yK - .45;
  for (const k of DISTRICTS){ if (!open.has(k) || distRing(k) > 1) continue; const [i0, j0, i1, j1] = DIST_RECT[k];
    for (const r of ROWS) if (r.cls === 1 && r.j > j0 && r.j < j1){ let prev = null; for (let i = i0 + 2; i < i1; i += 3){ if (roadI(i)) continue; const x = wx(i) + .4, z = r.z + ROADP[1].hw + ROADP[1].bahu / 2; ep.push([x, z]); if (prev && ep.length <= ELEC_CAP && x - prev[0] < 3.5 * T) lines.push(prev[0], yK, prev[1], (prev[0] + x) / 2, yS, z, (prev[0] + x) / 2, yS, z, x, yK, z); prev = [x, z]; } } }
  ELEC_SPOTS = ep.slice(0, ELEC_CAP); fillLamps(Math.round(cam.tx / 48) * 48, Math.round(cam.tz / 48) * 48);
  if (cables){ scene.remove(cables); cables.geometry.dispose(); } cables = new THREE.LineSegments(new THREE.BufferGeometry(), cableMat); cables.geometry.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
  cables.onBeforeRender = () => CABLE_U.uCT.value.set(cam.tx, cam.tz); scene.add(cables);
}
