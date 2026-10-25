/**
 * vue-i18n 初始化与语言包加载逻辑，支持扁平/目录结构及命名空间按需加载。
 *
 * @path comm\locales\src\i18n.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { App } from 'vue';
import type { Locale } from 'vue-i18n';

import type {
  ImportLocaleFn,
  ImportNamespaceFn,
  LoadMessageFn,
  LocaleSetupOptions,
  NamespacedLocalesMap,
  PreloadLocaleOptions,
  SupportedLanguagesType,
} from './typing';

import { unref } from 'vue';
import { createI18n } from 'vue-i18n';

import { useSimpleLocale } from '@ydsz-core/composables';

import { createLogger } from '@ydsz-core/shared/utils';
const logger = createLogger('i18n');
const i18n = createI18n({
  globalInjection: true,
  legacy: false,
  locale: '',
  messages: {},
});

const modules = import.meta.glob('./langs/**/*.json');

const { setSimpleLocale } = useSimpleLocale();

const localesMap = loadLocalesMapFromDir(
  /\.\/langs\/([^/]+)\/(.*)\.json$/,
  modules,
);
let loadMessages: LoadMessageFn;

/**
 * 已加载语种词条集合（避免重复 setLocaleMessage）。
 *
 * @remarks
 * F2：记录已通过 {@link loadLocaleMessages} / {@link preloadLocaleOnIdle}
 * 写入词条的语种，防止空闲预加载重复拉取。
 */
const loadedLocales = new Set<SupportedLanguagesType>();

/**
 * 将 JSON 中以点号书写的键展开为嵌套对象。
 *
 * <p>语言包文件里常出现 `"wf.todoTasks": "待办任务"` 这类扁平写法，
 * 而 vue-i18n 按 `.` 逐层解析消息路径，扁平键必须展开后才能命中。
 */
function expandDottedKeys(source: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(source)) {
    if (!key.includes('.')) {
      result[key] = value;
      continue;
    }

    const segments = key.split('.');
    let cursor = result;
    segments.forEach((segment, index) => {
      if (index === segments.length - 1) {
        cursor[segment] = value;
        return;
      }
      const existing = cursor[segment];
      if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
        cursor[segment] = {};
      }
      cursor = cursor[segment] as Record<string, unknown>;
    });
  }

  return result;
}

/** 递归合并纯对象，避免不同语言包文件之间的顶层对象互相覆盖 */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  for (const [key, value] of Object.entries(source)) {
    const existing = target[key];
    if (
      existing &&
      typeof existing === 'object' &&
      !Array.isArray(existing) &&
      (value === null || typeof value !== 'object' || Array.isArray(value))
    ) {
      // 对象结构优先：page.json 的菜单标题（如 "variable": "系统变量"）与
      // business.json 的同名模块词条（如 variable.valueType）撞名时，
      // 保留对象，否则 `variable.valueType` 会被字符串覆盖而丢失。
      // 菜单标题仍可通过 `page.variable` 命名空间访问。
      continue;
    }
    if (
      existing &&
      typeof existing === 'object' &&
      !Array.isArray(existing) &&
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      target[key] = deepMerge({ ...(existing as Record<string, unknown>) }, value as Record<string, unknown>);
    } else {
      target[key] = value;
    }
  }
  return target;
}

/**
 * 构建扁平结构语言包映射表（locale → 异步加载函数）。
 *
 * @param modules - import.meta.glob 产出的模块映射
 * @returns 语言标识到加载函数的映射
 */
function loadLocalesMap(modules: Record<string, () => Promise<unknown>>) {
  const localesMap: Record<Locale, ImportLocaleFn> = {};

  for (const [path, loadLocale] of Object.entries(modules)) {
    const key = path.match(/([\w-]*)\.(json)/)?.[1];
    if (key) {
      localesMap[key] = loadLocale as ImportLocaleFn;
    }
  }
  return localesMap;
}

/**
 * 构建目录结构语言包映射（按 locale + 文件名分组），生成合并加载函数。
 *
 * @param regexp - 匹配路径中正则，需包含 locale 与文件名两个捕获组
 * @param modules - import.meta.glob 产出的模块映射
 * @returns 语言标识到合并加载函数的映射
 */
