/**
 * 动态创建或复用 `:root` 内联样式表，批量写入 CSS 变量声明。
 *
 * @path comm\@core\base\shared\src\utils\update-css-variables.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/**
 * 更新文档根节点的 CSS 变量（已存在则复用现有样式表，避免重复创建）。
 *
 * @param variables - 变量名到新值的映射，键名应带 `--` 前缀
 * @param id - 内联样式表 DOM id，默认 `'__ydsz-styles__'`
 */
function updateCSSVariables(
  variables: { [key: string]: string },
  id = '__ydsz-styles__',
): void {
  // 获取或创建内联样式表元素
  const styleElement =
    document.querySelector(`#${id}`) || document.createElement('style');

  styleElement.id = id;

  // 构建要更新的 CSS 变量的样式文本
  let cssText = ':root {';
  for (const key in variables) {
    if (Object.prototype.hasOwnProperty.call(variables, key)) {
      cssText += `${key}: ${variables[key]};`;
    }
  }
  cssText += '}';

  // 将样式文本赋值给内联样式表
  styleElement.textContent = cssText;

  // 将内联样式表添加到文档头部
  if (!document.querySelector(`#${id}`)) {
    setTimeout(() => {
      document.head.append(styleElement);
    });
  }
}

export { updateCSSVariables };
