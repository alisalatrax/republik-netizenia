# Spesifikasi Tata Kota Final · Republik Netizenia v2

Gabungan tiga lensa (geometri blok, zonasi, orientasi) menjadi SATU aturan yang dipakai identik oleh
server (`nz.*` di p3.sql/p4.sql) dan halaman (c1_core.js, c2_engine.js, c3_data.js, c4_ui.js).

Keputusan inti (satu kalimat): **blok 6 lebar × 2 dalam, periode distrik 43 petak (arteri 2 petak +
6 blok + 5 kolektor), peta 217×217, 25 distrik @ 1.008 kavling = 25.200 kavling, setiap kavling
PASTI menyentuh jalan, arah hadap dihitung server dan disimpan (`facing`), setback deterministik
per (zona, grup), zonasi = ring distrik × kelas jalan TERTINGGI yang menyentuh tapak (`lot_class`), bukan kelas sisi yang dipilih pemain.**
[REVISI] Semula "kelas jalan di depan": itu membuat zona (= harga tanah, hak rumah gratis, lantai) bergantung pada
`p_want`; simulasi: 8.140 dari 25.200 kavling bisa berganti zona hanya dengan tombol Putar (mis. kavling pojok CBD
dibeli dengan harga RUKO, kavling pojok RUKO ring 1 dipakai rumah gratis). Zona sekarang sifat kavling, `facing` tetap bebas
di antara sisi yang sah.

Mengapa bukan ketiga usulan apa adanya:
- Lensa blok (4×2, 212×262) memberi 25.600 persis tetapi peta tidak persegi dan rasio kavling:jalan
  hanya 0,88 (terlalu banyak aspal, blok 24 unit terlalu pendek untuk kesan kampung).
- Lensa zonasi (12×2, N=196) hanya 23.232 kavling dan distrik pusat tidak sama besar.
- Lensa orientasi (8×2, N=226) memberi 30.000 kavling (terlalu lapang untuk 10.000 warga).
- Blok 6×2 + periode 43 adalah titik tengah: 1.008 ≈ "±1.000 kavling per kampung", 217 ≈ "~201",
  rasio kavling 53,5 %, stadion 4×2 tetap muat dalam satu blok, dan arteri bisa 2 petak (12 unit)
  sehingga "jalan utama kota besar" benar-benar terlihat beda dari gang.

Hasil simulasi (`(alat kerja internal) lens/grid_final.py`):
`sel 47.089 · kavling 25.200 (53,5 %) · jalan 21.889 · kavling tanpa muka jalan 0 · blok 2.100 semua 12 kavling ·
25 distrik @ 1.008 · ring0 1.008 / ring1 8.064 / ring2 16.128 · muka tertinggi: arteri 3.100, kolektor 6.500, gang 15.600 ·
256 kavling pusat lama → 256 kavling unik di distrik k12 · semua 23 fasilitas seed tetap satu blok.`
[REVISI] Diuji ulang pengkritik (`(alat kerja internal) kritik/uji_grid.py`,
semantik JS dan Postgres dijalankan terpisah): angka di atas benar; posisi sah per blok 1×1 12 · 2×1 10 · 1×2 2 · 2×2 5 · 4×2 3 · 2×4 0;
`block_of` JS = SQL untuk semua 25.200 kavling (beda hanya di koordinat negatif, lihat §1.3); 23 fasilitas seed tanpa tabrakan.

---

## 1. Rumus grid final

### 1.1 Konstanta
| Nama | Nilai | Arti |
|---|---|---|
| `T` | 6 | ukuran petak (unit dunia) |
| `PD` | 43 | periode distrik (petak): 2 arteri + 41 (6 blok×6 + 5 kolektor; 14 baris×2 + 13 gang) |
| `N` | 217 | petak per sisi (0..216); i=215,216 = arteri penutup |
| `HALF` | 108 | (N-1)/2; `wx(108)=0` jatuh di kolektor tengah distrik pusat |
| `BW`,`BD` | 6, 2 | blok 6 kavling lebar (sumbu i) × 2 dalam (sumbu j) |
| kelas jalan | 0 kavling · 1 gang (E-W, 1 petak) · 2 kolektor (N-S, 1 petak) · 3 arteri (2 petak, kedua sumbu) |
| dunia | 1.302 × 1.302 unit; ground plane ≥ 2.000; HALF dipakai untuk kedua sumbu (peta persegi) |

### 1.2 Pseudo-JS (c1_core.js, ganti baris 43-50)
```js
const T = 6, PD = 43, N = 217, HALF = (N - 1) / 2;                 // HALF = 108
const wx = i => (i - HALF) * T;                                      // dipakai untuk i dan j
const roadI = i => { const u = i % PD; return u < 2 ? 3 : (u - 2) % 7 === 6 ? 2 : 0; };   // u∈{0,1} arteri; u∈{8,15,22,29,36} kolektor
const roadJ = j => { const v = j % PD; return v < 2 ? 3 : (v - 2) % 3 === 2 ? 1 : 0; };   // v∈{0,1} arteri; v∈{4,7,...,40} gang
const inMap = (i, j) => i >= 0 && j >= 0 && i < N && j < N;
const isRoad = (i, j) => inMap(i, j) && (roadI(i) > 0 || roadJ(j) > 0);
const isLot  = (i, j) => inMap(i, j) && roadI(i) === 0 && roadJ(j) === 0;
const blockOf = (i, j) => [Math.floor(i / PD) * 6 + Math.floor((i % PD - 2) / 7),
                           Math.floor(j / PD) * 14 + Math.floor((j % PD - 2) / 3)];   // bx 0..29, by 0..69
const sameBlock = (i, j, w, h) => { const a = blockOf(i, j), b = blockOf(i + w - 1, j + h - 1); return a[0] === b[0] && a[1] === b[1]; };
const dIdx = i => Math.floor(i / PD);                                                 // 0..4 (i=215,216 → 5, hanya jalan)
// [REVISI] blockOf/dIdx/districtOf/ringOf HANYA sah untuk 0 <= i,j < N. Untuk i<0 JS Math.floor(-3/7) = -1 tetapi
// Postgres (-3)/7 = 0 → hasil beda. Semua pemanggil wajib lolos inMap/isLot lebih dulu (fitsLocal cek isLot dua sudut
// sebelum sameBlock; SQL block_of/district_of mengembalikan null bila di luar peta).
const districtOf = (i, j) => 'k' + String(Math.min(dIdx(j), 4) * 5 + Math.min(dIdx(i), 4)).padStart(2, '0');   // 'k00'..'k24', pusat 'k12'
const ringOf = (i, j) => Math.max(Math.abs(Math.min(dIdx(i), 4) - 2), Math.abs(Math.min(dIdx(j), 4) - 2));     // 0 pusat, 1 kota, 2 desa
const DISTRICTS = [...Array(25)].map((_, n) => 'k' + String(n).padStart(2, '0'));
const DIST_RECT = Object.fromEntries(DISTRICTS.map((k, n) => [k, [(n % 5) * PD, Math.floor(n / 5) * PD, (n % 5) * PD + PD, Math.floor(n / 5) * PD + PD]]));
const OPEN_AT_START = DISTRICTS.filter(k => ringOf(DIST_RECT[k][0] + 2, DIST_RECT[k][1] + 2) <= 1);   // 9 distrik: k06 k07 k08 k11 k12 k13 k16 k17 k18

// muka jalan: jalan selalu garis penuh, jadi satu angka per sisi sudah mewakili seluruh sisi tapak
const fronts = (i, j, w, h) => ({ S: roadJ(j + h), N: roadJ(j - 1), E: roadI(i + w), W: roadI(i - 1) });
// facing: 0 = +z (pintu ke selatan, jalan di baris j+h), 1 = +x (timur), 2 = -z (utara), 3 = -x (barat)
const FACE_DIR = [[0, 1], [1, 0], [0, -1], [-1, 0]], FACE_PRI = { 0: 0, 2: 1, 1: 2, 3: 3 };
function facingOf(i, j, w, h, cw, ch, want){
  const f = fronts(i, j, w, h);
  const c = [[0, f.S, w === cw], [2, f.N, w === cw], [1, f.E, w === ch], [3, f.W, w === ch]].filter(v => v[1] > 0 && v[2]);
  if (!c.length) return null;                                       // tidak punya muka jalan yang sah
  if (want != null && c.some(v => v[0] === want)) return want;      // pilihan pemain (tombol Putar) bila sah
  c.sort((a, b) => b[1] - a[1] || FACE_PRI[a[0]] - FACE_PRI[b[0]]); // kelas tertinggi, seri → S, N, E, W
  return c[0][0];
}
const frontClass = (i, j, w, h, facing) => fronts(i, j, w, h)[['S', 'E', 'N', 'W'][facing]];
// [REVISI] kelas kavling = kelas tertinggi dari 4 sisi tapak; zona dihitung dari ini, bukan dari facing
const lotClass = (i, j, w, h) => { const f = fronts(i, j, w, h); return Math.max(f.S, f.N, f.E, f.W); };
const zoneOfLot = (i, j, w, h) => zoneOf(ringOf(i, j), lotClass(i, j, w, h));
```

