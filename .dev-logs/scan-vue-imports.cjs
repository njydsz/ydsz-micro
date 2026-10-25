const fs = require('fs');
const path = require('path');

const roots = ['apps', 'main/src', 'comm'];
const walk = (d) => {
  let out = [];
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.dev-logs', '.git'].includes(e.name)) continue;
    const p = path.join(d, e.name);
    out.push(...(e.isDirectory() ? walk(p) : [p]));
  }
  return out;
};

const files = roots.flatMap((r) => walk(r)).filter((f) => f.endsWith('.vue'));
const apis = [
  'computed', 'ref', 'reactive', 'watch', 'watchEffect',
  'onMounted', 'onUnmounted', 'onBeforeUnmount', 'onBeforeMount',
  'onActivated', 'onDeactivated', 'onUpdated', 'nextTick',
  'inject', 'provide', 'toRefs', 'toRef', 'shallowRef', 'shallowReactive',
  'markRaw', 'defineAsyncComponent', 'useSlots', 'useAttrs',
  'getCurrentInstance', 'triggerRef',
];

const bad = [];
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  const open = s.match(/<script[^>]*>/);
  if (!open) continue;
  const start = s.indexOf(open[0]) + open[0].length;
  const script = s.slice(start, s.lastIndexOf('</script>'));
  for (const a of apis) {
    const used = new RegExp(`(^|[^.\\w])${a}\\s*\\(`).test(script);
    if (!used) continue;
    const imported = new RegExp(
      `import\\s*(?:\\{[^}]*\\b${a}\\b[^}]*\\}|[\\w$]+)\\s*from\\s*['"]vue['"]`,
    ).test(script);
    const declared = new RegExp(`(?:const|let|function|class)\\s+${a}\\b`).test(script);
    if (!imported && !declared) bad.push(`${f} -> ${a}`);
  }
}
console.log(bad.join('\n'));
console.log('total', bad.length);
