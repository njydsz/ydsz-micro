/**
 * turbo-run CLI 入口 —— 交互式 turbo script 运行器
 *
 * 提供 `turbo-run <script>` 命令，在交互式终端中选择要执行的 pnpm script。
 * 功能：
 *   - 通过 cac 库解析命令行参数
 *   - 代理 run() 函数执行交互式脚本选择
 *   - 捕获并格式化错误，非零退出码退出进程
 *
 * 用法：
 *   pnpm turbo-run dev          # 运行开发模式
 *   pnpm turbo-run build --all  # 运行所有子应用的构建
 *
 * @path bash\turbo-run\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { colors, consola } from '@ydsz/node-utils';

import { cac } from 'cac';

import { run } from './run';

try {
  const turboRun = cac('turbo-run');

  turboRun
    .command('[script]')
    .usage(`Run turbo interactively.`)
    .action(async (command: string) => {
      run({ command });
    });

  // Invalid command
  turboRun.on('command:*', () => {
    consola.error(colors.red('Invalid command!'));
    process.exit(1);
  });

  turboRun.usage('turbo-run');
  turboRun.help();
  turboRun.parse();
} catch (error) {
  consola.error(error);
  process.exit(1);
}
