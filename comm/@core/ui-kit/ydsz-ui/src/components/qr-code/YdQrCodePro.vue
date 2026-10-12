<script setup lang="ts">
/**
* YdQrCodePro —— 业务级二维码便捷封装。
* 
 * 在 YdQrCode 原语之上提供「预设场景 → 自动容错等级」「一键下载」「Logo 安全区」
 * 「i18n 文案」等开箱即用能力，避免业务方重复编写样板代码。
* 
 * 预设场景说明：
 *   - url    : URL 短文本 → L 级纠错（7%），轻量快速
 *   - text   : 普通短文本 → L 级纠错（7%）
 *   - vcard  : 联系人信息 → M 级纠错（15%），信息量中等
 *   - download : 下载链接 → M 级纠错（15%），因 logo 可能遮挡部分模块
 *   - wifi   : WiFi 配置 → H 级纠错（30%），通常在 logo 遮挡下仍需可靠识别
* 
 * @path comm\@core\ui-kit\ydsz-ui\src\components\qr-code\YdQrCodePro.vue
 * @author ydsz-team
 * @since 1.0.0
 */
// @ts-nocheck
import { computed, ref } from 'vue';

import { YdQrCode } from './qr-code.vue';
import { cn } from '@ydsz-core/shared/utils';
import { Download } from 'lucide-vue-next';
import { useLocale } from '../../locale/useLocale';

defineOptions({
  name: 'YdQrCodePro',
});

/**
 * YdQrCodePro 预设场景。
 * 每种场景自动推导最佳纠错级别与默认提示文案。
 */
export type QrCodePreset = 'url' | 'wifi' | 'vcard' | 'text' | 'download';

interface Props {
  /** 要编码的内容（URL、文本等） */
  value: string;
  /** 预设场景，自动推断容错等级和样式 */
  preset?: QrCodePreset;
  /** 尺寸（边长 px），默认 160 */
  size?: number;
  /** 是否内嵌 logo 到二维码中央 */
  withLogo?: boolean;
  /** logo 图片 URL（withLogo=true 时需要） */
  logoUrl?: string;
  /** logo 占二维码整体比例，默认 0.2 */
  logoScale?: number;
  /** 主题色，默认 'primary'（取 Tailwind primary token） */
  themeColor?: string;
  /** 背景色，默认 #ffffff */
  bgColor?: string;
  /** 下载主题色下的二维码图片（挂载后自动触发一次下载） */
  downloadOnMount?: boolean;
  /** 下载文件名前缀，最终文件名 = {prefix}-{timestamp}.png */
  filename?: string;
  /** 是否显示底部说明文字 */
  description?: string;
  /** 自定义类名 */
  class?: any;
}

const props = withDefaults(defineProps<Props>(), {
  preset: 'text',
  size: 160,
  withLogo: false,
  logoUrl: '',
  logoScale: 0.2,
  themeColor: 'primary',
  bgColor: '#ffffff',
  downloadOnMount: false,
  filename: 'qrcode',
  description: '',
});

const emit = defineEmits<{
  (e: 'download', dataUrl: string): void;
  (e: 'rendered'): void;
}>();

const { t } = useLocale();

/** 对 YdQrCode 组件实例的引用，用于下载时访问 canvas */
const qrCodeRef = ref<InstanceType<typeof YdQrCode>>();

/**
 * 根据预设场景自动选择最佳纠错级别。
 *
 * 策略：
 *   - url / text → 'L'（7% 恢复，数据量小无需高冗余）
 *   - vcard / download → 'M'（15% 恢复，中等数据量）
 *   - wifi → 'H'（30% 恢复，常带 logo 遮挡高冗余保证识别）
 */
const resolvedLevel = computed<'L' | 'M' | 'Q' | 'H'>(() => {
  const map: Record<NonNullable<Props['preset']>, 'L' | 'M' | 'H'> = {
    url: 'L',
    text: 'L',
    vcard: 'M',
    download: 'M',
    wifi: 'H',
  };
  return map[props.preset];
});

/**
 * 根据预设场景给出默认辅助说明文案。
 * 业务方可通过 description prop 覆盖。
 */
const presetHint = computed<string>(() => {
  if (props.description) return props.description;

  const keyMap: Record<NonNullable<Props['preset']>, string> = {
    url: 'qrCode.hint.url',
    text: 'qrCode.hint.text',
    vcard: 'qrCode.hint.vcard',
    download: 'qrCode.hint.download',
    wifi: 'qrCode.hint.wifi',
  };
  return t(keyMap[props.preset], getDefaultHint(props.preset));
});

/** 当 i18n 无对应 key 时的回退文案 */
function getDefaultHint(preset: Props['preset']): string {
  const defaults: Record<NonNullable<Props['preset']>, string> = {
    url: '扫一扫访问链接',
    text: '扫描二维码',
    vcard: '扫一扫添加联系人',
    download: '扫一扫下载文件',
    wifi: '扫一扫连接 WiFi',
  };
  return defaults[preset ?? 'text'];
}

