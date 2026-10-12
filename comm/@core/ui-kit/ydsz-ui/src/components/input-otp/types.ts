/**
 * YdInputOtp —— OTP 验证码输入组件 Props / Emits。
 *
 * 独立的 N 位输入框，输入后自动跳框、Backspace 跳回、支持粘贴、完成自动回调。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\input-otp\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** InputOtp 组件 Props */
export interface YdInputOtpProps {
  /** 组件值（v-model） */
  modelValue?: string;
  /** 验证码位数（默认 6） */
  length?: number;
  /** 输入类型 */
  type?: 'number' | 'text' | 'password';
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否自动聚焦第一个框 */
  autoFocus?: boolean;
  /** 是否以密码模式显示（● 遮罩，仅 type='password' 或 mask=true 时生效） */
  mask?: boolean;
}

/** InputOtp 组件 Emits */
export interface YdInputOtpEmits {
  /** v-model 双向绑定 */
  (e: 'update:modelValue', value: string): void;
  /** 全部填写完毕时触发 */
  (e: 'complete', value: string): void;
}
