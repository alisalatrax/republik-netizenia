/* ---------- Tahap 7+9 kelompok "jalan": props jalan khas Indonesia di trotoar / bahu / pelataran gang (BUKAN lajur) ----------
   Isi: pos ronda kayu di mulut gang, gerobak PKL (bakso/es/gorengan) berpayung, tong sampah oranye/hijau, motor parkir di depan
   warung/toko/ruko/kafe/bengkel yang menghadap jalan, pot bunga/pohon kecil, galon + bangku kayu di depan warung.
   Anggaran (tugas tahap 79): 2 InstancedMesh = 2 draw call (+1 pass bayangan, hanya kit besar di desktop). Tiap kit = beberapa VARIAN dalam satu
   geometri; varian lain digeser jauh lewat matriks instans (JL_OFF, lihat jlMesh) → dibuang klip (tidak dirasterisasi); materi VMAT_I bersama
   (0 program shader baru). Kit kecil ±234 segitiga tanpa kulit, kit besar ±240 segitiga (kulit tinta hanya badan
   gerobak, atap pos ronda, payung). renderer.info menghitung segitiga seluruh kit × instans (batas atas), yang benar-benar terlihat ±¼–½-nya.
   Penempatan deterministik (hash bilangan jlH), dihitung per distrik terbuka (cache) dan disaring radius dari titik tatap + cap, terdekat dulu.
   Diisi ulang hanya lewat PROP_HOOKS (titik tatap pindah sel 48 u) dan saat bangunan berubah (paintLots dibungkus, ditunda 30 ms). */
