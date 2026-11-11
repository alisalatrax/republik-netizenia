/* ---------- kamera & kontrol ---------- */
/* Lensa mode peta (spek-gaya §4.6): FOV 34, phi awal ,85 (elevasi 41°), dist 110 desktop / 150 HP → ±13 kavling selebar layar 1280 px.
   ty: tinggi titik tatap (mode tokoh 1,5; alat uji 'jalan' 1,5). */
const cam = { tx: wx(108) + T, tz: wx(108) + T, ty: 0, theta: Math.PI * .27, phi: .85, dist: MOBILE ? 150 : 110 };
let fly = null;
function applyCam(){
  const sp = Math.sin(cam.phi), cp = Math.cos(cam.phi);
  const ty = cam.ty || 0;
  camera.position.set(cam.tx + sp * Math.cos(cam.theta) * cam.dist, ty + cp * cam.dist, cam.tz + sp * Math.sin(cam.theta) * cam.dist);
  camera.lookAt(cam.tx, ty, cam.tz); sky.position.copy(camera.position);
  const d = sun.userData.dir || _v3.set(0, 1, 0); sun.position.set(cam.tx + d.x * 300, d.y * 300, cam.tz + d.z * 300); sun.target.position.set(cam.tx, 0, cam.tz); sun.target.updateMatrixWorld();
  // bayangan (spek-gaya §2.4): span mengikuti zoom, bias dari ukuran texel shadow map
  const span = walk.on ? 60 : clamp(cam.dist * .9, 60, LOW ? 140 : hematOn ? 120 : 180);
  if (sun.shadow.camera.right !== span){ Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 10, far: 600 }); sun.shadow.camera.updateProjectionMatrix(); }
  const texel = 2 * span / sun.shadow.mapSize.x; sun.shadow.normalBias = texel * 1.2; sun.shadow.bias = -texel * .002;
  // tebal siluet konstan di layar (spek-gaya §2.5): uK = PX · 2·tan(fov/2) / tinggi layar px CSS — tiap frame, jadi ikut resize, ganti lensa & FOV alat uji
  INK_U.uK.value = (walk.on ? INK_PX.tokoh : INK_PX.peta) * 2 * Math.tan(camera.fov * Math.PI / 360) / Math.max(1, innerHeight);
  NPC_LEG_MAT.userData.uInkB.value = walk.on ? NPC_LEG_INKB_TOKOH : NPC_LEG_INKB_PETA;   // kulit kaki NPC per mode (c2d)
  EDGE_U.uRes.value.set(Math.max(1, innerWidth), Math.max(1, innerHeight));   // garis lipatan: lebar EDGE_LW px CSS
}
function flyTo(x, z, dist){ fly = { x, z, dist: dist || Math.min(cam.dist, 70) }; }
/* Zoom peta 30–400; phi terikat zoom (spek §4.6: phi = lerp(1,05, ,72, (dist − 30)/370) → dekat 30°, jauh 49°, jepit ,55–1,15).
   Ikatan dipakai sebagai SELISIH: tiap perubahan zoom menggeser phi sebesar PHI_Z(baru) − PHI_Z(lama), sehingga phi awal ,85 di dist 110 (kriteria tahap 3)
   dan sudut hasil seret kanan tetap dipertahankan; bentuk absolut spek memberi ,98 di dist 110 (bertentangan dengan phi awal ,85 di spek yang sama). */
const ZOOM_MIN = 30, ZOOM_MAX = 400, PHI_MIN = .55, PHI_MAX = 1.15;
const PHI_Z = d => lerp(1.05, .72, clamp((d - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN), 0, 1));
function zoomTo(d){
  if (walk.on){ cam.dist = clamp(d, 4, 12); return; }   // mode tokoh: jarak 4–12 (spek §4.7)
  d = clamp(d, ZOOM_MIN, ZOOM_MAX); cam.phi = clamp(cam.phi + PHI_Z(d) - PHI_Z(cam.dist), PHI_MIN, PHI_MAX); cam.dist = d; }
