#!/usr/bin/env node
// Generates PNG icons from icon.svg using @resvg/resvg-js
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '@resvg/resvg-js';

const __dir = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dir, '../public');

const svg = readFileSync(resolve(publicDir, 'icon.svg'), 'utf8');

const sizes = [
  { name: 'icons/icon-192.png',     size: 192 },
  { name: 'icons/icon-512.png',     size: 512 },
  { name: 'apple-touch-icon.png',   size: 180 },
  { name: 'favicon-32.png',         size: 32  },
];

for (const { name, size } of sizes) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
  });
  const png = resvg.render().asPng();
  const out = resolve(publicDir, name);
  writeFileSync(out, png);
  console.log(`✓ ${name} (${size}×${size})`);
}