const JL_R = MOBILE ? 260 : 420, JL_CAP_S = MOBILE ? 44 : LOW ? 84 : 120, JL_CAP_B = MOBILE ? 14 : LOW ? 26 : 36;
const JL_USAHA = { warung: 1, toko: 1, ruko: 1, kafe: 1, bengkel: 1 };
// kit kecil (tanpa kulit): 0 tong sampah · 1 pot bunga/pohon kecil · 2 motor parkir · 3 bangku kayu + galon
// kit besar (berkulit): 0 pos ronda · 1 gerobak PKL berpayung
const JL_OFF = 5000;   // geser antar-varian (lihat jlMesh)
const JL_GEO = (() => {
  const c6 = (r, h, x, y, z, c) => P.push({ g: 'cyl6', s: [r * 2, h, r * 2], p: [x, y + h / 2, z], c });
  const kit = list => { const n = list.reduce((s, g) => s + g.attributes.position.count, 0), out = new THREE.BufferGeometry();
    for (const nm of ['position', 'normal', 'color', 'flag', 'onormal']){ const a0 = list[0].attributes[nm], arr = new a0.array.constructor(n * a0.itemSize); let o = 0;
      for (const g of list){ arr.set(g.attributes[nm].array, o); o += g.attributes[nm].array.length; } out.setAttribute(nm, new THREE.BufferAttribute(arr, a0.itemSize, a0.normalized)); }
    const pa = out.attributes.position.array; let o = 0; list.forEach((g, k) => { const e = o + g.attributes.position.count * 3; for (let q = o; q < e; q += 3) pa[q] -= JL_OFF * k; o = e; });   // varian k digeser −JL_OFF·k di x lokal
    out.computeBoundingSphere(); return out; };
  const S = [], B = [];
  // tong sampah plastik: badan putih (diwarnai instanceColor oranye/hijau) + tutup lebih gelap
  P = []; c6(.27, .74, 0, 0, 0, '#FFFFFF'); box(.5, .07, .5, 0, .74, 0, '#B8B8B8'); S.push(merge(P, true, { ink: 0 }));
  // pot terakota + perdu (skala instans 1–1,5 → pot bunga / pohon kecil)
  P = []; c6(.28, .42, 0, 0, 0, '#A8553B'); P.push({ g: 'sph8', s: [.84, .9, .84], p: [0, .82, 0], c: PAL.pohon.tengah }); S.push(merge(P, true, { ink: 0 }));
  // motor bebek/matik 1,8 m: hidung ke −z lokal (menghadap kavling), badan putih diwarnai instanceColor
  P = []; for (const z of [-.62, .62]) box(.1, .5, .5, 0, 0, z, PAL.ban); box(.3, .34, 1.1, 0, .28, .05, '#FFFFFF'); box(.4, .62, .22, 0, .3, -.48, '#FFFFFF');
  box(.3, .12, .66, 0, .62, .22, '#2B2B2B'); box(.64, .06, .06, 0, .98, -.52, '#2B2B2B'); S.push(merge(P, true, { ink: 0 }));
  // bangku panjang kayu (sejajar muka, x lokal) + 2 galon bertumpuk di ujung
  P = []; box(1.5, .06, .36, 0, .42, 0, PAL.kayu[0]); for (const x of [-.62, .62]) box(.07, .42, .3, x, 0, 0, PAL.kayu[1]);
  c6(.15, .36, 1.05, 0, 0, '#7FA6C9'); c6(.15, .36, 1.05, .41, 0, '#93B8D8'); S.push(merge(P, true, { ink: 0 }));   // 2 galon Ø ,3 × ,36 bertumpuk (celah leher ,05; atas lebih pucat) — 84 segitiga varian
  // pos ronda 2 × 2: panggung kayu ,45, 4 tiang, dinding belakang anyaman setengah tinggi (−z), atap limas genteng, kentongan di tiang depan
  P = []; for (const a of [-.92, .92]) for (const b of [-.92, .92]) box(.12, 2.35, .12, a, 0, b, PAL.kayu[1]); box(2.0, .1, 2.0, 0, .45, 0, PAL.kayu[0]);
  box(1.95, .8, .06, 0, .55, -.95, '#C9A86A'); pyr(2.7, .8, 2.7, 0, 2.3, 0, GENTENG[0]); box(.12, .45, .12, .92, 1.35, 1.06, PAL.kayu[2]); B.push(merge(P, true));
  // gerobak PKL (panjang di x lokal): badan krem (diwarnai varian), etalase kaca, 2 roda, pegangan, payung pada tiang
  P = []; box(1.4, .72, .62, 0, .36, 0, '#EDE6D6'); P.push({ g: 'box', s: [.86, .44, .52], p: [-.14, 1.08 + .22, 0], c: KACA[0], noHull: true });
  for (const z of [-.36, .36]) box(.5, .5, .08, .2, 0, z, PAL.ban); box(.5, .05, .05, .95, .86, 0, PAL.kayu[1]); box(.05, 1.45, .05, -.55, 1.08, -.35, PAL.besi);
  P.push({ g: 'cone8', s: [2.1, .45, 2.1], p: [-.55, 2.55 + .22, -.35], c: '#FFFFFF' }); B.push(merge(P, true));   // payung ,15 lebih ke arah kavling (sela ke kerb)
  return { s: kit(S), b: kit(B) };
})();
/* Integrasi tahap 7+9: TANPA program shader baru (dulu 'ink+lantai+varian' + 'depth-varian' → dikompilasi saat props tampil pertama = +ltMax HP).
   Varian dipilih lewat matriks instans: varian k disimpan bergeser −JL_OFF·k di x lokal; instans varian v = M · T(JL_OFF·v, 0, 0) → varian v
   tepat di tempat, varian lain ≥ JL_OFF·,85 = 4,25 km mendatar → di luar far kamera (2,4 km dari kamera; props ≤ 420 u dari titik tatap)
   dan di luar kotak bayangan (±span, far 600) → dibuang klip, tidak dirasterisasi. Materi = VMAT_I / DEPTH_NOINK_I yang sudah dipakai pohon & lampu. */
const jlMesh = (geo, cap, shadow) => { const m = new THREE.InstancedMesh(geo, VMAT_I, cap); m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3).fill(1), 3);
  m.count = 0; m.frustumCulled = false; m.receiveShadow = true; m.castShadow = shadow; inkInstanced(m); scene.add(m); return m; };
const _jlT4 = new THREE.Matrix4();
const jlS = jlMesh(JL_GEO.s, JL_CAP_S, false), jlB = jlMesh(JL_GEO.b, JL_CAP_B, !MOBILE && !LOW && !NO_SHADOW);
const JL_TINT = { tong: ['#D9772E', '#4F8A4A', '#D9772E'].map(c => lin(c)), pot: ['#FFFFFF', '#F4E2E2', '#E9F0DE'].map(c => lin(c)),
  motor: ['#B5473A', '#3E6FB0', '#3A3D42', '#E3DED2', '#8E979C', '#B5473A'].map(c => lin(c)), gerobak: ['#B4CBE2', '#EDC3C3', '#EAD496', '#A9D0C6'].map(c => lin(c)), kayu: lin('#FFFFFF') };