function clampCam(){ const L = LHALF + 40; cam.tx = clamp(cam.tx, -L, L); cam.tz = clamp(cam.tz, -L - 40, L); cam.dist = clamp(cam.dist, ZOOM_MIN, ZOOM_MAX); cam.phi = clamp(cam.phi, PHI_MIN, PHI_MAX); }
// lensa per mode (spek §4.6/§4.7): peta FOV 34 (potret 34 + (1 − aspek)·40), tokoh FOV 62 (potret 75) near ,2
function setLens(){ const a = innerWidth / Math.max(1, innerHeight); camera.aspect = a;
  if (walk.on){ camera.fov = a >= 1 ? 62 : 75; camera.near = .2; } else { camera.fov = a >= 1 ? 34 : 34 + (1 - a) * 40; camera.near = 1; }
  camera.updateProjectionMatrix(); }
function resize(){ renderer.setSize(innerWidth, innerHeight, false); setLens(); }
addEventListener('resize', resize);
function panBy(dx, dy){ const k = cam.dist / (innerHeight * .75); const rx = Math.sin(cam.theta), rz = -Math.cos(cam.theta), fx = -Math.cos(cam.theta), fz = -Math.sin(cam.theta); cam.tx -= rx * dx * k - fx * dy * k * 1.3; cam.tz -= rz * dx * k - fz * dy * k * 1.3; fly = null; clampCam(); }
const ptrs = new Map(); let gesture = null, downAt = null;
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointerdown', e => { try { canvas.setPointerCapture(e.pointerId); } catch (_) {} ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, btn: e.button }); downAt = ptrs.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now(), ts: e.timeStamp, moved: false } : null; gesture = null; });
canvas.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) return; const prev = ptrs.get(e.pointerId), cur = { x: e.clientX, y: e.clientY, btn: prev.btn };
  if (downAt && Math.hypot(cur.x - downAt.x, cur.y - downAt.y) > 8) downAt.moved = true;
  if (ptrs.size === 1){ const dx = cur.x - prev.x, dy = cur.y - prev.y;
    if (walk.on){ cam.theta += dx * .008; cam.phi = clamp(cam.phi - dy * .004, 1.25, 1.52); }
    else if (prev.btn === 2 || e.shiftKey){ cam.theta += dx * .006; cam.phi = clamp(cam.phi - dy * .004, PHI_MIN, PHI_MAX); fly = null; } else panBy(dx, dy); }
  else if (ptrs.size === 2){ const other = [...ptrs.entries()].find(([id]) => id !== e.pointerId)[1];
    const d0 = Math.hypot(prev.x - other.x, prev.y - other.y), d1 = Math.hypot(cur.x - other.x, cur.y - other.y);
    const a0 = Math.atan2(prev.y - other.y, prev.x - other.x), a1 = Math.atan2(cur.y - other.y, cur.x - other.x);
    if (d0 > 0 && d1 > 0) zoomTo(cam.dist * d0 / d1); let da = a1 - a0; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI; cam.theta += da;
    cam.phi = walk.on ? clamp(cam.phi - (cur.y - prev.y) * .002, 1.25, 1.52) : clamp(cam.phi - (cur.y - prev.y) * .002, PHI_MIN, PHI_MAX); fly = null; }
  ptrs.set(e.pointerId, cur);
});
/* lama tekan = MIN(selisih waktu proses, selisih e.timeStamp): satu frame berat (> 500 ms, render perangkat lunak / HP lambat) di antara pointerdown dan
   pointerup tidak lagi menelan ketukan (flow.js: ketukan ke (99,112) kadang diabaikan → rumah dibangun di kavling saran). Tekan lama sungguhan tetap ditolak (kedua selisih besar). */
