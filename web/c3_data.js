
/* =====================================================================
   DATA: Supabase (baca snapshot, bangunan per distrik, realtime saat login)
   ===================================================================== */
const sb = (window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(CFG.url || 'https://belum-diisi.supabase.co', CFG.key || 'belum-diisi', { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } })
  : null;
const S = { chat: null, unread: 0, lastDon: null, snap: null, me: null, session: null, buildings: new Map(), npcs: [], occ: new Map(), loaded: new Map(), preview: false, previewWhy: '', live: null };
const isPres = () => !!(S.me && S.me.registered && S.me.profession === 'Presiden');
const isAdmin = () => !!(S.me && S.me.is_admin);
const registered = () => !!(S.me && S.me.registered);

function friendly(err, name){
  const m = String(err?.message || err || '');
  if (err?.code === 'PGRST202') return 'Server Netizenia v2 belum diperbarui (fungsi ' + name + ' belum ada).';
  if (/permission denied|JWT|not authenticated/i.test(m)) return 'Masuk dulu untuk melakukan ini.';
  if (/Failed to fetch|NetworkError|Load failed|network/i.test(m)) return 'Koneksi ke server terputus. Coba lagi.';
  return m;
}
async function rpc(name, args){
  if (!sb) throw new Error('Pustaka Supabase gagal dimuat. Periksa koneksi.');
  const { data, error } = await sb.rpc(name, args || {});
  if (error){ const e = new Error(friendly(error, name)); e.code = error.code; throw e; }
  return data;
}

