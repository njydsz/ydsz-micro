<!--
 * 错误码管理面板
 *
 * <p>展示后端全部业务错误码（A00~C99 体系），支持按模块、按关键词搜索。
 * <p>数据来源：前端 i18n 错误码映射（comm/locales/errors/zh-CN.ts），与后端 ExceptionCode 枚举同步。
 * <p>后端上线"错误码热加载"后，本页面将从后端获取最新文案覆盖本地映射（预留未来 API）。
 *
 * @path apps/system-web/src/views/error-code/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 错误码管理面板
 * <p>只读展示全部业务错误码；支持按模块、关键词搜索过滤。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { computed, ref } from 'vue';

import type { ErrorCode } from '@YDSZ/locales/errors';
import { ZH_CN_MESSAGES } from '@YDSZ/locales/errors/zh-CN';
import {
  ElCard,
  ElEmpty,
  ElInput,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';
import { Search } from '@element-plus/icons-vue';

import { createLogger } from '@ydsz-core/shared/utils';

/** 模块级日志器 */
const logger = createLogger('system-error-code');

/** 错误码条目类型 */
interface ErrorCodeItem {
  /** 错误码 */
  code: ErrorCode;
  /** 中文文案 */
  message: string;
  /** 模块分类（由错误码前缀推断） */
  module: string;
  /** 严重等级（由前缀首字母推断：A=WARN, B=ERROR, C=FATAL） */
  level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
}

/** 严重等级标签映射 */
const LEVEL_TAG_TYPE: Record<ErrorCodeItem['level'], 'info' | 'warning' | 'danger'> = {
  INFO: 'info',
  WARN: 'warning',
  ERROR: 'danger',
  FATAL: 'danger',
};

/**
 * 根据错误码推断模块分类。
 *
 * @param code - 错误码
 * @returns 模块中文名
 */
function inferModule(code: string): string {
  if (code.startsWith('A00')) return '通用/成功';
  if (code.startsWith('A01')) return '参数校验';
  if (code.startsWith('A02')) return '认证';
  if (code.startsWith('A03')) return '授权';
  if (code.startsWith('A04')) return '数据资源';
  if (code.startsWith('A05')) return '批量操作';
  if (code.startsWith('A07')) return '幂等';
  if (code.startsWith('B01')) return '系统内部';
  if (code.startsWith('B02')) return '外部服务';
  if (code.startsWith('B30')) return '用户账号';
  if (code.startsWith('A20')) return 'OAuth/令牌';
  if (code.startsWith('B31')) return '用户管理';
  if (code.startsWith('B32')) return '角色权限';
  if (code.startsWith('B33')) return '注册/密码';
  if (code.startsWith('B34')) return '社交登录';
  if (code.startsWith('B35')) return 'LDAP同步';
  if (code.startsWith('B36')) return 'SCIM';
  if (code.startsWith('B37')) return 'SAML';
  if (code.startsWith('B38')) return 'OIDC';
  if (code.startsWith('B39')) return 'WebAuthn';
  if (code.startsWith('B70')) return '工作流-模板';
  if (code.startsWith('B71')) return '工作流-实例';
  if (code.startsWith('B72')) return '工作流-任务';
  if (code.startsWith('B73')) return '工作流-委托';
  if (code.startsWith('B74')) return '工作流-分类';
  if (code.startsWith('B75')) return '工作流-SLA';
  if (code.startsWith('B76')) return '工作流-Agent';
  if (code.startsWith('B90')) return '系统配置';
  if (code.startsWith('B91')) return '消息通道';
  if (code.startsWith('B92')) return '定时任务';
  if (code.startsWith('B93')) return '规则引擎';
  if (code.startsWith('B94')) return 'AI Agent';
  if (code.startsWith('B95')) return '多租户';
  if (code.startsWith('B96')) return '实体版本';
  if (code.startsWith('C01')) return '安全鉴权';
  if (code.startsWith('C99')) return '未知';
  return '其他';
}

/**
 * 根据错误码推断严重等级。
 *
 * @param code - 错误码
 * @returns 严重等级
 */
function inferLevel(code: string): ErrorCodeItem['level'] {
  const prefix = code.charAt(0);
  switch (prefix) {
    case 'A': return code === 'A00000' ? 'INFO' : 'WARN';
    case 'B': return 'ERROR';
    case 'C': return 'FATAL';
    default: return 'WARN';
  }
}

/** 全量错误码列表（由 ZH_CN_MESSAGES 转换） */
const allErrorCodes = computed<ErrorCodeItem[]>(() =>
  Object.entries(ZH_CN_MESSAGES as Record<ErrorCode, string>).map(([code, message]) => ({
    code,
    message,
    module: inferModule(code),
    level: inferLevel(code),
  })),
);

/** 搜索关键词 */
const searchKeyword = ref('');

/** 模块过滤 */
const moduleFilter = ref<string>('all');

/** 严重等级过滤 */
const levelFilter = ref<string>('all');

/** 模块列表（从全量数据中提取去重） */
const moduleOptions = computed(() => {
  const modules = new Set(allErrorCodes.value.map((item) => item.module));
  return [
    { label: '全部模块', value: 'all' },
    ...Array.from(modules)
      .sort()
      .map((m) => ({ label: m, value: m })),
  ];
});

/** 过滤后的错误码列表 */
const filteredErrorCodes = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  return allErrorCodes.value.filter((item) => {
    if (moduleFilter.value !== 'all' && item.module !== moduleFilter.value) return false;
    if (levelFilter.value !== 'all' && item.level !== levelFilter.value) return false;
    if (
      keyword &&
      !item.code.toLowerCase().includes(keyword) &&
      !item.message.toLowerCase().includes(keyword)
    ) {
      return false;
    }
    return true;
  });
});

