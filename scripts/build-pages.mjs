import { cp, mkdir, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
await mkdir(new URL('docs/', root), { recursive: true });
await cp(new URL('dist/', root), new URL('docs/', root), { recursive: true });
await writeFile(new URL('docs/.nojekyll', root), '');
console.log('GitHub Pages files prepared in docs/');
