/**
 * 验证码输入的 props 类型定义。
 *
 * 独立成文件，供业务在封装自己的验证码表单时引用，无需引入组件实现。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\pin-input\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */
interface PinInputProps {
  class?: any;
  /**
   * 验证码长度
   */
  codeLength?: number;
  /**
   * 发送验证码按钮文本
   */
  createText?: (countdown: number) => string;
  /**
   * 是否禁用
   */
  disabled?: boolean;
  /**
   * 自定义验证码发送逻辑
   * @returns
   */
  handleSendCode?: () => Promise<void>;
  /**
   * 发送验证码按钮loading
   */
  loading?: boolean;
  /**
   * 最大重试时间
   */
  maxTime?: number;
}

export type { PinInputProps };

