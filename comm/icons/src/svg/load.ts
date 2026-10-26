/**
 * SVG 图标注册模块 — 构建时将 SVG 原始文件注入 Iconify 全局图标池。
 *
 * @path comm\icons\src\svg\load.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { IconifyIconStructure } from '@ydsz-core/icons';

import { addIcon } from '@ydsz-core/icons';

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

  // DOMParser 对损坏文件或不支持 image/svg+xml 的实现（happy-dom 等轻量 DOM）
  // 返回 parsererror / null，此时取 childNodes 会抛在微任务里成为未处理拒绝。
  if (!svgElement || svgElement.tagName?.toLowerCase() !== 'svg') {
    throw new TypeError('SVG 根节点缺失，跳过该图标注册');
  }

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
 * <p>单个文件解析失败只跳过该图标并汇总告警：本模块在导入期即触发（顶层副作用），
 * 未捕获的 rejection 会冒泡成进程级未处理错误，让整轮测试以非零码退出。
 *
 * @example ./svg/avatar.svg → <Icon icon="svg:avatar" />
 */
async function loadSvgIcons() {
  const svgEagers = import.meta.glob('./icons/**', {
    eager: true,
    query: '?raw',
  });

  const failures: string[] = [];

  await Promise.all(
    Object.entries(svgEagers).map((svg) => {
      const [key, body] = svg as [string, string | { default: string }];

      // ./icons/xxxx.svg => xxxxxx
      const start = key.lastIndexOf('/') + 1;
      const end = key.lastIndexOf('.');
      const iconName = key.slice(start, end);

      try {
        return addIcon(`svg:${iconName}`, {
          ...parseSvg(typeof body === 'object' ? body.default : body),
        });
      } catch (error) {
        failures.push(`${iconName}: ${(error as Error).message}`);
        return undefined;
      }
    }),
  );

  if (failures.length > 0) {
    // 只报数量与首个原因：轻量 DOM（happy-dom）不实现 image/svg+xml，逐条打印会淹没日志
    // eslint-disable-next-line no-console -- @ydsz/icons 保持零运行时依赖（仅 @ydsz-core/icons），此处为一次性初始化诊断，不引入 createLogger
    console.warn(`[icons] ${failures.length} 个 SVG 未注册，首个原因 -> ${failures[0]}`);
  }
}
