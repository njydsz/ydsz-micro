/**
 * YDSZ 微前端 vendor 外置预设
 *
 * 为子应用提供统一的 `withVendorExternals` 工具函数，将 Vue / Pinia / VxeTable 等
 * 核心库标记为 rollup external，配合主应用 importmap 运行时加载，消除子应用间
 * 重复打包、缩减产物体积、提升缓存命中率。
 *
 * 主应用通过 `withMainShellExternals` 保留 importmap.lock.json 外置策略，
 * 保持语义对称。
 *
 * @path conf\vite-config\src\ydsz-vite-preset.ts
 * @author ydsz-team
 * @since 4.4.0
 */
import type { UserConfig } from 'vite';

// ==================== 依赖清单 ====================

/**
 * 需外置的 vendor 包列表。
 *
 * 匹配规则：
 * - 字符串：精确匹配包名（含子路径，如 'vue/runtime-core' 也会命中 'vue'）
 * - 正则：匹配 import 路径中任意部分（如 /echarts/ 命中 'echarts/core'）
 *
 * 与 bash/importmap.lock.json 及 conf/vite-config/src/micro-shared-deps.ts 对齐，
 * 版本由 pnpm catalog 统一维护。
 */
const VENDOR_PACKAGES: ReadonlyArray<string | RegExp> = [
  // Vue 生态
  'vue',
  'vue-router',
  'vue-i18n',
  'pinia',
  // VueUse
  '@vueuse/core',
  '@vueuse/shared',
  // VXE 表格
  'vxe-table',
  'vxe-pc-ui',
  'xe-utils',
  // 图表 / 工具
  'echarts',
  /echarts/,          // echarts 子路径（echarts/core、echarts/charts 等）
  'dayjs',
  'qs',
  'lodash-es',
  'defu',
  'bignumber.js',
] as const;

// ==================== 选项类型 ====================

interface WithVendorExternalsOptions {
  /**
   * 仅嵌入模式（iframe / micro-kernel）时外置，独立开发模式走完整 bundle。
   *
   * 独立开发模式下子应用脱离主壳运行，window.__ydsz_importmap__ 未就绪，
   * 若做 external 会导致运行时 import 失败；embedOnly=true 时会在该场景直接返回原配置。
   *
   * @default true
   */
  embedOnly?: boolean;
  /**
   * 额外要 external 的包名或正则，追加到 VENDOR_PACKAGES 之后。
   *
   * 子应用特有的大包（如特殊图表库、富文本编辑器）可通过此参数扩展，
   * 无需修改共享源码。
   *
   * @default []
   */
  extraExternals?: Array<string | RegExp>;
}

// ==================== 工具函数 ====================

/**
 * 判断一个 import 路径是否命中 vendor 外置规则。
 *
 * 对 VENDOR_PACKAGES 中的每条规则依次判断：
 * - 字符串规则：精确匹配或子路径前缀匹配（如 'vue' 命中 'vue/runtime-core'）
 * - 正则规则：测试 import 路径是否包含匹配片段
 *
 * @param id - 待检测的 import 路径
 * @param patterns - 匹配规则列表
 * @returns 是否命中
 */
function matchVendorExternal(
  id: string,
  patterns: ReadonlyArray<string | RegExp>,
): boolean {
  for (const pattern of patterns) {
    if (typeof pattern === 'string') {
      // 精确匹配包名或子路径前缀
      if (id === pattern || id.startsWith(`${pattern}/`)) {
        return true;
      }
    } else if (pattern.test(id)) {
      return true;
    }
  }
  return false;
}

/**
 * 微前端子应用 vendor 外置预设 —— 将 Vue / Pinia / VxeTable 等核心库标记为 external。
 *
 * 设计理念：
 * 1. 嵌入模式下子应用由 micro-kernel 加载，window.__ydsz_importmap__ 已注册所有外部依赖，
 *    import 语句在浏览器端由 importmap 解析到主壳预加载的 ESM 实例，保证单例与版本一致。
 * 2. 独立开发模式（pnpm dev 子应用 / standalone）下没有主壳提供 importmap，
 *    必须完整 bundle 所有依赖才能运行；通过 embedOnly=true 自动跳过。
 *
 * @param config - 子应用传入的 Vite UserConfig（仅 vite 片段，不含 application 层）
 * @param options - 行为选项
 * @returns 合并 external 规则后的 UserConfig
 *
 * @example
 * // apps/agent-web/vite.config.mts
 * import { defineConfig, withVendorExternals } from '@ydsz/vite-config';
 *
 * export default defineConfig(async () => {
 *   return {
 *     application: {},
 *     vite: withVendorExternals({
 *       base: '/',
 *       server: { port: 5610, cors: true, proxy: { ... } },
 *     }),
 *   };
 * });
 */
export function withVendorExternals(
  config: UserConfig,
  options: WithVendorExternalsOptions = {},
): UserConfig {
  const { embedOnly = true, extraExternals = [] } = options;

  // 独立开发模式：无 YDSZ_EMBED 标识时返回原配置，保证子应用可独立运行
  if (embedOnly && !process.env.YDSZ_EMBED) {
    return config;
  }

  const patterns: Array<string | RegExp> = [
    ...VENDOR_PACKAGES,
    ...extraExternals,
  ];

  // 已有的 external 规则（如有），合并为新 function 形式
  const existingExternal = config.build?.rollupOptions?.external;

  /**
   * 合并后的 external 判定函数。
   *
   * 保持原有 external 规则优先，再追加 vendor 外置规则；
   * 任一命中即视为 external。
   */
  const mergedExternal = (id: string): boolean => {
    // 1. 先检查既有规则（string / RegExp / function / array）
    if (existingExternal) {
      if (typeof existingExternal === 'function') {
        // Rollup ExternalPluginHook 签名为 (id, importer?, isResolved?)，已有规则可能是任意外置判定函数
        if ((existingExternal as (source: string) => boolean)(id)) return true;
      } else if (Array.isArray(existingExternal)) {
        if (matchVendorExternal(id, existingExternal)) return true;
      } else if (typeof existingExternal === 'string') {
        if (id === existingExternal || id.startsWith(`${existingExternal}/`)) return true;
      } else if (existingExternal instanceof RegExp && existingExternal.test(id)) {
        return true;
      }
    }

    // 2. 追加 vendor 规则
    return matchVendorExternal(id, patterns);
  };

  return {
    ...config,
    build: {
      ...config.build,
      rollupOptions: {
        ...config.build?.rollupOptions,
        external: mergedExternal,
      },
    },
  };
}

/**
 * 主应用（main-shell）vendor 外置预设 —— 当前为 importmap.lock.json 策略保留位。
 *
 * 主应用通过 bash/importmap.lock.json + sync-shared-deps 工具链管理外部依赖版本，
 * 实际 external 标记由 `viteImportMapPlugin`（conf/vite-config/src/plugins/importmap.ts）
 * 在构建期 resolveId 钩子中完成，此处提供对称 API 以便语义统一。
 *
 * @param config - 主应用传入的 Vite UserConfig（仅 vite 片段）
 * @returns 原配置（不做修改，保持扩展点）
 */
 
export function withMainShellExternals(
  config: UserConfig,
  _options: WithVendorExternalsOptions = {},
): UserConfig {
  return config;
}