// radius jejak (u) untuk uji tabrakan dengan tiang lampu/listrik/pohon dan antar-props
const JL_RAD = { s0: .35, s1: .45, s2: .9, s3: 1.0, b0: 1.5, b1: 1.15 };
let jlObs = null, jlObsKey = '';
const jlDist = new Map();
// hash bilangan bulat cepat (deterministik; pengganti hashStr string di lingkar per kavling)
const jlH = (a, b, c) => { let h = Math.imul(a + 0x632BE5AB, 0x85EBCA6B) ^ Math.imul(b + 0x9E3779B1, 0xC2B2AE35) ^ Math.imul(c + 0x27D4EB2F, 0x165667B1); h ^= h >>> 15; h = Math.imul(h, 0x2C1B3C6D); h ^= h >>> 13; return h >>> 0; };
// grid titik sel 4 u, kunci bilangan: [x, z, r]
const jlGrid = () => new Map(), jlGK = (a, b) => (a + 4096) * 8192 + b + 4096;
const jlGAdd = (g, x, z, r) => { const k = jlGK(Math.floor(x / 4), Math.floor(z / 4)); let l = g.get(k); if (!l) g.set(k, l = []); l.push([x, z, r]); };
const jlGHit = (g, x, z, r) => { const c0 = Math.floor((x - r - 1.6) / 4), c1 = Math.floor((x + r + 1.6) / 4), d0 = Math.floor((z - r - 1.6) / 4), d1 = Math.floor((z + r + 1.6) / 4);
  for (let a = c0; a <= c1; a++) for (let b = d0; b <= d1; b++){ const l = g.get(jlGK(a, b)); if (l) for (const q of l) if ((q[0] - x) ** 2 + (q[1] - z) ** 2 < (r + q[2]) ** 2) return true; } return false; };
// rintangan: tiang lampu, tiang listrik (semua, sekali per susunan jalan) + pohon chunk distrik (ditambah malas per distrik yang diproses & tetangganya)
function jlObstacles(){
  const key = [...openSet].sort().join(',') + '|' + (LAMP_SPOTS ? LAMP_SPOTS.length : 0) + '|' + (ELEC_SPOTS ? ELEC_SPOTS.length : 0);
  if (jlObs && key === jlObsKey && jlObs.lamps === LAMP_SPOTS) return jlObs;
  const g = jlGrid(); for (const s of LAMP_SPOTS || []) jlGAdd(g, s[0], s[1], .25); for (const s of ELEC_SPOTS || []) jlGAdd(g, s[0], s[1], .25);
  jlObs = { g, lamps: LAMP_SPOTS, trees: new Set() }; jlObsKey = key; jlDist.clear(); return jlObs; }
function jlTrees(o, k){ const n = +k.slice(1), ci = n % 5, cj = Math.floor(n / 5);
  for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++){ const a = ci + di, b = cj + dj; if (a < 0 || b < 0 || a > 4 || b > 4) continue; const kk = 'k' + String(b * 5 + a).padStart(2, '0');
    if (!openSet.has(kk) || o.trees.has(kk)) continue; o.trees.add(kk); for (const t of chunkOf(kk, openSet).trees) jlGAdd(o.g, t[0], t[1], .55); } }
const jlFree = (o, x, z, r) => !jlGHit(o.g, x, z, r);
// kelas jalan di sisi f kavling (i, j): 0 bila tetangga kavling (bukan muka jalan)
const jlRoad = (i, j, f) => f === 0 ? roadJ(j + 1) : f === 2 ? roadJ(j - 1) : f === 1 ? roadI(i + 1) : roadI(i - 1);
// bingkai muka: titik tengah tepi kavling e, arah keluar n = FACE_DIR[f], arah sepanjang muka t = (cos a, −sin a), a = atan2(nx, nz)
function jlFrame(cx, cz, half, f){ const n = FACE_DIR[f], a = Math.atan2(n[0], n[1]); return { ex: cx + n[0] * half, ez: cz + n[1] * half, nx: n[0], nz: n[1], tx: Math.cos(a), tz: -Math.sin(a), a }; }
const jlAt = (F, u, d) => [F.ex + F.tx * u + F.nx * d, F.ez + F.tz * u + F.nz * d];
/* Calon statis per distrik terbuka (tidak bergantung bangunan; disaring bangunan saat isi ulang):
   kolektor (trotoar 1,4): tong sampah 1/4 muka di batas kavling, gerobak 1/8, pot 1/5 rapat ke tepi kavling
   arteri (trotoar 2,22 di luar strip tanam): tong 1/3 dan pot (ring 0: 1/2, lainnya 1/4) dekat strip tanam, gerobak 1/7
   gang (pelataran 2,3): pos ronda di mulut gang (1/3 mulut), gerobak parkir 1/11, pot 1/4 mengapit pintu, tong 1/5
   Baris kavling yang bersebelahan dengan arteri (zebra & mulut simpang) dan ujung muka di pojok simpang dilewati. */
