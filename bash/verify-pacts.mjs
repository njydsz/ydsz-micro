#!/usr/bin/env node
/**
 * Pact 契约验证脚本
 *
 * <p>验证后端 Provider 是否履行了前端定义的契约。
 * <p>用于后端 CI 或本地开发验证。
 *
 * <p>使用方式:
 * <pre>
 *   node bash/verify-pacts.mjs                              # 验证全部 Pact
 *   node bash/verify-pacts.mjs --provider http://localhost:9001  # 指定 Provider URL
 *   node bash/verify-pacts.mjs --pact pacts/system-web-ydsz-system.json  # 验证单个 Pact
 * </pre>
 *
 * @path bash/verify-pacts.mjs
 * @author ydsz-team
 * @since 1.0.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

/**
 * 解析命令行参数
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    providerUrl: 'http://localhost:9000',
    pactPath: null,
    verbose: true,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--provider' && args[i + 1]) {
      result.providerUrl = args[i + 1];
      i++;
    } else if (args[i] === '--pact' && args[i + 1]) {
      result.pactPath = args[i + 1];
      i++;
    } else if (args[i] === '--quiet') {
      result.verbose = false;
    }
  }

  return result;
}

/**
 * 从 Pact 文件加载交互记录
 */
function loadPactFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * 加载所有 Pact 文件
 */
function loadAllPacts() {
  const pactsDir = path.join(ROOT, 'pacts');
  if (!fs.existsSync(pactsDir)) {
    return [];
  }

  const files = fs.readdirSync(pactsDir).filter(f => f.endsWith('.json'));
  return files.map(f => loadPactFile(path.join(pactsDir, f)));
}

/**
 * 验证单个交互
 */
async function verifyInteraction(interaction, providerBaseUrl, verbose) {
  const url = providerBaseUrl + interaction.request.path;
  const timeout = 10000;

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
      if (verbose) {
        console.error(`✗ ${interaction.description}: 状态码不匹配，期望 ${interaction.response.status}，实际 ${response.status}`);
      }
      return false;
    }

    // 验证响应体
    if (interaction.response.body) {
      const responseBody = await response.json();
      const expectedBody = interaction.response.body;

      if (expectedBody.code && responseBody.code !== expectedBody.code) {
        if (verbose) {
          console.error(`✗ ${interaction.description}: code 不匹配，期望 ${expectedBody.code}，实际 ${responseBody.code}`);
        }
        return false;
      }
    }

    if (verbose) {
      console.log(`✓ ${interaction.description}`);
    }
    return true;
  } catch (error) {
    if (verbose) {
      console.error(`✗ ${interaction.description}: 请求失败 - ${String(error)}`);
    }
    return false;
  }
}

/**
 * 验证 Pact 文件
 */
async function verifyPact(pact, providerBaseUrl, verbose) {
  const errors = [];
  let passed = 0;
  let failed = 0;

  for (const interaction of pact.interactions) {
    const success = await verifyInteraction(interaction, providerBaseUrl, verbose);
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
    consumer: pact.consumer.name,
    provider: pact.provider.name,
  };
}

/**
 * 生成验证报告
 */
function generateReport(results) {
  const lines = [];
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('              Pact 契约验证报告');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('');

  let totalPassed = 0;
  let totalFailed = 0;

  for (const result of results) {
    totalPassed += result.passed;
    totalFailed += result.failed;

    const status = result.success ? '✅ 通过' : '❌ 失败';
    lines.push(`  ${status}  ${result.consumer} -> ${result.provider}`);
    lines.push(`         通过: ${result.passed}  失败: ${result.failed}`);

    if (result.errors.length > 0) {
      for (const error of result.errors) {
        lines.push(`         ✗ ${error}`);
      }
    }
    lines.push('');
  }

  lines.push('───────────────────────────────────────────────────────────');
  lines.push(`  总计: 通过 ${totalPassed}  失败 ${totalFailed}`);
  lines.push('═══════════════════════════════════════════════════════════');

  return lines.join('\n');
}

/**
 * 主函数
 */
async function main() {
  const args = parseArgs();

  console.log('');
  console.log('🔍 Pact 契约验证');
  console.log(`   Provider URL: ${args.providerUrl}`);
  console.log('');

  // 加载 Pact 文件
  let pacts;
  if (args.pactPath) {
    const fullPath = path.isAbsolute(args.pactPath)
      ? args.pactPath
      : path.join(ROOT, args.pactPath);
    pacts = [loadPactFile(fullPath)];
  } else {
    pacts = loadAllPacts();
  }

  if (pacts.length === 0) {
    console.log('⚠️  未找到 Pact 文件');
    console.log('   运行测试生成: pnpm test:pact');
    console.log('   或指定文件: node bash/verify-pacts.mjs --pact pacts/xxx.json');
    process.exit(0);
  }

  console.log(`   加载 ${pacts.length} 个 Pact 文件`);
  console.log('');

  // 验证所有 Pact
  const results = [];
  for (const pact of pacts) {
    const result = await verifyPact(pact, args.providerUrl, args.verbose);
    results.push(result);
  }

  // 输出报告
  console.log(generateReport(results));

  // 返回状态码
  const allSuccess = results.every(r => r.success);
  if (!allSuccess) {
    console.log('');
    console.log('❌ 契约验证失败！后端未履行前端期望的契约。');
    process.exit(1);
  }

  console.log('');
  console.log('✅ 全部契约验证通过！');
}

main().catch(err => {
  console.error('验证脚本异常:', err);
  process.exit(1);
});
