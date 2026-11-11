
/* =====================================================================
   UI
   ===================================================================== */
const ICON = {
  bangun:'<path d="M3 21h18"/><path d="M5 21V11l7-5 7 5v10"/><path d="M9 21v-6h6v6"/><path d="M12 2v4"/>',
  kerja:'<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5h6v2"/><path d="M3 12.5h18"/>',
  voting:'<path d="M4 11h16l1 9H3z"/><path d="M8 11V4h8v7"/><path d="M10 7.5l1.5 1.5L14 6"/>',
  kota:'<path d="M5 21V4"/><path d="M5 4h12l-2 3.5L17 11H5"/>',
  chat:'<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
  people:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c2.8.3 5 2.7 5 5.8"/>',
  coin:'<circle cx="12" cy="12" r="8"/><path d="M12 7v10M9.5 9.5c0-1.2 1.1-2 2.5-2s2.5.8 2.5 2-1.1 1.7-2.5 2-2.5.9-2.5 2.1 1.1 2 2.5 2 2.5-.8 2.5-2"/>',
  smile:'<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c1.8 2 5.2 2 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  map:'<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>',
  shield:'<path d="M12 3l8 3v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
};
const svg = (k, sz) => `<svg viewBox="0 0 24 24"${sz ? ` width="${sz}" height="${sz}"` : ''}>${ICON[k]}</svg>`;
const DOCK = [['bangun','Bangun'],['kerja','Kerja'],['voting','Voting'],['kota','Kota'],['chat','Chat']];
const SHEET_COLOR = { donatur:'#E2A21F', admin:'#1E2A44', warga:'#3E6FB0', bangun:'#2F8F5B', kerja:'#8A5A3C', voting:'#3E6FB0', kota:'#D9483B', chat:'#7A5AA6', info:'#E2A21F', profil:'#1F8AA8', npc:'#79B94F', distrik:'#5C8C4A' };
let sheetKind = null, sheetArg = null, sheetTab = null, dockSel = null, modalKind = null;
/* ---------- tahap 4: kerja, profesi, laporan, misi ---------- */
const PROF_ACT = {
  Warga:['bakti','Kerja bakti','Bersihkan lingkungan: kepuasan kota naik 4 jam. +8 NC.'],
  Arsitek:['rancang','Rancang ulang usulan','Pilih usulan di bawah: biayanya turun 10%. +20 NC dari kas.'],
  Guru:['ajar','Mengajar','Pilih murid di daftar Warga: dia +15 XP, kamu +25 NC. Butuh sekolah yang sudah jadi.'],
  Murid:['belajar','Belajar di sekolah','+15 XP dan 5 NC uang saku. Butuh sekolah yang sudah jadi.'],
  Dokter:['obati','Obati pasien','Pilih warga sakit di daftar Warga. +30 NC dari kas. Butuh rumah sakit yang sudah jadi.'],
  Polisi:['tangkap','Tangkap tersangka','Hanya warga yang dilapor minimal 2 akun lain. +30 NC. Butuh kantor polisi dan penjara yang sudah jadi.'],
  Pedagang:['jualan','Jualan keliling','Untung ikut jumlah daya tampung kota.'],
  Petani:['panen','Panen','22 NC per sawah milikmu, atau 10 NC bantu tetangga.'],
  Pengusaha:['promosi','Promosi usaha','Pendapatan usahamu +50% selama 2 jam.'],
  Penjahat:['beraksi','Beraksi','Dapat 20–44 NC, tapi bisa ketahuan saksi dan dilaporkan.'],
  Menteri:['rapat','Rapat negara','Kepuasan kota naik 6 jam. +25 NC dari kas.'],
  Tukang:['bantu','Bantu bangun','Pilih proyek di bawah: +16% progres, upah 25 NC.'],
  Mandor:['bantu','Awasi proyek','Pilih proyek di bawah: +11% progres, upah 30 NC.'],
};
const cdLeft = k => { const r = S.me?.cooldowns?.[k]; return r ? Math.max(0, Date.parse(r) - now()) : 0; };
const jailed = () => !!(S.me?.jail_until && Date.parse(S.me.jail_until) > now());
const hasType = (...types) => [...S.buildings.values()].some(b => b.stage === 'jadi' && types.includes(b.type));
const bname = b => b ? (b.label || catOf(b.type).n) : '';
const freeSlots = b => Math.max(0, (catOf(b.type).jobs || 0) - (b.workers || 0));
function cdBtn(act, label, key, extra, cls){ const l = cdLeft(key); return `<button class="btn ${cls || 'gold'}" data-act="${act}"${extra || ''} ${l || jailed() ? 'disabled' : ''}>${l ? esc(label) + ' · lagi ' + fmtLeft(l) : esc(label)}</button>`; }
let citT = null;
async function loadCitizens(){
  const a = sheetArg || {}; a.loading = true;
  try { a.list = await rpc('get_citizens', { p_query: a.q || '', p_filter: a.f || 'semua', p_limit: 60 }); a.err = null; }
  catch (e) { a.err = e.message; a.list = []; }
  a.loading = false; if (sheetKind === 'warga') renderSheet();
}

/* ---------- HUD ---------- */
function myVoteCount(){
  if (!registered() || !S.snap) return 0; const mv = S.me.my_votes || {}, md = S.me.my_district_votes || {};
  return (S.snap.proposals || []).filter(p => p.status === 'voting' && !(String(p.id) in mv)).length + (S.snap.district_proposals || []).filter(p => p.status === 'voting' && !(String(p.id) in md)).length;
}
function renderHudClock(){
  const h = wibHours(), day = h >= 5.5 && h < 18.5;
  const ic = day ? `<span class="ic" style="background:radial-gradient(circle at 40% 35%,#FFF3B0,#F7B733 60%,#E8833A)"></span>` : `<span class="ic" style="background:radial-gradient(circle at 65% 35%,#1D2C52 34%,transparent 36%),radial-gradient(circle,#F3F0DC,#C9C6B0)"></span>`;
  const el = $('#clock'); if (el) el.innerHTML = `${ic}<span><b class="num">${wibClock()}</b><small>WIB · ${h < 4.5 ? 'dini hari' : h < 11 ? 'pagi' : h < 15 ? 'siang' : h < 18.5 ? 'sore' : 'malam'}</small></span>`;
}
function renderHud(){
  const me = S.me, chip = $('#meChip');
  if (registered()){
    const jailed = me.jail_until && Date.parse(me.jail_until) > now();
    chip.className = 'chip'; chip.innerHTML = `<span class="av" style="background:${esc(me.color)}">${esc(initials(me.name))}</span><span class="t"><b>${esc(me.name)}</b><small><span class="coin">N</span><span class="num">${fmt(me.coins)}</span><span class="ebar" title="Energi ${me.energy}"><i style="width:${me.energy}%"></i></span>${jailed ? '<span class="tagc red">ditahan</span>' : esc(me.profession)}</small></span>`;
    chip.setAttribute('aria-label', 'Profil ' + me.name);
  } else if (S.session){
    chip.className = 'chip login-chip'; chip.innerHTML = `<span class="av">${svg('user', 20)}</span><span class="t"><b>Buat tokohmu</b><small>Satu langkah lagi</small></span>`;
  } else {
    chip.className = 'chip login-chip'; chip.innerHTML = `<span class="av">${svg('user', 20)}</span><span class="t"><b>Masuk / Daftar</b><small>Ikut bangun kota</small></span>`;
  }
  renderHudClock();
  const s = S.snap, st = s?.stats || {};
  const happy = st.happy ?? 0, hc = happy >= 60 ? '#2F8F5B' : happy >= 40 ? '#E2A21F' : '#D9483B';
  $('#stats').innerHTML = s ? `
    <button class="pill" data-open="kota"><span class="pi" style="background:#3E6FB0">${svg('people')}</span><span><small>Penduduk</small><b class="num">${fmt((st.npcs || 0) + (st.players || 0))}</b></span></button>
    <button class="pill" data-open="kota"><span class="pi" style="background:#E2A21F">${svg('coin')}</span><span><small>Kas negara</small><b class="num">${fmt(s.kas)}</b></span></button>
    <button class="pill" data-open="kota"><span class="pi" style="background:${hc}">${svg('smile')}</span><span><small>Kepuasan</small><b class="num" style="color:${hc}">${happy}%</b></span></button>` : '';
  const dn = s?.donations?.[0], db = $('#donor');
  if (dn && !S.preview){ db.hidden = false; db.dataset.act = 'open-donatur'; db.innerHTML = `<span class="dh">♥</span><span>Donatur terbaru: <b>${esc(dn.name)}</b> · ${rupiah(dn.amount)}${dn.message ? ' · “' + esc(dn.message) + '”' : ''}</span>`; } else db.hidden = true;
  const ban = $('#banner');
  if (S.preview){ ban.hidden = false; ban.innerHTML = `<span><b>Mode pratinjau.</b> Server Netizenia v2 belum terhubung, jadi kota ini contoh dan aksi dimatikan.</span>`; }
  else if (!S.session && !store.get('nz_banner_off', false) && S.snap){ ban.hidden = false; ban.innerHTML = `<span>Kamu sedang melihat kota. <b>Masuk</b> untuk punya rumah, kerja, dan ikut voting.</span><button class="btn sm gold" data-act="login">Masuk</button><button class="x" data-act="banner-off" aria-label="Tutup">${svg('x')}</button>`; }
  else ban.hidden = true;
  renderNext(); renderDock();
}
function nextStep(){
  if (S.preview || place) return null;
  if (!S.session) return { t: 'Masuk untuk ikut membangun', a: 'login', i: 'user' };
  if (!registered()) return { t: 'Buat tokohmu dulu', a: 'register', i: 'user' };
  const me = S.me;
  if (me.profession !== 'Presiden' && !me.free_house_used) return { t: 'Ambil rumah gratismu', a: 'free-house', i: 'home' };
  if (jailed()) return { t: 'Ditahan sampai ' + fmtWib(me.jail_until), a: 'open-kerja', i: 'lock' };
  const nv = myVoteCount(); if (nv) return { t: nv + ' usulan menunggu suaramu', a: 'open-voting', i: 'voting' };
  if (me.profession !== 'Presiden'){
    if (me.job && !cdLeft('shift')) return { t: 'Shift siap di ' + me.job.name, a: 'open-kerja', i: 'kerja' };
    const ms = me.missions || [], done = ms.filter(m => m.done).length;
    if (ms.length && done < ms.length) return { t: 'Misi hari ini ' + done + '/' + ms.length, a: 'open-kerja', i: 'kerja' };
  }
  const mine = [...S.buildings.values()].find(b => b.owner_id === me.id && b.stage === 'bangun' && progressOf(b) < 1);
  if (mine){ const p = progressOf(mine), left = (1 - p) * Number(mine.build_hours) * 3600000; return { t: (mine.label || catOf(mine.type).n) + ' jadi ' + fmtLeft(left) + ' lagi', a: 'goto:' + mine.id, i: 'bangun' }; }
  return null;
}
function renderNext(){ const n = nextStep(), el = $('#next'); if (!n || sheetKind || modalKind){ el.hidden = true; return; } el.hidden = false; el.dataset.act = n.a; el.innerHTML = `<span class="ni">${svg(n.i)}</span>${esc(n.t)}`; }
function renderDock(){
  if (place){ $('#dock').hidden = true; return; } $('#dock').hidden = false;
  const nv = myVoteCount();
  $('#dock').innerHTML = DOCK.map(([k, l]) => `<button type="button" data-dock="${k}" aria-pressed="${dockSel === k}"><span class="di">${svg(k)}</span>${l}${k === 'voting' && nv ? `<span class="badge">${nv}</span>` : ''}${k === 'kerja' && registered() && S.me.job && !cdLeft('shift') && !jailed() ? '<span class="badge">!</span>' : ''}${k === 'chat' && S.unread ? `<span class="badge">${S.unread > 9 ? '9+' : S.unread}</span>` : ''}</button>`).join('');
}
let tickerIdx = 0;
function rotateTicker(){
  const s = S.snap; if (!s) return; const items = [...(s.announcements || []).map(a => ({ text: 'Pengumuman Presiden: ' + a.text, ann: 1 })), ...(s.news || [])];
  if (!items.length) return; const n = items[tickerIdx++ % Math.min(items.length, 8)];
  $('#ticker').innerHTML = n.kind === 'kutipan' && n.actor ? `<b>${esc(n.actor)}:</b> “${esc(n.text)}”` : n.ann ? `<b>📢</b> ${esc(n.text)}` : esc(n.text);
}