function jlDistrict(k){
  const o = jlObstacles(); let L = jlDist.get(k); if (L) return L; L = []; jlDist.set(k, L); jlTrees(o, k);
  const [i0, j0, i1, j1] = DIST_RECT[k], ring = distRing(k), Lg = jlGrid();
  const put = (F, u, d, kit, v, tint, sc, rot, lot, f, kind) => { const [x, z] = jlAt(F, u, d), r = JL_RAD[kit + v] * (sc || 1); if (!jlFree(o, x, z, r) || jlGHit(Lg, x, z, r)) return;
    jlGAdd(Lg, x, z, r); L.push({ x, z, r, kit, v, tint, sc: sc || 1, a: F.a + (rot || 0), lot, f, u, d, kind }); };
  for (let j = j0; j < Math.min(j1, N); j++) for (let i = i0; i < Math.min(i1, N); i++){ if (!isLot(i, j)) continue;
    const lot = j * N + i;
    for (let f = 0; f < 4; f++){ const c = jlRoad(i, j, f); if (!c) continue;
      const along = f % 2 === 0, F = jlFrame(wx(i), wx(j), T / 2, f), H = jlH(i, j, f);
      // ujung muka: tetangga sepanjang t (u > 0 / u < 0) masih kavling? kalau tidak → pojok simpang, jangan taruh di |u| > 2,6
      const nb = s => { const di = Math.round(F.tx) * s, dj = Math.round(F.tz) * s; return isLot(i + di, j + dj); }, okU = u => Math.abs(u) <= 2.6 || nb(Math.sign(u));
      if (c >= 2){ const nearArt = along ? (roadI(i - 1) >= 2 || roadI(i + 1) >= 2) && c === 3 : (roadJ(j - 1) === 3 || roadJ(j + 1) === 3);
        if (nearArt) continue;
        if (c === 2){
          if (H % 4 === 1 && okU(3.55)) put(F, 3.55, 1.0, 's', 0, H >> 4, 1, 0, lot, f, 'pinggir');
          if (H % 8 === 5) put(F, (H >> 5) & 1 ? 1.7 : -1.7, .55, 'b', 1, H >> 6, 1, 0, lot, f, 'pkl');
          if (H % 5 === 2) put(F, -2.6, .35, 's', 1, H >> 7, .95 + ((H >> 9) & 3) * .12, 0, lot, f, 'potRumah');
        } else {
          if (H % 3 === 0 && okU(3.6)) put(F, 3.6, 1.85, 's', 0, H >> 4, 1, 0, lot, f, 'pinggir');
          if (H % 7 === 3) put(F, (H >> 5) & 1 ? 1.4 : -1.2, 1.25, 'b', 1, H >> 6, 1, 0, lot, f, 'pkl');
          if ((ring === 0 ? H % 2 === 0 : H % 4 === 2)) put(F, -2.0, 1.85, 's', 1, H >> 7, 1.1 + ((H >> 9) & 3) * .13, 0, lot, f, 'pinggir');
        }
      } else {
        // gang: mulut gang = kavling ujung yang bersebelahan dengan jalan kolom (kolektor/arteri)
        const mouth = roadI(i - 1) >= 2 ? -1 : roadI(i + 1) >= 2 ? 1 : 0;
        // satu mulut gang = satu sisi jalan kolom × satu gang; pos ronda di 1/3 simpang gang×jalan, hanya satu sisi jalan dan satu sisi gang
        if (mouth){ const jg = f === 0 ? j + 1 : j - 1, Hm = jlH(jg, i + mouth, 7), side = (Hm >> 3) & 1 ? 0 : 2, sideX = (Hm >> 4) & 1 ? 1 : -1, u = 2.55 * mouth * Math.sign(F.tx || 1);
          if (Hm % 3 === 0 && mouth === sideX){ if (f === side) put(F, u, 1.15, 'b', 0, 0, 1, 0, lot, f, 'ronda'); else if ((Hm >> 5) % 2 === 0) put(F, u * .86, 1.05, 'b', 1, Hm >> 6, 1, 0, lot, f, 'pkl'); }
          continue; }
        if (H % 17 === 4) put(F, -2.3, 1.05, 'b', 1, H >> 6, 1, 0, lot, f, 'pkl');
        if (H % 3 === 1){ put(F, -1.5, .35, 's', 1, H >> 7, .85 + ((H >> 9) & 3) * .1, 0, lot, f, 'potRumah'); put(F, 1.5, .35, 's', 1, H >> 8, .85 + ((H >> 11) & 3) * .1, 0, lot, f, 'potRumah'); }
        if (H % 7 === 3 && okU(3.45)) put(F, 3.45, .45, 's', 0, H >> 4, 1, 0, lot, f, 'pinggir');
      } } }
  return L; }