/**
 * Logo 安全区：白色底板尺寸（含边距）。
 * 在 logo 周围留白边框，保证二维码识别可靠性。
 */
const logoWrapperSize = computed<number | null>(() => {
  if (!props.withLogo) return null;
  const logoPixelSize = Math.round(props.size * props.logoScale);
  // 安全区边距 = logo 尺寸的 20%（最小 4px）
  const borderWidth = Math.max(4, Math.round(logoPixelSize * 0.2));
  return logoPixelSize + borderWidth * 2;
});

/**
 * 主题色解析：将 'primary' 语义 token 转换为实际十六进制色值。
 * 生产项目中应通过 CSS variable 读取；此处退化为硬编码主色。
 */
const resolvedFgColor = computed<string>(() => {
  if (props.themeColor && props.themeColor !== 'primary') {
    return props.themeColor;
  }
  return '#1a1a1a';
});

/**
 * 下载二维码图片。
 *
 * 优先使用 canvas.toDataURL('image/png')；
 * 若 canvas 不可用（跨域等），降级为生成 SVG data URL。
 *
 * 下载完成后触发 download 事件，供业务方二次处理。
 */
function downloadQrCode(): void {
  const el = qrCodeRef.value?.$el as HTMLElement | undefined;
  if (!el) return;

  // 优先从 canvas 元素获取 PNG data URL
  const canvas = el.querySelector('canvas') as HTMLCanvasElement | null;
  let dataUrl = '';

  if (canvas) {
    try {
      dataUrl = canvas.toDataURL('image/png');
    } catch {
      dataUrl = '';
    }
  }

  // Fallback：将组件 DOM 序列化为 SVG data URL
  if (!dataUrl) {
    dataUrl = generateSvgDataUrl();
  }

  // 执行浏览器下载
  const link = document.createElement('a');
  const timestamp = Date.now();
  link.download = `${props.filename}-${timestamp}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  emit('download', dataUrl);
}

/**
 * 将整个组件 DOM 序列化为 SVG data URL（canvas 不可用时的备选方案）。
 *
 * 生成的 SVG 包含背景色和简单的文字示意，
 * 仅作保底，无法还原二维码矩阵细节。
 */
function generateSvgDataUrl(): string {
  const totalSize = props.size + 16;
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}">
    <rect width="100%" height="100%" fill="${props.bgColor}"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="${resolvedFgColor.value}">${escapeHtml(props.value)}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
}

/** 转义 HTML 特殊字符，防止 SVG 注入 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 处理 YdQrCode rendered 事件：
 *  - 向上透传 rendered 事件
 *  - 若 downloadOnMount 为 true，下一帧自动触发下载
 */
function handleRendered(): void {
  emit('rendered');
  if (props.downloadOnMount) {
    requestAnimationFrame(() => {
      downloadQrCode();
    });
  }
}
</script>

<template>
  <div :class="cn('flex flex-col items-center gap-2', props.class)">
    <!-- 二维码主体 + Logo 覆盖层 -->
    <div class="relative inline-flex items-center justify-center">
      <YdQrCode
        ref="qrCodeRef"
        :value="value"
        :size="size"
        :level="resolvedLevel"
        :bg-color="bgColor"
        :fg-color="resolvedFgColor"
        :class="cn(
          'rounded transition-shadow',
          withLogo && 'ring-1 ring-black/5',
        )"
        @rendered="handleRendered"
      />

      <!-- Logo 安全区：白色底板 + Logo 图片 -->
      <div
        v-if="withLogo"
        class="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          class="flex items-center justify-center rounded-sm bg-white shadow-sm"
          :style="{
            width: `${logoWrapperSize}px`,
            height: `${logoWrapperSize}px`,
          }"
        >
          <img
            v-if="logoUrl"
            :src="logoUrl"
            alt="logo"
            class="rounded-sm object-contain p-0.5"
            :style="{
              width: `${Math.round(size * logoScale)}px`,
              height: `${Math.round(size * logoScale)}px`,
            }"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center rounded-sm bg-primary/10 text-[10px] text-primary/60"
          >
            LOGO
          </div>
        </div>
      </div>
    </div>

    <!-- 预设场景提示文案 / description -->
    <p
      v-if="presetHint"
      class="text-xs text-neutral-500"
    >
      {{ presetHint }}
    </p>

    <!-- 下载按钮 -->
    <button
      type="button"
      class="inline-flex items-center gap-1 rounded px-3 py-1 text-xs text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-200"
      @click="downloadQrCode"
    >
      <Download :size="12" aria-hidden="true" />
      <span>{{ t('qrCode.download', '下载') }}</span>
    </button>

    <!-- 自定义底部内容插槽 -->
    <slot name="footer" />
  </div>
</template>