### 1.3 Pseudo-SQL (p3.sql, ganti baris 35-48; semua `immutable`)
```sql
create function nz.road_i(p_i int) returns int language sql immutable as $$
  select case when p_i % 43 < 2 then 3 when (p_i % 43 - 2) % 7 = 6 then 2 else 0 end $$;
create function nz.road_j(p_j int) returns int language sql immutable as $$
  select case when p_j % 43 < 2 then 3 when (p_j % 43 - 2) % 3 = 2 then 1 else 0 end $$;
create function nz.is_lot(p_i int, p_j int) returns boolean language sql immutable as $$
  select p_i between 0 and 216 and p_j between 0 and 216 and nz.road_i(p_i) = 0 and nz.road_j(p_j) = 0 $$;
-- [REVISI] ketiga fungsi di bawah mengembalikan null di luar peta: (-3)/7 = 0 di Postgres tetapi Math.floor(-3/7) = -1 di JS,
-- jadi hasil untuk koordinat negatif TIDAK identik dan tidak boleh dipakai. Di dalam peta (0..216) identik (diuji 25.200 kavling).
create function nz.block_of(p_i int, p_j int) returns int[] language sql immutable as $$
  select case when p_i between 0 and 216 and p_j between 0 and 216
         then array[(p_i / 43) * 6 + (p_i % 43 - 2) / 7, (p_j / 43) * 14 + (p_j % 43 - 2) / 3] end $$;
create function nz.district_of(p_i int, p_j int) returns text language sql immutable as $$
  select case when p_i between 0 and 216 and p_j between 0 and 216
         then 'k' || lpad((least(p_j / 43, 4) * 5 + least(p_i / 43, 4))::text, 2, '0') end $$;
create function nz.ring_of(p_i int, p_j int) returns int language sql immutable as $$
  select case when p_i between 0 and 216 and p_j between 0 and 216
         then greatest(abs(least(p_i / 43, 4) - 2), abs(least(p_j / 43, 4) - 2)) end $$;
-- [REVISI] kelas kavling (sumber zona): kelas tertinggi dari 4 sisi tapak
create function nz.lot_class(p_i int, p_j int, p_w int, p_h int) returns int language sql immutable as $$
  select greatest(nz.road_j(p_j + p_h), nz.road_j(p_j - 1), nz.road_i(p_i + p_w), nz.road_i(p_i - 1)) $$;
create function nz.facing_of(p_i int, p_j int, p_w int, p_h int, p_cw int, p_ch int, p_want int default null)
returns int language sql immutable as $$
  with s(dir, cls, ok, pri) as (values
    (0, nz.road_j(p_j + p_h), p_w = p_cw, 0),
    (2, nz.road_j(p_j - 1),   p_w = p_cw, 1),
    (1, nz.road_i(p_i + p_w), p_w = p_ch, 2),
    (3, nz.road_i(p_i - 1),   p_w = p_ch, 3))
  select dir from s where cls > 0 and ok
  order by (dir = p_want) desc nulls last, cls desc, pri limit 1 $$;
create function nz.front_class(p_i int, p_j int, p_w int, p_h int, p_facing int) returns int language sql immutable as $$
  select case p_facing when 0 then nz.road_j(p_j + p_h) when 2 then nz.road_j(p_j - 1)
                       when 1 then nz.road_i(p_i + p_w) else nz.road_i(p_i - 1) end $$;
```
Catatan kesamaan: `-1 % 43` = -1 di JS maupun Postgres → `< 2` → kelas 3 (tepi peta dianggap arteri). `p_i % 43 - 2`
tidak pernah negatif karena cabang `< 2` dievaluasi lebih dulu. Tidak ada pembagian bilangan negatif.
[REVISI] Tambahan: (a) `road_i(-1)`/`road_j(-1)` sebenarnya tidak pernah dipakai untuk kavling, karena kolom/baris kavling
pertama adalah u=2 (i-1 = 1 = arteri) — aman. (b) `facing_of` SQL: `order by (dir = p_want) desc nulls last` — bila
`p_want` null semua baris bernilai null → urutan jatuh ke `cls desc, pri`; bila `p_want` ada tetapi bukan kandidat, tidak ada
baris true → juga jatuh ke otomatis. Sama persis dengan JS. (c) Semua `abs(hashtext(x))` di spek ini diganti
`(hashtext(x) & 2147483647)`: `abs(-2147483648)` pada int4 melempar "integer out of range" dan akan menggagalkan seed/migrasi
(peluang kecil, tetapi deterministik dan permanen untuk string yang kena).

### 1.4 ASCII satu distrik (periode 43×43), sudut kiri-atas u=0..16, v=0..9
```
   u: 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 ...
v=0   # # # # # # # # # # # # # # # # #     ← arteri (2 petak = 12 unit, median)
v=1   # # # # # # # # # # # # # # # # #
v=2   # # n n n n n n | n n n n n n | n n   ← baris 1 blok: hadap N (arteri) → zona CBD/RUKO  [REVISI] pojok u=2: N arteri(3) seri W arteri(3) → prioritas S,N,E,W → N
v=3   # # W s s s s s | s s s s s s | s s   ← baris 2 blok: hadap S (gang v=4)
v=4   # # - - - - - - | - - - - - - | - -   ← gang (1 petak, aspal 2,4)
v=5   # # W n n n n E | n n n n n E | n n   ← hadap N (gang v=4); kolom ujung hadap kolektor (W/E)
v=6   # # W s s s s E | s s s s s E | s s   ← hadap S (gang v=7)
v=7   # # - - - - - - | - - - - - - | - -
v=8   # # W n n n n E | n n n n n E | n n
v=9   # # W s s s s E | s s s s s E | s s
 ...                                           (pola v=5..7 berulang sampai v=40)
v=41  # # W n n n n E | n n n n n E | n n   ← hadap N (gang v=40)
v=42  # # s s s s s s | s s s s s s | s s   ← hadap S (arteri v=43≡0 distrik berikutnya)  [REVISI] pojok u=2 seri arteri → S
```
`#` arteri, `|` kolektor (u=8,15,22,29,36), `-` gang, `n/s` kavling hadap utara/selatan, `W/E` kavling ujung blok
yang hadap kolektor/arteri (kelas lebih tinggi mengalahkan gang). Tiap blok = 6×2 = 12 kavling, 36×12 unit.
Per distrik: 36 kolom × 28 baris = 1.008 kavling; 124 bermuka arteri, 260 bermuka kolektor, 624 hanya gang.

### 1.5 Jumlah kavling nyata
- 217×217 = 47.089 sel → **25.200 kavling** (25 × 1.008), 2.100 blok, 21.889 sel jalan.
- Mengapa bukan 201×201 / 25.600: 201×201 hanya ≈ 18.600 kavling bila semua bermuka jalan; 25.600 persis
  tidak bisa dibagi 25 distrik sama besar dengan blok 2 dalam dan arteri 2 petak. 1.008/kampung adalah yang terdekat ke "±1.000".
- Kapasitas: 10.000 NPC memakai ±1.800 kavling (7 %), sisanya untuk pemain dan proyek.

### 1.6 [REVISI] Kapasitas untuk 10.000 PEMAIN (maks 6 bangunan, rumah pertama gratis)
Hitungan dari simulasi (zona = `lot_class`):
| | CBD/RUKO/RUKO_KECIL (tidak boleh rumah gratis) | KAMPUNG/KOTA/DESA (boleh) |
|---|---|---|
| ring 0 (1 distrik) | 384 | 624 |
| ring 1 (8) | 3.072 | 4.992 |
| ring 2 (16) | 1.984 | 14.144 |
| **total** | **5.440** | **19.760** |

- Saat peluncuran hanya 9 distrik terbuka → kavling layak rumah gratis = 624 + 4.992 = 5.616, dikurangi rumah NPC
  ±1.600-1.800 (semua di KAMPUNG ring 1) dan proyek negara (ring 0 6 %, ring 1 10 % → ±540) → **±3.300 kavling** untuk
  rumah gratis pemain. Bila 10.000 pemain datang sebelum distrik ring 2 dibuka lewat voting, pemain ke-3.300 dan
  seterusnya TIDAK bisa mendapat rumah gratis. Ini bertentangan dengan janji "rumah pertama gratis".
