import { defineConfig } from 'vite';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

/** Archivos de public/ (rutas relativas con '/'). */
function publicFiles(dir, root = dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? publicFiles(full, root) : [relative(root, full).split('\\').join('/')];
  });
}

/**
 * Genera dist/sw.js a partir de src/pwa/sw.js con la lista de archivos a guardar para
 * funcionar sin conexión. Sin dependencias extra (no usa Workbox).
 */
function pwaPrecache() {
  return {
    name: 'apex-pwa-precache',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = new Set(['./']);
      for (const name of Object.keys(bundle)) {
        if (!name.endsWith('.map')) files.add(name);
      }
      for (const name of publicFiles(new URL('./public', import.meta.url).pathname)) files.add(name);
      const list = [...files].sort();
      const hash = createHash('sha256')
        .update(pkg.version)
        .update(list.join('\n'))
        .update(Object.values(bundle).map((c) => c.code ?? c.source ?? '').join(''))
        .digest('hex')
        .slice(0, 12);
      const template = readFileSync(new URL('./src/pwa/sw.js', import.meta.url), 'utf8');
      const source = template
        .replace('__CACHE_VERSION__', `${pkg.version}-${hash}`)
        .replace('__PRECACHE__', JSON.stringify(list, null, 2));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  // GitHub Pages sirve el sitio en https://starmise.github.io/Apex-Calendar/
  base: '/Apex-Calendar/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [pwaPrecache()],
  test: {
    environment: 'node',
  },
});
