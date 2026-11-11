/* =====================================================================
   c1b_fasad.js · TATA BAHASA FASAD (spek-gaya §5) · Republik Netizenia v2
   Dibaca agen pemodel: berkas ini + contoh web/models/rumah.js (hunian) dan web/models/toko.js (ruko 3 unit, 1–4 lantai).
   ---------------------------------------------------------------------
   0. MODEL. Satu berkas web/models/<tipe>.js yang HANYA berisi
        CAT.<tipe>.m = (fx, fz, c, wl, F, floors, zone, gt, ctx) => { ctx = ctx || {}; ... };
      fx, fz = tapak (LW − ,8 / LD − ,8); kavling LW = fx + ,8, LD = fz + ,8 (8 per petak). c = aksen pemilik (AKSEN: tenda, papan nama,
      daun jendela), wl = dinding (WALLS), gt = genteng (GENTENG), F = kerangka setback (c1_core frame()), floors = jumlah lantai dari
      floorsFor() (= server; JANGAN diganti seed), zone = 'CBD'|'RUKO'|'RUKO_KECIL'|'KOTA'|'KAMPUNG'|'DESA',
      ctx = { adj:{l,r}, lw, lh, floors, zone, seed }. seed 0..3 = hashStr(String(b.id)) & 3 → varian deterministik (bentuk atap,
      jumlah/letak jendela, posisi pintu, balkon/carport…). adj.l / adj.r = tetangga deret (ROW_TYPES c2c) di −x / +x: sisi itu
      rapat PERSIS ke batas kavling (x = ∓LW/2), tanpa overhang, lis/plint/pita tidak melewati batas (opsi adj di fungsi).
      Model hanya mendorong primitif ke P (badan) / G (kaca & lampu, menyala malam); modelGeo menambah alas kavling (y 0..,06).
   1. RUANG & SKALA. 1 unit = 1 m. Titik asal = pusat kavling di muka tanah (y 0). +z = MUKA JALAN, +x = kanan (dilihat dari jalan).
      BATAS KERAS: |x| ≤ LW/2, |z| ≤ LD/2, y ≥ 0 untuk SEMUA bagian (tenda, kanopi, emperan, teras, tangga, pagar, pohon, atap).
      Uji: test/model_view.js → keluarKavling harus []. Skala (c1_core): LANTAI 3,2 · LANTAI_USAHA 4,2 · MANUSIA 1,7 · PINTU 1,0×2,1 ·
      jendela hunian 1,1×1,5 ambang y ≈ 1,0 · lantai k: y = LANTAI·k + ,9 (usaha: LANTAI_USAHA + LANTAI·(k−1) + ,9).
   2. JANGKAR & ROT. Fungsi elemen dinding (jendela*, pintu, etalase, rollingDoor, tenda, papanNama, balkon, ac, lampuDinding, talang,
      spanduk, meteranListrik, teks) menerima (x, y, z) = titik TENGAH-BAWAH elemen PADA BIDANG MUKA DINDING. o.rot = arah hadap
      muka dinding (radian): 0 → +z (depan) · Math.PI/2 → +x (kanan) · −Math.PI/2 → −x (kiri) · Math.PI → −z (belakang).
      Elemen menonjol ke arah hadap; bagian belakangnya menembus dinding ≥ ,03 (aturan tembus §5.2) → tidak ada dua muka sebidang.
      Rotasi primitif: Euler 'YXZ' (ry lalu rx lokal) → tenda/kanopi/emperan di dinding samping & bangunan diputar tetap turun ke luar.
      Fungsi lantai/halaman (teras, emperan, pagarHalaman, pohonKecil, pot, …) memakai (x, z) di tanah (y 0) + o.rot.
   3. WARNA. Hex sRGB '#RRGGBB' (huruf besar). darken(c, k) (k < 1 gelap), campur(a, b, t). Konstanta: KUSEN, KAYU, BINGKAI, BESI, SENG,
      PVC, KACA (2 nada), LAMPU, PAL.* (c1_core). Slot (p.slot, dipakai tahap 5 saat warna diisi per chunk): 0 tetap · 1 aksen pemilik ·
      2 dinding (WALLS) · 3 genteng. dinding() memberi wall:true (desaturasi 20 %) dan slot o.slot (default 2 — beri slot:0 bila warnanya
      BUKAN wl, mis. unit ruko berwarna lain). atap*() slot 3; tenda/papanNama/daun jendela: berikan o.slot = 1 bila warnanya = c.
   4. FLAG. Setiap fungsi mengembalikan primitif utamanya (objek P/G) atau { q, ... }; boleh diubah setelahnya:
      q.lod = 1 (dibuang di LOD jauh) · q.noEdge (tanpa garis lipatan) · q.noHull (tanpa kulit siluet) · q.attach 'z+'|'z-'|'x+'|'x-'|'y+'|'y-'
      (buang 4 sisi yang menempel host) · q.ao (0..1) · q.wall. Opsi umum: o.lod = 1 (semua bagian elemen jadi detail dekat), o.rot.
      merge() otomatis: min(s) < ,12 && (mid < ,25 || maks < ,6) → lod 1 + noEdge (batang tipis: kusen, palang, rel, kaki, jeruji);
      min(s) < ,25 → noHull. Papan tipis yang lebar (≥ ,25 di dua sumbu) tetap bergaris → beri noEdge bila hanya hiasan.
   5. PRIMITIF. Mentah (c1_core, y = alas): box pyr roof(prism) cyl cone sph gbox gsph; BARU di sini: sphLo(r,x,y,z,c[,ry]) (pusat, 56 tri)
      dan cylLo(r,h,x,y,z,c) (alas, 8 segmen, 32 tri). Rangka lokal: rangka(x,y,z,rot) → f; taruh(f, g, sx,sy,sz, dx,dy,dz, c, o)
      (dy = TITIK TENGAH, o = flag + {rx, ry tambahan, glow:true → G, geo/edges untuk g:'custom'}).
      Geometri khusus (p.g = 'custom', ruang satuan [-,5,,5]³ diskalakan p.s, di-cache): hipGeo (atap limas 6 titik, 8 segitiga, 9 sisi),
      textGeo (huruf piksel 3×5, A–Z 0–9 - . + / '), jerujiGeo (jeruji 2 muka), gerigiGeo (gerigi tenda), sawGeo (gigi atap gergaji),
      bingkaiGeo (kusen/bingkai cincin 18–24 segitiga; dipakai jendela, pintu, etalase).
   6. ANGGARAN (segitiga dekat; 'jauh' = tanpa lod 1; terukur di rumah/toko). box 12 · cylLo 32 · sphLo 56 · cyl 48 · sph 168 (hindari) ·
      jendela 54 (polos) / 66 (+topi) / 70 (+teralis) / 78 (+daun) · jendelaKecil 48 (nako +24) · pintu ≈ 100 (berpanel + boven) ·
      etalase ≈ 90 · rollingDoor ≈ 110 (tutup) / ≈ 250 (buka + isi toko) · tenda ≈ 140 (6 strip + gerigi) · papanNama 24 + teks ≈ 8–10/huruf ·
      atapLimasan 32 · atapJoglo 64 · atapPelana 32 (pejal) / ≈ 90 (dinding, lisplang + roster) · atapDatar 48–60 · ac 24 · tandon ≈ 100 ·
      pagarHalaman ≈ 200 (tembok/besi 8 m + gerbang) · pot 68–88 · pohonKecil 88–150 · emperan 48–72 · teras 60 · balkon 84 (tembok) / ≈ 150 (besi).
      Batas per tipe = spek-gaya §6 (rumah 1.050, toko 1.800 + 450/lantai, toleransi +10 %); garis lipatan: box 12 sisi (8 dengan attach), lod 1/noEdge 0.
   7. JEBAKAN yang ditemukan saat membuat rumah/toko (cek sebelum menyerahkan model):
      · Dua reveal/bingkai bersebelahan di dinding yang sama TIDAK boleh bertumpuk (z-fight): sisakan celah ≥ ,1 (reveal = lebar + ,3 untuk
        pintu/etalase/rollingDoor, + ,22 untuk jendela, + ,16 jendelaKecil). Contoh hitung di toko.js unit B/C.
      · Benda dekat tepi kavling (pot, pohon, pilar gerbang, tangga) → clamp ke ±(LW/2 − jari-jari); pada deret (adj) tepi = batas kavling.
      · atapPelana gaya 'dinding': teritis turun ov·tan(sudut) di bawah puncak dinding dan bidang bawah papan naik ke dalam → kolom teras
        dibuat ,2 lebih tinggi agar menembus papan (lihat rumah.js kolomH). Atap limasan/joglo: teritis = puncak dinding.
      · Teritis (overhang) atap harus muat: halaman belakang ≥ overhang + ,05, sisi bebas ≥ overhang.
      · Dekal (teks, stiker, roster) ≥ ,01 di depan bidang induk; teks piksel = lod 1, tanpa garis/kulit.
   8. ALAT. node test/mv_fasad/hitung.js <tipe> [seed] [zona] [lantai] [adj] → segitiga/garis per fungsi (tanpa browser, cepat);
      NZ_HTML=<page> node test/mv_fasad/varian.js <tipe,..> → SEMUA varian (zona × lantai × seed × adj × facing): keluarKavling, tri, garis;
      node test/mv_fasad/asap.js → uji asap semua fungsi fasad; render: test/model_view.js (lihat kepala berkas itu).
   ---------------------------------------------------------------------
   DAFTAR FUNGSI (semua global; satuan m; sudut 'miring'/'sudut' dalam DERAJAT, 'rot' dalam RADIAN)
   dinding(w,h,d,x,y,z,c,{plinth:.6,cPlinth,lis:[y..],cLis,pilaster,adj,slot,rot})           kotak dinding (pusat x,z; alas y)
   pitaBawahAtap(w,d,x,yAtap,z,cWall,ov,{adj,rot})                                            pita gelap di bawah teritis
   jendela(x,y,z,{w:1.1,h:1.5,wall,kusen,daun:warna|false,daunSlot,palang(bawaan w≥1,2),palangH,ambang,topi,cTopi,teralis,rot})
   jendelaKecil(x,y,z,{w:.7,h:.7,wall,kusen,gelap,nako,palang(bawaan w≥,8),ambang,teralis,rot})
   jendelaBaris(n,w,y,z,{x0,kecil,...opsi jendela}) → [x..]        jendelaJeruji(x,y,z,{w:.6,h:.9,...})
   pintu(x,z,{w:1,h:2.1,y:0,c:KAYU,daun:1|2,kaca,panel,boven:true|'roster',kanopi,wall,kusen,rot})
   etalase(x,z,{w:3,h:2.5,y:.5,bingkai,ambang,bagi:1.2,palangH,wall,teks,rot})
   rollingDoor(x,z,{w:3,h:3,y:0,c,garis,buka:0..1,isi:true,meja:true,wall,rot})
   tenda(x,y,z,{w:3.2,dalam:.9,miring:22,c,c2,strip:n|0,gerigi,penyangga,tiang,slot,rot}) → {q,yDepan,zDepan}
   papanNama(x,y,z,{w:3,h:.7,c,teks,cTeks,bingkai,slot,rot})       teks(str,x,y,z,{tinggi:.4,lebarMaks,c,rot,lod})
   emperan(x,z,{w:3,d:1.4,y:3,miring:10,c:SENG,atap:true,kolom:2,kolomX:[x..],cKolom,lantai,cLantai,tinggiLantai:.15,talang,rot}) → {q,yDepan}
   teras(w,d,x,z,{tinggi:.3,tangga:2,tanggaW,tanggaX,c,kolom:[x..],kolomH,cKolom,rot}) → {q,zDepan}
   balkon(x,y,z,{w:2.4,jorok:.8,gaya:'besi'|'pita'|'tembok',c,cLantai,cTembok,konsol,rot})
   koridor(x,y,z,{w,jorok:1.2,kolomJarak:3.2,gaya,c,cLantai,cKolom,rot})
   atapPelana(w,d,x,y,z,{sudut:42,overhang:.55,ovL,ovR,ovD,arah:'x'|'z',gaya:'pejal'|'dinding',c,cWall,pita,roster,lisplang,rot}) → {q,yPuncak,yTepi}
   atapLimasan(w,d,x,y,z,{sudut:30,overhang:.8,c,cWall,pita,bubungan,rot}) → {q,yPuncak,h}      hipGeo(w,d,h) → {geo,edges}
   atapJoglo(w,d,x,y,z,{sudutBawah:22,sudutAtas:42,overhang:1,c,cWall,rot}) → {yPuncak}
   atapTumpang(w,d,x,y,z,{tingkat:3,sudut:[25,35,50],overhang:.6,c,cDrum,jarak:.9,mustaka,rot}) → {yPuncak}
   atapDatar(w,d,x,y,z,{c:'#C9C1B2',parapet:.5,tebal:.2,cParapet,lis,sisi:'fblr',adj,rot}) → {q,yAtas}
   atapGergaji(w,d,x,y,z,{n:4,tinggi:1.4,c,kaca,rot})
   talang(x,y0,h,{z,rot,c:PVC,siku})  ac(x,y,z,{rot,rak}|rot)  tandon(x,y,z,{c,r:.5,h:1.1,kaki:.8})  antena(x,y,z,{h})  parabola(x,y,z,{rot})
   pagarHalaman(w,z,{x0,gaya:'tembok'|'besi'|'kayu'|'bambu',h:.9,gerbang:true,gW:1.2,gx,pilar:2.5,jarakBesi:.2,duaMuka:false,c,cBesi,cPilar,cGerbang,gerbangBesi,adj,rot})  pagarKawat(w,d,x,z,{h:1.8,sisi})
   tiangBendera(x,z,h,{rot})  pot(x,z,s,{y,c,daun,bunga,kotak})  pohonKecil(x,z,s,{jenis:'bulat'|'pisang'|'pepaya'})  bangku(x,z,{w,y,rot})
   lampuDinding(x,y,z,{rot})  spanduk(x,y,z,{w,h,c,teks,tiang,rot})  jemuran(x,z,{w:2,h:1.7,n:4,y,warna,rot})  meteranListrik(x,y,z,{rot})
   kardus(x,y,z,{n,rot})  galon(x,z,{y})  motor(x,z,{c,rot})  gerobak(x,z,{c,rot,teks})  carport(x,z,w,d,{h,c,rot})
   darken(c,k)  campur(a,b,t)  sphLo  cylLo  rangka  taruh
   ===================================================================== */