const pressMs = (e, d) => { const a = performance.now() - d.t, b = e.timeStamp && d.ts ? e.timeStamp - d.ts : a; return Math.min(a, b >= 0 ? b : a); };
const endPtr = e => { const was = ptrs.has(e.pointerId); ptrs.delete(e.pointerId); if (was && downAt && !downAt.moved && pressMs(e, downAt) < 500 && e.type === 'pointerup' && !walk.on) onTap(e.clientX, e.clientY); downAt = null; };
canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
canvas.addEventListener('wheel', e => { e.preventDefault(); zoomTo(cam.dist * Math.exp(e.deltaY * .0012)); fly = null; }, { passive: false });
const keys = {}; addEventListener('keydown', e => { if (e.target.closest('input,textarea')) return; keys[e.key.toLowerCase()] = true;
  if (walk.on){ if (e.key === ' '){ e.preventDefault(); walkJump(); } if (e.key === '1') walkEmote('lambai'); if (e.key === '2') walkEmote('joget'); if (e.key === '3') walkEmote('duduk'); if (e.key === '4') walkEmote('hore'); } if (e.key === 'Escape'){ if (walk.on && !sheetKind) exitWalk(); else if (document.body.classList.contains('photo')) photoOff(); else if (place) cancelPlace(); else closeSheet(); } });
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
function stepKeys(dt){ if (walk.on){ if (keys['q']) cam.theta -= dt * 1.6; if (keys['e']) cam.theta += dt * 1.6; return; } const s = 260 * dt; if (keys['w'] || keys['arrowup']) panBy(0, s); if (keys['s'] || keys['arrowdown']) panBy(0, -s); if (keys['a'] || keys['arrowleft']) panBy(s, 0); if (keys['d'] || keys['arrowright']) panBy(-s, 0);
  if (keys['q']) cam.theta -= dt * 1.4; if (keys['e']) cam.theta += dt * 1.4; if (keys['=']||keys['+']) zoomTo(cam.dist * (1 - dt)); if (keys['-']) zoomTo(cam.dist * (1 + dt)); }
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), -Y0), hit = new THREE.Vector3();
function tileAt(x, y){ ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); if (!ray.ray.intersectPlane(ground, hit)) return null; return [Math.round(hit.x / T + HALF), Math.round(hit.z / T + HALF)]; }
function onTap(x, y){
  ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  if (place){ const t = tileAt(x, y); if (t) setPlaceAnchor(t[0], t[1]); return; }
  const hits = ray.intersectObjects(pickables, false); const wh = ray.intersectObject(walkerBody, false);
  if (wh.length && (!hits.length || wh[0].distance < hits[0].distance)){ const mv = movers.find(m => m.kind === 'w' && m.idx === wh[0].instanceId); if (mv) return openSheet('npc', mv.person); }
  if (hits.length) return openInfo(hits[0].object.userData.id);
  const t = tileAt(x, y); if (!t) return; const [i, j] = t; if (i < 0 || j < 0 || i >= N || j >= N) return;
  if (!isLot(i, j)) return;
  const id = S.occ.get(j * N + i); if (id) return openInfo(id);
  const d = districtOf(i, j); if (!openSet.has(d)) return openSheet('distrik', d);
  showSel(i, j, 1, 1); openSheet('bangun', { at: [i, j] });
}

/* ---------- label melayang ---------- */
const projV = new THREE.Vector3();
function placeLabels(){
  const w = innerWidth, h = innerHeight, list = [];
  for (const c of donorClouds){ projV.set(c.mesh.position.x, c.y + 6, c.mesh.position.z).project(camera); const on = projV.z < 1 && Math.abs(projV.x) < 1.05 && projV.y > -1 && projV.y < .85;
    c.label.style.display = on ? '' : 'none'; if (on) c.label.style.transform = `translate(${(projV.x * .5 + .5) * w}px,${(-projV.y * .5 + .5) * h}px) translate(-50%,-100%)`; }
  for (const v of vis.values()) if (v.label){ const [x, z] = centerOf(v.b); const dd = Math.hypot(x - cam.tx, z - cam.tz); list.push([dd, v, x, z]); }
  list.sort((a, b) => a[0] - b[0]);
  list.forEach(([dd, v, x, z], k) => { projV.set(x, v.b.stage === 'bangun' ? 11 : 7.5, z).project(camera);
    const far = cam.dist > 135 && !v.label.classList.contains('vote') && !v.label.classList.contains('mine');
    const on = !far && k < 28 && projV.z < 1 && Math.abs(projV.x) < 1.05 && projV.y > -1 && projV.y < .82 && cam.dist < 230;
    v.label.style.display = on ? '' : 'none'; if (on) v.label.style.transform = `translate(${(projV.x * .5 + .5) * w}px,${(-projV.y * .5 + .5) * h}px) translate(-50%,-100%)`; });
}

