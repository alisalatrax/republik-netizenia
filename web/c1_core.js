<script>
'use strict';
/* =====================================================================
   REPUBLIK NETIZENIA · halaman statis (Cloudflare Pages / hosting statis apa pun)
   Semua aturan game ditegakkan di server (Supabase RPC SECURITY DEFINER).
   Halaman ini hanya menampilkan dan memanggil RPC.
   Hanya URL Supabase + publishable key (publik by design) yang ada di sini.
   ===================================================================== */
// Setelan proyek dibaca dari config.js (salin dari config.example.js). Hanya URL Supabase + publishable key.
const CFG = Object.assign({ url: '', key: '', mailDomain: 'warga.netizenia.local', site: location.host }, window.NZ_CONFIG || {});
if (!CFG.url || !CFG.key) document.addEventListener('DOMContentLoaded', () => { document.body.insertAdjacentHTML('beforeend', '<div style="position:fixed;inset:auto 16px 16px;z-index:99;background:#C8553D;color:#fff;padding:12px 16px;border-radius:12px;font:700 14px sans-serif">config.js belum diisi: salin config.example.js menjadi config.js lalu isi URL Supabase dan publishable key.</div>'); });
const QS = new URLSearchParams(location.search);

/* ---------------- util ---------------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const fmt = v => Math.round(Number(v) || 0).toLocaleString('id-ID');
const nc = v => fmt(v) + ' NC';
const COIN = '<span class="coin">N</span>';
const initials = n => (String(n || '?').replace(/[^\p{L}\p{N} ]/gu, '').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('') || '?').toUpperCase();
function rng(seed){ return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s){ let h = 2166136261; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
let clockOffset = 0;                       // selisih jam server - jam HP
const now = () => Date.now() + clockOffset;
const JAM = QS.has('jam') ? clamp(parseFloat(QS.get('jam')) || 0, 0, 24) : null; // ?jam=20 untuk pratinjau malam
let photoHour = null;                     // jam pilihan di mode foto
const wibHours = () => photoHour !== null ? photoHour : JAM !== null ? JAM : (((now() / 3600000 + 7) % 24) + 24) % 24;
const wibClock = () => { const h = wibHours(); return String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.floor((h % 1) * 60)).padStart(2, '0'); };
const fmtLeft = ms => { ms = Math.max(0, ms); const m = Math.ceil(ms / 60000); if (m >= 60) { const h = Math.floor(m / 60), r = m % 60; return h + ' jam' + (r ? ' ' + r + ' mnt' : ''); } return m + ' mnt'; };
const rupiah = v => 'Rp' + Math.round(Number(v) || 0).toLocaleString('id-ID');
const fmtWib = iso => { try { return new Date(iso).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit', timeZone:'Asia/Jakarta'}) + ' WIB'; } catch (_) { return ''; } };
const fmtAgo = iso => { const m = Math.round((now() - new Date(iso).getTime()) / 60000); return m < 1 ? 'baru saja' : m < 60 ? m + ' mnt lalu' : m < 1440 ? Math.floor(m / 60) + ' jam lalu' : Math.floor(m / 1440) + ' hari lalu'; };
const store = { get(k, d){ try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } }, set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} } };
let toastT;
function toast(m, kind){ const t = $('#toast'); t.textContent = m; t.className = kind || ''; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, kind === 'bad' ? 4200 : 2900); }
function floatText(txt, x, y){ const el = document.createElement('div'); el.className = 'float'; el.textContent = txt; el.style.left = (x ?? innerWidth / 2 - 30) + 'px'; el.style.top = (y ?? 70) + 'px'; document.body.appendChild(el); setTimeout(() => el.remove(), 1400); }

/* ---------------- grid peta v3 (IDENTIK dengan nz.road_i/road_j/is_lot/block_of/district_of/ring_of/facing_of di server) ---------------- */
const T = 8, PD = 43, N = 217, HALF = (N - 1) / 2;                 // petak 8 unit (1 unit = 1 m, spek-gaya §4.1) · periode distrik 43 · 217 petak · HALF = 108
const Y0 = .2;   // SATU-SATUNYA ketinggian lantai dunia (muka pelataran blok): akar bangunan, kavling, kaki NPC/tokoh, pohon, tiang. Tanah & jalan hanya lapisan tipis ≤ 6 cm di bawahnya (anti z-fight)
// skala manusia (spek-gaya §4.2): lantai 3,2 · lantai dasar usaha 4,2 · manusia 1,70 (1:6,5) · pintu 1,0×2,1 · trotoar kolektor 1,4 · aspal kolektor 5,2 · curb ,22
const LANTAI = 3.2, LANTAI_USAHA = 4.2, MANUSIA = 1.7, PINTU_W = 1.0, PINTU_H = 2.1, TROTOAR = 1.4, ASPAL = 5.2, CURB = .22;
const wx = i => (i - HALF) * T;                                      // dipakai untuk i dan j (peta persegi)
const roadI = i => { const u = i % PD; return u < 2 ? 3 : (u - 2) % 7 === 6 ? 2 : 0; };   // kolom: u∈{0,1} arteri (3); u∈{8,15,22,29,36} kolektor (2)
const roadJ = j => { const v = j % PD; return v < 2 ? 3 : (v - 2) % 3 === 2 ? 1 : 0; };   // baris: v∈{0,1} arteri (3); v∈{4,7,...,40} gang (1)
const inMap = (i, j) => i >= 0 && j >= 0 && i < N && j < N;
const isRoad = (i, j) => inMap(i, j) && (roadI(i) > 0 || roadJ(j) > 0);
const isLot  = (i, j) => inMap(i, j) && roadI(i) === 0 && roadJ(j) === 0;
// blockOf/dIdx/districtOf/ringOf HANYA sah untuk 0 <= i,j < N (koordinat negatif: Math.floor ≠ pembagian bulat Postgres). Pemanggil wajib cek isLot/inMap dulu.
const blockOf = (i, j) => [Math.floor(i / PD) * 6 + Math.floor((i % PD - 2) / 7), Math.floor(j / PD) * 14 + Math.floor((j % PD - 2) / 3)];   // bx 0..29, by 0..69
const sameBlock = (i, j, w, h) => { const a = blockOf(i, j), b = blockOf(i + w - 1, j + h - 1); return a[0] === b[0] && a[1] === b[1]; };
const dIdx = i => Math.floor(i / PD);                                                 // 0..4 (i=215,216 → 5, hanya jalan)
const districtOf = (i, j) => 'k' + String(Math.min(dIdx(j), 4) * 5 + Math.min(dIdx(i), 4)).padStart(2, '0');   // 'k00'..'k24', pusat 'k12'
const ringOf = (i, j) => Math.max(Math.abs(Math.min(dIdx(i), 4) - 2), Math.abs(Math.min(dIdx(j), 4) - 2));     // 0 pusat, 1 kota, 2 desa
const DISTRICTS = [...Array(25)].map((_, n) => 'k' + String(n).padStart(2, '0'));
const DIST_RECT = Object.fromEntries(DISTRICTS.map((k, n) => [k, [(n % 5) * PD, Math.floor(n / 5) * PD, (n % 5) * PD + PD, Math.floor(n / 5) * PD + PD]]));
const OPEN_AT_START = DISTRICTS.filter(k => ringOf(DIST_RECT[k][0] + 2, DIST_RECT[k][1] + 2) <= 1);   // 9 distrik: k06 k07 k08 k11 k12 k13 k16 k17 k18
const distRing = k => DIST_RECT[k] ? ringOf(DIST_RECT[k][0] + 2, DIST_RECT[k][1] + 2) : 2;
// nama tampilan bawaan (ditimpa oleh tabel nz.districts lewat snapshot)
const DIST_NAME = (() => { const arah = { '0,-1':'Utara', '1,-1':'Timur Laut', '1,0':'Timur', '1,1':'Tenggara', '0,1':'Selatan', '-1,1':'Barat Daya', '-1,0':'Barat', '-1,-1':'Barat Laut' }; const o = {}, cnt = {};
  for (const k of DISTRICTS){ const n = +k.slice(1), dx = n % 5 - 2, dy = Math.floor(n / 5) - 2, r = Math.max(Math.abs(dx), Math.abs(dy));
    if (r === 0) o[k] = 'Kampung Pusat'; else if (r === 1) o[k] = 'Kampung ' + arah[dx + ',' + dy]; else { const a = arah[Math.sign(dx) + ',' + Math.sign(dy)]; cnt[a] = (cnt[a] || 0) + 1; o[k] = 'Desa ' + a + ' ' + cnt[a]; } }
  return o; })();
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
function facingCandidates(i, j, w, h, cw, ch){ const f = fronts(i, j, w, h); return [[0, f.S, w === cw], [2, f.N, w === cw], [1, f.E, w === ch], [3, f.W, w === ch]].filter(v => v[1] > 0 && v[2]).map(v => v[0]); }
const frontClass = (i, j, w, h, facing) => fronts(i, j, w, h)[['S', 'E', 'N', 'W'][facing]];
// kelas kavling = kelas tertinggi dari 4 sisi tapak; zona dihitung dari ini, bukan dari facing
const lotClass = (i, j, w, h) => { const f = fronts(i, j, w, h); return Math.max(f.S, f.N, f.E, f.W); };
const zoneOf = (ring, k) => ring === 0 ? (k === 3 ? 'CBD' : k === 2 ? 'RUKO' : 'KOTA') : ring === 1 ? (k >= 2 ? 'RUKO' : 'KAMPUNG') : (k === 3 ? 'RUKO_KECIL' : k === 2 ? 'KAMPUNG' : 'DESA');
const zoneOfLot = (i, j, w, h) => zoneOf(ringOf(i, j), lotClass(i, j, w, h));
const LAND_MULT = { CBD: 4, RUKO: 2.5, RUKO_KECIL: 1.5, KOTA: 1.5, KAMPUNG: 1, DESA: .5 };
const ZONE_NAME = { CBD: 'Pusat Bisnis', RUKO: 'Ruko', RUKO_KECIL: 'Ruko Desa', KOTA: 'Perumahan Kota', KAMPUNG: 'Kampung', DESA: 'Desa' };
const FREE_ZONES = ['KAMPUNG', 'KOTA', 'DESA'];
function floorsFor(type, ring, k){
  switch (type){
    case 'ruko': return k === 3 ? 4 : k === 2 ? 3 : 2;
    case 'kantor': return ring === 0 ? (k === 3 ? 8 : 6) : 4;
    case 'apartemen': return ring === 0 ? 12 : 6;
    case 'kos': return ring === 0 && k >= 2 ? 3 : 2;
    case 'toko': return k === 3 ? 2 : 1;
    case 'rumah2': return 2;
    case 'rs': return ring === 0 ? 5 : 3;
    default: return 1;
  }
}
/* ---------------- kerangka F & setback (§4): sb = {f depan, s samping, b belakang} per grup × zona ---------------- */
const SETBACK = {
  rumah:   { KAMPUNG: { f: 1.2, s: .2, b: .4 }, DESA: { f: 1.2, s: .2, b: .4 }, KOTA: { f: 2, s: .9, b: .6 }, '*': { f: 1.2, s: .2, b: .4 } },
  kos:     { '*': { f: 1, s: .2, b: .4 } },
  ruko:    { KOTA: { f: .8, s: 0, b: .5 }, KAMPUNG: { f: .8, s: 0, b: .5 }, DESA: { f: .8, s: 0, b: .5 }, '*': { f: .6, s: 0, b: .5 } },
  warung:  { '*': { f: .4, s: .6, b: 1.2 } },
  gedung:  { '*': { f: 2.4, s: 1.2, b: 1 } },
  lapang:  { '*': { f: .3, s: .3, b: .3 } },
  proyek:  { '*': { f: .6, s: .3, b: .5 } },
};
const SB_GROUP = { rumah:'rumah', rumah2:'rumah', mulyo:'rumah', kos:'kos', ruko:'ruko', toko:'ruko', kafe:'ruko', bengkel:'ruko', warung:'warung',
  kantor:'gedung', apartemen:'gedung', sekolah:'gedung', rs:'gedung', polisi:'gedung', bank:'gedung', istana:'gedung', terminal:'gedung', penjara:'gedung', barak:'gedung', pabrik:'gedung', pln:'gedung', stadion:'gedung', ibadah:'gedung', pasar:'gedung', posko:'gedung',
  taman:'lapang', lapangan:'lapang', sawah:'lapang', kebun:'lapang', pkl:'lapang', pangkalan:'lapang', tugu:'lapang', waduk:'lapang', proyek_gedung:'proyek', proyek_rumah:'proyek', lahan_material:'proyek' };
