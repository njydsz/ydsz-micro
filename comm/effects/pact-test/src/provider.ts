/**
 * @ydsz/pact-test — Provider 端契约验证
 *
 * <p>提供后端 Provider 端契约验证能力。
 * 后端 CI 可使用此模块验证是否履行了前端期望的契约。
 *
 * @path comm/effects/pact-test/src/provider.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import fs from 'node:fs';
import path from 'node:path';
import type { PactFile, PactInteractionRecord } from './types';

/**
 * Provider 验证结果
 */
export interface VerificationResult {
  /** 是否通过 */
  success: boolean;
  /** 通过的交互数 */
  passed: number;
  /** 失败的交互数 */
  failed: number;
  /** 错误详情 */
  errors: string[];
}

/**
 * Pact 文件加载器
 */
export class PactLoader {
  /**
   * 从文件加载 Pact
   * @param filePath - Pact JSON 文件路径
   * @returns PactFile
   */
  static loadFromFile(filePath: string): PactFile {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as PactFile;
  }

  /**
   * 从目录加载所有 Pact 文件
   * @param dirPath - Pact 文件目录
   * @returns PactFile[]
   */
  static loadFromDirectory(dirPath: string): PactFile[] {
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
    return files.map(f => PactLoader.loadFromFile(path.join(dirPath, f)));
  }

  /**
   * 获取所有交互
   * @param pacts - Pact 文件列表
   * @returns 交互记录列表
   */
  static getAllInteractions(pacts: PactFile[]): PactInteractionRecord[] {
    return pacts.flatMap(p => p.interactions);
  }
}

/**
 * Provider 契约验证器
 *
 * <p>验证后端 API 是否满足 Pact 文件中定义的期望。
 */
export class PactVerifier {
  constructor(
    private providerBaseUrl: string,
    private options: { timeout?: number; verbose?: boolean } = {},
  ) {}

  /**
   * 验证单个交互
   * @param interaction - 交互记录
   * @returns 验证结果
   */
  async verifyInteraction(interaction: PactInteractionRecord): Promise<boolean> {
    const url = `${this.providerBaseUrl}${interaction.request.path}`;
    const timeout = this.options.timeout ?? 10000;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: interaction.request.method,
        headers: interaction.request.headers,
        body: interaction.request.body
          ? JSON.stringify(interaction.request.body)
          : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 验证状态码
      if (response.status !== interaction.response.status) {
        if (this.options.verbose) {
          console.error(
            `✗ ${interaction.description}: 状态码不匹配，期望 ${interaction.response.status}，实际 ${response.status}`,
          );
        }
        return false;
      }

      // 验证响应体（简化验证：检查关键字段）
      if (interaction.response.body) {
        const responseBody = await response.json() as Record<string, unknown>;
        const expectedBody = interaction.response.body as Record<string, unknown>;

        if (expectedBody.code && responseBody.code !== expectedBody.code) {
          if (this.options.verbose) {
            console.error(
              `✗ ${interaction.description}: code 不匹配，期望 ${expectedBody.code}，实际 ${responseBody.code}`,
            );
          }
          return false;
        }
      }

      if (this.options.verbose) {
        console.log(`✓ ${interaction.description}`);
      }
      return true;
    } catch (error) {
      if (this.options.verbose) {
        console.error(`✗ ${interaction.description}: 请求失败 - ${String(error)}`);
      }
      return false;
    }
  }

  /**
   * 验证 Pact 文件
   * @param pact - Pact 文件
   * @returns 验证结果
   */
  async verifyPact(pact: PactFile): Promise<VerificationResult> {
    const errors: string[] = [];
    let passed = 0;
    let failed = 0;

    for (const interaction of pact.interactions) {
      const success = await this.verifyInteraction(interaction);
      if (success) {
        passed++;
      } else {
        failed++;
        errors.push(`[${pact.consumer.name} -> ${pact.provider.name}] ${interaction.description}`);
      }
    }

    return {
      success: failed === 0,
      passed,
      failed,
      errors,
    };
  }

  /**
   * 验证多个 Pact 文件
   * @param pacts - Pact 文件列表
   * @returns 验证结果
   */
  async verifyPacts(pacts: PactFile[]): Promise<VerificationResult> {
    const allErrors: string[] = [];
    let totalPassed = 0;
    let totalFailed = 0;

    for (const pact of pacts) {
      const result = await this.verifyPact(pact);
      totalPassed += result.passed;
      totalFailed += result.failed;
      allErrors.push(...result.errors);
    }

    return {
      success: totalFailed === 0,
      passed: totalPassed,
      failed: totalFailed,
      errors: allErrors,
    };
  }
}

/**
 * 快速验证 Pact 文件
 * @param pactFilePath - Pact 文件路径
 * @param providerBaseUrl - Provider 基础 URL
 * @returns 验证结果
 */
export async function verifyPactFile(
  pactFilePath: string,
  providerBaseUrl: string,
  options: { verbose?: boolean } = {},
): Promise<VerificationResult> {
  const pact = PactLoader.loadFromFile(pactFilePath);
  const verifier = new PactVerifier(providerBaseUrl, options);
  return verifier.verifyPact(pact);
}

/**
 * 生成 Pact 验证报告
 * @param result - 验证结果
 * @returns 报告字符串
 */
export function generateReport(result: VerificationResult): string {
  const lines: string[] = [];
  lines.push('=== Pact 契约验证报告 ===');
  lines.push('');
  lines.push(`状态: ${result.success ? '✅ 通过' : '❌ 失败'}`);
  lines.push(`通过: ${result.passed}`);
  lines.push(`失败: ${result.failed}`);
  lines.push('');

  if (result.errors.length > 0) {
    lines.push('失败详情:');
    for (const error of result.errors) {
      lines.push(`  - ${error}`);
    }
  }

  return lines.join('\n');
}
