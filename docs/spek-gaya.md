# Spesifikasi Gaya Visual — FINAL (v2) · Republik Netizenia (three.js r128, satu file HTML)

Kode sasaran: `(alat kerja internal) web/` (a_head.html, b_body.html, c1_core.js, c2_engine.js, c3_data.js, c4_ui.js).
Alat uji: `scratchpad/test/model_view.js`, `scratchpad/test/ink.js`, `scratchpad/test/ukur.js` (dibuat tahap 0).
Spek pendamping: `scratchpad/spec/spek-tata-kota.md` (grid 217×217, blok 6×2, kelas jalan). Spek ini hanya mengatur GAYA, SKALA, dan PIPELINE RENDER; pemetaan kelas jalan tata-kota → profil jalan ada di §4.8.

**ATURAN HAK CIPTA (mutlak):** tidak ada aset, model, tekstur, nama, teks, atau tata letak cityrt yang disalin. Yang ditiru hanya *gaya* (garis tinta tipis, cahaya hampir rata dengan bayangan jatuh kuat, palet pudar beragam dengan aksen jenuh, kepadatan fasad, variasi tinggi/kedalaman antar tetangga) dan *tingkat detail*. Semua geometri dari primitif sendiri dengan arsitektur Indonesia (limasan, joglo, ruko, warung, masjid, pos ronda, sawah). Gambar rujukan hanya pembanding ukur, tidak pernah dimuat halaman.

## Perubahan v1 → v2 (ringkas; rincian di tiap §)

| # | Keputusan v1 yang dibatalkan | Keputusan v2 |
|---|---|---|
| 1 | Model cahaya "sisi bayangan dinding 0,60" (TOON_GRAD [51,51,255], hemi 0,25) | **Dinding hampir rata (0,85–0,95), bayangan JATUH yang kuat (0,55)**: TOON_GRAD 2 texel [160,255], sun 0,62 / hemi 0,78 / exposure 0,72, lantai bayangan di shader (tanah 0,27 lin, dinding 0,62 lin) — §2.2 |
| 2 | Anggaran 1,15 jt tanpa hull & bayangan | Tabel baru dengan kolom hull + bayangan: **≈ 1,17 jt badan+hull, ≈ 0,48 jt pass bayangan, ≤ 150 draw call utama** — §8.2; batas tri per tipe −25 %, pohon hi 250 tri, hull hanya dari `bodyFar`, castShadow dibatasi |
| 3 | `onormal` via Map string per vertex, `EdgesGeometry` per model | **Prakomputasi `onormal` per primitif BASE + tabel sisi per primitif** (O(primitif), ≈ 0,1 ms/bangunan) — §2.6, §8.1 |
| 4 | Kunci cache `type|color|wall|seed|adj`, 4 atribut Float32 | Kunci `type|seed|adj`, atribut `slot` Uint8, warna diisi saat `rebuildChunk`, atribut Int8/Uint8 normalized (22 B/vertex), `bodyFar`/`hull` = drawRange dari array yang sama — §8.1 |
| 5 | Hull berbagi geometri dengan body; offset sebelum skala objek; satuan px perangkat | Hull dari `bodyFar` minus primitif tipis (`noHull`), offset dibagi skala objek, satuan **px CSS** (PX 1,4 peta / 1,8 tokoh, uMin 0,006) — §2.5 |
| 6 | Tinta `vColor*0.05` (≈ 0,26× sRGB) | `vColor*0.14 + (0.010,0.007,0.006)` (≈ 0,42× sRGB, hangat); pohon/awan 0,20 — §2.5 |
| 7 | Palet WALLS 8 krem; `lin()` desaturasi global 22 % ×0,95 | **WALLS 10 hue berbeda** dari hash id, GENTENG 50/30/10/10, `lin()` 8 % tanpa ×0,95, desaturasi 20 % hanya primitif `p.wall` — §3 |
| 8 | Kamera peta phi 1,20 (21°); tokoh phi 1,36 dist 9 | Peta **phi 0,85 (41°)**, ikat zoom 30°→49°; tokoh **mata 1,55 m, elevasi 5°, FOV 62/75** — §4.6–4.7 |
| 9 | Tapak bd 0,78 fz, ruko 2×1 = 15,2 lebar × 5,6 dalam, tinggi tetap per tipe, jalan seragam | bd 0,92 fz, **ruko dipecah 3 unit muka 5,0**, **lantai dari seed** (toko 2–4, kantor 4–8, apartemen 5–9), **hierarki jalan** (boulevard 9,0 + median, jalan 5,2, gang 2,6) — §4.3, §4.8, §6 |
| 10 | Sash gelap 0,15 m, pita bawah atap 0,45 darken 0,62, jeruji n batang | Reveal 0,05 `darken(wall,.70)` + kusen terang, **kaca 2 nada diagonal** (0 tri tambahan), pita 0,20/0,28 darken 0,74, railing = 1 pita + 2 rel — §5 |
| 11 | `BASE.hip` diskalakan | `hipGeo(w,d,h)` geometri inline per panggilan (jalur `p.g='custom'`) — §5 |
| 12 | `_e.set(rx, ry, 0)` (XYZ) | `_e.set(rx, ry, 0, 'YXZ')` — §5 |
| 13 | Deret rapat celah 0,4 + overhang 0,8 | **Celah 0**, overhang sisi adj 0,15 + pelana sejajar deret, adj di ruang lokal, tetangga ditandai dirty — §4.3 |
| 14 | normalBias 0,4 tetap; span 90–230 | Bias dari ukuran texel; span `clamp(dist·0,9, 60, 180)`; `applyHemat` tidak mematikan bayangan — §2.4 |
| 15 | Fog 150–620; vignette 20 %; langit siang S 0,24 | Fog **260–900**; vignette dihapus; langit 12:00 `#AFBCC9` (S 0,13) — §2.3, §2.8, §2.9 |
| 16 | Tiga ketinggian dasar (.02/.2/.37) | Satu konstanta **`Y0 = .2`** — §7.2 |
| 17 | Alas rumput semua tipe; sawah di tengah kota | Alas **paving** di distrik pusat/usaha, rumput di hunian; sawah hanya baris terluar, di pusat dirender sebagai kebun/greenhouse — §6 |
| 18 | Rig kepala besar, skala .365 | Proporsi 1:6,5 (kepala 0,26, badan 0,62, kaki 0,70), tanpa wajah — §4.4 |

## Mengapa render sekarang "tidak sesuai" — 4 akar masalah (urut dampak)

1. **Skala salah 2,5–3x.** Tokoh/NPC 4,2 unit vs dinding 2,9 dan pintu 1,9; mobil 4,2×2,1 lebih besar dari rumah; bangunan hanya 20–35 % kavling; tinggi lantai 2,1–3,8 tidak konsisten.
2. **Fasad kosong & kota seragam.** 8–14 elemen/fasad (rujukan 25–40); semua bangunan satu tipe sama tinggi; grid 41×41 dengan jalan seragam 3,6 tanpa hierarki; halaman kosong di belakang; kavling pusat berumput ("gedung di padang golf").
3. **Cahaya terlalu terang, tanpa bayangan jatuh.** Hemi 0,8 + sun 1,0 + ACES 1,16 → dinding 227, rumput 193 (rujukan 111–138); shadow map mati di LOW. Catatan: kontras dinding depan/samping di rujukan memang *kecil* (0,90–0,95) — yang kuat adalah bayangan jatuh di tanah (0,55). v1 salah membalik ini.
4. **Garis tinta salah jenis.** Hull 0,07 unit dunia (3 px dekat, 0,5 px jauh), hanya siluet, tinta flat `#3B2A1E`, nol garis interior.

---

## 1. Prinsip gaya (5 kalimat)

1. Semua tepi adalah **garis tinta tipis konstan di layar** — siluet 1,4 px CSS (mode peta) / 1,8 px CSS (mode tokoh), garis interior 1 px perangkat (≈ 0,67 px CSS pada dpr 1,5) — berwarna warna-lokal digelapkan ≈ 0,42× sRGB (hangat, bukan hitam), memudar bersama kabut.
2. Cahaya **hampir rata di dinding** (depan/samping sRGB 0,85–0,95), **bayangan jatuh keras dan kuat** di tanah/atap (sRGB 0,50–0,60), bergeser biru sedikit (B/G 1,05–1,15 siang), tanpa gradasi halus dan tanpa putih (dinding terang maks sRGB 225).
3. **Palet pudar beragam hue + aksen jenuh**: dinding 10 hue (krem, bata, oker, zaitun, biru-abu, pink pudar, abu tua, putih tulang) S 0,10–0,35; atap terakota S 0,55–0,65 / abu-tulis; rumput S 0,37–0,44 dua nada bergaris; aspal abu netral; langit siang S ≤ 0,16.
4. **Skala manusia konsisten**: 1 unit = 1 m, lantai 3,2 (dasar usaha 4,2), manusia 1,70 proporsi 1:6,5, pintu 1,0×2,1, mobil 4,3, bangunan 90 % lebar × 92 % dalam kavling, rapat ke tetangga (celah 0).
5. **Kepadatan + variasi terprogram**: tata bahasa fasad (≥ 25 elemen per fasad 8×8) dan variasi antar tetangga (jumlah lantai dari seed, warna dinding berbeda dari kiri, kedalaman muka ±0,15, parapet ±0,4), tetap ≤ 4 draw call per chunk.

---

## 2. Pipeline render (c2_engine.js)

### 2.1 Tone mapping, eksposur, `lin()`
- `renderer.toneMapping = THREE.LinearToneMapping; renderer.toneMappingExposure = 0.72;` (ganti ACESFilmic 1,16).
- `applyTime`: `renderer.toneMappingExposure = 0.72 - nightGlow*0.08` (malam 0,64).
- `lin(hex, wall)`: `c.lerp(grey, wall ? .20 : .08).convertSRGBToLinear()` — **tanpa ×0,95**. `merge()` memanggil `lin(p.c, !!p.wall)`; hanya primitif dinding (`dinding()`, plinth, pilaster, parapet) membawa `p.wall=true`. Aksen (atap, tenda, papan nama, pintu, daun jendela, rumput, kaca) lewat dengan desaturasi 8 % saja.
- Target ukur: atap merah S 0,55–0,65; dinding S 0,10–0,35; rumput S 0,37–0,44 (semua sRGB, jam 12–15).