function setbackOf(type, zone){ const g = SETBACK[SB_GROUP[type] || 'gedung']; return g[zone] || g['*']; }
// lw, lh = ukuran tapak dalam ruang model (lw = facing%2 ? h : w). Sisi +z model = muka jalan (pintu, teras, kanopi).
function frame(lw, lh, sb){ return { x0: -lw * T / 2 + sb.s, x1: lw * T / 2 - sb.s, z1: lh * T / 2 - sb.f, z0: -lh * T / 2 + sb.b, edge: lh * T / 2, side: lw * T / 2 }; }
const ZONE_BASE = { CBD: '#CFC6B8', RUKO: '#C9C1B2', RUKO_KECIL: '#CFC3AE', KAMPUNG: '#CFC6B4', KOTA: '#8FA462', DESA: '#7F9455' };   // alas kavling: paving (pusat/usaha) / rumput 2 nada (hunian) — palet spek-gaya §3

/* ---------------- profesi ---------------- */
const PROF = {
  Warga:{d:'Bebas kerja di mana saja. Aksi: kerja bakti.', c:'#79B94F'},
  Tukang:{d:'Mempercepat pembangunan, dibayar tiap bantuan.', c:'#E2A21F'},
  Mandor:{d:'Mengawasi proyek, upah bantu lebih besar.', c:'#E8833A'},
  Arsitek:{d:'Merancang ulang usulan, biaya turun 10%.', c:'#3FA37B'},
  Guru:{d:'Mengajar warga di sekolah, digaji negara.', c:'#8A5A3C'},
  Murid:{d:'Belajar di sekolah untuk naik level.', c:'#3C7FD1'},
  Dokter:{d:'Mengobati warga sakit, digaji negara.', c:'#6F8A84'},
  Polisi:{d:'Menangkap warga yang dilapor 2+ akun.', c:'#2B3A67'},
  Pedagang:{d:'Usaha dagangmu laku 30% lebih banyak.', c:'#E07A00'},
  Petani:{d:'Sawahmu panen 60% lebih banyak.', c:'#5F8F2E'},
  Pengusaha:{d:'Bisa bangun kantor dan rekrut banyak karyawan.', c:'#6B4EA3'},
  Penjahat:{d:'Roleplay: untung cepat, bisa dilapor dan ditangkap.', c:'#37474F'},
};
const SPECIAL = { Menteri:'#6B4EA3', Presiden:'#1E2A44' };
const profColor = p => PROF[p]?.c || SPECIAL[p] || '#79B94F';
/* ---------------- palet v2 (spek-gaya §3). lin() mendesaturasi 8 %, primitif dinding (p.wall) 20 % ----------------
   COLORS = palet pemain yang DIVALIDASI SERVER (nz.palette(): register_profile/set_color menolak warna lain) → nilainya tidak boleh diganti di klien.
   Di dunia 3D warna pemilik selalu dipetakan ke AKSEN berindeks sama (aksenOf) dan hanya dipakai untuk aksen (tenda, papan nama, daun jendela), bukan atap. */
const COLORS = ['#D9483B','#2F8F5B','#3E6FB0','#E2A21F','#7A5AA6','#C8553D','#2E7D6B','#B5473A','#1F8AA8','#D0638A'];
const AKSEN  = ['#A9463A','#4F7A55','#4C6A96','#C2913A','#6F5E8C','#9C4935','#3F6B62','#8E3E34','#3F7D92','#B06A7C'];
const aksenOf = hex => { const h = String(hex || '').toUpperCase(); if (AKSEN.includes(h)) return h; const k = COLORS.indexOf(h); return k >= 0 ? AKSEN[k] : AKSEN[hashStr(h) % 10]; };
// dinding: 10 hue (krem, abu-krem, bata muda, bata, oker, zaitun pucat, biru-abu, pink pudar, abu tua, putih tulang); dipilih hashStr(b.id)%10, beda dari tetangga kiri (c2c wallIdx)
const WALLS = ['#DDD0B4','#C9BBA2','#B98C6E','#956350','#C9A86A','#8E9A78','#8FA0AA','#C9A4A0','#6C6A66','#E3DED2'];
// genteng per hash id: 50 % terakota, 30 % abu-tulis, 10 % zaitun, 10 % cokelat (indeks hashStr(id) % 10)
const GENTENG = ['#9C4935','#8E3E34','#A8553B','#9C4935','#A8553B','#5E6670','#4F555C','#5E6670','#4F6D5A','#6B5546'];
const KUSEN = '#EDE8DC';
const KACA = ['#C9D6E0', '#7D93A8'], LAMPU = '#F2CF8A';   // kaca 2 nada (kiri-atas / kanan-bawah), nyala lampu & jendela malam
const RUMPUT = ['#8FA462', '#7F9455'];                     // rumput 2 nada (Δ V ≈ 10 %)
const PAVING = ['#CFC6B8','#C9C1B2','#CFC3AE','#CFC6B4','#C9BFA6','#C6B898'];
const PAL = { nat: '#BFB6A8', aspal: '#45464A', trotoar: '#CFC9BC', curb: '#A9A398', marka: '#E8E6DF', zebra: '#D9D7CE', pasir: '#D3C293', tanah: '#C9A06A', air: '#7F93A6', airTepi: '#6B7E92',
  pintu: '#5A4636', pintu2: '#4E3C2E', gagang: '#B8922E', kayu: ['#8C6A48', '#5E4630', '#7A5A3A'], putih: ['#E6E2D8', '#DDD9CE', '#D9D4C8', '#E3DED2', '#E2D6B8'], bendera: ['#B5473A', '#E6E2D8'],
  besi: '#2B2B2B', bingkai: '#2B2F33', beton: '#9E9A90', betonGelap: '#6F6A60', seng: '#6E7F8A', abu: '#8E979C', abuGelap: '#5E666C', logam: '#8A939A', negara: '#8E3E34', ban: '#1E1C1A',
  pohon: { batang: '#5E4630', atas: '#7FA850', tengah: '#6A9245', bawah: '#4F7239' }, cemara: ['#4E3C2E', '#3F5E44', '#4A6B4A', '#557A52'], palem: '#5C7D3E', semak: '#5F7A3F',
  padi: ['#9DC25B', '#7EAF4F'], sawahAir: '#B8D9D4', pematang: '#B59A6A', bedeng: '#7E9452' };

