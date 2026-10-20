/**
 * 偏好设置导入/导出组合式函数。
 *
 * <p>封装 preferences 配置的 JSON 序列化/反序列化与 HTTP 传输能力，
 * 提供浏览器端文件下载与文件读取能力。
 *
 * <p>导入 API 路径基于当前窗口位置自动拼接（单租户子应用部署场景）。
 *
 * @path comm/@core/composables/src/use-preference-io.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 偏好多参数 DTO —— 后端契约 */
interface PreferenceDTO {
  defaultIndex?: string;
  language?: string;
  theme?: string;
  themeColor?: string;
  menuLayout?: string;
  accordionMenu?: boolean;
  tableSize?: string;
  fontSize?: string;
}

/** 偏好导入导出的 JSON Schema 顶层字段（宽松校验） */
type PreferenceSchema = PreferenceDTO;

const SCHEMA_FIELDS: (keyof PreferenceSchema)[] = [
  'defaultIndex',
  'language',
  'theme',
  'themeColor',
  'menuLayout',
  'accordionMenu',
  'tableSize',
  'fontSize',
];

/**
 * 校验偏好数据是否符合基础 schema。
 *
 * <p>执行字段类型初筛：顶层必须为对象，且各字段类型符合预期。
 * 不做穷举枚举校验（由后端负责最终校验）。
 *
 * @param data - 待校验的数据
 * @returns 校验结果，合法返回 true
 */
export function validatePreferenceSchema(data: unknown): boolean {
  if (data === null || typeof data !== 'object') {
    return false;
  }
  const record = data as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!SCHEMA_FIELDS.includes(key as keyof PreferenceSchema)) {
      return false;
    }
  }
  if (record.defaultIndex !== undefined && typeof record.defaultIndex !== 'string') {
    return false;
  }
  if (record.language !== undefined && typeof record.language !== 'string') {
    return false;
  }
  if (record.theme !== undefined && typeof record.theme !== 'string') {
    return false;
  }
  if (record.themeColor !== undefined && typeof record.themeColor !== 'string') {
    return false;
  }
  if (record.menuLayout !== undefined && typeof record.menuLayout !== 'string') {
    return false;
  }
  if (record.accordionMenu !== undefined && typeof record.accordionMenu !== 'boolean') {
    return false;
  }
  if (record.tableSize !== undefined && typeof record.tableSize !== 'string') {
    return false;
  }
  if (record.fontSize !== undefined && typeof record.fontSize !== 'string') {
    return false;
  }
  return true;
}

/**
 * 发送带 Bearer Token 的 JSON 请求。
 *
 * <p>内部基于 fetch + Authorization header，
 * 与子系统 requestClient 使用同一 Token 存储（localStorage access-token）。
 *
 * @param path - API 路径
 * @param init - RequestInit
 * @returns Response
 */
async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = localStorage.getItem('access-token') ?? '';
  return fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
}

/**
 * 导出偏好为组合式函数。
 *
 * @returns 导出/导入/校验三个方法
 */
export function usePreferenceIo() {
  /**
   * 导出偏好配置。
   *
   * <p>从后端拉取当前用户偏好 JSON，触发浏览器下载为 ydsz-preferences-{timestamp}.json。
   */
  async function exportPreferences(): Promise<void> {
    const response = await authFetch('/api/user/preferences/export');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data: PreferenceDTO = await response.json();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const link = document.createElement('a');
    link.href = url;
    link.download = `ydsz-preferences-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * 导入偏好配置。
   *
   * <p>读取客户端 File 对象内容并校验 schema，校验通过后提交到后端。
   *
   * @param file - 浏览器 File 对象
   */
  async function importPreferences(file: File): Promise<void> {
    const text = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('INVALID_JSON');
    }
    if (!validatePreferenceSchema(parsed)) {
      throw new Error('INVALID_SCHEMA');
    }
    const response = await authFetch('/api/user/preferences/import', {
      method: 'POST',
      body: JSON.stringify(parsed),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  return {
    exportPreferences,
    importPreferences,
    validatePreferenceSchema,
  };
}
