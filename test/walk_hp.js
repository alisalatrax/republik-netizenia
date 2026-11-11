// Tata letak kontrol mode tokoh di HP: tidak ada yang bertumpuk, joystick mengambang menggerakkan tokoh.
const { chromium, devices } = require('playwright'); const path = require('path'); const { setup } = require('./mock');
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = []; const OUT = process.argv[2] || path.join(__dirname, 'out'); require('fs').mkdirSync(OUT, { recursive: true });
  for (const dev of ['iPhone SE', 'iPhone 13', 'Pixel 7']){
    const ctx = await b.newContext({ ...devices[dev] }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(dev + ': ' + e.message));
    await setup(p, { session: true, registered: true, prof: 'Pedagang' }); await p.goto('http://nz.test/v2/'); await p.waitForTimeout(4500);
    await p.click('.fab[data-act="walk"]'); await p.waitForTimeout(500);
    const vp = p.viewportSize(); const a0 = await p.evaluate(() => [walk.x, walk.z]);
    await p.evaluate(([x, y]) => { const z = $('#joyzone'); const ev = (t, X, Y) => z.dispatchEvent(new PointerEvent(t, { pointerId: 9, clientX: X, clientY: Y, bubbles: true })); ev('pointerdown', x, y); ev('pointermove', x + 10, y - 55); window.__end = () => ev('pointerup', x + 10, y - 55); }, [vp.width * .28, vp.height * .78]);
    await p.waitForTimeout(1200);
    const joyAt = await p.evaluate(() => { const r = $('#joy').getBoundingClientRect(); return [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)]; });
    await p.evaluate(() => window.__end()); const a1 = await p.evaluate(() => [walk.x, walk.z]);
    // tampilkan semuanya sekaligus (kasus terburuk): tombol Lihat dengan nama panjang + emote terbuka
    await p.evaluate(() => { const a = $('#walkAct'); a.hidden = false; a.textContent = 'Lihat Rumah Pak Mulyo Sekeluarga'; $('#emotes').hidden = false; $('#walkhint').textContent = 'Rumah Pak Mulyo · milik negara · sangat panjang sekali'; });
    await p.waitForTimeout(300);
    const boxes = await p.evaluate(() => { const q = s => [...document.querySelectorAll(s)].filter(e => !e.hidden && e.offsetParent !== null).map(e => { const r = e.getBoundingClientRect(); return { s: e.getAttribute('aria-label') || e.className || e.id, x: r.x, y: r.y, w: r.width, h: r.height }; });
      return [...q('.walkpad .wbtn'), ...q('#emotes .wbtn'), ...q('#walkAct'), ...q('#joy'), ...q('.walkexit'), ...q('#walkhint')]; });
    const hit = []; for (let i = 0; i < boxes.length; i++) for (let k = i + 1; k < boxes.length; k++){ const A = boxes[i], B = boxes[k];
      if (A.x < B.x + B.w - 1 && B.x < A.x + A.w - 1 && A.y < B.y + B.h - 1 && B.y < A.y + A.h - 1) hit.push(A.s + ' x ' + B.s); }
    const off = boxes.filter(B => B.x < 0 || B.y < 0 || B.x + B.w > vp.width + .5 || B.y + B.h > vp.height + .5).map(B => B.s);
    const small = boxes.filter(B => /wbtn|Lompat|Lari|Chat|Emote/.test(B.s) && Math.min(B.w, B.h) < 44).map(B => B.s);
    console.log(dev, vp.width + 'x' + vp.height, '| gerak', Math.hypot(a1[0] - a0[0], a1[1] - a0[1]).toFixed(1), '| joystick di', joyAt, '| tumpang:', hit.length ? hit : 'tidak ada', '| keluar layar:', off.length ? off : '-', '| < 44 px:', small.length ? small : '-');
    await p.screenshot({ path: path.join(OUT, 'walkhp-' + dev.replace(/ /g, '') + '.png'), timeout: 180000 }); await ctx.close(); }
  console.log('errors:', errs.slice(0, 5)); await b.close(); })();
