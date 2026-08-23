/**
 * @file YDSZ Prettier 配置
 * @author YDSZ Team
 * @since 2026-08-23
 * @description 云顶微前端项目统一 Prettier 配置
 */

/**
 * YDSZ 统一 Prettier 配置
 * @type {import('prettier').Config}
 */
const config = {
  // 每行最大字符数
  printWidth: 100,
  // 缩进空格数
  tabWidth: 2,
  // 使用空格而非 tab
  useTabs: false,
  // 行尾分号
  semi: true,
  // 单引号
  singleQuote: true,
  // 对象属性引号
  quoteProps: 'as-needed',
  // JSX 中使用单引号
  jsxSingleQuote: true,
  // 尾随逗号
  trailingComma: 'all',
  // 对象括号内空格
  bracketSpacing: true,
  // JSX 标签结尾括号换行
  bracketSameLine: false,
  // 箭头函数单参数括号
  arrowParens: 'always',
  // 换行符
  endOfLine: 'lf',
  // HTML 空白敏感性
  htmlWhitespaceSensitivity: 'css',
  // Vue 文件 script/style 缩进
  vueIndentScriptAndStyle: false,
  // 嵌入语言格式化
  embeddedLanguageFormatting: 'auto',
  plugins: ['prettier-plugin-tailwindcss'],
  // Tailwind 配置路径
  tailwindConfig: undefined,
  tailwindFunctions: ['clsx', 'cn', 'cva'],
  // 覆盖配置
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
      },
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
        printWidth: 80,
      },
    },
    {
      files: '*.{yml,yaml}',
      options: {
        singleQuote: false,
      },
    },
  ],
};

export default config;
