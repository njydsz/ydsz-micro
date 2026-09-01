/**
 * 认证页组件导出（登录、注册、验证码登录、二维码登录、忘记密码等）
 *
 * @path comm\effects\common-ui\src\ui\authentication\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as AuthenticationCodeLogin } from './code-login.vue';
export { default as AuthenticationForgetPassword } from './forget-password.vue';
export { default as AuthenticationLoginExpiredModal } from './login-expired-modal.vue';
export { default as AuthenticationLogin } from './login.vue';
export { default as AuthenticationQrCodeLogin } from './qrcode-login.vue';
export { default as AuthenticationRegister } from './register.vue';
export type { AuthenticationProps } from './types';