const D2R = Math.PI / 180;
const KAYU = '#5A4636', BINGKAI = '#2B2F33', BESI = '#2B2B2B', SENG = '#8E979C', PVC = '#8C9196';
// ---------- warna ----------
const _hexArr = c => { let s = String(c || '#FFFFFF'); if (s[0] !== '#') s = '#' + new THREE.Color(s).getHexString(); if (s.length === 4) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
  const n = parseInt(s.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const _arrHex = (r, g, b) => '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase();
function darken(c, k){ const a = _hexArr(c); return _arrHex(a[0] * k, a[1] * k, a[2] * k); }
function campur(a, b, t){ const A = _hexArr(a), B = _hexArr(b); return _arrHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
// ---------- primitif murah (BASE.sphLo / BASE.cylLo di c2a) ----------
const sphLo = (r, x, y, z, c, ry) => { const q = { g: 'sphLo', s: [r * 2, (ry || r) * 2, r * 2], p: [x, y, z], c }; P.push(q); return q; };   // pusat (seperti sph)
const cylLo = (r, h, x, y, z, c) => { const q = { g: 'cylLo', s: [r * 2, h, r * 2], p: [x, y + h / 2, z], c }; P.push(q); return q; };       // alas di y
// ---------- rangka lokal: jangkar (x,y,z) + rotasi Y. at(dx,dy,dz) → posisi model. +z lokal = arah hadap muka. ----------
function rangka(x, y, z, rot){ const r = rot || 0, cs = Math.cos(r), sn = Math.sin(r);
  const at = (dx, dy, dz) => [x + dx * cs + dz * sn, y + dy, z - dx * sn + dz * cs];
  return { r, x, y, z, at, sub: (dx, dy, dz, dr) => { const p = at(dx, dy, dz); return rangka(p[0], p[1], p[2], r + (dr || 0)); } }; }
// dorong primitif: posisi lokal = TITIK TENGAH. o: flag primitif (lod, noEdge, noHull, attach, ao, slot, wall, rx, ry tambahan, geo, edges, c2) + glow:true → G
function taruh(f, g, sx, sy, sz, dx, dy, dz, c, o){
  const q = { g, s: [sx, sy, sz], p: f.at(dx, dy, dz), c, ry: f.r };
  if (o) for (const k in o){ const v = o[k]; if (v === undefined || v === null || k === 'glow') continue; if (k === 'ry') q.ry = f.r + v; else q[k] = v; }
  if (o && o.glow){ if (g === 'box' && !q.c2) q.c2 = !c || c === KACA[0] ? KACA[1] : c; G.push(q); } else P.push(q);
  return q; }
const _kaca = (f, w, h, dx, dyb, dz, c, o) => taruh(f, 'box', w, h, .06, dx, dyb + h / 2, dz, c || KACA[0], Object.assign({ glow: true }, o));
// lebar & geser x untuk tonjolan e di kiri/kanan, kecuali sisi deret (adj): tidak melewati batas kavling
const _ext = (w, e, A) => { const l = A && A.l ? 0 : e, r = A && A.r ? 0 : e; return [w + l + r, (r - l) / 2]; };

/* ---------- geometri khusus (ruang satuan, di-cache) ---------- */
const _GEO = new Map();
function _geoFrom(tris, edges){ const t = [];   // segitiga berluas nol (atap limas persegi: bubungan 0) dibuang
  for (let k = 0; k < tris.length; k += 9){ const ax = tris[k+3] - tris[k], ay = tris[k+4] - tris[k+1], az = tris[k+5] - tris[k+2], bx = tris[k+6] - tris[k], by = tris[k+7] - tris[k+1], bz = tris[k+8] - tris[k+2];
    if (Math.hypot(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx) > 1e-9) for (let i = 0; i < 9; i++) t.push(tris[k + i]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(t, 3)); g.computeVertexNormals();
  return { geo: g, edges: edges ? new Float32Array(edges) : null }; }
/* atap limas (spek §5): 4 sudut alas + 2 ujung bubungan di sumbu terpanjang, panjang bubungan = max − min → semua bidang bersudut sama.
   6 segitiga atap + 2 alas (tertutup: kulit siluet & muka bawah teritis). Sisi: 4 alas + 4 jurai + bubungan. Satuan: s = [W, h, D]. */
function hipGeo(w, d, h){
  const ax = w >= d, r = Math.max(0, ax ? (w - d) / (2 * w) : (d - w) / (2 * d)), key = 'hip|' + (ax ? 'x' : 'z') + r.toFixed(3);
  let G0 = _GEO.get(key); if (G0) return G0;
  const FL = [-.5, -.5, .5], FR = [.5, -.5, .5], BL = [-.5, -.5, -.5], BR = [.5, -.5, -.5];
  let t, e;
  if (ax){ const RL = [-r, .5, 0], RR = [r, .5, 0];
    t = [FL, FR, RR, FL, RR, RL, BR, BL, RL, BR, RL, RR, BL, FL, RL, FR, BR, RR];
    e = [FL, FR, FR, BR, BR, BL, BL, FL, FL, RL, BL, RL, FR, RR, BR, RR]; if (r > 1e-4) e.push(RL, RR); }
  else { const RF = [0, .5, r], RB = [0, .5, -r];
    t = [FL, FR, RF, BR, BL, RB, BL, FL, RF, BL, RF, RB, FR, BR, RB, FR, RB, RF];
    e = [FL, FR, FR, BR, BR, BL, BL, FL, FL, RF, FR, RF, BL, RB, BR, RB]; if (r > 1e-4) e.push(RF, RB); }
  t.push(FL, BL, BR, FL, BR, FR);   // alas
  G0 = _geoFrom(t.flat(), e.flat()); _GEO.set(key, G0); return G0; }
// gigi atap gergaji: profil (z,y) A(.5,−.5) B(−.5,−.5) C(−.5,.5) diekstrusi sepanjang x; muka tegak di z = −.5 (kaca), lereng menghadap +z
function sawGeo(){ let G0 = _GEO.get('saw'); if (G0) return G0;
  const A0 = [-.5, -.5, .5], B0 = [-.5, -.5, -.5], C0 = [-.5, .5, -.5], A1 = [.5, -.5, .5], B1 = [.5, -.5, -.5], C1 = [.5, .5, -.5];
  const t = [A0, C0, B0, A1, B1, C1, A0, B0, B1, A0, B1, A1, B0, C0, C1, B0, C1, B1, A0, A1, C1, A0, C1, C0];
  G0 = _geoFrom(t.flat(), [A0, B0, B0, C0, C0, A0, A1, B1, B1, C1, C1, A1, A0, A1, B0, B1, C0, C1].flat()); _GEO.set('saw', G0); return G0; }
// jeruji: n batang tegak (+ rel atas/bawah) sebagai bidang 2 muka (depan & belakang) di z = 0. bw/rh = lebar batang / tinggi rel (satuan).
// satu = hanya muka depan (+z): separuh segitiga, tak terlihat dari belakang (pagar halaman yang hampir selalu dilihat dari jalan)
function jerujiGeo(n, bw, rh, rel, satu){ n = Math.max(2, n | 0); const key = 'jr|' + n + '|' + bw.toFixed(3) + '|' + rh.toFixed(3) + '|' + (rel ? 1 : 0) + (satu ? 's' : '');
  let G0 = _GEO.get(key); if (G0) return G0; const t = [];
  const quad = (x0, y0, x1, y1) => { t.push(x0, y0, 0, x1, y0, 0, x1, y1, 0, x0, y0, 0, x1, y1, 0, x0, y1, 0); if (!satu) t.push(x0, y0, 0, x1, y1, 0, x1, y0, 0, x0, y0, 0, x0, y1, 0, x1, y1, 0); };
  for (let k = 0; k < n; k++){ const xc = -.5 + bw / 2 + k * (1 - bw) / (n - 1); quad(xc - bw / 2, -.5, xc + bw / 2, .5); }
  if (rel){ quad(-.5, .5 - rh, .5, .5); quad(-.5, -.5, .5, -.5 + rh); }
  G0 = _geoFrom(t, null); _GEO.set(key, G0); return G0; }
/* bingkai/kusen cincin (ganti 3–4 batang kusen: 18–24 segitiga, bukan 36–48): muka depan + sisi dalam + sisi luar, tanpa muka belakang.
   ax, ay = tebal bingkai (satuan) sumbu x / y; bawah = sisi bawah ada (jendela tanpa ambang, etalase) atau terbuka (pintu, jendela berambang). */
function bingkaiGeo(ax, ay, bawah){ const key = 'bk|' + ax.toFixed(3) + '|' + ay.toFixed(3) + '|' + (bawah ? 1 : 0); let G0 = _GEO.get(key); if (G0) return G0;
  const t = [], xi = .5 - ax, yi = .5 - ay, yb = bawah ? -yi : -.5, F = .5, B = -.5;
  const quad = (a, b, c, d, n) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const cr = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]; if (cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] < 0){ const tmp = b; b = d; d = tmp; } t.push(...a, ...b, ...c, ...a, ...c, ...d); };
  const front = (x0, y0, x1, y1) => quad([x0, y0, F], [x1, y0, F], [x1, y1, F], [x0, y1, F], [0, 0, 1]);
  front(-.5, yi, .5, .5); front(-.5, yb, -xi, yi); front(xi, yb, .5, yi); if (bawah) front(-.5, -.5, .5, -yi);
  quad([-xi, yi, B], [xi, yi, B], [xi, yi, F], [-xi, yi, F], [0, -1, 0]); quad([-xi, yb, B], [-xi, yi, B], [-xi, yi, F], [-xi, yb, F], [1, 0, 0]); quad([xi, yb, B], [xi, yi, B], [xi, yi, F], [xi, yb, F], [-1, 0, 0]);
  if (bawah) quad([-xi, -yi, B], [xi, -yi, B], [xi, -yi, F], [-xi, -yi, F], [0, 1, 0]);
  quad([-.5, .5, B], [.5, .5, B], [.5, .5, F], [-.5, .5, F], [0, 1, 0]); quad([-.5, -.5, B], [-.5, .5, B], [-.5, .5, F], [-.5, -.5, F], [-1, 0, 0]); quad([.5, -.5, B], [.5, .5, B], [.5, .5, F], [.5, -.5, F], [1, 0, 0]);
  if (bawah) quad([-.5, -.5, B], [.5, -.5, B], [.5, -.5, F], [-.5, -.5, F], [0, -1, 0]);
  G0 = _geoFrom(t, null); _GEO.set(key, G0); return G0; }
// kusen/bingkai cincin di rangka f: luar W×H, tebal tb, alas dyb, pusat kedalaman dz, tebal z dd (detail dekat: lod 1, tanpa garis/kulit)
function _bingkai(f, W, H, tb, dx, dyb, dz, dd, c, bawah, o){ const B0 = bingkaiGeo(tb / W, tb / H, bawah);
  return taruh(f, 'custom', W, H, dd, dx, dyb + H / 2, dz, c, { geo: B0.geo, edges: null, noHull: true, noEdge: true, lod: o && o.lod === 0 ? 0 : 1, slot: 0 }); }
// gerigi tenda: n segitiga menggantung (2 muka), garis zigzag di muka depan
function gerigiGeo(n){ n = Math.max(2, n | 0); const key = 'gr|' + n; let G0 = _GEO.get(key); if (G0) return G0; const t = [], e = [];
  for (let k = 0; k < n; k++){ const x0 = -.5 + k / n, x1 = -.5 + (k + 1) / n, m = (x0 + x1) / 2;
    t.push(x0, .5, 0, m, -.5, 0, x1, .5, 0,  x0, .5, 0, x1, .5, 0, m, -.5, 0); e.push(x0, .5, 0, m, -.5, 0, m, -.5, 0, x1, .5, 0); }
  G0 = _geoFrom(t, e); _GEO.set(key, G0); return G0; }
/* huruf piksel 3×5 (karya sendiri; tanpa fon luar). Baris atas→bawah, bit 4 = kolom kiri. Persegi panjang digabung (baris lalu tegak). */
const FONT35 = { A:[2,5,7,5,5], B:[6,5,6,5,6], C:[3,4,4,4,3], D:[6,5,5,5,6], E:[7,4,6,4,7], F:[7,4,6,4,4], G:[3,4,5,5,3], H:[5,5,7,5,5], I:[7,2,2,2,7],
  J:[1,1,1,5,2], K:[5,5,6,5,5], L:[4,4,4,4,7], M:[5,7,7,5,5], N:[6,5,5,5,5], O:[7,5,5,5,7], P:[6,5,6,4,4], Q:[2,5,5,6,3], R:[6,5,6,5,5], S:[3,4,2,1,6],
  T:[7,2,2,2,2], U:[5,5,5,5,7], V:[5,5,5,5,2], W:[5,5,7,7,5], X:[5,5,2,5,5], Y:[5,5,2,2,2], Z:[7,1,2,4,7], '0':[7,5,5,5,7], '1':[2,6,2,2,7], '2':[6,1,2,4,7],
  '3':[6,1,2,1,6], '4':[5,5,7,1,1], '5':[7,4,6,1,6], '6':[3,4,7,5,7], '7':[7,1,2,2,2], '8':[7,5,7,5,7], '9':[7,5,7,1,6], '-':[0,0,7,0,0], '.':[0,0,0,0,2],
  '+':[0,2,7,2,0], '/':[1,1,2,4,4], "'":[2,2,0,0,0], ' ':[0,0,0,0,0] };
function textGeo(str){ str = String(str || '').toUpperCase(); if (!str.trim()) return null; const key = 'tx|' + str; let G0 = _GEO.get(key); if (G0) return G0;
  const n = str.length, cols = n * 4 - 1, rects = [];
  for (let k = 0; k < n; k++){ const gl = FONT35[str[k]] || FONT35[' ']; let act = [];
    for (let row = 0; row < 5; row++){ const runs = []; let b = 0; while (b < 3){ if (gl[row] & (4 >> b)){ let e = b; while (e + 1 < 3 && (gl[row] & (4 >> (e + 1)))) e++; runs.push([b, e]); b = e + 1; } else b++; }
      const nx = []; for (const [b0, e0] of runs){ const r = act.find(a => a.b === b0 && a.e === e0); if (r){ r.y1 = row + 1; nx.push(r); } else { const nr = { b: b0, e: e0, y0: row, y1: row + 1, x: k * 4 }; rects.push(nr); nx.push(nr); } } act = nx; } }
  const t = [];
  for (const r of rects){ const x0 = (r.x + r.b) / cols - .5, x1 = (r.x + r.e + 1) / cols - .5, yt = .5 - r.y0 / 5, yb = .5 - r.y1 / 5;
    t.push(x0, yb, 0, x1, yb, 0, x1, yt, 0, x0, yb, 0, x1, yt, 0, x0, yt, 0); }
  G0 = _geoFrom(t, null); G0.cols = cols; _GEO.set(key, G0); return G0; }
// teks piksel di rangka f: pusat x = dx, alas dyb, bidang z = dz; muat dalam maxW × maxH (tinggi huruf)
function _teks(f, str, dx, dyb, dz, maxW, maxH, c, o){ const T0 = textGeo(str); if (!T0) return null; let hh = maxH, ww = T0.cols * hh / 5; if (ww > maxW){ ww = maxW; hh = ww * 5 / T0.cols; }
  return taruh(f, 'custom', ww, hh, 1, dx, dyb + (maxH - hh) / 2 + hh / 2, dz, c, { geo: T0.geo, edges: null, noHull: true, noEdge: true, lod: o && o.lod === 0 ? 0 : 1, slot: 0 }); }
function teks(str, x, y, z, o){ o = o || {}; const f = rangka(x, y, z, o.rot), h = o.tinggi || .4; return _teks(f, str, 0, 0, o.dz ?? .02, o.lebarMaks || 99, h, o.c || '#EDE8DC', o); }
// jeruji di rangka f: lebar w, tinggi h, alas dyb, bidang dz
function _jeruji(f, w, h, dx, dyb, dz, n, c, o){ o = o || {}; const bw = Math.min(.3, (o.batang || .035) / Math.max(w, .1)), rh = Math.min(.3, (o.rel || .05) / Math.max(h, .1)), J = jerujiGeo(n, bw, rh, o.rel !== 0, o.satu);
  return taruh(f, 'custom', w, h, 1, dx, dyb + h / 2, dz, c || BESI, { geo: J.geo, edges: null, noHull: true, noEdge: true, lod: o.lod ?? 1, slot: 0 }); }

/* =========================== DINDING =========================== */
// kotak dinding w×h×d, pusat (x, z), alas y. plinth = tinggi kaki dinding gelap (,6), lis = daftar y (relatif alas) lis lantai .12,
// pilaster = kolom sudut .3. adj {l,r}: plinth/lis/pilaster tidak melewati sisi deret.
function dinding(w, h, d, x, y, z, c, o){ o = o || {}; const f = rangka(x, y, z, o.rot), A = o.adj || {}, lod = o.lod;
  const q = taruh(f, 'box', w, h, d, 0, h / 2, 0, c, { wall: true, slot: o.slot ?? 2, lod });
  const ph = o.plinth ?? .6;
  if (ph > 0){ const [pw, px] = _ext(w, .03, A); taruh(f, 'box', pw, ph, d + .06, px, ph / 2, 0, o.cPlinth || darken(c, .78), { wall: true, slot: 0, lod }); }
  // lis lantai: pita ,12 lebih gelap TANPA garis lipatan (dua tepi ,12 terpisah terbaca garis ganda); garisnya = pita itu sendiri
  if (o.lis) for (const ly of o.lis){ const [lw, lx] = _ext(w, .06, A); taruh(f, 'box', lw, .12, d + .12, lx, ly + .06, 0, o.cLis || darken(c, .80), { wall: true, slot: 0, lod, noEdge: true }); }
  if (o.pilaster) for (const sx of [-1, 1]){ if ((sx < 0 && A.l) || (sx > 0 && A.r)) continue; for (const sz of [1, -1]) taruh(f, 'box', .3, h, .3, sx * (w / 2 - .12), h / 2, sz * (d / 2 - .12), o.cPilaster || darken(c, .92), { wall: true, slot: 0, lod }); }
  return q; }
// pita gelap di bawah teritis (spek §2.7): tinggi ,20 (ov < ,8) / ,28, darken(dinding, ,74) dicampur abu ,10; menembus atap ,03 (attach y+)
function pitaBawahAtap(w, d, x, yAtap, z, cWall, ov, o){ o = o || {}; const f = rangka(x, yAtap, z, o.rot), A = o.adj || {}, hb = (ov || 0) >= .8 ? .28 : .20, e = -w * .0075;
  const [pw, px] = _ext(w, e, A);
  return taruh(f, 'box', pw, hb + .03, d * .985, (o.dx || 0) + px, -hb / 2 + .015, o.dz || 0, campur(darken(cWall || '#C9BBA2', .74), '#9BA0A6', .10), { attach: 'y+', slot: 0, lod: o.lod }); }

/* =========================== BUKAAN =========================== */
// jendela: (a) reveal gelap (rim ,05 di luar kusen = garis jendela) (b) kaca 2 nada (c) kusen cincin (lod 1) (d) palang tegak (bawaan bila w ≥ 1,2) / palangH
// (e) ambang (f) daun opsional (warna, biasanya aksen c + daunSlot 1) (g) topi = luifel beton di atas jendela (h) teralis besi
function jendela(x, y, z, o){ o = o || {}; const w = o.w || 1.1, h = o.h || 1.5, f = rangka(x, y, z, o.rot), kc = o.kusen || KUSEN, lod = o.lod;
  const q = taruh(f, 'box', w + .22, h + .22, .07, 0, h / 2, 0, o.reveal || darken(o.wall || '#C9BBA2', .70), { attach: 'z+', ao: .8, slot: 0, lod });
  _kaca(f, w, h, 0, 0, .02);
  _bingkai(f, w + .12, h + .1, .09, 0, -.03, .035, .09, kc, o.ambang === false);   // kusen cincin (lod 1)
  if (o.ambang !== false) taruh(f, 'box', w + .32, .12, .2, 0, -.05, .06, o.cAmbang || darken(kc, .85), { attach: 'z+', slot: 0, lod });
  if (o.palang ?? w >= 1.2) taruh(f, 'box', .05, h, .05, 0, h / 2, .06, kc, { slot: 0 });
  if (o.palangH) taruh(f, 'box', w, .05, .05, 0, h * .7, .06, kc, { slot: 0 });
  if (o.daun){ const sw = Math.min(.5, w * .4); for (const s of [-1, 1]) taruh(f, 'box', sw, h, .05, s * (w / 2 + .13 + sw / 2), h / 2, -.005, o.daun, { attach: 'z+', slot: o.daunSlot ?? 0, lod }); }
  if (o.topi) taruh(f, 'box', w + .5, .1, .4, 0, h + .25, .17, o.cTopi || o.wall || '#C9BBA2', { attach: 'z+', slot: 0, lod });
  if (o.teralis) _jeruji(f, w - .02, h - .02, 0, .01, .1, o.teralisN || Math.max(3, Math.round(w / .17)), o.cTeralis || BESI, { satu: 1 });
  return q; }
// jendela kecil (kamar mandi, dapur, lantai atas murah): bingkai terang (atau gelap) + kaca + palang/nako + ambang ≈ 48 tri
function jendelaKecil(x, y, z, o){ o = o || {}; const w = o.w || .7, h = o.h || .7, f = rangka(x, y, z, o.rot), lod = o.lod;
  const fc = o.gelap ? darken(o.wall || '#C9BBA2', .70) : (o.kusen || KUSEN);
  const q = taruh(f, 'box', w + .16, h + .16, .07, 0, h / 2, 0, fc, { attach: 'z+', slot: 0, lod });
  _kaca(f, w, h, 0, 0, .02);
  if (o.nako){ const n = clamp(Math.round(h / .3), 3, 4); for (let k = 1; k < n; k++) taruh(f, 'box', w, .03, .05, 0, h * k / n, .06, fc, { slot: 0 }); }
  else if (o.palang ?? w >= .8) taruh(f, 'box', .05, h, .05, 0, h / 2, .06, fc, { slot: 0 });
  if (o.ambang !== false) taruh(f, 'box', w + .24, .12, .16, 0, -.05, .05, darken(fc, .85), { attach: 'z+', slot: 0, lod });
  if (o.teralis) _jeruji(f, w - .02, h - .02, 0, .01, .1, o.teralisN || Math.max(3, Math.round(w / .15)), o.cTeralis || BESI, { satu: 1 });
  return q; }
function jendelaBaris(n, w, y, z, o){ o = o || {}; const x0 = o.x0 || 0, xs = [];
  for (let k = 0; k < n; k++){ const x = x0 - w / 2 + w * (k + .5) / n; xs.push(x); (o.kecil ? jendelaKecil : jendela)(x, y, z, o); } return xs; }
// jendela berjeruji (penjara, gudang): jendela kecil + jeruji 2 muka (bidang tunggal, bukan batang terpisah; lihat jerujiGeo)
function jendelaJeruji(x, y, z, o){ o = Object.assign({ w: .6, h: .9 }, o || {}, { palang: false, teralis: true }); return jendelaKecil(x, y, z, o); }
// pintu: reveal gelap + daun (1/2) berpanel atau berkaca + kusen 3 batang (lod 1) + gagang + boven (kaca/roster di atas pintu) + kanopi opsional
function pintu(x, z, o){ o = o || {}; const w = o.w || PINTU_W, h = o.h || PINTU_H, f = rangka(x, o.y || 0, z, o.rot), kc = o.kusen || KUSEN, c = o.c || KAYU, nd = o.daun || 1, lod = o.lod;
  const bh = o.boven ? .42 : 0;
  if (o.reveal !== false) taruh(f, 'box', w + .3, h + .15 + bh, .06, 0, (h + .15 + bh) / 2, 0, darken(o.wall || '#C9BBA2', .70), { attach: 'z+', ao: .8, slot: 0, lod });
  let q = null; const lw = w / nd;
  for (let k = 0; k < nd; k++){ const lx = -w / 2 + lw * (k + .5);
    q = taruh(f, 'box', lw, h, .08, lx, h / 2, .02, c, { attach: 'z+', slot: o.slot ?? 0, lod });
    if (o.kaca) _kaca(f, lw * .6, h * .42, lx, h * .45, .065, null, { lod });
    else if (o.panel !== false){ for (const py of (o.kaca ? [.2] : [.2, .58])) taruh(f, 'box', lw * .62, h * .3, .06, lx, h * py + h * .15, .06, darken(c, .82), { attach: 'z+', noEdge: lw < .7, slot: 0, lod: 1 }); } }
  _bingkai(f, w + .26, h + .08, .1, 0, 0, .03, .1, kc, false);
  for (const gx of nd === 2 ? [-.08, .08] : [w * .36]) taruh(f, 'box', .05, .16, .05, gx, h * .47, .1, '#B8922E', { slot: 0 });
  if (o.boven === 'roster'){ taruh(f, 'box', w + .26, .4, .07, 0, h + .3, 0, kc, { attach: 'z+', slot: 0, lod }); for (let k = 0; k < 4; k++) taruh(f, 'box', w * .2, .22, .04, -w * .36 + k * w * .24, h + .3, .04, '#4E4740', { slot: 0, lod: 1, noEdge: true }); }
  else if (o.boven) _kaca(f, w, .3, 0, h + .14, .02);   // kaca boven di atas kusen (reveal gelap jadi bingkainya)
  if (o.kanopi){ const kd = .8, a = 14 * D2R, yk = h + bh + .35; taruh(f, 'box', w + .8, .08, (kd + .03) / Math.cos(a), 0, yk - (kd - .03) / 2 * Math.tan(a), (kd - .03) / 2, o.cKanopi || SENG, { rx: a, slot: 0, lod });
    for (const s of [-1, 1]) { const dz = kd - .15, dy = .45, L = Math.hypot(dz, dy); taruh(f, 'box', .04, .04, L, s * (w / 2 + .25), yk - .5 + dy / 2 - .03, dz / 2, BESI, { rx: -Math.atan2(dy, dz), lod: 1, slot: 0 }); } }
  return q; }
// etalase toko: reveal + dinding ambang (granit) + kaca 2 nada + bingkai 4 batang + pembagi tiap o.bagi (lod 1) + stiker teks opsional
function etalase(x, z, o){ o = o || {}; const w = o.w || 3, h = o.h || 2.5, ya = o.y ?? .5, f = rangka(x, o.y0 || 0, z, o.rot), bk = o.bingkai || BINGKAI, lod = o.lod;
  if (o.reveal !== false) taruh(f, 'box', w + .3, ya + h + .15, .06, 0, (ya + h + .15) / 2, 0, darken(o.wall || '#C9BBA2', .70), { attach: 'z+', ao: .8, slot: 0, lod });
  if (ya > 0) taruh(f, 'box', w + .1, ya, .24, 0, ya / 2, .07, o.ambang || '#8E97A0', { attach: 'z+', slot: 0, lod });
  const q = _kaca(f, w, h, 0, ya, .02);
  _bingkai(f, w + .12, h + .14, .1, 0, ya - .07, .04, .1, bk, true);
  const nb = Math.max(0, Math.round(w / (o.bagi || 1.2)) - 1); for (let k = 1; k <= nb; k++) taruh(f, 'box', .07, h, .08, -w / 2 + w * k / (nb + 1), ya + h / 2, .05, bk, { slot: 0 });
  if (o.palangH) taruh(f, 'box', w, .06, .08, 0, ya + h * .8, .05, bk, { slot: 0 });
  if (o.teks) _teks(f, o.teks, 0, ya + h * .45, .06, w * .5, .22, o.cTeks || '#E6E2D8');
  return q; }
// isi toko yang terbuka (rak + barang warna-warni + renceng sachet + meja kaca + kaleng kerupuk) — semua detail dekat (lod 1)
const BARANG = ['#C9503C', '#D9A441', '#4C7FB0', '#5F8F4E', '#E6E2D8', '#B0607A', '#D9762B', '#3F7D92'];
function _isiToko(f, w, ho, o){ const sd = o.seedIsi || 0, ww = w * .9;
  for (const [k, yy] of [[0, ho * .38], [1, ho * .7]]){ taruh(f, 'box', ww, .05, .3, 0, yy, .2, '#6B5546', { lod: 1, noEdge: true, slot: 0 });
    const n = 3; for (let i = 0; i < n; i++) taruh(f, 'box', ww / n - .08, .26 + ((i + k + sd) % 2) * .1, .2, -ww / 2 + ww * (i + .5) / n, yy + .025 + .15, .2, BARANG[(i * 3 + k * 5 + sd) % BARANG.length], { lod: 1, noEdge: true, slot: 0 }); }
  for (let i = 0; i < 3; i++) taruh(f, 'box', .12, .75, .02, -ww * .38 + i * ww * .38, ho - .4, .1 + i * .01, BARANG[(i * 2 + sd + 1) % BARANG.length], { slot: 0 });   // renceng (lod 1 otomatis)
  if (o.meja !== false){ const mw = Math.min(2.2, w * .55);
    taruh(f, 'box', mw, .95, .5, w * .12, .475, .35, '#7A5A3A', { slot: 0, lod: o.lod });
    _kaca(f, mw - .1, .4, w * .12, .45, .62, null, { lod: 1 });
    taruh(f, 'box', .3, .34, .3, w * .12 - mw * .3, .95 + .17, .35, '#D9C9A0', { slot: 0, lod: 1, noEdge: true }); }   // kaleng kerupuk
}
// rolling door (folding gate toko): kotak gulungan + rel (lod 1) + daun bergaris; buka 0..1 = bagian tergulung (isi toko tampak)
function rollingDoor(x, z, o){ o = o || {}; const w = o.w || 3, h = o.h || 3, f = rangka(x, o.y || 0, z, o.rot), c = o.c || '#8A939A', lod = o.lod, buka = clamp(o.buka || 0, 0, 1);
  if (o.reveal !== false) taruh(f, 'box', w + .3, h + .5, .06, 0, (h + .5) / 2, 0, darken(o.wall || '#C9BBA2', .70), { attach: 'z+', ao: .8, slot: 0, lod });
  taruh(f, 'box', w + .2, .34, .32, 0, h + .17, .13, darken(c, .82), { attach: 'z+', slot: 0, lod });
  for (const s of [-1, 1]) taruh(f, 'box', .1, h, .14, s * (w / 2 + .03), h / 2, .04, darken(c, .7), { slot: 0 });
  const hd = h * (1 - buka); let q = null;
  if (hd > .05){ q = taruh(f, 'box', w, hd, .08, 0, h - hd / 2, .02, c, { attach: 'z+', slot: 0, lod });
    const n = Math.max(1, Math.round(hd / (o.jarakGaris || .45)) - 1); for (let k = 1; k <= n; k++) taruh(f, 'box', w, .04, .1, 0, h - hd + hd * k / (n + 1), .04, o.garis || '#5E666C', { slot: 0 }); }
  if (buka > .05){ const ho = h - hd; taruh(f, 'box', w, ho, .04, 0, ho / 2, .035, o.cDalam || '#3A3430', { noEdge: true, slot: 0, lod });
    if (o.isi !== false) _isiToko(f, w, ho, o); }
  return q; }

/* =========================== TENDA, PAPAN, EMPERAN =========================== */
// tenda kain: menempel dinding di tinggi y, menjorok 'dalam' (horizontal) miring turun 'miring'° ke luar; strip bergaris c/c2; lis depan + gerigi
function tenda(x, y, z, o){ o = o || {}; const w = o.w || 3.2, dl = o.dalam ?? .9, a = (o.miring ?? 22) * D2R, f = rangka(x, y, z, o.rot), c = o.c || AKSEN[0], c2 = o.c2 || '#E6E2D8', lod = o.lod;
  const L = (dl + .03) / Math.cos(a), zc = (dl - .03) / 2, yc = -zc * Math.tan(a), n = o.strip === 0 ? 1 : (o.strip || Math.max(2, Math.round(w / .55)));
  let q; for (let k = 0; k < n; k++){ const sw = w / n, alt = n > 1 && k % 2; q = taruh(f, 'box', sw, .06, L, -w / 2 + sw * (k + .5), yc, zc, alt ? c2 : c, { rx: a, slot: alt ? 0 : o.slot, lod }); }
  const yf = -dl * Math.tan(a), hv = .26; let yb = yf;
  if (o.gerigi !== false){ taruh(f, 'box', w, hv, .04, 0, yf - hv / 2 + .02, dl - .03, c, { slot: o.slot, lod }); yb = yf - hv + .02;
    const G0 = gerigiGeo(Math.max(3, Math.round(w / .32))); taruh(f, 'custom', w, .14, 1, 0, yb - .07 + .005, dl - .03, o.cGerigi || c2, { geo: G0.geo, edges: G0.edges, noHull: true, lod: 1, slot: 0 }); yb -= .14; }
  if (o.penyangga !== false) for (const s of [-1, 1]){ const dz = dl - .12, dy = .5, Lb = Math.hypot(dz, dy); taruh(f, 'box', .035, .035, Lb, s * (w / 2 - .2), yf - .03 - dy / 2 + (dl - dz) * 0, dz / 2, BESI, { rx: -Math.atan2(dy, dz), slot: 0 }); }
  if (o.tiang) for (const s of [-1, 1]) taruh(f, 'box', .07, y + yb, .07, s * (w / 2 - .1), -y + (y + yb) / 2, dl - .08, o.cTiang || BESI, { slot: 0 });
  return { q, yDepan: y + yb, zDepan: dl }; }
// papan nama: bingkai emas di belakang (rim ,06) + papan tebal ,15 (warna c) + teks piksel opsional (lod 1)
function papanNama(x, y, z, o){ o = o || {}; const w = o.w || 3, h = o.h || .7, f = rangka(x, y, z, o.rot), c = o.c || AKSEN[0], lod = o.lod;
  if (o.bingkai !== false) taruh(f, 'box', w + .12, h + .12, .08, 0, h / 2, .01, o.bingkai || '#C9B37A', { attach: 'z+', slot: 0, lod });
  const q = taruh(f, 'box', w, h, .15, 0, h / 2, .045, c, { attach: 'z+', slot: o.slot ?? 0, lod });
  if (o.teks) _teks(f, o.teks, 0, h * .2, .135, w * .88, h * .6, o.cTeks || '#EDE8DC');
  return q; }
// emperan / kanopi seng di depan toko: lantai + atap miring (menempel dinding di y, turun ke depan) + kolom; tepi depan di z + d
function emperan(x, z, o){ o = o || {}; const w = o.w || 3, d = o.d ?? 1.4, yA = o.y ?? 3.0, a = (o.miring ?? 10) * D2R, f = rangka(x, 0, z, o.rot), lod = o.lod, tl = o.tinggiLantai ?? .15;
  if (o.lantai !== false) taruh(f, 'box', w, tl, d + .03, 0, tl / 2, (d - .03) / 2, o.cLantai || '#BFB6A8', { ao: .85, slot: 0, lod });
  const L = (d + .03) / Math.cos(a), zc = (d - .03) / 2, yF = yA - d * Math.tan(a);
  if (o.atap === false) return { q: null, yDepan: yF };   // hanya lantai (mis. di bawah tenda kain)
  const q = taruh(f, 'box', w, .08, L, 0, yA - zc * Math.tan(a), zc, o.c || SENG, { rx: a, slot: 0, lod });
  const nk = o.kolom ?? 2, kxs = o.kolomX || [...Array(nk)].map((_, k) => nk === 1 ? 0 : -w / 2 + .2 + (w - .4) * k / (nk - 1));
  for (const kx of kxs){ const zk = d - .2, hk = yA - zk * Math.tan(a) - .02 - tl;
    taruh(f, 'box', .18, hk, .18, kx, tl + hk / 2, zk, o.cKolom || '#D9D4C8', { slot: 0, lod }); }
  if (o.talang !== false) taruh(f, 'box', w, .1, .1, 0, yF - .08, d - .06, o.cTalang || PVC, { slot: 0 });
  return { q, yDepan: yF }; }
// teras: lantai tinggi t (keramik) menjorok d dari dinding + anak tangga (masing-masing ,3) + kolom opsional (daftar x lokal)
function teras(w, d, x, z, o){ o = o || {}; const f = rangka(x, 0, z, o.rot), t = o.tinggi ?? .3, n = o.tangga ?? 2, tw = o.tanggaW || Math.min(w, 1.6), tx = o.tanggaX || 0, lod = o.lod, c = o.c || '#C9BFA6';
  const q = taruh(f, 'box', w, t, d + .03, 0, t / 2, (d - .03) / 2, c, { slot: 0, lod });
  for (let k = 0; k < n; k++){ const hk = t * (n - k) / (n + 1); taruh(f, 'box', tw, hk, .32, tx, hk / 2, d + .14 + k * .3, darken(c, .93), { slot: 0, lod }); }
  if (o.kolom) for (const kx of o.kolom){ const hk = (o.kolomH || LANTAI) - t; taruh(f, 'box', .22, hk, .22, kx, t + hk / 2, d - .16, o.cKolom || '#E6E2D8', { slot: 0, lod });
    if (o.umpak) taruh(f, 'box', .32, .25, .32, kx, t + .125, d - .16, o.cUmpak || darken(c, .8), { slot: 0, lod: 1 }); }
  return { q, zDepan: d + n * .3 }; }
// balkon: pelat + pagar (besi = jeruji 2 muka + pegangan; pita = panel gelap; tembok = dinding pendek + topi) + konsol
function balkon(x, y, z, o){ o = o || {}; const w = o.w || 2.4, j = o.jorok ?? .8, f = rangka(x, y, z, o.rot), lod = o.lod, gaya = o.gaya || 'besi', c = o.c || BESI, hr = .95;
  const q = taruh(f, 'box', w, .15, j + .03, 0, .075, (j - .03) / 2, o.cLantai || '#BFB6A8', { slot: 0, lod });
  if (gaya === 'tembok'){ const ct = o.cTembok || '#D9D4C8';
    taruh(f, 'box', w, hr - .1, .12, 0, .15 + (hr - .1) / 2, j - .06, ct, { wall: true, slot: 0, lod });
    for (const s of [-1, 1]) taruh(f, 'box', .12, hr - .1, j - .15, s * (w / 2 - .06), .15 + (hr - .1) / 2, (j - .15) / 2 - .03, ct, { wall: true, slot: 0, lod });
    taruh(f, 'box', w + .06, .08, .2, 0, hr + .09, j - .06, darken(ct, .85), { slot: 0, lod }); }
  else if (gaya === 'pita'){ taruh(f, 'box', w, .75, .03, 0, .15 + .375, j - .02, c, { slot: 0, lod, noHull: true });
    taruh(f, 'box', w, .12, .14, 0, .15 + hr - .06, j - .04, darken(c, 1.2), { slot: 0, lod }); }
  else { _jeruji(f, w - .02, hr - .2, 0, .15, j - .04, Math.max(4, Math.round(w / .16)), c, { lod: lod || 0 });
    for (const s of [-1, 1]) _jeruji(f.sub(s * (w / 2 - .02), 0, (j - .04) / 2, s * Math.PI / 2), j - .06, hr - .2, 0, .15, 0, Math.max(3, Math.round(j / .16)), c, { lod: 1 });
    taruh(f, 'box', w, .12, .14, 0, .15 + hr - .14, j - .04, c, { slot: 0, lod }); }
  if (o.konsol !== false) for (const s of [-1, 1]) taruh(f, 'box', .1, .25, j * .7, s * (w / 2 - .35), -.125, j * .35, darken(o.cLantai || '#BFB6A8', .85), { slot: 0, lod: 1 });
  return q; }
// koridor luar (kos): pelat menerus + pagar + kolom dari tanah tiap kolomJarak di tepi depan
function koridor(x, y, z, o){ o = o || {}; const w = o.w || 6, j = o.jorok ?? 1.2, f = rangka(x, y, z, o.rot);
  const q = balkon(x, y, z, Object.assign({}, o, { w, jorok: j, konsol: false, gaya: o.gaya || 'tembok' }));
  const nk = Math.max(2, Math.round(w / (o.kolomJarak || 3.2)) + 1);
  if (o.kolom !== false) for (let k = 0; k < nk; k++) taruh(f, 'box', .22, y, .22, -w / 2 + .15 + (w - .3) * k / (nk - 1), -y / 2, j - .15, o.cKolom || '#D9D4C8', { slot: 0, lod: o.lod });
  return q; }

/* =========================== ATAP =========================== */
/* atap pelana. Bubungan sejajar x lokal (arah 'x', deret) atau z (arah 'z', pelana menghadap jalan: ovL = teritis DEPAN, ovR = belakang).
   gaya 'pejal' (bawaan, 8 segitiga): prisma genteng utuh, teritis setinggi puncak dinding, pita bawah atap.
   gaya 'dinding': 2 papan genteng tebal ,12 + segitiga gevel warna dinding (cWall) + roster + lisplang; teritis turun ov·tan(sudut) di bawah puncak dinding. */
function atapPelana(w, d, x, y, z, o){ o = o || {}; const a = (o.sudut ?? 42) * D2R, ta = Math.tan(a), ov = o.overhang ?? .55, arahZ = o.arah === 'z', c = o.c || GENTENG[0], lod = o.lod, sl = o.slot ?? 3;
  const f = rangka(x, y, z, (o.rot || 0) + (arahZ ? Math.PI / 2 : 0));
  const L = arahZ ? d : w, S = arahZ ? w : d, ovL = o.ovL ?? ov, ovR = o.ovR ?? ov, ovD = o.ovD ?? ov, Lt = L + ovL + ovR, xo = (ovR - ovL) / 2, run = S / 2 + ovD;
  let q, yTop, yTepi;
  if (o.gaya !== 'dinding'){ const hR = run * ta;
    q = taruh(f, 'prism', Lt, hR, S + 2 * ovD, xo, hR / 2, 0, c, { slot: sl, lod }); yTop = hR; yTepi = 0;
    if (o.pita !== false){ const hb = ovD >= .8 ? .28 : .2, sh = Lt * .0075, l = ovL ? sh : 0, r = ovR ? sh : 0;
      taruh(f, 'box', Lt - l - r, hb + .03, (S + 2 * ovD) * .985, xo + (l - r) / 2, -hb / 2 + .015, 0, campur(darken(o.cWall || '#C9BBA2', .74), '#9BA0A6', .1), { attach: 'y+', slot: 0, lod }); }
    if (o.bubungan !== false) taruh(f, 'box', Lt, .14, .24, xo, hR - .03, 0, darken(c, .8), { slot: 0, lod });
  } else { const t = .12, ca = Math.cos(a), Ls = run / ca + t * ta + .06, zc0 = run / 2 - (t * ta + .06) * ca / 2;   // papan: ujung bawah di teritis z = run, ujung atas lewat bubungan
    for (const sd of [1, -1]){ const zc = sd * zc0, yb = .02 + (S / 2 - zc0) * ta;
      q = taruh(f, 'box', Lt, t, Ls, xo, yb + t / (2 * ca), zc, c, { rx: sd * a, slot: sl, lod }); }
    yTop = .02 + S / 2 * ta + t / ca; yTepi = .02 - ovD * ta;
    taruh(f, 'prism', L, S / 2 * ta, S, 0, S / 4 * ta, 0, o.cWall || '#C9BBA2', { wall: true, slot: o.cWall ? 2 : 0, lod });
    if (o.bubungan !== false) taruh(f, 'box', Lt, .16, .26, xo, yTop - .05, 0, darken(c, .8), { slot: 0, lod });
    for (const [sx, ovS] of [[-1, ovL], [1, ovR]]){ if (!ovS) continue;   // gevel terlihat (bukan sisi deret)
      const g = f.sub(sx * L / 2, 0, 0, sx * Math.PI / 2);
      if (o.roster !== false) taruh(g, 'box', Math.min(.9, S * .14), .24, .06, 0, S / 2 * ta * .36, .0, '#4E4740', { attach: 'z+', slot: 0, lod: 1 });
      if (o.lisplang !== false && (o.lisplang === 'semua' || !arahZ || sx < 0)) for (const sd of [1, -1]) taruh(f, 'box', .05, .22, Ls, xo + sx * (Lt / 2 + .02), .02 + (S / 2 - zc0) * ta + t / (2 * ca), sd * zc0, o.cLisplang || '#E6E2D8', { rx: sd * a, slot: 0, lod }); } }
  return { q, yPuncak: y + yTop, yTepi: y + yTepi }; }
// atap limasan (perisai): hipGeo, semua bidang 'sudut'°, teritis 'overhang' di keempat sisi + bubungan + pita bawah atap
function atapLimasan(w, d, x, y, z, o){ o = o || {}; const a = (o.sudut ?? 30) * D2R, ov = o.overhang ?? .8, W = w + 2 * ov, D = d + 2 * ov, h = Math.min(W, D) / 2 * Math.tan(a), f = rangka(x, y, z, o.rot), c = o.c || GENTENG[0], lod = o.lod;
  const H0 = hipGeo(W, D, h);
  const q = taruh(f, 'custom', W, h, D, 0, h / 2, 0, c, { geo: H0.geo, edges: H0.edges, slot: o.slot ?? 3, lod });
  if (o.bubungan !== false && Math.abs(W - D) > .3) taruh(f, 'box', W > D ? W - D + .1 : .2, .12, W > D ? .2 : D - W + .1, 0, h - .03, 0, darken(c, .8), { slot: 0, lod });
  if (o.pita !== false) pitaBawahAtap(W, D, x, y, z, o.cWall, ov, { rot: o.rot, lod });
  return { q, yPuncak: y + h, h }; }
// joglo: limasan bawah landai + limasan atas curam (brunjung) — dua hipGeo
function atapJoglo(w, d, x, y, z, o){ o = o || {}; const ov = o.overhang ?? 1.0, k = o.atas ?? .5;
  const r1 = atapLimasan(w, d, x, y, z, { sudut: o.sudutBawah ?? 22, overhang: ov, c: o.c, cWall: o.cWall, rot: o.rot, lod: o.lod, slot: o.slot });
  const W2 = (w + 2 * ov) * k, D2 = (d + 2 * ov) * k, ov2 = .3;
  const r2 = atapLimasan(W2 - 2 * ov2, D2 - 2 * ov2, x, y + r1.h * (1 - k) + .05, z, { sudut: o.sudutAtas ?? 42, overhang: ov2, c: o.c, cWall: o.cWall, rot: o.rot, lod: o.lod, slot: o.slot, pita: false });
  return { yPuncak: r2.yPuncak, q: r1.q }; }
// atap tumpang (masjid): 'tingkat' limasan bertumpuk mengecil + drum dinding di antaranya + mustaka emas
function atapTumpang(w, d, x, y, z, o){ o = o || {}; const n = o.tingkat || 3, sud = o.sudut || [25, 35, 50], ov = o.overhang ?? .6, sc = [1, .62, .36, .22], jr = o.jarak ?? .9, f = rangka(x, y, z, o.rot);
  let yb = y, last = null, q = null;
  for (let k = 0; k < n; k++){ const W = (w + 2 * ov) * sc[k], D = (d + 2 * ov) * sc[k], a = (sud[k] ?? sud[sud.length - 1]) * D2R, h = Math.min(W, D) / 2 * Math.tan(a), H0 = hipGeo(W, D, h);
    const qq = taruh(rangka(x, yb, z, o.rot), 'custom', W, h, D, 0, h / 2, 0, o.c || '#4F6D5A', { geo: H0.geo, edges: H0.edges, slot: o.slot ?? 0, lod: o.lod }); if (!q) q = qq;
    if (k < n - 1){ const r = sc[k + 1] / sc[k], ydrum = yb + h * (1 - r) - .05; taruh(rangka(x, ydrum, z, o.rot), 'box', W * r * .78, jr + .05, D * r * .78, 0, (jr + .05) / 2, 0, o.cDrum || '#E3DED2', { wall: true, slot: 0, lod: o.lod }); yb = ydrum + jr; }
    else last = yb + h; }
  if (o.mustaka !== false){ const m = rangka(x, last - .05, z, o.rot); taruh(m, 'cylLo', .2, .5, .2, 0, .25, 0, '#C2913A', { slot: 0 }); taruh(m, 'sphLo', .4, .4, .4, 0, .65, 0, '#C2913A', { slot: 0 }); taruh(m, 'cone', .14, .5, .14, 0, 1.05, 0, '#C2913A', { slot: 0, lod: 1 }); last += 1.3; }
  return { yPuncak: last, q }; }
// atap datar beton + parapet (sisi 'fblr'; sisi deret adj dilewati) + lis topi di parapet depan; pelat di dalam lingkar parapet
function atapDatar(w, d, x, y, z, o){ o = o || {}; const f = rangka(x, y, z, o.rot), p = o.parapet ?? .5, t = o.tebal ?? .2, c = o.c || '#C9C1B2', cp = o.cParapet || o.cWall || '#D9D4C8', lod = o.lod, A = o.adj || {}, sisi = o.sisi || 'fblr', ws = o.slotParapet ?? 0;
  const has = { f: p > 0 && sisi.includes('f'), b: p > 0 && sisi.includes('b'), l: p > 0 && sisi.includes('l') && !A.l, r: p > 0 && sisi.includes('r') && !A.r };
  const x0 = -w / 2 + (has.l ? t : 0), x1 = w / 2 - (has.r ? t : 0), z0 = -d / 2 + (has.b ? t : 0), z1 = d / 2 - (has.f ? t : 0);
  const q = taruh(f, 'box', x1 - x0, .12, z1 - z0, (x0 + x1) / 2, .06, (z0 + z1) / 2, c, { slot: 0, lod });
  if (has.f) taruh(f, 'box', w, p, t, 0, p / 2, d / 2 - t / 2, cp, { wall: true, slot: ws, lod });
  if (has.b) taruh(f, 'box', w, p * .8, t, 0, p * .4, -d / 2 + t / 2, cp, { wall: true, slot: ws, lod });
  if (has.l) taruh(f, 'box', t, p * .8, d - 2 * t, -w / 2 + t / 2, p * .4, 0, cp, { wall: true, slot: ws, lod });
  if (has.r) taruh(f, 'box', t, p * .8, d - 2 * t, w / 2 - t / 2, p * .4, 0, cp, { wall: true, slot: ws, lod });
  if (has.f && o.lis !== false){ const [lw, lx] = _ext(w, .05, A); taruh(f, 'box', lw, .1, t + .1, lx, p + .05, d / 2 - t / 2 + .02, darken(cp, .85), { slot: 0, lod }); }
  return { q, yAtas: y + p }; }
// atap gergaji (pabrik): n gigi sepanjang z, muka tegak berkaca menghadap −z (cahaya utara)
function atapGergaji(w, d, x, y, z, o){ o = o || {}; const n = o.n || 4, ht = o.tinggi || 1.4, f = rangka(x, y, z, o.rot), dk = d / n, S0 = sawGeo(); let q;
  for (let k = 0; k < n; k++){ const zc = -d / 2 + dk * (k + .5); q = taruh(f, 'custom', w, ht, dk, 0, ht / 2, zc, o.c || '#6E7F8A', { geo: S0.geo, edges: S0.edges, slot: 0, lod: o.lod });
    if (o.kaca !== false) _kaca(f.sub(0, 0, zc - dk / 2 + .0, Math.PI), w * .92, ht * .62, 0, ht * .2, .02); }
  return q; }

/* =========================== UTILITAS & PERABOT =========================== */
// talang (pipa paralon tegak) di muka dinding: x, alas y0, tinggi h, o.z = bidang dinding, o.rot = hadap; batang tipis → lod 1
function talang(x, y0, h, o){ o = o || {}; const f = rangka(x, y0, o.z || 0, o.rot);   // o.z = bidang dinding, o.rot = hadap dinding
  const q = taruh(f, 'box', .09, h, .09, 0, h / 2, .07, o.c || PVC, { slot: 0 }); if (o.siku) taruh(f, 'box', .09, .09, .3, 0, h - .05, .2, o.c || PVC, { slot: 0 }); return q; }
// AC luar: badan (berkulit siluet) + kisi kipas (lod 1) + rak penyangga opsional (o.rak, lod 1); 24–36 segitiga
function ac(x, y, z, o){ if (typeof o === 'number') o = { rot: o }; o = o || {}; const f = rangka(x, y, z, o.rot);
  const q = taruh(f, 'box', .8, .55, .3, 0, .275, .12, o.c || '#D8D8D2', { attach: 'z+', slot: 0, lod: o.lod });
  taruh(f, 'box', .4, .4, .02, -.12, .275, .275, '#7D858C', { slot: 0, lod: 1, noEdge: true });
  if (o.rak) taruh(f, 'box', .74, .05, .36, 0, -.025, .15, BESI, { slot: 0, lod: 1, noEdge: true });
  return q; }
// toren air di atas rangka besi: tangki cylLo (oranye/biru) + tutup + platform + 4 kaki (lod 1)
function tandon(x, y, z, o){ o = o || {}; const r = o.r || .5, h = o.h || 1.1, kk = o.kaki ?? .8, c = o.c === 'biru' ? '#3E6FB0' : o.c || '#D9762B';
  if (kk > 0){ for (const a of [-1, 1]) for (const b of [-1, 1]) box(.06, kk, .06, x + a * r * .7, y, z + b * r * .7, BESI); box(r * 2 + .1, .08, r * 2 + .1, x, y + kk, z, BESI); }
  const q = cylLo(r, h, x, y + kk + .08, z, c); cylLo(r * .3, .1, x, y + kk + .08 + h, z, darken(c, .85)).lod = 1;
  return q; }
function antena(x, y, z, o){ o = o || {}; const h = o.h || 3.2, f = rangka(x, y, z, o.rot);
  taruh(f, 'box', .06, h, .06, 0, h / 2, 0, '#9C9A92', { slot: 0 });
  for (let k = 0; k < 2; k++) taruh(f, 'box', 1.1 - k * .3, .04, .04, 0, h - .2 - k * .4, 0, '#9C9A92', { slot: 0, ry: .3 });
  return null; }
function parabola(x, y, z, o){ o = o || {}; const f = rangka(x, y, z, o.rot);
  taruh(f, 'box', .08, .7, .08, 0, .35, 0, '#9C9A92', { slot: 0 });
  return taruh(f, 'sphLo', .9, .9, .25, 0, .85, .05, '#D8D8D2', { rx: -.9, slot: 0, lod: 1, noEdge: true }); }
function meteranListrik(x, y, z, o){ o = o || {}; const f = rangka(x, y, z, o.rot);
  return taruh(f, 'box', .28, .38, .14, 0, .19, .04, '#BFC3C6', { attach: 'z+', slot: 0, lod: 1 }); }
// pagar halaman sepanjang x (pusat x0) di garis z (muka belakang pagar menembus tidak ada; sepenuhnya di z ± tebal/2)
function pagarHalaman(w, z, o){ o = o || {}; const f = rangka(o.x0 || 0, 0, z, o.rot), gaya = o.gaya || 'tembok', h = o.h || .9, A = o.adj || {}, t = o.tebal || .18, lod = o.lod;
  const gW = o.gerbang === false ? 0 : (o.gW || 1.2), gx = (o.gx || 0) - (o.x0 || 0), xa = -w / 2, xb = w / 2;
  const segs = gW ? [[xa, gx - gW / 2 - .15], [gx + gW / 2 + .15, xb]] : [[xa, xb]];
  const cT = o.c || (gaya === 'kayu' ? '#E6E2D8' : gaya === 'bambu' ? '#C9A86A' : '#C9BBA0'), pil = [];
  let q = null;
  for (const [s0, s1] of segs){ const sw = s1 - s0, cx = (s0 + s1) / 2; if (sw < .05) continue;
    if (gaya === 'tembok' || gaya === 'besi'){ const hw = gaya === 'besi' ? .45 : h;
      q = taruh(f, 'box', sw, hw, t, cx, hw / 2, 0, cT, { wall: true, slot: 0, lod });
      taruh(f, 'box', sw, .08, t + .08, cx, hw + .04, 0, darken(cT, .86), { slot: 0, lod: 1 });   // topi pagar (detail dekat)
      if (gaya === 'besi') _jeruji(f, sw, h - .45 + .25, cx, hw + .08, 0, Math.max(3, Math.round(sw / (o.jarakBesi || .22))), o.cBesi || BESI, { lod: o.lod ?? 1, rel: .07, satu: o.duaMuka ? 0 : 1 });
      const np = Math.max(1, Math.round(sw / (o.pilar || 2.5))); for (let k = 0; k <= np; k++){ const px = s0 + sw * k / np; if ((k === 0 && s0 === xa && A.l) || (k === np && s1 === xb && A.r)) continue;
        if (gW && ((k === 0 && s0 !== xa) || (k === np && s1 !== xb))) continue; pil.push(clamp(px, xa + .15, xb - .15)); } }
    else { const hb = h; q = _jeruji(f, sw, hb, cx, 0, 0, Math.max(3, Math.round(sw / .16)), cT, { batang: .07, rel: .07, lod: 0, satu: o.duaMuka ? 0 : 1 });
      for (const yy of [hb * .25, hb * .8]) taruh(f, 'box', sw, .07, .07, cx, yy, .06, darken(cT, .85), { slot: 0 });
      const np = Math.max(1, Math.round(sw / 2.5)); for (let k = 0; k <= np; k++) taruh(f, 'box', .1, hb + .1, .1, clamp(s0 + sw * k / np, xa + .05, xb - .05), (hb + .1) / 2, -.04, darken(cT, .8), { slot: 0, lod }); } }
  const ph = (gaya === 'besi' ? h + .3 : h) + .15;
  for (const px of [...new Set(pil.map(v => +v.toFixed(3)))]) taruh(f, 'box', .28, ph, .28, px, ph / 2, 0, o.cPilar || darken(cT, .9), { wall: true, slot: 0, lod });
  if (gW && o.gerbangBesi !== false){ const gh = gaya === 'kayu' || gaya === 'bambu' ? h : h + .2;
    _jeruji(f, gW, gh, gx, .05, 0, Math.max(4, Math.round(gW / .17)), o.cGerbang || BESI, { lod: 0, rel: .08, satu: o.duaMuka ? 0 : 1 });
    for (const s of [-1, 1]) taruh(f, 'box', .3, gh + .3, .3, clamp(gx + s * (gW / 2 + .15), xa + .15, xb - .15), (gh + .3) / 2, 0, o.cPilar || darken(cT, .9), { wall: true, slot: 0, lod }); }
  return q; }
// pagar kawat (lapangan, gardu, pabrik): tiang tiap 2 u + rel + jaring jeruji rapat abu (sisi 'fblr')
function pagarKawat(w, d, x, z, o){ o = o || {}; const h = o.h || 1.8, sisi = o.sisi || 'fblr', f = rangka(x, 0, z, o.rot), c = o.c || '#8E979C';
  const side = (g, len) => { _jeruji(g, len, h, 0, 0, 0, Math.max(4, Math.round(len / .1)), c, { batang: .015, rel: .05, lod: 1 }); const np = Math.max(1, Math.round(len / 2)); for (let k = 0; k <= np; k++) taruh(g, 'box', .08, h + .1, .08, -len / 2 + len * k / np, (h + .1) / 2, 0, '#6F6A60', { slot: 0 }); };
  if (sisi.includes('f')) side(f.sub(0, 0, d / 2 - .05), w - .1); if (sisi.includes('b')) side(f.sub(0, 0, -d / 2 + .05), w - .1);
  if (sisi.includes('l')) side(f.sub(-w / 2 + .05, 0, 0, Math.PI / 2), d - .1); if (sisi.includes('r')) side(f.sub(w / 2 - .05, 0, 0, Math.PI / 2), d - .1);
  return null; }
// tiang bendera merah putih: alas beton + tiang + bola + bendera 2 lembar
function tiangBendera(x, z, h, o){ o = o || {}; h = h || 7; const f = rangka(x, 0, z, o.rot);
  taruh(f, 'box', .6, .3, .6, 0, .15, 0, '#BFB6A8', { slot: 0 }); const q = taruh(f, 'cylLo', .12, h, .12, 0, h / 2 + .3, 0, '#D8D8D2', { slot: 0 });
  taruh(f, 'sphLo', .14, .14, .14, 0, h + .37, 0, '#C2913A', { slot: 0, lod: 1 });
  taruh(f, 'box', 1.2, .4, .03, .62, h + .3 - .3, 0, '#B5473A', { slot: 0, noHull: true }); taruh(f, 'box', 1.2, .4, .03, .62, h + .3 - .7, 0, '#E6E2D8', { slot: 0, noHull: true });
  return q; }
// pot tanaman (bulat atau kotak semen) + rimbun sphLo (noEdge, lod 1)
function pot(x, z, s, o){ o = o || {}; s = s || 1; const y = o.y || 0, c = o.c || '#9C4935';
  if (o.kotak) box(.42 * s, .38 * s, .42 * s, x, y, z, c); else cylLo(.2 * s, .38 * s, x, y, z, c); const q = P[P.length - 1]; q.lod = 1; q.noEdge = true;
  const d0 = sphLo(.3 * s, x, y + .38 * s + .22 * s, z, o.bunga ? campur(o.daun || '#5F7A3F', o.bunga, .55) : o.daun || '#5F7A3F', .26 * s); d0.lod = 1; d0.noEdge = true;   // bunga: rimbun berwarna (bougenvil)
  return q; }
// pohon kecil halaman: bulat (mangga/jambu), pisang (daun lebar), pepaya
function pohonKecil(x, z, s, o){ o = o || {}; s = s || 1; const j = o.jenis || 'bulat';
  if (j === 'pisang'){ const q = cylLo(.11 * s, 1.7 * s, x, 0, z, '#8C9A5A'); for (let k = 0; k < 5; k++){ const a = k * 1.256 + .3; const lf = taruh(rangka(x + Math.sin(a) * .45 * s, 1.75 * s, z + Math.cos(a) * .45 * s, a), 'box', .42 * s, .03, 1.15 * s, 0, 0, 0, k % 2 ? '#6E9A45' : '#5F8A3E', { rx: .55, slot: 0, noEdge: true }); }
    return q; }
  if (j === 'pepaya'){ const q = cylLo(.08 * s, 2.6 * s, x, 0, z, '#9C9A7A'); sphLo(.55 * s, x, 2.8 * s, z, '#5F8A3E', .35 * s); sphLo(.12 * s, x + .12 * s, 2.45 * s, z + .1 * s, '#C2913A').lod = 1; return q; }
  const q = cylLo(.12 * s, 1.5 * s, x, 0, z, '#5E4630'); sphLo(.8 * s, x, 2.1 * s, z, o.c || '#6A9245', .7 * s); if (s > .9) { const b = sphLo(.5 * s, x + .4 * s, 2.5 * s, z - .2 * s, '#7FA850'); b.lod = 1; }
  return q; }
function bangku(x, z, o){ o = o || {}; const w = o.w || 1.4, f = rangka(x, o.y || 0, z, o.rot), c = o.c || '#7A5A3A';
  const q = taruh(f, 'box', w, .08, .42, 0, .45, 0, c, { slot: 0, lod: o.lod });
  for (const s of [-1, 1]) taruh(f, 'box', .08, .41, .36, s * (w / 2 - .12), .205, 0, darken(c, .8), { slot: 0, lod: 1 });
  if (o.sandaran !== false) taruh(f, 'box', w, .3, .06, 0, .78, -.2, c, { slot: 0, lod: 1 });
  return q; }
function lampuDinding(x, y, z, o){ o = o || {}; const f = rangka(x, y, z, o.rot);
  taruh(f, 'box', .06, .06, .3, 0, 0, .12, BESI, { slot: 0 }); const q = taruh(f, 'box', .2, .26, .2, 0, -.05, .3, '#3A3D40', { slot: 0, lod: 1 });
  _kaca(f, .14, .14, 0, -.22, .3, LAMPU, { lod: 1 }); return q; }
// spanduk kain (di dinding atau di antara 2 tiang): tipis ,04, teks piksel opsional
function spanduk(x, y, z, o){ o = o || {}; const w = o.w || 2.4, h = o.h || .8, f = rangka(x, y, z, o.rot), c = o.c || '#E6E2D8';
  const q = taruh(f, 'box', w, h, .04, 0, h / 2, o.tiang ? 0 : .01, c, { slot: 0, noHull: true, lod: o.lod });
  if (o.teks) _teks(f, o.teks, 0, h * .22, (o.tiang ? .02 : .03) + .012, w * .86, h * .56, o.cTeks || '#B5473A');
  if (o.tiang) for (const s of [-1, 1]) taruh(f, 'box', .06, y + h + .1, .06, s * (w / 2 + .04), -y + (y + h + .1) / 2, 0, '#8C6A48', { slot: 0 });
  return q; }
// jemuran: 2 tiang + kawat + n pakaian warna-warni (detail dekat)
function jemuran(x, z, o){ o = o || {}; const w = o.w || 2, h = o.h || 1.7, n = o.n || 4, f = rangka(x, o.y || 0, z, o.rot), cs = ['#B5473A', '#E6E2D8', '#4C6A96', '#C2913A', '#6F5E8C', '#5F8F4E'];
  for (const s of [-1, 1]) taruh(f, 'box', .06, h, .06, s * w / 2, h / 2, 0, '#8C8A84', { slot: 0 });
  taruh(f, 'box', w, .02, .02, 0, h - .05, 0, '#8C8A84', { slot: 0 });
  let q = null; for (let k = 0; k < n; k++){ const cw = .42 + (k % 2) * .16, ch = .5 + ((k + 1) % 3) * .12; q = taruh(f, 'box', cw, ch, .02, -w / 2 + w * (k + .5) / n, h - .06 - ch / 2, 0, cs[(k + (o.warna || 0)) % cs.length], { slot: 0, lod: 1, noEdge: true, noHull: true }); }
  return q; }
// tumpukan kardus barang
function kardus(x, y, z, o){ o = o || {}; const f = rangka(x, y, z, o.rot), n = o.n || 3; let q = null, yy = 0;
  for (let k = 0; k < n; k++){ const s = .5 - (k % 2) * .08; q = taruh(f, 'box', s, .36, s * .85, (k % 2) * .06 - .03, yy + .18, (k % 3) * .04, k % 2 ? '#C2A06A' : '#B8945F', { slot: 0, lod: 1, noEdge: k > 0 }); yy += .36; }
  return q; }
function galon(x, z, o){ o = o || {}; const q = cylLo(.14, .48, x, o.y || 0, z, '#7FA6C8'); q.lod = 1; q.noEdge = true; return q; }
// motor parkir (bebek/matik): 2 roda + badan + jok + setang; menghadap +z lokal
function motor(x, z, o){ o = o || {}; const f = rangka(x, 0, z, o.rot), c = o.c || '#B4443A';
  for (const zz of [-.62, .62]) taruh(f, 'cylLo', .56, .1, .56, 0, .3, zz, '#1E1C1A', { rx: Math.PI / 2, ry: Math.PI / 2, slot: 0, noEdge: true });
  const q = taruh(f, 'box', .3, .4, 1.1, 0, .55, 0, c, { slot: 0 }); taruh(f, 'box', .28, .12, .6, 0, .8, -.18, '#2B2B2B', { slot: 0, lod: 1 });
  taruh(f, 'box', .26, .45, .16, 0, .82, .52, c, { slot: 0, lod: 1 }); taruh(f, 'box', .6, .04, .04, 0, 1.06, .5, BESI, { slot: 0 });
  return q; }
// gerobak dagangan (bakso/siomay): badan kayu + kaca + atap seng + 2 roda + tiang
function gerobak(x, z, o){ o = o || {}; const f = rangka(x, 0, z, o.rot), c = o.c || '#E6E2D8';
  const q = taruh(f, 'box', 1.5, .8, .7, 0, .75, 0, c, { slot: 0 }); _kaca(f, 1.3, .45, 0, 1.15, .0, null, { lod: 1 });
  for (const s of [-1, 1]){ taruh(f, 'cylLo', .5, .08, .5, .4, .25, s * .4, '#1E1C1A', { rx: Math.PI / 2, slot: 0, noEdge: true }); taruh(f, 'box', .05, .9, .05, s * .7, 1.6, 0, BESI, { slot: 0 }); }
  taruh(f, 'box', .06, .35, .06, -.6, .175, 0, BESI, { slot: 0 });
  taruh(f, 'box', 1.7, .05, .9, 0, 2.08, 0, o.atap || SENG, { slot: 0 });
  if (o.teks) _teks(f, o.teks, 0, .5, .36, 1.3, .22, o.cTeks || '#B5473A');
  return q; }
// carport / kanopi garasi: 4 tiang besi + atap seng/polikarbonat miring tipis
function carport(x, z, w, d, o){ o = o || {}; const f = rangka(x, 0, z, o.rot), h = o.h || 2.5, a = (o.miring ?? 5) * D2R;
  for (const s of [-1, 1]) for (const t of [-1, 1]) taruh(f, 'box', .08, h - (t > 0 ? d * Math.tan(a) : 0), .08, s * (w / 2 - .1), (h - (t > 0 ? d * Math.tan(a) : 0)) / 2, t * (d / 2 - .1), BESI, { slot: 0 });
  return taruh(f, 'box', w, .06, d / Math.cos(a), 0, h - d / 2 * Math.tan(a) + .03, 0, o.c || '#9FB3B8', { rx: a, slot: 0 }); }
