import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const dirs = [
  path.join(root, 'node_modules/iconsax-react/dist/esm'),
  path.join(root, 'node_modules/iconsax-react/dist/cjs')
];

let totalPatched = 0;

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && !f.startsWith('_'));
  for (const file of files) {
    const full = path.join(dir, file);
    let code = fs.readFileSync(full, 'utf8');
    
    // Pattern in iconsax:
    // var variant = _refX.variant, color = _refX.color, size = _refX.size,
    // or: var variant = _ref.variant,
    const newCode = code.replace(
      /var variant = (_ref\d*)\.variant,\s*color = \1\.color,\s*size = \1\.size,/g,
      'var variant = $1.variant || "Linear", color = $1.color || "currentColor", size = $1.size || "24",'
    );
    
    if (newCode !== code) {
      fs.writeFileSync(full, newCode, 'utf8');
      totalPatched++;
    }
  }
}

console.log(`Successfully patched ${totalPatched} icons in iconsax-react!`);