/* Integrasi tahap 7+9: posisi pintu muka NYATA per model (bukan tengah muka). pintu() dicatat saat modelGeo membangun tipe usaha
   (x lokal = u sepanjang muka, karena inner.rotation.y = f·π/2 ≡ jlFrame.a); kunci tanpa warna → sekali per bentuk. Belum tercatat → tengah. */
const JL_DOORS = new Map(); let JL_REC = null;
{ const _pi = pintu; pintu = function(x, z, o){ if (JL_REC && !(o && o.rot) && z > 0) JL_REC.push([x, (o && o.w) || PINTU_W]); return _pi.apply(this, arguments); }; }
const jlDoorKey = (type, lw, lh, fl, zone, adj, seed) => [type, lw, lh, fl, zone, adj && adj.l ? 1 : 0, adj && adj.r ? 1 : 0, (seed | 0) & 3].join('|');
{ const _mg = modelGeo; modelGeo = function(type, c, w, lw, lh, fl, zone, rc, adj, seed){ if (!JL_USAHA[type]) return _mg.apply(this, arguments);
    const ct = catOf(type), k = jlDoorKey(type, lw || ct.w, lh || ct.h, fl || 1, zone || 'KAMPUNG', adj, seed), rec = JL_DOORS.has(k) ? null : [], prev = JL_REC; JL_REC = rec;
    try { return _mg.apply(this, arguments); } finally { JL_REC = prev; if (rec){ JL_DOORS.set(k, rec); jlDoorT = jlDoorT || setTimeout(jlDoorRefill, 1000); } } }; }
// bentuk usaha baru tercatat → isi ulang props sekali (digabung ≤ 1×/dtk selama pemuatan; bukan per frame)
let jlDoorT = 0; function jlDoorRefill(){ jlDoorT = 0; jlKey = ''; if (jlLast) fillJalan(jlLast[0], jlLast[1]); }
function jlDoors(b){ const f = facingOfB(b), lw = f % 2 ? b.h : b.w, lh = f % 2 ? b.w : b.h;
  const zone = b.zone || zoneOfLot(b.i, b.j, b.w, b.h), fl = b.floors || floorsFor(b.type, ringOf(b.i, b.j), lotClass(b.i, b.j, b.w, b.h));
  const D = JL_DOORS.get(jlDoorKey(b.type, lw, lh, fl, zone, adjOf(b), seedOf(b))); return D && D.length ? D : [[0, 1.0]]; }
// u (sepanjang muka, dari tengah muka) bebas dari jalur pintu: |u − x pintu| ≥ ½ lebar pintu + ,55 + r
const jlDoorFree = (D, u, r) => { for (const [x, w] of D) if (Math.abs(u - x) < w / 2 + .55 + r) return false; return true; };
const jlBld = id => { const b = id != null ? S.buildings.get(id) : null; return b || null; };
// muka depan bangunan b (bingkai jlFrame di tengah muka bangunan; half = setengah kedalaman tapak menurut hadap)
function jlFront(b){ const f = facingOfB(b), cx = wx(b.i) + (b.w - 1) * T / 2, cz = wx(b.j) + (b.h - 1) * T / 2; return { f, F: jlFrame(cx, cz, (f % 2 ? b.w : b.h) * T / 2, f), half: (f % 2 ? b.h : b.w) * T / 2,
  c: f === 0 ? roadJ(b.j + b.h) : f === 2 ? roadJ(b.j - 1) : f === 1 ? roadI(b.i + b.w) : roadI(b.i - 1) }; }
