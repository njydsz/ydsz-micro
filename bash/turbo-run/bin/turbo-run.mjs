#!/usr/bin/env node
/**
 * Turbo 任务运行器入口。
 *
 * @remarks
 * 包装 turbo 命令，统一各 workspace 任务的执行入口。
 * 注意：shebang 必须位于首行（此前误置于 JSDoc 之后导致解析失败）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */

import('../dist/index.mjs');
