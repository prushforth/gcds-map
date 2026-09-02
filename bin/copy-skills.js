#!/usr/bin/env node
// copy-skills.js - Copy the bundled gcds-ext-map markup skills into the consumer's
// .github/skills/ folder so AI coding agents (e.g. GitHub Copilot in VS Code) can
// discover them. Run from a consumer project root:
//   npx gcds-ext-map-skills
const fs = require('fs');
const path = require('path');

const pkgRoot = path.resolve(__dirname, '..');
// Prefer the published mirror; fall back to the source folder when run from a checkout.
const src = [path.join(pkgRoot, 'skills'), path.join(pkgRoot, '.github', 'skills')].find(
  (p) => fs.existsSync(p)
);

if (!src) {
  console.error('[gcds-ext-map-skills] Could not find a bundled skills folder in the package.');
  process.exit(1);
}

const dest = path.join(process.cwd(), '.github', 'skills');
fs.mkdirSync(dest, { recursive: true });
fs.cpSync(src, dest, { recursive: true });

console.log(`[gcds-ext-map-skills] Copied markup skills into ${path.relative(process.cwd(), dest) || '.github/skills'}/`);
console.log('[gcds-ext-map-skills] Restart your editor so the agent can discover the new skills.');