function applyOpenVisuals(){ buildRoads(openSet); buildSidewalks(openSet); buildLamps(openSet); paintTrees(openSet); initMovers(); paintLots(); }
function setOpen(keys){
  const next = new Set(keys); if (next.size === openSet.size && [...next].every(k => openSet.has(k))) return;
  openSet = next; applyOpenVisuals();
}
async function loadSnapshot(){
  try {
    const s = await rpc('get_city_snapshot');
    if (s && s.grid_version !== 3 && !S.snap){ enterPreview('Server masih memakai tata kota lama (grid v' + (s.grid_version || 2) + '); halaman ini butuh grid v3.'); return false; }
    S.snap = s; S.preview = false;
    const t = Date.parse(s.now); if (t) clockOffset = t - Date.now();
    for (const d of s.districts || []) if (d.key && d.name && DIST_NAME[d.key] !== undefined) DIST_NAME[d.key] = d.name;   // nama tampilan dari tabel nz.districts
    setOpen((s.districts || []).filter(d => d.open).map(d => d.key));
    const top = (s.donations || [])[0];
    if (top && S.lastDon !== null && top.id !== S.lastDon && Date.parse(top.at) > now() - 3600000){ toast('💛 Terima kasih ' + top.name + ' atas dukungan ' + rupiah(top.amount) + '!', 'good'); floatText('💛'); }
    S.lastDon = top ? top.id : 0; setDonorClouds(s.donations);
    renderHud(); if (sheetKind) renderSheet(); return true;
  } catch (e) { if (!S.snap) enterPreview(e.message); return false; }
}
async function loadNpcs(){
  const c = store.get('nz_npcs_v1', null);
  if (c && c.url === CFG.url && Date.now() - c.at < 10 * 60000 && Array.isArray(c.list)){ S.npcs = c.list; initMovers(); return; }   // cache 10 menit di perangkat ini
  try { S.npcs = await rpc('get_npcs') || []; initMovers(); store.set('nz_npcs_v1', { url: CFG.url, at: Date.now(), list: S.npcs }); } catch (_) {}
}
async function loadDistricts(keys){
  keys = [...new Set(keys)].filter(k => openSet.has(k)); if (!keys.length || S.preview) return;
  let list; try { list = await rpc('get_buildings', { p_districts: keys }); } catch (e) { return; }
  const seen = new Set(); list = list || [];
  for (const b of list){ seen.add(b.id); S.buildings.set(b.id, b); }
  for (const [id, b] of [...S.buildings]) if (keys.includes(b.d) && !seen.has(id)){ S.buildings.delete(id); dropVisual(id); clearCells(b, id); }
  // performa (November 2026): bangunan TIDAK lagi dibuat sekaligus (2.400+ bangunan ≈ detik-detik layar beku di HP), tetapi diantrikan dan
  // dibuat bertahap per frame, terdekat ke kamera dulu (stepVisQueue). Petak didaftarkan dulu ke CELL_ID supaya kunci deret/warna dinding
  // tetangga sudah final saat bangunan pertama dibuat (tanpa rantai bangun-ulang tetangga).
  for (const b of list) if (b.stage === 'jadi') for (let a = 0; a < b.w; a++) for (let c = 0; c < b.h; c++){ const k = (b.j + c) * N + b.i + a; if (!CELL_ID.has(k)) CELL_ID.set(k, b.id); }
  for (const b of list){ const v = vis.get(b.id); if (v && v.key === visualKey(b)){ v.b = b; updateLabel(v); } else VQ.push(b); }
  VQ_SORTED = false;
  keys.forEach(k => S.loaded.set(k, Date.now()));
  rebuildOcc(); paintLots(); renderHud(); if (sheetKind && sheetKind !== 'bangun') renderSheet();
}
const VQ = []; let VQ_SORTED = true;
function clearCells(b, id){ for (let a = 0; a < b.w; a++) for (let c = 0; c < b.h; c++){ const k = (b.j + c) * N + b.i + a; if (CELL_ID.get(k) === id) CELL_ID.delete(k); } }
// dipanggil tiap frame (c2e renderFrame): buat visual dari antrean dalam anggaran waktu, terdekat ke titik tatap dulu
function stepVisQueue(){
  if (!VQ.length) return;
  if (!VQ_SORTED){ const d = b => { const [x, z] = centerOf(b); return (x - cam.tx) ** 2 + (z - cam.tz) ** 2; }; VQ.sort((p, q) => d(q) - d(p)); VQ_SORTED = true; }
  const t0 = performance.now(), budget = MOBILE ? 8 : 12;
  while (VQ.length && performance.now() - t0 < budget){ const b = VQ.pop(); if (S.buildings.get(b.id) !== b) continue;
    const v = vis.get(b.id); if (!v || v.key !== visualKey(b)) makeVisual(b); else { v.b = b; updateLabel(v); } }
}
function upsertBuilding(b){
  S.buildings.set(b.id, b); const v = vis.get(b.id);
  if (!v || v.key !== visualKey(b)) makeVisual(b); else { v.b = b; updateLabel(v); }
}
function rebuildOcc(){ S.occ = new Map(); for (const b of S.buildings.values()) for (let a = 0; a < b.w; a++) for (let c = 0; c < b.h; c++) S.occ.set((b.j + c) * N + b.i + a, b.id); }
// skor kavling untuk tipe yang sedang ditempatkan: 3 boleh (hijau), 2 zona salah (merah), 1 tidak punya muka jalan untuk tapak ini (abu), 0 tidak muat/terisi
function placeScore(i, j){
  const ct = catOf(place.type), w = place.w, h = place.h; let best = 0;
  for (let a = 0; a < w; a++) for (let c = 0; c < h; c++){ const i0 = i - a, j0 = j - c;
    if (!isLot(i0, j0) || !isLot(i0 + w - 1, j0 + h - 1) || !sameBlock(i0, j0, w, h)) continue;
    let occ = false; for (let x = 0; x < w && !occ; x++) for (let y = 0; y < h; y++) if (S.occ.has((j0 + y) * N + i0 + x)){ occ = true; break; } if (occ) continue;
    const sc = facingOf(i0, j0, w, h, ct.w, ct.h) == null ? 1 : ct.zones.includes(zoneOfLot(i0, j0, w, h)) ? 3 : 2; if (sc > best) best = sc; if (best === 3) return 3; }
  return best;
}
function paintLots(){
  const mineSet = new Set(); if (S.me) for (const b of S.buildings.values()) if (b.owner_id === S.me.id) for (let a = 0; a < b.w; a++) for (let c = 0; c < b.h; c++) mineSet.add((b.j + c) * N + b.i + a);
  lotList.forEach(([i, j], k) => { const d = districtOf(i, j), key = j * N + i; let col;
    if (!openSet.has(d)) col = LOTC.forest;
    else if (place && !S.occ.has(key)){ const sc = placeScore(i, j); col = sc === 3 ? LOTC.free : sc === 2 ? LOTC.bad : sc === 1 ? LOTC.nofront : LOTC.lawn[2]; }
    else if (mineSet.has(key)) col = LOTC.mine; else col = ringOf(i, j) < 2 && lotClass(i, j, 1, 1) >= 2 ? LOTC.paving : LOTC.lawn[(i * 7 + j * 3) % 3];
    lotMesh.setColorAt(k, col); });
  lotMesh.instanceColor.needsUpdate = true;
}
function visibleDistricts(){
  const r = cam.dist * .95 + 25, out = [];
  for (const k of DISTRICTS){ if (!openSet.has(k)) continue; const [i0, j0, i1, j1] = DIST_RECT[k]; const x0 = wx(i0), z0 = wx(j0), x1 = wx(i1), z1 = wx(j1);
    const dx = Math.max(x0 - cam.tx, 0, cam.tx - x1), dz = Math.max(z0 - cam.tz, 0, cam.tz - z1); if (Math.hypot(dx, dz) <= r) out.push(k); }
  return out;
}
let loadingD = false;
async function ensureVisibleDistricts(){
  if (S.preview || loadingD || !S.snap) return; const need = visibleDistricts().filter(k => !S.loaded.has(k)); if (!need.length) return;
  loadingD = true; try { await loadDistricts(need); } finally { loadingD = false; }
}
let pollN = 0;
async function poll(){
  if (document.hidden || S.preview) return; pollN++;
  await loadSnapshot();
  if (!S.session ? pollN % 2 === 0 : !S.live || pollN % 3 === 0) await loadDistricts([...S.loaded.keys()]);
  if (S.session) loadMe(true);
  if (pollN % 10 === 0) loadNpcs();
}

