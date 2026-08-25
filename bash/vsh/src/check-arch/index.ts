/**
 * @file vsh check-arch - 架构守护工具
 * @author YDSZ Team
 * @since 2026-08-23
 * @description 检查项目架构规范，确保模块依赖方向正确（分层约束）。
 *              2026-08-24 重构：修复 glob 匹配退化问题，基于「源文件目录前缀 + import specifier 前缀」双层判定，
 *              并默认递归收集 main/apps/comm 下全部源码文件。
 */

import { readFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { collectSourceFiles, extractSpecifiers } from '../shared/fs-path.ts';

/** 架构规则配置 */
interface ArchRule {
  /** 规则名称 */
  name: string;
  /** 源文件相对 rootDir 的目录前缀（命中后才检查其导入） */
  from: string[];
  /** 禁止出现的 import specifier 前缀（字面量匹配，避免误伤 @ydsz 公开别名） */
  to: string[];
  /** 规则说明 */
  description: string;
}

/** 违规结果 */
interface ArchViolation {
  rule: string;
  file: string;
  line: number;
  message: string;
}

/** 默认架构规则（路径前缀基于 tsconfig.paths 与目录约定） */
const DEFAULT_RULES: ArchRule[] = [
  {
    name: 'no-app-direct-import-effects',
    from: ['apps/'],
    to: ['comm/effects', '../comm/effects', '../../comm/effects'],
    description: '子应用不应直接依赖 comm/effects 内部模块（应通过 @ydsz/* 公开包访问）',
  },
  {
    name: 'no-main-import-apps',
    from: ['main/'],
    to: ['apps/', '@ydsz/userinfo-web', '@ydsz/system-web', '@ydsz/message-web', '@ydsz/cronjob-web', '@ydsz/workflow-web', '@ydsz/nextwiki-web', '@ydsz/literule-web', '@ydsz/agent-web'],
    description: '主应用不应依赖子应用代码',
  },
  {
    name: 'utils-no-effects',
    from: ['comm/utils/'],
    to: ['comm/effects', '../comm/effects', '@ydsz/effects'],
    description: '工具模块不应依赖 effects 模块',
  },
];

/** 文件路径是否落在某目录前缀下 */
function underDir(fileRel: string, prefix: string): boolean {
  return fileRel === prefix || fileRel.startsWith(prefix);
}

/** 检查单个文件的 import 是否违反规则 */
function checkFile(filePath: string, rules: ArchRule[], rootDir: string): ArchViolation[] {
  const violations: ArchViolation[] = [];
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const fileRel = relative(rootDir, filePath).replace(/\\/g, '/');

  for (const rule of rules) {
    const fromHit = rule.from.some((p) => underDir(fileRel, p));
    if (!fromHit) continue;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const specs = extractSpecifiers(line);
      for (const spec of specs) {
        if (rule.to.some((t) => spec === t || spec.startsWith(t + '/') || spec.startsWith(t))) {
          violations.push({
            rule: rule.name,
            file: filePath,
            line: i + 1,
            message: `${rule.description} -> 命中 import "${spec}"`,
          });
        }
      }
    }
  }
  return violations;
}

/**
 * 执行架构检查
 */
export async function checkArch(options: {
  rootDir?: string;
  rules?: ArchRule[];
  files?: string[];
}): Promise<ArchViolation[]> {
  const rootDir = options.rootDir ?? process.cwd();
  const rules = options.rules ?? DEFAULT_RULES;
  const allViolations: ArchViolation[] = [];

  const files = options.files ?? collectSourceFiles(rootDir);
  for (const file of files) {
    allViolations.push(...checkFile(file, rules, rootDir));
  }
  return allViolations;
}

// CLI 入口
if (import.meta.url === `file://${process.argv[1]}`) {
  const rootDir = resolve(process.argv[2] ?? process.cwd());
  console.log(`🔍 执行架构检查: ${rootDir}`);
  checkArch({ rootDir })
    .then((violations) => {
      if (violations.length === 0) {
        console.log('✅ 架构检查通过：未发现违规依赖');
        process.exit(0);
      }
      console.error(`❌ 发现 ${violations.length} 处架构违规:\n`);
      for (const v of violations) {
        console.error(`  [${v.rule}] ${relative(rootDir, v.file)}:${v.line}`);
        console.error(`    ${v.message}`);
      }
      process.exit(1);
    })
    .catch((err) => {
      console.error('架构检查出错:', err);
      process.exit(2);
    });
}
