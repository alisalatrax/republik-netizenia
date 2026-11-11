// Server tiruan Supabase untuk uji UI (tidak menyentuh server asli).
const fs = require('fs'), path = require('path');
const WEB = path.join(__dirname, 'lib') + '/';   // diisi oleh: npm run test:lib
const HTML = process.env.NZ_HTML || path.join(__dirname, '..', 'dist', 'index.html');   // NZ_HTML: halaman uji terisolasi (agen paralel)
const REF = 'test';   // proyek tiruan: https://test.supabase.co
const UID = '11111111-1111-1111-1111-111111111111';
function b64u(o){ return Buffer.from(JSON.stringify(o)).toString('base64').replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_'); }
function fakeSession(){ const exp = Math.floor(Date.now()/1000) + 3600; const jwt = b64u({alg:'HS256',typ:'JWT'}) + '.' + b64u({sub:UID, role:'authenticated', exp, email:'andi@warga.netizenia.local'}) + '.sig';
  return { access_token: jwt, token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: 'r', user: { id: UID, aud: 'authenticated', role: 'authenticated', email: 'andi@warga.netizenia.local', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } }; }
// grid v3 (salinan rumus c1_core.js; koordinat LEG = hasil migrasi §6 dari seed lama 11..29)
const T = 6, PD = 43, N = 217;
const roadI = i => { const u = i % PD; return u < 2 ? 3 : (u - 2) % 7 === 6 ? 2 : 0; }, roadJ = j => { const v = j % PD; return v < 2 ? 3 : (v - 2) % 3 === 2 ? 1 : 0; };
const inMap = (i, j) => i >= 0 && j >= 0 && i < N && j < N, isLot = (i, j) => inMap(i, j) && roadI(i) === 0 && roadJ(j) === 0;
const blockOf = (i, j) => [Math.floor(i / PD) * 6 + Math.floor((i % PD - 2) / 7), Math.floor(j / PD) * 14 + Math.floor((j % PD - 2) / 3)];
const sameBlock = (i, j, w, h) => { const a = blockOf(i, j), b = blockOf(i + w - 1, j + h - 1); return a[0] === b[0] && a[1] === b[1]; };
const dIdx = i => Math.floor(i / PD), districtOf = (i, j) => 'k' + String(Math.min(dIdx(j), 4) * 5 + Math.min(dIdx(i), 4)).padStart(2, '0');
const ringOf = (i, j) => Math.max(Math.abs(Math.min(dIdx(i), 4) - 2), Math.abs(Math.min(dIdx(j), 4) - 2));
const fronts = (i, j, w, h) => ({ S: roadJ(j + h), N: roadJ(j - 1), E: roadI(i + w), W: roadI(i - 1) }), FACE_PRI = { 0: 0, 2: 1, 1: 2, 3: 3 };
function facingOf(i, j, w, h, cw, ch, want){ const f = fronts(i, j, w, h); const c = [[0, f.S, w === cw], [2, f.N, w === cw], [1, f.E, w === ch], [3, f.W, w === ch]].filter(v => v[1] > 0 && v[2]); if (!c.length) return null; if (want != null && c.some(v => v[0] === want)) return want; c.sort((a, b) => b[1] - a[1] || FACE_PRI[a[0]] - FACE_PRI[b[0]]); return c[0][0]; }
const lotClass = (i, j, w, h) => { const f = fronts(i, j, w, h); return Math.max(f.S, f.N, f.E, f.W); };
const zoneOf = (ring, k) => ring === 0 ? (k === 3 ? 'CBD' : k === 2 ? 'RUKO' : 'KOTA') : ring === 1 ? (k >= 2 ? 'RUKO' : 'KAMPUNG') : (k === 3 ? 'RUKO_KECIL' : k === 2 ? 'KAMPUNG' : 'DESA');
const zoneOfLot = (i, j, w, h) => zoneOf(ringOf(i, j), lotClass(i, j, w, h));
const LAND_MULT = { CBD: 4, RUKO: 2.5, RUKO_KECIL: 1.5, KOTA: 1.5, KAMPUNG: 1, DESA: .5 };
const ZONES = { rumah: ['KOTA','KAMPUNG','DESA'], rumah2: ['KOTA','KAMPUNG','DESA'], warung: ['RUKO','RUKO_KECIL','KOTA','KAMPUNG','DESA'], kos: ['RUKO','RUKO_KECIL','KOTA','KAMPUNG'], taman: ['CBD','RUKO','RUKO_KECIL','KOTA','KAMPUNG','DESA'], ruko: ['CBD','RUKO','RUKO_KECIL'], toko: ['CBD','RUKO','RUKO_KECIL','KOTA','KAMPUNG'] };
const DIST = []; { const arah = { '0,-1':'Utara', '1,-1':'Timur Laut', '1,0':'Timur', '1,1':'Tenggara', '0,1':'Selatan', '-1,1':'Barat Daya', '-1,0':'Barat', '-1,-1':'Barat Laut' }, cnt = {};
  for (let n = 0; n < 25; n++){ const dx = n % 5 - 2, dy = Math.floor(n / 5) - 2, r = Math.max(Math.abs(dx), Math.abs(dy)); let name; if (r === 0) name = 'Kampung Pusat'; else if (r === 1) name = 'Kampung ' + arah[dx + ',' + dy]; else { const a = arah[Math.sign(dx) + ',' + Math.sign(dy)]; cnt[a] = (cnt[a] || 0) + 1; name = 'Desa ' + a + ' ' + cnt[a]; }
    DIST.push({ key: 'k' + String(n).padStart(2, '0'), name, ring: r, cost: r === 2 ? 2000 : 0, open: r <= 1, fill_pct: r === 1 ? 75 : r === 2 ? 55 : 100 }); } }
function hashStr(s){ let h = 2166136261; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
// rumah NPC pola strip §5 di ring 1 (salinan npcStripHomes c3_data.js)
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
const LEG = [['mulyo','Rumah Pak Mulyo',104,106,2,2,'jadi',1],['tugu','Alun-Alun & Tugu Kuda',109,109,2,2,'jadi',1],['rs','Rumah Sakit Gratis',116,103,2,2,'jadi',1],['polisi','Kantor Polisi & Damkar',116,109,2,1,'bangun',.6],['bank','Bank Negara & Kas',118,109,2,1,'bangun',.4],['penjara','Penjara Netizenia',116,112,2,1,'bangun',.5],['pasar','Ruko UMKM & Kopi',111,109,2,2,'jadi',1],['posko','Posko Tukang',111,113,1,1,'jadi',1],['pln','Gardu Induk PLN & WiFi',119,101,1,1,'jadi',1],['barak','Barak TNI Kaki Gunung',118,97,2,2,'bangun',.5],['taman','Taman Love Pencari Jodoh',98,109,1,1,'jadi',1],['taman','Taman Kota',105,113,1,1,'jadi',1],['lapangan','Tanah Lapang',95,109,2,2,'jadi',1],['sekolah','Sekolah',97,103,2,2,'bangun',.55],['kos','Kosan & Daycare Sekolah',102,103,2,1,'jadi',1],['ibadah','Tempat Ibadah 6 Agama',102,109,2,1,'bangun',.45],['istana','Istana Negara',109,103,2,2,'sketsa',0],['stadion','Stadion Netizenia FC',95,115,4,2,'sketsa',0],['waduk','Bendungan & Sungai',95,97,2,2,'jadi',1],['sawah','Zona Pangan & Ternak',97,97,2,2,'jadi',1],['pkl','Zona PKL Pinggir Jalan',109,115,2,1,'jadi',1],['apartemen','Apartemen Netizenia',102,115,2,2,'jadi',1],['pabrik','Pabrik & Bengkel Otomotif',118,115,2,2,'bangun',.5]];
const CATW = { mulyo:[2,2], tugu:[2,2], rs:[2,2], polisi:[2,1], bank:[2,1], penjara:[2,1], pasar:[2,2], posko:[1,1], pln:[1,1], barak:[2,2], taman:[1,1], lapangan:[2,2], sekolah:[2,2], kos:[2,1], ibadah:[2,1], istana:[2,2], stadion:[4,2], waduk:[2,2], sawah:[2,1], pkl:[2,1], apartemen:[2,2], pabrik:[2,2], rumah:[1,1], rumah2:[1,1], warung:[1,1], ruko:[1,1], toko:[2,1] };
// rumah NPC: pola strip di 8 distrik ring 1 (bukan di k12), ±30 rumah per distrik; facing dibiarkan null → klien menghitung
const HOUSES = npcStripHomes(DIST.filter(d => d.ring === 1).map(d => d.key), 30, new Set());
function makeState(registered){
  const st = { ann: [{ id: 1, text: 'TES pengumuman tahap 5', at: new Date().toISOString() }], don: [{ id: 1, name: 'Dermawan', amount: 50000, message: 'Semangat warga Netizenia!', at: new Date(Date.now() - 600000).toISOString() }, { id: 2, name: 'Fory Coffee', amount: 15000, message: null, at: new Date(Date.now() - 3600000).toISOString() }],
    chat: [{ id: 1, name: 'Bintang', prof: 'Polisi', text: 'Patroli aman, warga!', at: new Date(Date.now() - 300000).toISOString() }, { id: 2, name: 'Fory Coffee', prof: 'Pedagang', text: 'Kopi dingin siap di Ruko UMKM!', at: new Date(Date.now() - 120000).toISOString() }],
    queue: { claims: [{ id: 7, npc_id: 1, name: 'David', ig: 'david_asli', note: 'Itu aku, tukang utama', account: 'Fani', username: 'fani', linked: true, at: new Date().toISOString() }], optouts: [{ id: 3, npc_id: 5, name: 'Yura', reason: 'Tidak mau namanya dipakai', account: 'Yura Asli', at: new Date().toISOString() }], jailed: [] },
    calls: [], kas: 9000, buildings: [], proposals: [], votes: {}, me: null, registered, seq: 1, pseq: 1 };
  const now = Date.now();
  for (const [type,label,i,j,w,h,stage,pr] of LEG){ const cw = CATW[type] || [w, h]; const b = { id: st.seq++, type, label, i, j, w, h, d: 'k12', facing: facingOf(i, j, w, h, cw[0], cw[1]), zone: zoneOfLot(i, j, w, h), floors: null, owner_id: null, owner: null, owner_kind: 'negara', stage, started_at: stage === 'bangun' ? new Date(now - pr * 24 * 3600000).toISOString() : null, build_hours: 24, boost: 0, wage: 30, job_open: true, workers: 0, npc_staff: 2, protected: true, proposal: null };
    if (stage === 'sketsa'){ b.proposal = { id: st.pseq++, yes: type === 'istana' ? 3 : 1, no: type === 'istana' ? 1 : 0, ends_at: new Date(now + 20 * 3600000).toISOString(), status: 'voting', cost: type === 'istana' ? 4000 : 3500, discount: 0, proposer: 'V, Sukma Syari, PAPITO CUAN', my_vote: null }; st.proposals.push(b); }
    st.buildings.push(b); }
  HOUSES.forEach((hm, k) => st.buildings.push({ id: st.seq++, type: hm.type, i: hm.i, j: hm.j, w: hm.w, h: hm.h, d: hm.d, facing: null, zone: null, floors: null, owner_kind: 'npc', owner: 'Warga ' + k, stage: 'jadi', build_hours: 1, boost: 0, protected: false, proposal: null }));
  return st;
}
function occ(st){ const m = new Set(); for (const b of st.buildings) for (let a = 0; a < b.w; a++) for (let c = 0; c < b.h; c++) m.add((b.j + c) * N + b.i + a); return m; }
function meState(st){ if (!st.registered) return { logged_in: true, registered: false, is_admin: false, username: 'andi', professions: [], colors: [] };
  const m = st.me; const myVotes = {}; for (const [pid, v] of Object.entries(st.votes)) myVotes[pid] = v;
  const jb = m.job && st.buildings.find(x => x.id === m.job);
  return { logged_in: true, registered: true, is_admin: !!st.admin, id: UID, username: 'andi', name: m.name, profession: m.profession, color: m.color, coins: m.coins, energy: m.energy ?? 100, health: m.health ?? 100, xp: m.xp || 0, level: 1, jail_until: null, home_building_id: m.home, free_house_used: m.free, promo_until: null, npc: null,
    cooldowns: m.cd || {}, missions: [['kerja','Masuk kerja atau kerja serabutan'],['aksi','Lakukan 1 aksi profesi'],['vote','Beri suara pada 1 usulan']].map(([key,label]) => ({ key, label, done: !!(m.done || {})[key] })),
    earned_today: m.earned || 0, daily_cap: 300, job: jb ? { building_id: jb.id, type: jb.type, name: jb.label || jb.type, owner: 'Negara', state: true, wage: jb.wage, last_shift_at: null, paid_hours: 0 } : null, owned: st.buildings.filter(b => b.owner_id === UID).length, active_proposals: 0, my_votes: myVotes, my_district_votes: {}, reports_on_me: 0, claim_pending: !!st.claimPending, claim_pending_npc: st.claimPending || null, optout_pending: st.optout || [] }; }
function snapshot(st){ return { now: new Date().toISOString(), grid_version: 3, kas: st.kas, tax: 10, daily_cap: 300, vote_hours: 24, min_yes: 5, morale: 0,
  stats: { pop: 352, houses: 40, happy: 61, players: st.registered ? 1 : 0, npcs: 326, cov: { sekolah: .31, rs: .26, polisi: .34, taman: .8, kerja: .06 } },
  districts: DIST.map(d => ({ ...d })),
  news: [{ id: 3, text: 'Satu bata lagi, satu usulan netizen jadi.', kind: 'kutipan', actor: 'David', at: new Date().toISOString() }, { id: 2, text: 'Usulan Istana Negara sedang divoting warga.', kind: 'voting', at: new Date().toISOString() }, { id: 1, text: 'Selamat datang di Republik Netizenia v2!', kind: 'info', at: new Date().toISOString() }],
  announcements: st.ann,
  proposals: st.proposals.map(b => ({ id: b.proposal.id, building_id: b.id, type: b.type, name: b.label, yes: b.proposal.yes, no: b.proposal.no, ends_at: b.proposal.ends_at, status: 'voting', cost: b.proposal.cost, discount: 0, proposer: b.proposal.proposer, i: b.i, j: b.j, w: b.w, h: b.h, d: 'k12' })),
  district_proposals: [], donations: st.don, donation_total: st.don.reduce((a, d) => a + d.amount, 0), donation_goal: st.goal || 0, saweria_url: st.saweria || null, legacy: {},
  chat: st.chat.slice(-30) }; }
const NPCS = [['David','Tukang'],['KarShikii','Dokter'],['Bintang','Polisi'],['Fory Coffee','Pedagang'],['Yura','Warga'],['Ari Pangestu II','Guru'],['esjeeee','Warga'],['RIN 1%','Petani']].map((n, k) => [k + 1, n[0], n[1], '#D9483B', k < 4 ? 40 + k : null, k === 1, k === 0 ? 'david_asli' : null]);
function handle(st, name, args){
  st.calls.push([name, args]);
  const CAT = { rumah: [1,1,150], rumah2: [1,1,320], warung: [1,1,200], kos: [2,1,700], taman: [1,1,300], ruko: [1,1,600], toko: [2,1,450] };
  switch (name){
    case 'get_city_snapshot': return snapshot(st);
    case 'get_buildings': return st.buildings.filter(b => args.p_districts.includes(b.d)).map(b => ({ ...b, proposal: b.proposal ? { ...b.proposal, my_vote: st.votes[b.proposal.id] ?? null } : null }));
    case 'get_building': { const b = st.buildings.find(x => x.id === args.p_id); return b ? { ...b, residents: b.owner_kind === 'npc' ? ['David', 'Yura', 'KarShikii'] : [] } : null; }
    case 'get_npcs': return NPCS;
    case 'get_my_state': return meState(st);
    case 'username_available': return true;
    case 'register_profile': st.registered = true; st.me = { name: args.p_name, profession: args.p_profession, color: args.p_color, coins: 400, home: null, free: false }; return meState(st);
    case 'suggest_lot': { const o = occ(st); const cands = []; for (const hm of HOUSES) for (const [di, dj] of [[1,0],[-1,0],[2,0],[-2,0]]){ const i = hm.i + di, j = hm.j; if (isLot(i, j) && !o.has(j * N + i) && ZONES.rumah.includes(zoneOfLot(i, j, 1, 1)) && facingOf(i, j, 1, 1, 1, 1) != null) cands.push({ i, j, district: districtOf(i, j), zone: zoneOfLot(i, j, 1, 1) }); } return cands[0] || null; }
    case 'build_private': { const [w0,h0,cost] = CAT[args.p_type] || [1,1,200]; const w = args.p_rotated ? h0 : w0, h = args.p_rotated ? w0 : h0, i = args.p_i, j = args.p_j;
      // aturan baru §2 (urutan & pesan sama dengan nz.place)
      if (!isLot(i, j) || !isLot(i + w - 1, j + h - 1)) return { __err: 'Tidak bisa di atas jalan.' };
      if (!sameBlock(i, j, w, h)) return { __err: 'Harus muat dalam satu blok (maks 6 lebar × 2 dalam).' };
      const facing = facingOf(i, j, w, h, w0, h0, args.p_want); if (facing == null) return { __err: 'Muka bangunan harus ke jalan.' };
      const zone = zoneOfLot(i, j, w, h); if (!(ZONES[args.p_type] || ZONES.rumah).includes(zone)) return { __err: 'Jenis ini tidak boleh di zona ' + zone + '.' };
      const o = occ(st); for (let a = 0; a < w; a++) for (let c = 0; c < h; c++) if (o.has((j + c) * N + i + a)) return { __err: 'Kavling sudah terisi.' };
      if (!DIST.find(d => d.key === districtOf(i, j)).open) return { __err: 'Distrik belum dibuka.' };
      const free = args.p_type === 'rumah' && !st.me.free; if (free && !['KAMPUNG','KOTA','DESA'].includes(zone)) return { __err: 'Rumah gratis hanya di kampung/perumahan, bukan di muka jalan utama.' };
      const price = free ? 0 : cost + Math.round(20 * w0 * h0 * LAND_MULT[zone]); if (st.me.coins < price) return { __err: 'Koinmu belum cukup. Butuh ' + price + ' NC.' };
      st.me.coins -= price; if (free) st.me.free = true; const b = { id: st.seq++, type: args.p_type, i, j, w, h, d: districtOf(i, j), facing, zone, floors: 1, front_class: fronts(i, j, w, h)[['S','E','N','W'][facing]], owner_id: UID, owner: st.me.name, owner_kind: 'warga', owner_color: st.me.color, stage: 'bangun', started_at: new Date(Date.now() - 20 * 60000).toISOString(), build_hours: 2, boost: 0, wage: 30, protected: false, proposal: null };
      st.buildings.push(b); if (!st.me.home) st.me.home = b.id; return { id: b.id, price, msg: 'Rumah Kecil mulai dibangun (2 jam). Tukang bisa membantu mempercepat.' }; }
    case 'vote_proposal': { const b = st.proposals.find(x => x.proposal.id === args.p_id); const prev = st.votes[args.p_id]; if (prev === 1) b.proposal.yes--; if (prev === -1) b.proposal.no--; st.votes[args.p_id] = args.p_vote; if (args.p_vote === 1) b.proposal.yes++; else b.proposal.no++; return { yes: b.proposal.yes, no: b.proposal.no, my_vote: args.p_vote, msg: args.p_vote > 0 ? 'Suara setuju tercatat.' : 'Suara tolak tercatat.' }; }
    case 'help_build': { const b = st.buildings.find(x => x.id === args.p_building_id); b.boost += .05; return { progress: .4, paid: 0, msg: 'Pembangunan ' + (b.label || b.type) + ' +5%.' }; }
    case 'odd_job': { const m = st.me; if (m.cd?.serabutan) return { __err: 'Kerja serabutan bisa lagi dalam 2 jam.' }; m.cd = { ...(m.cd || {}), serabutan: new Date(Date.now() + 7200e3).toISOString() }; m.coins += 12; m.earned = (m.earned || 0) + 52; m.energy = (m.energy ?? 100) - 15; m.done = { ...(m.done || {}), kerja: 1 }; m.coins += 40; return { gained: 12, msg: 'Kerja serabutan: +12 NC.' }; }
    case 'apply_job': { const b = st.buildings.find(x => x.id === args.p_building_id); st.me.job = b.id; b.workers = (b.workers || 0) + 1; return { msg: 'Diterima di ' + (b.label || b.type) + '. Gaji ' + b.wage + ' NC per shift.' }; }
    case 'do_shift': { const m = st.me; if (m.cd?.shift) return { __err: 'Shift berikutnya bisa lagi dalam 4 jam.' }; m.cd = { ...(m.cd || {}), shift: new Date(Date.now() + 4 * 3600e3).toISOString() }; m.energy = (m.energy ?? 100) - 20; return { msg: 'Shift dimulai. Gaji dibayar kas negara bertahap tiap jam selama 4 jam.' }; }
    case 'quit_job': st.me.job = null; return { msg: 'Kamu berhenti bekerja.' };
    case 'get_citizens': { const all = [{ kind: 'warga', id: '22222222-2222-2222-2222-222222222222', name: 'Budi Polisi', prof: 'Polisi', color: '#2B3A67', sick: false, jailed: false, reports: 0, i_reported: false, job: 'Kantor Polisi' }, { kind: 'warga', id: '33333333-3333-3333-3333-333333333333', name: 'Dodi', prof: 'Penjahat', color: '#37474F', sick: false, jailed: false, reports: st.rep || 1, i_reported: !!st.rep, job: null }, { kind: 'npc', id: 2, name: 'KarShikii', prof: 'Dokter', color: '#D9483B', sick: true, jailed: false, reports: 0, i_reported: false, job: null }, { kind: 'npc', id: 5, name: 'Yura', prof: 'Warga', color: '#2F8F5B', sick: true, jailed: false, reports: 0, i_reported: false, job: null }];
      return all.filter(x => args.p_filter === 'sakit' ? x.sick : args.p_filter === 'lapor' ? x.reports > 0 : true); }
    case 'prof_action': { const m = st.me; if (m.cd?.aksi) return { __err: 'Aksi profesi bisa lagi dalam 60 menit.' }; m.cd = { ...(m.cd || {}), aksi: new Date(Date.now() + 3600e3).toISOString() }; m.coins += 27; m.done = { ...(m.done || {}), aksi: 1 }; m.coins += 40; return { gained: 27, msg: (args.p_kind === 'obati' ? 'KarShikii sembuh.' : 'Aksi berhasil.') + ' Kamu +27 NC.' }; }
    case 'report_citizen': st.rep = 2; return { reports: 2, msg: 'Laporan terkirim (2 akun melapor).' };
    case 'seek_treatment': st.me.health = 100; st.me.coins -= 20; return { msg: 'Berobat di RS: sehat kembali. -20 NC.' };
    case 'get_chat': return st.chat.slice(-50);
    case 'send_chat_message': if (st.lastChat && Date.now() - st.lastChat < 5000) return { __err: 'Tunggu 5 detik sebelum mengirim pesan lagi.' }; st.lastChat = Date.now(); st.chat.push({ id: st.chat.length + 10, name: st.me.name, prof: st.me.profession, text: args.p_text, at: new Date().toISOString() }); return 'ok';
    case 'request_claim_v2': st.claimed = args; st.claimPending = { id: args.p_npc_id, name: (NPCS.find(n => n[0] === args.p_npc_id) || [])[1] }; return { msg: 'Klaim untuk David dikirim. Presiden akan memeriksanya.' };
    case 'request_opt_out': st.optout = [...(st.optout || []), args.p_npc_id]; return { msg: 'Permintaan hapus nama dikirim ke presiden.' };
    case 'admin_list_queue': return st.queue;
    case 'admin_review_claim': st.queue.claims = st.queue.claims.filter(c => c.id !== args.p_request_id); return { msg: 'Klaim disetujui. David tertaut ke akun Fani.' };
    case 'admin_review_optout': st.queue.optouts = []; return { msg: 'Nama Yura dihapus dari kota.' };
    case 'pres_add_donation': st.don.unshift({ id: 99, name: args.p_name, amount: args.p_amount, message: args.p_message, at: new Date().toISOString() }); return { id: 99, msg: 'Donasi ' + args.p_name + ' dicatat.' };
    case 'pres_set_saweria': st.saweria = args.p_url; return { msg: 'Tautan Saweria disimpan.' };
    case 'admin_set_donation_goal': st.goal = args.p_amount; return { msg: 'Target donasi disimpan.' };
    case 'admin_delete_announcement': st.ann = st.ann.filter(a => a.id !== args.p_id); return { msg: 'Pengumuman dihapus.' };
    case 'pres_set_tax': return { msg: 'Pajak sekarang ' + args.p_pct + '%.' };
    case 'pres_announce': return { msg: 'Pengumuman disiarkan.' };
    case 'admin_run_tick': return { usulan_ditutup: 0, selesai_dibangun: 1, gaji_negara_dibayar: 0, ekonomi_jalan: false };
    default: return { __err: 'mock: ' + name + ' belum ditiru' };
  }
}
async function setup(page, opts){
  const st = makeState(!!opts.registered); st.admin = !!opts.admin; if (opts.registered) st.me = { name: opts.admin ? 'Pak Mulyo' : 'Andi', profession: opts.admin ? 'Presiden' : (opts.prof || 'Tukang'), color: '#3E6FB0', coins: 400, home: null, free: true, health: opts.health ?? 100 };
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'nz.test'){
      if (url.pathname.endsWith('/config.js')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: "window.NZ_CONFIG={url:'https://test.supabase.co',key:'sb_publishable_test',site:'kota.test'};" });   // halaman + app.<hash>.js (build terpisah) dari folder yang sama dengan NZ_HTML
      const js = url.pathname.match(/\/(app\.[0-9a-f]+\.js)$/); if (js) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(require('path').join(require('path').dirname(HTML), 'a', js[1])) });
      return route.fulfill({ status: 200, contentType: 'text/html', body: fs.readFileSync(HTML) }); }
    if (url.hostname === 'cdnjs.cloudflare.com') return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(WEB + 'three.min.js') });
    if (url.hostname === 'cdn.jsdelivr.net') return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(WEB + 'supabase.js') });
    if (url.hostname.endsWith('supabase.co')){
      if (opts.offline) return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ code: 'PGRST202', message: 'Could not find the function' }) });
      const m = url.pathname.match(/\/rest\/v1\/rpc\/(\w+)/);
      if (m){ let args = {}; try { args = JSON.parse(route.request().postData() || '{}'); } catch (_) {} if (m[1] === 'send_chat_message' && opts.slowChat) await new Promise(res => setTimeout(res, opts.slowChat)); const r = handle(st, m[1], args);
        if (r && r.__err) return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ code: 'P0001', message: r.__err }) });
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(r) }); }
      if (url.pathname.startsWith('/auth/v1/settings')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ external: { email: true, google: !!opts.google }, mailer_autoconfirm: true }) });
      if (url.pathname.startsWith('/auth/v1/user')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fakeSession().user) });
      return route.fulfill({ status: 404, body: '{}' });
    }
    return route.abort();
  });
  if (opts.session) await page.addInitScript(([k, v]) => { localStorage.setItem(k, v); }, ['sb-' + REF + '-auth-token', JSON.stringify(fakeSession())]);
  return st;
}
module.exports = { setup };
