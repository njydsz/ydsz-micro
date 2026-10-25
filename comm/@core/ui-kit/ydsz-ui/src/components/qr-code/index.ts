/**
 * 业务级二维码便捷封装组件的出口：YdQrCodePro。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\qr-code\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export type { QrCodePreset } from './YdQrCodePro.vue';
export { default as YdQrCodePro } from './YdQrCodePro.vue';

// merged from pre-refactor ui/ + primitives/ barrels
export { default as YdQrCode } from './YdQrCode.vue';
export { default as ydQrCode } from './qr-code.vue';
export type { QRCodeProps, QRCodeEmits } from './qr-code-types';
export type { QRLevel } from './qr-code-utils';