// 仅开发模式打印日志，避免生产环境刷屏
if (import.meta.env.DEV) {
  logger.info('[ErrorCode] 加载 {} 条错误码记录', allErrorCodes.value.length);
}
</script>

<template>
  <div class="error-code-management p-4 space-y-4">
    <!-- 顶部过滤区 -->
    <ElCard shadow="never">
      <div class="flex flex-wrap items-center gap-4">
        <ElInput
          v-model="searchKeyword"
          :prefix-icon="Search"
          placeholder="搜索错误码 / 关键词"
          clearable
          style="width: 260px"
        />
        <ElSelect v-model="moduleFilter" placeholder="选择模块" style="width: 180px">
          <ElOption
            v-for="opt in moduleOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
        <ElSelect v-model="levelFilter" placeholder="选择等级" style="width: 140px">
          <ElOption label="全部等级" value="all" />
          <ElOption label="INFO" value="INFO" />
          <ElOption label="WARN" value="WARN" />
          <ElOption label="ERROR" value="ERROR" />
          <ElOption label="FATAL" value="FATAL" />
        </ElSelect>
        <div class="ml-auto text-sm text-gray-400">
          共 {{ filteredErrorCodes.length }} / {{ allErrorCodes.length }} 条
        </div>
      </div>
    </ElCard>

    <!-- 错误码表格 -->
    <ElCard shadow="never">
      <ElTable :data="filteredErrorCodes" stripe style="width: 100%">
        <ElTableColumn prop="code" label="错误码" width="120">
          <template #default="{ row }">
            <span class="font-mono text-sm">{{ row.code }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="module" label="模块" width="140">
          <template #default="{ row }">
            <ElTag size="small" type="info">{{ row.module }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="level" label="等级" width="100">
          <template #default="{ row }">
            <ElTag :type="LEVEL_TAG_TYPE[row.level]" size="small">{{ row.level }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="message" label="错误描述" min-width="300" />
      </ElTable>
      <ElEmpty v-if="filteredErrorCodes.length === 0" description="暂无匹配的错误码" />
    </ElCard>
  </div>
</template>