/* ---------- realtime: hanya pemain login, hanya tabel yang perlu ---------- */
let rq = { ds: new Set(), snap: false, t: null };
function queueRefresh(d, snap){
  if (d) rq.ds.add(d); else for (const k of S.loaded.keys()) rq.ds.add(k); if (snap) rq.snap = true;
  clearTimeout(rq.t); rq.t = setTimeout(async () => { const ds = [...rq.ds].filter(k => S.loaded.has(k)), sn = rq.snap; rq = { ds: new Set(), snap: false, t: null }; if (sn) await loadSnapshot(); if (ds.length) await loadDistricts(ds); }, 1200);
}
function startLive(){
  if (!sb || S.live || S.preview) return;
  S.live = sb.channel('nz-kota')
    .on('postgres_changes', { event: '*', schema: 'nz', table: 'buildings' }, p => queueRefresh(p.new?.district || p.old?.district || null, p.eventType !== 'UPDATE'))
    .on('postgres_changes', { event: '*', schema: 'nz', table: 'proposals' }, p => { const bid = p.new?.building_id || p.old?.building_id; queueRefresh(S.buildings.get(bid)?.d || null, true); })
    .on('postgres_changes', { event: 'INSERT', schema: 'nz', table: 'chat_messages' }, p => onChatRow(p.new))
    .on('postgres_changes', { event: 'DELETE', schema: 'nz', table: 'chat_messages' }, p => { if (S.chat && p.old?.id){ S.chat = S.chat.filter(m => m.id !== p.old.id); if (sheetKind === 'chat') renderSheet(); } })
    .subscribe();
}
async function loadChat(){ try { S.chat = await rpc('get_chat', { p_limit: 50 }) || []; } catch (_) {} if (sheetKind === 'chat') renderSheet(true); }
function onChatRow(r){
  if (!r || !S.chat) return; if (S.chat.some(m => m.id === r.id)) return;
  S.chat.push({ id: r.id, name: r.name, prof: r.profession, text: r.text, at: r.created_at }); if (S.chat.length > 80) S.chat.shift();
  if (sheetKind === 'chat') renderSheet(true); else if (!S.me || r.name !== S.me.name){ S.unread++; renderDock(); }
}
function stopLive(){ if (S.live){ try { sb.removeChannel(S.live); } catch (_) {} S.live = null; } }