### 2.2 Tingkat toon & model cahaya (prioritas dibalik dari v1)
- `TOON_GRAD = DataTexture(new Uint8Array([160, 255]), 2, 1, LuminanceFormat)`, `NearestFilter`, `generateMipmaps=false`, **`unpackAlignment = 1`** (lebar 2 bukan kelipatan 4). r128 memetakan `coord = dotNL*0.5+0.5` → texel 0 untuk NdotL < 0 (0,627), texel 1 untuk NdotL ≥ 0 (1,0). Permukaan DATAR (tanah, jalan, atap datar, sawah) punya NdotL = sin(elevasi) ≥ 0 sepanjang siang → **tidak pernah melompat** (masalah ambang 0,33 v1 hilang; tidak perlu gradient terpisah untuk tanah).
- Lampu: `sun.intensity 0.62`, `hemi = HemisphereLight('#C9D6E2', '#6E6A58', 0.78)`. Hitungan 12:00 (exposure 0,72): sisi terang = (0,62·1,0 + 0,78)·0,72 = **1,01** (tidak clipping untuk albedo ≤ 0,88); sisi menjauhi matahari = (0,62·0,627 + 0,78)·0,72 = 0,84 → rasio linear 0,835 → **sRGB 0,92** (target rujukan 0,90–0,95).
- **Lantai bayangan jatuh di shader** (VMAT, VMAT_I, material tanah/jalan/pohon/props; `onBeforeCompile` bersama `toonMat()`):
  - Vertex: setelah `#include <beginnormal_vertex>` sisipkan `vNy = objectNormal.y;` (deklarasi `varying float vNy;` di kedua shader; chunk/props/NPC hanya berotasi sumbu Y sehingga `objectNormal.y` = normal dunia y).
  - Fragment: deklarasi `float shK = 1.0; uniform float uFloorG, uFloorW;`. Di `lights_fragment_begin` ganti string persis `directLight.color *= all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( directionalShadowMap[ i ]` → `shK = all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( directionalShadowMap[ i ]` (diverifikasi ada di `lib/three.min.js` r128; pola WAJIB memuat `directionalShadowMap[ i ]` karena awalan yang sama dipakai cabang spot light lebih dulu; sisa ekspresi `…, vDirectionalShadowCoord[ i ] ) : 1.0;` tetap) — cahaya langsung TIDAK lagi dinolkan oleh shadow map.
  - Sebelum `gl_FragColor = vec4( outgoingLight, diffuseColor.a );` sisipkan `outgoingLight *= mix( vNy > 0.5 ? uFloorG : uFloorW, 1.0, shK );` dengan **`uFloorG = 0.27`** (tanah/atap: sRGB 0,27^0,4545 = 0,55) dan **`uFloorW = 0.62`** (dinding: sRGB 0,80).
  - Hasil: rumput terang/bayangan jatuh 0,55 sRGB (rujukan-inggris 0,55); dinding depan/samping 0,92; dinding dalam bayangan jatuh 0,80; dinding samping dalam bayangan 0,74. Kota tidak lagi "kubus berlampu sorot".
- Target ukur tahap 1 (jam 15:00, non-LOW): rasio dinding depan/samping **0,85–0,95**; rumput terang/bayangan jatuh **0,50–0,60**; piksel V < 0,4 = **10–18 %** (rujukan siang terukur 13–14 %); dinding terang sRGB 195–225; rumput 115–140; aspal V 0,28–0,32.

### 2.3 Cahaya per jam (`SKYKEYS`: jam, langit atas, cakrawala, warna matahari, sunI, hemiI, nyala jendela, bintang)
```
[0,   '#141B2E','#2B3447','#8C9BC2', .10,.30, 1, 1],
[4.6, '#1A2238','#343D52','#8C9BC2', .10,.32, 1,.9],
[5.6, '#737E99','#C9A9A0','#E8B48C', .40,.55,.7,.2],   // S .25 (boleh .23–.26 hanya di sini dan 17.8)
[7,   '#A4B5C4','#D9D8CC','#F3E3C4', .58,.70, 0, 0],   // S .16
[12,  '#AFBCC9','#D9D8CC','#FBF0DA', .62,.78, 0, 0],   // S .13
[16.3,'#B3B9C3','#DCD3C4','#F2D5AE', .60,.74, 0, 0],   // S .08
[17.8,'#8F94BE','#CDA7A4','#E59A78', .45,.55,.45,0],   // S .25
[19,  '#2F3552','#5C5468','#8C96B8', .15,.32, 1,.6],
[24,  sama dengan 0]
```
- Hemi: sky `#C9D6E2` → malam `#4A5470`; ground `#6E6A58` (abu hangat, BUKAN hijau) → malam `#1E2A3A`. Tidak ada pergeseran "merah −40 %": hemi sky biru-abu sudah memberi B/G 1,05–1,15 siang; 17:30 B/G ≈ 1,3 datang dari hemi malam.
- Shader langit: `pow(s,10.0)*0.22` → `*0.12`; `U.bot = hor*.9`.
- Sudut matahari: `ph = (h-6)/12*π`; `dir.set(cos(ph), max(0.40, sin(ph)), .38)` — elevasi minimum 23,6° sepanjang siang (bayangan terpanjang 2,3× tinggi; menjaga presisi shadow map pagi/sore).
- Target ukur bayangan jatuh siang: R/G = 1,0 ± 0,05, B/G 1,05–1,15; 17:30: B/G 1,3.

### 2.4 Bayangan matahari
- `renderer.shadowMap.type = THREE.PCFShadowMap`; `sun.shadow.radius = 1`.
- `LOW` (≤ 4 core / deviceMemory ≤ 3 / `?hemat=1`) **tetap memakai shadow map**: hanya `mapSize 1024`, span maks 140, pohon tier B tanpa castShadow. `LOW = QS.get('hemat')==='0' ? false : (…lama…)` agar alat uji bisa memaksa non-LOW. Hanya `?hemat=2` yang mematikan shadow map total.
- `applyHemat(auto)` (fps < 26): `mapSize 1024`, span maks 120, `setPixelRatio(1)`, pohon castShadow off, props tier jauh off — **shadowMap.enabled tetap true**.
- mapSize: desktop 2048, MOBILE 1536, LOW 1024.
- `applyCam` setelah `span = clamp(cam.dist * .9, 60, 180)` (LOW: maks 140; tokoh: dist 6,5 → 60):
  ```js
  const texel = 2 * span / sun.shadow.mapSize.x;
  sun.shadow.normalBias = texel * 1.2;      // 60/2048 → .07; 180/1536 → .28; 140/1024 → .33
  sun.shadow.bias = -texel * 0.002;
  sun.shadow.camera.near = 10; sun.shadow.camera.far = 600;
  ```
  Di luar span tidak ada bayangan (kabut mulai 260 u menyamarkan).
- `castShadow = true` HANYA untuk: chunk `body` ≤ 160 u, pohon tier A dan B (≤ 150 u), NPC, kendaraan, tokoh, props > 2 u dalam radius 120 u. `castShadow = false` untuk: chunk > 160 u, hull, edges, glow, pohon tier C, tanah/jalan (receive saja), awan, bukit.
- Antialias: `antialias: true` selalu; **`setPixelRatio(min(dpr, LOW ? 1.0 : 1.5))`** (1,5 juga untuk desktop; 1 px perangkat = 0,67 px CSS, cukup untuk garis interior).

### 2.5 Garis tinta — siluet (inverted hull, tebal konstan di layar, satuan px CSS)
```js
const INK_U = { uK: { value: 0.001 }, uMin: { value: 0.006 }, uMax: { value: 0.35 } };
function inkMat(mul){ const m = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, toneMapped: false, fog: true });
  m.onBeforeCompile = sh => { Object.assign(sh.uniforms, INK_U);
    sh.vertexShader = 'attribute vec3 onormal; uniform float uK, uMin, uMax;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      `#include <begin_vertex>
       #ifdef USE_INSTANCING
         mat4 mm = modelMatrix * instanceMatrix;
       #else
         mat4 mm = modelMatrix;
       #endif
       float sc = length(mm[0].xyz);                     // skala objek (abaikan skala y non-uniform saat 'bangun')
       vec4 mvp = viewMatrix * mm * vec4(transformed, 1.0);
       float th = clamp(-mvp.z * uK, uMin, uMax) / sc;
       transformed += onormal * th;`);
    sh.fragmentShader = sh.fragmentShader.replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
      'vec3 ink = vColor * ' + mul.toFixed(2) + ' + vec3(0.010, 0.007, 0.006); gl_FragColor = vec4(ink, 1.0);'); };
  return m; }
const INKMAT = inkMat(.14), INKMAT_I = inkMat(.14), INKMAT_SOFT = inkMat(.20); // SOFT: pohon, awan, gunung
```
- `uK = PX * 2*tan(fov/2) / innerHeight` (**tanpa pixelRatio** → satuan px CSS), dihitung di `resize()` dan saat FOV berubah; `PX = 1.4` mode peta, `1.8` mode tokoh. Contoh: fov 34, 800 px → uK 0,00107; d 110 → th 0,118 u = 1,4 px. Mode tokoh fov 62, 844 px → uK 0,00256; d 6,5 → 0,0167 u = 1,8 px (uMin 0,006 = 0,65 px tidak mengganggu).
- Pembagian `sc` membuat NPC (skala .34), rig tokoh, pohon (skala .85–1,7) semua 1,4–1,8 px.
- Warna: `vColor*0.14 + (0.010,0.007,0.006)` linear ≈ **0,42× sRGB** (rujukan-jepang-gedung: garis di dinding (219,202,186) = (94,78,65) → 0,43/0,39/0,35). Dinding krem `#DDD0B4` → ≈ (95,86,70); atap `#9C4935` → ≈ (72,38,30). `toneMapped:false`, `fog:true`.
- **Geometri hull TIDAK berbagi dengan body.** Hull chunk = region `hull` dari array chunk (§8.1): primitif `lod=0` yang bukan `noHull`. Aturan otomatis di `merge()`: `p.noHull = p.noHull || Math.min(...p.s) < .25` (jeruji, palang, kusen, tenda, pagar besi, kaki tandon, kisi AC, alas rumput/paving semua noHull → tidak jadi balok hitam). Primitif tipis hanya mendapat garis dari tabel sisi (§2.6).
- Pemakaian hull: chunk ≤ 240 u (dari `bodyFar`-region), pohon tier A (≤ 80 u), NPC, kendaraan, tokoh, props > 2 u ber-ink (§7.6). Tidak untuk tanah/jalan/bukit; awan & gunung `INKMAT_SOFT` uMax 0,15.
- Kriteria tahap 2: lebar siluet dinding 1,2–1,8 px pada dist 22/110/300 (peta) dan siluet NPC/tokoh **1,5–2,5 px pada dist 6,5 dan 110**.