/* ---------- panel (sheet) ---------- */
function openSheet(kind, arg){ if (kind === 'chat'){ S.unread = 0; arg = 'baru'; if (S.session && !S.chat) loadChat(); } if (kind === 'admin') setTimeout(loadQueue, 0); sheetKind = kind; sheetArg = arg; if (DOCK.some(d => d[0] === kind)) dockSel = kind; else if (kind !== 'info' && kind !== 'npc') dockSel = null; $('#sheet').hidden = false; $('#sheet').classList.remove('full'); document.body.classList.add('sheet-open'); renderSheet(); renderHud(); }
function closeSheet(){ sheetKind = null; sheetArg = null; sheetTab = null; dockSel = null; $('#sheet').hidden = true; document.body.classList.remove('sheet-open'); selMesh.visible = false; renderHud(); }
function renderSheet(toBottom){
  if (!sheetKind) return; const f = SHEETS[sheetKind]; if (!f) return; const res = f(sheetArg); if (!res) return closeSheet();
  const [title, body, sub, icon] = res; const el = $('#sheet'); const sc = el.querySelector('.sheet-b')?.scrollTop || 0;
  const focusId = document.activeElement?.id, selS = document.activeElement?.selectionStart;
  const keep = {}; el.querySelectorAll('input[id],textarea[id]').forEach(x => { if (x.value !== x.defaultValue) keep[x.id] = x.value; });
  el.innerHTML = `<div class="grab" data-grab><i></i></div><div class="sheet-h"><span class="hi" style="background:${SHEET_COLOR[sheetKind] || '#2F8F5B'}">${svg(icon || (sheetKind in ICON ? sheetKind : 'info'))}</span><h2>${title}${sub ? `<small>${sub}</small>` : ''}</h2><button class="x" data-act="close" aria-label="Tutup">${svg('x')}</button></div><div class="sheet-b">${body}</div>`;
  for (const [k, v] of Object.entries(keep)){ const x = document.getElementById(k); if (x && x.closest('#sheet')) x.value = v; }
  const sb2 = el.querySelector('.sheet-b'); sb2.scrollTop = (toBottom || (sheetKind === 'chat' && sheetArg === 'baru')) ? sb2.scrollHeight : sc; if (sheetKind === 'chat') sheetArg = null;
  if (focusId){ const f2 = document.getElementById(focusId); if (f2){ f2.focus(); try { f2.setSelectionRange(selS, selS); } catch (_) {} } }
}
function openInfo(id){ const b = S.buildings.get(id); if (!b) return; showSel(b.i, b.j, b.w, b.h); openSheet('info', id); if (!S.preview) rpc('get_building', { p_id: id }).then(x => { if (x && sheetKind === 'info' && sheetArg === id){ b.extra = x; renderSheet(); } }).catch(() => {}); }
// tarik panel di HP: ke atas = penuh, ke bawah = tutup
{ let gy = null; const sh = $('#sheet');
  sh.addEventListener('pointerdown', e => { if (e.target.closest('[data-grab]')){ gy = e.clientY; sh.setPointerCapture(e.pointerId); } });
  sh.addEventListener('pointermove', e => { if (gy === null) return; const d = e.clientY - gy; if (d > 0) sh.style.transform = `translateY(${d}px)`; });
  const up = e => { if (gy === null) return; const d = e.clientY - gy; gy = null; sh.style.transform = ''; if (d > 90) closeSheet(); else if (d < -40) sh.classList.add('full'); };
  sh.addEventListener('pointerup', up); sh.addEventListener('pointercancel', up); }

/* ---------- harga & aturan (cerminan server; server tetap penentu) ---------- */
// harga = biaya katalog + tanah 20 NC/kavling × land_mult(zona); rumah pertama gratis hanya di zona KAMPUNG/KOTA/DESA (sama dengan server)
const landPrice = (type, zone) => { const ct = catOf(type); return Math.round(20 * ct.w * ct.h * (LAND_MULT[zone || 'KAMPUNG'] || 1)); };
function priceOf(type, zone){ const ct = catOf(type); if (ct.kind === 'umum') return ct.cost; if (type === 'rumah' && registered() && !S.me.free_house_used && FREE_ZONES.includes(zone || 'KAMPUNG')) return 0; return ct.cost + landPrice(type, zone); }
const FACE_NAME = ['selatan', 'timur', 'utara', 'barat'];
function ruleErr(type, zone){
  if (!registered()) return null; const ct = catOf(type), me = S.me;
  if (me.jail_until && Date.parse(me.jail_until) > now()) return 'Kamu sedang ditahan.';
  if (ct.kind === 'umum'){ if (!isAdmin() && (me.active_proposals || 0) >= 2) return 'Maksimal 2 usulan aktif.'; return null; }
  if (me.profession === 'Presiden') return 'Presiden membangun lewat usulan umum.';
  if (ct.req && me.profession !== ct.req) return 'Khusus ' + ct.req + '.';
  if ((me.owned || 0) >= 6) return 'Maksimal 6 bangunan pribadi.';
  if (Number(me.coins) < priceOf(type, zone)) return 'Koin belum cukup.';
  return null;
}

/* ---------- gambar kecil bangunan ---------- */
const thumbs = {}; let thumbsDone = false;
function makeThumbs(){
  if (thumbsDone) return; thumbsDone = true;
  try {
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setSize(240, 180); r.setPixelRatio(1); r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.15;
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xf2f8ff, 0x7e9a62, .85)); const dl = new THREE.DirectionalLight(0xfff1d6, 1.05); dl.position.set(-30, 50, 40); sc.add(dl);
    const base = new THREE.Mesh(new THREE.BoxGeometry(1, .3, 1), new THREE.MeshLambertMaterial({ color: lin('#9DCB7D') })); sc.add(base);
    const cm = new THREE.PerspectiveCamera(30, 4 / 3, 1, 500); const glowDay = GLOWMAT.color.clone(); GLOWMAT.color.copy(lin('#9FB8C8'));
    for (const type of Object.keys(CAT)){ const ct = CAT[type]; const g = modelGeo(type, '#D9483B', '#FFF1CF'); const grp = new THREE.Group(); grp.add(new THREE.Mesh(g.body, VMAT)); if (g.glow) grp.add(new THREE.Mesh(g.glow, GLOWMAT)); sc.add(grp);
      base.scale.set(ct.w * T, 1, ct.h * T); base.position.y = -.15; const s = Math.max(ct.w, ct.h) * T, d = s * 1.85 + 9; cm.position.set(d * .62, d * .66, d * .82); cm.lookAt(0, s * .14, 0);
      r.render(sc, cm); thumbs[type] = r.domElement.toDataURL('image/png'); sc.remove(grp); }
    GLOWMAT.color.copy(glowDay); r.dispose(); r.forceContextLoss?.();
  } catch (_) {}
}

