/**
 * 从主题色预设批量生成 CSS 变量（HSL 格式），供主题切换使用。
 *
 * @path comm\@core\base\shared\src\color\generator.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { getColors } from 'theme-colors';

import { convertToHslCssVar, TinyColor } from './convert';

interface ColorItem {
  alias?: string;
  color: string;
  name: string;
}

/**
 * 根据颜色配置列表批量生成 HSL 格式 CSS 变量映射表。
 *
 * 每项输入会展开为 500-900 的色阶层，主色取 500 挡位。
 *
 * @param colorItems - 颜色配置项列表（颜色、名称、别名）
 * @returns CSS 变量名到 HSL 字符串的映射
 */
function generatorColorVariables(colorItems: ColorItem[]) {
  const colorVariables: Record<string, string> = {};

  colorItems.forEach(({ alias, color, name }) => {
    if (color) {
      const colorsMap = getColors(new TinyColor(color).toHexString());

      let mainColor = colorsMap['500'];

      const colorKeys = Object.keys(colorsMap);

      colorKeys.forEach((key) => {
        const colorValue = colorsMap[key];

        if (colorValue) {
          const hslColor = convertToHslCssVar(colorValue);
          colorVariables[`--${name}-${key}`] = hslColor;
          if (alias) {
            colorVariables[`--${alias}-${key}`] = hslColor;
          }

          if (key === '500') {
            mainColor = hslColor;
          }
        }
      });
      if (alias && mainColor) {
        colorVariables[`--${alias}`] = mainColor;
      }
    }
  });
  return colorVariables;
}

export { generatorColorVariables };