### 2.6 Garis tinta — lipatan interior (tabel sisi per primitif, LineSegments per chunk)
- **Tanpa `EdgesGeometry`, tanpa hashing per vertex.** Tiap `BASE` membawa tabel sisi satuan `BASE_EDGES[g]` (Float32Array pasangan titik):
  | g | sisi | catatan |
  |---|---|---|
  | box | 12 | `p.attach='z+'` → hanya 8 (4 depan + 4 samping; 4 belakang yang berimpit host dibuang); `'z-'`, `'x+'`, `'x-'`, `'y+'` analog |
  | prism (pelana) | 9 | 4 alas + 4 miring + 1 bubungan |
  | pyr | 8 | 4 alas + 4 rusuk |
  | cyl | 24 | 2 cincin × 12 (sisi vertikal tidak digaris) |
  | cone | 10 | 1 cincin |
  | sph / sphLo | 0 | |
  | custom (hip) | 9 | dikirim bersama `p.edges` (4 alas + 4 jurai + 1 bubungan) |
- `modelGeo()` mentransformasi 2 titik per sisi dengan `_m4` → `edges: Float32Array` + `edgeColor: Uint8Array` (warna tinta = rumus §2.5 dihitung CPU dari warna primitif; untuk slot ≠ 0 diisi saat rebuild). Biaya O(primitif): rumah 45 primitif ≈ 540 segmen ≈ 0,1 ms.
- Primitif `p.noEdge=true` dilewati: bush, pot, buah, kelapa, kusen (garis jendela datang dari reveal), kaca gbox (hindari garis ganda), dan semua yang kena aturan otomatis §5 (batang tipis).
- Target: **≤ 600 segmen/rumah, ≤ 1.200/ruko, ≤ 2.000/apartemen**.
- Satu `LineSegments` per chunk (`EDGE_MAT = new THREE.LineBasicMaterial({ vertexColors: true, fog: true, toneMapped: false })`, **opacity 1,0**), `renderOrder = 1`; posisi segmen ditransformasi CPU saat `rebuildChunk`. Kawat `pagarKawat` (§7.6 #2) dan kabel listrik ditambahkan ke LineSegments chunk yang sama.
- Lebar GL 1 px perangkat = 0,67 px CSS pada dpr 1,5 (rujukan garis interior 1,0–1,6 px per 1280 px — lebih tipis dari siluet, memang begitu di rujukan). **Garis interior utama juga "dibakar" ke geometri** agar terbaca walau sub-piksel: reveal jendela 0,05 `darken(wall,.70)`, lis lantai 0,12 `darken(wall,.90)`, fascia 0,14 `darken(c,.80)`, pita bawah atap 0,20 (§2.7).
- Anti z-fight: `VMAT`/`VMAT_I` `polygonOffset: true, factor 1, units 1`; ditambah aturan tembus §5 (setiap primitif tempel menembus host ≥ 0,03 u) sehingga tak ada sisi belakang sebidang dengan dinding.
- Chunk > 120 u dari target kamera: `edges.visible = false`.
- Opsi cadangan (hanya bila kriteria tahap 2 "garis kusen 1,0–1,6 px di 1280 px, dist 60" gagal): bundel `examples/js/lines/{LineSegmentsGeometry,LineMaterial,LineSegments2}.js` r128 (≈ 28 KB UMD, tanpa build) dengan `linewidth 1.3`; biaya +2 tri/segmen (≈ +180 k tri untuk 150 bangunan dekat) — harus dikurangkan dari tabel §8.2.

### 2.7 AO palsu (merge + primitif)
- `merge(ao)`: faktor `(.60 + .40*clamp(y/1.8, 0, 1)) * (n.y < -.5 ? .55 : 1) * (p.ao ?? 1)`. Faktor disimpan di atribut `color` juga untuk slot ≠ 0 (lihat §8.1: warna final = warnaSlot × color).
- `p.ao`: 0,70 teras/emperan di bawah atap; **0,80 reveal jendela** (bukan 0,6).
- `pitaBawahAtap`: tinggi **0,20** (overhang ≤ 0,6) / **0,28** (overhang ≥ 0,8), warna `darken(cWall,.74)` lerp ke `#9BA0A6` 0,10 (bukan 0,45 tinggi / 0,62).
- Lis lantai `darken(c,.90)` tetap.

### 2.8 Kabut, langit, awan
- 41×41 (lebar peta 328 u): `scene.fog = new THREE.Fog(0x8A98A5, 260, 900)`. Rumus umum: near = 0,8·lebar peta, far = 2,8·lebar peta. Rujukan-desa-jauh: objek 300–600 m masih berwarna penuh (−15 % saturasi), kabut baru dominan > 1 km.
- 201×201 / 217×217: `FogExp2(warna, 0.00075)` + mode overview phi 0,6.
- `applyTime`: `fog.color = hor.lerp('#8A98A5', .45)` linear.
- Tanah: lerp ke `#B4C5CE` mulai d > 500 (§7.2).
- Awan: `BASE.sphLo` bersegi, `CLOUD_MAT '#EDE9E0'`, hull `INKMAT_SOFT` uMax 0,15.

### 2.9 Vignette — DIHAPUS
Tak satu pun rujukan memakai vignette (pojok = tengah). `#veil` tidak dibuat; hanya mode foto boleh `rgba(38,30,28,.07)`.

### 2.10 Atlas tekstur canvas (opsional, tahap 8; material terpisah `VMAT_ATLAS` untuk chunk saja)
- `ATLAS` canvas 512×512, 8×8 sel 64 px, `CanvasTexture`, `LinearFilter`, `generateMipmaps=false`, sRGB. Sel: 0 polos; 1 genteng; 2 seng; 3 papan; 4 bata; 5 kaca 2-nada; 6 tenda bergaris; 7 rolling door; 8–15 teks papan nama generik ('WARUNG','TOKO','KAFE','BENGKEL','BANK','POLSEK','RS','PASAR').
- `merge()` menulis `uv` (× `p.rep`) dan **atribut `cell` (vec2 asal sel, Uint8 normalized)**.
- Vertex: `attribute vec2 cell; varying vec2 vCell;` + `vCell = cell;` disisipkan setelah `#include <uv_vertex>`.
- Fragment (`#include <map_fragment>`): `vec2 uv = vCell + (0.5 + fract(vUv) * 63.0) / 512.0;` (inset ½ texel → tidak mencampur sel tetangga), lalu `vec4 texelColor = mapTexelToLinear(texture2D(map, uv)); float k = smoothstep(220.0, 90.0, length(vViewPosition)); texelColor.rgb = mix(vec3(1.0), texelColor.rgb, k); diffuseColor *= texelColor;` (redam dengan jarak → tanpa moiré genteng di d > 220).
- `VMAT_I`, `PREVIEW_MAT`, `vehMat` TIDAK diberi map (tidak ada `vUv`); `onBeforeCompile` atlas hanya di `VMAT_ATLAS`.

### 2.11 Kaca & lampu
- Kaca 2 nada tanpa atlas (tahap 4): `gbox` default `c '#C9D6E0'` (kiri-atas) dan `c2 '#7D93A8'` (kanan-bawah). `merge()`: muka +z BoxGeometry non-indexed = vertex 24–29 (diverifikasi r128: `buildPlane('x','y','z',1,-1,…,4)` = grup ke-5, indeks `(a,b,d),(b,c,d)`); vertex 24–26 (segitiga kiri-atas TL,BL,TR) warna `c`, vertex 27–29 (BL,BR,TR) warna `c2` → **pecahan diagonal keras, 0 tri tambahan**. Muka lain warna `c2`.
- `GLOWMAT` malam `#F2CF8A`; `LAMP_HEAD` siang `#8E8F94`.

---

## 3. Palet lengkap (hex pengganti; `lin()` desaturasi 8 %, `p.wall` 20 %)

### c1_core.js
| Konstanta | Baru |
|---|---|
| `COLORS` (warna pemilik → **aksen**: tenda, papan nama, daun jendela, bendera kecil; BUKAN atap) | `#A9463A #4F7A55 #4C6A96 #C2913A #6F5E8C #9C4935 #3F6B62 #8E3E34 #3F7D92 #B06A7C` |
| `WALLS` (10 hue, S ≤ .45, V .40–.88; **dipilih dari `hashStr(b.id)%10`**, bukan pemilik; bila sama dengan tetangga kiri → `(idx+1)%10`) | `#DDD0B4` krem · `#C9BBA2` abu-krem · `#B98C6E` bata muda · `#956350` bata · `#C9A86A` oker · `#8E9A78` zaitun pucat · `#8FA0AA` biru-abu · `#C9A4A0` pink pudar · `#6C6A66` abu tua · `#E3DED2` putih tulang |
| `GENTENG` (hash id; **50 %** terakota, **30 %** abu-tulis, 10 % zaitun, 10 % cokelat) | terakota `#9C4935 #8E3E34 #A8553B`; abu `#5E6670 #4F555C`; zaitun `#4F6D5A`; cokelat `#6B5546` |
| alas kavling | rumput `#8FA462` (hunian/taman/lapangan/sawah) · paving `#CFC6B8` + nat `#BFB6A8` (pusat & usaha/umum) — §6 |
| taman/lapangan rumput 2 nada | `#8FA462` / `#7F9455` (Δ V ≈ 10 %) |
| paving | `#CFC6B8 #C9C1B2 #CFC3AE #CFC6B4 #C9BFA6 #C6B898` |
| `KUSEN` | `#EDE8DC` |
| pintu; gagang | `#5A4636 #4E3C2E`; `#B8922E` |
| kayu | `#8C6A48 #5E4630 #7A5A3A` |
| kaca gbox | `#C9D6E0` / `#7D93A8` (2 nada); lampu `#F2CF8A` |
| bendera | `#B5473A` / `#E6E2D8` |
| putih bangunan | `#E6E2D8 #DDD9CE #D9D4C8 #E3DED2 #E2D6B8` |
| `ownerColor` negara | `#8E3E34` |
| `PROF.*.c` (NPC) | tetap (UI); NPC memakai `lin()` |

### c2_engine.js
| Konstanta | Baru |
|---|---|
| `scene.fog` | `0x8A98A5, 260, 900` |
| `hemi` | `#C9D6E2` / `#6E6A58` 0,78; malam `#4A5470` / `#1E2A3A` |
| `INK` | rumus `vColor*0.14+…` (§2.5) |
| `buildGround` rumput | `#8FA462` / `#7F9455` strip 2,4 u; sand `#D3C293` |
| aspal | `#45464A` |
| trotoar / curb | `#CFC9BC` / `#A9A398` |
| marka | dash `#E8E6DF` 1,6×.15 jarak 4; garis tepi `#E8E6DF` .1; zebra `#D9D7CE` |
| median boulevard | rumput `#8FA462` + curb |
| jembatan | `#9E9A90` / `#6F6A60` |
| `lotMesh` | `#8FA462`; free `#BCD27A`, bad `#C97A68`, mine `#E6C96F`, forest `#5E7A44` |
| pohon round | batang `#5E4630`; atas `#7FA850` tengah `#6A9245` bawah `#4F7239` |
| pine | `#4E3C2E`; `#3F5E44 #4A6B4A #557A52` |
| palm; bush | `#5C7D3E`; `#5F7A3F` |
| flamboyan / tabebuya | `#C9502C #D9743A` / `#D99AB5 #E8B4C8 #C8809E` |
| river | `#7F93A6`, toonMat tanpa specular, opacity .94 |
| hills; gunung | `#7F9469 #8CA072`; `#8A969A #A3B0B6` |
| `CLOUD_MAT` | `#EDE9E0` |
| `GLOWMAT` / `LAMP_HEAD` | `#8E9AA6`/`#F2CF8A`; `#8E8F94` |
| lamp pole | `#2B2B2B` |
| `carCols` | `#C9D3DC #D8622F #8FA67E #E5E1D8 #3E5A82 #B4443A #2E3A40` |
| `angkotCols` | `#3C6FA8 #3F8A5E #C2913A #B5473A` |
| kaca mobil | `#6A7F95` |
| crane | `#C2913A` |

---

## 4. Kamera & skala

### 4.1 Keputusan T: **T = 8 (1 unit = 1 m)** — tetap
Alasan: semua ukuran arsitektur dalam meter tanpa konversi; kavling 8×8 cocok rumah tipe 36–45 dan ruko; jalan 5,2 aspal + 1,4 trotoar = 8 = 1 petak; server hanya memakai indeks i,j,w,h.

Konsekuensi (`c1_core.js:43` `T = 8`):
- `fx = w*T - 0.8` (c2 `modelGeo`, `makeVisual`, c4 preview); 1 kavling fx = 7,2; 2 = 15,2; 4 = 31,2.
- `buildGround`: profil jalan §4.8; `PlaneGeometry(2000)`; sungai pita kurva §7.4; jembatan 7×45; `lampSpots` offset 3,4; pohon tepi jalan offset 3,3.
- `clampCam`: dist 30–400; `L = LHALF+40`. `flyTo` c4: 65/70/80/145/200.
- Kecepatan: tokoh 4,5/8; NPC 1,2–1,8; mobil 9–13; ojek 10–14; `stepMovers` offset pejalan 3,3, mobil lajur ±1,3.
- `startWalk`: `walk.z = z + home.h*T/2 + 1.2`.

**Catatan kompatibilitas dengan spek-tata-kota (T = 6 di sana):** semua rumus tata-kota memakai satuan *petak* (PD 43, blok 6×2) dan tetap berlaku; yang berubah hanya skala dunia (`T`). Tabel lebar aspal per kelas di tata-kota §4.1 (dalam unit) **digantikan** oleh §4.8 spek ini; arteri 2 petak = 16 u memuat profil boulevard penuh.

### 4.2 Konstanta skala global (c1_core.js setelah T)
```js
const LANTAI = 3.2, LANTAI_USAHA = 4.2, MANUSIA = 1.7, PINTU_W = 1.0, PINTU_H = 2.1, TROTOAR = 1.4, ASPAL = 5.2, CURB = .22, Y0 = .2;
```
`LANTAI_USAHA = 4,2` (rujukan brasserie 1,3–1,4× lantai atas): ambang 0,5 → etalase 2,5 (sampai y 3,0) → tenda di y 3,0 → papanNama y 3,3–4,0. Toko 2 lantai = 4,2 + 3,2 = 7,4 + parapet 0,5.
Rasio: manusia 0,53 lantai; pintu 0,66 lantai; mobil 1,34 lantai; pohon kavling 1,1–1,6 lantai; pohon jalan 1,6–2 lantai.

### 4.3 Tapak, deret rapat, variasi tetangga
- Lebar `bw = fx*0.90` (6,5 / 13,7), kedalaman **`bd = fz*0.92`** (6,6), halaman belakang 0,3. Hunian: halaman depan 1,4 (teras/pagar). **Usaha/umum di distrik pusat: muka bangunan di `z = fz/2 − 0,2` (menempel trotoar), tanpa halaman depan.**
- **Ruko 2×1 (toko, bank, kos):** satu model berisi **3 unit muka 5,0 m** (15,2 = 3×5,0 + 0,2), tiap unit: dinding `WALLS[(seed+k)%10]`, parapet ±0,4, kedalaman muka depan ±0,15 (seed bit k) → garis tinta vertikal alami tanpa celah.
- **Deret rapat (adj), ruang lokal model:** kiri/kanan = sumbu x lokal; untuk `b.w ≠ ct.w` (inner diputar π/2) tetangga = `(i, j±1)`, selain itu `(i±1, j)`. `adj = {l:0|1, r:0|1}` = tetangga bertipe dari daftar {rumah, rumah2, toko, kos, kafe, warung, bank} dan stage `jadi`, dihitung dari `S.occ`. Bila adj: `bw` sisi itu sampai **`fx/2` persis (celah 0)**; overhang sisi itu **0,15**; bentuk atap dipaksa **pelana dengan bubungan sejajar deret (sumbu x lokal)**; fascia sisi itu dihilangkan; warna dinding wajib beda dari tetangga kiri (`(idx+1)%10`); offset muka `z += (seed&1 ? .15 : 0)`. Batas rumah terbaca dari beda warna/tinggi/kedalaman, bukan alur gelap.
- `adj` masuk `visualKey(b)` dan kunci `GEO_CACHE`; `makeVisual`/`dropVisual` memanggil `markDirty(chunkOf(tetangga))` untuk 4 tetangga sisi (c3 `upsertBuilding` otomatis membangun ulang karena key berubah).
- Bangunan umum 2×2: 85 % tapak + pagar sampai 98 %.

### 4.4 Tokoh & NPC (proporsi 1:6,5, tanpa wajah)
- Rig baru (`buildRig`): kepala **0,26** (kotak bersudut/sphLo), leher 0,12, badan 0,62, kaki 0,70, bahu 0,42 → total **1,70**; tanpa tekstur wajah (2 titik mata 2 px dari gbox kecil boleh). `walk.rig.position.y = Y0`; label `projV.set(walk.x, 2.1+…)`.
- NPC: rig yang sama (6 InstancedMesh: kepala, badan, 2 lengan, 2 kaki), 1 warna baju + 1 warna celana via `instanceColor`; `NPC_S` = 1 (geometri sudah berskala meter; varian tinggi 0,93–1,05); `y = Y0 + bob*.4`.
- Pintu 1,0×2,1 ⇒ pintu ≈ 1,24 manusia.

### 4.5 Kendaraan
- Mobil: bodi 1,8×0,55×4,3 y.35 + kap 1,7×.3×1,2 z+1,5 + kabin 1,6×.65×2,0 z−.1 (kaca 4 panel `#6A7F95`, 2 nada) + bagasi; roda cyl 8 segmen r.34 lebar .25 `#1E1C1A` + velg; lampu gbox `#F2CF8A` malam, belakang `#B4443A`; ≤ 400 tri.
- Angkot 1,9×1,9×4,6 + strip putih; ojek 2,0 panjang + pengendara rig NPC; bus kota 2,4×2,8×9 (2 instans).

### 4.6 Lensa mode peta (sudut tinggi seperti rujukan: 40–52°)
- `camera = new THREE.PerspectiveCamera(34, 1, .5, 2400)`; `resize()`: `fov = aspect >= 1 ? 34 : 34 + (1-aspect)*40`; hitung ulang `INK_U.uK`.
- Default **`phi 0.85` (elevasi 41°)**, `dist 110` landscape / `150` portrait → bingkai ≈ 67 u tinggi × 107 u lebar (8 × 13 kavling); satu rumah ≈ 7 % lebar layar.
- Ikat phi ke zoom: `phi = lerp(1.05, 0.72, (dist-30)/(400-30))` (dekat 30° → jauh 49°), `clamp(phi, 0.55, 1.15)`; drag kanan boleh mengubah phi dalam clamp.
- Zoom dist 30–400. Pandangan awal kota: `flyTo(wx(20), wx(21), 200)` phi 0,80. 201×201: overview phi 0,6 + FogExp2.

### 4.7 Lensa mode tokoh (mata 1,55 m, hampir mendatar)
- `startWalk`: `cam.ty 1.5`, `cam.dist 6.5`, **`cam.phi 1.48` (elevasi 5°)**, FOV **62** landscape / **75** portrait, `camera.near .2`; `PX = 1.8`.
- `applyCam`: `camera.lookAt(cam.tx, cam.ty, cam.tz)`; `cam.ty = walk.on ? 1.5 : 0`.
- Batas wheel/pinch: dist 4–12, phi 1,25–1,52. Tokoh 1,7/(2·6,5·tan 31°) = 22 % tinggi layar; lantai dasar ruko memenuhi layar → fasad wajib detail.

### 4.8 Jalan — hierarki 3 profil (menggantikan jalan seragam)
| Profil | Dipakai di | Aspal | Lajur | Median | Trotoar | Marka |
|---|---|---|---|---|---|---|
| **A boulevard** | 41×41: jalan pada indeks kelipatan 20 (i atau j = 0, 20, 40, 2 sumbu); tata-kota: kelas *arteri* (2 petak = 16 u) | 9,0 (2+2 lajur 2,0 + median) | 4 × 2,0 | 1,0 rumput `#8FA462` + curb, pohon tiap 8 u, lampu ganda | 2,4 (41×41: trotoar masuk 1,9 ke kavling tepi → `fz` tapak dikurangi 1,9; 16 u tata-kota: 2,4 + strip pohon 0,6) | garis tepi, dash, zebra tiap simpang, lampu lalu lintas tiap simpang |
| **B jalan** | jalan blok lain; tata-kota kelas *kolektor* | 5,2 | 2 × 2,6 | — | 1,4 tinggi Y0 | garis tepi .1 di ±2,45, dash 1,6×.15 jarak 4, zebra strip 2,6×.5 jarak .45, grate 1×.05×.5 `#2E2E30` tiap 12 u, panah 1 per lengan |
| **C gang** | distrik pusat: gang 2,6 membelah blok 4×4 di tengah (paving, tanpa marka); tata-kota kelas *gang* | 2,6 paving `#C9C1B2` | 1 | — | 0 (bahu 0,4) | tidak ada |
Curb .18×.22 `#A9A398` hanya di tepi luar pelataran blok. Lampu lalu lintas: semua simpang profil A dan semua simpang di distrik pusat (1 InstancedMesh, ≤ 120).

---

## 5. Tata bahasa fasad — primitif tingkat tinggi (c1_core.js)

Semua mendorong ke `P`/`G`; posisi (x,y,z) = titik tengah bawah pada bidang dinding; `rot` rotasi Y (0 = menghadap +z). Konstanta `KUSEN='#EDE8DC'`, `KAYU='#5A4636'`, `BINGKAI='#2B2F33'`, `BESI='#2B2B2B'`.

**Aturan umum (dibaca `merge()`/`modelGeo()`):**
1. **Rotasi:** `_e.set(p.rx||0, p.ry||0, 0, 'YXZ')` (yaw lalu pitch lokal) — tenda/kanopi/emperan/atap seng pada bangunan yang diputar tetap miring ke depan, bukan terguling. Uji model_view: toko `rot 90°` tenda turun ke arah jalan.
2. **Tembus host:** setiap primitif yang menempel dinding/atap menembus host ≥ 0,03 u dan membawa `p.attach='z+'` (atau sumbu lain) → tabel sisi membuang 4 sisi belakang. Contoh: reveal jendela z −0,035 tebal 0,07; papan nama z −0,03 tebal 0,15; lis z −0,03.
3. **Batang tipis otomatis:** `min(s) < .12 && (mid(s) < .25 || max(s) < .6)` → `lod=1` + `noEdge=true` (palang, jeruji, kisi AC, gagang, kaki tandon, penyangga, kusen batang). `min(s) < .25` → `noHull=true`.
4. **Slot warna:** `p.slot` 0 = tetap (default), 1 = aksen pemilik (`COLORS`), 2 = dinding (`WALLS` hash id), 3 = genteng (`GENTENG` hash id). `dinding()` memberi slot 2 + `wall=true`; `atap*()` slot 3 bila `c` tidak diberi; tenda/papanNama/daun jendela slot 1.
5. **Geometri inline:** `p.g='custom'` dengan `p.geo` (BufferGeometry non-indexed kecil, atribut position+normal+onormal) dan `p.edges` (Float32Array sisi); dipakai `hipGeo`.

| Fungsi | Perilaku & ukuran | ±Tri |
|---|---|---|
| `dinding(w,h,d,x,y,z,c,{plinth:.6, lis:[y…], quoin:false})` | box dinding slot 2 `wall` + plinth box(w+.06,.6,d+.06) `darken(c,.78)` + lis box(w+.12,.12,d+.12) `darken(c,.90)` tiap `lis` + opsional pilaster 4× box(.3,h,.3) | 12 + 12/lis |
| `pitaBawahAtap(w,d,x,yAtap,z,cWall,ov)` | box(w*.985, ov≥.8 ? .28 : .20, d*.985) di bawah overhang, `darken(cWall,.74)` lerp `#9BA0A6` .10, attach `y+` | 12 |
| `jendela(x,y,z,{w:1.1,h:1.6,rot,daun:null,palang:true,ambang:true})` | (a) **reveal** box(w+.10,h+.10,.07) z −.035 `darken(wall,.70)` ao .80 attach z+ (→ 8 sisi; inilah garis jendela); (b) kaca gbox(w,h,.06) z +.01 **2 nada** `#C9D6E0/#7D93A8` noEdge; (c) 4 batang kusen box .10 menonjol .06 (tebus .04) `KUSEN` noEdge lod 1; (d) palang 1V+1H .06 (otomatis lod 1); (e) ambang box(w+.2,.10,.18) `darken(KUSEN,.85)`; (f) daun 2× box(.38,h,.05) slot 1 | 72–96 |
| `jendelaKecil(x,y,z,{w:.7,h:.7})` | jendela tanpa daun, palang 1 | 48 |
| `jendelaBaris(n,w,y,z,opt)` | n jendela sumbu tiap `w/n` (≥ 1,9), jendela pertama ≥ .95 dari tepi | n×84 |
| `jendelaJeruji(x,y,z,{w:.6,h:.9})` | jendela kecil + **1 pita gelap** box(w,h,.02) `#2B2B2B` z+.03 (bukan 3 batang) | 60 |
| `pintu(x,z,{w:1,h:2.1,c:KAYU,rot,kanopi:false,kaca:false,daun:1})` | daun box(w,h,.08) tembus .03 + kusen 3 batang .10 + ambang; `kaca` gbox 2 nada; `kanopi` box(w+.8,.08,.8) rx −12° + 2 penyangga (lod 1); `daun:2` | 36–72 |
| `etalase(x,z,{w:3.0,h:2.5,rot,bingkai:BINGKAI,ambang:'#8E97A0'})` | kaca gbox(w,h,.06) 2 nada + 4 bingkai box .14 + ambang box(w,.5,.25) + pembagi tiap 1,2 box(.08,h,.1) (lod 1) | 72 |
| `rollingDoor(x,z,{w:3,h:3})` | box(w,h,.1) `#8A939A` + 7 garis box(w,.04,.12) `#5E666C` (lod 1, noEdge) atau sel atlas 7 | 96 |
| `tenda(x,y,z,{w:3.2,dalam:.9,miring:22,c,rot})` | box(w,.08,dalam) rx −22° ('YXZ') slot 1 (atau 6 strip bergantian c/`#E6E2D8` tiap .35) + tepi gerigi box(w,.14,.06) + 2 penyangga .05 (lod 1); noHull otomatis, garis dari tabel sisi | 24–90 |
| `papanNama(x,y,z,{w,h:.7,c,teks,rot})` | box(w,h,.15) z −.03 slot 1 + bingkai lis .06 `#C9B37A` + opsional sel atlas teks | 36 |
| `emperan(x,z,{w,d:1.4,kolom:2,atap:'seng',miring:12})` | lantai box(w,.12,d) paving + kolom cyl 8 seg (.12, LANTAI) + atap box(w+.4,.08,d+.3) rx −12° + pitaBawahAtap | 70 |
| `teras(w,d,x,z,{kolom:2,tangga:2})` | emperan + tangga 2 anak box(w*.5,.18,.3) + railing pita | 100 |
| `balkon(x,y,z,{w:2.4,jorok:.8,c:BESI,rot})` | lantai box(w,.15,jorok) + **railing = 1 pita** box(w,.75,.03) `#2B2B2B` + 2 rel box(w,.05,.05) + 2 konsol pyr kecil (rujukan menggambar railing sebagai pita gelap bergaris) | 60 |
| `koridor(x,y,z,{w,jorok:1.2})` | lantai + railing pita + kolom tiap 3,2 | 120 |
| `atapPelana(w,d,x,y,z,{sudut:42,overhang:.55,ovL,ovR,c,fascia,bubungan:true,dormer:0,cerobong:false,rot})` | prism (w+ovL+ovR) × (w/2+ov)·tan(sudut) × (d+2ov) slot 3 + fascia box(…,.14,.1) `darken(c,.80)` di sisi tanpa adj + bubungan box(.22,.14,…) `darken(c,.8)` + opsional dormer/cerobong + pitaBawahAtap | 40–140 |
| `atapLimasan(w,d,x,y,z,{sudut:30,overhang:.8,c})` | `p.g='custom'`, `p.geo = hipGeo(w+2ov, d+2ov, (min(w,d)/2+ov)·tan(sudut))`: 6 titik (4 sudut alas + 2 ujung bubungan di sumbu terpanjang, **panjang bubungan = max(w,d) − min(w,d)**) → **6 segitiga** (8 bila alas ditutup), onormal dihitung per titik (6 titik, tanpa hash), `p.edges` 9 sisi + fascia 4 sisi + bubungan + pitaBawahAtap. Dipakai juga untuk hip pos jaga/menara | 6 + 40 |
| `atapJoglo(w,d,x,y,z,{c})` | limasan bawah 22° overhang 1,0 + limasan atas 45° lebar .45w mulai y+1,2 (dua `hipGeo`) + 4 saka guru cyl 8 seg + tumpang-sari box | 120 |
| `atapTumpang(w,d,x,y,z,{tingkat:3,sudut:[25,35,50],c})` | 3 `hipGeo` bertumpuk (.75, .5 lebar) + mustaka cyl+sph `#C2913A` | 150 |
| `atapDatar(w,d,x,y,z,{c:'#C9C1B2',parapet:.5,lis:true})` | box atap + parapet 4 box tebal .25 + lis topi box(…,.1) `darken(c,.85)` | 60 |
| `atapGergaji(w,d,x,y,z,{n:4,c})` | n prism rot 90° sisi curam gbox | n×40 |
| `talang(x,y0,h)` | cyl 8 seg (.05,h) `#5A4636` (lod 1) | 32 |
| `ac(x,y,z,rot)` | box(.6,.5,.3) `#D8D8D2` + 1 pita kisi box(.5,.3,.01) `#8A939A` (lod 1) + braket | 36 |
| `tandon(x,y,z)` | cyl 8 seg (.5,1.0) `#D9762B`/`#3E6FB0` + 4 kaki .06 (lod 1) | 56 |
| `pagarHalaman(w,z,{gaya:'tembok'|'besi'|'kayu',gerbang:true})` | tembok box(w,.9,.18) `#C9BBA0` + topi + pilar tiap 2 u; besi: **pita** box(w,.9,.02) `#2B2B2B` ao 1 + 2 rel + tiang tiap 2 u; kayu: pita `#E6E2D8` + 2 rel; gerbang celah 1,2 + 2 pilar | 60–150 |
| `pagarKawat(w,d,{h:1.8})` | tiang tiap 2 u + 2 rel + kawat ke LineSegments chunk (§7.6 #2) | 60 |
| `tiangBendera(x,z,h)` | cyl 8 seg (.06,h) + bola + bendera 2 box 1,2×.8 | 44 |
| `pot(x,z,s)` / `pohonKecil` | cyl 8 seg (.25,.4) `#9C4935` + sphLo(.3) `#5F7A3F` noEdge | 50 |
| `bangku`, `lampuDinding`, `spanduk`, `jemuran` | seperti v1, cyl 8 seg, sph → sphLo | 36–60 |

Penempatan: sumbu jendela tiap 1,9–2,2 u; lantai dasar hunian y = 1,0; lantai k: y = LANTAI·k + 0,9 (usaha: LANTAI_USAHA + LANTAI·(k−1) + 0,9); jendela lantai dasar usaha 2,4–2,8 tinggi; AC 1 per 2 jendela di lantai ≥ 2; talang 2 per atap miring; usaha: papanNama + 2 pot + 2 lampuDinding.

Varian deterministik: `seed = hashStr(b.id) & 3` (bentuk atap, jumlah jendela, dormer/balkon/carport, posisi pintu) + `lantai(seed)` (§6); kunci cache `type|seed|adj`.

Flag primitif: `p.lod`, `p.noEdge`, `p.noHull`, `p.ao`, `p.slot`, `p.wall`, `p.attach`, `p.rx`, `p.c2`, `p.t`, `p.rep`, `p.g='custom'`+`p.geo`+`p.edges`.

---

## 6. Spesifikasi per tipe bangunan (29 tipe CAT). Satuan unit (= m). fx 1 kavling = 7,2; 2 = 15,2; 4 = 31,2

Format: bentuk & lantai · elemen wajib · batas segitiga **dekat/jauh** (dekat = v1 −25 %; `+450` = per lantai tambahan di atas lantai dasar tabel).

**Jumlah lantai dari seed** (`hashStr(b.id)>>2`): toko 2–4, kos 2–3, bank 2–3, kantor 4–8, apartemen 5–9, rs 3–5, rumah2 2, lainnya tetap. Satu blok pusat memuat 2, 3, 5, 7 lantai berdampingan.

**Alas kavling:** distrik pusat & semua tipe usaha/umum (toko, kafe, warung, kos, bank, kantor, rs, polisi, bengkel, pasar, apartemen, pabrik, pkl, pln, penjara, istana, tugu, stadion) → **paving** `#CFC6B8` tebal .04 dengan nat tiap 1,0 u lerp .06 ke `#BFB6A8`, noHull; rumah/rumah2/taman/lapangan/sawah/mulyo/posko/ibadah/sekolah/barak/waduk → **rumput** `#8FA462`.

1. **rumah** (1×1): limasan 1 lantai, dinding 6,4×6,6 tinggi 3,2 (`WALLS` hash), `hipGeo` 30° overhang .8 (slot 3), bubungan, 2 talang · teras 2,4×1,4 2 kolom + 2 tangga; pintu 1,0×2,1; 2 jendela 1,1×1,5 berkusen+daun; jendelaKecil belakang; pagar tembok .9 + gerbang; 1 pot, 1 jemuran, 1 pohonKecil; seed 2–3: pelana 42° + cerobong atau joglo kecil; adj: pelana sejajar deret · **1.050 / 350**, edges ≤ 600.
2. **rumah2** (1×1): pelana 42° 2 lantai (6,4) overhang .55, dormer (seed ganjil) · pintu + 2 jendela; lantai 2: 2 jendela + balkon 2,4 pita; carport seng (seed genap); lis; pagar besi; AC 1; tandon; talang 2 · **1.500 / 450**.
3. **kos** (2×1): 2–3 lantai, 3 unit muka 5,0 warna dinding beda, atap datar parapet .5 (±.4/unit) · 6 jendelaKecil/lantai + AC; koridor luar lantai 2; tangga luar; tandon 2; papanNama 'KOS'; pagar besi · **1.950 / 525 (+450)**.
4. **warung** (1×1): 1 lantai 5,6×5,0 tinggi 3,2 atap seng pelana 15° overhang 1,0 depan · depan terbuka 2 kolom, etalase kecil 1,8×1,0 di meja .9; tenda bergaris; 2 bangku, 3 kursi; papanNama; spanduk; tong · **825 / 260**.
5. **kafe** (1×1): 1 lantai 6,0×6,0 LANTAI_USAHA 4,2 atap datar parapet .4 · etalase 3,0×2,5; pintu kaca; tenda .9 di y 3,0; papanNama y 3,3; 2 meja payung; lampuDinding 2; pot 3; 4 bush · **1.125 / 300**.
6. **toko** (2×1): ruko 2–4 lantai (4,2 + 3,2·n), **3 unit muka 5,0** warna/parapet/kedalaman beda, atap datar + tandon · per unit: etalase 3,6×2,5 atau rollingDoor 3,0; papanNama per unit; lantai atas 2 jendela 1,1×1,6/unit + AC; lis; emperan 1,2 (2 kolom); pot, kardus · **1.800 / 525 (+450)**, edges ≤ 1.200.
7. **bengkel** (2×1): 1 lantai 13,7×6,6 tinggi 4,2 atap seng pelana 20° · 2 rollingDoor 3,0; papanNama; 3 ban (cyl 8 seg noEdge); kompresor; 2 drum; kanopi seng 1,5; pagarKawat samping · **1.200 / 340**.
8. **sawah** (2×1) — **hanya di baris blok terluar** (blk 0 atau 7 / distrik utara-selatan-barat-timur); katalog c4 menyembunyikannya di pusat. Di distrik pusat tipe `sawah` dirender sebagai **kebun/pembibitan**: greenhouse gbox 6×3×2,6 rangka `#8E979C` + 4 bedeng box 1,2×.3×5 `#7E9452` + rak pot. Sawah: 6 pematang box .25 tiap 1,2 `#B59A6A`, padi 2 nada `#9DC25B/#7EAF4F`, 30 % berair `#B8D9D4`, 20 % menguning `#D9C56A`; saung 1,6×1,4 panggung; orang-orangan; 1 kelapa · **675 / 225**.
9. **kantor** (2×2): 4–8 lantai (4,2 + 3,2·n) 13,7×13,7 · ribbon window: band gbox 2 nada 1,8 + spandrel .5 `#D8CBB2`; lobby kaca 2 lantai + pintu dobel; atapDatar parapet 1,0 + kotak lift 2,4×2,4×2,8 + 2 AC besar + antena; papanNama atap; 2 pot; mobil parkir (props) · **2.250 / 600 (+450)**.
10. **taman** (1×1): jalur lingkar paving r 2,2 + 4 radial; air mancur cyl 8 seg r1,6 + air `#7F93A6` + gsph; gazebo oktagonal; 2 bedeng sphLo; pagar besi pita; 4 bangku; 2 lampu; tabebuya 1 + round 2 (dalam model); rumput 2 nada diagonal 45° · **1.650 / 375**.
11. **lapangan** (2×2): rumput 2 nada 6 strip 2,4 u, garis putih .12; 2 gawang; tribun 2 tingkat; pagarKawat; 2 tiang lampu 10 · **1.050 / 300**.
12. **sekolah** (2×2): 2 lantai L 13,7×6,6 + sayap 6,6×6, `hipGeo` 30°; koridor lantai 2; 6 jendela/lantai; pintu dobel 1,6; tiangBendera 7,5; lapangan upacara paving 8×6; gerbang + papanNama 'SD NETIZENIA'; pagar tembok · **2.400 / 600**.
13. **rs** (2×2): 3–5 lantai (4,2 + 3,2·n) 13,7×9,0 + UGD 1 lantai 6×5 kanopi 5,0×3,0 di 4 kolom; 5 jendela/lantai; '+' merah 2,0; parapet 1,0; AC 6; tandon 2; helipad; ambulans; pagar besi; 2 pohon; dinding `#DDD9CE` + band `#4C6A96` .4 · **2.700 / 675 (+450)**.
14. **polisi** (2×1): 2 lantai 13,7×6,6 `hipGeo` abu `#5E6670`; dinding `#D8CBB2` + band `#2B3A67`; 5 jendela/lantai; pintu dobel + kanopi; papanNama 'POLSEK'; 2 lampu gsph; mobil patroli (props); tiangBendera 7; pos jaga `hipGeo` · **1.950 / 525**.
15. **penjara** (2×1): tembok 3,5 tebal .5 `#8E979C` + kawat (LineSegments) + 2 menara cyl 8 seg r.8 `hipGeo`; blok sel 2 lantai dengan 8 jendelaJeruji; gerbang besi; lapangan paving · **1.500 / 375**.
16. **pasar** (2×2): 4 los `hipGeo` seng 4×4 20° `#6E7F8A` di 4 tiang + bangunan utama 2 lantai 'PASAR'; 12 lapak box + buah 3 sphLo noEdge; 6 payung pudar; motor (props); tong 2 · **2.100 / 525**.
17. **ibadah / masjid** (2×1): utama 7×7 tinggi 4,0 `#E3DED2` + 4 pilar serambi cyl 8 seg; atapTumpang 3 `hipGeo` `#4F6D5A` + mustaka; menara cyl r.6 tinggi 12 + kubah sphLo r.9; 5 jendela lengkung (box + cyl setengah rx 90° 'YXZ'); pagar tembok; tempat wudhu; 2 palem. Seed: gereja (pelana 50° + menara 9 + salib), pura (candi bentar 2 pilar) · **2.250 / 600**.
18. **pln** (1×1): gardu 3,0×2,4×2,8 `#BFC7CC` + pintu besi + tanda petir; 2 trafo cyl 8 seg + isolator sphLo; pagarKawat; tiang listrik 8,0 · **900 / 225**.
19. **stadion** (4×2): tribun 3 tingkat 4 sisi + kursi strip 2 warna; dinding luar 6,0 `#C9C1B2` 8 pilaster + 4 pintu; 4 tiang lampu 12; atap tribun seng rx 10° 'YXZ'; papan skor; lapangan garis lengkap · **4.500 / 1.125**.
20. **istana** (2×2): 2 lantai 13,7×7,0 tinggi 7,5 `#E3DED2`; 8 kolom cyl 8 seg r.35 + pediment + kubah sphLo r2,6 `#C2913A`; 12 jendela tinggi; tangga 4 anak; tiangBendera 10; pagar besi + gerbang; 4 palem + 2 kolam · **3.400 / 750**.
21. **tugu** (2×2): plaza paving r 5 + 4 undakan; tugu kuda ×1,33 + pedestal 3 tingkat; 4 lampu; 8 pot; 4 bangku; rantai (LineSegments) · **1.800 / 450**.
22. **mulyo** (2×2): atapJoglo 9×7 dinding `#E3DED2` + kaki bata .9; pendopo 8×3,2 (4 kolom + `hipGeo` 22°); 4 jendela kayu; pintu dobel ukir; tiangBendera 8; pagar kayu; kolam; 2 pohon; gapura · **2.400 / 600**.
23. **posko** (1×1): pos ronda 2,4×2,4 panggung .4 + 4 tiang + railing pita + `hipGeo` 30°; kentongan; bangku; spanduk 'POSKO'; drum 2; bata 6 box; gerobak · **675 / 225**.
24. **bank** (2×1): 2–3 lantai (4,2 + 3,2·n) 3 unit muka, dinding `#E2D6B8` + band emas .3; serambi 6 kolom cyl 8 seg + pediment; 2 etalase; pintu kaca dobel; ATM; papanNama + logo sphLo; AC 2; pagar besi; 2 pot · **1.950 / 525 (+450)**.
25. **barak** (2×2): 2 barak 10×3,4 pelana 25° `#6B7A4A` dinding `#8C8F6A`, 6 jendelaKecil; menara 7 (4 tiang + kabin + `hipGeo`); gerbang + palang; lapangan apel; 2 truk; pagarKawat; tiangBendera; 2 pohon · **2.100 / 525**.
26. **waduk** (2×2): tanggul 14×2,2×1,8 + 4 pintu air + roda cyl 8 seg; air 2 tingkat `#7F93A6`; jembatan 1,0 + pagar; rumah jaga `hipGeo`; papanNama; 2 pohon + 4 bush · **1.350 / 375**.
27. **apartemen** (2×2): 5–9 lantai (4,2 + 3,2·n) 7,0×7,0 di sudut kavling; per lantai 4 jendela + balkon menerus pita + 4 AC; lis; atapDatar parapet 1,0 + 2 tandon + lift; lobby kaca; kolam 6×3; 3 mobil (props); pagar besi; 2 palem · **3.400 / 825 (+450)**, edges ≤ 2.000.
28. **pabrik** (2×2): hall 13,7×7 tinggi 4,0 atapGergaji 4 `#6E7F8A`; 2 cerobong cyl 8 seg r.5 tinggi 9; 2 rollingDoor; 6 jendelaKecil; tangki; pagarKawat; truk; 4 peti · **1.950 / 525**.
29. **pkl** (2×1): 4 gerobak (badan kayu 1,5×1,0×.9 + gbox .9×.5 + 2 roda cyl 8 seg + atap seng 12° 'YXZ') + spanduk + 3 kursi + meja; tenda terpal 3×2,4 `#3C6FA8`; lampu gsph; tong · **1.200 / 300**.

---

## 7. Lingkungan & props

### 7.1 Pohon (`TREE_GEOS`, `paintTrees`)
- `BASE.sphLo = new THREE.SphereGeometry(.5, 7, 5).toNonIndexed()` (70 tri); `BASE.cylLo = CylinderGeometry(.5,.5,1,8)`; helper `sphLo(r,x,y,z,c)` mendorong `g:'sphLo'`.
- **Pohon hi ≤ 250 tri**: round = cylLo r.16 h2,6 + **3 sphLo** (r1,6 @y3,6; r1,2 @(.9,4,4,−.4); r1,0 @(−1,0,4,1,.5)) = 32 + 210 = 242 tri; cemara = cylLo + 3 cone 8 seg; flamboyan 2 cylLo miring (rx 'YXZ') + 3 sphLo; tabebuya = round skala .8; kelapa 3 cylLo + 6 pelepah box + 2 sphLo noEdge. Tinggi 5,4–7,8 (skala .9–1,3), jalan 1,3–1,7.
- `paintTrees`: `setColorAt` `_ca.setHSL(h0 + (r()-.5)*.04, .42 + r()*.12, .38 + r()*.12)`; pohon jalan tiap 2 kavling di trotoar offset 3,3; boulevard tiap 8 u di median; y dari `groundY`.
- **LOD 3 tier per jenis (3 InstancedMesh + 1 ink):**
  | Tier | Radius dari target kamera | Kuota | Geometri | Hull | castShadow |
  |---|---|---|---|---|---|
  | A | ≤ 80 u | ≤ 200 | hi 250 | ya (INKMAT_SOFT) | ya |
  | B | ≤ 150 u | ≤ 400 | hi 250 | tidak | ya (LOW: tidak) |
  | C | sisanya | ≤ 900 (LOW 600) | lo: 2 sphLo + cylLo 6 seg ≈ 70 | tidak | tidak |
  Repartisi tiap 500 ms bila target kamera pindah > 25 u. Draw call 5×3 + 5 = 20.

### 7.2 Tanah, kavling, ketinggian dasar `Y0`
- **Satu konstanta `Y0 = .2`** (muka pelataran blok). Pelataran blok = box tinggi .2 (muka di Y0); `lotMesh = BoxGeometry(T,.04,T)` di y = Y0 + .02, visible hanya saat mode bangun; root bangunan, `placePreview`, rig tokoh, NPC: y = Y0; `ground = Plane(0,1,0, -Y0)` untuk `tileAt`; curb hanya di tepi luar pelataran. Lokasi kode yang WAJIB memakai `Y0`: c2 `makeVisual` (root.position.y), `applyCam`/`ground` (raycast plane), `stepMovers` (NPC/kendaraan y), `walk.rig.position.y`, `rebuildChunk` (offset y), `buildGround` (pelataran, lotMesh); c4 `setPlace`/`placePreview.position.y`.
- `buildGround`: `PlaneGeometry(2000, 2000, 120, 120)` (LOW 90). **Strip rumput 2 warna penuh** `#8FA462` / `#7F9455`, lebar 2,4 u: diagonal 45° di taman/lapangan, sejajar jalan di kavling hunian, di luar kota noise lembut; d > 500 lerp ke `#B4C5CE`.
- Bukit bergelombang (fungsi `groundY(x,z)` seperti v1: amplitudo 15–25 u, periode ≈ 250, mulai LHALF+40); gunung 6×3 cone bertumpuk `#8A969A/#9AA6AB/#A3B0B6`, hull `INKMAT_SOFT`.

### 7.3 Jalan & marka — §4.8. Semua digabung ke `roads` merge kecuali dash/zebra/panah (3 instanced) dan lampu lalu lintas (1 instanced ≤ 120).

### 7.4 Sungai
`CatmullRomCurve3` 7 titik (seperti v1), sampling 200; 3 pita 1 merge: air 20 `#7F93A6` (toonMat, opacity .94), tepi 1,4 `#6B7E92`, pasir 3,5 `#D3C293`; kilau InstancedMesh 300 box .8×.02×.14; 2 jembatan busur 3 segmen (rx ±8° 'YXZ') lebar 7; 4 perahu; 2 dermaga.

### 7.5 Sawah & ladang cincin luar
24 petak 18×12 di d = LHALF+20..+140, 9 baris 2 nada + pematang; saung + 2–3 kelapa + orang-orangan (InstancedMesh ≤ 40); jalan tanah `#C9A06A` lebar 2; digabung ke `roads`.

### 7.6 Props Indonesia (InstancedMesh per jenis, `merge(P,true)`, penempatan `rng(seed)`)
| # | Prop | Kuota | Tri | Ink |
|---|---|---|---|---|
| 1 | Tiang listrik beton cyl 8 seg r.14 h7,5 + palang + 3 isolator | ≤ 400 | 60 | ya |
| 2 | **Kabel & kawat**: catenary 6 segmen sag .35 (3 kabel y 7,1/6,9/6,7), seberang jalan sag .5; kawat `pagarKawat` (3 garis y .6/1,2/1,8) — **semua segmen masuk `LineSegments` chunk yang sama dengan edges bangunan** (bukan objek baru) | — | 0 | — |
| 3 | Lampu jalan tiang r.055 h5,6 + lengan + kepala + tudung | ≤ 330 | 50 | ya |
| 4 | Pos ronda 2,4×2,4 `hipGeo` | ≤ 64 | 150 | ya |
| 5 | Gerobak bakso/siomay | ≤ 24 | 120 | ya |
| 6 | Becak (jalur ojek, .6×) | ≤ 12 | 120 | ya |
| 7 | Motor parkir | ≤ 60 + 12 bergerak | 80 | tidak |
| 8 | Jemuran | ≤ 150 | 48 | tidak |
| 9 | Tandon/toren | ≤ 200 | 56 | tidak |
| 10 | Gapura kampung | ≤ 8 | 120 | ya |
| 11 | Bangku taman | ≤ 80 | 36 | tidak |
| 12 | Tong sampah (instanceColor 3 warna) | ≤ 120 | 36 | tidak |
| 13 | Umbul-umbul/spanduk | ≤ 100 | 24 | tidak |
| 14 | Warung tenda terpal | ≤ 30 | 120 | ya |
| 15 | Mobil parkir (carGeo) | ≤ 30 | 400 | ya |
| 16 | Bus kota | 2 | 400 | ya |
| 17 | **Rambu jalan** tiang .06 h2,4 + plat .6 (3 bentuk via instanceColor) | ≤ 150 | 20 | tidak |
| 18 | **Bollard** cyl 8 seg r.1 h.9 `#5E666C` | ≤ 200 | 18 | tidak |
| 19 | **Rak sepeda + 2 sepeda** (box rangka + 4 cyl roda 8 seg) | ≤ 40 | 40 | tidak |
| 20 | **Halte bus** 3×2 beratap seng + bangku + 2 tiang kaca | ≤ 20 | 40 | ya |
| 21 | **Kotak utilitas** .6×1,2×.4 kuning `#C2913A`/abu `#8E979C` | ≤ 80 | 12 | tidak |
Total ≈ 21 jenis, ≈ 1.500 instans ≈ 140 k tri; draw call 21 + 10 ink = 31. LOD: prop ≤ 2 u `count=0` saat `cam.dist > 140`; jemuran/tong/motor/bollard/rambu hanya radius 120 u; castShadow hanya prop > 2 u dalam 120 u.

---

## 8. Anggaran performa & LOD

### 8.1 Batching bangunan per chunk
- Chunk = 10×10 kavling = 80×80 u → 41×41: 4×4 = 16 (+ sisa tepi); 201×201/217×217: ≤ 484, frustum-culled, dibangun hanya dalam radius 400 u.
- **Cache `GEO_CACHE` kunci `type|seed|adj`** (maks 29×4×4 = 464, realistis < 120). Isi per entri: `pos Float32 (12 B)`, `normal Int8 normalized (3 B)`, `onormal Int8 (3 B)`, `color Uint8 (3 B)`, `slot Uint8 (1 B)`, opsional `cell Uint8 (2 B)` → **22 B/vertex**; `edges Float32Array (24 B/sisi)` + `edgeColor/edgeSlot`. Cache ≈ 120 × 6.000 × 22 B + edges ≈ **20–25 MB**.
  - r128: `new THREE.BufferAttribute(new Int8Array(n*3), 3, true)` untuk normal/onormal; `Uint8Array` untuk color/slot.
  - `onormal` **diprakomputasi per BASE sekali**: box = `normalize(sign(x),sign(y),sign(z))`; cyl/cone/sph/sphLo = normal halus geometri indexed SEBELUM `toNonIndexed()`; prism/pyr = rata-rata per titik dihitung sekali saat BASE dibuat; custom (hipGeo) dihitung dari 6 titik. `merge()` mentransformasi `onormal` dengan `_nm` seperti normal biasa — **tidak ada Map/hash per vertex**.
  - Urutan vertex dalam entri: **[A: lod0 & !noHull] [B: lod0 & noHull] [C: lod1]** dengan offset `nA, nAB`. `bodyFar` = range [0, nAB); `hull` = range [0, nA); `body` = semua. Tidak ada geometri `bodyFar` terpisah.
  - Warna: atribut `color` = warna linear×AO untuk slot 0, dan **hanya faktor AO (abu) untuk slot 1–3**; warna final = `base(slot) × color` diisi saat rebuild (`base(1)=COLORS[pemilik]`, `base(2)=WALLS[wallIdx(b)]`, `base(3)=GENTENG[gentengIdx(b)]`), semuanya lewat `lin()` (slot 2 dengan desaturasi 20 %).
- **`rebuildChunk` tanpa realokasi:** per chunk pra-alokasi `Float32Array` posisi kapasitas **160 k vertex** (+ Int8/Uint8 pendamping, edges 60 k segmen); hitung dulu ΣA, ΣB, ΣC dari cache (O(bangunan)); tiga kursor tulis → region chunk [ΣA][ΣB][ΣC]; `setDrawRange` + `attribute.updateRange` (r128) lalu `needsUpdate`; mesh `body` drawRange [0, ΣA+ΣB+ΣC), `hull` [0, ΣA), `bodyFar` [0, ΣA+ΣB). Bila kapasitas terlampaui (> 160 k) alokasikan 1,5× dan ganti atribut (jarang).
  - **Irisan waktu:** kursor bangunan per chunk; anggaran **6 ms/frame** (`performance.now()` dicek tiap bangunan); chunk dirty diurutkan berdasarkan jarak ke target kamera; saat muat awal tampilkan body dulu, edges/hull diisi pada irisan berikutnya. Biaya salin ≈ 50 ns/vertex desktop, 250 ns HP → chunk 32 bangunan 1×1 (≤ 192 k vertex; kapasitas 160 k cukup karena rata-rata 4.500 vertex) ≈ 12 ms desktop / 50 ms HP, dibagi ke 2–8 frame tanpa macet.
- **Draw call per chunk:** ≤ 160 u: body (VMAT, castShadow) + hull (INKMAT, drawRange A) + glow (GLOWMAT) + edges (LineSegments, visible ≤ 120 u) = **4**; 160–240 u: bodyFar (drawRange AB, castShadow false) + hull (A) + glow = **3**, edges off; > 240 u: bodyFar + glow = **2**.
- **Kontrak `makeVisual(b)`** (dipakai 9 tempat di c3/c4): tetap mengembalikan `v = { root (Group kosong di (cx, Y0, cz) untuk label & posisi), pick (Mesh BoxGeometry(fx,tinggi,fz) PICK_MAT.visible=false — raycast r128 tetap kena, tidak dirender; masuk `pickables`), label, b, key (visualKey + adj), chunk }`; `dropVisual(v)` menandai chunk dirty + tetangga. `visualKey(b)` ditambah `adj.l|adj.r` dan `wallIdx(b)`. `modelGeo(type, seed=0, adj={l:0,r:0})` (warna tidak lagi parameter; `makeThumbs`/`placePreview` memakai default dan mengisi warna lewat `resolveColors(geo, b)` atau `PREVIEW_MAT` tanpa vertexColors). `makeThumbs` renderer terpisah → `LinearToneMapping 0.72` + `TOON_GRAD` + lampu §2.2 agar kartu katalog cocok dengan kota.
- `applyProgress` (stage `bangun`, `inner.scale.y`): tetap Mesh sendiri sampai `jadi` (≤ 10 sekaligus), hull dengan pembagi `sc` (§2.5) sehingga tidak gepeng.

### 8.2 Anggaran (41×41, ~600 bangunan, pandangan kota dist 110 phi 0,85, non-LOW; kolom hull & bayangan terpisah)
| Komponen | Badan (tri) | Hull (tri) | Pass bayangan (tri) | Draw call |
|---|---|---|---|---|
| Bangunan ≤ 160 u (~150 × 1.500 rata-rata) | 225 k | 68 k (bodyFar-region ≈ 30 %) | 225 k | 6 chunk × 4 = 24 |
| Bangunan 160–240 u (~200 × 450) | 90 k | 90 k | 0 | 5 × 3 = 15 |
| Bangunan > 240 u (~250 × 450) | 112 k | 0 | 0 | 5 × 2 = 10 |
| Pohon A 200 × 250 / B 400 × 250 / C 900 × 70 | 50 k / 100 k / 63 k | 50 k | 150 k | 20 |
| Props ~1.500 (§7.6) | 140 k | 40 k | 60 k | 31 |
| NPC 150 × 6 × 30 + kendaraan 30 × 400 | 27 k + 12 k | 39 k | 39 k | 18 |
| Tokoh pemain | 2 k | 2 k | 2 k | 4 |
| Tanah/jalan/marka/sawah/sungai/bukit/gunung/awan/langit/lampu | 60 k | — | 0 (receive) | 18 |
| **Total** | **881 k** | **289 k** | **476 k** | **140** |
**≈ 1,17 juta tri badan+hull per frame + ≈ 0,48 juta pass bayangan ≈ 1,65 juta terproses** (v1 sebenarnya ≈ 2,9 juta). `renderer.info.render.calls` ≈ 140 + ~25 pass bayangan.
- MOBILE non-LOW: pohon A 150 / B 300 / C 700, ambang bodyFar 130 u, props 1.000 → ≈ 0,95 jt + 0,35 jt bayangan.
- LOW: pixelRatio 1, mapSize 1024, span ≤ 140, pohon A 100 / B 200 / C 600 (B tanpa castShadow), props 500, NPC 60, bodyFar > 100 u → ≈ 550 k + hull 150 k + bayangan 250 k, ≈ 100 draw call. Target 30 fps HP menengah (Adreno 6xx / Mali-G52 ≈ 50–100 M tri/s: 0,95 jt × 30 = 29 M/s).

### 8.3 201×201 / 217×217
Chunk ≤ 484, hanya dalam frustum + radius 400 u; bangunan > 300 u tidak dimuat (c3 `ensureVisibleDistricts`); pohon tier C saja di luar 150 u; `FogExp2 0.00075`; VRAM chunk aktif ≈ 80 × 160 k × 22 B ≈ 280 MB terlalu besar → kapasitas chunk dinamis (alokasi sesuai ΣA+ΣB+ΣC + 20 %, rata-rata 60 k vertex ≈ 1,3 MB) dan lepaskan chunk > 400 u (`dispose`).

---

## 9. Urutan pengerjaan & verifikasi visual

Setiap tahap: `node test/model_view.js <out> <tipe,…|semua> [rendah|jalan|atas]`, `node test/ink.js` dengan `?jam=15&hemat=0`, lalu `test/ukur.js` (baca PNG; rata-rata V/S; rasio sRGB dua kotak sampel; lebar garis siluet via scan horizontal; histogram V<0,4; rasio R/G, B/G kotak bayangan).

| Tahap | Isi | Kriteria lulus (angka) |
|---|---|---|
| **0** | `LOW` override `?hemat=0`/`?hemat=2`, `ukur.js`, model_view `jalan` = cam.ty 1,5 / dist 6,5 / phi 1,48 / FOV 62, `Y0` | ink-*.png punya bayangan jatuh & antialias; tidak ada objek di bawah Y0 |
| **1 Cahaya & palet** (§2.1–2.4, 2.8, 2.9, 2.11; §3) | exposure 0,72, TOON_GRAD [160,255], lantai bayangan shader, SKYKEYS, hemi 0,78, PCFShadowMap + bias texel, fog 260/900, palet 10 WALLS, `lin()` 8 %/`wall` 20 % | dinding depan/samping **0,85–0,95**; rumput terang/bayangan jatuh **0,50–0,60**; V<0,4 = **10–18 %** piksel jam 15; dinding terang ≤ 225; rumput 115–140; atap merah S .55–.65; bayangan R/G 1,0±.05, B/G 1,05–1,15; tidak ada lompatan tanah 06:00–18:00 (uji jam 7:10 vs 7:30) |
| **2 Tinta** (§2.5–2.7) | hull px CSS + pembagi skala + warna 0,14; tabel sisi + LineSegments; `onormal` BASE; aturan tembus/attach; AO baru | siluet dinding 1,2–1,8 px di dist 22/110/300; siluet NPC & tokoh 1,5–2,5 px di dist 6,5 dan 110; garis kusen terukur 1,0–1,6 px (1280 px, dist 60); tidak ada garis ganda jendela di mv/*-jalan.png; jeruji/pagar tetap garis, bukan pita hitam |
| **3 Skala & kamera** (§4) | T=8, konstanta, rig 1:6,5, NPC, mobil, jalan 3 profil, phi 0,85 + ikat zoom, mode tokoh | kepala NPC ≤ 0,55 tinggi dinding; pintu > NPC; mobil muat lajur; `?jam=15` kota: 12–14 kavling selebar 1280 px, atap terlihat ≥ 60 % luasnya (elevasi 41°); boulevard terbaca di i=20 |
| **4 Tata bahasa fasad** (§5) + 8 tipe inti (rumah, rumah2, toko, warung, kafe, kos, kantor, rs) | primitif baru, hipGeo, 'YXZ', kaca 2 nada, 4 varian seed, lantai dari seed, adj celah 0, 3 unit ruko | ≥ 25 elemen/fasad; tri ≤ batas §6; edges ≤ 600/1.200; toko rot 90° tenda miring ke jalan; deret 3 rumah: 3 warna dinding beda, tanpa alur gelap; blok pusat memuat ≥ 3 tinggi berbeda |
| **5 Chunk & LOD** (§8.1) | cache `type|seed|adj` + slot, Int8/Uint8, drawRange A/B/C, prealloc + irisan 6 ms, pick box, kontrak makeVisual | `renderer.info.render.calls` ≤ 150 (utama) dengan 600 bangunan mock; tri ≤ 1,3 jt termasuk hull (hitung `info.render.triangles` − pass bayangan); frame terpanjang saat muat ≤ 16 ms (CPU throttling 4×); heap cache ≤ 30 MB |
| **6** | 21 tipe sisanya (§6), alas paving/rumput per distrik, sawah→kebun di pusat | sama; distrik pusat tanpa alas rumput |
| **7 Lingkungan** (§7) | pohon 250 tri 3 tier, tanah 2 nada, bukit, jalan 3 profil, sungai, sawah luar, 21 props, kabel/kawat di LineSegments chunk | pohon 5,4–7,8 u; strip rumput Δ V ≈ 10 % terukur; kabut mulai 260 u; FPS ≥ 30 throttling 4× |
| **8 Atlas** (§2.10, opsional) | uv/cell di merge, VMAT_ATLAS | genteng tiap .35 terlihat ≤ 220 u tanpa moiré; tanpa tepi sel bocor |
| **9 Poles** | awan bersegi, kilau sungai, bus, becak, applyHemat baru | perbandingan 4 sudut (`sv_before` jalan/sudut/atas/desa/drone); `?hemat=1` masih punya bayangan |

Setiap commit tahap menyimpan `web/*.tahapNx.bak`. Semua angka adalah target ukur; bila kriteria gagal, ubah konstanta di §2–§4, bukan menambah pass render.