/* ---------- isi panel ---------- */
function cardHTML(type, at){
  const ct = catOf(type), zone = at ? zoneOfLot(at[0], at[1], 1, 1) : null, pr = priceOf(type, zone), err = ruleErr(type, zone), free = pr === 0 && ct.kind !== 'umum';
  const zoneBad = at && !ct.zones.includes(zone) ? 'Jenis ini tidak boleh di zona ' + zone + '.' : '';
  const meta = [`${ct.w}×${ct.h} kavling`, ct.res ? ct.res + ' jiwa' : '', ct.jobs ? ct.jobs + ' lowongan' : '', ct.hrs ? ct.hrs + ' jam bangun' : '', ct.kind !== 'umum' ? 'zona ' + ct.zones.map(z => ZONE_NAME[z] || z).join('/') : ''].filter(Boolean).join(' · ');
  return `<button class="card${free ? ' free' : ''}" data-place="${type}"${at ? ` data-at="${at.join(',')}"` : ''}${err ? ' aria-disabled="true"' : ''}>${free ? '<span class="tag">GRATIS</span>' : ''}<img class="im" src="${thumbs[type] || ''}" alt=""><b>${esc(ct.n)}</b><small>${meta}</small>${ct.req ? `<small><span class="tagc blue">khusus ${ct.req}</span></small>` : ''}<span class="pr">${free ? 'Gratis' : COIN + ' ' + fmt(pr) + (ct.kind === 'umum' ? ' <small>dari kas</small>' : zone ? ' <small>tanah ' + ZONE_NAME[zone] + '</small>' : ' <small>+ tanah per zona</small>')}</span>${err ? `<small class="hint bad">${esc(err)}</small>` : zoneBad ? `<small class="hint bad">${esc(zoneBad)}</small>` : ''}</button>`;
}
const SHEETS = {
  bangun(arg){
    makeThumbs(); const at = arg?.at || null; const tab = sheetTab || arg?.tab || (registered() && isPres() ? 'umum' : 'rumah');
    const types = Object.keys(CAT).filter(k => CAT[k].grp === tab || (tab === 'umum' && CAT[k].prop));
    const uniq = [...new Set(types)].filter(k => tab !== 'umum' || CAT[k].prop);
    let note = '';
    if (tab === 'rumah') note = registered() && !S.me.free_house_used ? '<b>Rumah Kecil pertamamu gratis</b> di zona kampung, perumahan kota, atau desa (bukan di muka jalan utama). Pilih, lalu ketuk kavling hijau di peta.' : 'Harga termasuk tanah 20 NC per kavling dikali zona (kampung ×1, kota ×1,5, ruko ×2,5, pusat bisnis ×4, desa ×0,5). Bangunan selesai sendiri sesuai jam bangun; Tukang bisa mempercepat.';
    if (tab === 'usaha') note = 'Usaha menghasilkan koin tiap jam (dihitung server). Buka lowongan supaya warga lain bisa bekerja padamu.';
    if (tab === 'umum') note = `Bangunan umum diajukan sebagai usulan dan divoting ${S.snap?.vote_hours || 24} jam. Lolos bila suara setuju lebih banyak dan minimal ${S.snap?.min_yes || 5} setuju. Biaya dari kas negara.`;
    const lim = registered() && !isPres() ? `<div class="row" style="gap:6px"><span class="tagc">Bangunan pribadi ${S.me.owned || 0}/6</span><span class="tagc">Usulan aktif ${S.me.active_proposals || 0}/2</span><span class="tagc gold">${COIN} ${fmt(S.me.coins)}</span></div>` : '';
    return [at ? 'Bangun di sini' : 'Bangun', `<div class="tabs" role="tablist">${['rumah','usaha','umum'].map(g => `<button class="tab" data-tab="${g}" aria-pressed="${tab === g}">${GROUPS[g]}</button>`).join('')}</div>${lim}<p class="note">${note}</p><div class="cards">${uniq.map(t => cardHTML(t, at)).join('')}</div>`, at ? DIST_NAME[districtOf(at[0], at[1])] + ' · blok ' + (blockOf(at[0], at[1])[0] + 1) + '-' + (blockOf(at[0], at[1])[1] + 1) + ' · zona ' + (ZONE_NAME[zoneOfLot(at[0], at[1], 1, 1)] || '') : 'Pilih bangunan, lalu kavling', 'bangun'];
  },
  info(id){
    const b = S.buildings.get(id); if (!b) return ['Bangunan', '<div class="empty">Bangunan ini sudah tidak ada.</div>'];
    const ct = catOf(b.type), me = S.me, mine = registered() && b.owner_id === me.id; let h = '';
    const owner = b.owner_kind === 'negara' ? 'Milik negara' : mine ? 'Milikmu' : 'Milik ' + (b.owner || 'warga');
    if (b.stage === 'bangun'){ const p = progressOf(b), left = (1 - p) * Number(b.build_hours) * 3600000;
      h += `<div class="prog"><div class="spread"><b>Sedang dibangun</b><b class="num">${Math.floor(p * 100)}%</b></div><div class="meter gold"><i style="width:${p * 100}%"></i></div><span class="note">${p >= 1 ? 'Selesai! Menunggu diresmikan server.' : 'Selesai sekitar ' + fmtLeft(left) + ' lagi.'}</span></div>`;
      if (registered() && !isPres()) h += `<button class="btn gold wide" data-act="help" data-id="${b.id}">Bantu bangun ${me.profession === 'Tukang' ? '(+16%, upah 25 NC)' : me.profession === 'Mandor' ? '(+11%, upah 30 NC)' : '(+5%)'}</button>`;
    }
    if (b.proposal && (b.stage === 'sketsa' || b.stage === 'disetujui')){ const pr = b.proposal, tot = pr.yes + pr.no || 1, left = Date.parse(pr.ends_at) - now(), my = registered() ? (S.me.my_votes || {})[pr.id] ?? pr.my_vote : null, cost = pr.cost - Math.round(pr.cost * pr.discount);
      h += `<div class="prog"><div class="spread"><b>${pr.status === 'menunggu_kas' ? 'Disetujui, menunggu kas negara' : 'Usulan sedang divoting'}</b><span class="note">${pr.status === 'voting' ? (left > 0 ? 'sisa ' + fmtLeft(left) : 'menunggu penghitungan') : ''}</span></div>
        <div class="vote-bar"><i style="width:${pr.yes / tot * 100}%;background:var(--green)"></i><i style="width:${pr.no / tot * 100}%;background:var(--red)"></i></div>
        <div class="spread"><span style="color:var(--green)">▲ ${pr.yes} setuju</span><span style="color:var(--red)">▼ ${pr.no} tolak</span></div>
        <span class="note">Diusulkan ${esc(pr.proposer || 'warga')} · biaya kas ${nc(cost)}${pr.discount ? ' (hemat 10% berkat arsitek)' : ''}. Lolos bila setuju &gt; tolak dan minimal ${S.snap?.min_yes || 5} setuju.</span></div>`;
      if (pr.status === 'voting') h += registered() ? `<div class="row"><button class="btn green" data-act="vote" data-id="${pr.id}" data-v="1" ${my === 1 ? 'disabled' : ''}>${my === 1 ? '✓ Kamu setuju' : 'Setuju'}</button><button class="btn red" data-act="vote" data-id="${pr.id}" data-v="-1" ${my === -1 ? 'disabled' : ''}>${my === -1 ? '✓ Kamu menolak' : 'Tolak'}</button></div>` : `<button class="btn gold wide" data-act="login">Masuk untuk memberi suara</button>`;
      if (isAdmin()) h += `<div class="row"><button class="btn dark" data-act="pres-approve" data-id="${pr.id}">Setujui (presiden)</button><button class="btn redfill" data-act="pres-veto" data-id="${pr.id}">Veto</button></div>`;
    }
    const zone = b.zone || zoneOfLot(b.i, b.j, b.w, b.h), floors = b.floors || floorsFor(b.type, ringOf(b.i, b.j), lotClass(b.i, b.j, b.w, b.h)), fc = facingOfB(b);
    h += `<dl class="kv"><dt>Pemilik</dt><dd>${esc(owner)}</dd><dt>Distrik</dt><dd>${esc(DIST_NAME[b.d] || '')}</dd><dt>Ukuran</dt><dd>${b.w}×${b.h} kavling · hadap ${FACE_NAME[fc]}</dd><dt>Zona</dt><dd>${esc(ZONE_NAME[zone] || zone)} <small class="note">(${esc(zone)})</small></dd><dt>Lantai</dt><dd>${floors}</dd>${ct.kind === 'pribadi' ? `<dt>Harga tanah</dt><dd>${nc(landPrice(b.type, zone))}</dd>` : ''}${ct.res ? `<dt>Daya tampung</dt><dd>${ct.res} jiwa</dd>` : ''}${ct.jobs ? `<dt>Pekerja</dt><dd>${(b.workers || 0) + (b.npc_staff || 0)} / ${ct.jobs}</dd>` : ''}${ct.jobs && b.stage === 'jadi' ? `<dt>Gaji per shift</dt><dd>${nc(b.wage || 30)}</dd>` : ''}</dl>`;
    const res = b.extra?.residents; if (res && res.length) h += `<div class="lab">Penghuni</div><p class="note">${res.map(esc).join(', ')}</p>`;
    if (ct.jobs && b.stage === 'jadi' && registered()){
      const myJob = S.me.job && S.me.job.building_id === b.id, free = freeSlots(b);
      if (myJob) h += `<div class="row">${cdBtn('shift', 'Masuk kerja', 'shift')}<button class="btn" data-act="quit">Berhenti</button></div>`;
      else if (mine || (b.owner_kind === 'negara' && isAdmin())) h += manageHTML(b);
      else if (!isPres()){ const bad = ct.jobProf && S.me.profession !== ct.jobProf ? 'Khusus ' + ct.jobProf : !b.job_open ? 'Lowongan ditutup' : !free ? 'Lowongan penuh' : '';
        h += `<button class="btn gold wide" data-act="apply" data-id="${b.id}" ${bad || jailed() ? 'disabled' : ''}>${bad ? esc(bad) : 'Lamar kerja · ' + nc(b.wage || 30) + '/shift · ' + free + ' kursi'}</button>`; }
    }
    if (b.type === 'rs' && b.stage === 'jadi' && registered() && S.me.health < 100) h += `<button class="btn" data-act="treat">Berobat di sini (20 NC)</button>`;
    h += `<div class="row"><button class="btn" data-act="goto" data-id="${b.id}">Lihat dari dekat</button>${mine && b.stage !== 'sketsa' && !b.protected ? `<button class="btn red" data-act="demolish" data-id="${b.id}">Bongkar</button>` : ''}</div>`;
    return [esc(b.label || ct.n), h, esc(owner), 'info'];
  },
  voting(){
    const s = S.snap || {}, mv = S.me?.my_votes || {}, md = S.me?.my_district_votes || {};
    let h = `<p class="note">1 akun 1 suara, voting ${s.vote_hours || 24} jam. Lolos bila setuju lebih banyak dan minimal ${s.min_yes || 5} setuju. Rumah dan usaha pribadi tidak perlu voting.</p>`;
    const props = (s.proposals || []), dps = (s.district_proposals || []);
    if (!props.length && !dps.length) h += `<div class="empty">Belum ada usulan. Ajukan bangunan umum lewat menu Bangun → Usulan umum.</div>`;
    h += '<div class="list">' + props.map(p => { const my = mv[p.id], left = Date.parse(p.ends_at) - now(), tot = p.yes + p.no || 1;
      return `<div class="item" style="flex-direction:column;align-items:stretch;gap:8px"><div style="display:flex;gap:10px;align-items:center"><img src="${thumbs[p.type] || ''}" alt="" style="width:52px;height:40px;border-radius:9px;object-fit:cover;background:#E7F2E0;flex:none"><div class="grow"><b>${esc(p.name)}${p.status === 'menunggu_kas' ? '<span class="tagc gold">menunggu kas</span>' : ''}</b><small>${esc(p.proposer)} · ${nc(p.cost - Math.round(p.cost * (p.discount || 0)))} · ${p.status === 'voting' ? (left > 0 ? 'sisa ' + fmtLeft(left) : 'dihitung') : 'disetujui'}</small></div><button class="btn sm" data-act="goto-b" data-id="${p.building_id}">Lihat</button></div>
        <div class="vote-bar"><i style="width:${p.yes / tot * 100}%;background:var(--green)"></i><i style="width:${p.no / tot * 100}%;background:var(--red)"></i></div>
        ${p.status === 'voting' ? `<div class="row"><button class="btn sm green" data-act="vote" data-id="${p.id}" data-v="1" ${my === 1 ? 'disabled' : ''}>▲ ${p.yes} ${my === 1 ? '· kamu' : 'Setuju'}</button><button class="btn sm red" data-act="vote" data-id="${p.id}" data-v="-1" ${my === -1 ? 'disabled' : ''}>▼ ${p.no} ${my === -1 ? '· kamu' : 'Tolak'}</button></div>` : ''}</div>`; }).join('')
      + dps.map(d => { const my = md[d.id], left = Date.parse(d.ends_at) - now(), tot = d.yes + d.no || 1;
      return `<div class="item" style="flex-direction:column;align-items:stretch;gap:8px"><div class="grow"><b>Buka ${esc(d.name)}${d.status === 'menunggu_kas' ? '<span class="tagc gold">menunggu kas</span>' : ''}</b><small>${esc(d.proposer)} · ${nc(d.cost)} · ${d.status === 'voting' ? (left > 0 ? 'sisa ' + fmtLeft(left) : 'dihitung') : 'disetujui'}</small></div>
        <div class="vote-bar"><i style="width:${d.yes / tot * 100}%;background:var(--green)"></i><i style="width:${d.no / tot * 100}%;background:var(--red)"></i></div>
        ${d.status === 'voting' ? `<div class="row"><button class="btn sm green" data-act="dvote" data-id="${d.id}" data-v="1" ${my === 1 ? 'disabled' : ''}>▲ ${d.yes} ${my === 1 ? '· kamu' : 'Setuju'}</button><button class="btn sm red" data-act="dvote" data-id="${d.id}" data-v="-1" ${my === -1 ? 'disabled' : ''}>▼ ${d.no} ${my === -1 ? '· kamu' : 'Tolak'}</button></div>` : ''}${isAdmin() ? `<button class="btn sm dark" data-act="pres-dist" data-d="${d.district}">Buka sekarang (presiden)</button>` : ''}</div>`; }).join('') + '</div>';
    const closed = (s.districts || []).filter(d => !d.open && !dps.some(p => p.district === d.key));
    if (closed.length) h += `<div class="lab">Usulkan distrik baru</div><div class="list">${closed.map(d => `<div class="item"><span class="hi" style="width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:#5C8C4A">${svg('lock', 18).replace('<svg', '<svg style="stroke:#fff;fill:none;stroke-width:2"')}</span><div class="grow"><b>${esc(d.name)}</b><small>${d.ring === 2 || distRing(d.key) === 2 ? 'Desa (sawah & kebun)' : 'Kampung'} · biaya kas ${nc(d.cost)}</small></div><div class="acts"><button class="btn sm" data-act="goto-d" data-d="${d.key}">Lihat</button><button class="btn sm gold" data-act="propose-dist" data-d="${d.key}">Usulkan</button></div></div>`).join('')}</div>`;
    return ['Voting rakyat', h, 'Usulan bangunan umum dan distrik', 'voting'];
  },
  kota(){
    const s = S.snap || {}, st = s.stats || {}, cov = st.cov || {}; const bar = (l, v) => `<span>${l}</span><span class="meter"><i style="width:${Math.round((v || 0) * 100)}%"></i></span><span class="p">${Math.round((v || 0) * 100)}%</span>`;
    let h = `<div class="row" style="gap:10px;flex-wrap:nowrap">${[['Penduduk', fmt((st.npcs || 0) + (st.players || 0)), '#3E6FB0'], ['Pemain', fmt(st.players || 0), '#2F8F5B'], ['Kas', fmt(s.kas || 0), '#E2A21F']].map(([l, v, c]) => `<div style="flex:1;background:var(--panel2);border-radius:14px;padding:10px 12px"><small class="note">${l}</small><div class="big num" style="color:${c}">${v}</div></div>`).join('')}</div>`;
    h += `<div class="lab">Layanan untuk rumah warga</div><div class="bars">${bar('Pendidikan', cov.sekolah)}${bar('Kesehatan', cov.rs)}${bar('Keamanan', cov.polisi)}${bar('Taman', cov.taman)}${bar('Lapangan kerja', cov.kerja)}</div><dl class="kv"><dt>Warga dari komen</dt><dd>${fmt(st.npcs || 0)}</dd><dt>Pemain terdaftar</dt><dd>${fmt(st.players || 0)}</dd><dt>Daya tampung rumah</dt><dd>${fmt(st.pop || 0)} jiwa</dd><dt>Rumah berdiri</dt><dd>${fmt(st.houses || 0)}</dd></dl><p class="note">Daya tampung rumah dipakai untuk menghitung ramainya dagang. Rumah terlayani bila ada fasilitas dalam jarak 9 kavling. Pajak ${s.tax ?? 10}%; di atas 10% menurunkan kepuasan.</p>`;
    const RING_L = ['Pusat', 'Ring 1', 'Ring 2'];
    h += `<div class="lab">Distrik (${(s.districts || []).length})</div><div class="list">${(s.districts || []).map(d => { const ring = d.ring ?? distRing(d.key); return `<div class="item"><div class="grow"><b>${esc(d.name)}</b><small>${esc(d.key)} · ${RING_L[ring] || ''}</small></div><div class="acts"><button class="btn sm" data-act="goto-d" data-d="${esc(d.key)}">Lihat</button><span class="tagc ${d.open ? 'green' : ''}">${d.open ? 'Terbuka' : 'Tertutup · ' + nc(d.cost)}</span></div></div>`; }).join('')}</div>`;
    if ((s.announcements || []).length) h += `<div class="lab">Pengumuman presiden</div><div class="list">${s.announcements.map(a => `<div class="item"><div class="grow"><b style="white-space:normal">📢 ${esc(a.text)}</b><small>${fmtAgo(a.at)}</small></div></div>`).join('')}</div>`;
    h += `<div class="lab">Kabar kota</div><div class="list">${(s.news || []).slice(0, 12).map(n => `<div class="item"><div class="grow"><b style="white-space:normal;font-weight:800">${n.kind === 'kutipan' && n.actor ? esc(n.actor) + ': “' + esc(n.text) + '”' : esc(n.text)}</b>${n.at ? `<small>${fmtAgo(n.at)}</small>` : ''}</div></div>`).join('') || '<div class="empty">Belum ada kabar.</div>'}</div>`;
    const dtot = s.donation_total || 0;
    h += `<div class="lab">Donatur</div><div class="goal"><div class="spread" style="display:flex;justify-content:space-between"><b>${rupiah(dtot)} terkumpul</b><span class="note">${(s.donations || []).length} donatur terbaru</span></div>${s.donation_goal ? `<div class="meter gold"><i style="width:${Math.min(100, dtot / s.donation_goal * 100)}%"></i></div><span class="note">Target ${rupiah(s.donation_goal)}</span>` : ''}<button class="btn gold" data-act="open-donatur">Papan donatur</button></div>`;
    h += `<div class="lab">Grafik</div><div class="row"><span class="note" style="flex:1">${hematOn ? 'Mode hemat: tanpa bayangan, resolusi rendah, pejalan kaki lebih sedikit. Cocok untuk HP lama.' : 'Grafik penuh: bayangan, sungai beriak, kota ramai.'}</span><button class="btn sm" data-act="hemat" data-v="${hematOn ? 0 : 1}">${hematOn ? 'Pakai grafik penuh' : 'Pakai mode hemat'}</button></div>`;
    h += `<div class="row"><button class="btn" data-act="open-warga" data-f="semua">Daftar warga</button><button class="btn" data-act="profil">${registered() ? 'Profil & ganti profesi' : 'Masuk / Daftar'}</button>${isAdmin() ? '<button class="btn dark" data-act="open-admin">Panel presiden</button>' : ''}</div>`;
    return ['Kota', h, 'Republik Netizenia', 'kota'];
  },
  kerja(){
    if (!registered()) return ['Kerja', `<div class="empty">Masuk dulu untuk bekerja, menjalankan profesi, dan mengambil misi harian.</div><button class="btn gold wide" data-act="login">Masuk / Daftar</button>`, 'Pekerjaan dan profesi', 'kerja'];
    const me = S.me, pa = PROF_ACT[me.profession]; let h = '';
    if (jailed()) h += `<div class="prog" style="background:#FDE7E4"><b>Kamu sedang ditahan</b><span class="note">Bebas ${fmtWib(me.jail_until)} (${fmtLeft(Date.parse(me.jail_until) - now())} lagi). Selama ditahan kamu tidak bisa bekerja, beraksi, atau memberi suara.</span></div>`;
    h += `<dl class="kv"><dt>Profesi</dt><dd>${esc(me.profession)}</dd><dt>Energi</dt><dd><span class="ebar" style="width:70px;vertical-align:middle"><i style="width:${me.energy}%"></i></span> ${me.energy}/100</dd><dt>Kesehatan</dt><dd>${me.health}/100</dd><dt>Koin dari aksi hari ini</dt><dd>${fmt(me.earned_today || 0)} / ${fmt(me.daily_cap || 300)} NC</dd>${me.reports_on_me ? `<dt>Dilaporkan</dt><dd style="color:var(--red)">${me.reports_on_me} akun</dd>` : ''}</dl>`;
    if (me.profession === 'Presiden') h += `<p class="note">Presiden tidak bekerja dan tidak mengambil misi. Pantau warga dan tahanan lewat daftar Warga.</p><button class="btn" data-act="open-warga" data-f="lapor">Daftar warga dilaporkan</button>`;
    else {
      h += `<div class="lab">Pekerjaanmu</div>`;
      if (me.job){ h += `<div class="prog"><div class="spread"><b>${esc(me.job.name)}</b><span class="note">${esc(me.job.owner)}</span></div><span class="note">Gaji ${nc(me.job.wage)} per shift (4 jam, energi 20). ${me.job.state ? 'Gaji negara dibayar kas bertahap tiap jam.' : 'Dibayar pemilik saat shift, dipotong pajak.'}</span></div>
          <div class="row">${cdBtn('shift', 'Masuk kerja', 'shift')}<button class="btn" data-act="goto" data-id="${me.job.building_id}">Lihat</button><button class="btn red" data-act="quit">Berhenti</button></div>`; }
      else h += `<p class="note">Belum bekerja. Lamar lowongan di bawah, atau kerja serabutan 12 NC tiap 2 jam (energi 15).</p><div class="row">${cdBtn('odd', 'Kerja serabutan · +12 NC', 'serabutan')}</div>`;
      if (pa){ h += `<div class="lab">Aksi profesi · ${esc(me.profession)}</div><p class="note">${esc(pa[2])} Jeda 1 jam, energi 10.</p>`;
        const [k, label] = pa;
        if (k === 'bantu'){ const sites = [...S.buildings.values()].filter(b => b.stage === 'bangun' && progressOf(b) < 1).sort((a, b) => progressOf(b) - progressOf(a)).slice(0, 12);
          h += sites.length ? `<div class="list">${sites.map(b => `<div class="item"><div class="grow"><b>${esc(bname(b))}</b><small>${Math.floor(progressOf(b) * 100)}% · ${b.owner_kind === 'negara' ? 'negara' : esc(b.owner || 'warga')}</small></div><div class="acts"><button class="btn sm" data-act="goto" data-id="${b.id}">Lihat</button>${cdBtn('help', 'Bantu', 'bantu', ` data-id="${b.id}"`, 'sm gold')}</div></div>`).join('')}</div>` : '<div class="empty">Tidak ada proyek yang sedang dibangun di distrik yang dimuat.</div>'; }
        else if (k === 'rancang'){ const ps = (S.snap?.proposals || []).filter(p => p.status === 'voting' && !p.discount);
          h += ps.length ? `<div class="list">${ps.map(p => `<div class="item"><div class="grow"><b>${esc(p.name)}</b><small>${nc(p.cost)} → ${nc(Math.round(p.cost * .9))}</small></div>${cdBtn('rancang', 'Rancang', 'aksi', ` data-id="${p.id}"`, 'sm gold')}</div>`).join('')}</div>` : '<div class="empty">Tidak ada usulan yang bisa dirancang ulang.</div>'; }
        else if (k === 'ajar' || k === 'obati' || k === 'tangkap'){ h += `<div class="row"><button class="btn gold" data-act="open-warga" data-f="${k === 'obati' ? 'sakit' : k === 'tangkap' ? 'lapor' : 'semua'}">${esc(label)}: pilih warga</button></div>${cdLeft('aksi') ? `<p class="note">Aksi berikutnya ${fmtLeft(cdLeft('aksi'))} lagi.</p>` : ''}`; }
        else h += `<div class="row">${cdBtn('pact', label, 'aksi', ` data-k="${k}"`)}</div>`;
      }
      if (me.health < 100) h += `<div class="row"><button class="btn" data-act="treat">Berobat di RS · 20 NC</button></div>`;
      const ms = me.missions || [];
      if (ms.length) h += `<div class="lab">Misi hari ini · +40 NC tiap misi</div><div class="steps">${ms.map((m, i) => `<div class="step${m.done ? ' done' : ''}"><span class="sn">${m.done ? '✓' : i + 1}</span><span class="grow"><b>${esc(m.label)}</b><small>${m.done ? 'Selesai' : 'Belum'}</small></span></div>`).join('')}</div><p class="note">Misi berganti tiap tengah malam WIB. Hadiah misi ikut dihitung dalam batas harian 300 NC.</p>`;
    }
    const mineBiz = [...S.buildings.values()].filter(b => b.owner_id === me.id && catOf(b.type).jobs && b.stage === 'jadi');
    if (mineBiz.length) h += `<div class="lab">Usaha milikmu</div><div class="list">${mineBiz.map(b => `<div class="item" style="flex-direction:column;align-items:stretch"><div class="spread" style="display:flex;justify-content:space-between"><b>${esc(bname(b))}</b><span class="note">${b.workers || 0}/${catOf(b.type).jobs} pekerja</span></div>${manageHTML(b)}</div>`).join('')}</div>`;
    if (me.profession !== 'Presiden'){
      const vac = [...S.buildings.values()].filter(b => b.stage === 'jadi' && catOf(b.type).jobs && b.job_open !== false && freeSlots(b) > 0 && b.owner_id !== me.id && (!me.job || me.job.building_id !== b.id))
        .sort((a, b) => (b.wage || 30) - (a.wage || 30)).slice(0, 20);
      h += `<div class="lab">Lowongan kerja (${vac.length})</div><div class="list">${vac.length ? vac.map(b => { const jp = catOf(b.type).jobProf, ok = !jp || jp === me.profession;
        return `<div class="item"><div class="grow"><b>${esc(bname(b))}${jp ? `<span class="tagc blue">${jp}</span>` : ''}</b><small>${b.owner_kind === 'negara' ? 'Negara' : esc(b.owner || 'warga')} · ${nc(b.wage || 30)}/shift · ${freeSlots(b)} kursi</small></div><div class="acts"><button class="btn sm" data-act="goto" data-id="${b.id}">Lihat</button><button class="btn sm gold" data-act="apply" data-id="${b.id}" ${ok && !jailed() ? '' : 'disabled'}>Lamar</button></div></div>`; }).join('') : '<div class="empty">Belum ada lowongan di distrik yang dimuat.</div>'}</div>`;
    }
    h += `<div class="row"><button class="btn" data-act="open-warga" data-f="semua">Daftar warga</button></div>`;
    return ['Kerja', h, esc(me.profession) + ' · ' + COIN.replace('class="coin"', 'class="coin" style="vertical-align:-2px"') + ' ' + fmt(me.coins), 'kerja'];
  },
  warga(a){
    a = a || (sheetArg = { f: 'semua', q: '' }); if (!a.list && !a.loading && !a.err) { loadCitizens(); }
    const me = S.me, f = a.f || 'semua';
    let h = `<div class="field"><input id="wq" placeholder="Cari nama atau profesi" value="${esc(a.q || '')}" autocomplete="off"></div><div class="tabs">${[['semua','Semua'],['sakit','Sedang sakit'],['lapor','Dilaporkan']].map(([k, l]) => `<button class="tab" data-wtab="${k}" aria-pressed="${f === k}">${l}</button>`).join('')}</div>`;
    if (!registered()) return ['Warga', h + `<div class="empty">Masuk dulu untuk melihat daftar warga.</div>`, '', 'people'];
    const pk = PROF_ACT[me.profession]?.[0]; const cdA = cdLeft('aksi');
    if (pk === 'obati' || pk === 'tangkap' || pk === 'ajar') h += `<p class="note">${pk === 'obati' ? 'Ketuk Obati pada warga yang sakit.' : pk === 'tangkap' ? 'Tangkap hanya bisa untuk warga yang dilapor minimal 2 akun selain kamu.' : 'Ketuk Ajar pada warga yang ingin kamu ajar.'}${cdA ? ' Aksi berikutnya ' + fmtLeft(cdA) + ' lagi.' : ''}</p>`;
    if (a.loading && !a.list) return ['Warga', h + '<div class="empty">Memuat warga…</div>', 'Cari dan bantu warga lain', 'people'];
    if (a.err) return ['Warga', h + `<div class="empty">${esc(a.err)}</div>`, '', 'people'];
    const rows = (a.list || []).map(x => { const acts = [], npc = x.kind === 'npc', tgt = npc ? ` data-n="${x.id}"` : ` data-u="${x.id}"`, dis = cdA || jailed() ? 'disabled' : '';
      if (pk === 'obati' && x.sick) acts.push(`<button class="btn sm gold" data-act="pact-t" data-k="obati"${tgt} ${dis}>Obati</button>`);
      if (pk === 'ajar') acts.push(`<button class="btn sm" data-act="pact-t" data-k="ajar"${tgt} ${dis}>Ajar</button>`);
      if (!npc && pk === 'tangkap' && x.reports >= 2 && !x.jailed) acts.push(`<button class="btn sm gold" data-act="pact-t" data-k="tangkap"${tgt} ${dis}>Tangkap</button>`);
      if (!npc && !isPres() && !x.i_reported && x.prof !== 'Presiden') acts.push(`<button class="btn sm red" data-act="report" data-u="${x.id}" ${jailed() ? 'disabled' : ''}>Lapor</button>`);
      if (!npc && isAdmin()){ if (x.jailed) acts.push(`<button class="btn sm dark" data-act="release" data-u="${x.id}">Bebaskan</button>`); if (x.prof === 'Menteri') acts.push(`<button class="btn sm" data-act="minister" data-u="${x.id}" data-on="0">Copot Menteri</button>`); else if (x.prof !== 'Presiden') acts.push(`<button class="btn sm" data-act="minister" data-u="${x.id}" data-on="1">Angkat Menteri</button>`); }
      return `<div class="item"><span class="av" style="width:34px;height:34px;font-size:12px;background:${esc(x.color || profColor(x.prof))}">${esc(initials(x.name))}</span><div class="grow"${npc ? ` data-act="npc-open" data-n="${x.id}" style="cursor:pointer"` : ''}><b>${esc(x.name)}${npc ? ' <span class="tagc">lihat</span>' : ''}</b><small>${esc(x.prof)}${npc ? ' · warga komen' : x.job ? ' · kerja di ' + esc(x.job) : ''}${x.sick ? ' <span class="tagc red">sakit</span>' : ''}${x.reports ? ` <span class="tagc red">${x.reports} laporan</span>` : ''}${x.jailed ? ' <span class="tagc">ditahan</span>' : ''}${x.i_reported ? ' <span class="tagc">sudah kamu lapor</span>' : ''}</small></div><div class="acts">${acts.join('')}</div></div>`; });
    h += `<div class="list">${rows.length ? rows.join('') : '<div class="empty">Tidak ada warga yang cocok.</div>'}</div><p class="note">Laporan dari akun berbeda menumpuk; polisi bisa menangkap setelah 2 akun lain melapor. Maksimal 5 laporan per hari.</p>`;
    return ['Warga', h, f === 'sakit' ? 'Warga yang sedang sakit' : f === 'lapor' ? 'Warga yang dilaporkan' : 'Cari dan bantu warga lain', 'people'];
  },
  chat(){
    const list = (S.session && S.chat) ? S.chat : (S.snap?.chat || []), myName = S.me?.name;
    let h = `<div class="chatlist">${list.length ? list.map(m => `<div class="msg${m.name === myName ? ' me' : ''}"><span class="av" style="width:30px;height:30px;font-size:11px;background:${profColor(m.prof)}">${esc(initials(m.name))}</span><div class="bub"><b>${esc(m.name)}${m.prof ? ` <small>${esc(m.prof)}</small>` : ''}<small>${m.at ? fmtAgo(m.at) : ''}</small></b><span>${esc(m.text)}</span>${isAdmin() ? ` <button class="btn sm red" style="min-height:26px;padding:2px 8px;margin-top:4px" data-act="chat-del" data-id="${m.id}">Hapus</button>` : ''}</div></div>`).join('') : '<div class="empty">Belum ada pesan. Sapa warga duluan!</div>'}</div>`;
    const wait = Math.max(0, 5000 - (Date.now() - chatSentAt));
    h += registered() ? `<p class="note">Nama otomatis dari tokohmu. Satu pesan tiap 5 detik. Pesan lebih dari 7 hari terhapus otomatis.</p><div class="chatdock"><span class="hint${chatHint ? ' bad' : ''}" id="chatHint" role="status" aria-live="assertive">${chatHint ? esc(chatHint) : wait ? 'Bisa kirim lagi dalam ' + Math.ceil(wait / 1000) + ' detik.' : ''}</span><form class="chatbar" id="chatForm" autocomplete="off"><input id="cmsg" maxlength="200" placeholder="Tulis pesan untuk semua warga" aria-label="Pesan"><button class="btn gold" type="submit">Kirim</button></form></div>`
      : `<button class="btn gold wide" data-act="${S.session ? 'register' : 'login'}">${S.session ? 'Buat tokoh untuk ikut ngobrol' : 'Masuk untuk ikut ngobrol'}</button>`;
    return ['Pesan rakyat', h, S.session ? 'Langsung, untuk warga yang masuk' : 'Pesan terbaru', 'chat'];
  },
  donatur(){
    const s = S.snap || {}, list = s.donations || [], tot = s.donation_total || 0; let h = '';
    h += s.saweria_url ? `<a class="btn gold wide" href="${esc(s.saweria_url)}" target="_blank" rel="noopener" style="text-decoration:none">Dukung lewat Saweria</a>` : `<p class="note">Tautan Saweria belum dipasang presiden.</p>`;
    h += `<div class="goal"><div class="spread" style="display:flex;justify-content:space-between"><b class="big" style="font-size:22px">${rupiah(tot)}</b><span class="note">terkumpul</span></div>${s.donation_goal ? `<div class="meter gold"><i style="width:${Math.min(100, tot / s.donation_goal * 100)}%"></i></div><span class="note">${Math.floor(tot / s.donation_goal * 100)}% dari target ${rupiah(s.donation_goal)}</span>` : ''}</div>`;
    h += `<p class="note">Donasi dicatat manual oleh presiden dan tidak menghasilkan koin di dalam game. Tiap Rp1.000 membuat awan emas bernama donatur melayang di atas kota selama 1 jam.</p>`;
    h += `<div class="list">${list.length ? list.map(d => `<div class="item"><span class="av" style="width:34px;height:34px;background:linear-gradient(135deg,#FFE18A,#F2B531);color:#5A3E00">♥</span><div class="grow"><b>${esc(d.name)} · ${rupiah(d.amount)}</b><small>${fmtAgo(d.at)}</small>${d.message ? `<small style="white-space:normal;color:var(--ink)">“${esc(d.message)}”</small>` : ''}</div>${isAdmin() ? `<button class="btn sm red" data-act="adm-don-del" data-id="${d.id}">Hapus</button>` : ''}</div>`).join('') : '<div class="empty">Belum ada donatur. Jadilah yang pertama!</div>'}</div>`;
    if (isAdmin()) h += `<button class="btn dark" data-act="open-admin">Catat donasi baru (panel presiden)</button>`;
    return ['Papan donatur', h, 'Terima kasih para pendukung', 'heart'];
  },
  admin(a){
    if (!isAdmin()) return ['Panel presiden', '<div class="empty">Khusus presiden.</div>', '', 'shield'];
    a = a || {}; const q = a.queue, s = S.snap || {}; let h = '';
    h += `<div class="lab">Antrean klaim tokoh</div>` + (!q ? '<div class="empty">Memuat…</div>' : q.claims.length ? `<div class="list">${q.claims.map(c => `<div class="item"><div class="grow"><b>${esc(c.name)}</b><small>${c.linked ? 'Akun: ' + esc(c.account || '-') + (c.username ? ' (@' + esc(c.username) + ')' : '') : 'Klaim lama tanpa akun'}${c.ig ? ' · IG @' + esc(c.ig) : ''}</small>${c.note ? `<small style="white-space:normal">“${esc(c.note)}”</small>` : ''}</div><div class="acts"><button class="btn sm green" data-act="adm-claim" data-id="${c.id}" data-v="1">Setujui</button><button class="btn sm red" data-act="adm-claim" data-id="${c.id}" data-v="0">Tolak</button></div></div>`).join('')}</div>` : '<div class="empty">Tidak ada klaim menunggu.</div>');
    h += `<div class="lab">Permintaan hapus nama</div>` + (!q ? '' : q.optouts.length ? `<div class="list">${q.optouts.map(o => `<div class="item"><div class="grow"><b>${esc(o.name)}</b><small>Dari ${esc(o.account || 'akun tanpa tokoh')}${o.reason ? ' · “' + esc(o.reason) + '”' : ''}</small></div><div class="acts"><button class="btn sm green" data-act="adm-optout" data-id="${o.id}" data-v="1">Hapus nama</button><button class="btn sm red" data-act="adm-optout" data-id="${o.id}" data-v="0">Tolak</button></div></div>`).join('')}</div>` : '<div class="empty">Tidak ada permintaan.</div>');
    h += `<div class="lab">Tahanan</div>` + (!q ? '' : q.jailed.length ? `<div class="list">${q.jailed.map(j => `<div class="item"><div class="grow"><b>${esc(j.name)}</b><small>Bebas ${fmtWib(j.until)}</small></div><button class="btn sm dark" data-act="release" data-u="${j.id}">Bebaskan</button></div>`).join('')}</div>` : '<div class="empty">Penjara kosong.</div>');
    h += `<div class="lab">Pajak & pengumuman</div><div class="field"><label for="atax">Tarif pajak (0–30%, sekarang ${s.tax ?? 10}%). Di atas 10% menurunkan kepuasan.</label><div class="stepper"><button class="btn" type="button" data-act="tax-step" data-d="-1" aria-label="Kurangi 1%">−1</button><input id="atax" type="number" inputmode="numeric" min="0" max="30" step="1" value="${s.tax ?? 10}"><button class="btn" type="button" data-act="tax-step" data-d="1" aria-label="Tambah 1%">+1</button><span class="note">%</span></div></div><button class="btn" data-act="adm-tax">Simpan pajak</button>
      ${(s.announcements || []).length ? `<div class="list">${s.announcements.map(a => `<div class="item"><div class="grow"><b style="white-space:normal">📢 ${esc(a.text)}</b><small>${fmtAgo(a.at)}</small></div><button class="btn sm red" data-act="adm-ann-del" data-id="${a.id}">Hapus</button></div>`).join('')}</div>` : '<p class="note">Belum ada pengumuman aktif. Pengumuman yang disiarkan muncul di sini dengan tombol Hapus.</p>'}
      <div class="field"><label for="aann">Pengumuman untuk seluruh rakyat</label><textarea id="aann" maxlength="160" placeholder="Maks 160 karakter"></textarea></div><button class="btn gold" data-act="adm-ann">Siarkan</button>`;
    h += `<div class="lab">Catat donasi Saweria</div><div class="field"><label for="dnm">Nama donatur</label><input id="dnm" maxlength="40"></div><div class="field"><label for="damt">Nominal (Rupiah)</label><input id="damt" type="number" inputmode="numeric" min="0" step="1000" placeholder="mis. 50000"></div><div class="field"><label for="dmsg">Pesan (opsional)</label><input id="dmsg" maxlength="200"></div><button class="btn gold" data-act="adm-don-add">Catat donasi</button>
      <div class="field"><label for="dgoal">Target donasi (Rupiah, 0 = tanpa target)</label><input id="dgoal" type="number" inputmode="numeric" min="0" value="${s.donation_goal || 0}"></div><button class="btn" data-act="adm-goal">Simpan target</button>
      <div class="field"><label for="dsaw">Tautan Saweria</label><input id="dsaw" placeholder="https://saweria.co/namakamu" value="${esc(s.saweria_url || '')}"></div><button class="btn" data-act="adm-saweria">Simpan tautan</button>`;
    h += `<div class="lab">Alat</div><p class="note">Voting, gaji negara, dan pendapatan usaha dihitung otomatis tiap jam. Tombol ini menjalankannya sekarang (ekonomi tetap sekali per jam).</p><button class="btn" data-act="adm-tick">Hitung sekarang</button>${a.tick ? `<p class="note"><b>Terakhir dihitung ${esc(a.tick.at)}:</b> ${a.tick.usulan_ditutup || 0} usulan ditutup, ${a.tick.selesai_dibangun || 0} bangunan selesai, gaji negara dibayar ${a.tick.gaji_negara_dibayar || 0} kali, ekonomi ${a.tick.ekonomi_jalan ? 'dihitung' : 'sudah dihitung jam ini'}.</p>` : ''}`;
    return ['Panel presiden', h, 'Republik Netizenia', 'shield'];
  },
  profil(){
    if (!registered()) return ['Profil', `<div class="empty">Masuk dulu untuk punya tokoh.</div><button class="btn gold wide" data-act="login">Masuk / Daftar</button>`, '', 'user'];
    const me = S.me; const home = me.home_building_id && S.buildings.get(me.home_building_id);
    let h = `<div class="row" style="flex-wrap:nowrap;gap:12px"><span class="av" style="width:58px;height:58px;font-size:20px;border-radius:18px;background:${esc(me.color)}">${esc(initials(me.name))}</span><div class="grow" style="min-width:0"><div class="big" style="font-size:22px">${esc(me.name)}</div><span class="note">${esc(me.profession)}${me.username ? ' · @' + esc(me.username) : ''} · level ${me.level}</span></div></div>
      <dl class="kv"><dt>Koin</dt><dd>${COIN} ${fmt(me.coins)}</dd><dt>Energi</dt><dd>${me.energy}/100</dd><dt>Kesehatan</dt><dd>${me.health}/100</dd><dt>XP</dt><dd>${me.xp}</dd><dt>Rumah</dt><dd>${home ? esc(home.label || catOf(home.type).n) : me.home_building_id ? 'Ada' : 'Belum punya'}</dd>${me.npc ? `<dt>Tokoh lama</dt><dd>${esc(me.npc.name)}</dd>` : ''}</dl>`;
    if (me.home_building_id) h += `<button class="btn" data-act="goto" data-id="${me.home_building_id}">Pergi ke rumahku</button>`;
    if (me.profession !== 'Presiden'){
      if (me.profession !== 'Menteri') h += `<div class="lab">Ganti profesi · 100 NC</div><div class="profs">${Object.keys(PROF).map(p => `<button class="prof" data-act="chprof" data-p="${p}" aria-pressed="${me.profession === p}"><span class="pd" style="background:${PROF[p].c}">${p[0]}</span><span><b>${p}</b><span>${esc(PROF[p].d)}</span></span></button>`).join('')}</div>`;
      h += `<div class="lab">Warna atap & topi</div><div class="sws">${COLORS.map(c => `<button class="sw" data-act="color" data-c="${c}" style="background:${c}" aria-pressed="${me.color === c}" aria-label="Warna ${c}"></button>`).join('')}</div>`;
    }
    if (isAdmin()) h += `<button class="btn dark" data-act="open-admin">Panel presiden</button>`;
    h += `<button class="btn red" data-act="logout">Keluar</button>`;
    return ['Profil', h, me.is_admin ? 'Presiden Republik Netizenia' : 'Warga Republik Netizenia', 'user'];
  },
  npc(p){
    if (!p) return null; const [id, name, prof, color, home, sick, ig] = p; const hb = home && S.buildings.get(home);
    return [esc(name), `<dl class="kv"><dt>Profesi</dt><dd>${esc(prof)}</dd>${ig ? `<dt>Instagram</dt><dd>@${esc(ig)}</dd>` : ''}<dt>Tinggal di</dt><dd>${hb ? esc(hb.label || catOf(hb.type).n) : home ? 'Rumah warga' : 'Apartemen Netizenia'}</dd><dt>Kesehatan</dt><dd>${sick ? 'Sedang sakit' : 'Sehat'}</dd></dl><p class="note">Warga ini berasal dari komen Instagram dan hidup sebagai NPC. Kalau ini kamu, ajukan klaim: setelah disetujui presiden, tokoh ini tertaut ke akunmu.</p>${home ? `<button class="btn" data-act="goto" data-id="${home}">Lihat rumahnya</button>` : ''}
      ${registered() && !S.me.npc ? (S.me.claim_pending ? (S.me.claim_pending_npc && S.me.claim_pending_npc.id === id ? '<p class="note"><b>Klaimmu untuk tokoh ini sedang menunggu persetujuan presiden.</b></p>' : `<p class="note">Kamu sudah punya klaim yang menunggu${S.me.claim_pending_npc ? ' (untuk ' + esc(S.me.claim_pending_npc.name) + ')' : ''}. Satu klaim per akun.</p>`) : `<button class="btn gold" data-act="claim-open" data-n="${id}">Ini aku: klaim tokoh ini</button>`) : registered() && S.me.npc ? `<p class="note">Akunmu sudah tertaut ke tokoh ${esc(S.me.npc.name)}.</p>` : !S.session ? '<button class="btn gold" data-act="login">Masuk untuk mengklaim</button>' : ''}
      ${S.session ? ((S.me?.optout_pending || []).includes(id) ? '<p class="note"><b>Permintaan hapus nama ini sedang menunggu presiden.</b></p>' : `<button class="btn red sm" data-act="optout-open" data-n="${id}">Minta hapus nama ini</button>`) : ''}`, 'Warga dari komen', 'people'];
  },
  distrik(key){
    const d = (S.snap?.districts || []).find(x => x.key === key) || { key, name: DIST_NAME[key], cost: 0 }; const dp = (S.snap?.district_proposals || []).find(x => x.district === key);
    let h = `<p class="note">${esc(d.name)} belum dibuka: masih sawah, kebun, dan jalan tanah (arteri sudah diaspal negara). Warga bisa mengusulkan pembukaannya lewat voting ${S.snap?.vote_hours || 24} jam. Biaya dari kas negara: <b>${nc(d.cost)}</b>.</p>`;
    if (dp){ const my = S.me?.my_district_votes?.[dp.id]; h += `<div class="prog"><div class="spread"><b>Usulan sedang divoting</b><span>▲ ${dp.yes} · ▼ ${dp.no}</span></div></div>` + (registered() ? `<div class="row"><button class="btn green" data-act="dvote" data-id="${dp.id}" data-v="1" ${my === 1 ? 'disabled' : ''}>Setuju</button><button class="btn red" data-act="dvote" data-id="${dp.id}" data-v="-1" ${my === -1 ? 'disabled' : ''}>Tolak</button></div>` : `<button class="btn gold wide" data-act="login">Masuk untuk memberi suara</button>`); }
    else h += `<button class="btn gold wide" data-act="propose-dist" data-d="${key}">Usulkan buka ${esc(d.name)}</button>`;
    if (isAdmin()) h += `<button class="btn dark wide" data-act="pres-dist" data-d="${key}">Buka sekarang (presiden, dari kas)</button>`;
    return [esc(d.name), h, 'Distrik tertutup', 'map'];
  },
};

