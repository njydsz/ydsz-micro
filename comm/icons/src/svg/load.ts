/**
 * SVG 图标注册模块 — 构建时将 SVG 原始文件注入 Iconify 全局图标池。
 *
 * @path comm\icons\src\svg\load.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { IconifyIconStructure } from '@YDSZ-core/icons';

import { addIcon } from '@YDSZ-core/icons';

let loaded = false;
if (!loaded) {
  loadSvgIcons();
  loaded = true;
}

/**
 * 解析 SVG 原始字符串为 Iconify 图标结构体。
 *
 * @param svgData - SVG 文件原始文本
 * @returns Iconify 图标结构（body + 尺寸/偏移属性）
 */
function parseSvg(svgData: string): IconifyIconStructure {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(svgData, 'image/svg+xml');
  const svgElement = xmlDoc.documentElement;

  const svgContent = [...svgElement.childNodes]
    .filter((node) => node.nodeType === Node.ELEMENT_NODE)
    .map((node) => new XMLSerializer().serializeToString(node))
    .join('');

  const viewBoxValue = svgElement.getAttribute('viewBox') || '';
  const [left, top, width, height] = viewBoxValue.split(' ').map((val) => {
    const num = Number(val);
    return Number.isNaN(num) ? undefined : num;
  });

  return {
    body: svgContent,
    height,
    left,
    top,
    width,
  };
}

/**
 * 通过 import.meta.glob 加载所有 SVG 文件并逐一注册到 Iconify。
 *
 * @example ./svg/avatar.svg → <Icon icon="svg:avatar" />
 */
async function loadSvgIcons() {
  const svgEagers = import.meta.glob('./icons/**', {
    eager: true,
    query: '?raw',
  });

  await Promise.all(
    Object.entries(svgEagers).map((svg) => {
      const [key, body] = svg as [string, string | { default: string }];

      // ./icons/xxxx.svg => xxxxxx
      const start = key.lastIndexOf('/') + 1;
      const end = key.lastIndexOf('.');
      const iconName = key.slice(start, end);

      return addIcon(`svg:${iconName}`, {
        ...parseSvg(typeof body === 'object' ? body.default : body),
      });
    }),
  );
}
