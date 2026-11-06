/**
 * 共享依赖样式自托管同步脚本。
 *
 * @remarks
 * 将 vxe-table / vxe-pc-ui 的编译后样式从 node_modules 复制到
 * `public/vendor/<pkg>/style.css`，供 `viteVendorCssPlugin` 以 `<link>`
 * 注入，实现九个子应用共享同一份样式（原先每应用各打包一份，
 * gzip 约 68KB × 9 ≈ 612KB 重复载荷）。
 *
 * @usage
 *   node bash/sync-vendor-css.mts                    # 同步到各子应用 + main
 *   node bash/sync-vendor-css.mts apps/agent-web     # 仅同步指定目录
 *   node bash/sync-vendor-css.mts --check            # 校验副本一致性
 *
 * @path bash\sync-vendor-css.mts
 * @author ydsz-team
 * @since 4.1.0
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

/** 需要同步的样式（包名 → dist 内路径） */
const CSS_SOURCES = [
  { pkg: 'vxe-pc-ui', distPath: 'dist/style.css' },
  { pkg: 'vxe-table', distPath: 'dist/style.css' },
];

const args = process.argv.slice(2);
const isCheck = args.includes('--check');
const targets = args.filter((a) => !a.startsWith('--'));

/**
 * 解析包在 node_modules 中的实际路径。
 *
 * @remarks
 * vxe-table / vxe-pc-ui 由 `comm/effects/plugins` 声明依赖，根目录
 * `require.resolve` 找不到，需从 plugins 包上下文解析。
 */
function resolvePkgDir(pkg) {
  const bases = [
    path.join(ROOT, 'package.json'),
    path.join(ROOT, 'comm/effects/plugins/package.json'),
  ];
  for (const base of bases) {
    try {
      const script = `console.log(require.resolve('${pkg}/package.json', { paths: ['${path.dirname(base).replace(/\\/g, '/')}'] }))`;
      const out = execSync(`node -e ${JSON.stringify(script)}`, {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      if (out) {
        return path.dirname(out);
      }
    } catch {
      // 尝试下一个 base
    }
  }
  return null;
}

/** 计算文件 md5 */
function md5(file) {
  try {
    return execSync(`certutil -hashfile "${file}" MD5`, { encoding: 'utf8' })
      .split('\n')[1]
      ?.trim()
      ?.toUpperCase();
  } catch {
    return null;
  }
}

let failures = 0;

for (const { pkg, distPath } of CSS_SOURCES) {
  const pkgDir = resolvePkgDir(pkg);
  if (!pkgDir) {
    console.error(`✗ ${pkg}: 未在 node_modules 中找到`);
    failures++;
    continue;
  }
  const src = path.join(pkgDir, distPath);
  if (!fs.existsSync(src)) {
    console.error(`✗ ${pkg}: 源文件不存在 ${src}`);
    failures++;
    continue;
  }

  const destDirs = targets.length > 0
    ? targets.map((t) => (path.isAbsolute(t) ? t : path.join(ROOT, t)))
    : [
        path.join(ROOT, 'main'),
        ...fs
          .readdirSync(path.join(ROOT, 'apps'), { withFileTypes: true })
          .filter((e) => e.isDirectory())
          .map((e) => path.join(ROOT, 'apps', e.name)),
      ];

  for (const dir of destDirs) {
    const destDir = path.join(dir, 'public', 'vendor', pkg);
    const dest = path.join(destDir, 'style.css');
    fs.mkdirSync(destDir, { recursive: true });

    if (isCheck) {
      if (!fs.existsSync(dest)) {
        console.error(`✗ ${dest} 缺失`);
        failures++;
      } else if (md5(src) !== md5(dest)) {
        console.error(`✗ ${dest} 与源不一致`);
        failures++;
      }
      continue;
    }

    fs.copyFileSync(src, dest);
    const kb = (fs.statSync(dest).size / 1024).toFixed(1);
    console.log(`✓ ${path.relative(ROOT, dest)} (${kb} KB)`);
  }
}

if (isCheck) {
  console.log(failures === 0 ? '\n校验通过：所有 vendor 样式副本一致' : `\n校验失败：${failures} 项不一致`);
  process.exit(failures === 0 ? 0 : 1);
}
