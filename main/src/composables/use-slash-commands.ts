/**
 * 斜杠命令解析与注册 composable
 *
 * 解析以 "/" 开头的搜索查询，匹配命令注册表并执行对应动作。
 * Redisette 风格内置命令：/lock、/theme、/goto 等。
 * 命令以 query 的首个词作为命令名，剩余部分作为参数。
 *
 * @path main\src\composables\use-slash-commands.ts
 * @author ydsz-team
 * @since 4.4.0
 */

import { computed, ref, type Ref } from 'vue';

import { useRouter } from 'vue-router';

import { createLogger } from '@ydsz-core/shared/utils';

import { $t } from '#/locales';

/** 模块级日志器 */
const logger = createLogger('useSlashCommands');

/** 斜杠命令执行动作的上下文 —— 提供路由跳转、面板关闭等统一能力 */
export interface SlashCommandContext {
  /** 面板关闭回调（可选） */
  closePanel?: () => void;
}

/** 斜杠命令定义 */
export interface SlashCommand {
  /** 命令名（不含 "/" 前缀），如 "lock" */
  name: string;
  /** 简短描述（i18n key） */
  descriptionKey: string;
  /** 可选图标名（format: "lucide:icon-name"） */
  icon?: string;
  /** 可选键盘快捷键字符（单字符，用于面板内提示） */
  shortcut?: string;
  /**
   * 命令执行函数 —— 接收参数列表，返回是否执行成功。
   * 返回 false 时，外部可 fallback 到默认行为。
   */
  action: (args: string[], ctx: SlashCommandContext) => boolean | Promise<boolean>;
}

/** 命令执行结果 */
export interface SlashCommandResult {
  /** 匹配到的命令 */
  command: SlashCommand;
  /** 传入的参数列表 */
  args: string[];
  /** 描述文案（已 $t 解析的描述） */
  description: string;
  /** 图标名 */
  icon?: string;
}

/** 注册表 —— 包含 8 个内置命令（可在外部扩展） */
const COMMANDS: readonly SlashCommand[] = [
  {
    name: 'lock',
    descriptionKey: 'main.slashCmd.lock',
    icon: 'lucide:lock',
    action: (_args, ctx) => {
      window.dispatchEvent(new CustomEvent('micro-kernel:lock-screen'));
      ctx.closePanel?.();
      return true;
    },
  },
  {
    name: 'unlock',
    descriptionKey: 'main.slashCmd.unlock',
    icon: 'lucide:lock-open',
    action: (_args, ctx) => {
      window.dispatchEvent(new CustomEvent('micro-kernel:unlock-screen'));
      ctx.closePanel?.();
      return true;
    },
  },
  {
    name: 'theme',
    descriptionKey: 'main.slashCmd.theme',
    icon: 'lucide:palette',
    action: (args, ctx) => {
      const mode = args[0]?.toLowerCase();
      if (mode === 'dark' || mode === 'light') {
        window.dispatchEvent(
          new CustomEvent('micro-kernel:set-theme', { detail: { mode } }),
        );
        ctx.closePanel?.();
        return true;
      }
      // 无参数或无效参数时列出可选值，不关闭面板
      return false;
    },
  },
  {
    name: 'goto',
    descriptionKey: 'main.slashCmd.goto',
    icon: 'lucide:arrow-right',
    action: (args, ctx) => {
      const path = args[0];
      if (!path) return false;
      window.dispatchEvent(
        new CustomEvent('micro-kernel:navigate', { detail: { path } }),
      );
      ctx.closePanel?.();
      return true;
    },
  },
  {
    name: 'search',
    descriptionKey: 'main.slashCmd.search',
    icon: 'lucide:search',
    action: (_args, _ctx) => {
      // /search <query> —— 将剩余部分作为搜索词填入搜索框，不关闭面板
      // 实际动作由外部搜索面板处理（query 中除 /search 前缀部分）
      return false;
    },
  },
  {
    name: 'help',
    descriptionKey: 'main.slashCmd.help',
    icon: 'lucide:help-circle',
    action: (_args, _ctx) => {
      // 不关闭面板，由搜索面板显示所有命令列表
      return false;
    },
  },
  {
    name: 'feedback',
    descriptionKey: 'main.slashCmd.feedback',
    icon: 'lucide:message-square',
    action: (_args, ctx) => {
      window.dispatchEvent(new CustomEvent('micro-kernel:open-feedback'));
      ctx.closePanel?.();
      return true;
    },
  },
  {
    name: 'reload',
    descriptionKey: 'main.slashCmd.reload',
    icon: 'lucide:rotate-cw',
    action: (_args, ctx) => {
      ctx.closePanel?.();
      window.location.reload();
      return true;
    },
  },
] as const;

