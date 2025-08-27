import { build } from 'esbuild';
import { rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outDir = 'dist-electron';
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

await build({
  entryPoints: ['main/main.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: join(outDir, 'main.cjs'),
  format: 'cjs',
  external: ['electron']
});

await build({
  entryPoints: ['preload/preload.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: join(outDir, 'preload.cjs'),
  format: 'cjs',
  external: ['electron']
});

// small manifest to locate renderer dist in prod
writeFileSync(join(outDir, 'paths.json'), JSON.stringify({ renderer: 'dist/index.html' }, null, 2));



