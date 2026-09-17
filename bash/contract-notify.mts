/**
 * 契约变更通知脚本
 *
 * <p>检测后端 API 契约变更，通过企业微信/飞书/钉钉 webhook 通知前端团队。
 * <p>集成到 CI 流程中，当契约漂移时自动发送通知。
 *
 * <p>使用方式:
 *   node bash/contract-notify.mjs                    # 检查并通知
 *   node bash/contract-notify.mjs --dry-run          # 仅检查，不发送通知
 *   node bash/contract-notify.mjs --webhook=<url>    # 指定 webhook 地址
 *
 * <p>环境变量:
 *   WEBHOOK_URL          webhook 地址（企业微信/飞书/钉钉）
 *   YDSZ_CLOUD_ROOT      后端仓库根目录
 *   GITHUB_REPOSITORY    GitHub 仓库名（CI 环境）
 *   GITHUB_SHA           GitHub commit SHA（CI 环境）
 *   GITHUB_ACTOR         GitHub 触发者（CI 环境）
 *
 * @path bash\contract-notify.mjs
 * @author ydsz-team
 * @since 4.0.0
 * @see docs/云顶编码规范.md 第 6 章 API 请求规范
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

/**
 * 服务映射表
 */
const SERVICE_MAP = {
  userinfo: { spec: 'http://localhost:9002/v3/api-docs', output: 'apps/userinfo-web/src/api/sdk' },
  system: { spec: 'http://localhost:9001/v3/api-docs', output: 'apps/system-web/src/api/sdk' },
  message: { spec: 'http://localhost:9004/v3/api-docs', output: 'apps/message-web/src/api/sdk' },
  cronjob: { spec: 'http://localhost:9006/v3/api-docs', output: 'apps/cronjob-web/src/api/sdk' },
  workflow: { spec: 'http://localhost:9005/v3/api-docs', output: 'apps/workflow-web/src/api/sdk' },
  nextwiki: { spec: 'http://localhost:9003/v3/api-docs', output: 'apps/nextwiki-web/src/api/sdk' },
  literule: { spec: 'http://localhost:9007/v3/api-docs', output: 'apps/literule-web/src/api/sdk' },
  agent: { spec: 'http://localhost:9008/v3/api-docs', output: 'apps/agent-web/src/api/sdk' },
};

/**
 * 读取 lock 文件的 hash 值
 *
 * @param outputDir 输出目录
 * @returns hash 值，不存在返回空字符串
 */
function readLockHash(outputDir) {
  const lockPath = join(ROOT, outputDir, '.api-contract.lock');
  if (!existsSync(lockPath)) return '';
  return readFileSync(lockPath, 'utf-8').trim();
}

/**
 * 计算当前契约的 hash
 *
 * @param outputDir 输出目录
 * @returns hash 值
 */
function calculateCurrentHash(outputDir) {
  const hash = createHash('sha256');
  const specPath = join(ROOT, outputDir, 'openapi.json');
  if (existsSync(specPath)) {
    hash.update(readFileSync(specPath, 'utf-8'));
  }
  return hash.digest('hex');
}

/**
 * 发送企业微信通知
 *
 * @param webhookUrl webhook 地址
 * @param content 通知内容
 */
async function sendWecomNotification(webhookUrl, content) {
  const markdown = {
    msgtype: 'markdown',
    markdown: {
      content,
    },
  };

  try {
    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(markdown),
    });
    return resp.ok;
  } catch (err) {
    console.error(`企业微信通知发送失败: ${err.message}`);
    return false;
  }
}

/**
 * 发送飞书通知
 *
 * @param webhookUrl webhook 地址
 * @param content 通知内容
 */
async function sendFeishuNotification(webhookUrl, content) {
  const card = {
    msg_type: 'interactive',
    card: {
      header: {
        title: {
          tag: 'plain_text',
          content: 'YDSZ API 契约变更通知',
        },
        template: 'orange',
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: content,
          },
        },
      ],
    },
  };

  try {
    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
    });
    return resp.ok;
  } catch (err) {
    console.error(`飞书通知发送失败: ${err.message}`);
    return false;
  }
}

/**
 * 发送通用 webhook 通知
 *
 * @param webhookUrl webhook 地址
 * @param content 通知内容
 */
async function sendGenericNotification(webhookUrl, content) {
  try {
    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: content,
        title: 'YDSZ API 契约变更通知',
      }),
    });
    return resp.ok;
  } catch (err) {
    console.error(`通知发送失败: ${err.message}`);
    return false;
  }
}

/**
 * 主流程
 */
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const webhookArg = args.find((a) => a.startsWith('--webhook='));
  const webhookUrl = webhookArg ? webhookArg.split('=')[1] : process.env.WEBHOOK_URL;

  console.log('[contract-notify] 检查 API 契约变更...\n');

  const changes = [];

  for (const [name, { output }] of Object.entries(SERVICE_MAP)) {
    const oldHash = readLockHash(output);
    const currentHash = calculateCurrentHash(output);

    if (oldHash && oldHash !== currentHash) {
      console.log(`[${name}] ✗ 契约变更 detected`);
      changes.push({
        service: name,
        oldHash,
        newHash: currentHash,
      });
    } else if (!oldHash) {
      console.log(`[${name}] · 无基线，跳过`);
    } else {
      console.log(`[${name}] ✓ 契约一致`);
    }
  }

  if (changes.length === 0) {
    console.log('\n[contract-notify] 无契约变更');
    return;
  }

  console.log(`\n[contract-notify] 发现 ${changes.length} 个服务契约变更`);

  // 构建通知内容
  const repoName = process.env.GITHUB_REPOSITORY || 'ydsz-micro';
  const commitSha = process.env.GITHUB_SHA || 'unknown';
  const actor = process.env.GITHUB_ACTOR || 'unknown';
  const shortSha = commitSha.substring(0, 7);

  const changeList = changes
    .map((c) => {
      return `- **${c.service}**: \`${c.oldHash.substring(0, 7)}\` → \`${c.newHash.substring(0, 7)}\``;
    })
    .join('\n');

  const content = `## ⚠️ API 契约变更通知

> 后端接口已变更，请前端团队及时同步 SDK。

**变更服务:**
${changeList}

**触发信息:**
- 仓库: ${repoName}
- Commit: [${shortSha}](https://github.com/${repoName}/commit/${commitSha})
- 触发者: @${actor}

**处理方式:**
\`\`\`bash
pnpm gen:api
\`\`\`

*@ Frontend Team 请及时处理*`;

  if (isDryRun) {
    console.log('\n[contract-notify] Dry-run 模式，不发送通知');
    console.log('通知内容:');
    console.log(content);
    return;
  }

  if (!webhookUrl) {
    console.log('\n[contract-notify] 未配置 webhook，仅输出通知内容');
    console.log(content);
    return;
  }

  // 尝试发送通知
  console.log('\n[contract-notify] 发送通知...');

  // 根据 webhook URL 判断通知类型
  let success = false;
  if (webhookUrl.includes('weixin') || webhookUrl.includes('qyapi')) {
    success = await sendWecomNotification(webhookUrl, content);
  } else if (webhookUrl.includes('feishu') || webhookUrl.includes('lark')) {
    success = await sendFeishuNotification(webhookUrl, content);
  } else {
    success = await sendGenericNotification(webhookUrl, content);
  }

  if (success) {
    console.log('[contract-notify] ✓ 通知发送成功');
  } else {
    console.error('[contract-notify] ✗ 通知发送失败');
  }
}

main();
