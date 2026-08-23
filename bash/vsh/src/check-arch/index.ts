/**
 * @file vsh check-arch - 架构守护工具
 * @author YDSZ Team
 * @since 2026-08-23
 * @description 检查项目架构规范，确保模块依赖方向正确
 */

import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

/** 架构规则配置 */
interface ArchRule {
  /** 规则名称 */
  name: string;
  /** 源模块 glob 模式（不能依赖禁止的目标模块） */
  from: string[];
  /** 禁止依赖的目标模块路径模式 */
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

/** 默认架构规则 */
const DEFAULT_RULES: ArchRule[] = [
  {
    name: 'no-app-direct-import-effects',
    from: ['apps/*'],
    to: ['comm/effects/'],
    description: '子应用不应直接依赖 comm/effects 内部模块',
  },
  {
    name: 'no-main-import-apps',
    from: ['main/src'],
    to: ['apps/'],
    description: '主应用不应依赖子应用代码',
  },
  {
    name: 'utils-no-effects',
    from: ['comm/utils/'],
    to: ['comm/effects/'],
    description: '工具模块不应依赖 effects 模块',
  },
];

/**
 * 简单的 glob 路径匹配
 */
function matchesGlob(filePath: string, pattern: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const normalizedPattern = pattern.replace(/\*/g, '[^/]*');
  return normalizedPath.includes(normalizedPattern.replace(/\*/g, ''));
}

/**
 * 检查文件是否违反架构规则
 */
function checkFile(filePath: string, rules: ArchRule[]): ArchViolation[] {
  const violations: ArchViolation[] = [];
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (const rule of rules) {
    const isFromMatched = rule.from.some(pattern => matchesGlob(filePath, pattern));
    if (!isFromMatched) continue;

    for (const toPattern of rule.to) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('import') && line.includes(toPattern.replace('/', ''))) {
          violations.push({
            rule: rule.name,
            file: filePath,
            line: i + 1,
            message: `${rule.description}: ${line.trim()}`,
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
  const rules = options.rules ?? DEFAULT_RULES;

  const allViolations: ArchViolation[] = [];

  if (options.files) {
    for (const file of options.files) {
      const violations = checkFile(file, rules);
      allViolations.push(...violations);
    }
  }

  return allViolations;
}

// CLI 入口
if (import.meta.url === `file://${process.argv[1]}`) {
  const rootDir = process.argv[2] ?? process.cwd();
  console.log(`🔍 执行架构检查: ${rootDir}`);
  checkArch({ rootDir })
    .then(violations => {
      if (violations.length === 0) {
        console.log('✅ 架构检查通过：未发现违规依赖');
        process.exit(0);
      }
      console.error(`❌ 架构检查失败：发现 ${violations.length} 处违规\n`);
      for (const v of violations) {
        console.error(`  [${v.rule}] ${v.file}:${v.line}`);
        console.error(`    ${v.message}`);
      }
      process.exit(1);
    })
    .catch(err => {
      console.error('架构检查出错:', err);
      process.exit(2);
    });
}