function manageHTML(b){
  const w = b.wage || 30;
  return `<div class="prog"><div class="spread"><b>Kelola lowongan</b><span class="note">${b.workers || 0}/${catOf(b.type).jobs} pekerja</span></div>
    <div class="row" style="flex-wrap:nowrap"><button class="btn sm" data-act="wage" data-id="${b.id}" data-w="${Math.max(10, w - 5)}" ${w <= 10 ? 'disabled' : ''} aria-label="Turunkan gaji">−5</button><span style="flex:1;text-align:center"><b class="num">${nc(w)}</b><small class="note" style="display:block">gaji per shift</small></span><button class="btn sm" data-act="wage" data-id="${b.id}" data-w="${Math.min(80, w + 5)}" ${w >= 80 ? 'disabled' : ''} aria-label="Naikkan gaji">+5</button></div>
    <button class="btn sm" data-act="jobopen" data-id="${b.id}" data-v="${b.job_open === false ? 1 : 0}">${b.job_open === false ? 'Buka lowongan' : 'Tutup lowongan'}</button></div>`;
}

let chatSentAt = 0, chatSending = false, chatHint = '', chatHintT = null;
function setChatHint(m, ms){ chatHint = m; const h = $('#chatHint'); if (h){ h.textContent = m; h.className = 'hint' + (m ? ' bad' : ''); } clearTimeout(chatHintT); if (m) chatHintT = setTimeout(() => { setChatHint(''); tickChatHint(); }, ms || 6000); }
function tickChatHint(){ const h = $('#chatHint'); if (!h || chatHint) return; const w = 5000 - (Date.now() - chatSentAt); h.className = 'hint'; h.textContent = w > 0 ? 'Bisa kirim lagi dalam ' + Math.ceil(w / 1000) + ' detik.' : ''; if (w > 0) setTimeout(tickChatHint, 500); }
async function loadQueue(){ if (!isAdmin()) return; try { const q = await rpc('admin_list_queue'); if (sheetKind === 'admin'){ sheetArg = { ...(sheetArg || {}), queue: q }; renderSheet(); } } catch (e) { toast(e.message, 'bad'); } }
function exitWalk(){ if (!walk.on) return; stopWalk(); document.body.classList.remove('walking'); $('#walkui').hidden = true; renderHud(); }
function photoOn(){ closeSheet(); if (place) cancelPlace(); photoHour = wibHours(); document.body.classList.add('photo'); $('#photobar').hidden = false; $('#phour').value = photoHour; $('#phourv').textContent = wibClock(); }
function photoOff(){ photoHour = null; document.body.classList.remove('photo'); $('#photobar').hidden = true; applyTime(true); renderHud(); }
function photoSave(){
  try {
    applyCam(); renderer.render(scene, camera);
    const c = document.createElement('canvas'); c.width = canvas.width; c.height = canvas.height; const x = c.getContext('2d'); x.drawImage(canvas, 0, 0);
    const k = Math.max(1, c.width / 1000); x.font = `700 ${Math.round(26 * k)}px Fredoka, Nunito, sans-serif`; x.fillStyle = 'rgba(255,255,255,.95)'; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 8 * k;
    x.fillText('Republik Netizenia', 22 * k, c.height - 46 * k); x.font = `700 ${Math.round(15 * k)}px Nunito, sans-serif`; x.fillText(wibClock() + ' WIB · ' + CFG.site, 22 * k, c.height - 22 * k);
    c.toBlob(bl => { const a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = 'republik-netizenia-' + wibClock().replace(':', '') + '.png'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); }, 'image/png');
    toast('Foto disimpan.', 'good');
  } catch (e) { toast('Foto gagal disimpan: ' + e.message, 'bad'); }
}