- Peta penuh: 25.200 − 1.800 NPC − ±2.000 seed/proyek negara ≈ 21.400 kavling / 10.000 pemain ≈ **2,1 kavling per
  pemain**. Batas 6 bangunan pribadi tetap (aturan game tidak diubah), tetapi secara fisik rata-rata pemain hanya akan
  punya 1-2 bangunan; 6 hanya tercapai bila sebagian besar pemain pasif. 25.600/201×201 dari permintaan awal pun tidak
  mengubah kesimpulan ini (hanya +1,6 %).
- Aturan tambahan (tidak mengubah aturan voting distrik, hanya menambah pemicu negara) — dijalankan di `tick_hourly`:
  1. `v_sisa := count(kavling kosong zona KAMPUNG/KOTA/DESA di distrik terbuka)`; bila `v_sisa < 400` dan tidak ada
     `district_proposals` berstatus voting/menunggu_kas, negara (proposer_label 'Pemerintah', proposer_id null) membuat
     usulan pembukaan distrik tertutup dengan ring terkecil lalu key terkecil → tetap divoting 24 jam seperti biasa.
  2. Bila `v_sisa < 150` ("darurat perumahan"): `nz.open_district(key, false)` dipanggil langsung dengan biaya 0 dan berita
     "Program Transmigrasi: Kampung X dibuka negara". Ini satu-satunya jalur yang melewati voting; pemilik harus
     menyetujui secara eksplisit, kalau tidak hapus butir 2 dan terima bahwa rumah gratis bisa habis.
  3. `suggest_lot()` mengembalikan null → UI menampilkan "Kavling kampung penuh, usulkan pembukaan distrik" dan
     menautkan ke form usulan distrik (fitur 2 usulan aktif per pemain tetap berlaku untuk usulan ini).
- Pembukaan 8 distrik ring 1 saat migrasi (tanpa voting) juga melewati aturan voting distrik; dicatat sebagai keputusan
  negara satu kali dengan berita per distrik "dibuka oleh negara dalam penataan kota" dan `opened_at = now()`.

---

## 2. Aturan penempatan bangunan per tipe

Semua lewat `nz.place()` (server) dan `fitsLocal()` (halaman) dengan 6 cek berurutan [REVISI: cek 0 baru, cek 4 diubah]:
0. `(w,h) in ((cw,ch),(ch,cw))` → "Ukuran tapak tidak sesuai katalog." (tanpa ini `facing_of` bisa menerima tapak
   sembarang, mis. 2×2 untuk katalog 2×1; dilewati bila `p_check_zone=false` untuk warisan seed 'tani' 2×2).
1. `isLot(i,j) && isLot(i+w-1,j+h-1)` → "Tidak bisa di atas jalan." (blok = persegi penuh kavling, dua sudut cukup).
   Cek ini WAJIB sebelum cek 2 karena `blockOf` tidak sah untuk koordinat di luar peta (§1.3).
2. `sameBlock(i,j,w,h)` → "Harus muat dalam satu blok (maks 6 lebar × 2 dalam)."
3. `facingOf(i,j,w,h,cw,ch,want) != null` → "Muka bangunan harus ke jalan."
4. zona: `v_zone := zone_of(ring_of(i,j), lot_class(i,j,w,h))`; `catalog.zones @> array[v_zone]` → "Jenis ini tidak boleh
   di zona X." Zona TIDAK bergantung pada `facing`/`p_want`; harga tanah, rumah gratis, dan `floors_for` memakai `v_zone`
   dan `lot_class` ini. Kolom `front_class` tetap disimpan (kelas sisi pintu, untuk visual kanopi/tenda) tetapi tidak
   dipakai aturan apa pun.
5. kosong (PK `building_tiles(i,j)`) dan distrik terbuka.

[REVISI] Kolom "kelas jalan depan yang boleh" DIHAPUS: zona sudah memuat kelas (CBD=3 ring0, RUKO=2/3, KOTA/KAMPUNG/DESA=1
kecuali KAMPUNG ring 2 = 2), dan kolom lama bertentangan dengan dirinya sendiri (toko "kelas 2,3" tetapi zona KOTA yang
hanya punya kelas 1; sekolah/rs/lapangan "2,3"/"1,2" tetapi zona KAMPUNG/DESA = gang; stadion 4×2 di a=0 atau a=2 selalu
menyentuh kolektor → zona RUKO padahal RUKO tidak diizinkan → hanya a=1 yang mungkin). Satu-satunya aturan: `zone ∈ zones`.
Daftar zona fasilitas umum dilonggarkan supaya tiap tipe punya ≥ 3 posisi sah per blok yang zonanya cocok.

| Tipe | Tapak (cw×ch) | Tapak diputar | Zona (zona = ring × lot_class) | Catatan |
|---|---|---|---|---|
| rumah, rumah2 | 1×1 | – | KOTA, KAMPUNG, DESA | rumah gratis hanya di zona ini; kavling ujung blok ring 0-1 (sentuh kolektor) otomatis RUKO → bukan untuk rumah |
| kos | 2×1 | 1×2 hanya di kolom ujung blok (u∈{2,7,9,14,16,21,23,28,30,35,37,42}) | RUKO, RUKO_KECIL, KOTA, KAMPUNG | muka 2 kavling selalu ke jalan |
| ruko (BARU) | 1×1 | – | CBD, RUKO, RUKO_KECIL | fasad rapat, 2-4 lantai |
| warung | 1×1 | – | semua kecuali CBD | tenda ke trotoar |
| kafe | 1×1 | – | CBD, RUKO, RUKO_KECIL, KOTA | |
| toko | 2×1 | 1×2 di kolom ujung | CBD, RUKO, RUKO_KECIL, KOTA, KAMPUNG | toko kelontong di gang kampung sah |
| bengkel | 2×1 | 1×2 di kolom ujung | RUKO, RUKO_KECIL, KAMPUNG | |
| sawah | 2×1 | 1×2 di kolom ujung | DESA, KAMPUNG ring 2 | |
| kebun (BARU) | 1×1 | – | DESA | |
| kantor | 2×2 | – (persegi) | CBD, RUKO | h=2 → dua muka; hadap kelas tertinggi |
| apartemen | 2×2 | – | CBD | 10-12 lantai |
| taman | 1×1 | – | semua | |
| lapangan | 2×2 | – | semua kecuali CBD | |
| sekolah | 2×2 | – | semua kecuali CBD | |
| rs | 2×2 | – | CBD, RUKO, RUKO_KECIL, KOTA, KAMPUNG | |
| polisi | 2×1 | 1×2 di kolom ujung | semua | |
| penjara | 2×1 | 1×2 di kolom ujung | KAMPUNG, DESA, RUKO_KECIL (ring ≥ 1) | |
| ibadah | 2×1 | 1×2 di kolom ujung | semua kecuali CBD | |
| pkl, pangkalan (BARU) | 2×1 | 1×2 di kolom ujung | RUKO, RUKO_KECIL (pangkalan juga KAMPUNG) | |
| pasar | 2×2 | – | CBD, RUKO, RUKO_KECIL | |
| pln | 1×1 | – | KAMPUNG, DESA, KOTA, RUKO_KECIL | |
| stadion | 4×2 | 2×4 SELALU ditolak (cek blok) | KOTA, KAMPUNG, RUKO, RUKO_KECIL | 3 posisi/blok (a=0..2); a=0 dan a=2 berzona RUKO karena sentuh kolektor |
| istana, tugu, bank | 2×2 / 2×2 / 2×1 | – | CBD (bangunan baru); yang dimigrasi dikecualikan (§6) | protected |
| terminal (BARU) | 4×2 | – | CBD | lot_class = maks → arteri (3) mengalahkan kolektor: semua 3 posisi di 12 blok tepi arteri k12 (by=0 dan by=13) sah = 36 posisi, plus a=0 di blok kolom 0 dan a=2 di blok kolom 5 (sentuh arteri W/E) — cukup |
| barak, pabrik, waduk | 2×2 | – | KAMPUNG, DESA, RUKO_KECIL (ring ≥ 1); pabrik juga RUKO ring 1 | |
| proyek_gedung / proyek_rumah / lahan_material (BARU, negara) | 2×2 / 1×1 / 1×1 | – | mengikuti tipe hasil | stage='bangun' |