/* ---------- mode tokoh (ala Roblox): badan beranggota, lompat, lari, emote, kamera orang ketiga ---------- */
const WALKABLE = ['taman', 'lapangan', 'tugu', 'pasar', 'pkl', 'sawah'];
const walk = { on: false, x: 0, z: 0, dir: 0, face: 0, joy: { x: 0, y: 0 }, near: null, rig: null, label: null, bubble: null, bubbleT: 0, t: 0, y: 0, vy: 0, ground: true, sprint: false, emote: null, emoteT: 0, jumpReq: false, saved: null, moving: false };
function partGeo(fn){ P = []; fn(); return merge(P, true); }
// Tokoh 1:6,5 bermeter (spek-gaya §4.4; ukuran = NPC, c2d RIG): kaki ,70 · badan ,62 · leher ,12 · kepala ,26 → 1,70 (+ topi warna pemain), tanpa wajah. Lengan & kaki berengsel di bahu & pinggul.
function buildRig(prof, color){
  const pc = profColor(prof), skin = '#E8B890', pants = '#3B4752', shoe = '#2A2320';
  const rig = new THREE.Group(); const body = new THREE.Group(); rig.add(body);
  const mk = (g, x, y, z) => { const m = withInk(new THREE.Mesh(g, VMAT)); m.castShadow = true; m.position.set(x, y, z); body.add(m); return m; };
  P = []; box(.40, .62, .22, 0, 0, 0, pc); box(.41, .06, .23, 0, .56, 0, '#FFFFFF'); box(.08, .07, .02, .1, .42, .115, color); const torso = mk(merge(P, true, ACTOR_INK), 0, RIG.hip, 0);
  P = []; box(.10, .12, .10, 0, 0, 0, skin); box(.21, .26, .23, 0, .12, 0, skin); box(.225, .07, .245, 0, .32, -.005, '#2E2A28'); cyl(.125, .05, 0, .37, -.01, color); box(.2, .025, .12, 0, .37, .12, color); const head = mk(merge(P, true, ACTOR_INK_MIRING), 0, RIG.neck, 0);
  const sleeve = (c) => { P = []; box(.10, .62, .11, 0, -.62, 0, skin); box(.115, .22, .125, 0, -.22, 0, c); return merge(P, true, ACTOR_INK); };   // lengan baju pendek warna profesi
  const armL = mk(sleeve(pc), -RIG.armX, RIG.shoulder, 0), armR = mk(sleeve(pc), RIG.armX, RIG.shoulder, 0);
  const legL = mk(rigLimb(.15, .70, .16, pants, shoe, .09, ACTOR_INK_MIRING), -RIG.legX, RIG.hip, 0), legR = mk(rigLimb(.15, .70, .16, pants, shoe, .09, ACTOR_INK_MIRING), RIG.legX, RIG.hip, 0);
  rig.userData = { body, torso, head, armL, armR, legL, legR }; return rig;
}
function walkBlocked(x, z){
  const i = Math.round(x / T + HALF), j = Math.round(z / T + HALF);
  if (i < 0 || j < 0 || i >= N || j >= N) return true; if (!isLot(i, j)) return false; if (!openSet.has(districtOf(i, j))) return true;
  const id = S.occ.get(j * N + i); if (!id) return false; const b = S.buildings.get(id); if (!b || b.stage !== 'jadi') return false;
  return !WALKABLE.includes(b.type);
}
function startWalk(){
  const me = S.me; const home = me.home_building_id && S.buildings.get(me.home_building_id);
  // berdiri ,6 m di depan batas kavling (spek 1,2): kamera 8,2 m dari muka rumah → dinding 2 lantai > 60 % tinggi layar
  let f = 0;
  if (home){ const [x, z] = centerOf(home), lh = (f = facingOfB(home)) % 2 ? home.w : home.h; walk.x = x + FACE_DIR[f][0] * (lh * T / 2 + .6); walk.z = z + FACE_DIR[f][1] * (lh * T / 2 + .6); if (walkBlocked(walk.x, walk.z)){ walk.x = wx(108); walk.z = wx(110); f = 0; } }
  else { walk.x = wx(109) - T / 2 + 1.6; walk.z = wx(109) + T / 2; f = 3; if (walkBlocked(walk.x, walk.z)){ walk.x = wx(108); walk.z = wx(110); f = 0; } }   // tanpa rumah: tepi barat alun-alun (tugu 109,109) menghadap patung (dulu tengah badan kolektor — lensa mata 1,5 m melihat aspal & langit saja)
  walk.rig = buildRig(me.profession, me.color); scene.add(walk.rig);
  walk.label = document.createElement('div'); walk.label.className = 'lbl mine'; walk.label.innerHTML = `<span>${esc(me.name)}</span>`; $('#labels').appendChild(walk.label);
  walk.bubble = document.createElement('div'); walk.bubble.className = 'bubble'; walk.bubble.hidden = true; $('#labels').appendChild(walk.bubble);
  const face = Math.atan2(-FACE_DIR[f][0], -FACE_DIR[f][1]);   // menghadap rumah; kamera di belakang tokoh (sisi jalan)
  walk.saved = { ...cam }; Object.assign(walk, { on: true, near: null, y: 0, vy: 0, ground: true, sprint: false, emote: null, t: 0, face, dir: face, moving: false });
  // lensa tokoh (spek §4.7): titik tatap 1,5 m di atas lantai dunia (Y0), jarak 6,5, phi 1,48 (elevasi 5°), FOV 62/75, near ,2
  cam.tx = walk.x; cam.tz = walk.z; cam.ty = Y0 + 1.5; cam.dist = 6.5; cam.phi = 1.48; cam.theta = Math.atan2(FACE_DIR[f][1], FACE_DIR[f][0]); fly = null; setLens();
}
function stopWalk(){ walk.on = false; if (walk.rig){ scene.remove(walk.rig); walk.rig.traverse(o => o.geometry && o.geometry.dispose()); walk.rig = null; } for (const k of ['label', 'bubble']) if (walk[k]){ walk[k].remove(); walk[k] = null; } cam.tx = walk.x; cam.tz = walk.z; cam.ty = 0; cam.dist = 70; cam.phi = clamp(walk.saved?.phi ?? .85, PHI_MIN, PHI_MAX); setLens(); }
function walkJump(){ if (walk.on && walk.ground && walk.emote !== 'duduk'){ walk.vy = 6.5; walk.ground = false; walk.emote = null; } }
function walkEmote(k){ if (!walk.on || !walk.ground) return; walk.emote = walk.emote === k ? null : k; walk.emoteT = 0; }
function walkSay(text){ if (!walk.on || !walk.bubble) return; walk.bubble.textContent = text; walk.bubble.hidden = false; walk.bubbleT = now() + 6000; }
const _ang = (a, b, t) => { let d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * t; };
function stepWalk(dt){
  const R = walk.rig.userData, tnow = performance.now() / 1000;
  let ix = walk.joy.x, iy = walk.joy.y;
  if (keys['w'] || keys['arrowup']) iy -= 1; if (keys['s'] || keys['arrowdown']) iy += 1; if (keys['a'] || keys['arrowleft']) ix -= 1; if (keys['d'] || keys['arrowright']) ix += 1;
  const m = Math.hypot(ix, iy); if (m > 1){ ix /= m; iy /= m; }
  const sprint = walk.sprint || !!keys['shift'];
  const fx = -Math.cos(cam.theta), fz = -Math.sin(cam.theta), rx = Math.sin(cam.theta), rz = -Math.cos(cam.theta);
  const sp = sprint ? 8 : 4.5, vx = (fx * -iy + rx * ix) * sp, vz = (fz * -iy + rz * ix) * sp, moving = Math.hypot(vx, vz) > .3;
  if (moving && walk.emote === 'duduk') walk.emote = null;
  if (moving){ const nx = walk.x + vx * dt, nz = walk.z + vz * dt; if (!walkBlocked(nx, walk.z)) walk.x = nx; if (!walkBlocked(walk.x, nz)) walk.z = nz; walk.dir = Math.atan2(vx, vz); walk.t += dt * (sprint ? 13 : 9); }
  if (walk.jumpReq){ walk.jumpReq = false; walkJump(); }
  if (!walk.ground){ walk.vy -= 30 * dt; walk.y += walk.vy * dt; if (walk.y <= 0){ walk.y = 0; walk.ground = true; walk.vy = 0; puff(walk.x, walk.z); } }
  const L = LHALF - 1; walk.x = clamp(walk.x, -L, L); walk.z = clamp(walk.z, -L, L);
  walk.moving = moving; walk.face = _ang(walk.face, walk.dir, Math.min(1, dt * 14));
  // --- animasi ---
  const sw = moving ? Math.sin(walk.t) * (sprint ? 1.05 : .7) : 0, ease = Math.min(1, dt * 12);
  let aL = -sw, aR = sw, lL = sw, lR = -sw, aLz = .08, aRz = -.08, bodyY = 0, lean = moving ? (sprint ? -.22 : -.08) : 0, headY = 0, bodyRot = 0;
  if (!walk.ground){ aL = aR = -2.7; lL = -.5; lR = .45; lean = .1; }
  if (walk.emote){ walk.emoteT += dt; const e = walk.emoteT;
    if (walk.emote === 'lambai'){ aR = -2.9; aRz = -.5 + Math.sin(e * 11) * .45; aL = 0; lL = lR = 0; headY = Math.sin(e * 11) * .08; if (e > 2.8) walk.emote = null; }
    else if (walk.emote === 'joget'){ aL = -2.4 + Math.sin(e * 8) * .5; aR = -2.4 - Math.sin(e * 8) * .5; aLz = .6; aRz = -.6; bodyY = Math.abs(Math.sin(e * 8)) * .12; bodyRot = Math.sin(e * 4) * .35; lL = Math.sin(e * 8) * .3; lR = -lL; if (e > 4.2) walk.emote = null; }
    else if (walk.emote === 'duduk'){ lL = lR = -1.5; bodyY = -.45; aL = aR = -.35; }
    else if (walk.emote === 'hore'){ aL = aR = -3; aLz = .35; aRz = -.35; bodyY = Math.abs(Math.sin(e * 9)) * .18; if (e > 2.2) walk.emote = null; }
  }
  const breathe = (!moving && walk.ground && !walk.emote) ? Math.sin(tnow * 2.2) * .02 : 0;
  R.armL.rotation.x += (aL - R.armL.rotation.x) * ease; R.armR.rotation.x += (aR - R.armR.rotation.x) * ease; R.armL.rotation.z += (aLz - R.armL.rotation.z) * ease; R.armR.rotation.z += (aRz - R.armR.rotation.z) * ease;
  R.legL.rotation.x += (lL - R.legL.rotation.x) * ease; R.legR.rotation.x += (lR - R.legR.rotation.x) * ease;
  R.body.position.y += (bodyY - R.body.position.y) * ease; R.body.rotation.x += (lean - R.body.rotation.x) * ease; R.body.rotation.y += (bodyRot - R.body.rotation.y) * ease;
  R.torso.scale.y = 1 + breathe; R.head.position.y = RIG.neck + headY * .35 + (moving ? Math.abs(Math.sin(walk.t)) * .02 : 0);
  walk.rig.position.set(walk.x, Y0 + walk.y, walk.z); walk.rig.rotation.y = walk.face;
  // --- kamera orang ketiga mengikuti dari belakang ---
  cam.tx += (walk.x - cam.tx) * Math.min(1, dt * 7); cam.tz += (walk.z - cam.tz) * Math.min(1, dt * 7);
  // --- bangunan terdekat untuk tombol "Lihat" ---
  let best = null, bd = 11; for (const b of S.buildings.values()){ const [x, z] = centerOf(b); const d = Math.hypot(x - walk.x, z - walk.z) - Math.max(b.w, b.h) * T * .35; if (d < bd){ bd = d; best = b; } }
  if ((best?.id || null) !== walk.near){ walk.near = best?.id || null; const btn = $('#walkAct'); btn.hidden = !best; if (best) btn.textContent = 'Lihat ' + (best.label || catOf(best.type).n); $('#walkhint').textContent = best ? (best.label || catOf(best.type).n) + ' · ' + (best.owner_kind === 'negara' ? 'milik negara' : best.owner || 'warga') : 'Jalan-jalan di ' + DIST_NAME[districtOf(clamp(Math.round(walk.x / T + HALF), 0, N - 1), clamp(Math.round(walk.z / T + HALF), 0, N - 1))]; }
  projV.set(walk.x, Y0 + 2.1 + walk.y + R.body.position.y, walk.z).project(camera); const sx = (projV.x * .5 + .5) * innerWidth, sy = (-projV.y * .5 + .5) * innerHeight;
  walk.label.style.transform = `translate(${sx}px,${sy}px) translate(-50%,-100%)`;
  if (!walk.bubble.hidden){ if (now() > walk.bubbleT) walk.bubble.hidden = true; else walk.bubble.style.transform = `translate(${sx}px,${sy - 34}px) translate(-50%,-100%)`; }
}
// debu kecil saat mendarat
function puff(x, z){ if (LOW) return; const geo = new THREE.BufferGeometry(), n = 14, p = new Float32Array(n * 3), vel = [];
  for (let k = 0; k < n; k++){ const a = k / n * Math.PI * 2; p[k*3] = x; p[k*3+1] = Y0 + .2; p[k*3+2] = z; vel.push([Math.cos(a) * 2.5, 1.2, Math.sin(a) * 2.5]); }
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3)); const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: lin('#E9D9B0'), size: .35, transparent: true })); scene.add(pts); sparks.push({ pts, vel, t: .9 }); }
{ // joystick mengambang: sentuh di mana saja di area kiri-bawah, pusat joystick pindah ke ibu jari
  const zone = $('#joyzone'), joy = $('#joy'), knob = joy.querySelector('i'); let jid = null, ox = 0, oy = 0;
  const R = () => joy.offsetWidth / 2;
  const set = e => { let x = (e.clientX - ox) / R(), y = (e.clientY - oy) / R(); const m = Math.hypot(x, y); if (m > 1){ x /= m; y /= m; }
    const k = m < .12 ? 0 : 1; walk.joy = { x: x * k, y: y * k }; knob.style.transform = `translate(${x * R() * .62}px,${y * R() * .62}px)`; };
  zone.addEventListener('pointerdown', e => { jid = e.pointerId; try { zone.setPointerCapture(jid); } catch (_) {}
    const r = R(), w = innerWidth, h = innerHeight; ox = clamp(e.clientX, r + 8, w - r - 8); oy = clamp(e.clientY, r + 8, h - r - 8);
    joy.style.left = (ox - r) + 'px'; joy.style.top = (oy - r) + 'px'; joy.style.bottom = 'auto'; joy.classList.add('on'); set(e); });
  zone.addEventListener('pointermove', e => { if (e.pointerId === jid) set(e); });
  const end = e => { if (e && e.pointerId !== jid) return; jid = null; walk.joy = { x: 0, y: 0 }; knob.style.transform = ''; joy.style.left = joy.style.top = joy.style.bottom = ''; joy.classList.remove('on'); };
  zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end); }