let jlLast = null, jlKey = '', jlOcc = null, jlT = 0;
function fillJalan(tx0, tz0){
  jlLast = [tx0, tz0]; if (typeof S === 'undefined' || !LAMP_SPOTS) return;
  const key = tx0 + ',' + tz0 + '|' + [...openSet].sort().join(',') + '|' + S.buildings.size + '|' + LAMP_SPOTS.length; if (key === jlKey && jlOcc === S.occ) return; jlKey = key; jlOcc = S.occ;
  const o = jlObstacles(), R2 = JL_R * JL_R, near = (x, z) => (x - tx0) ** 2 + (z - tz0) ** 2 < R2, out = [], fronts = new Set(), Ug = jlGrid();
  // bangunan usaha 'jadi' yang menghadap jalan: motor 2–3 di satu sisi pintu, warung + bangku/galon di sisi lain. Muka yang dipakai → calon statis dilewati.
  for (const b of S.buildings.values()){ if (!JL_USAHA[b.type] || b.stage !== 'jadi') continue; const cx = wx(b.i) + (b.w - 1) * T / 2, cz = wx(b.j) + (b.h - 1) * T / 2;
    if (!near(cx, cz) || !openSet.has(districtOf(b.i, b.j))) continue; const fr = jlFront(b); if (!fr.c) continue; jlTrees(o, districtOf(b.i, b.j)); const F = fr.F, H = hashStr('jlb' + b.id), DR = jlDoors(b), side = DR.length === 1 && Math.abs(DR[0][0]) > .5 ? -Math.sign(DR[0][0]) : H & 1 ? 1 : -1;   // motor di sisi yang jauh dari pintu
    for (let a = 0; a < b.w; a++) for (let c = 0; c < b.h; c++) fronts.add(((b.j + c) * N + b.i + a) * 4 + fr.f);
    const nM = b.type === 'bengkel' ? 3 : b.type === 'warung' || b.type === 'kafe' ? 1 + ((H >> 1) & 1) : 2 + ((H >> 1) & 1), par = fr.c === 2, step = par ? 2.0 : .82;
    const mine = [];
    const add = (u, d, v, tint, sc, rot) => { if (Math.abs(u) > fr.half - .5) return; if (!jlDoorFree(DR, v === 3 ? u + .22 : u, v === 2 ? .35 : v === 3 ? .98 : JL_RAD['s' + v])) return;   // bangku+galon: x lokal −,75 … +1,2
      const [x, z] = jlAt(F, u, d), r = JL_RAD['s' + v]; if (!jlFree(o, x, z, r)) return;
      const rr = v === 2 ? .35 : r; for (const q of mine) if ((q.x - x) ** 2 + (q.z - z) ** 2 < (rr + (q.v === 2 ? .35 : q.r)) ** 2) return; mine.push({ x, z, r, kit: 's', v, tint, sc, a: F.a + rot, kind: 'usaha' }); };
    for (let m = 0; m < nM; m++){ const u = side * ((par ? 2.0 : 1.5) + m * step), tilt = fr.c === 3 ? .5 * side : fr.c === 1 ? ((H >> (3 + m)) & 1 ? .25 : -.2) : 0;
      add(u, par ? .72 : 1.1, 2, (H >> (4 + m * 2)) % 6, 1, par ? Math.PI / 2 : tilt); }
    if (b.type === 'warung'){ const n0 = mine.length; for (const u of [-side * 2.3, -side * 1.9, side * 2.6]){ add(u, par ? .3 : .42, 3, 0, 1, 0); if (mine.length > n0) break; } }
    for (const q of mine){ q.dd = (q.x - tx0) ** 2 + (q.z - tz0) ** 2; jlGAdd(Ug, q.x, q.z, q.r); out.push(q); } }
  // calon statis distrik terbuka di sekitar titik tatap
  const ci0 = Math.floor(((tx0 - JL_R) / T + HALF) / PD), ci1 = Math.floor(((tx0 + JL_R) / T + HALF) / PD), cj0 = Math.floor(((tz0 - JL_R) / T + HALF) / PD), cj1 = Math.floor(((tz0 + JL_R) / T + HALF) / PD);
  // distrik baru (calon belum dihitung): paling banyak 1 per panggilan (±15 ms di HP 4× lambat); sisanya menyusul lewat setTimeout berantai (bukan per frame)
  let fresh = 0, pend = false;
  const ks = []; for (let dj = Math.max(0, cj0); dj <= Math.min(4, cj1); dj++) for (let di = Math.max(0, ci0); di <= Math.min(4, ci1); di++){ const k = 'k' + String(dj * 5 + di).padStart(2, '0');
    if (openSet.has(k)) ks.push([(wx(di * PD + PD / 2) - tx0) ** 2 + (wx(dj * PD + PD / 2) - tz0) ** 2, k]); }
  ks.sort((a, b) => a[0] - b[0]);
  for (const [, k] of ks){
    if (!jlDist.has(k)){ if (fresh++){ pend = true; continue; } }
    for (const q of jlDistrict(k)){ if (!near(q.x, q.z) || fronts.has(q.lot * 4 + q.f)) continue;
      const id = S.occ.get(q.lot), b = jlBld(id);
      if (q.kind === 'potRumah' && !(b && facingOfB(b) === q.f)) continue;   // pot pengapit pintu hanya di depan bangunan yang menghadap jalan ini
      if (b && facingOfB(b) === q.f){
        if (q.kind === 'ronda') continue;   // pos ronda tidak di depan bangunan yang menghadap gang
        if (q.d < 1.9){ const fr = jlFront(b), [px, pz] = [q.x - fr.F.ex, q.z - fr.F.ez], uu = px * fr.F.tx + pz * fr.F.tz; if (!jlDoorFree(JL_USAHA[b.type] ? jlDoors(b) : [[0, 1.0]], uu, q.r)) continue; }   // jalur pintu nyata (usaha) / tengah muka bebas
      }
      if (Ug.size && jlGHit(Ug, q.x, q.z, q.r)) continue;
      q.dd = (q.x - tx0) ** 2 + (q.z - tz0) ** 2; out.push(q); } }
  out.sort((a, b) => a.dd - b.dd);
  // motor ≤ ½ cap kit kecil (kawasan usaha padat tidak menghabiskan jatah tong/pot/bangku)
  const fill = (m, kit, cap) => { const sub = kit === 's' ? { 2: Math.round(cap * .5) } : {}, used = {}; let n = 0;
    for (const q of out){ if (q.kit !== kit) continue; if (n >= cap) break; if (sub[q.v] !== undefined && (used[q.v] = (used[q.v] || 0) + 1) > sub[q.v]) continue;
      _q.setFromAxisAngle(_v3.set(0, 1, 0), q.a); _m4.compose(_v3.set(q.x, Y0 - .01, q.z), _q, _s3.set(q.sc, q.sc, q.sc)); _m4.multiply(_jlT4.makeTranslation(JL_OFF * q.v, 0, 0)); m.setMatrixAt(n, _m4);
      const pal = kit === 'b' ? (q.v === 1 ? JL_TINT.gerobak : null) : q.v === 0 ? JL_TINT.tong : q.v === 1 ? JL_TINT.pot : q.v === 2 ? JL_TINT.motor : null;
      m.setColorAt(n, pal ? pal[(q.tint >>> 0) % pal.length] : JL_TINT.kayu); n++; }
    m.count = n; m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; return n; };
  fill(jlS, 's', JL_CAP_S); fill(jlB, 'b', JL_CAP_B);
  if (pend && !jlT) jlT = setTimeout(() => { jlT = 0; jlKey = ''; if (jlLast) fillJalan(jlLast[0], jlLast[1]); }, 60);
}
PROP_HOOKS.push(fillJalan);
// bangunan berubah (rebuildOcc → paintLots di c3/c4): isi ulang props sekali, ditunda & digabung (bukan per frame)
{ const _pl = paintLots; paintLots = function(){ const r = _pl.apply(this, arguments); if (!jlT) jlT = setTimeout(() => { jlT = 0; jlKey = ''; if (jlLast) fillJalan(jlLast[0], jlLast[1]); }, 30); return r; }; }
