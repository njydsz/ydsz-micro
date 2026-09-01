/**
 * @file YDSZ Stylelint 配置
 * @author YDSZ Team
 * @since 2026-08-23
 * @description 云顶微前端项目统一 Stylelint 配置
 */

/**
 * YDSZ 统一 Stylelint 配置
 * @type {import('stylelint').Config}
 */
const config = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recommended-scss',
    'stylelint-config-recommended-vue/scss',
    'stylelint-config-recess-order',
    'stylelint-prettier/recommended',
  ],
  plugins: ['stylelint-scss', 'stylelint-order'],
  rules: {
    // SCSS 语法
    'at-rule-no-unknown': null,
    'scss/at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['tailwind', 'apply', 'layer', 'config'],
      },
    ],
    // 选择器命名 (kebab-case / BEM；YDSZ- 为组件库命名空间前缀，同 en-US 目录属惯例豁免)
    'selector-class-pattern': [
      '^(YDSZ-[a-z]([a-z0-9-]+)?|[a-z]([a-z0-9-]+)?(__[a-z0-9-]+)?(--[a-z0-9-]+)?)$',
      {
        message: 'Expected class name to be kebab-case, BEM or YDSZ- namespaced',
      },
    ],
    'selector-id-pattern': '^[a-z][a-zA-Z0-9]*$',
    // 颜色格式
    'color-hex-length': 'short',
    // 注：indentation / max-empty-lines / number-leading-zero / string-quotes
    // 已在 stylelint 16 中移除，格式类职责统一交由 Prettier（stylelint-prettier）接管，
    // 此处不再声明（2026-09-01 P0-1 配套修复，消除 104 文件 × 4 的 Unknown rule 误报）。
    // 属性顺序 (由 recess-order 处理)
    'order/properties-order': [],
    // 允许的伪类
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['deep', 'global', 'slotted'],
      },
    ],
    // 允许的伪元素
    'selector-pseudo-element-no-unknown': [
      true,
      {
        ignorePseudoElements: ['v-deep', 'v-global', 'v-slotted'],
      },
    ],
    // 允许的 Vue 深度选择器
    // 注：selector-no-vendor-prefix 已在 stylelint 15 中移除，不再声明
    // （2026-09-01 P0-1 配套修复：其 ignoreSelectorTags 选项导致 Invalid Option 中断检查）。
    // 引号（由 Prettier 接管，规则已随 stylelint 16 移除）
    // 单位
    'length-zero-no-unit': true,
    // 字体族名称引号
    'font-family-name-quotes': 'always-where-recommended',
  },
  overrides: [
    {
      files: ['**/*.{vue,html}'],
      customSyntax: 'postcss-html',
    },
    {
      files: ['**/*.scss'],
      customSyntax: 'postcss-scss',
    },
  ],
  ignoreFiles: [
    '**/node_modules/**',
    '**/dist/**',
    '**/coverage/**',
    '**/*.min.css',
    '**/*.min.js',
  ],
};

export default config;