/* ---------- mode hemat otomatis bila HP kewalahan ---------- */
let perf = { n: 0, sum: 0, done: LOW || HEMAT_Q === '0' || HEMAT_Q === '2', start: performance.now() + 4000 }, hematOn = LOW;   // ?hemat=0/2: kualitas dipaksa, tanpa hemat otomatis
function applyHemat(auto){
  if (hematOn) return; hematOn = true;
  // bayangan TETAP menyala (spek-gaya §2.4): peta 1024, span ≤ 120 (applyCam), resolusi 1×, pohon tanpa castShadow
  renderer.setPixelRatio(1);
  if (sun.shadow.mapSize.x > 1024){ sun.shadow.mapSize.set(1024, 1024); if (sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map = null; } }
  for (const k in treeMeshes) treeMeshes[k].castShadow = false;
  for (const k in npcParts){ npcParts[k].count = Math.floor(WALKERS / 2); syncInk(npcParts[k]); } carMesh.count = Math.floor(CARS / 2); syncInk(carMesh);
  resize(); if (auto){ store.set('nz_hemat', true); toast('Mode hemat dinyalakan otomatis supaya kota tetap lancar. Bisa diubah di menu Kota.'); }
}
function measurePerf(dt, t){ if (perf.done || document.hidden || t < perf.start) return; perf.n++; perf.sum += dt; if (perf.n >= 150){ perf.done = true; const fps = perf.n / perf.sum; if (fps < 26) applyHemat(true); } }