/* ---------------- primitif model ---------------- */
let P = [], G = [];   // P = badan (bayangan, AO), G = jendela/lampu (menyala malam)
const box  = (sx,sy,sz,x,y,z,c,ry) => P.push({g:'box', s:[sx,sy,sz], p:[x,y+sy/2,z], c, ry});
const pyr  = (sx,sy,sz,x,y,z,c,ry) => P.push({g:'pyr', s:[sx,sy,sz], p:[x,y+sy/2,z], c, ry});
const roof = (sx,sy,sz,x,y,z,c,ry) => P.push({g:'prism', s:[sx,sy,sz], p:[x,y+sy/2,z], c, ry});
const cyl  = (r,h,x,y,z,c) => P.push({g:'cyl', s:[r*2,h,r*2], p:[x,y+h/2,z], c});
const cone = (r,h,x,y,z,c) => P.push({g:'cone', s:[r*2,h,r*2], p:[x,y+h/2,z], c});
const sph  = (r,x,y,z,c,ry) => P.push({g:'sph', s:[r*2,(ry||r)*2,r*2], p:[x,y,z], c});
const gbox = (sx,sy,sz,x,y,z,c) => G.push({g:'box', s:[sx,sy,sz], p:[x,y+sy/2,z], c: c || KACA[0], c2: !c || c === KACA[0] ? KACA[1] : c});   // kaca 2 nada: muka +z dibelah diagonal (merge)
const gsph = (r,x,y,z,c) => G.push({g:'sph', s:[r*2,r*2,r*2], p:[x,y,z], c: c || LAMPU});
function winRow(n, w, y, z, h, ww, x0){ h = h || .9; ww = ww || .8; x0 = x0 || 0; for (let k = 0; k < n; k++){ const x = x0 - w/2 + w*(k+.5)/n; box(ww+.22, h+.22, .08, x, y-.11, z-.02, '#EDE8DC'); gbox(ww, h, .1, x, y, z); } }
function winSide(n, d, y, x, h){ h = h || .9; for (let k = 0; k < n; k++){ const z = -d/2 + d*(k+.5)/n; gbox(.1, h, .75, x, y, z); } }
function door(x, z, c, w, h){ w = w || PINTU_W; h = h || PINTU_H; box(w, h, .14, x, 0, z, c || '#5A4636'); box(.12, .12, .05, x + w*.32, h*.5, z+.09, '#B8922E'); }
function flag(x, y, z, h){ cyl(.08, h, x, y, z, '#8A939A'); sph(.14, x, y+h+.05, z, '#B8922E'); box(.06,.6,1.6,x,y+h-.7,z+.82,'#B5473A'); box(.06,.6,1.6,x,y+h-1.3,z+.82,'#E6E2D8'); }
function tree(x, z, s, kind){ s = (s || 1) * 1.4; if (kind === 'palm'){ cyl(.18*s, 3.6*s, x, 0, z, '#8C6A48'); for (let a = 0; a < 5; a++){ const an = a/5*Math.PI*2; box(.25*s, .12*s, 2.2*s, x+Math.cos(an)*1*s, 3.5*s, z+Math.sin(an)*1*s, '#5C7D3E', Math.PI/2 - an); } sph(.3*s, x, 3.6*s, z, '#7A5A3A'); return; }
  cyl(.2*s, 1.3*s, x, 0, z, '#5E4630'); sph(1.05*s, x, 1.3*s+.85*s, z, '#6A9245', .95*s); sph(.7*s, x+.45*s, 1.3*s+1.35*s, z-.2*s, '#7FA850'); }
function bush(x, z, s){ s = s || 1; sph(.55*s, x, .4*s, z, '#5F7A3F', .4*s); }   // alas tepat di y 0 (tidak di bawah Y0)
function fence(w, d, z0, c, gate, x0){ c = c || '#E6E2D8'; x0 = x0 || 0;
  if (gate){ const sw = (w - gate) / 2; for (const s of [-1, 1]){ box(sw, .5, .1, x0 + s * (gate + sw) / 2, 0, z0, c); for (let k = 0; k <= 3; k++) box(.14, .7, .14, x0 + s * (gate / 2 + sw * k / 3), 0, z0, c); } return; }
  box(w, .5, .1, x0, 0, z0, c); for (let k = 0; k <= 6; k++) box(.14, .7, .14, x0 - w/2 + w*k/6, 0, z0, c); }
/* tapak deret (spek-gaya §4.3): bw = fx·.90, bd = fz·kd (.92), dinding belakang ,3 dari batas kavling → muka depan zf = zb + bd (halaman depan ≈ 1,1 m).
   ctx.adj.l / .r (tetangga deret, sumbu x model): sisi itu memanjang PERSIS sampai batas kavling (celah 0) dan tanpa overhang. Semua tonjolan depan (teras, tenda,
   balkon) ≤ batas kavling depan → tidak ada bagian model yang menembus trotoar/jalan. */
function tapak(fx, fz, ctx, kd){
  const LW = fx + .8, LD = fz + .8, a = (ctx && ctx.adj) || {}, bw0 = fx * .9, bd = fz * (kd || .92);
  const xl = a.l ? -LW / 2 : -bw0 / 2, xr = a.r ? LW / 2 : bw0 / 2, zb = -LD / 2 + .3, zf = zb + bd;
  return { bw: xr - xl, bd, xl, xr, cx: (xl + xr) / 2, zb, zf, zc: (zb + zf) / 2, LW, LD, l: !!a.l, r: !!a.r };
}
// lebar & pusat x atap/plat atap: overhang ov hanya di sisi TANPA tetangga deret (atap deret bersambung tanpa tumpang-tindih sebidang)
const ovX = (t, ov) => [t.bw + (t.l ? 0 : ov) + (t.r ? 0 : ov), t.cx + ((t.r ? 0 : ov) - (t.l ? 0 : ov)) / 2];
function lampPost(x, z){ cyl(.08, 3.2, x, 0, z, '#2B2B2B'); box(.7, .12, .25, x+.3, 3.15, z, '#2B2B2B'); gbox(.4, .1, .2, x+.5, 3.05, z, '#F2CF8A'); }