/* ---------- akun ---------- */
async function loadMe(quiet){
  if (!S.session || S.preview){ S.me = null; return; }
  try {
    S.me = await rpc('get_my_state');
    if (S.me && S.me.logged_in && !S.me.registered && modalKind !== 'register') openModal('register');
    if (registered() && (modalKind === 'login' || modalKind === 'register')) closeModal();
  } catch (e) { if (!quiet) toast(e.message, 'bad'); }
  renderHud(); paintLots(); if (sheetKind && !quiet) renderSheet();
}
function initAuth(){
  if (!sb) return;
  sb.auth.onAuthStateChange((ev, session) => { S.session = session; setTimeout(() => onSession(ev), 0); });
}
async function onSession(ev){
  if (/[?&]code=/.test(location.search)) history.replaceState(null, '', location.pathname);
  if (S.session){ await loadMe(); startLive(); loadChat(); for (const v of vis.values()) updateLabel(v); }
  else { S.me = null; stopLive(); }
  renderHud(); paintLots(); if (sheetKind) renderSheet();
}
function mapAuth(err){
  const m = String(err?.message || err);
  if (/invalid login|invalid credentials/i.test(m)) return 'Username atau kata sandi salah.';
  if (/already registered|already been registered|exists/i.test(m)) return 'Username sudah dipakai. Pilih yang lain atau masuk.';
  if (/email.*invalid|invalid.*email/i.test(m)) return 'Server menolak akun username (format email internal). Kabari presiden.';
  if (/rate limit|too many/i.test(m)) return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.';
  if (/password/i.test(m)) return 'Kata sandi terlalu lemah. Pakai minimal 8 karakter.';
  if (/signups not allowed|signup.*disabled/i.test(m)) return 'Pendaftaran sedang ditutup di server.';
  return m;
}
// Tombol Google hanya tampil bila provider Google aktif di Supabase (pengaturan publik GoTrue).
let googleOn = null;
async function loadAuthSettings(){
  try { const r = await fetch(CFG.url + '/auth/v1/settings', { headers: { apikey: CFG.key } }); const d = await r.json(); googleOn = !!(d && d.external && d.external.google); }
  catch (_) { googleOn = null; }
  if (modalKind === 'login') renderModal();
}
async function loginGoogle(){
  if (!sb) return toast('Pustaka Supabase gagal dimuat.', 'bad');
  const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } });
  if (error) toast(mapAuth(error), 'bad');
}
async function loginUser(mode, u, pw){
  u = String(u || '').trim().toLowerCase();
  if (!/^[a-z0-9_.]{3,20}$/.test(u)) throw new Error('Username 3–20 karakter: huruf kecil, angka, titik, atau garis bawah.');
  if (String(pw || '').length < 8) throw new Error('Kata sandi minimal 8 karakter.');
  const email = u + '@' + CFG.mailDomain;
  if (mode === 'daftar'){
    let free = true; try { free = await rpc('username_available', { p_username: u }); } catch (_) {}
    if (!free) throw new Error('Username sudah dipakai. Pilih yang lain atau masuk.');
    const { data, error } = await sb.auth.signUp({ email, password: pw });
    if (error) throw new Error(mapAuth(error));
    if (!data.session) throw new Error('Akun dibuat, tapi server meminta konfirmasi email. Presiden perlu mematikan "Confirm email".');
  } else {
    const { error } = await sb.auth.signInWithPassword({ email, password: pw });
    if (error) throw new Error(mapAuth(error));
  }
}
async function logout(){ try { await sb.auth.signOut(); } catch (_) {} S.me = null; closeSheet(); toast('Kamu keluar. Sampai jumpa!'); }

/* ---------- aksi pemain: semua lewat RPC, server yang memutuskan ---------- */
async function act(name, args, opts){
  opts = opts || {};
  if (S.preview) return toast('Mode pratinjau: aksi dimatikan sampai server v2 aktif.', 'bad');
  if (!S.session) return openModal('login');
  if (!registered()) return openModal('register');
  const before = Number(S.me.coins) || 0;
  try {
    const r = await rpc(name, args);
    if (r && r.msg) toast(r.msg, 'good');
    await loadMe(true);
    const diff = (Number(S.me?.coins) || 0) - before; if (diff) floatText((diff > 0 ? '+' : '') + fmt(diff) + ' NC', opts.x, opts.y);
    if (opts.refresh !== false){ await loadDistricts(opts.districts || [...S.loaded.keys()]); loadSnapshot(); }
    if (sheetKind) renderSheet();
    return r || true;
  } catch (e) { toast(e.message, 'bad'); return null; }
}