function loadLocalesMapFromDir(
  regexp: RegExp,
  modules: Record<string, () => Promise<unknown>>,
): Record<Locale, ImportLocaleFn> {
  const localesRaw: Record<Locale, Record<string, () => Promise<unknown>>> = {};
  const localesMap: Record<Locale, ImportLocaleFn> = {};

  // Iterate over the modules to extract language and file names
  for (const path in modules) {
    const match = path.match(regexp);
    if (match) {
      const [_, locale, fileName] = match;
      if (locale && fileName) {
        if (!localesRaw[locale]) {
          localesRaw[locale] = {};
        }
        if (modules[path]) {
          localesRaw[locale][fileName] = modules[path];
        }
      }
    }
  }

  // Convert raw locale data into async import functions
  for (const [locale, files] of Object.entries(localesRaw)) {
    localesMap[locale] = async () => {
      const namespaces: Record<string, unknown> = {};
      const flattened: Record<string, unknown> = {};
      for (const [fileName, importFn] of Object.entries(files)) {
        const fileMessages = expandDottedKeys(
          (((await importFn()) as { default?: Record<string, unknown> })?.default ?? {}),
        );
        namespaces[fileName] = fileMessages;
        // 同时展开到顶层，兼容 `wf.x` / `error.x` 这类跨文件扁平键；
        // 文件名命名空间最后写入，避免被同名业务键覆盖。
        deepMerge(flattened, fileMessages);
      }
      return { default: { ...flattened, ...namespaces } };
    };
  }

  return localesMap;
}

/**
 * 切换当前激活的 i18n 语言并同步更新 html lang 属性。
 *
 * @param locale - 目标语言标识
 */
function setI18nLanguage(locale: Locale) {
  i18n.global.locale.value = locale;

  document?.querySelector('html')?.setAttribute('lang', locale);
}

async function setupI18n(app: App, options: LocaleSetupOptions = {}) {
  const { defaultLocale = 'zh-CN' } = options;
  // app可以自行扩展一些第三方库和组件库的国际化
  loadMessages = options.loadMessages || (async () => ({}));
  app.use(i18n);
  await loadLocaleMessages(defaultLocale);

  // 在控制台打印警告
  i18n.global.setMissingHandler((locale, key) => {
    if (options.missingWarn && key.includes('.')) {
      logger.warn(
        `[intlify] Not found '${key}' key in '${locale}' locale messages.`,
      );
    }
  });
}

/**
 * Load locale messages
 * @param lang
 */
async function loadLocaleMessages(lang: SupportedLanguagesType) {
  if (unref(i18n.global.locale) === lang && loadedLocales.has(lang)) {
    return setI18nLanguage(lang);
  }
  setSimpleLocale(lang);

  const message = await localesMap[lang]?.();

  if (message?.default) {
    i18n.global.setLocaleMessage(lang, message.default);
  }

  const mergeMessage = await loadMessages(lang);
  i18n.global.mergeLocaleMessage(lang, mergeMessage);

  loadedLocales.add(lang);
  return setI18nLanguage(lang);
}

/**
 * 构建命名空间粒度的语言包映射表。
 *
 * @remarks
 * F2 国际化按需加载改造：与 {@link loadLocalesMapFromDir} 不同，
 * 此函数保留 `locale → namespace → 加载函数` 的两级结构，
 * 供 {@link loadNamespaceMessages} 按路由声明的命名空间按需加载。
 *
 * @param regexp - 匹配 `locale` 与 `fileName` 的正则（需两个捕获组）
 * @param modules - `import.meta.glob` 产出的模块映射
 * @returns 命名空间粒度语言包映射表
 */
function loadNamespacedLocalesMap(
  regexp: RegExp,
  modules: Record<string, () => Promise<unknown>>,
): NamespacedLocalesMap {
  const map: NamespacedLocalesMap = {} as NamespacedLocalesMap;
  for (const path in modules) {
    const match = path.match(regexp);
    if (match) {
      const [, locale, fileName] = match;
      if (locale && fileName) {
        if (!map[locale as SupportedLanguagesType]) {
          map[locale as SupportedLanguagesType] = {};
        }
        map[locale as SupportedLanguagesType][fileName] =
          modules[path] as ImportNamespaceFn;
      }
    }
  }
  return map;
}

