/**
 * @file vsh code-workspace - 工作区配置管理工具
 * @author YDSZ Team
 * @since 2026-08-23
 * @description 同步 VS Code 工作区配置，统一管理扩展推荐和设置
 */

import { writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

/** 工作区配置 */
interface WorkspaceConfig {
  folders: Array<{ path: string; name?: string }>;
  settings: Record<string, unknown>;
  extensions: {
    recommendations: string[];
  };
  launch?: {
    version?: string;
    configurations?: unknown[];
  };
}

/** 推荐的扩展列表 */
const RECOMMENDED_EXTENSIONS = [
  'Vue.volar',
  'dbaeumer.vscode-eslint',
  'esbenp.prettier-vscode',
  'bradlc.vscode-tailwindcss',
  'usernamehw.errorlens',
  'eamodio.gitlens',
  'streetsidesoftware.code-spell-checker',
];

/** 推荐的工作区设置 */
const RECOMMENDED_SETTINGS = {
  'editor.formatOnSave': true,
  'editor.defaultFormatter': 'esbenp.prettier-vscode',
  'editor.codeActionsOnSave': {
    'source.fixAll.eslint': 'explicit',
    'source.organizeImports': 'never',
  },
  'eslint.validate': ['javascript', 'typescript', 'vue'],
  'tailwindCSS.experimental.classRegex': [
    ['clsx\\(([^)]*)\\)', ["\"([^\"]*)\"", "'([^']*)'"]],
    ['cn\\(([^)]*)\\)', ["\"([^\"]*)\"", "'([^']*)'"]],
  ],
};

/**
 * 扫描项目中的 apps 和 comm 目录
 */
function scanProjectFolders(rootDir: string): Array<{ path: string; name: string }> {
  const folders: Array<{ path: string; name: string }> = [];

  const scanDir = (dir: string, prefix: string) => {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        const relativePath = `./${prefix}/${entry.name}`;
        folders.push({
          path: relativePath,
          name: `${prefix}/${entry.name}`,
        });
      }
    }
  };

  scanDir(resolve(rootDir, 'apps'), 'apps');
  scanDir(resolve(rootDir, 'comm'), 'comm');
  scanDir(resolve(rootDir, 'main'), 'main');

  return folders;
}

/**
 * 生成工作区配置
 */
export function generateWorkspaceConfig(options: {
  rootDir?: string;
  extensions?: string[];
  settings?: Record<string, unknown>;
}): WorkspaceConfig {
  const rootDir = options.rootDir ?? process.cwd();
  const folders = scanProjectFolders(rootDir);

  // 根目录也添加
  folders.unshift({ path: '.', name: 'root' });

  return {
    folders,
    settings: { ...RECOMMENDED_SETTINGS, ...options.settings },
    extensions: {
      recommendations: [...RECOMMENDED_EXTENSIONS, ...(options.extensions ?? [])],
    },
  };
}

/**
 * 写入工作区配置文件
 */
export function writeWorkspaceFile(
  outputPath: string,
  config: WorkspaceConfig,
): void {
  const content = JSON.stringify(config, null, 2);
  writeFileSync(outputPath, content, 'utf-8');
  console.log(`✅ 工作区配置已写入: ${outputPath}`);
}

/**
 * 同步工作区配置
 */
export async function syncWorkspace(options: {
  rootDir?: string;
  output?: string;
}): Promise<void> {
  const rootDir = options.rootDir ?? process.cwd();
  const output = options.output ?? resolve(rootDir, 'ydsz-admin.code-workspace');

  const config = generateWorkspaceConfig({ rootDir });
  writeWorkspaceFile(output, config);
}

// CLI 入口
if (import.meta.url === `file://${process.argv[1]}`) {
  const rootDir = process.argv[2] ?? process.cwd();
  syncWorkspace({ rootDir })
    .then(() => {
      console.log('✅ 工作区配置同步完成');
      process.exit(0);
    })
    .catch(err => {
      console.error('工作区配置同步失败:', err);
      process.exit(1);
    });
}
