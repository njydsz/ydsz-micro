/**
 * Token Store — 独立的认证令牌状态管理（accessToken / refreshToken / 锁屏）
 *
 * 从 accessStore 中拆分出纯令牌职责，与 main 应用的 useAuthStore（业务级登录/登出）
 * 明确区分：useTokenStore 只管令牌存取，业务 login/logout 逻辑在 useAuthStore 中。
 *
 * 采用 Composition API（setup）语法，符合云顶编码规范 §8.1。
 *
 * P0-F2: 支持 HttpOnly Cookie 模式。当 `VITE_APP_AUTH_TOKEN_STORAGE=httpOnlyCookie` 时：
 * - accessToken / refreshToken / expiresAt 不再持久化到 localStorage
 * - 浏览器通过 HttpOnly Secure Cookie 自动携带凭据，前端无法读取
 * - 仅 isLockScreen / lockScreenPassword 等非敏感 UI 状态继续持久化
 *
 * @path comm\stores\src\modules\auth.ts
 * @author ydsz-team
 * @since 2.0.0
 */
import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * P0-F2: 认证令牌存储模式（构建期常量）。
 *
 * - `'localStorage'`（默认）：令牌经 SecureLS 加密后存入 localStorage，向后兼容
 * - `'httpOnlyCookie'`：令牌由后端通过 HttpOnly Secure Cookie 下发，前端不存储
 *
 * 通过 `VITE_APP_AUTH_TOKEN_STORAGE` 环境变量在构建期注入，不应在运行时修改。
 */
const authTokenStorage: string = import.meta.env.VITE_APP_AUTH_TOKEN_STORAGE ?? 'localStorage';
const isHttpOnlyCookieMode = authTokenStorage === 'httpOnlyCookie';

type AuthToken = null | string;

/**
 * 对密码进行简单哈希处理（SHA-256）
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const hash = await hashPassword(password);
  return hash === storedHash;
}

/** 认证令牌 Store：负责 accessToken / refreshToken / 锁屏状态的存取与持久化，登录登出业务在 useAuthStore 中 */
export const useTokenStore = defineStore(
  'core-auth',
  () => {
    /** 登录 accessToken */
    const accessToken = ref<AuthToken>(null);
    /** 刷新 token */
    const refreshToken = ref<AuthToken>(null);
    /** 登录是否过期 */
    const loginExpired = ref(false);
    /** 是否锁屏状态 */
    const isLockScreen = ref(false);
    /** 锁屏密码哈希值 */
    const lockScreenPassword = ref<string | undefined>(undefined);
    /**
     * accessToken 绝对过期时间戳（ms）。
     *
     * 由 login / refreshToken 响应中的 expiresIn（秒）换算而来：
     * `expiresAt = Date.now() + expiresIn * 1000`。
     * 用于会话超时预警（到期前 5 分钟提示续期）。
     * null 表示未知（后端未返回 expiresIn），不触发预警。
     */
    const expiresAt = ref<null | number>(null);

    /**
     * 设置访问令牌。
     *
     * @param token - JWT 访问令牌字符串，null 表示清除
     */
    function setAccessToken(token: AuthToken) {
      accessToken.value = token;
    }

    /**
     * 设置刷新令牌。
     *
     * @param token - JWT 刷新令牌字符串，null 表示清除
     */
    function setRefreshToken(token: AuthToken) {
      refreshToken.value = token;
    }

    /**
     * 设置登录过期标记。
     *
     * @param expired - true 表示登录已过期
     */
    function setLoginExpired(expired: boolean) {
      loginExpired.value = expired;
    }

    /**
     * 设置 accessToken 绝对过期时间戳。
     *
     * @param timestamp - 过期时间戳（ms），null 表示未知（后端未返回 expiresIn）
     */
    function setExpiresAt(timestamp: null | number) {
      expiresAt.value = timestamp;
    }

    /**
     * 锁定屏幕，使用 SHA-256 哈希存储密码后开启锁屏状态。
     *
     * @param password - 锁屏密码（明文）
     */
    async function lockScreen(password: string) {
      isLockScreen.value = true;
      lockScreenPassword.value = await hashPassword(password);
    }

    /**
     * 解锁屏幕，清除锁屏状态与密码哈希。
     */
    function unlockScreen() {
      isLockScreen.value = false;
      lockScreenPassword.value = undefined;
    }

    /**
     * 验证锁屏密码是否匹配。
     *
     * @param password - 待验证的密码（明文）
     * @returns 密码是否匹配已存储的哈希值
     */
    async function verifyLockScreenPassword(password: string): Promise<boolean> {
      if (!lockScreenPassword.value) return false;
      return verifyPassword(password, lockScreenPassword.value);
    }

    return {
      accessToken,
      expiresAt,
      isLockScreen,
      lockScreen,
      lockScreenPassword,
      loginExpired,
      refreshToken,
      setAccessToken,
      setExpiresAt,
      setLoginExpired,
      setRefreshToken,
      unlockScreen,
      verifyLockScreenPassword,
    };
  },
  {
    persist: {
      // P0-F2: HttpOnly Cookie 模式下不持久化令牌凭据到 localStorage，
      //        仅保留锁屏等非敏感 UI 状态的持久化
      pick: isHttpOnlyCookieMode
        ? ['isLockScreen', 'lockScreenPassword']
        : ['accessToken', 'refreshToken', 'isLockScreen', 'lockScreenPassword', 'expiresAt'],
    },
  },
);

const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useTokenStore, hot));
}
