import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const appsDir = resolve(process.cwd(), 'apps');

function walkFiles(dir, ext = '.ts', result = []) {
  const items = readdirSync(dir);
  for (const item of items) {
    const full = join(dir, item);
    if (statSync(full).isDirectory()) {
      if (!['node_modules', 'dist', '.turbo'].includes(item)) {
        walkFiles(full, ext, result);
      }
    } else if (full.endsWith(ext) && !full.endsWith('.d.ts')) {
      result.push(full);
    }
  }
  return result;
}

// Find all .vue and .ts files in apps
const tsFiles = [];
const vueFiles = [];
for (const app of readdirSync(appsDir)) {
  const srcDir = join(appsDir, app, 'src');
  if (existsSync(srcDir) && statSync(srcDir).isDirectory()) {
    walkFiles(srcDir, '.ts', tsFiles);
    walkFiles(srcDir, '.vue', vueFiles);
  }
}

const allFiles = [...tsFiles, ...vueFiles];

let elMsgReplaced = 0;
let elMsgBoxReplaced = 0;
let elNotifyReplaced = 0;

for (const filePath of allFiles) {
  let content = readFileSync(filePath, 'utf-8');
  const original = content;

  // === Strategy 1: ElMessage → showToast ===
  // Check if file uses ElMessage
  if (content.includes('ElMessage')) {
    // Replace import
    // Case: import { ElMessage } from 'element-plus';
    content = content.replace(
      /import \{([^}]*)\bElMessage\b([^}]*)\} from 'element-plus';/g,
      (match, before, after) => {
        // Remove ElMessage from import, keep others
        const items = (before + after).split(',').map(s => s.trim()).filter(s => s && s !== 'ElMessage');
        if (items.length > 0) {
          return `import { ${items.join(', ')} } from 'element-plus';`;
        }
        return ''; // Remove entire import if ElMessage was the only import
      },
    );

    // Add showToast import if element-plus import was removed and showToast not already imported
    if (!content.includes("from 'element-plus'") && !content.includes("from '@ydsz/notification'")) {
      // Add after first import line
      content = content.replace(
        /(import .+;)\n/,
        "$1\nimport { showToast } from '@ydsz/notification';\n",
      );
    }

    // Replace ElMessage.xxx() calls
    content = content.replace(/\bElMessage\.info\(/g, 'showToast.info(');
    content = content.replace(/\bElMessage\.success\(/g, 'showToast.success(');
    content = content.replace(/\bElMessage\.warning\(/g, 'showToast.warning(');
    content = content.replace(/\bElMessage\.error\(/g, 'showToast.error(');
    content = content.replace(/\bElMessage\({/g, 'showToast({');
    content = content.replace(/\bElMessage\(/g, 'showToast(');

    // Convert ElMessage options format to showToast format
    // ElMessage({ message: 'xxx', type: 'success' }) → showToast.success('xxx')
    // This is handled by the simple replacements above for most cases

    if (content !== original) {
      writeFileSync(filePath, content, 'utf-8');
      elMsgReplaced++;
    }
  }

  // === Strategy 2: ElMessageBox.confirm → ydszConfirm ===
  if (original.includes('ElMessageBox') && original.includes('from \'element-plus\'')) {
    let c = content;

    // Add ydszConfirm import if needed
    if (!c.includes("from '@ydsz-core/ui-kit/popup-ui'")) {
      c = c.replace(
        /(import .+;)\n/,
        "$1\nimport { ydszConfirm } from '@ydsz-core/ui-kit/popup-ui';\n",
      );
    }
    content = c;
  }
}

console.log(`Files with ElMessage replaced: ${elMsgReplaced}`);
console.log(`Total EP imports remaining in apps: ${allFiles.filter(f => readFileSync(f, 'utf-8').includes('element-plus')).length}`);