/* ---------- modal: masuk, buat tokoh, sambutan ---------- */
let modalArg = null, loginMode = 'masuk', draft = { prof: 'Warga', color: COLORS[0], name: '' };
const GOOGLE = '<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 01-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0012 24z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 010-4.6V6.6H1.3a12 12 0 000 10.8z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 001.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"/></svg>';
const FLAG = '<div class="flag"><i style="background:#D9483B"></i><i style="background:#2F8F5B"></i><i style="background:#FAFAF5"></i></div>';
function openModal(kind){ if (S.preview && kind !== 'welcome') return toast('Mode pratinjau: login dimatikan sampai server v2 aktif.', 'bad'); modalKind = kind; if (kind === 'register' && S.me?.username && !draft.name) draft.name = S.me.username; renderModal(); $('#modal').hidden = false; renderHud(); setTimeout(() => { if (!$('#modal').contains(document.activeElement)) $('#modal input')?.focus(); }, 60); }
function closeModal(){ modalKind = null; $('#modal').hidden = true; renderHud(); }
function renderModal(){
  const M = $('#modal');
  if (modalKind === 'login'){
    M.innerHTML = `<div class="mcard" role="dialog" aria-label="Masuk"><button class="x" data-act="close-modal" aria-label="Tutup">${svg('x')}</button>${FLAG}<h1>Masuk ke Republik Netizenia</h1><p class="note">Punya rumah, kerja, dan ikut voting bangunan kota bersama warga lain.</p>
      ${googleOn === false ? '' : `<button class="gbtn" data-act="google">${GOOGLE}Masuk dengan Google</button><div class="or">atau pakai username</div>`}
      <div class="tabs"><button class="tab" data-lmode="masuk" aria-pressed="${loginMode === 'masuk'}">Masuk</button><button class="tab" data-lmode="daftar" aria-pressed="${loginMode === 'daftar'}">Daftar baru</button></div>
      <form id="loginForm" class="list" autocomplete="on"><div class="field"><label for="lu">Username</label><input id="lu" name="username" autocomplete="username" inputmode="text" autocapitalize="none" spellcheck="false" maxlength="20" placeholder="mis. budi_santoso" required></div>
      <div class="field"><label for="lp">Kata sandi</label><input id="lp" name="password" type="password" autocomplete="${loginMode === 'daftar' ? 'new-password' : 'current-password'}" minlength="8" placeholder="minimal 8 karakter" required></div>
      <span class="hint" id="lhint">${loginMode === 'daftar' ? 'Username 3–20 karakter: huruf kecil, angka, titik, garis bawah. Tidak perlu email.' : ''}</span>
      <button class="btn gold wide" type="submit">${loginMode === 'daftar' ? 'Buat akun' : 'Masuk'}</button></form></div>`; return;
  }
  if (modalKind === 'register'){
    const admin = S.me?.is_admin; if (admin && !draft.name) draft.name = 'Pak Mulyo';
    M.innerHTML = `<div class="mcard" role="dialog" aria-label="Buat tokoh"><button class="x" data-act="logout" aria-label="Batal dan keluar" title="Batal dan keluar">${svg('x')}</button>${FLAG}<h1>${admin ? 'Selamat datang, Presiden' : 'Buat tokohmu'}</h1>
      <div class="field"><label for="rn">Nama tampilan</label><input id="rn" maxlength="24" value="${esc(draft.name)}" placeholder="nama yang dilihat warga" autocomplete="nickname"></div>
      ${admin ? '<p class="note">Akunmu terdaftar sebagai presiden. Kamu tinggal di Rumah Pak Mulyo dan memimpin lewat usulan, veto, dan pajak.</p>' : `<div class="field"><label>Profesi <span class="note">(bisa diganti nanti, 100 NC)</span></label><div class="profs">${Object.keys(PROF).map(p => `<button class="prof" type="button" data-dp="${p}" aria-pressed="${draft.prof === p}"><span class="pd" style="background:${PROF[p].c}">${p[0]}</span><span><b>${p}</b><span>${esc(PROF[p].d)}</span></span></button>`).join('')}</div></div>
      <div class="field"><label>Warna atap & topi</label><div class="sws">${COLORS.map(c => `<button class="sw" type="button" data-dc="${c}" style="background:${c}" aria-pressed="${draft.color === c}" aria-label="Warna ${c}"></button>`).join('')}</div></div>`}
      <span class="hint" id="rhint"></span><button class="btn gold wide" data-act="register">Masuk ke negara</button></div>`; return;
  }
  if (modalKind === 'claim' || modalKind === 'optout'){
    const n = (S.npcs || []).find(x => x[0] === modalArg) || [modalArg, 'warga']; const claim = modalKind === 'claim';
    M.innerHTML = `<div class="mcard" role="dialog" aria-label="${claim ? 'Klaim tokoh' : 'Hapus nama'}"><button class="x" data-act="close-modal" aria-label="Tutup">${svg('x')}</button>${FLAG}<h1>${claim ? 'Klaim ' + esc(n[1]) : 'Hapus nama ' + esc(n[1])}</h1>
      <p class="note">${claim ? 'Presiden akan memeriksa klaimmu. Setelah disetujui, tokoh ini tertaut ke akunmu dan rumahnya ikut jadi milikmu.' : 'Presiden akan memeriksa permintaan ini. Bila disetujui, nama ini dihapus dari kota.'}</p>
      ${claim ? '<div class="field"><label for="cig">Username Instagram (opsional, untuk dicek presiden)</label><input id="cig" maxlength="31" placeholder="@namakamu" autocapitalize="none" spellcheck="false"></div>' : ''}
      <div class="field"><label for="cnote">${claim ? 'Catatan untuk presiden (opsional)' : 'Alasan (opsional)'}</label><textarea id="cnote" maxlength="200"></textarea></div>
      <span class="hint" id="chint"></span><button class="btn gold wide" data-act="${claim ? 'claim-send' : 'optout-send'}">${claim ? 'Kirim klaim' : 'Kirim permintaan'}</button></div>`; return;
  }
  if (modalKind === 'welcome'){
    const steps = [['Ambil rumah gratis', 'Negara mencarikan kavling kampung kosong; tinggal ketuk Bangun.'], ['Beri suara', 'Menu Voting: setuju atau tolak usulan bangunan umum.'], ['Cari kerja', 'Menu Kerja: lamar lowongan, jalankan aksi profesi, dan selesaikan misi harian.']];
    M.innerHTML = `<div class="mcard" role="dialog" aria-label="Sambutan">${FLAG}<h1>Selamat datang, ${esc(S.me?.name || 'warga')}!</h1><p class="note">Kamu dapat modal 400 NC. Tiga langkah pertama:</p><div class="steps">${steps.map((s, k) => `<div class="step"><span class="sn">${k + 1}</span><span class="grow"><b>${s[0]}</b><small>${s[1]}</small></span></div>`).join('')}</div><button class="btn gold wide" data-act="start">Mulai: ambil rumah gratis</button></div>`;
  }
}

