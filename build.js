// Build: web/ → dist/ (index.html kecil + a/app.<hash>.js yang di-minify). Pemakaian: npm run build   (INLINE=1 → satu file)
const fs = require('fs'), path = require('path'), crypto = require('crypto'); const { minify } = require('terser');
(async () => {
  const W = path.join(__dirname, 'web'), D = path.join(__dirname, 'dist'), rd = f => fs.readFileSync(path.join(W, f), 'utf8');
  const list = (re, dir = W) => fs.readdirSync(dir).filter(f => re.test(f)).sort();
  const js = list(/^c1.*\.js$/).map(rd).join('') + '\n' + list(/\.js$/, path.join(W, 'models')).map(f => rd('models/' + f) + '\n').join('') + list(/^c[2-9].*\.js$/).map(rd).join('');
  const shell = rd('a_head.html') + rd('b_body.html');
  if (!js.startsWith('<script>') || !js.trimEnd().endsWith('</html>')) throw new Error('urutan berkas web/ tidak sesuai');
  const src = js.slice('<script>'.length, js.trimEnd().lastIndexOf('</script>'));
  new Function(src);   // cek sintaks
  fs.rmSync(D, { recursive: true, force: true }); fs.mkdirSync(path.join(D, 'a'), { recursive: true });
  const tail = '\n</body>\n</html>\n';
  if (process.env.INLINE === '1') fs.writeFileSync(path.join(D, 'index.html'), shell + '<script>' + src + '</script>' + tail);
  else {
    const min = (await minify(src, { compress: { passes: 2 }, mangle: true, ecma: 2019 })).code;
    const h = crypto.createHash('md5').update(min).digest('hex').slice(0, 10);
    fs.writeFileSync(path.join(D, 'a', `app.${h}.js`), min);
    fs.writeFileSync(path.join(D, 'index.html'), shell + `<script src="a/app.${h}.js"></script>` + tail);
    console.log(`dist/index.html ${fs.statSync(path.join(D, 'index.html')).size} B + dist/a/app.${h}.js ${min.length} B`);
  }
  for (const f of ['_headers', 'config.js']) if (fs.existsSync(path.join(__dirname, f))) fs.copyFileSync(path.join(__dirname, f), path.join(D, f));
  const E = process.env;   // hosting (mis. Cloudflare Pages): isi variabel lingkungan NZ_SUPABASE_URL + NZ_SUPABASE_KEY (publishable), opsional NZ_SITE
  if (!fs.existsSync(path.join(__dirname, 'config.js'))) {
    if (E.NZ_SUPABASE_URL && E.NZ_SUPABASE_KEY) fs.writeFileSync(path.join(D, 'config.js'), 'window.NZ_CONFIG=' + JSON.stringify({ url: E.NZ_SUPABASE_URL, key: E.NZ_SUPABASE_KEY, site: E.NZ_SITE || undefined }) + ';\n');
    else console.log('PERINGATAN: config.js belum ada — salin config.example.js menjadi config.js, atau isi NZ_SUPABASE_URL dan NZ_SUPABASE_KEY.');
  }
})().catch(e => { console.error('BUILD GAGAL:', e.message); process.exit(1); });