/* ---------- mode pratinjau (server v2 belum aktif / offline) ---------- */
// koordinat hasil migrasi §6 (new_i = 7*(i/5)+i%5+80, new_j = 6*(j/5)+85+3*((j%5-1)/2)+(j%5-1)%2) dari seed lama 11..29
const LEGACY = [
  ['mulyo','Rumah Pak Mulyo',104,106,2,2,'jadi',1],['tugu','Alun-Alun & Tugu Kuda',109,109,2,2,'jadi',1],['rs','Rumah Sakit Gratis',116,103,2,2,'jadi',1],
  ['polisi','Kantor Polisi & Damkar',116,109,2,1,'bangun',.6],['bank','Bank Negara & Kas',118,109,2,1,'bangun',.4],['penjara','Penjara Netizenia',116,112,2,1,'bangun',.5],
  ['pasar','Ruko UMKM & Kopi',111,109,2,2,'jadi',1],['posko','Posko Tukang',111,113,1,1,'jadi',1],['pln','Gardu Induk PLN & WiFi',119,101,1,1,'jadi',1],
  ['barak','Barak TNI Kaki Gunung',118,97,2,2,'bangun',.5],['taman','Taman Love Pencari Jodoh',98,109,1,1,'jadi',1],['taman','Taman Kota',105,113,1,1,'jadi',1],
  ['lapangan','Tanah Lapang',95,109,2,2,'jadi',1],['sekolah','Sekolah',97,103,2,2,'bangun',.55],['kos','Kosan & Daycare Sekolah',102,103,2,1,'jadi',1],
  ['ibadah','Tempat Ibadah 6 Agama',102,109,2,1,'bangun',.45],['istana','Istana Negara',109,103,2,2,'sketsa',0],['stadion','Stadion Netizenia FC',95,115,4,2,'sketsa',0],
  ['waduk','Bendungan & Sungai',95,97,2,2,'jadi',1],['sawah','Zona Pangan & Ternak',97,97,2,2,'jadi',1],['pkl','Zona PKL Pinggir Jalan',109,115,2,1,'jadi',1],
  ['apartemen','Apartemen Netizenia',102,115,2,2,'jadi',1],['pabrik','Pabrik & Bengkel Otomotif',118,115,2,2,'bangun',.5],
];
// rumah NPC pola strip (versi JS kecil dari seed_npc_homes v2 §5): sisi blok zona KAMPUNG distrik ring 1, blok tengah dulu; p=0 hanya kos 2x1, p=5 dilewati
function npcStripHomes(keys, perDistrict, occ){
  const pat = ['kkrRrR', 'kkrRrr', 'kkRrrR', 'RrkkrX', 'rXkkRr'], out = []; occ = occ || new Set();
  for (const k of keys){ const n = +k.slice(1), dx = n % 5, dy = Math.floor(n / 5); let used = 0; const sides = [];
    for (let bi = 0; bi < 6; bi++) for (let bj = 0; bj < 14; bj++) for (let b = 0; b < 2; b++){ const i0 = dx * PD + 2 + bi * 7, j0 = dy * PD + 2 + bj * 3 + b;
      if (zoneOf(1, b === 0 ? roadJ(j0 - 1) : roadJ(j0 + 1)) !== 'KAMPUNG') continue; sides.push([Math.abs(bi - 2.5) + Math.abs(bj - 6.5) * .5, bj, b, bi, i0, j0]); }
    sides.sort((a, c) => a[0] - c[0] || a[1] - c[1] || a[2] - c[2] || a[3] - c[3]);
    for (const [, bj, b, bi, i0, j0] of sides){ if (used >= perDistrict) break; let p = 0;
      while (p < 6){ let ch = pat[hashStr(k + bi + '-' + bj + '-' + b) % 5][p]; const i = i0 + p, j = j0; let type, w = 1;
        if (ch === 'X' || hashStr(i + ',' + j) % 100 < 15){ p++; continue; }
        if (ch === 'k'){ if (p === 5 || occ.has(j * N + i) || occ.has(j * N + i + 1)) ch = 'r'; else { type = 'kos'; w = 2; } }
        if (ch === 'r') type = 'rumah'; else if (ch === 'R') type = 'rumah2';
        if (occ.has(j * N + i) || ((p === 0 || p === 5) && type !== 'kos')){ p++; continue; }
        out.push({ type, i, j, w, h: 1, d: k }); for (let a = 0; a < w; a++) occ.add(j * N + i + a); used++; p += w; } }
  }
  return out;
}
const PREVIEW_NPC = [['David','Tukang'],['Ali Akbar Rafsanjani','Warga'],['KarShikii','Dokter'],['Dyajeng Rahayu','Dokter'],['Bintang','Polisi'],['Ilham Harahap','Polisi'],['Fory Coffee','Pedagang'],['Alfie Rizkiyansyah','Pedagang'],['Yura','Warga'],['Dissleksia!','Warga'],['Abu Kurir Gowa','Warga'],['Ari Pangestu II','Guru'],['Mentri_Keuang4n','Menteri'],['esjeeee','Warga'],['Spotting Cars Batam','Warga'],['larassukamatch','Warga'],['Pelajar Cupang','Pedagang'],['Mj fishing','Warga'],['yoGex','Warga'],['Siti Fatimah','Warga'],['Fanji Giovanski','Polisi'],['Hasby Shohibul Risky','Warga'],['Ruby Ahmad','Tukang'],['Wahyu April Putra','Arsitek'],['RIN 1%','Petani'],['Maz Kun','Petani'],['J4sunn__','Warga'],['Oddysey Hub','Warga'],['Jhoon','Pedagang'],['ttt','Warga']];
function enterPreview(why){
  if (S.preview) return; S.preview = true; S.previewWhy = why || '';
  let id = 1; const t0 = now();
  for (const [type, label, i, j, w, h, st, pr] of LEGACY){
    const ct = catOf(type), bh = 24; const b = { id: id++, type, label, i, j, w, h, d: districtOf(i, j), owner_id: null, owner: 'negara', owner_kind: 'negara', stage: st, build_hours: bh, boost: 0, started_at: st === 'bangun' ? new Date(t0 - pr * bh * 3600000).toISOString() : null, protected: true };
    if (st === 'sketsa') b.proposal = { id: id, yes: type === 'istana' ? 3 : 1, no: type === 'istana' ? 1 : 0, ends_at: new Date(t0 + 20 * 3600000).toISOString(), status: 'voting', cost: ct.cost, discount: 0, proposer: 'warga lama' };
    S.buildings.set(b.id, b);
  }
  rebuildOcc();
  const homes = npcStripHomes(OPEN_AT_START.filter(k => k !== 'k12'), 28, new Set(S.occ.keys()));
  homes.forEach((hm, k) => { const b = { id: id++, ...hm, owner_kind: 'npc', owner: PREVIEW_NPC[k % PREVIEW_NPC.length][0], stage: 'jadi' }; S.buildings.set(b.id, b); });
  rebuildOcc(); setOpen(OPEN_AT_START);
  for (const b of S.buildings.values()) makeVisual(b);
  S.npcs = PREVIEW_NPC.map((n, k) => [k + 1, n[0], n[1], COLORS[k % 10], null, false, null]); initMovers();
  S.snap = { grid_version: 3, kas: 9000, tax: 10, stats: { pop: 312, happy: 58, players: 0, npcs: 326, cov: { sekolah: .3, rs: .5, polisi: .2, taman: .7, kerja: .4 } },
    districts: DISTRICTS.map(k => ({ key: k, name: DIST_NAME[k], ring: distRing(k), open: OPEN_AT_START.includes(k), cost: distRing(k) === 2 ? 2000 : 0 })),
    news: [{ text: 'Selamat datang di Republik Netizenia! Ini pratinjau kota.', kind: 'info' }, { text: 'Usulan Istana Negara sedang divoting warga.', kind: 'voting' }], proposals: [], district_proposals: [], announcements: [], chat: [], donations: [] };
  for (const b of S.buildings.values()) if (b.proposal) S.snap.proposals.push({ id: b.proposal.id, building_id: b.id, type: b.type, name: b.label, yes: b.proposal.yes, no: b.proposal.no, ends_at: b.proposal.ends_at, status: 'voting', cost: b.proposal.cost, discount: 0, proposer: 'warga lama', i: b.i, j: b.j, w: b.w, h: b.h, d: b.d });
  paintLots(); renderHud();
}
