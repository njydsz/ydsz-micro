const fs = require('fs');
const sfc = require('../node_modules/.pnpm/@vue+compiler-sfc@3.5.40/node_modules/@vue/compiler-sfc/dist/compiler-sfc.cjs.js');
const raw = fs.readFileSync('comm/@core/ui-kit/ydsz-ui/src/components/fieldset/YdFieldset.vue', 'utf8');
const lines = raw.split(/\r?\n/);
const rest = lines.slice(11).join('\n');
for (const i of [0,1,2,3,4,5,6,7,8,9,10]) {
  const prefix = lines.slice(0, 11).filter((_, idx) => idx !== i).join('\n');
  const { errors } = sfc.parse(prefix + '\n' + rest, { filename: 'x.vue' });
  console.log('without line', i+1, errors.map((e) => e.message));
}