/* ---------- loop ---------- */
let last = performance.now(), acc1 = 0, acc5 = 0, frameSkip = 0;
function renderFrame(nowT){
  requestAnimationFrame(renderFrame);
  if (document.hidden) { last = nowT; return; }
  if (LOW && (frameSkip ^= 1)) return;
  const dt = Math.min(.05, (nowT - last) / 1000); last = nowT;
  stepKeys(dt);
  measurePerf(dt, nowT); if (walk.on) stepWalk(dt);
  if (fly && walk.on) fly = null;   // mode tokoh: kamera mengikuti tokoh, bukan terbang
  if (fly){ cam.tx += (fly.x - cam.tx) * .1; cam.tz += (fly.z - cam.tz) * .1; zoomTo(cam.dist + (fly.dist - cam.dist) * .1); if (Math.abs(fly.x - cam.tx) + Math.abs(fly.z - cam.tz) + Math.abs(fly.dist - cam.dist) < .6) fly = null; }
  stepMovers(dt); stepSparks(dt); stepDonorClouds(dt);
  for (const j of cranes) j.rotation.y += dt * .25;
  const cl = clouds.userData.list; cl.forEach((c, k) => { c.x += c.sp * dt; if (c.x > 600 * KT) c.x = -600 * KT; _m4.compose(_v3.set(c.x, c.y, c.z), _q.set(0,0,0,1), _s3.set(c.s, c.s * .8, c.s)); clouds.setMatrixAt(k, _m4); }); clouds.instanceMatrix.needsUpdate = true;
  if (!LOW && !MOBILE){ const a = riverGeo.attributes.position, tt = nowT / 1000; for (let k = 0; k < a.count; k++){ a.array[k*3+1] = riverBase[k*3+1] + Math.sin(riverBase[k*3] * .08 + tt * 1.6) * .18 + Math.cos(riverBase[k*3+2] * .5 + tt) * .08; } a.needsUpdate = true; }
  stepVisQueue();   // bangunan dari server dibuat bertahap (c3), terdekat dulu
  applyCam(); updateEdgeVis(); renderer.render(scene, camera); placeLabels();
  acc1 += dt; if (acc1 > 1){ acc1 = 0; applyTime(); refreshChunks(); for (const v of vis.values()) if (v.building){ applyProgress(v); updateLabel(v); } }
  acc5 += dt; if (acc5 > 4){ acc5 = 0; ensureVisibleDistricts(); for (const v of vis.values()) if (v.label && !v.building) updateLabel(v); }
}