/* ---------- penempatan bangunan ---------- */
let place = null;
function startPlace(type, at){
  if (!S.session) return openModal('login'); if (!registered()) return openModal('register');
  const err = ruleErr(type); if (err) return toast(err, 'bad');
  const ct = catOf(type); closeSheet(); place = { type, w: ct.w, h: ct.h, rot: false, i: null, j: null, err: null, want: null, facing: null, zone: null };
  $('#placebar').hidden = false; paintLots(); renderHud();
  if (at) setPlaceAnchor(at[0], at[1]); else { renderPlacebar(); if (cam.dist > 120) flyTo(cam.tx, cam.tz, 110); }
}
// 5 cek §2, pesan SAMA PERSIS dengan nz.place di server (server tetap wasit)
function fitsLocal(i, j, w, h, type, want){
  const ct = catOf(type || (place && place.type));
  if (!((w === ct.w && h === ct.h) || (w === ct.h && h === ct.w))) return 'Ukuran tapak tidak sesuai katalog.';
  if (!isLot(i, j) || !isLot(i + w - 1, j + h - 1)) return 'Tidak bisa di atas jalan.';                 // wajib sebelum blockOf (koordinat luar peta)
  if (!sameBlock(i, j, w, h)) return 'Harus muat dalam satu blok (maks 6 lebar × 2 dalam).';
  if (facingOf(i, j, w, h, ct.w, ct.h, want) == null) return 'Muka bangunan harus ke jalan.';
  const zone = zoneOfLot(i, j, w, h); if (!ct.zones.includes(zone)) return 'Jenis ini tidak boleh di zona ' + zone + '.';
  for (let a = 0; a < w; a++) for (let c = 0; c < h; c++) if (S.occ.has((j + c) * N + i + a)) return 'Kavling sudah terisi.';
  if (!openSet.has(districtOf(i, j))) return DIST_NAME[districtOf(i, j)] + ' belum dibuka.';
  return null;
}
const PREVIEW_BAD = inkify(toonMat({ color: lin('#D9483B'), transparent: true, opacity: .62 }));
const arrowGeo = (() => { const g = new THREE.ConeGeometry(1.1, 2.4, 4); g.rotateY(Math.PI / 4); g.rotateX(Math.PI / 2); return g; })();
function setPlaceAnchor(i, j){
  if (!place) return; const ct = catOf(place.type); place.i = i - Math.floor((place.w - 1) / 2); place.j = j - Math.floor((place.h - 1) / 2);
  const geomOK = isLot(place.i, place.j) && isLot(place.i + place.w - 1, place.j + place.h - 1) && sameBlock(place.i, place.j, place.w, place.h);
  place.facing = geomOK ? facingOf(place.i, place.j, place.w, place.h, ct.w, ct.h, place.want) : null;
  place.zone = geomOK ? zoneOfLot(place.i, place.j, place.w, place.h) : null;
  place.err = fitsLocal(place.i, place.j, place.w, place.h, place.type, place.want) || ruleErr(place.type, place.zone);
  const cx = wx(place.i) + (place.w - 1) * T / 2, cz = wx(place.j) + (place.h - 1) * T / 2;
  placeGhost.visible = true; placeGhost.material.color.copy(lin(place.err ? '#D9483B' : '#2F8F5B')); placeGhost.scale.set(place.w * T - 1, 5, place.h * T - 1); placeGhost.position.set(cx, 2.8, cz);
  if (placePreview){ scene.remove(placePreview); placePreview = null; }
  if (place.facing != null){   // pratinjau diputar sesuai facing + panah pintu; merah bila zona salah
    const f = place.facing, lw = f % 2 ? place.h : place.w, lh = f % 2 ? place.w : place.h, zoneOK = ct.zones.includes(place.zone);
    const g = modelGeo(place.type, S.me?.color || '#D9483B', WALLS[0], lw, lh, floorsFor(place.type, ringOf(place.i, place.j), lotClass(place.i, place.j, place.w, place.h)), place.zone);
    placePreview = new THREE.Group(); const inner = new THREE.Group(); inner.add(new THREE.Mesh(g.body, zoneOK ? PREVIEW_MAT : PREVIEW_BAD)); inner.rotation.y = f * Math.PI / 2;
    const arrow = new THREE.Mesh(arrowGeo, new THREE.MeshBasicMaterial({ color: lin(zoneOK && !place.err ? '#F2B531' : '#D9483B'), toneMapped: false })); arrow.position.set(0, .9, lh * T / 2 + 1.7); inner.add(arrow);
    placePreview.add(inner); placePreview.position.set(cx, Y0, cz); scene.add(placePreview);
  }
  renderPlacebar();
}
function renderPlacebar(){
  if (!place) return; makeThumbs(); const ct = catOf(place.type), pr = priceOf(place.type, place.zone);   // adapter: placebar lewat suggest_lot tanpa SHEETS.bangun → gambar kecil belum dibuat
  const cands = place.i !== null && place.facing != null ? facingCandidates(place.i, place.j, place.w, place.h, ct.w, ct.h) : [];
  const canRotate = ct.w !== ct.h || cands.length > 1;
  const status = place.i === null ? '<small>Ketuk kavling hijau di peta.</small>' : place.err ? `<small class="bad">${esc(place.err)}</small>` : `<small class="ok">Kavling cocok · zona ${esc(ZONE_NAME[place.zone] || place.zone)} · pintu ke ${FACE_NAME[place.facing]}. Tekan ${ct.kind === 'umum' ? 'Ajukan' : 'Bangun'}.</small>`;
  $('#placebar').innerHTML = `<div class="ph"><img src="${thumbs[place.type] || ''}" alt=""><div class="grow"><b>${esc(ct.n)}</b><small>${ct.kind === 'umum' ? 'Usulan · biaya kas ' + nc(pr) + ' bila lolos' : pr ? nc(pr) + ' termasuk tanah' + (place.zone ? ' ' + nc(landPrice(place.type, place.zone)) : '') : 'Gratis: rumah pertamamu'} · ${place.w}×${place.h} kavling</small>${status}</div></div>
    <div class="row">${canRotate ? '<button class="btn sm" data-act="rotate">Putar</button>' : ''}<button class="btn sm" data-act="cancel-place">Batal</button><button class="btn sm gold" data-act="confirm-place" ${place.i === null || place.err ? 'disabled' : ''}>${ct.kind === 'umum' ? 'Ajukan usulan' : 'Bangun'}</button></div>`;
}
function cancelPlace(){ place = null; placeGhost.visible = false; if (placePreview){ scene.remove(placePreview); placePreview = null; } $('#placebar').hidden = true; selMesh.visible = false; paintLots(); renderHud(); }
async function confirmPlace(btn){
  if (!place || place.err || place.i === null) return; const ct = catOf(place.type), p = { ...place };
  btn?.classList.add('busy');
  const r = await act(ct.kind === 'umum' ? 'propose_public' : 'build_private', { p_type: p.type, p_i: p.i, p_j: p.j, p_rotated: p.rot, p_want: p.want ?? null }, { districts: [districtOf(p.i, p.j)] });
  btn?.classList.remove('busy');
  if (r){ cancelPlace(); const id = r.id; flyTo(wx(p.i) + (p.w - 1) * T / 2, wx(p.j) + (p.h - 1) * T / 2, 60); if (id && S.buildings.get(id)) setTimeout(() => openInfo(id), 500); }
}
function rotatePlace(){
  const ct = catOf(place.type);
  if (ct.w !== ct.h){ place.rot = !place.rot; [place.w, place.h] = [place.h, place.w]; place.want = null; }   // tapak ditukar, facing dihitung ulang
  else if (place.i !== null && place.facing != null){ const c = facingCandidates(place.i, place.j, place.w, place.h, ct.w, ct.h); if (c.length > 1) place.want = c[(c.indexOf(place.facing) + 1) % c.length]; }   // siklus sisi sah
  if (place.i !== null) setPlaceAnchor(place.i + Math.floor((place.w - 1) / 2), place.j + Math.floor((place.h - 1) / 2)); else renderPlacebar();
}
// rumah gratis: negara mencarikan kavling (RPC suggest_lot); null = kampung penuh → usulkan distrik
async function freeHouse(){
  sheetTab = 'rumah'; if (S.preview || !registered()) return openSheet('bangun');
  let lot; try { lot = await rpc('suggest_lot'); } catch (e) { if (e.code !== 'PGRST202') toast(e.message, 'bad'); lot = undefined; }
  if (lot === null){ toast('Kavling kampung penuh, usulkan pembukaan distrik.', 'bad'); return openSheet('voting'); }
  if (lot && lot.i != null && lot.j != null && isLot(lot.i, lot.j)){ const d = districtOf(lot.i, lot.j); if (!S.loaded.has(d)) await loadDistricts([d]); flyTo(wx(lot.i), wx(lot.j), 60); return startPlace('rumah', [lot.i, lot.j]); }
  openSheet('bangun');
}
// sambutan pemain baru: kamera rendah di atas protokol selatan menghadap tugu
function welcomeCam(){ cam.tx = wx(109) + T / 2; cam.tz = wx(109) + T / 2; cam.theta = Math.PI / 2; cam.phi = 1.24; cam.dist = 105; fly = null; }

