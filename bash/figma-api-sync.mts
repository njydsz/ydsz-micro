/**
 * Figma API Sync CLI — 通过 Figma Variables REST API 同步 design-tokens。
 *
 * <p>用法：
 * <pre>{@code
 * # 设置环境变量
 * export FIGMA_ACCESS_TOKEN=figd_xxx
 * export FIGMA_FILE_KEY=your-file-key
 *
 * # 推送 tokens 到 Figma
 * node --experimental-strip-types comm/@core/ui-kit/design-tokens/src/figma-api-sync.mts push
 *
 * # 校验差异
 * node --experimental-strip-types comm/@core/ui-kit/design-tokens/src/figma-api-sync.mts diff
 *
 * # 降级为 JSON 导出（无需 token）
 * node --experimental-strip-types comm/@core/ui-kit/design-tokens/src/figma-api-sync.mts export
 * }</pre>
 *
 * @path comm\@core\ui-kit\design-tokens\src\figma-api-sync.mts
 * @author ydsz-ai
 * @since 26.11.03
 */

import {
  buildFigmaVariablesPayload,
  diffWithFigma,
  getFigmaConfig,
  pushToFigma,
} from '../comm/@core/ui-kit/design-tokens/src/figma-api-sync.ts';

async function main(): Promise<void> {
  const command = process.argv[2] ?? 'export';
  const config = getFigmaConfig();

  switch (command) {
    case 'push': {
      if (!config) {
        console.error('❌ 需要设置 FIGMA_ACCESS_TOKEN 和 FIGMA_FILE_KEY 环境变量');
        process.exit(1);
      }
      await pushToFigma(config);
      break;
    }

    case 'diff': {
      if (!config) {
        console.error('❌ 需要设置 FIGMA_ACCESS_TOKEN 和 FIGMA_FILE_KEY 环境变量');
        process.exit(1);
      }
      const result = await diffWithFigma(config);
      console.log(
        `📊 差异结果：新增 ${result.added.length}，删除 ${result.removed.length}，修改 ${result.modified.length}`,
      );
      if (result.added.length > 0) console.log('  新增:', result.added);
      if (result.removed.length > 0) console.log('  删除:', result.removed);
      if (result.modified.length > 0)
        console.log(
          '  修改:',
          result.modified.map((m) => m.name),
        );
      break;
    }

    case 'export':
    default: {
      const payload = buildFigmaVariablesPayload();
      console.log(JSON.stringify(payload, null, 2));
      break;
    }
  }
}

main().catch((error) => {
  console.error('❌ Figma API 同步失败:', error);
  process.exit(1);
});
