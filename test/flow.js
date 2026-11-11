const { chromium } = require('playwright'); const { setup } = require('./mock');
const OUT = require('path').join(__dirname, 'out') + '/'; require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const W = +(process.argv[2] || 390), H = W < 500 ? 844 : 800, tag = W < 500 ? 'hp' : 'pc';
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, hasTouch: W < 500 });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const st = await setup(page, { session: true });
  await page.goto('http://nz.test/v2/'); await page.waitForTimeout(5000);
  const snap = async n => { await page.waitForTimeout(700); await page.screenshot({ path: OUT + tag + '-' + n + '.png' }); };
  await snap('1-buat-tokoh');
  await page.fill('#rn', 'Andi Bangun'); await page.click('[data-dp="Tukang"]'); await page.click('[data-dc="#3E6FB0"]'); await page.click('#modal [data-act="register"]');
  await page.waitForTimeout(1200); await snap('2-sambutan');
  await page.click('#modal [data-act="start"]'); await page.waitForTimeout(3000); await snap('3-bangun');   // suggest_lot → langsung mode tempatkan rumah gratis
  console.log('suggest_lot:', JSON.stringify(await page.evaluate(() => place && [place.type, place.i, place.j, place.zone, place.facing, place.err])));
  if (!(await page.evaluate(() => !!place))){ await page.click('[data-place="rumah"]'); await page.waitForTimeout(500); }
  // grid v3: kavling (99,112) = zona KOTA (gang) di Kampung Pusat, boleh rumah gratis
  // deterministik: kamera diterapkan langsung (applyCam) sebelum proyeksi — render perangkat lunak > 1 dtk/frame, jadi menunggu 600 ms belum tentu
  // memperbarui matriks kamera; ketukan diulang (maks 3×) sampai place = (99,112)
  let tapOk = null;
  for (let k = 0; k < 3 && !tapOk; k++){
    const pt = await page.evaluate(() => { cam.tx = wx(99); cam.tz = wx(113); cam.dist = 70; fly = null; applyCam(); camera.updateMatrixWorld(true);
      const v = new THREE.Vector3(wx(99), Y0, wx(112)).project(camera); return [(v.x * .5 + .5) * innerWidth, (-v.y * .5 + .5) * innerHeight]; });
    await page.mouse.click(pt[0], pt[1]); await page.waitForTimeout(800);
    const pl = await page.evaluate(() => place && [place.i, place.j]); tapOk = pl && pl[0] === 99 && pl[1] === 112 ? pl : null;
    console.log('ketuk (99,112) percobaan', k + 1, '→ place', JSON.stringify(pl)); }
  await snap('4-penempatan');
  await page.click('#placebar [data-act="confirm-place"]'); await page.waitForTimeout(2500); await snap('5-info-rumah');
  await page.click('#sheet [data-act="close"]'); await page.click('[data-dock="voting"]'); await page.waitForTimeout(800);
  await page.click('.list [data-act="vote"][data-v="1"]'); await page.waitForTimeout(1500); await snap('6-voting');
  await page.click('#sheet [data-act="close"]').catch(() => {}); await page.click('#meChip'); await page.waitForTimeout(800); await snap('7-profil');
  console.log('calls:', st.calls.map(c => c[0]).filter(n => !/get_/.test(n)).join(', '), '| build:', JSON.stringify(st.calls.filter(c => c[0] === 'build_private').map(c => c[1])), '| rumah:', JSON.stringify(st.buildings.filter(b => b.owner_id).map(b => [b.type, b.i, b.j, b.facing, b.zone])));
  console.log('errors:', errs.slice(0, 5));
  await ctx.close();
  // tamu: buka modal masuk
  const ctx2 = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, hasTouch: W < 500 }); const p2 = await ctx2.newPage();
  await setup(p2, {}); await p2.goto('http://nz.test/v2/'); await p2.waitForTimeout(4000); await p2.click('#meChip'); await p2.click('[data-lmode="daftar"]'); await p2.waitForTimeout(600); await p2.screenshot({ path: OUT + tag + '-8-masuk.png' });
  await browser.close();
})();
