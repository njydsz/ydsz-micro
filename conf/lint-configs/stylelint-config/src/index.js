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
    // 选择器命名 (kebab-case)
    'selector-class-pattern': [
      '^[a-z]([a-z0-9-]+)?(__[a-z0-9-]+)?(--[a-z0-9-]+)?$',
      {
        message: 'Expected class name to be kebab-case or BEM',
      },
    ],
    'selector-id-pattern': '^[a-z][a-zA-Z0-9]*$',
    // 颜色格式
    'color-hex-length': 'short',
    // 缩进
    indentation: 2,
    // 最大空行数
    'max-empty-lines': 2,
    // 无前导零
    'number-leading-zero': 'always',
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
    'selector-no-vendor-prefix': [
      true,
      {
        ignoreSelectorTags: ['v-deep', 'v-global', 'v-slotted', 'v-placeholder'],
      },
    ],
    // 引号
    'string-quotes': 'single',
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