Tombol **Putar** (c4_ui.js:505) berubah makna: untuk tipe non-persegi menukar tapak (w,h) seperti sekarang,
LALU `facingOf` dihitung ulang; untuk tipe persegi di kavling pojok, Putar menyiklus `want` di antara sisi yang sah.
Server menerima `p_want` dan hanya memakainya bila termasuk kandidat (`cls > 0 and ok`); kalau tidak, pakai hasil otomatis.
[REVISI] `p_want` hanya mengubah `facing` (arah pintu/teras/kanopi), tidak pernah mengubah zona, harga, atau lantai.

Matriks muat per blok 6×2 (posisi a = kolom dalam blok 0..5, b = baris 0..1):
- 1×1: 12 posisi. 2×1: a∈0..4, dua baris → 10. 1×2: hanya a∈{0,5} → 2 (hadap W/E). 2×2: a∈0..4 → 5.
- 4×2: a∈0..2 → 3. 2×4 / 4×4: 0 (ditolak). 6×2 (blok penuh) tidak ada di katalog.

---

## 3. Zonasi 25 kampung dan props per zona

### 3.1 Ring dan zona
```sql
create function nz.zone_of(p_ring int, p_klass int) returns text language sql immutable as $$
  select case
    when p_ring = 0 and p_klass = 3 then 'CBD'
    when p_ring = 0 and p_klass = 2 then 'RUKO'
    when p_ring = 0                 then 'KOTA'
    when p_ring = 1 and p_klass >= 2 then 'RUKO'
    when p_ring = 1                 then 'KAMPUNG'
    when p_ring = 2 and p_klass = 3 then 'RUKO_KECIL'
    when p_ring = 2 and p_klass = 2 then 'KAMPUNG'
    else 'DESA' end $$;
-- JS identik: const zoneOf = (ring, k) => ring === 0 ? (k === 3 ? 'CBD' : k === 2 ? 'RUKO' : 'KOTA') : ring === 1 ? (k >= 2 ? 'RUKO' : 'KAMPUNG') : (k === 3 ? 'RUKO_KECIL' : k === 2 ? 'KAMPUNG' : 'DESA');
```
Matriks ring \ kelas kavling (`lot_class`, [REVISI] bukan kelas depan): ring0 [3:CBD, 2:RUKO, 1:KOTA] · ring1 [3:RUKO, 2:RUKO, 1:KAMPUNG] · ring2 [3:RUKO_KECIL, 2:KAMPUNG, 1:DESA].
Jumlah per distrik (1×1): ring0 CBD 124 / RUKO 260 / KOTA 624 · ring1 RUKO 384 / KAMPUNG 624 · ring2 RUKO_KECIL 124 / KAMPUNG 260 / DESA 624.

Tabel `nz.districts`: 25 baris, `key` 'k00'..'k24', `name` ('Kampung Pusat' k12; ring 1: 'Kampung Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'; ring 2: 'Desa <arah> 1..2' dst.), kolom baru `ring int`, `fill_pct int` (ring1 75, ring2 55), `is_open` true untuk 9 distrik ring ≤ 1, `cost` 2.000 (ring 2).
`districtOf` menghasilkan key, nama tampilan hanya dari tabel/`DIST_NAME`.

Protokol (visual saja, kelas tetap 3): 4 arteri yang mengelilingi k12, yaitu i∈{86,87} dan i∈{129,130} untuk j∈86..130, serta j∈{86,87} dan j∈{129,130} untuk i∈86..130 → median pohon + lampu ganda + zebra.

Harga tanah (p4.sql build_private baris 309): `20*w*h` → `20*w*h*nz.land_mult(zone)`: CBD 4,0 · RUKO 2,5 · RUKO_KECIL 1,5 · KOTA 1,5 · KAMPUNG 1,0 · DESA 0,5.
Rumah gratis: `if v_free and v_zone not in ('KAMPUNG','KOTA','DESA') then raise exception 'Rumah gratis hanya di kampung/perumahan, bukan di muka jalan utama.'`
([REVISI] `v_zone` dari `lot_class`, sehingga tidak bisa diakali dengan `p_want`).
Pendapatan usaha `c.rev` × 1,4 CBD · 1,2 RUKO · 1,0 lain · 0,8 DESA (sawah/kebun 1,3 di DESA).

Lantai:
```sql
-- [REVISI] p_klass = nz.lot_class(...), bukan front_class
create function nz.floors_for(p_type text, p_ring int, p_klass int) returns int language sql immutable as $$
  select case p_type
    when 'ruko'      then case p_klass when 3 then 4 when 2 then 3 else 2 end
    when 'kantor'    then case when p_ring = 0 then (case p_klass when 3 then 8 else 6 end) else 4 end
    when 'apartemen' then case when p_ring = 0 then 12 else 6 end
    when 'kos'       then case when p_ring = 0 and p_klass >= 2 then 3 else 2 end
    when 'toko'      then case when p_klass = 3 then 2 else 1 end
    when 'rumah2'    then 2
    when 'rs'        then case when p_ring = 0 then 5 else 3 end
    else 1 end $$;
```
Siluet dari pusat: arteri ring 0 = 8-12 lantai; kolektor ring 0 & arteri ring 1 = 3-4 (ruko); gang ring 0-1 = 1-2; ring 2 = 1 lantai + sawah.

### 3.2 Props per zona (semua dari `hashStr(i+','+j)` di klien, tanpa tabel; InstancedMesh per jenis, 25 chunk distrik, aktif hanya chunk dalam radius 2 distrik dari kamera; anggaran ≤ 40.000 instance / ≤ 9.000 aktif per frame, LOW separuh)
| Zona | Jalan & perabot | Kendaraan | Bangunan negara seed |
|---|---|---|---|
| CBD (arteri ring 0) | protokol: median pohon 1/2 petak, lampu ganda tiap 2 petak, halte 1/2 petak, tong sampah 1/3 kavling, lampu lalu lintas di 4 simpang protokol×arteri, zebra; kabel listrik bawah tanah | angkot bergerak 1/60 petak arteri, mobil, 2 truk material per proyek_gedung, 6 angkot di terminal | tugu, istana, bank, pasar, terminal 4×2, 2 apartemen 12 lantai, 3 kantor 6-8 lantai, ruko negara 40 % muka protokol, proyek_gedung 6 % |
| RUKO (kolektor ring 0, arteri+kolektor ring 1) | tiang listrik 2 sisi pitch 2 petak + kabel lendut 0,5 + trafo tiap 5 tiang, papan nama, kanopi/tenda 0,9 ke trotoar, billboard 4×2 di atap ruko sudut arteri (hash%5==0), warung tenda hash%4==1 & gerobak hash%6==2 di depan kavling berisi | 2-4 motor miring 30° di depan tiap ruko/toko, angkot ngetem 1-2 di tiap simpang kolektor×arteri, pangkalan 2×1 | ruko negara 25 % muka arteri ring 1, pangkalan angkot 1/distrik, proyek 10 % |
| KOTA (gang ring 0) | tiang listrik 1 sisi pitch 3 petak di titik j%3 gang ± 0,5, pagar 1,0 + gerbang, garasi, lampu tiap 3 petak | 1 mobil di garasi 50 % | taman, sekolah |
| KAMPUNG (gang ring 1 / kolektor ring 2) | tiang listrik 1 sisi pitch 3, jemuran + antena parabola 30 % atap, spanduk melintang gang tiap 12 petak, pos ronda 1/blok di ujung gang, atap seng 60 %/genteng 40 % | motor 40 % di depan rumah, ojek di simpang gang×kolektor | proyek_rumah 10 %, lahan_material, pln, lapangan, ibadah |
| RUKO_KECIL (arteri ring 2) | tiang listrik 2 sisi, warung/bengkel/toko 1-2 lantai, pom bensin mini 2×1 tiap 2 distrik | truk, angkot antar-desa | pasar desa, pangkalan ojek |
| DESA (gang ring 2) | jalan tanah #C9A86A tanpa marka (aspal hanya arteri+kolektor), patok kayu tiap 4 petak, pohon kelapa/pisang 2/kavling, rumah panggung 30 %, dinding anyaman #C8A97A | sepeda, gerobak | sawah negara 2×1 di 35 % muka gang (bisa diklaim Petani 60 NC), kebun 1×1, sekolah dasar, ibadah |

