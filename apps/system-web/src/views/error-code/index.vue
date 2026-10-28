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
import { useI18n } from 'vue-i18n';

import type { ErrorCode } from '@ydsz/locales/errors';
import { ZH_CN_MESSAGES } from '@ydsz/locales/errors/zh-CN';
import { YdBadge, YdInput, YdTable, YdTableColumn, YdCard, YdEmptyState, YdSelectItem, YdSelect } from '@ydsz-core/ydsz-ui';
import { Search } from '@ydsz/icons';

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
/**
 * 错误码前缀 → 模块名。
 *
 * <p>用 { prefix, labelKey } 清单而不是 if-return 链：键名写在 labelKey 属性上，
 * 缺键能被动静态门禁抓到；协议名（SCIM/SAML/OIDC/WebAuthn/AI Agent）是专有名词，
 * 各语种一致，直接给 label。
 */
const MODULE_BY_PREFIX: Array<{ prefix: string; labelKey?: string; label?: string }> = [
  { prefix: 'A00', labelKey: 'errorCode.moduleGeneric' },
  { prefix: 'A01', labelKey: 'errorCode.moduleParam' },
  { prefix: 'A02', labelKey: 'errorCode.moduleAuthn' },
  { prefix: 'A03', labelKey: 'errorCode.moduleAuthz' },
  { prefix: 'A04', labelKey: 'errorCode.moduleData' },
  { prefix: 'A05', labelKey: 'errorCode.moduleBatch' },
  { prefix: 'A07', labelKey: 'errorCode.moduleIdempotent' },
  { prefix: 'B01', labelKey: 'errorCode.moduleInternal' },
  { prefix: 'B02', labelKey: 'errorCode.moduleExternal' },
  { prefix: 'B30', labelKey: 'errorCode.moduleUserAccount' },
  { prefix: 'A20', labelKey: 'errorCode.moduleOauth' },
  { prefix: 'B31', labelKey: 'errorCode.moduleUserMgmt' },
  { prefix: 'B32', labelKey: 'errorCode.moduleRole' },
  { prefix: 'B33', labelKey: 'errorCode.moduleRegister' },
  { prefix: 'B34', labelKey: 'errorCode.moduleSocial' },
  { prefix: 'B35', labelKey: 'errorCode.moduleLdap' },
  { prefix: 'B36', label: 'SCIM' },
  { prefix: 'B37', label: 'SAML' },
  { prefix: 'B38', label: 'OIDC' },
  { prefix: 'B39', label: 'WebAuthn' },
  { prefix: 'B70', labelKey: 'errorCode.moduleWfTemplate' },
  { prefix: 'B71', labelKey: 'errorCode.moduleWfInstance' },
  { prefix: 'B72', labelKey: 'errorCode.moduleWfTask' },
  { prefix: 'B73', labelKey: 'errorCode.moduleWfDelegation' },
  { prefix: 'B74', labelKey: 'errorCode.moduleWfCategory' },
  { prefix: 'B75', labelKey: 'errorCode.moduleWfSla' },
  { prefix: 'B76', labelKey: 'errorCode.moduleWfAgent' },
  { prefix: 'B90', labelKey: 'errorCode.moduleSystemConfig' },
  { prefix: 'B91', labelKey: 'errorCode.moduleMessage' },
  { prefix: 'B92', labelKey: 'errorCode.moduleCronjob' },
  { prefix: 'B93', labelKey: 'errorCode.moduleRule' },
  { prefix: 'B94', label: 'AI Agent' },
  { prefix: 'B95', labelKey: 'errorCode.moduleTenant' },
  { prefix: 'B96', labelKey: 'errorCode.moduleEntityVersion' },
  { prefix: 'C01', labelKey: 'errorCode.moduleSecurityAuthz' },
  { prefix: 'C99', labelKey: 'errorCode.moduleUnknown' },
];

/**
 * 根据错误码推断模块分类。
 *
 * @param code - 错误码
 * @returns 模块显示名（按当前语种）
 */
function inferModule(code: string): string {
  const hit = MODULE_BY_PREFIX.find((item) => code.startsWith(item.prefix));
  if (!hit) return t('errorCode.moduleOther');
  return hit.labelKey ? t(hit.labelKey) : (hit.label ?? '');
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
const { t } = useI18n();

const searchKeyword = ref('');

/** 模块过滤 */
const moduleFilter = ref<string>('all');

/** 严重等级过滤 */
const levelFilter = ref<string>('all');

/** 模块列表（从全量数据中提取去重） */
const moduleOptions = computed(() => {
  const modules = new Set(allErrorCodes.value.map((item) => item.module));
  return [
    { label: t('errorCode.allModules'), value: 'all' },
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
  <div class="error-code-management p-5 space-y-4">
    <!-- 顶部过滤区 -->
    <YdCard shadow="never">
      <div class="flex flex-wrap items-center gap-5">
        <!-- TODO: prefix-icon 与 clearable 需手动组合 slot（shadcn YdInput 不内置） -->
        <YdInput
          v-model="searchKeyword"
          :placeholder="t('errorCode.searchPlaceholder')"
          class="w-[260px]"
        />
        <YdSelect v-model="moduleFilter" :placeholder="t('errorCode.selectModule')" style="width: 180px">
          <YdSelectItem
            v-for="opt in moduleOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </YdSelect>
        <YdSelect v-model="levelFilter" :placeholder="t('errorCode.selectLevel')" style="width: 140px">
          <YdSelectItem :label="t('errorCode.allLevels')" value="all" />
          <YdSelectItem label="INFO" value="INFO" />
          <YdSelectItem label="WARN" value="WARN" />
          <YdSelectItem label="ERROR" value="ERROR" />
          <YdSelectItem label="FATAL" value="FATAL" />
        </YdSelect>
        <div class="ml-auto text-sm text-gray-400">
          {{ t('errorCode.countSummary', { filtered: filteredErrorCodes.length, total: allErrorCodes.length }) }}
        </div>
      </div>
    </YdCard>

    <!-- 错误码表格 -->
    <YdCard shadow="never">
      <YdTable :data="filteredErrorCodes" stripe style="width: 100%">
        <YdTableColumn prop="code" :label="t('errorCode.colCode')" width="120">
          <template #default="{ row }">
            <span class="font-mono text-sm">{{ row.code }}</span>
          </template>
        </YdTableColumn>
        <YdTableColumn prop="module" :label="t('errorCode.colModule')" width="140">
          <template #default="{ row }">
            <YdBadge variant="secondary">{{ row.module }}</YdBadge>
          </template>
        </YdTableColumn>
        <YdTableColumn prop="level" :label="t('errorCode.colLevel')" width="100">
          <template #default="{ row }">
            <YdBadge :variant="LEVEL_TAG_TYPE[row.level] === 'info' ? 'secondary' : 'destructive'">{{ row.level }}</YdBadge>
          </template>
        </YdTableColumn>
        <YdTableColumn prop="message" :label="t('errorCode.colMessage')" min-width="300" />
      </YdTable>
      <YdEmptyState v-if="filteredErrorCodes.length === 0" :description="t('errorCode.noMatch')" />
    </YdCard>
  </div>
</template>
