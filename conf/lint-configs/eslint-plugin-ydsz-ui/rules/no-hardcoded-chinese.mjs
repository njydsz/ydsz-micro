/**
 * no-hardcoded-chinese 规则 — 禁止在字符串字面量中硬编码中文文案。
 *
 * <p>UI 层文案必须走 i18n key（t('module.page.element')），
 * 禁止在 TS/JS 字符串字面量中硬编码中文。
 *
 * <p>豁免：
 *  - 注释（AST 层面自动排除）；
 *  - 测试文件（*.test.ts / *.spec.ts）；
 *  - 含 i18n key 格式的字符串（点分 key，如 'common.hello'）；
 *  - 单个中文字符（标点/单位）。
 *
 * @path conf/lint-configs/eslint-plugin-ydsz-ui/rules/no-hardcoded-chinese.mjs
 * @author ydsz-team
 * @since 26.11.06
 */

/** 中文字符正则 */
const CHINESE_RE = /[\u4e00-\u9fff]/;

/** i18n key 格式（点分命名） */
const I18N_KEY_RE = /^[a-zA-Z][\w-]*(\.[\w-]+)+$/;

/** 豁免的文件模式 */
const SKIP_FILES = ['.test.', '.spec.', '.stories.', '.json', 'locales', 'langs', 'i18n'];

export default {
  meta: {
    docs: {
      category: 'ydsz-ui',
      description: '禁止硬编码中文文案（须走 i18n）',
    },
    messages: {
      hardcoded: "检测到硬编码中文「{{text}}」，请改用 i18n key（t('module.page.element')）。",
    },
    schema: [],
    type: 'problem',
  },
  create(context) {
    const filename = context.filename ?? context.getFilename?.() ?? '';

    // 豁免文件
    if (SKIP_FILES.some((p) => filename.includes(p))) return {};

    /**
     * 检查字符串值是否含硬编码中文。
     */
    function checkString(value, node) {
      if (typeof value !== 'string') return;
      if (!CHINESE_RE.test(value)) return;
      // 跳过 i18n key 格式
      if (I18N_KEY_RE.test(value)) return;
      // 跳过单个中文字符
      const chinese = value.match(/[\u4e00-\u9fff]+/g);
      if (!chinese) return;
      const longest = chinese.reduce((a, b) => (a.length > b.length ? a : b));
      if (longest.length <= 1) return;

      context.report({
        messageId: 'hardcoded',
        node,
        data: { text: longest },
      });
    }

    return {
      Literal(node) {
        checkString(node.value, node);
      },
      TemplateElement(node) {
        checkString(node.value?.raw, node);
      },
    };
  },
};