/* ---------------- katalog bangunan (salinan tampilan; harga final dari server) ---------------- */
const CAT = {
  rumah:{n:'Rumah Kecil', kind:'pribadi', grp:'rumah', zones:['KOTA','KAMPUNG','DESA'], w:1, h:1, cost:150, res:4, hrs:2, d:'Rumah pertama gratis.', m:(fx,fz,c,wl,F,floors,zone,gt,ctx) => {
    const t = tapak(fx, fz, ctx), H = LANTAI; box(fx*.96,.08,fz*.96,0,0,0,'#8FA462'); box(t.bw,H,t.bd,t.cx,0,t.zc,wl); const [rw, rx] = ovX(t, .5); roof(rw,2.0,t.bd+.6,rx,H,t.zc,gt);   // pelana, bubungan sejajar deret (sumbu x)
    box(.5,1.2,.5,t.cx+t.bw*.28,H+.5,t.zc-.7,'#956350'); door(t.cx, t.zf+.02, '#5A4636'); for (const s of [-1,1]){ box(1.3,1.5,.08,t.cx+s*t.bw*.3,.8,t.zf+.01,'#EDE8DC'); gbox(1.1,1.3,.1,t.cx+s*t.bw*.3,.9,t.zf+.03); }
    box(t.bw*.5,.12,1,t.cx,0,t.zf+.5,'#CFC6B4'); fence(t.LW-.4, 0, t.LD/2-.25, null, 1.4); bush(t.cx-t.bw*.36, t.zf+.55, .8); bush(t.cx+t.bw*.36, t.zf+.55, .7); }},
  rumah2:{n:'Rumah Tingkat', kind:'pribadi', grp:'rumah', zones:['KOTA','KAMPUNG','DESA'], w:1, h:1, cost:320, res:8, hrs:4, m:(fx,fz,c,wl,F,floors,zone,gt,ctx) => {
    const t = tapak(fx, fz, ctx), H = 2 * LANTAI; box(fx*.96,.08,fz*.96,0,0,0,'#8FA462'); box(t.bw,H,t.bd,t.cx,0,t.zc,wl); const [rw, rx] = ovX(t, .45); roof(rw,2.2,t.bd+.6,rx,H,t.zc,gt);
    door(t.cx, t.zf+.02, '#5A4636'); for (const s of [-1,1]){ box(1.3,1.5,.08,t.cx+s*t.bw*.3,.8,t.zf+.01,'#EDE8DC'); gbox(1.1,1.3,.1,t.cx+s*t.bw*.3,.9,t.zf+.03); } winRow(3, t.bw*.86, LANTAI+.9, t.zf+.03, 1.3, 1.0, t.cx);
    box(t.bw*.62,.16,.9,t.cx,LANTAI-.16,t.zf+.45,c); for (const x of [-t.bw*.3, t.bw*.3]) box(.1,.9,.1,t.cx+x,LANTAI,t.zf+.84,'#E6E2D8'); box(t.bw*.62,.07,.07,t.cx,LANTAI+.9,t.zf+.84,'#E6E2D8');
    fence(t.LW-.4, 0, t.LD/2-.25, null, 1.4); bush(t.cx+t.bw*.37, t.zf+.6, .8); }},
  kos:{n:'Kos-kosan', kind:'pribadi', grp:'rumah', zones:['RUKO','RUKO_KECIL','KOTA','KAMPUNG'], w:2, h:1, cost:700, res:14, jobs:1, hrs:6, m:(fx,fz,c,wl,F,floors,zone,gt,ctx) => {
    const t = tapak(fx, fz, ctx), n = clamp(floors || 2, 2, 3), H = n * LANTAI; box(fx*.97,.08,fz*.96,0,0,0,'#CFC6B8'); box(t.bw,H,t.bd,t.cx,0,t.zc,wl); const [rw, rx] = ovX(t, .15); box(rw,.35,t.bd+.3,rx,H,t.zc,gt);
    for (let f = 0; f < n; f++) winRow(6, t.bw*.86, .9+f*LANTAI, t.zf+.03, 1.2, .9, t.cx); box(t.bw,.15,.9,t.cx,LANTAI-.15,t.zf+.45,c); box(t.bw,.07,.07,t.cx,LANTAI+.85,t.zf+.86,'#E6E2D8');
    door(t.cx, t.zf+.02, '#5A4636'); cyl(.7,1.2,t.cx+t.bw*.3,H+.35,t.zc-.4,'#4C6A96'); box(2.6,.7,.12,t.cx-t.bw*.28,H-1.0,t.zf+.06,'#E6E2D8'); gbox(2.3,.45,.14,t.cx-t.bw*.28,H-.88,t.zf+.08,'#F2CF8A'); }},
  warung:{n:'Warung', kind:'pribadi', grp:'usaha', zones:['RUKO','RUKO_KECIL','KOTA','KAMPUNG','DESA'], w:1, h:1, cost:200, jobs:2, hrs:3, m:(fx,fz,c,wl,F,floors,zone,gt,ctx) => {
    const t = tapak(fx, fz, ctx, .75), H = LANTAI; box(fx*.96,.08,fz*.96,0,0,0,'#CFC6B4'); box(t.bw,H,t.bd,t.cx,0,t.zc,wl); const [rw, rx] = ovX(t, .4); roof(rw,1.0,t.bd+1.4,rx,H,t.zc+.4,'#8E3E34');
    for (let k = 0; k < 5; k++) box(t.bw/5,.16,1.7,t.cx-t.bw/2+t.bw*(k+.5)/5,2.5,t.zf+.85,k%2?'#E6E2D8':c); box(t.bw*.86,.95,.7,t.cx,0,t.zf+.4,'#8C6A48'); gbox(t.bw*.7,.5,.1,t.cx,1.4,t.zf-.1,'#F2CF8A');
    for (const x of [-1.1,0,1.1]) cyl(.22,.5,t.cx+x,0,t.zf+1.15,'#A9463A'); box(1,.9,.7,t.cx+t.bw*.36,0,t.zf+1.6,'#4C6A96'); }},
  kafe:{n:'Kafe Kopi', kind:'pribadi', grp:'usaha', zones:['CBD','RUKO','RUKO_KECIL','KOTA'], w:1, h:1, cost:300, jobs:3, hrs:4, m:(fx,fz,c,wl,F,floors,zone,gt,ctx) => {
    const t = tapak(fx, fz, ctx, .85), H = LANTAI_USAHA; box(fx*.96,.08,fz*.96,0,0,0,'#CFC6B8'); box(t.bw,H,t.bd,t.cx,0,t.zc,wl); const [rw, rx] = ovX(t, .2); box(rw,.4,t.bd+.3,rx,H,t.zc,'#3F6B62');
    box(t.bw,.12,1.2,t.cx,3.0,t.zf+.6,'#3F6B62'); gbox(t.bw*.55,2.5,.1,t.cx-t.bw*.15,.5,t.zf+.03,'#F2CF8A'); door(t.cx+t.bw*.32, t.zf+.02, '#4E3C2E'); box(t.bw*.6,.6,.12,t.cx,3.3,t.zf+.07,'#4E3C2E'); gbox(t.bw*.5,.4,.12,t.cx,3.4,t.zf+.1,'#F2CF8A');
    for (const x of [-1.6,1.6]){ cyl(.4,.75,t.cx+x,0,t.zf+.75,'#6B5546'); cyl(.05,1.5,t.cx+x,.75,t.zf+.75,'#2B2B2B'); cone(.75,.45,t.cx+x,2.2,t.zf+.75,c); } }},
  toko:{n:'Toko Kelontong', kind:'pribadi', grp:'usaha', zones:['CBD','RUKO','RUKO_KECIL','KOTA','KAMPUNG'], w:2, h:1, cost:450, jobs:4, hrs:6, m:(fx,fz,c,wl,F,floors,zone,gt,ctx) => {
    const t = tapak(fx, fz, ctx), n = clamp(floors || 1, 1, 4), H = LANTAI_USAHA + (n - 1) * LANTAI; box(fx*.97,.08,fz*.96,0,0,0,'#CFC6B8'); box(t.bw,H,t.bd,t.cx,0,t.zc,wl); const [rw, rx] = ovX(t, .15); box(rw,.3,t.bd+.3,rx,H,t.zc,'#C9C1B2');
    box(t.bw,.9,.2,t.cx,3.3,t.zf+.02,c); gbox(t.bw*.7,.5,.1,t.cx,3.5,t.zf+.14,'#F2CF8A'); gbox(t.bw*.75,2.5,.1,t.cx,.5,t.zf+.02,'#C9D6E0'); for (let f = 1; f < n; f++) winRow(4, t.bw*.8, LANTAI_USAHA+(f-1)*LANTAI+.9, t.zf+.03, 1.4, 1.1, t.cx);
    for (let k = 0; k < 6; k++) box(t.bw/6,.14,1.0,t.cx-t.bw/2+t.bw*(k+.5)/6,3.0,t.zf+.5,k%2?'#E6E2D8':c); box(1.2,.5,.6,t.cx-t.bw*.35,0,t.zf+.7,'#C2913A'); box(1.2,.5,.6,t.cx+t.bw*.35,0,t.zf+.7,'#4F7A55'); }},
  bengkel:{n:'Bengkel', kind:'pribadi', grp:'usaha', zones:['RUKO','RUKO_KECIL','KAMPUNG'], w:2, h:1, cost:500, jobs:4, hrs:6, m:(fx,fz,c,wl) => {
    const bw = fx*.82, bd = fz*.62; box(fx*.97,.08,fz*.96,0,0,0,'#9BA0A6'); box(bw,4.2,bd,0,0,-.2,'#BFC7CC'); roof(bw*1.05,1.1,bd*1.15,0,4.2,-.2,'#6E7F8A');
    for (const x of [-bw*.22, bw*.22]){ box(bw*.36,3,.1,x,0,bd/2-.13,'#5E666C'); for (let k = 0; k < 6; k++) box(bw*.36,.05,.12,x,.35+k*.45,bd/2-.08,'#8A939A'); }
    box(bw*.5,.7,.15,0,3.3,bd/2-.1,c); for (let k = 0; k < 3; k++) cyl(.45,.3,bw*.47,k*.3,bd/2+.9,'#2B2F33'); }},
  sawah:{n:'Sawah', kind:'pribadi', grp:'usaha', zones:['DESA','KAMPUNG'], w:2, h:1, cost:120, jobs:2, hrs:2, m:(fx,fz,c,wl,F,floors,zone,gt) => {
    box(fx*.96,.1,fz*.92,0,0,0,'#7EAF4F'); for (let k = 0; k < 5; k++){ box(fx*.88,.3,.55,0,.1,-fz*.36+k*fz*.18,'#9DC25B'); box(fx*.88,.06,.25,0,.1,-fz*.27+k*fz*.18,'#B8D9D4'); }
    box(1.6,1.2,1.6,fx*.4,0,fz*.25,'#C9A86A'); roof(2.1,1,2.1,fx*.4,1.2,fz*.25,gt); cyl(.06,1.7,-fx*.3,.2,0,'#5E4630'); box(1,.08,.08,-fx*.3,1.5,0,'#5E4630'); sph(.22,-fx*.3,2,0,'#C9A86A'); cone(.4,.3,-fx*.3,2.15,0,'#C9A86A'); }},
  kantor:{n:'Kantor', kind:'pribadi', grp:'usaha', zones:['CBD','RUKO'], w:2, h:2, cost:1200, jobs:12, req:'Pengusaha', hrs:12, m:(fx,fz,c,wl,F,floors) => {
    const bw = fx*.56, bd = fz*.56, n = clamp(floors || 6, 3, 8), H = LANTAI_USAHA + n * LANTAI; box(fx*.96,.1,fz*.96,0,0,0,'#CFC6B8'); box(bw*1.3,LANTAI_USAHA,bd*1.3,0,0,0,'#DDD9CE'); gbox(bw*1.2,2.6,.1,0,.5,bd*.65+.01,'#C9D6E0'); door(0, bd*.65+.02, '#2B2F33', 1.8, 2.4);
    for (let f = 0; f < n; f++){ const y = LANTAI_USAHA + f*LANTAI; box(bw,.5,bd,0,y,0,'#DDD9CE'); G.push({g:'box', s:[bw-.05,LANTAI-.5,bd-.05], p:[0,y+.5+(LANTAI-.5)/2,0], c:'#C9D6E0'}); }
    box(bw*.6,1.4,bd*.6,0,H,0,c); cyl(.1,2.5,bw*.2,H+1.4,0,'#8A939A'); gsph(.2,bw*.2,H+4,0,'#B4443A'); }},
  taman:{n:'Taman', kind:'umum', grp:'umum', zones:['CBD','RUKO','RUKO_KECIL','KOTA','KAMPUNG','DESA'], w:1, h:1, cost:300, hrs:6, prop:1, d:'Menambah kepuasan rumah di sekitarnya.', m:(fx,fz) => {
    box(fx*.96,.12,fz*.96,0,0,0,'#8FA462'); box(fx*.96,.14,.9,0,0,0,'#C9C1B2'); box(.9,.14,fz*.96,0,0,0,'#C9C1B2'); cyl(1.15,.45,0,.1,0,'#C9C1B2'); cyl(.85,.5,0,.1,0,'#7F93A6'); cyl(.12,1,0,.5,0,'#C9C1B2');
    tree(-fx*.3,-fz*.3,.75); tree(fx*.3,fz*.3,.75); tree(fx*.3,-fz*.3,.6,'palm'); for (const s of [-1,1]){ box(1.2,.35,.4,-fx*.3,.3,fz*.22*s,'#7A5A3A'); } bush(-fx*.33,fz*.33); lampPost(fx*.15,-fz*.15); }},
  lapangan:{n:'Tanah Lapang', kind:'umum', grp:'umum', zones:['RUKO','RUKO_KECIL','KOTA','KAMPUNG','DESA'], w:2, h:2, cost:600, hrs:8, prop:1, m:(fx,fz) => {
    box(fx*.96,.1,fz*.96,0,0,0,'#8FA462'); box(fx*.8,.12,fz*.7,0,0,0,'#7F9455'); box(fx*.8,.14,.12,0,0,0,'#E6E2D8'); cyl(1.6,.13,0,.01,0,'#E6E2D8'); cyl(1.45,.14,0,.01,0,'#7F9455');
    for (const s of [-1,1]){ box(.12,1.6,2.6,s*fx*.4,0,0,'#E6E2D8'); box(.12,.12,2.6,s*fx*.4,1.6,0,'#E6E2D8'); } tree(-fx*.4,-fz*.4,.8); tree(fx*.4,fz*.4,.8,'palm'); box(3,.5,1,0,0,-fz*.42,'#4C6A96'); }},
  sekolah:{n:'Sekolah', kind:'umum', grp:'umum', zones:['RUKO','RUKO_KECIL','KOTA','KAMPUNG','DESA'], w:2, h:2, cost:1500, jobs:6, jobProf:'Guru', hrs:24, prop:1, m:(fx,fz) => {
    const bw = fx*.8, bd = fz*.36, z0 = -fz*.2, H = 2 * LANTAI; box(fx*.96,.12,fz*.96,0,0,0,'#C9BFA6'); box(bw,H,bd,0,0,z0,'#E2D6B8'); roof(bw*1.06,2.6,bd*1.35,0,H,z0,'#9C4935');
    for (const s of [-1,1]){ box(bd,LANTAI+.6,fz*.36,s*(bw/2-bd/2),0,fz*.08,'#E2D6B8'); roof(bd*1.3,1.8,fz*.4,s*(bw/2-bd/2),LANTAI+.6,fz*.08,'#9C4935',Math.PI/2); }
    winRow(6, bw*.84, .9, z0+bd/2+.02, 1.3, 1.0); winRow(6, bw*.84, LANTAI+.9, z0+bd/2+.02, 1.3, 1.0); door(0, z0+bd/2+.02, '#5A4636', 1.6, 2.3); flag(0,0,fz*.32,7.5); box(3,.12,3,0,0,fz*.32,'#C9BFA6'); }},
  rs:{n:'Rumah Sakit', kind:'umum', grp:'umum', zones:['CBD','RUKO','RUKO_KECIL','KOTA','KAMPUNG'], w:2, h:2, cost:2000, jobs:8, jobProf:'Dokter', hrs:36, prop:1, m:(fx,fz,c,wl,F,floors) => {
    const bw = fx*.7, bd = fz*.48, z0 = -fz*.12, n = clamp(floors || 3, 3, 5), H = LANTAI_USAHA + (n - 1) * LANTAI; box(fx*.96,.12,fz*.96,0,0,0,'#CFC6B8'); box(bw,H,bd,0,0,z0,'#DDD9CE'); box(bw+.15,.6,bd+.15,0,LANTAI_USAHA-.3,z0,'#4C6A96');
    for (let f = 0; f < n; f++) winRow(5, bw*.86, f ? LANTAI_USAHA+(f-1)*LANTAI+.9 : 1.1, z0+bd/2+.02, f ? 1.3 : 2.0, 1.1); box(.7,3,.24,0,H-4,z0+bd/2+.12,'#A9463A'); box(3,.7,.24,0,H-2.85,z0+bd/2+.12,'#A9463A');
    gbox(.5,2.6,.1,0,H-3.8,z0+bd/2+.26,'#B4443A'); cyl(2,.2,0,H,z0,'#5E666C'); box(.9,.05,.2,0,H+.21,z0,'#E6E2D8'); box(bw*.5,LANTAI,2,0,0,fz*.3,'#DDD9CE'); box(2.4,1.3,1.3,fx*.3,0,fz*.38,'#E6E2D8'); box(2.4,.25,1.32,fx*.3,.7,fz*.38,'#A9463A'); }},
  polisi:{n:'Kantor Polisi', kind:'umum', grp:'umum', zones:['CBD','RUKO','RUKO_KECIL','KOTA','KAMPUNG','DESA'], w:2, h:1, cost:1200, jobs:6, jobProf:'Polisi', hrs:24, prop:1, m:(fx,fz) => {
    const bw = fx*.84, bd = fz*.6; box(fx*.97,.1,fz*.96,0,0,0,'#C9C1B2'); box(bw,4.6,bd,0,0,-.2,'#D8CBB2'); box(bw+.3,.35,bd+.3,0,4.6,-.2,'#2B3A67');
    winRow(5, bw*.86, 1.9, bd/2-.18, .9, .9); door(0, bd/2-.18, '#2B3A67', 1.4, 2); gbox(.8,.35,.5,-.5,4.95,-.2,'#B4443A'); gbox(.8,.35,.5,.5,4.95,-.2,'#4C6A96'); box(bw*.45,.6,.14,0,3.55,bd/2-.12,'#E6E2D8');
    box(2.3,1,1.1,bw*.3,0,fz*.38,'#E6E2D8'); box(2.3,.25,1.12,bw*.3,.55,fz*.38,'#2B3A67'); }},
  penjara:{n:'Penjara', kind:'umum', grp:'umum', zones:['KAMPUNG','DESA','RUKO_KECIL'], w:2, h:1, cost:1000, jobs:2, hrs:24, prop:1, m:(fx,fz) => {
    const bw = fx*.9, bd = fz*.86; box(bw,3,.5,0,0,bd/2,'#8E979C'); box(bw,3,.5,0,0,-bd/2,'#8E979C'); box(.5,3,bd,bw/2,0,0,'#8E979C'); box(.5,3,bd,-bw/2,0,0,'#8E979C');
    box(bw*.5,3.8,bd*.45,0,0,0,'#BFC7CC'); for (let k = 0; k < 7; k++) box(.12,1.6,.1,-1.8+k*.6,1,bd*.225+.02,'#2B2B2B'); cyl(.8,6,bw/2-.5,0,-bd/2+.5,'#8E979C'); box(2,1.2,2,bw/2-.5,6,-bd/2+.5,'#5E666C'); gsph(.25,bw/2-.5,7.4,-bd/2+.5,'#F2CF8A'); }},
  pasar:{n:'Pasar Rakyat', kind:'umum', grp:'umum', zones:['CBD','RUKO','RUKO_KECIL'], w:2, h:2, cost:1000, jobs:4, hrs:24, prop:1, m:(fx,fz) => {
    box(fx*.96,.12,fz*.96,0,0,0,'#C6B898'); const cs = ['#A9463A','#4F7A55','#C2913A','#4C6A96']; let k = 0;
    for (const x of [-fx*.24, fx*.24]) for (const z of [-fz*.24, fz*.24]){ box(2.8,.9,2.8,x,0,z,'#8C6A48'); for (const a of [-1.2,1.2]) for (const b of [-1.2,1.2]) box(.15,1.6,.15,x+a,.9,z+b,'#5A4636'); pyr(3.8,1.3,3.8,x,2.5,z,cs[k++%4]); for (let q = 0; q < 3; q++) sph(.3,x-.8+q*.8,1.05,z+.9,['#B8922E','#A9463A','#7FA850'][q]); gsph(.15,x,2.35,z,'#F2CF8A'); } }},
  ibadah:{n:'Tempat Ibadah', kind:'umum', grp:'umum', zones:['RUKO','RUKO_KECIL','KOTA','KAMPUNG','DESA'], w:2, h:1, cost:800, hrs:18, prop:1, m:(fx,fz) => {
    box(fx*.96,.12,fz*.92,0,0,0,'#CFC6B8'); box(fx*.34,3.8,fz*.6,-fx*.22,0,0,'#E3DED2'); sph(fz*.25,-fx*.22,3.8,0,'#4F7A55'); box(.16,1,.16,-fx*.22,3.8+fz*.25,0,'#C2913A');
    cyl(.5,7.5,-fx*.44,0,-fz*.3,'#E3DED2'); cone(.7,1.4,-fx*.44,7.5,-fz*.3,'#4F7A55'); box(fx*.18,3.2,fz*.4,fx*.05,0,0,'#E3DED2'); roof(fx*.2,1.6,fz*.46,fx*.05,3.2,0,'#8E3E34',Math.PI/2); box(.12,1.8,.12,fx*.05,4.8,0,'#C2913A'); box(.8,.12,.12,fx*.05,5.9,0,'#C2913A');
    box(fx*.2,2.4,fz*.4,fx*.34,0,0,'#C9A86A'); pyr(fx*.3,1,fz*.55,fx*.34,2.4,0,'#8E3E34'); pyr(fx*.22,.9,fz*.4,fx*.34,3.2,0,'#8E3E34'); winRow(3, fx*.25, 1.2, fz*.3+.01); }},
  pln:{n:'Gardu PLN', kind:'umum', grp:'umum', zones:['KAMPUNG','DESA','KOTA','RUKO_KECIL'], w:1, h:1, cost:600, jobs:2, hrs:12, prop:1, m:(fx,fz) => {
    box(fx*.96,.12,fz*.96,0,0,0,'#9E9A90'); for (const a of [-.9,.9]) for (const b of [-.9,.9]) box(.18,10,.18,a,0,b,'#8A939A'); for (let k = 1; k < 5; k++) box(2,.14,2,0,k*2.2,0,'#8A939A');
    box(4.4,.18,.18,0,9.4,0,'#8A939A'); for (const x of [-2,2]) gsph(.18,x,9.2,0,'#C9D6E0'); box(2,1.6,1.4,-fx*.25,0,fz*.28,'#5E666C'); box(.8,.5,.06,-fx*.25,.9,fz*.28+.72,'#C2913A'); }},
  stadion:{n:'Stadion', kind:'umum', grp:'umum', zones:['KOTA','KAMPUNG','RUKO','RUKO_KECIL'], w:4, h:2, cost:3500, jobs:10, hrs:48, prop:1, m:(fx,fz) => {
    box(fx*.96,.1,fz*.92,0,0,0,'#C9C1B2'); box(fx*.78,.15,fz*.58,0,0,0,'#7F9455'); for (let k = 0; k < 6; k++) box(fx*.78/6,.16,fz*.58,-fx*.39+fx*.78/12+k*fx*.78/6,0,0,k%2?'#7F9455':'#8FA462'); box(.15,.17,fz*.58,0,0,0,'#E6E2D8');
    for (let r = 0; r < 3; r++){ box(fx*.86,1.2,1,0,r*1.1,fz*.33+r*.6,['#A9463A','#8E3E34','#A9463A'][r]); box(fx*.86,1.2,1,0,r*1.1,-fz*.33-r*.6,['#4F7A55','#3F6B62','#4F7A55'][r]); }
    box(1.6,3,fz*.62,fx*.45,0,0,'#E6E2D8'); box(1.6,3,fz*.62,-fx*.45,0,0,'#E6E2D8'); for (const a of [-1,1]) for (const b of [-1,1]){ cyl(.18,10,a*fx*.46,0,b*fz*.44,'#8A939A'); gbox(1.6,.9,.4,a*fx*.46,10,b*fz*.44,'#F2CF8A'); } }},
  istana:{n:'Istana Negara', kind:'umum', grp:'umum', zones:['CBD'], w:2, h:2, cost:4000, jobs:6, hrs:72, prop:1, m:(fx,fz) => {
    const bw = fx*.84, bd = fz*.4, z0 = -fz*.12; box(fx*.96,.12,fz*.96,0,0,0,'#CFC6B8'); box(bw,6,bd,0,0,z0,'#E6E2D8'); for (let k = 0; k < 8; k++) cyl(.3,5,-bw*.42+k*bw*.12,0,z0+bd/2+.9,'#E3DED2');
    box(bw*.98,.5,1.7,0,5,z0+bd/2+.9,'#E3DED2'); roof(bw*.6,1.7,1.9,0,5.5,z0+bd/2+.9,'#E3DED2'); sph(2.6,0,6.6,z0,'#C2913A'); cyl(.12,1,0,9,z0,'#C2913A'); winRow(6, bw*.86, 1.3, z0+bd/2+.02, 1.6, .7); winRow(6, bw*.86, 3.6, z0+bd/2+.02, 1, .7);
    flag(0,9.9,z0,3.2); box(fx*.3,.13,fz*.32,0,0,fz*.33,'#CFC3AE'); for (const s of [-1,1]){ bush(s*fx*.3,fz*.32,1.1); tree(s*fx*.42,fz*.42,.7,'palm'); } }},
  tugu:{n:'Alun-alun Tugu Kuda', kind:'umum', grp:'umum', zones:['CBD'], w:2, h:2, cost:900, hrs:12, prop:1, m:(fx,fz) => {
    box(fx*.96,.12,fz*.96,0,0,0,'#CFC6B8'); cyl(fx*.36,.2,0,.12,0,'#CFC3AE'); cyl(fx*.3,.26,0,.12,0,'#8FA462'); box(2.8,1.5,2.8,0,.3,0,'#CFC3AE'); box(2.2,.3,2.2,0,1.8,0,'#C6B898');
    box(1.1,1,2.6,0,2.9,0,'#B98C6E'); for (const a of [-.35,.35]) for (const b of [-.95,.95]) box(.24,1,.24,a,2,b,'#B98C6E'); box(.55,1.3,.7,0,3.6,1.25,'#B98C6E'); box(.45,.5,.9,0,4.7,1.6,'#B98C6E'); box(.15,.9,.15,0,3.5,-1.35,'#7A5A3A');
    for (const a of [-1,1]) for (const b of [-1,1]){ tree(a*fx*.4,b*fz*.4,.8); lampPost(a*fx*.25,b*fz*.25); } flag(fx*.38,0,0,7); }},
  mulyo:{n:'Rumah Pak Mulyo', kind:'negara', grp:'none', zones:['CBD','RUKO','KOTA'], w:2, h:2, cost:0, m:(fx,fz) => {
    const bw = fx*.62, bd = fz*.44, z0 = -fz*.1; box(fx*.96,.12,fz*.96,0,0,0,'#C9BFA6'); box(bw,4.8,bd,0,0,z0,'#E3DED2'); roof(bw*1.22,2.8,bd*1.35,0,4.8,z0,'#9C4935');
    for (const x of [-bw*.3, 0, bw*.3]) cyl(.25,3,x,0,z0+bd/2+1,'#E6E2D8'); box(bw*.8,.3,2.2,0,3,z0+bd/2+1,'#9C4935'); winRow(4, bw*.86, 1.6, z0+bd/2+.02, 1.1, .8); door(0, z0+bd/2+.02, '#5A4636', 1.4, 2.2);
    flag(fx*.36,0,fz*.3,8); tree(-fx*.36,fz*.3,.8); fence(fx*.94, fz*.94, fz*.47, '#E6E2D8'); bush(fx*.15,fz*.38); bush(-fx*.15,fz*.38); }},
  posko:{n:'Posko Tukang', kind:'negara', grp:'none', zones:['CBD','RUKO','RUKO_KECIL','KOTA','KAMPUNG','DESA'], w:1, h:1, cost:0, m:(fx,fz) => {
    box(fx*.96,.1,fz*.96,0,0,0,'#C6B898'); for (const a of [-1.3,1.3]) for (const b of [-1.3,1.3]) cyl(.08,2.2,a,0,b,'#8A939A'); roof(3.4,1.4,3.4,0,2.2,0,'#A8553B'); box(2.2,.8,1,0,0,0,'#8C6A48'); for (const x of [-.8,.8]) cyl(.25,.45,x,0,1,'#4C6A96'); box(.9,.9,.9,fx*.35,0,-fz*.3,'#C2913A'); gsph(.18,0,2.1,0,'#F2CF8A'); }},
  bank:{n:'Bank Negara', kind:'negara', grp:'none', zones:['CBD'], w:2, h:1, cost:0, jobs:4, m:(fx,fz,c,wl,F,floors,zone,gt,ctx) => {
    const t = tapak(fx, fz, ctx, .8), H = LANTAI_USAHA + LANTAI; box(fx*.97,.12,fz*.96,0,0,0,'#CFC6B8'); box(t.bw,H,t.bd,t.cx,0,t.zc,'#E2D6B8'); for (let k = 0; k < 6; k++) cyl(.28,3.8,t.cx-t.bw*.4+k*t.bw*.16,0,t.zf+.9,'#E6E2D8');
    box(t.bw,.5,1.6,t.cx,3.8,t.zf+.8,'#E6E2D8'); roof(t.bw,1.3,1.7,t.cx,4.3,t.zf+.8,'#E6E2D8'); const [rw, rx] = ovX(t, .15); box(rw,.4,t.bd+.3,rx,H,t.zc,'#C2913A'); winRow(5, t.bw*.86, LANTAI_USAHA+.9, t.zf+.03, 1.3, 1.0, t.cx);
    gbox(2,.4,.1,t.cx,3.95,t.zf+1.66,'#F2CF8A'); door(t.cx, t.zf+.02, '#5A4636', 1.4, 2.4); }},
  barak:{n:'Barak TNI', kind:'negara', grp:'none', zones:['KAMPUNG','DESA','RUKO_KECIL'], w:2, h:2, cost:0, jobs:6, m:(fx,fz) => {
    box(fx*.96,.12,fz*.96,0,0,0,'#8E9A78'); for (const z of [-fz*.25, fz*.12]){ box(fx*.6,2.6,fz*.24,-fx*.12,0,z,'#8C8F6A'); roof(fx*.64,1.2,fz*.3,-fx*.12,2.6,z,'#6B7A4A'); winRow(5, fx*.5, 1, z+fz*.12+.02, .7, .7); }
    for (const a of [-.9,.9]) for (const b of [-.9,.9]) box(.2,6,.2,fx*.34+a,0,fz*.3+b,'#5E4630'); box(2.4,1.6,2.4,fx*.34,6,fz*.3,'#8C8F6A'); pyr(3,1,3,fx*.34,7.6,fz*.3,'#6B7A4A'); gsph(.2,fx*.34,7.2,fz*.3+1.2,'#F2CF8A'); flag(fx*.4,0,-fz*.36,7); }},
  waduk:{n:'Bendungan & Sungai', kind:'negara', grp:'none', zones:['KAMPUNG','DESA','RUKO_KECIL'], w:2, h:2, cost:0, m:(fx,fz) => {
    box(fx*.96,.1,fz*.96,0,0,0,'#8FA462'); box(fx*.9,.3,fz*.55,0,0,-fz*.15,'#7F93A6'); box(fx*.94,2.2,1.4,0,0,fz*.16,'#C9C1B2'); box(fx*.94,.3,1.8,0,2.2,fz*.16,'#9E9A90');
    for (let k = 0; k < 4; k++) box(1,.9,.2,-fx*.3+k*fx*.2,.3,fz*.16+.8,'#7F93A6'); box(fx*.9,.3,fz*.22,0,0,fz*.38,'#6B7E92'); tree(-fx*.38,-fz*.38,.8,'palm'); tree(fx*.38,-fz*.38,.8); }},
  apartemen:{n:'Apartemen Netizenia', kind:'negara', grp:'none', zones:['CBD'], w:2, h:2, cost:0, jobs:2, m:(fx,fz,c,wl,F,floors) => {
    const bw = fx*.5, bd = fz*.5, n = clamp(floors || 9, 5, 9), H = n * LANTAI; box(fx*.96,.12,fz*.96,0,0,0,'#CFC6B8'); box(bw,H,bd,-fx*.18,0,-fz*.18,'#DDD0B4'); door(-fx*.18, -fz*.18+bd/2+.02, '#2B2F33', 1.6, 2.3);
    for (let f = 0; f < n; f++){ winRow(4, bw*.84, .9+f*LANTAI, -fz*.18+bd/2+.02, 1.4, .9, -fx*.18); if (f) box(bw*.9,.15,.8,-fx*.18,f*LANTAI-.15,-fz*.18+bd/2+.4,'#C9BBA2'); }
    box(bw+.4,.4,bd+.4,-fx*.18,H,-fz*.18,'#8E3E34'); box(fx*.34,.3,fz*.3,fx*.25,0,fz*.25,'#E6E2D8'); box(fx*.3,.32,fz*.26,fx*.25,0,fz*.25,'#7F93A6'); for (let k = 0; k < 3; k++) box(1.8,1.4,4.3,fx*.06+k*2.4,0,fz*.38,['#A9463A','#4C6A96','#E5E1D8'][k]); }},
  pabrik:{n:'Pabrik & Bengkel', kind:'negara', grp:'none', zones:['KAMPUNG','DESA','RUKO_KECIL','RUKO'], w:2, h:2, cost:0, jobs:8, m:(fx,fz) => {
    box(fx*.96,.12,fz*.96,0,0,0,'#9BA0A6'); box(fx*.8,4,fz*.5,0,0,-fz*.12,'#BFC7CC'); for (let k = 0; k < 4; k++) roof(fz*.5,1.4,fx*.2,-fx*.3+k*fx*.2,4,-fz*.12,'#8A939A',Math.PI/2);   // ry π/2: ukuran lokal x ↔ z ditukar (gigi gergaji fx·,2 lebar, fz·,5 dalam)
    for (const x of [fx*.3, fx*.18]){ cyl(.5,9,x,0,-fz*.36,'#A8553B'); box(1.1,.3,1.1,x,8.4,-fz*.36,'#E6E2D8'); } winRow(6, fx*.7, 1.6, -fz*.12+fz*.25+.02, 1, .9); box(fx*.3,2.8,.1,-fx*.2,0,-fz*.12+fz*.25+.03,'#5E666C');
    box(2.3,1,4.4,fx*.25,0,fz*.3,'#4C6A96'); box(2.3,.9,1.6,fx*.25,1,fz*.3+1.2,'#C9D6E0'); }},
  pkl:{n:'Zona PKL', kind:'negara', grp:'none', zones:['RUKO','RUKO_KECIL'], w:2, h:1, cost:0, m:(fx,fz) => {
    box(fx*.96,.1,fz*.9,0,0,0,'#CFC6B4'); const cs = ['#A9463A','#C2913A','#4F7A55','#4C6A96']; for (let k = 0; k < 4; k++){ const x = -fx*.36 + k*fx*.24; box(1.5,1,.9,x,.35,0,'#8C6A48'); cyl(.3,.1,x-.5,0,.5,'#1E1C1A'); cyl(.3,.1,x+.5,0,.5,'#1E1C1A'); cyl(.05,1.6,x,1.35,0,'#2B2B2B'); cone(1.1,.5,x,2.9,0,cs[k]); gsph(.12,x,2.8,0,'#F2CF8A'); } }},
  /* ---- tipe baru v3 (model sederhana sementara; pemodelan detail oleh tim lain). Tanda tangan: m(fx,fz,c,wl,F,floors,zone,gt) — c = AKSEN pemilik, wl = WALLS, gt = GENTENG ---- */
  ruko:{n:'Ruko', kind:'pribadi', grp:'usaha', zones:['CBD','RUKO','RUKO_KECIL'], w:1, h:1, cost:600, jobs:4, hrs:8, d:'Rumah toko 2–4 lantai di muka jalan utama.', m:(fx,fz,c,wl,F,floors,zone,gt,ctx) => {
    floors = clamp(floors || 3, 2, 4); const t = tapak(fx, fz, ctx), H = LANTAI_USAHA + (floors - 1) * LANTAI, zf = t.zf; box(t.bw,H,t.bd,t.cx,0,t.zc,wl); const [rw, rx] = ovX(t, .05); box(rw,.3,t.bd+.1,rx,H,t.zc,'#8E979C'); box(1.4,1,1.2,t.cx-t.bw*.25,H+.3,t.zc-.4,'#4C6A96');
    box(t.bw*.86,2.8,.1,t.cx,.3,zf-.04,'#5E666C'); for (let k = 0; k < 8; k++) box(t.bw*.86,.05,.12,t.cx,.5+k*.33,zf,'#8A939A'); gbox(t.bw*.8,1.2,.1,t.cx,.9,zf+.02,'#F2CF8A');
    box(t.bw*.9,.6,.14,t.cx,3.4,zf+.06,c); gbox(t.bw*.75,.32,.1,t.cx,3.52,zf+.16,'#F2CF8A'); box(t.bw,.14,1.0,t.cx,3.1,zf+.5,c);
    for (let f = 1; f < floors; f++) winRow(2, t.bw*.8, LANTAI_USAHA+(f-1)*LANTAI+.9, zf+.03, 1.3, 1.1, t.cx); box(t.bw*.3,.12,.6,t.cx,0,zf+.5,'#C9BFA6'); }},
  kebun:{n:'Kebun', kind:'pribadi', grp:'usaha', zones:['DESA'], w:1, h:1, cost:90, jobs:1, hrs:2, d:'Kebun sayur & pisang di desa.', m:(fx,fz) => {
    box(fx*.96,.1,fz*.94,0,0,0,'#7A5A3A'); for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) sph(.32,-fx*.33+k*fx*.22,.32,-fz*.3+r*fz*.2,r%2?'#5F7A3F':'#7E9452',.26);
    tree(fx*.36,fz*.34,.55,'palm'); tree(-fx*.38,-fz*.36,.5,'palm'); for (let k = 0; k < 4; k++) cyl(.05,.9,-fx*.4+k*fx*.27,0,fz*.45,'#8C6A48'); }},
  terminal:{n:'Terminal Angkot', kind:'umum', grp:'umum', zones:['CBD'], w:4, h:2, cost:2500, jobs:8, hrs:36, prop:1, m:(fx,fz,c,wl,F,floors,zone,gt) => {
    box(fx*.96,.1,fz*.96,0,0,0,'#9BA0A6'); const bw = fx*.7, bd = fz*.42; for (const a of [-.42,-.14,.14,.42]) for (const b of [-.4,.4]) cyl(.14,4.2,a*bw,0,b*bd-fz*.1,'#8A939A');
    box(bw+1,.35,bd+1,0,4.2,-fz*.1,gt); box(bw*.4,3,bd*.6,-bw*.25,0,-fz*.1,'#E2D6B8'); winRow(3, bw*.36, 1.3, -fz*.1+bd*.3+.02); door(-bw*.25,-fz*.1+bd*.3+.02,'#5A4636',1.2,2);
    for (let k = 0; k < 6; k++) box(fx*.14,.06,.3,-fx*.36+k*fx*.145,.1,fz*.2,'#D9C56A'); const cs = ['#3C6FA8','#3F8A5E','#C2913A']; for (let k = 0; k < 3; k++){ const x = -fx*.3+k*fx*.3; box(2.2,2,4.6,x,0,fz*.22,cs[k]); box(2.24,.6,3.4,x,1.4,fz*.2,'#6A7F95'); }
    box(fx*.5,.6,.14,0,4.6,-fz*.1+bd/2+.5,'#4C6A96'); gbox(fx*.42,.34,.1,0,4.72,-fz*.1+bd/2+.58,'#F2CF8A'); lampPost(fx*.44,fz*.4); lampPost(-fx*.44,fz*.4); }},
  pangkalan:{n:'Pangkalan Ojek & Angkot', kind:'umum', grp:'umum', zones:['RUKO','RUKO_KECIL','KAMPUNG'], w:2, h:1, cost:400, jobs:2, hrs:8, prop:1, m:(fx,fz,c,wl,F,floors,zone,gt) => {
    box(fx*.96,.1,fz*.92,0,0,0,'#CFC6B4'); for (const a of [-1.4,1.4]) for (const b of [-1,1]) cyl(.08,2.6,-fx*.25+a,0,b,'#8A939A'); roof(3.6,1.1,2.8,-fx*.25,2.6,0,gt); box(2.6,.5,.8,-fx*.25,.45,.3,'#8C6A48');
    for (let k = 0; k < 3; k++){ const x = fx*.1+k*1.1; box(.5,.6,1.9,x,.4,fz*.1,'#2B2F33'); cyl(.36,.18,x,.02,fz*.1+.7,'#1E1C1A'); cyl(.36,.18,x,.02,fz*.1-.7,'#1E1C1A'); } box(1.4,.5,.1,-fx*.25,2.65,1.45,'#4F7A55'); gbox(1.2,.3,.08,-fx*.25,2.75,1.52,'#F2CF8A'); }},
  proyek_gedung:{n:'Proyek Gedung Negara', kind:'negara', grp:'none', zones:['CBD','RUKO'], w:2, h:2, cost:0, jobs:3, d:'Negara sedang membangun.', m:(fx,fz,c,wl,F) => {
    box(fx*.96,.1,fz*.96,0,0,0,'#C9C1B2'); const bw = fx*.8, bd = fz*.7; box(bw,.6,bd,0,0,0,'#9E9A90');
    for (const a of [-.42,0,.42]) for (const b of [-.4,.4]) box(.5,6.5,.5,a*bw,.6,b*bd,'#9E9A90'); box(bw,.35,bd,0,3.6,0,'#9E9A90'); box(bw*.6,2.6,.3,-bw*.2,.6,bd/2-.2,'#956350');
    for (let k = 0; k < 6; k++) cyl(.04,7.4,-bw*.44+k*bw*.176,.6,bd/2+.6,'#C9A86A'); for (let y = 2.2; y < 7.5; y += 2.4) box(bw*.9,.08,.08,0,y,bd/2+.6,'#C9A86A');
    box(1.4,.9,1.4,bw*.35,.95,-bd*.1,'#956350'); cone(1.1,.9,-bw*.35,.95,-bd*.1,'#D3C293'); }},
  proyek_rumah:{n:'Proyek Rumah Negara', kind:'negara', grp:'none', zones:['KAMPUNG','KOTA','DESA'], w:1, h:1, cost:0, jobs:2, d:'Negara sedang membangun.', m:(fx,fz) => {
    box(fx*.96,.08,fz*.96,0,0,0,'#C9BFA6'); const bw = fx*.66, bd = fz*.6; box(bw,.4,bd,0,0,-.2,'#9E9A90'); box(bw,2.2,bd,0,.4,-.2,'#956350'); for (const a of [-.5,.5]) for (const b of [-.5,.5]) cyl(.05,3.6,a*bw,.4,b*bd-.2,'#8A939A');
    for (const a of [-.58,.58]) for (const b of [-.5,.55]) cyl(.05,4,a*bw,0,b*bd,'#C9A86A'); for (let y = 1.3; y < 4; y += 1.2){ box(bw*1.2,.08,.08,0,y,bd*.55,'#C9A86A'); box(bw*1.2,.08,.08,0,y,-bd*.5,'#C9A86A'); }
    box(1,.6,1,fx*.33,0,fz*.3,'#956350'); cone(.7,.6,-fx*.33,0,fz*.3,'#D3C293'); }},
  lahan_material:{n:'Lahan Material', kind:'negara', grp:'none', zones:['RUKO','RUKO_KECIL','KOTA','KAMPUNG','DESA'], w:1, h:1, cost:0, d:'Tumpukan bahan bangunan negara.', m:(fx,fz) => {
    box(fx*.96,.08,fz*.96,0,0,0,'#C9BFA6'); for (const s of [-1,1]){ box(fx*.9,1.8,.08,0,0,s*fz*.44,'#8E979C'); box(.08,1.8,fz*.9,s*fx*.44,0,0,'#8E979C'); }
    for (let k = 0; k < 3; k++) box(1.2,.5+k*.3,1.1,-fx*.25+k*.3,0,-fz*.2,'#956350'); cone(1.2,1,fx*.22,0,-fz*.18,'#D3C293'); cone(.9,.7,fx*.1,0,fz*.25,'#9BA0A6'); for (let k = 0; k < 5; k++) cyl(.06,2.6,-fx*.3+k*.2,.2,fz*.3,'#5E666C');
    box(.08,1.6,.08,fx*.3,0,fz*.42,'#5E666C'); box(.08,1.6,.08,fx*.3+1.2,0,fz*.42,'#5E666C'); box(1.4,.9,.06,fx*.3+.6,1.4,fz*.42,'#E6E2D8'); box(1.2,.12,.07,fx*.3+.6,1.95,fz*.44,'#A9463A'); }},
};
const GROUPS = { rumah:'Rumah', usaha:'Usaha', umum:'Usulan umum' };
const catOf = t => CAT[t] || CAT.rumah;