/**
 * 按命名空间按需加载语言包并合并入 i18n。
 *
 * @remarks
 * F2：路由级按需加载入口。路由可在进入前声明所需命名空间
 * （如 `['page', 'business']`），仅拉取对应 JSON 分包，
 * 避免一次性加载全部命名空间。重复加载同一命名空间会被忽略。
 *
 * @param lang - 目标语种
 * @param namespaces - 需加载的命名空间列表（如 `['common', 'page']`）
 * @param map - 由 {@link loadNamespacedLocalesMap} 构建的映射表
 */
async function loadNamespaceMessages(
  lang: SupportedLanguagesType,
  namespaces: string[],
  map: NamespacedLocalesMap,
): Promise<void> {
  const localeMap = map[lang];
  if (!localeMap) return;

  const loadedKey = `${lang}::${namespaces.slice().sort().join(',')}`;
  if (loadedNamespaceSets.has(loadedKey)) return;

  const entries = await Promise.all(
    namespaces
      .filter((ns) => typeof localeMap[ns] === 'function')
      .map(async (ns) => {
        // filter 已保证 localeMap[ns] 存在，此处非空断言仅为满足 TS 收窄限制
        const mod = await localeMap[ns]!();
        return [ns, mod?.default ?? {}] as const;
      }),
  );

  const merged: Record<string, unknown> = {};
  for (const [ns, messages] of entries) {
    merged[ns] = messages;
  }

  if (Object.keys(merged).length > 0) {
    i18n.global.mergeLocaleMessage(lang, merged);
  }
  loadedNamespaceSets.add(loadedKey);
}

/**
 * 已加载的「语种::命名空间集合」缓存键，避免路由重复进入时重复加载。
 */
const loadedNamespaceSets = new Set<string>();

/**
 * 浏览器空闲时预加载非默认语种词条。
 *
 * @remarks
 * F2：首屏完成后，利用 `requestIdleCallback` 在空闲时段预拉取
 * 另一语种的全部命名空间并写入 i18n（不切换当前语种），
 * 使后续用户切换语种近似瞬时完成。已加载的语种会被跳过。
 *
 * 不支持 `requestIdleCallback` 的环境回退为 `setTimeout`。
 *
 * @param lang - 待预加载的语种
 * @param targetLocalesMap - 语种 → 加载函数映射（通常即 `loadLocalesMapFromDir` 产出）
 * @param options - 预加载可选配置
 */
function preloadLocaleOnIdle(
  lang: SupportedLanguagesType,
  targetLocalesMap: Record<string, ImportLocaleFn>,
  options: PreloadLocaleOptions = {},
): void {
  const { timeout = 4000, onLoaded, onError } = options;

  if (loadedLocales.has(lang)) {
    onLoaded?.();
    return;
  }

  const run = (): void => {
    if (loadedLocales.has(lang)) {
      onLoaded?.();
      return;
    }
    const loader = targetLocalesMap[lang];
    if (typeof loader !== 'function') {
      onLoaded?.();
      return;
    }
    loader()
      .then((msg) => {
        if (msg?.default) {
          i18n.global.setLocaleMessage(lang, msg.default);
          loadedLocales.add(lang);
        }
        onLoaded?.();
      })
      .catch((err) => {
        logger.warn(`[i18n] Failed to preload locale ${lang}:`, err);
        onError?.(err);
      });
  };

  // requestIdleCallback 类型在部分 TS lib 下可能缺失，做兼容判定
  const ric =
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as { requestIdleCallback?: unknown }).requestIdleCallback ===
      'function'
      ? (globalThis as { requestIdleCallback: typeof requestIdleCallback })
          .requestIdleCallback
      : null;
  if (ric) {
    ric(run, { timeout });
  } else {
    setTimeout(run, timeout);
  }
}

export {
  i18n,
  loadLocaleMessages,
  loadLocalesMap,
  loadLocalesMapFromDir,
  loadNamespaceMessages,
  loadNamespacedLocalesMap,
  preloadLocaleOnIdle,
  setupI18n,
};

// vue-i18n globalInjection 模式下 $t 全局可用；此处显式导出供非模板场景直接 import 使用
import type { Composer } from 'vue-i18n';
export const $t = i18n.global.t as Composer['t'];