Distrik ring 2 belum dibuka: 60 % kavling sawah bergaris (#A9CF56/#7FC3D9) + 25 % kebun + 10 % pohon liar + 5 % gubuk, jalan arteri sudah aspal (kerangka negara), kolektor/gang tanah. `open_district` → "Jalan Kampung X mulai diaspal" dan `nz.seed_district(key)`.

"Negara sedang dibangun": `h = (hashtext(i||'-'||j) & 2147483647) % 1000` ([REVISI] bukan `abs`, lihat §1.3 c); ring 0 h<60, ring 1 h<100, ring 2 h<40 → kavling kosong jadi proyek negara (`stage='bangun'`, owner null, npc_staff 2-4, build_hours 240-720, boleh dibantu pemain). Varian h%10: CBD/RUKO & 2×2 kosong → proyek_gedung (crane 17,5 unit, jib berputar, maks 12 crane/distrik); lainnya 50 % proyek_rumah (perancah bambu #D9B26A, besi beton, dinding bata ekspos #B5604A), 20 % lahan_material (tumpukan bata, pasir kerucut r1,2, pagar seng #8E979C 1,8 + papan proyek 1,4×0,9 teks canvas 'PROYEK PEMBANGUNAN <nama> / Usulan: <proposer> / Selesai: <jam>'). applyProgress: <0,35 pondasi+kolom; 0,35-0,7 bata ekspos+perancah; 0,7-1 plester+jendela.

---

## 4. Setback & orientasi untuk pemodel

### 4.1 Geometri cadangan jalan (per petak 6 unit; tepi kavling = 3,0 dari as jalan 1 petak, 6,0 dari as arteri)
| Kelas | Aspal | Sisi per tepi | Isi tepi | Overhang maks (= tepi − 0,3) |
|---|---|---|---|---|
| 1 gang | 2,4 | 1,8 | bahu paving/tanah, tiang listrik | 1,5 |
| 2 kolektor | 3,6 | 1,2 | trotoar #E4DDCB, marka putus | 0,9 |
| 3 arteri (12 unit) | 2 × 4,2 | 1,2 | trotoar + median 1,2 (pohon/lampu ganda), marka tengah, zebra di tiap simpang | 0,9 |

### 4.2 Kerangka F (dihitung di klien dari zona + grup, deterministik → garis fasad satu jalan lurus)
```js
// lw, lh = ukuran tapak dalam ruang model (lw = facing%2 ? h : w; lh = facing%2 ? w : h)
// sb = {f depan, s samping, b belakang} dari SETBACK[grpKey][zoneKey]
function frame(lw, lh, sb){ return { x0: -lw*T/2 + sb.s, x1: lw*T/2 - sb.s, z1: lh*T/2 - sb.f, z0: -lh*T/2 + sb.b, edge: lh*T/2, side: lw*T/2 }; }
```
| Grup / zona | f (depan) | s (samping) | b (belakang) | Elemen depan |
|---|---|---|---|---|
| rumah, rumah2 · KAMPUNG, DESA | 1,2 | 0,2 | 0,4 | teras 1,0 dari z1 ke edge−0,2; tembok rendah 0,4 di edge−0,15; TANPA halaman rumput (alas paving #D9CDB5) |
| rumah, rumah2 · KOTA | 2,0 | 0,9 | 0,6 | pagar 1,0 di edge−0,15 dengan gerbang 1,4 di sumbu pintu; garasi/carport di sisi x1; alas rumput |
| kos | 1,0 | 0,2 | 0,4 | parkir 3-5 motor di teras |
| ruko, toko, kafe, bengkel · CBD/RUKO/RUKO_KECIL | 0,6 | 0,0 | 0,5 | fasad menempel tetangga; kanopi dari z1 ke edge+0,9; tangga 0,4; papan nama di z1+0,06 y=3,0; rolling door |
| ruko/toko/kafe · KOTA/KAMPUNG (kelas 1) | 0,8 | 0,0 | 0,5 | kanopi ke edge+1,2 |
| warung | 0,4 | 0,6 | 1,2 | tenda terpal ke edge+0,9 (kelas 2/3) atau edge+1,4 (gang) |
| kantor, apartemen, sekolah, rs, polisi, bank, istana, terminal | 2,4 | 1,2 | 1,0 | pelataran parkir (6 motor + 2 mobil di kantor), pagar 1,0 |
| taman, lapangan, sawah, kebun, pkl, pangkalan | 0,3 | 0,3 | 0,3 | tanpa badan |
| tapak h=2 (dua muka jalan) | sisi belakang memakai f_belakang 0,8 (pintu samping/gudang), bukan b | | | |

Aturan tetap: pintu (`door`), `winRow`, teras, pagar, kanopi, papan nama SELALU di sisi +z model (z1 / edge). Karena satu
geometri gabungan `inner` diputar `inner.rotation.y = facing * Math.PI / 2` (0=+z, π/2→+x, π→−z, 3π/2→−x; terverifikasi
rumus rotasi three.js: (0,0,1) · R_y(π/2) = (1,0,0)), pintu/teras/pagar otomatis menghadap jalan. Crane/perancah tetap di `root` (tapak dunia).
`m(F, c, wl, floors)` menggantikan `m(fx, fz, c, wl)`: badan = `box(F.x1-F.x0, H, F.z1-F.z0, (F.x0+F.x1)/2, 0, (F.z0+F.z1)/2, wl)`;
tinggi lantai 2,2 (ruko lantai dasar 3,2); jendela per lantai dalam loop `for f in 0..floors-1`; atap datar + tandon/AC untuk ruko/kantor, pelana untuk rumah.
Assert dev: `F.edge + overhang <= edge + sisi(kelas) − 0,3`.
Alas kavling: `box(lw*T-.1, .08, lh*T-.1)` warna paving/beton untuk KAMPUNG/RUKO/CBD; rumput hanya KOTA/DESA/taman.
Variasi hanya di dimensi yang tidak merusak garis: warna dinding `WALLS[hash%8]`, genteng seragam per blok `GENTENG[hash(blok)%5]`, jemuran/tandon/antena di atap.
Titik spawn jalan kaki (c2_engine.js:463): `walk = center + FACE_DIR[facing] * (lh*T/2 + 1.8)`.
Mode bangun: pratinjau menggambar segitiga kecil di sisi `FACE_DIR[facingOf(...)]` sebelum Bangun ditekan.

---

## 5. Algoritma `seed_npc_homes()` v2 (p3.sql, ganti baris 630-676)

Prinsip: (1) semua lewat `nz.place` yang menolak facing null; (2) pusat k12 tanpa rumah NPC (hanya 2 apartemen negara
untuk sisa); (3) isi BLOK demi BLOK (bukan `order by md5`) di zona KAMPUNG distrik ring 1, mulai blok terdekat
ke pusat distrik, supaya kampung tumbuh sebagai gumpalan rapat di belakang jalan utama; (4) kuota per distrik ring 1
= ceil(total/8) (10.000 → 1.250); (5) 15 % kavling pola dilewati → lokasi proyek/lahan material.

```sql
create function nz.seed_npc_homes() returns int language plpgsql as $$
declare
  v_ids bigint[]; v_k int := 1; v_total int; v_quota int; v_used int; v_houses int := 0; v_bid bigint;
  d record; side record; p int; ch text; v_type text; v_w int; v_cap int; v_i int; v_j int; v_cw int;
  pat text[] := array['rRkkrR', 'kkrRrr', 'rrRkkR', 'RrkkrX', 'rXkkRr'];   -- r rumah(4) R rumah2(8) kk kos 2x1(14) X kosong
begin
  select array_agg(id order by id) into v_ids from nz.npcs where home_building_id is null and not hidden and claimed_by is null;
  v_total := coalesce(array_length(v_ids, 1), 0); if v_total = 0 then return 0; end if;
  v_quota := ceil(v_total / 8.0);
  for d in select key, (substr(key,2)::int % 5) dx, (substr(key,2)::int / 5) dy from nz.districts
           where ring = 1 and is_open order by key loop
    v_used := 0;
    -- satu "sisi blok" = 6 kavling berurutan di baris b (0 = baris utara, hadap N; 1 = baris selatan, hadap S)
    for side in
      select bi, bj, b, d.dx*43 + 2 + bi*7 as i0, d.dy*43 + 2 + bj*3 + b as j0,
             abs(bi - 2.5) + abs(bj - 6.5) * 0.5 as dist_pusat               -- blok tengah distrik dulu
      from generate_series(0, 5) bi, generate_series(0, 13) bj, generate_series(0, 1) b
      where nz.zone_of(1, case when b = 0 then nz.road_j(d.dy*43 + 2 + bj*3 - 1) else nz.road_j(d.dy*43 + 2 + bj*3 + 2) end) = 'KAMPUNG'
      order by dist_pusat, bj, b, bi
    loop
      exit when v_k > v_total or v_used >= v_quota;
      p := 0;
      while p < 6 loop
        exit when v_k > v_total;
        ch := substr(pat[1 + (hashtext(d.key || side.bi || '-' || side.bj || '-' || side.b) & 2147483647) % 5], p + 1, 1);   -- [REVISI] & bukan abs
        v_i := side.i0 + p; v_j := side.j0;
        if ch = 'X' or (hashtext(v_i || ',' || v_j) & 2147483647) % 100 < 15 then p := p + 1; continue; end if;   -- dibiarkan → proyek
        if ch = 'k' then
          if p = 5 or exists (select 1 from nz.building_tiles t where (t.i, t.j) in ((v_i, v_j), (v_i + 1, v_j))) then ch := 'r'; else v_type := 'kos'; v_w := 2; v_cap := 14; end if;
        end if;
        if ch = 'r' then v_type := 'rumah'; v_w := 1; v_cap := 4; elsif ch = 'R' then v_type := 'rumah2'; v_w := 1; v_cap := 8; end if;
        if exists (select 1 from nz.building_tiles t where t.i = v_i and t.j = v_j) then p := p + 1; continue; end if;
        -- [REVISI] kavling ujung (p=0 / p=5) menyentuh kolektor → lot_class 2 → zona RUKO: rumah DITOLAK nz.place (cek zona),
        -- kos boleh (RUKO ada di zones kos). Jadi p=0 hanya kos 2x1 (menutup p=0..1), p=5 selalu dilewati → jatah proyek/ruko negara.
        if p in (0, 5) and v_type <> 'kos' then p := p + 1; continue; end if;
        insert into nz.buildings (type, i, j, w, h, district, npc_owner_id, stage, started_at, build_hours, finished_at)
        values (v_type, v_i, v_j, v_w, 1, d.key, v_ids[v_k], 'jadi', now() - make_interval(hours => (hashtext('s' || v_i || v_j) & 2147483647) % 160), 1, now())
        returning id into v_bid;
        perform nz.place(v_bid, v_i, v_j, v_w, 1, false);       -- mengisi facing, front_class, zone, floors
        update nz.npcs set home_building_id = v_bid where id = any (v_ids[v_k : least(v_total, v_k + v_cap - 1)]);
        v_k := v_k + v_cap; v_used := v_used + v_cap; v_houses := v_houses + 1; p := p + v_w;
      end loop;
    end loop;
  end loop;
  if v_k <= v_total then   -- sisa → 2 apartemen negara di CBD (seed_world menanamnya), bergantian
    update nz.npcs n set home_building_id = (select id from nz.buildings where type = 'apartemen' order by id offset (n.id % 2) limit 1)
    where n.id = any (v_ids[v_k : v_total]);
  end if;
  return v_houses;
end $$;
```
Kapasitas: satu sisi blok penuh (6 kavling) ≈ kos 14 + rumah 4+4 + rumah2 8+8 = 38 warga; 1.250 warga ≈ 33 sisi ≈
17 blok ≈ 200 kavling = 20 % dari 1.008. Semua 10.000 NPC ≈ 1.600-1.800 kavling di 8 distrik ring 1.
Rapi: dalam satu sisi blok semua rumah facing sama (b=0 → 2/N, b=1 → 0/S), setback 1,2 sama, genteng seragam per blok,
pohon 1 per 4 rumah di sisi punggung (z0), dua baris punggung-ke-punggung = deretan atap rapat khas kampung.
`settings.npc_tile_budget` dihapus, diganti `districts.fill_pct` per ring. Fungsi idempoten (hanya NPC tanpa rumah & kavling kosong).
[REVISI] Catatan uji: (a) `v_quota = ceil(v_total/8)` benar untuk 8 distrik ring 1, tetapi bila salah satu distrik ring 1 belum
`is_open` (mis. pemilik menolak pembukaan massal §1.6) kuota harus `ceil(v_total / count(ring=1 and is_open))`, kalau tidak
sisa NPC menumpuk di apartemen. (b) Baris `exit when v_k > v_total or v_used >= v_quota` di loop `side` sudah benar; loop `p`
tidak memeriksa kuota sehingga satu sisi bisa melebihi kuota maksimal 38 warga — dapat diterima. (c) Pola 'rRkkrR' dan 'rrRkkR'
membuang p=0 (huruf 'r' di ujung selalu dilewati); ganti menjadi 'kkrRrR' dan 'kkRrrR' agar p=0 terpakai sebagai kos.
Pemain baru: RPC `suggest_lot()` mengembalikan kavling kosong zona KAMPUNG/KOTA terdekat dengan rumah NPC.

---

## 6. Migrasi 68 bangunan live distrik pusat

Pemetaan pusat lama (i,j ∈ 11..29, blok 4×4) → distrik k12 baru. Blok lama 4 lebar masuk ke 4 dari 6 kolom blok baru;
blok lama 4 dalam menjadi dua blok 2 dalam yang dipisah gang. Terverifikasi: 256 kavling lama → 256 kavling baru unik,
semua di k12, rentang i 95..119, j 97..119; w=4 lama tetap satu blok; satu-satunya pecah: h=2 lama yang mulai di j%5==2.
```
new_i = 7*(i/5) + i%5 + 80                                   -- bilangan bulat: 11→95, 14→98, 16→102, 29→119
new_j = 6*(j/5) + 85 + 3*((j%5-1)/2) + (j%5-1)%2             -- 11→97, 12→98, 13→100, 14→101, 16→103, 29→119
```
Hasil fasilitas lama (semua satu blok, semua punya muka jalan): mulyo (18,18)→(104,106); tugu (21,21)→(109,109) hadap W ke
kolektor tengah i=108; rs (26,16)→(116,103); istana (21,16)→(109,103); stadion 4×2 (11,26)→(95,115); pasar (23,21)→(111,109);
apartemen (16,26)→(102,115); dst. (daftar lengkap dari skrip simulasi).
[REVISI] Diverifikasi ulang: 23 fasilitas seed → tidak ada tabrakan antar-seed, semua satu blok, semua `facing` non-null, semua k12.
Tidak ada seed dengan h=2 yang mulai di j%5==2, jadi kasus "pecah gang" hanya mungkin pada bangunan pemain. TETAPI zona hasil
migrasi tidak cocok katalog untuk beberapa bangunan protected: istana (109,103) dan tugu (109,109) → lot_class 2 (kolektor i=108)
→ RUKO, bukan CBD; apartemen (102,115) → RUKO; bank (118,109) dan pasar (111,109) → lot_class 1 (gang) → KOTA. Keputusan:
bangunan `protected` yang dimigrasi dikecualikan dari cek zona (`p_check_zone=false`) DAN dari kolom `zona_salah` di
`nz.audit_layout` (`where not protected`), kalau tidak verifikasi "audit harus null" selalu gagal. `floors_for` untuk mereka
tetap memakai zona hasil hitung (istana tidak punya cabang lantai, aman). Seed 'tani' bertapak 2×2 padahal katalog sawah 2×1:
`facing_of(…,2,2,2,1)` tetap sah (w=cw → S/N), tetapi cek 0 §2 harus dilewati untuknya (`p_check_zone=false` juga melewati cek 0),
atau ubah 'tani' menjadi 2×1 saat migrasi — pilih yang pertama agar label 'Zona Pangan & Ternak' tetap 4 kavling.

```sql
create function nz.migrate_layout_v3() returns jsonb language plpgsql as $$
declare r record; t record; v_i int; v_j int; v_w int; v_h int; v_moved int := 0;
begin
  if (select grid_version from nz.settings where id = 1) = 3 then raise exception 'Sudah grid v3.'; end if;   -- [REVISI] idempoten
  create table if not exists nz.migration_log (id bigint primary key, old_i int, old_j int, new_i int, new_j int, moved boolean, note text);
  -- 0. simpan salinan, lepas rumah NPC (di-seed ulang dengan pola kampung baru)
  create table if not exists nz.buildings_v2_backup (like nz.buildings including all);            -- [REVISI] bisa diulang setelah rollback
  insert into nz.buildings_v2_backup select * from nz.buildings on conflict do nothing;
  update nz.npcs set home_building_id = null where home_building_id in (select id from nz.buildings where npc_owner_id is not null);
  delete from nz.jobs where building_id in (select id from nz.buildings where npc_owner_id is not null);   -- [REVISI] kos NPC punya jobs:1 → FK
  delete from nz.buildings where npc_owner_id is not null;
  delete from nz.building_tiles;
  -- [REVISI] bangunan di luar 11..29 (seharusnya tidak ada; distrik lain belum pernah dibuka) → laporkan, jangan dipetakan diam-diam
  if exists (select 1 from nz.buildings where i not between 11 and 29 or j not between 11 and 29) then
    raise exception 'Ada bangunan di luar distrik pusat lama: %', (select string_agg(id::text, ',') from nz.buildings where i not between 11 and 29 or j not between 11 and 29);
  end if;
  -- 1. (DDL grid baru sudah dijalankan: road_i/road_j/is_lot/block_of/facing_of, kolom facing/front_class/zone/floors)
  -- 2. urutan: protected dulu, tapak besar dulu, lalu pemain urut created_at
  for r in select b.*, c.w cw, c.h ch from nz.buildings b join nz.catalog c using (type)
           order by b.protected desc, b.w * b.h desc, b.created_at loop
    v_i := 7 * (r.i / 5) + r.i % 5 + 80;
    v_j := 6 * (r.j / 5) + 85 + 3 * ((r.j % 5 - 1) / 2) + (r.j % 5 - 1) % 2;
    v_w := r.w; v_h := r.h;
    if r.h = 2 and r.j % 5 = 2 then v_j := v_j - 1; end if;                       -- pecah gang → naik 1 baris (b=0)
    if r.h = 4 then v_w := 4; v_h := 2; end if;                                     -- stadion diputar lama tidak mungkin lagi
    if v_w = 1 and v_h = 2 and nz.facing_of(v_i, v_j, 1, 2, r.cw, r.ch) is null then v_w := 2; v_h := 1; end if;   -- 1x2 di kolom tengah → kembali ke orientasi katalog
    if not nz.fits(v_i, v_j, v_w, v_h, r.cw, r.ch) then
      select * into t from nz.nearest_fit(v_i, v_j, r.cw, r.ch, 10);              -- spiral Chebyshev, tapak asli lalu diputar, syarat: is_lot, satu blok, kosong, facing not null, district_of = 'k12' [REVISI: radius 10 dari i=95 mencapai i=85 = distrik k11; wajib dibatasi k12]
      v_i := t.i; v_j := t.j; v_w := t.w; v_h := t.h;
    end if;
    update nz.buildings set i = v_i, j = v_j, w = v_w, h = v_h, district = nz.district_of(v_i, v_j), updated_at = now() where id = r.id;
    perform nz.place(r.id, v_i, v_j, v_w, v_h, false, null, false);                -- p_check_zone=false untuk warisan (mis. sawah 'Zona Pangan' di k12)
    insert into nz.migration_log values (r.id, r.i, r.j, v_i, v_j, (v_i, v_j) <> (7*(r.i/5)+r.i%5+80, 6*(r.j/5)+85+3*((r.j%5-1)/2)+(r.j%5-1)%2), null);
  end loop;
  -- 3. distrik: 5 key lama → 25 key baru; k12 + ring 1 terbuka
  -- [REVISI] district_proposals.district (dan kolom district di buildings/profiles bila ada) ber-FK ke districts.key → petakan dulu,
  -- kalau tidak `delete from nz.districts` gagal. Peta: pusat→k12, utara→k07, selatan→k17, barat→k11, timur→k13.
  insert into nz.districts (key, name, ring, fill_pct, cost, is_open, opened_at) select ... (25 baris dari rumus) on conflict (key) do nothing;
  update nz.district_proposals set district = case district when 'pusat' then 'k12' when 'utara' then 'k07' when 'selatan' then 'k17' when 'barat' then 'k11' else 'k13' end where district in ('pusat','utara','selatan','barat','timur');
  delete from nz.districts where key in ('pusat','utara','selatan','barat','timur');
  -- 4. kompensasi & berita untuk pemain yang bergeser
  insert into berita/tx: 'Rumahmu dipindah ke Kampung Pusat blok (bx,by) karena penataan kota' + 50 NC untuk setiap migration_log.moved and owner_id is not null;
  -- 5. rumah NPC pola baru, lalu seed proyek kota
  perform nz.seed_npc_homes(); perform nz.seed_projects();
  update nz.settings set grid_version = 3;
  return (select jsonb_agg(a) from nz.audit_layout a);   -- harus null
end $$;
```
`nz.fits(i,j,w,h,cw,ch)` = is_lot dua sudut ∧ block_of sama ∧ tidak ada tiles ∧ facing_of not null.
`nz.nearest_fit(i0,j0,cw,ch,maxr)` = loop r 0..maxr, `generate_series(-r,r)` × 2 dengan `greatest(abs(di),abs(dj)) = r`,
urut `abs(di)+abs(dj), dj, di` (deterministik), coba (cw,ch) lalu (ch,cw); gagal → `raise exception 'Tidak ada tempat untuk %'` (jangan dipaksa, laporkan id).
Perkiraan: < 10 dari ±45 bangunan non-NPC bergeser, semuanya ≤ 2 kavling. ID bangunan tidak berubah → profiles.home_building_id, jobs, proposals tetap sah.

Verifikasi wajib (satu transaksi, rollback bila ada yang gagal):
```sql
select count(*) from nz.buildings b where not exists (select 1 from nz.building_tiles t where t.building_id = b.id);   -- 0
select (select sum(w*h) from nz.buildings) = (select count(*) from nz.building_tiles);                                 -- true
select id from nz.buildings b join nz.catalog c using (type) where facing is null or nz.facing_of(i,j,w,h,c.w,c.h,facing) <> facing;   -- kosong  [REVISI] facing harus ANGGOTA kandidat, bukan sama dengan pilihan otomatis — pemain boleh memilih sisi lain lewat p_want
select id from nz.buildings b join nz.catalog c using (type) where not protected and (w,h) not in ((c.w,c.h),(c.h,c.w));   -- kosong [REVISI] cek 0
select id from nz.buildings b join nz.catalog c using (type) where not protected and not (c.zones @> array[nz.zone_of(nz.ring_of(i,j), nz.lot_class(i,j,w,h))]);   -- kosong [REVISI] zona dari lot_class; protected dikecualikan
select id from nz.buildings where nz.block_of(i,j) <> nz.block_of(i+w-1,j+h-1) or not nz.is_lot(i,j) or not nz.is_lot(i+w-1,j+h-1);   -- kosong
select count(*) from generate_series(0,216) i, generate_series(0,216) j where nz.is_lot(i,j) and nz.facing_of(i,j,1,1,1,1) is null;    -- 0
select count(*) from generate_series(0,216) i, generate_series(0,216) j where nz.is_lot(i,j);                                          -- 25200
select * from nz.audit_layout;   -- 0 baris (di_jalan | tanpa_muka | zona_salah | beda_blok); [REVISI] zona_salah hanya untuk `not protected`
select count(*) filter (where moved), count(*) from nz.migration_log;   -- [REVISI] laporkan; moved harus ≤ 10 dan hanya owner_id not null yang dapat kompensasi
```
Tabel `values` di `nz.seed_world` (p3.sql:686-708) dan `LEGACY` di c3_data.js:205-209 diganti ke koordinat baru dari
`migration_log` agar instalasi baru langsung konsisten. `settings.grid_version = 3`; halaman menolak render bila `snap.grid_version !== 3`.

---

## 7. Daftar perubahan file

### p3.sql (fungsi nz)
- Baris 35-48: ganti `is_lot`, `district_of` dengan `road_i`, `road_j`, `is_lot`, `block_of`, `district_of` (text 'kNN'), `ring_of`, `facing_of`, `front_class`, `zone_of`, `floors_for`, `land_mult`, `fits`, `nearest_fit` (§1.3, §3.1, §6).
- `alter table nz.buildings add column facing smallint check (facing between 0 and 3), front_class smallint, zone text, floors smallint` (kolom biasa, BUKAN generated: p3.sql men-drop fungsi nz dengan cascade).
- `alter table nz.catalog add column zones text[]`; tambah baris katalog `ruko`, `terminal`, `pangkalan`, `kebun`, `proyek_gedung`, `proyek_rumah`, `lahan_material` (p2.sql insert).
- `alter table nz.districts add column ring int, fill_pct int`; 25 baris; `settings` tambah `grid_version int`, hapus `npc_tile_budget`.
- Baris 275-300 `nz.place(p_bid, p_i, p_j, p_w, p_h, p_check_open default true, p_want int default null, p_check_zone boolean default true)`: [REVISI urutan] `if p_check_zone and (p_w,p_h) not in ((c.w,c.h),(c.h,c.w)) then raise 'Ukuran tapak tidak sesuai katalog.'` → cek is_lot dua sudut → block_of sama → `v_facing := nz.facing_of(..., c.w, c.h, p_want)` (null → 'Muka bangunan harus ke jalan.') → `v_lot := nz.lot_class(p_i,p_j,p_w,p_h)`, `v_zone := nz.zone_of(nz.ring_of(p_i,p_j), v_lot)`, `if p_check_zone and not (c.zones @> array[v_zone]) then raise 'Jenis ini tidak boleh di zona %'` → distrik terbuka → insert tiles (PK tetap wasit) → `update nz.buildings set facing = v_facing, front_class = nz.front_class(...), zone = v_zone, floors = nz.floors_for(type, ring, v_lot) where id = p_bid`.
- Baris 630-676 `seed_npc_homes()` → §5. Baris 686-708 `seed_world` → koordinat baru + seed CBD (ruko negara, 2 apartemen, 3 kantor, terminal) + `seed_projects()` + `seed_district(key)` untuk ring 2.
- `building_json` (baris ~730): tambah `'facing', b.facing, 'floors', b.floors, 'zone', b.zone, 'front_class', b.front_class`.
- Tambah `view nz.audit_layout` (di_jalan, tanpa_muka, zona_salah [hanya `not protected`], beda_blok, beda_tapak [hanya `not protected`]) dan panggil di `tick_hourly` → news bila > 0.
- [REVISI] `tick_hourly`: hitung `v_sisa` kavling kosong zona KAMPUNG/KOTA/DESA di distrik terbuka → usulan distrik otomatis (< 400) / darurat perumahan (< 150) sesuai §1.6.
- Tambah `nz.migrate_layout_v3()` (§6), `nz.open_district` tidak berubah kecuali key baru + berita "mulai diaspal".

### p4.sql (RPC publik)
- `build_private` (294-330): parameter baru `p_want int default null`; `v_w/v_h` dari `p_rotated` tetap (hanya bentuk tapak); harga `c.cost + 20*c.w*c.h*nz.land_mult(zone)` — zona dihitung dulu lewat `nz.zone_of(nz.ring_of(i,j), nz.lot_class(i,j,v_w,v_h))` [REVISI: bukan dari facing] sebelum cek koin; rumah gratis hanya zona KAMPUNG/KOTA/DESA; batas 6 bangunan pribadi dan 2 usulan aktif TIDAK berubah; `perform nz.place(v_id, p_i, p_j, v_w, v_h, true, p_want)`.
- `propose_public` (332-360): sama (`p_want`), tanpa harga tanah.
- `get_buildings`/`get_city_snapshot`: kirim `grid_version`, `districts` 25 baris dengan `ring`.
- Tambah RPC `suggest_lot()`; `claim_building` untuk ruko negara/sawah negara; `pres_open_district` memakai key baru.
- `tick_hourly`: proyek negara selesai → menjadi ruko/rumah negara (kota tumbuh).

### c1_core.js
- Baris 43-50 → §1.2 (konstanta, roadI/roadJ/isLot/isRoad/blockOf/sameBlock/districtOf/ringOf/fronts/facingOf/frontClass/FACE_DIR/zoneOf/DISTRICTS/DIST_RECT/DIST_NAME dari snapshot).
- Katalog `CAT`: tambah `zones`, `sb` (setback per zona), tipe baru (ruko, terminal, pangkalan, kebun, proyek_*); semua `m(fx,fz,c,wl)` → `m(F,c,wl,floors)` (§4.2); `ruko` = inti visual deretan jalan utama.
- `GENTENG` per blok, alas paving/rumput per zona.

### c3_data.js
- Baris 63 `rebuildOcc`, 65-70 `paintLots`: `N=217`; warna kavling per zona saat mode bangun (hijau = boleh untuk tipe yang dipilih via `zoneOf`+`CAT[type].zones`, merah = zona salah, abu = tidak punya muka untuk tapak itu).
- Baris 72-77 `visibleDistricts`: `DIST_RECT` rumus; muat hanya distrik dalam radius.
- Baris 205-217 demo offline: `LEGACY` koordinat baru, NPC demo diisi dengan pola strip §5 (versi JS kecil), `S.snap.districts` 25 baris.
- `setOpen`: default `OPEN_AT_START`.

### c2_engine.js
- Baris 138 ground plane 1300 → 2.200; 150-157 jalan: iterasi atas garis (`for i: roadI(i)>0`, `for j: roadJ(j)>0`), arteri 2 petak digambar satu strip 12 unit dengan median; lebar aspal per kelas (§4.1); jalan tanah untuk kolektor/gang distrik tertutup; trotoar per blok `box(6T+2*sisi, .28, 2T+2*sisi)` di pusat blok `wx(bx-blok) ...`, digabung satu geometri per distrik (25 mesh); marka/zebra hanya kelas ≥ 2.
- Baris 160-172 lotList/lotMesh: 25.200 instance (aman); 188 `paintTrees`: distrik tertutup → sawah/kebun/pohon instanced per chunk, LOD radius 2 distrik, bukan 0,8 pohon per kavling.
- Baris 229 `lampSpots`: arteri tiap 2 petak dua sisi + median, kolektor tiap 3 petak satu sisi; tiang listrik + kabel (LineSegments per chunk) di gang/kolektor (§3.2).
- Baris 269 `if (b.w !== ct.w) inner.rotation.y = Math.PI/2` → `const f = b.facing ?? facingOf(b.i,b.j,b.w,b.h,ct.w,ct.h); inner.rotation.y = f * Math.PI/2;` dan `modelGeo(type, color, wall, lw, lh, floors, zone)`.
- Baris 335 `nodeOK`/`initMovers`/`stepMovers`: graf simpul = (kolom roadI>0) × (baris roadJ>0), arteri 2 petak = satu simpul di `wx(i)+T/2`; mobil/angkot hanya segmen kelas ≥ 2 (arteri E-W, kolektor/arteri N-S), ojek/motor/pejalan boleh gang; angkot rute loop tepi distrik, berhenti 4 s di simpang kolektor×arteri; angkot ngetem statis, motor parkir, warung tenda, gerobak sebagai InstancedMesh per chunk.
- Baris 371/463/504: `cam` awal `wx(108), wx(108)`; spawn jalan kaki pakai `FACE_DIR`; `walkBlocked` N baru.
- Crane maks 12/distrik; `applyProgress` tiga fase visual; papan proyek canvas-texture cache per id.

### c4_ui.js
- Baris 440-444 `fitsLocal(i,j,w,h,type,want)`: 5 cek §2 (pesan sama persis dengan server).
- Baris 445-453 `setPlaceAnchor`: pratinjau `inner.rotation.y = facingOf(...)*Math.PI/2`, `modelGeo` dengan (lw,lh), panah pintu, warna ghost merah bila zona salah.
- Baris 505 `rotate`: non-persegi → tukar (w,h) lalu hitung ulang facing; persegi → siklus `want` di antara sisi sah; tombol Putar muncul bila `kandidat.length > 1`.
- Baris 466 `confirmPlace`: kirim `p_want`.
- Baris 190-210 sheet bangun/info: tampilkan zona, lantai, harga tanah × land_mult; 242/358 daftar distrik 25 baris dengan ring; 502 `goto-d` dari `DIST_RECT` rumus; `center` → `wx(108)`.
- Sambutan pemain baru: kamera rendah di atas protokol menghadap tugu; "rumah gratis" mengarahkan ke `suggest_lot()`.

### Uji sebelum deploy
- SQL: 9 query §6 + uji posisi per tapak dengan (cw,ch) KATALOG, bukan (w,h) [REVISI: `facing_of(i,j,1,2,1,2)` selalu non-null sehingga uji lama tidak menguji apa-apa]:
  `select w,h,count(*) from generate_series(0,216) i, generate_series(0,216) j, (values (1,1,1,1),(2,1,2,1),(1,2,2,1),(2,2,2,2),(4,2,4,2),(2,4,4,2)) s(w,h,cw,ch)
   where nz.is_lot(i,j) and nz.is_lot(i+w-1,j+h-1) and nz.block_of(i,j) = nz.block_of(i+w-1,j+h-1) and nz.facing_of(i,j,w,h,cw,ch) is not null group by 1,2`
  harus persis: 1×1 25200 · 2×1 21000 · 1×2 4200 · 2×2 10500 · 4×2 6300 · 2×4 0.
- SQL: `select count(*) from generate_series(0,216) i, generate_series(0,216) j where nz.is_lot(i,j) and nz.zone_of(nz.ring_of(i,j), nz.lot_class(i,j,1,1)) in ('KAMPUNG','KOTA','DESA')` = 19760 (§1.6).
- `(alat kerja internal) gen/test_facing.js`: dump 2.000 sampel `(i,j,w,h,cw,ch,facing_of)` dari SQL → bandingkan dengan `facingOf` JS; satu beda pun = deploy batal.
- Property test 2.000 `build_private` acak: tidak ada ubin di jalan, `front_class(sel depan) > 0`, zona sesuai katalog.
