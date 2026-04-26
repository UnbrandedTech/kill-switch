import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import kontra from 'rollup-plugin-kontra';

const REPORT = process.env.BUNDLE_REPORT === '1';

// rollup-plugin-kontra strips kontra features at build time. Defaults are
// all `false`; opt in only to what we actually use. This is the only thing
// that makes Button + Text + Grid fit in 13 KiB.
const kontraPlugin = kontra({
  gameObject: {
    anchor: true,    // Buttons + Text use anchor for centered layout
    group: true,     // Buttons add a Text child; Grid composes children
    radius: true     // Sprite uses radius for circle bounding
  },
  sprite: {},
  text: {
    align: true      // textAlign on Text
  },
  vector: {},
  debug: false
});

export default defineConfig({
  plugins: [
    kontraPlugin,
    // Visualizer only on `npm run report` so a normal build stays clean.
    ...(REPORT ? [visualizer({
      filename: 'dist/stats.html',
      template: 'treemap',
      gzipSize: true,
      brotliSize: false,
      sourcemap: true,
      open: false
    })] : [])
  ],
  base: './',
  publicDir: 'public',
  // Local file:-linked deps (kontra, super-kontra) live outside the project
  // root, so Vite's dep pre-bundler skips them by default. Forcing them in
  // here makes browser-facing imports resolve cleanly in dev.
  optimizeDeps: {
    include: ['kontra', 'super-kontra']
  },
  resolve: {
    // Symlinked file: deps need this so Vite doesn't bail when the realpath
    // sits outside the project root.
    preserveSymlinks: false
  },
  server: {
    port: 5173,
    open: false,
    // The sibling kontra/SuperKontra dirs are outside the Vite root; allow
    // serving from them so the dep pre-bundler can read source files.
    fs: {
      allow: ['..']
    }
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    // Source maps would bloat the shipped zip (~10x). Vite dev still has
    // them via on-the-fly transform; just keep them out of `dist/`.
    // Enable in report mode so the visualizer can attribute bytes to source.
    sourcemap: REPORT,
    assetsInlineLimit: 4096,
    minify: 'terser',
    terserOptions: {
      compress: { passes: 3, pure_getters: true },
      mangle: { toplevel: true }
    }
  }
});