/**
 * 斜杠命令 composable
 *
 * 接收搜索词 Ref，解析以 "/" 开头的命令查询，返回匹配的内置命令。
 *
 * @param queryRef —— 搜索词（双向绑定）
 * @param ctx —— 斜杠命令执行上下文
 * @returns 解析结果与命令执行辅助函数
 *
 * @since 4.4.0
 */
export function useSlashCommands(
  queryRef: Ref<string>,
  ctx: SlashCommandContext = {},
) {
  const router = (() => {
    try {
      return useRouter();
    } catch {
      logger.warn('useRouter not available, navigate action will fallback to events');
      return null;
    }
  })();

  /** 命令行解析结果 */
  const parsed = computed((): SlashCommandResult | null => {
    const raw = queryRef.value.trim();
    if (!raw.startsWith('/')) return null;

    const parts = raw.slice(1).split(/\s+/).filter(Boolean);
    if (parts.length === 0) return null;

    const cmdName = parts[0].toLowerCase();
    const args = parts.slice(1);

    const cmd = COMMANDS.find((c) => c.name === cmdName);
    if (!cmd) return null;

    return {
      command: cmd,
      args,
      description: cmd.descriptionKey ? $t(cmd.descriptionKey) : '',
      icon: cmd.icon,
    };
  });

  /** 是否为斜杠命令查询 */
  const isSlashCommand = computed(() => parsed.value !== null);

  /** 当前命令名（若无则空字符串） */
  const currentCommandName = computed(() => parsed.value?.command.name ?? '');

  /** 命令参数（若无则空数组） */
  const currentArgs = computed(() => parsed.value?.args ?? []);

  /**
   * 执行当前匹配的命令
   *
   * @returns true 表示命令已执行并处理完毕，false 表示未匹配或执行失败
   */
  async function execute(): Promise<boolean> {
    const result = parsed.value;
    if (!result) return false;
    try {
      return await result.command.action(result.args, ctx);
    } catch (err) {
      logger.error(`Slash command /${result.command.name} failed:`, err);
      return false;
    }
  }

  /**
   * 获取预设主题值列表（用于 /theme 命令时面板提示展示）
   */
  const themeOptions = computed(() => ['dark', 'light'] as const);

  /**
   * 获取全部可用命令列表（用于 /help 或空 query 时面板展示）
   */
  const availableCommands = computed(() =>
    COMMANDS.map((cmd) => ({
      name: cmd.name,
      description: cmd.descriptionKey ? $t(cmd.descriptionKey) : '',
      icon: cmd.icon,
      shortcut: cmd.shortcut,
    })),
  );

  /**
   * 获取子应用的推荐路径列表（用于 /goto 命令时面板提示展示）
   */
  function getAppPaths(): Array<{ name: string; path: string }> {
    // 遍历 micro-kernel 已注册路径，由事件总线提供
    try {
      const routes: Array<{ name: string; path: string }> = [];
      window.dispatchEvent(
        new CustomEvent('micro-kernel:collect-routes', {
          detail: { callback: (r: Array<{ name: string; path: string }>) => routes.push(...r) },
        }),
      );
      return routes;
    } catch {
      return [];
    }
  }

  /** 供路由跳转动作在 router 可用时被 fallback 调用 */
  function navigate(path: string) {
    if (router) {
      router.push(path).catch((err) => {
        logger.warn(`Router navigate failed: ${path}`, err);
      });
    } else {
      window.dispatchEvent(
        new CustomEvent('micro-kernel:navigate', { detail: { path } }),
      );
    }
  }

  return {
    parsed,
    isSlashCommand,
    currentCommandName,
    currentArgs,
    execute,
    themeOptions,
    availableCommands,
    getAppPaths,
    navigate,
    router,
  };
}

export type SlashCommandRegistry = Map<string, SlashCommand>;
