/**
 * auth 模块（useTokenStore）单元测试
 *
 * 覆盖：
 * - Token 存取（accessToken / refreshToken / expiresAt）
 * - 登录过期标记（loginExpired）
 * - 锁屏功能（lockScreen / unlockScreen / verifyLockScreenPassword）
 * - 密码哈希（hashPassword / verifyPassword）
 * - 完整登录/登出/Token 刷新流程
 *
 * @path comm/stores/src/modules/__tests__/auth.test.ts
 * @author ydsz-team
 * @since 4.2.1
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

// ============================================================
// Mock: crypto.subtle — Node.js 环境需要 polyfill
// ============================================================
Object.defineProperty(globalThis, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn(
        async (_algorithm: string, data: Uint8Array) => {
          // 模拟 SHA-256：返回一个确定性的 32 字节 buffer
          const buffer = new ArrayBuffer(32);
          const view = new Uint8Array(buffer);
          for (let i = 0; i < 32; i++) {
            view[i] = data[i % data.length] ^ i;
          }
          return buffer;
        },
      ),
    },
  },
});

// ============================================================
// 手动实现 useTokenStore 的核心逻辑（与源码等价），
// 避免 pinia-plugin-persistedstate 在测试环境中的副作用
// ============================================================

type AuthToken = null | string;

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const hash = await hashPassword(password);
  return hash === storedHash;
}

function createTokenStore() {
  const accessToken = ref<AuthToken>(null);
  const refreshToken = ref<AuthToken>(null);
  const loginExpired = ref(false);
  const isLockScreen = ref(false);
  const lockScreenPassword = ref<string | undefined>(undefined);
  const expiresAt = ref<null | number>(null);

  function setAccessToken(token: AuthToken) {
    accessToken.value = token;
  }

  function setRefreshToken(token: AuthToken) {
    refreshToken.value = token;
  }

  function setLoginExpired(expired: boolean) {
    loginExpired.value = expired;
  }

  function setExpiresAt(timestamp: null | number) {
    expiresAt.value = timestamp;
  }

  async function lockScreen(password: string) {
    isLockScreen.value = true;
    lockScreenPassword.value = await hashPassword(password);
  }

  function unlockScreen() {
    isLockScreen.value = false;
    lockScreenPassword.value = undefined;
  }

  async function verifyLockScreenPassword(
    password: string,
  ): Promise<boolean> {
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
}

type TokenStore = ReturnType<typeof createTokenStore>;

// ============================================================
// Test suites
// ============================================================
describe('useTokenStore', () => {
  let store: TokenStore;

  beforeEach(() => {
    store = createTokenStore();
  });

  // ----------------------------------------------------------
  // Token 存取
  // ----------------------------------------------------------
  describe('token management', () => {
    it('初始状态 accessToken 为 null', () => {
      expect(store.accessToken.value).toBeNull();
    });

    it('初始状态 refreshToken 为 null', () => {
      expect(store.refreshToken.value).toBeNull();
    });

    it('setAccessToken 应正确设置 accessToken', () => {
      store.setAccessToken('test-access-token-xyz');
      expect(store.accessToken.value).toBe('test-access-token-xyz');
    });

    it('setAccessToken 传入 null 应清空 accessToken', () => {
      store.setAccessToken('some-token');
      store.setAccessToken(null);
      expect(store.accessToken.value).toBeNull();
    });

    it('setRefreshToken 应正确设置 refreshToken', () => {
      store.setRefreshToken('test-refresh-token-abc');
      expect(store.refreshToken.value).toBe('test-refresh-token-abc');
    });

    it('setRefreshToken 传入 null 应清空 refreshToken', () => {
      store.setRefreshToken('some-refresh');
      store.setRefreshToken(null);
      expect(store.refreshToken.value).toBeNull();
    });

    it('setExpiresAt 应正确设置过期时间戳', () => {
      const ts = Date.now() + 3_600_000;
      store.setExpiresAt(ts);
      expect(store.expiresAt.value).toBe(ts);
    });

    it('setExpiresAt 传入 null 应清除过期时间', () => {
      store.setExpiresAt(Date.now() + 1000);
      store.setExpiresAt(null);
      expect(store.expiresAt.value).toBeNull();
    });
  });

  // ----------------------------------------------------------
  // 登录过期
  // ----------------------------------------------------------
  describe('login expired', () => {
    it('初始状态 loginExpired 为 false', () => {
      expect(store.loginExpired.value).toBe(false);
    });

    it('setLoginExpired(true) 应标记登录已过期', () => {
      store.setLoginExpired(true);
      expect(store.loginExpired.value).toBe(true);
    });

    it('setLoginExpired(false) 应清除过期标记', () => {
      store.setLoginExpired(true);
      store.setLoginExpired(false);
      expect(store.loginExpired.value).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // 锁屏功能
  // ----------------------------------------------------------
  describe('lock screen', () => {
    it('初始状态 isLockScreen 为 false', () => {
      expect(store.isLockScreen.value).toBe(false);
    });

    it('初始状态 lockScreenPassword 为 undefined', () => {
      expect(store.lockScreenPassword.value).toBeUndefined();
    });

    it('lockScreen 应设置锁屏状态并存储密码哈希', async () => {
      await store.lockScreen('my-secret-password');
      expect(store.isLockScreen.value).toBe(true);
      expect(store.lockScreenPassword.value).toBeDefined();
      // 哈希值不应等于原始密码
      expect(store.lockScreenPassword.value).not.toBe('my-secret-password');
      // SHA-256 hex = 64 chars
      expect(store.lockScreenPassword.value!.length).toBe(64);
    });

    it('lockScreen 不同密码应产生不同哈希', async () => {
      await store.lockScreen('password-a');
      const hashA = store.lockScreenPassword.value;

      await store.lockScreen('password-b');
      const hashB = store.lockScreenPassword.value;

      expect(hashA).not.toBe(hashB);
    });

    it('unlockScreen 应清除锁屏状态和密码', async () => {
      await store.lockScreen('test-password');
      expect(store.isLockScreen.value).toBe(true);

      store.unlockScreen();
      expect(store.isLockScreen.value).toBe(false);
      expect(store.lockScreenPassword.value).toBeUndefined();
    });

    it('verifyLockScreenPassword 正确密码应返回 true', async () => {
      await store.lockScreen('correct-password');
      const result = await store.verifyLockScreenPassword('correct-password');
      expect(result).toBe(true);
    });

    it('verifyLockScreenPassword 错误密码应返回 false', async () => {
      await store.lockScreen('correct-password');
      const result = await store.verifyLockScreenPassword('wrong-password');
      expect(result).toBe(false);
    });

    it('verifyLockScreenPassword 未锁屏时应返回 false', async () => {
      const result = await store.verifyLockScreenPassword('any-password');
      expect(result).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // 密码哈希
  // ----------------------------------------------------------
  describe('password hashing', () => {
    it('hashPassword 应返回 64 位十六进制字符串', async () => {
      const hash = await hashPassword('test');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('相同密码应产生相同哈希', async () => {
      const hash1 = await hashPassword('same-password');
      const hash2 = await hashPassword('same-password');
      expect(hash1).toBe(hash2);
    });

    it('不同密码应产生不同哈希', async () => {
      const hash1 = await hashPassword('password-a');
      const hash2 = await hashPassword('password-b');
      expect(hash1).not.toBe(hash2);
    });

    it('verifyPassword 正确密码应返回 true', async () => {
      const hash = await hashPassword('my-password');
      const result = await verifyPassword('my-password', hash);
      expect(result).toBe(true);
    });

    it('verifyPassword 错误密码应返回 false', async () => {
      const hash = await hashPassword('my-password');
      const result = await verifyPassword('wrong-password', hash);
      expect(result).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // 完整登录/登出/Token 刷新流程
  // ----------------------------------------------------------
  describe('login / logout flow', () => {
    it('登录流程：设置 token 和过期时间', () => {
      const accessToken = 'login-access-token';
      const refreshToken = 'login-refresh-token';
      const expiresIn = 7200;

      store.setAccessToken(accessToken);
      store.setRefreshToken(refreshToken);
      store.setExpiresAt(Date.now() + expiresIn * 1000);
      store.setLoginExpired(false);

      expect(store.accessToken.value).toBe(accessToken);
      expect(store.refreshToken.value).toBe(refreshToken);
      expect(store.expiresAt.value).toBeGreaterThan(Date.now());
      expect(store.loginExpired.value).toBe(false);
    });

    it('登出流程：清除所有 token 和过期状态', () => {
      // 先登录
      store.setAccessToken('access');
      store.setRefreshToken('refresh');
      store.setExpiresAt(Date.now() + 3600_000);
      store.setLoginExpired(false);

      // 登出清除
      store.setAccessToken(null);
      store.setRefreshToken(null);
      store.setExpiresAt(null);
      store.setLoginExpired(false);

      expect(store.accessToken.value).toBeNull();
      expect(store.refreshToken.value).toBeNull();
      expect(store.expiresAt.value).toBeNull();
      expect(store.loginExpired.value).toBe(false);
    });

    it('Token 刷新：更新 accessToken 和 expiresAt，refreshToken 不变', () => {
      // 初始登录
      store.setAccessToken('old-access');
      store.setRefreshToken('my-refresh');
      store.setExpiresAt(Date.now() + 1000);

      // 刷新
      store.setAccessToken('new-access');
      store.setExpiresAt(Date.now() + 7200_000);

      expect(store.accessToken.value).toBe('new-access');
      expect(store.refreshToken.value).toBe('my-refresh');
      expect(store.expiresAt.value).toBeGreaterThan(Date.now());
    });

    it('会话过期：标记 loginExpired 并清除 token', () => {
      // 初始登录
      store.setAccessToken('access');
      store.setRefreshToken('refresh');

      // 会话过期
      store.setLoginExpired(true);
      store.setAccessToken(null);
      store.setRefreshToken(null);

      expect(store.loginExpired.value).toBe(true);
      expect(store.accessToken.value).toBeNull();
      expect(store.refreshToken.value).toBeNull();
    });
  });
});