/* ---------- semua klik ---------- */
document.addEventListener('click', async e => {
  const el = e.target.closest('button, [data-act]'); if (!el || el.disabled) return;
  if (el.id === 'meChip'){ if (registered()) openSheet('profil'); else if (S.session) openModal('register'); else openModal('login'); return; }
  if (el.dataset.dock){ const k = el.dataset.dock; if (dockSel === k && sheetKind){ closeSheet(); return; } if (place) cancelPlace(); sheetTab = null; openSheet(k); return; }
  if (el.dataset.open){ openSheet(el.dataset.open); return; }
  if (el.dataset.tab){ sheetTab = el.dataset.tab; renderSheet(); return; }
  if (el.dataset.place){ if (el.getAttribute('aria-disabled') === 'true'){ toast(ruleErr(el.dataset.place) || 'Belum bisa.', 'bad'); return; } startPlace(el.dataset.place, el.dataset.at ? el.dataset.at.split(',').map(Number) : null); return; }
  if (el.dataset.wtab){ sheetArg = { ...(sheetArg || {}), f: el.dataset.wtab, list: null, err: null }; renderSheet(); return; }
  if (el.dataset.lmode){ loginMode = el.dataset.lmode; renderModal(); return; }
  if (el.dataset.dp){ draft.prof = el.dataset.dp; draft.name = $('#rn')?.value || draft.name; renderModal(); return; }
  if (el.dataset.dc){ draft.color = el.dataset.dc; draft.name = $('#rn')?.value || draft.name; renderModal(); return; }
  const a = el.dataset.act; if (!a) return; const id = el.dataset.id != null ? Number(el.dataset.id) : null;
  const busy = async fn => { el.classList.add('busy'); try { await fn(); } finally { el.classList.remove('busy'); } };
  const rect = el.getBoundingClientRect(), pos = { x: rect.left + rect.width / 2 - 30, y: rect.top - 10 };
  switch (a){
    case 'close': closeSheet(); break;
    case 'close-modal': closeModal(); break;
    case 'login': openModal('login'); break;
    case 'register': if (modalKind === 'register'){ const name = $('#rn').value.trim(); if (name.length < 2){ $('#rhint').textContent = 'Nama minimal 2 huruf.'; $('#rhint').className = 'hint bad'; break; }
        await busy(async () => { try { S.me = await rpc('register_profile', { p_name: name, p_profession: draft.prof, p_color: draft.color }); closeModal(); renderHud(); paintLots(); startLive(); welcomeCam(); openModal('welcome'); } catch (err) { $('#rhint').textContent = err.message; $('#rhint').className = 'hint bad'; } }); }
      else openModal('register'); break;
    case 'start': closeModal(); freeHouse(); break;
    case 'google': loginGoogle(); break;
    case 'logout': closeModal(); await logout(); break;
    case 'banner-off': store.set('nz_banner_off', true); renderHud(); break;
    case 'free-house': freeHouse(); break;
    case 'open-voting': openSheet('voting'); break;
    case 'profil': if (registered()) openSheet('profil'); else openModal('login'); break;
    case 'goto': { const b = S.buildings.get(id); if (b){ const [x, z] = centerOf(b); flyTo(x, z, 55); openInfo(id); } else if (id) toast('Bangunan ada di distrik yang belum dimuat.'); break; }
    case 'goto-b': { const b = S.buildings.get(id); if (b){ const [x, z] = centerOf(b); flyTo(x, z, 60); openInfo(id); } break; }
    case 'goto-d': { const rc = DIST_RECT[el.dataset.d]; if (!rc) break; flyTo(wx((rc[0] + rc[2]) / 2), wx((rc[1] + rc[3]) / 2), 190); closeSheet(); break; }
    case 'home': { const hid = S.me?.home_building_id; if (hid && S.buildings.get(hid)){ const [x, z] = centerOf(S.buildings.get(hid)); flyTo(x, z, 50); } else toast(registered() ? 'Kamu belum punya rumah. Ambil rumah gratis di menu Bangun.' : 'Masuk dulu untuk punya rumah.'); break; }
    case 'center': flyTo(wx(108) + T, wx(108) + T, MOBILE ? 175 : 150); break;
    case 'rotate': if (place) rotatePlace(); else cam.theta += Math.PI / 2; break;
    case 'cancel-place': cancelPlace(); break;
    case 'confirm-place': confirmPlace(el); break;
    case 'vote': await busy(() => act('vote_proposal', { p_id: id, p_vote: Number(el.dataset.v) }, { ...pos })); break;
    case 'dvote': await busy(() => act('vote_district', { p_id: id, p_vote: Number(el.dataset.v) }, { refresh: false })); loadSnapshot(); break;
    case 'propose-dist': await busy(() => act('propose_district', { p_district: el.dataset.d }, { refresh: false })); await loadSnapshot(); openSheet('voting'); break;
    case 'help': await busy(() => act('help_build', { p_building_id: id }, { ...pos })); break;
    case 'demolish': if (el.dataset.sure){ await busy(() => act('demolish_building', { p_id: id })); closeSheet(); } else { el.dataset.sure = '1'; el.textContent = 'Yakin? Ketuk lagi untuk bongkar'; } break;
    case 'chprof': if (el.dataset.p === S.me?.profession) break; if (el.dataset.sure){ await busy(() => act('change_profession', { p_profession: el.dataset.p }, { refresh: false })); } else { el.dataset.sure = '1'; el.querySelector('b').textContent = 'Ketuk lagi: ganti (100 NC)'; } break;
    case 'color': await busy(() => act('set_color', { p_color: el.dataset.c }, { refresh: false })); break;
    case 'pres-approve': await busy(() => act('pres_approve', { p_id: id })); break;
    case 'pres-veto': if (el.dataset.sure){ await busy(() => act('pres_veto', { p_id: id })); closeSheet(); } else { el.dataset.sure = '1'; el.textContent = 'Yakin veto? Ketuk lagi'; } break;
    case 'pres-dist': await busy(() => act('pres_open_district', { p_district: el.dataset.d }, { refresh: false })); await loadSnapshot(); break;
    case 'open-kerja': openSheet('kerja'); break;
    case 'open-donatur': openSheet('donatur'); break;
    case 'open-admin': openSheet('admin', {}); break;
    case 'npc-open': { const n = (S.npcs || []).find(x => x[0] === Number(el.dataset.n)); const row = (sheetArg?.list || []).find(x => x.kind === 'npc' && x.id === Number(el.dataset.n)); const cur = n ? [...n] : [Number(el.dataset.n), row?.name || 'Warga', row?.prof || 'Warga', row?.color, null, false, null]; if (row) cur[5] = !!row.sick; openSheet('npc', cur); break; }
    case 'claim-open': if (!registered()) { openModal(S.session ? 'register' : 'login'); break; } modalArg = Number(el.dataset.n); openModal('claim'); break;
    case 'optout-open': if (!S.session) { openModal('login'); break; } modalArg = Number(el.dataset.n); openModal('optout'); break;
    case 'claim-send': await busy(async () => { try { const r = await rpc('request_claim_v2', { p_npc_id: modalArg, p_ig: $('#cig').value.trim() || null, p_note: $('#cnote').value.trim() || null }); closeModal(); toast(r.msg, 'good'); await loadMe(true); renderSheet(); } catch (err) { $('#chint').textContent = err.message; $('#chint').className = 'hint bad'; } }); break;
    case 'optout-send': await busy(async () => { try { const r = await rpc('request_opt_out', { p_npc_id: modalArg, p_reason: $('#cnote').value.trim() || null }); closeModal(); toast(r.msg, 'good'); await loadMe(true); renderSheet(); } catch (err) { $('#chint').textContent = err.message; $('#chint').className = 'hint bad'; } }); break;
    case 'chat-del': await busy(() => act('admin_delete_chat', { p_id: id }, { refresh: false })); if (S.chat) S.chat = S.chat.filter(m => m.id !== id); loadSnapshot(); break;
    case 'adm-claim': await busy(() => act('admin_review_claim', { p_request_id: id, p_approve: el.dataset.v === '1' }, { refresh: false })); loadQueue(); loadNpcs(); break;
    case 'adm-optout': await busy(() => act('admin_review_optout', { p_id: id, p_approve: el.dataset.v === '1' }, { refresh: false })); loadQueue(); loadNpcs(); break;
    case 'tax-step': { const x = $('#atax'); x.value = clamp((parseInt(x.value, 10) || 0) + Number(el.dataset.d), 0, 30); break; }
    case 'adm-tax': { const v = parseInt($('#atax').value, 10); if (!(v >= 0 && v <= 30)){ toast('Pajak 0 sampai 30%.', 'bad'); break; } await busy(() => act('pres_set_tax', { p_pct: v }, { refresh: false })); $('#atax').defaultValue = String(v); await loadSnapshot(); break; }
    case 'adm-ann-del': if (el.dataset.sure){ await busy(() => act('admin_delete_announcement', { p_id: id }, { refresh: false })); await loadSnapshot(); rotateTicker(); } else { el.dataset.sure = '1'; el.textContent = 'Yakin?'; } break;
    case 'adm-ann': { const t = $('#aann').value.trim(); if (t.length < 3){ toast('Pengumuman terlalu pendek.', 'bad'); break; } await busy(() => act('pres_announce', { p_text: t }, { refresh: false })); $('#aann').value = ''; loadSnapshot(); break; }
    case 'adm-don-add': { const nm = $('#dnm').value.trim(), am = Number($('#damt').value); if (!nm || !(am >= 0)){ toast('Isi nama dan nominal.', 'bad'); break; } const r = await act('pres_add_donation', { p_name: nm, p_amount: Math.round(am), p_message: $('#dmsg').value.trim() || null }, { refresh: false }); if (r){ $('#dnm').value = $('#damt').value = $('#dmsg').value = ''; await loadSnapshot(); } break; }
    case 'adm-don-del': if (el.dataset.sure){ await busy(() => act('admin_delete_donation', { p_id: id }, { refresh: false })); loadSnapshot(); } else { el.dataset.sure = '1'; el.textContent = 'Yakin?'; } break;
    case 'adm-goal': await busy(() => act('admin_set_donation_goal', { p_amount: Math.max(0, Math.round(Number($('#dgoal').value) || 0)) }, { refresh: false })); loadSnapshot(); break;
    case 'adm-saweria': await busy(() => act('pres_set_saweria', { p_url: $('#dsaw').value.trim() }, { refresh: false })); loadSnapshot(); break;
    case 'adm-tick': await busy(async () => { try { const r = await rpc('admin_run_tick'); r.at = wibClock() + ' WIB'; if (sheetKind === 'admin') sheetArg = { ...(sheetArg || {}), tick: r }; toast('Dihitung: ' + (r.usulan_ditutup || 0) + ' usulan ditutup, ' + (r.selesai_dibangun || 0) + ' bangunan selesai.', 'good'); } catch (err) { toast(err.message, 'bad'); } }); await loadSnapshot(); await loadDistricts([...S.loaded.keys()]); renderSheet(); break;
    case 'photo': photoOn(); break;
    case 'walk': if (!S.session){ openModal('login'); break; } if (!registered()){ openModal('register'); break; } closeSheet(); if (place) cancelPlace(); startWalk(); document.body.classList.add('walking'); $('#walkui').hidden = false; break;
    case 'walk-exit': exitWalk(); break;
    case 'walk-look': if (walk.near){ const b = S.buildings.get(walk.near); if (b) openInfo(b.id); } break;
    case 'walk-jump': walkJump(); break;
    case 'walk-chat': openSheet('chat'); break;
    case 'walk-run': walk.sprint = !walk.sprint; el.setAttribute('aria-pressed', walk.sprint ? 'true' : 'false'); break;
    case 'walk-emotes': $('#emotes').hidden = !$('#emotes').hidden; break;
    case 'walk-emote': walkEmote(el.dataset.e); $('#emotes').hidden = true; break;
    case 'hemat': store.set('nz_hemat', el.dataset.v === '1'); toast(el.dataset.v === '1' ? 'Mode hemat dinyalakan. Memuat ulang…' : 'Grafik penuh dinyalakan. Memuat ulang…'); setTimeout(() => location.reload(), 700); break;
    case 'photo-save': photoSave(); break;
    case 'photo-exit': photoOff(); break;
    case 'open-warga': openSheet('warga', { f: el.dataset.f || 'semua', q: '' }); break;
    case 'shift': await busy(() => act('do_shift', {}, { ...pos, refresh: false })); break;
    case 'odd': await busy(() => act('odd_job', {}, { ...pos, refresh: false })); break;
    case 'quit': if (el.dataset.sure){ await busy(() => act('quit_job', {})); } else { el.dataset.sure = '1'; el.textContent = 'Yakin berhenti? Ketuk lagi'; } break;
    case 'apply': await busy(() => act('apply_job', { p_building_id: id }, { ...pos })); break;
    case 'pact': await busy(() => act('prof_action', { p_kind: el.dataset.k }, { ...pos, refresh: false })); loadSnapshot(); break;
    case 'rancang': await busy(() => act('prof_action', { p_kind: 'rancang', p_target_id: id }, { ...pos, refresh: false })); await loadSnapshot(); renderSheet(); break;
    case 'pact-t': await busy(() => act('prof_action', { p_kind: el.dataset.k, p_target: el.dataset.u || null, p_target_id: el.dataset.n ? Number(el.dataset.n) : null }, { ...pos, refresh: false })); if (sheetKind === 'warga') loadCitizens(); break;
    case 'report': if (el.dataset.sure){ await busy(() => act('report_citizen', { p_target: el.dataset.u }, { refresh: false })); if (sheetKind === 'warga') loadCitizens(); } else { el.dataset.sure = '1'; el.textContent = 'Yakin lapor? Ketuk lagi'; } break;
    case 'treat': await busy(() => act('seek_treatment', {}, { ...pos, refresh: false })); break;
    case 'wage': await busy(() => act('set_wage', { p_building_id: id, p_wage: Number(el.dataset.w) })); break;
    case 'jobopen': await busy(() => act('set_job_open', { p_building_id: id, p_open: el.dataset.v === '1' })); break;
    case 'minister': await busy(() => act('pres_set_minister', { p_user: el.dataset.u, p_on: el.dataset.on === '1' }, { refresh: false })); if (sheetKind === 'warga') loadCitizens(); break;
    case 'release': await busy(() => act('pres_release', { p_user: el.dataset.u }, { refresh: false })); if (sheetKind === 'warga') loadCitizens(); break;
    default: if (a.startsWith('goto:')){ const b = S.buildings.get(Number(a.slice(5))); if (b){ const [x, z] = centerOf(b); flyTo(x, z, 55); openInfo(b.id); } }
  }
});
document.addEventListener('submit', async e => {
  if (e.target.id === 'chatForm'){ e.preventDefault(); const t = ($('#cmsg')?.value || '').trim(); if (!t) return;
    const wait = 5000 - (Date.now() - chatSentAt);
    if (chatSending || wait > 0){ setChatHint('Tunggu ' + Math.max(1, Math.ceil(wait / 1000)) + ' detik sebelum mengirim lagi. Pesanmu masih tersimpan di kolom.', Math.max(1500, wait)); return; }
    const prevAt = chatSentAt; chatSending = true; chatSentAt = Date.now(); setChatHint('');
    const inp0 = $('#cmsg'); if (inp0){ inp0.value = ''; inp0.defaultValue = ''; }            // kosongkan langsung; ketikan berikutnya mulai dari kolom kosong
    try { await rpc('send_chat_message', { p_text: t }); walkSay(t); setTimeout(loadChat, 700); }
    catch (err) { if (!/Tunggu/.test(err.message)) chatSentAt = prevAt;
      const inp1 = $('#cmsg'); if (inp1 && !inp1.value.trim()){ inp1.value = t; inp1.defaultValue = ''; }   // kembalikan pesan yang gagal bila kolom masih kosong
      setChatHint(err.message); toast(err.message, 'bad'); }
    finally { chatSending = false; tickChatHint(); } return; }
  if (e.target.id !== 'loginForm') return; e.preventDefault(); const btn = e.target.querySelector('button[type=submit]'), hint = $('#lhint');
  btn.classList.add('busy'); hint.className = 'hint'; hint.textContent = loginMode === 'daftar' ? 'Membuat akun…' : 'Masuk…';
  try { await loginUser(loginMode, $('#lu').value, $('#lp').value); hint.textContent = 'Berhasil!'; hint.className = 'hint ok'; }
  catch (err) { hint.textContent = err.message; hint.className = 'hint bad'; }
  finally { btn.classList.remove('busy'); }
});
document.addEventListener('input', e => { if (e.target.id === 'phour'){ photoHour = Number(e.target.value); applyTime(true); $('#phourv').textContent = wibClock(); } if (e.target.id === 'wq' && sheetKind === 'warga'){ sheetArg.q = e.target.value; clearTimeout(citT); citT = setTimeout(loadCitizens, 350); } if (e.target.id === 'rn') draft.name = e.target.value; if (e.target.id === 'lu' && loginMode === 'daftar'){ const v = e.target.value.trim().toLowerCase(); const ok = /^[a-z0-9_.]{3,20}$/.test(v); $('#lhint').textContent = v ? (ok ? 'Format username oke.' : 'Huruf kecil, angka, titik, atau garis bawah (3–20).') : ''; $('#lhint').className = 'hint ' + (v ? (ok ? 'ok' : 'bad') : ''); } });
document.addEventListener('visibilitychange', () => { if (!document.hidden && S.snap && !S.preview) poll(); });

/* =====================================================================
   MULAI
   ===================================================================== */
(async function boot(){
  resize(); applyTime(true); applyOpenVisuals(); applyCam(); renderHud();
  requestAnimationFrame(renderFrame);
  if (!sb) enterPreview('Pustaka Supabase gagal dimuat.');
  else {
    initAuth(); loadAuthSettings();
    const ok = await loadSnapshot();
    if (ok){ await Promise.all([loadNpcs(), loadDistricts(['k12'])]); ensureVisibleDistricts(); }
  }
  rotateTicker();
  const bt = $('#boot'); bt.classList.add('gone'); setTimeout(() => bt.remove(), 600);
  setInterval(poll, 60000); setInterval(rotateTicker, 5000); setInterval(() => { if (document.hidden) return; renderNext(); renderDock(); if (sheetKind === 'kerja') renderSheet(); }, 30000);
})();
</script>
</body>
</html>
