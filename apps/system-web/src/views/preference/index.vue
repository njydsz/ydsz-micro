<!--
 * 个人设置页面 —— 用户偏好配置（主题/布局/表格/语言等）
 *
 * @path apps\system-web\src\views\preference\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { onMounted, reactive, ref, watch } from 'vue';

import { createLogger } from '@YDSZ-core/shared/utils';
import { ElButton, ElCard, ElDivider, ElForm, ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';

import { getUserPreferenceApi, saveUserPreferenceApi } from '#/api/core/preference';

defineOptions({ name: 'UserPreference' });

const logger = createLogger('UserPreference');
const { t, locale } = useI18n();

/** 保存加载状态 */
const loading = ref(false);
const saving = ref(false);

/** 轻量偏好（localStorage 即时生效） */
const localPrefs = reactive({
  theme: 'light' as 'light' | 'dark' | 'auto',
  themeColor: '#3b82f6',
  menuLayout: 'side' as 'side' | 'top' | 'mix',
  accordionMenu: true as boolean,
  tableSize: 'default' as 'default' | 'compact' | 'loose',
  fontSize: 'medium' as 'small' | 'medium' | 'large',
});

/** 用户级偏好（同步到后端） */
const userPrefs = reactive({
  defaultIndex: '/system/monitor/dashboard',
  language: 'zh-CN',
});

/** 8 种预设主题色 */
const themeColors = [
  { label: 'blue', value: '#3b82f6' },
  { label: 'green', value: '#22c55e' },
  { label: 'purple', value: '#a855f7' },
  { label: 'orange', value: '#f97316' },
  { label: 'red', value: '#ef4444' },
  { label: 'pink', value: '#ec4899' },
  { label: 'cyan', value: '#06b6d4' },
  { label: 'gray', value: '#6b7280' },
];

/** 默认首页选项 */
const defaultIndexOptions = [
  { label: '偏好.dashboard', value: '/system/monitor/dashboard' },
  { label: '偏好.auditLog', value: '/audit/log' },
  { label: '偏好.configManagement', value: '/system/config' },
  { label: '偏好.dictType', value: '/system/dict-type' },
  { label: '偏好.variable', value: '/system/variable' },
  { label: '偏好.appManagement', value: '/system/app' },
];

const languageOptions = [
  { label: '偏好.zhCN', value: 'zh-CN' },
  { label: '偏好.enUS', value: 'en-US' },
];

/** 主题模式选项 */
const themeModeOptions = [
  { label: '偏好.themeLight', value: 'light' },
  { label: '偏好.themeDark', value: 'dark' },
  { label: '偏好.themeAuto', value: 'auto' },
];

const menuLayoutOptions = [
  { label: '偏好.sideMenu', value: 'side' },
  { label: '偏好.topMenu', value: 'top' },
  { label: '偏好.mixMenu', value: 'mix' },
];

const tableSizeOptions = [
  { label: '偏好.sizeDefault', value: 'default' },
  { label: '偏好.sizeCompact', value: 'compact' },
  { label: '偏好.sizeLoose', value: 'loose' },
];

const fontSizeOptions = [
  { label: '偏好.fontSmall', value: 'small' },
  { label: '偏好.fontMedium', value: 'medium' },
  { label: '偏好.fontLarge', value: 'large' },
];

/** 表格密度与 VxeTable size 映射 */
const tableSizeVxeMap: Record<string, string> = {
  default: 'small',
  compact: 'mini',
  loose: 'medium',
};

/** 字体大小对应的 CSS 变量（px 基准） */
const fontSizeCSSValue: Record<string, string> = {
  small: '13px',
  medium: '14px',
  large: '16px',
};

/** 主题色 CSS 变量 */
function applyThemeColor(color: string): void {
  document.documentElement.style.setProperty('--el-color-primary', color);
  // 派生色阶
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  for (let i = 1; i <= 9; i++) {
    const factor = i <= 5 ? 0.9 + i * 0.05 : 1 + (i - 5) * 0.05;
    document.documentElement.style.setProperty(
      `--el-color-primary-light-${i}`,
      `rgba(${r}, ${g}, ${b}, ${factor.toFixed(2)})`,
    );
  }
}

/** 应用主题模式 */
function applyThemeMode(mode: 'light' | 'dark' | 'auto'): void {
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  if (mode === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(prefersDark ? 'dark' : 'light');
  } else {
    root.classList.add(mode);
  }
}

/** 应用表格密度 */
function applyTableSize(size: string): void {
  document.documentElement.style.setProperty(
    '--ydsz-table-size',
    tableSizeVxeMap[size] || 'small',
  );
}

/** 应用字体大小 */
function applyFontSize(size: string): void {
  document.documentElement.style.setProperty(
    '--el-font-size-base',
    fontSizeCSSValue[size] || '14px',
  );
}

/** 应用语言切换 */
function applyLanguage(lang: string): void {
  locale.value = lang;
}

/** 监听本地偏好变化并即时生效 */
watch(
  () => localPrefs.themeColor,
  (val) => {
    applyThemeColor(val);
    localStorage.setItem('pref_theme', val);
  },
);

watch(
  () => localPrefs.theme,
  (val) => {
    applyThemeMode(val);
    localStorage.setItem('pref_theme_mode', val);
  },
);

watch(
  () => localPrefs.menuLayout,
  (val) => {
    localStorage.setItem('pref_menu_layout', val);
  },
);

watch(
  () => localPrefs.accordionMenu,
  (val) => {
    localStorage.setItem('pref_accordion_menu', String(val));
  },
);

watch(
  () => localPrefs.tableSize,
  (val) => {
    applyTableSize(val);
    localStorage.setItem('pref_table_size', val);
  },
);

watch(
  () => localPrefs.fontSize,
  (val) => {
    applyFontSize(val);
    localStorage.setItem('pref_font_size', val);
  },
);

watch(
  () => userPrefs.language,
  (val) => {
    applyLanguage(val);
    localStorage.setItem('pref_language', val);
  },
);

watch(
  () => userPrefs.defaultIndex,
  (val) => {
    localStorage.setItem('pref_default_index', val);
  },
);

/**
 * 从 localStorage 初始化偏好配置。
 */
function initFromLocalStorage(): void {
  const storedThemeColor = localStorage.getItem('pref_theme');
  const storedThemeMode = localStorage.getItem('pref_theme_mode') as
    | 'light'
    | 'dark'
    | 'auto'
    | null;
  const storedMenuLayout = localStorage.getItem('pref_menu_layout') as
    | 'side'
    | 'top'
    | 'mix'
    | null;
  const storedAccordion = localStorage.getItem('pref_accordion_menu');
  const storedTableSize = localStorage.getItem('pref_table_size') as
    | 'default'
    | 'compact'
    | 'loose'
    | null;
  const storedFontSize = localStorage.getItem('pref_font_size') as
    | 'small'
    | 'medium'
    | 'large'
    | null;
  const storedLanguage = localStorage.getItem('pref_language');
  const storedDefaultIndex = localStorage.getItem('pref_default_index');

  if (storedThemeColor) localPrefs.themeColor = storedThemeColor;
  if (storedThemeMode) localPrefs.theme = storedThemeMode;
  if (storedMenuLayout) localPrefs.menuLayout = storedMenuLayout;
  if (storedAccordion !== null) localPrefs.accordionMenu = storedAccordion === 'true';
  if (storedTableSize) localPrefs.tableSize = storedTableSize;
  if (storedFontSize) localPrefs.fontSize = storedFontSize;
  if (storedLanguage) userPrefs.language = storedLanguage;
  if (storedDefaultIndex) userPrefs.defaultIndex = storedDefaultIndex;
}

/**
 * 同步「保存当前设置」到后端。
 */
async function handleSave(): Promise<void> {
  saving.value = true;
  try {
    await saveUserPreferenceApi({
      defaultIndex: userPrefs.defaultIndex,
      language: userPrefs.language,
      theme: localPrefs.theme,
      themeColor: localPrefs.themeColor,
      menuLayout: localPrefs.menuLayout,
      accordionMenu: localPrefs.accordionMenu,
      tableSize: localPrefs.tableSize,
      fontSize: localPrefs.fontSize,
    });
    ElMessage.success(t('偏好.saveSuccess'));
    logger.info('用户偏好保存成功');
  } catch (error) {
    logger.warn('保存用户偏好失败', error);
    // 错误提示由 errorMessageResponseInterceptor 统一处理
    ElMessage.warning(t('偏好.saveFailed'));
  } finally {
    saving.value = false;
  }
}

/**
 * 从后端加载偏好配置。
 */
async function handleLoadFromBackend(): Promise<void> {
  loading.value = true;
  try {
    const remote = await getUserPreferenceApi();
    if (remote.defaultIndex) userPrefs.defaultIndex = remote.defaultIndex;
    if (remote.language) userPrefs.language = remote.language;
    if (remote.theme) localPrefs.theme = remote.theme as typeof localPrefs.theme;
    if (remote.themeColor) localPrefs.themeColor = remote.themeColor;
    if (remote.menuLayout)
      localPrefs.menuLayout = remote.menuLayout as typeof localPrefs.menuLayout;
    if (remote.accordionMenu !== undefined)
      localPrefs.accordionMenu = remote.accordionMenu;
    if (remote.tableSize)
      localPrefs.tableSize = remote.tableSize as typeof localPrefs.tableSize;
    if (remote.fontSize)
      localPrefs.fontSize = remote.fontSize as typeof localPrefs.fontSize;
    ElMessage.success(t('偏好.loadSuccess'));
    logger.info('用户偏好从后端加载成功');
  } catch (error) {
    logger.warn('从后端加载用户偏好失败，使用本地缓存', error);
    ElMessage.warning(t('偏好.loadFailed'));
  } finally {
    loading.value = false;
  }
}

/**
 * 重置所有偏好为默认值。
 */
function handleReset(): void {
  localPrefs.theme = 'light';
  localPrefs.themeColor = '#3b82f6';
  localPrefs.menuLayout = 'side';
  localPrefs.accordionMenu = true;
  localPrefs.tableSize = 'default';
  localPrefs.fontSize = 'medium';
  userPrefs.defaultIndex = '/system/monitor/dashboard';
  userPrefs.language = 'zh-CN';

  localStorage.removeItem('pref_theme');
  localStorage.removeItem('pref_theme_mode');
  localStorage.removeItem('pref_menu_layout');
  localStorage.removeItem('pref_accordion_menu');
  localStorage.removeItem('pref_table_size');
  localStorage.removeItem('pref_font_size');
  localStorage.removeItem('pref_language');
  localStorage.removeItem('pref_default_index');

  ElMessage.success(t('偏好.resetSuccess'));
}

onMounted(() => {
  initFromLocalStorage();
  // 应用初始化时即时生效
  applyThemeColor(localPrefs.themeColor);
  applyThemeMode(localPrefs.theme);
  applyFontSize(localPrefs.fontSize);
  applyTableSize(localPrefs.tableSize);
  // 从后端加载用户级偏好
  void handleLoadFromBackend();
});

</script>

<template>
  <div class="preference-page">
    <ElForm label-position="top" class="preference-form">
      <!-- 主题设置卡片 -->
      <ElCard shadow="never" class="preference-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">{{ t('偏好.theme') }}</span>
            <span class="card-desc">{{ t('偏好.themeDesc') }}</span>
          </div>
        </template>

        <!-- 主题模式 -->
        <div class="form-row">
          <div class="form-row-label">{{ t('偏好.themeMode') }}</div>
          <el-radio-group v-model="localPrefs.theme">
            <el-radio-button
              v-for="opt in themeModeOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ t(opt.label) }}
            </el-radio-button>
          </el-radio-group>
        </div>

        <ElDivider />

        <!-- 主题色 -->
        <div class="form-row">
          <div class="form-row-label">{{ t('偏好.themeColor') }}</div>
          <div class="color-swatches">
            <div
              v-for="color in themeColors"
              :key="color.value"
              class="color-swatch"
              :class="{ 'is-active': localPrefs.themeColor === color.value }"
              :style="{ backgroundColor: color.value }"
              :title="t(`偏好.colorLabel.${color.label}`)"
              @click="localPrefs.themeColor = color.value"
            >
              <el-icon
                v-if="localPrefs.themeColor === color.value"
                class="check-icon"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </el-icon>
            </div>
          </div>
        </div>
      </ElCard>

      <!-- 布局设置卡片 -->
      <ElCard shadow="never" class="preference-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">{{ t('偏好.layout') }}</span>
            <span class="card-desc">{{ t('偏好.layoutDesc') }}</span>
          </div>
        </template>

        <!-- 菜单布局 -->
        <div class="form-row">
          <div class="form-row-label">{{ t('偏好.menuLayout') }}</div>
          <el-radio-group v-model="localPrefs.menuLayout">
            <el-radio-button
              v-for="opt in menuLayoutOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ t(opt.label) }}
            </el-radio-button>
          </el-radio-group>
        </div>

        <ElDivider />

        <!-- 手风琴菜单 -->
        <div class="form-row">
          <div class="form-row-label">{{ t('偏好.accordionMenu') }}</div>
          <el-switch
            v-model="localPrefs.accordionMenu"
            :active-text="t('偏好.on')"
            :inactive-text="t('偏好.off')"
          />
        </div>
      </ElCard>

      <!-- 表格设置卡片 -->
      <ElCard shadow="never" class="preference-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">{{ t('偏好.table') }}</span>
            <span class="card-desc">{{ t('偏好.tableDesc') }}</span>
          </div>
        </template>

        <!-- 表格密度 -->
        <div class="form-row">
          <div class="form-row-label">{{ t('偏好.tableSize') }}</div>
          <el-radio-group v-model="localPrefs.tableSize">
            <el-radio-button
              v-for="opt in tableSizeOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ t(opt.label) }}
            </el-radio-button>
          </el-radio-group>
        </div>
      </ElCard>

      <!-- 视觉设置卡片 -->
      <ElCard shadow="never" class="preference-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">{{ t('偏好.visual') }}</span>
            <span class="card-desc">{{ t('偏好.visualDesc') }}</span>
          </div>
        </template>

        <!-- 字体大小 -->
        <div class="form-row">
          <div class="form-row-label">{{ t('偏好.fontSize') }}</div>
          <el-radio-group v-model="localPrefs.fontSize">
            <el-radio-button
              v-for="opt in fontSizeOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ t(opt.label) }}
            </el-radio-button>
          </el-radio-group>
        </div>
      </ElCard>

      <!-- 通用设置卡片 -->
      <ElCard shadow="never" class="preference-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">{{ t('偏好.general') }}</span>
            <span class="card-desc">{{ t('偏好.generalDesc') }}</span>
          </div>
        </template>

        <!-- 默认首页 -->
        <div class="form-row">
          <div class="form-row-label">{{ t('偏好.defaultIndex') }}</div>
          <el-select v-model="userPrefs.defaultIndex" style="width: 260px">
            <el-option
              v-for="opt in defaultIndexOptions"
              :key="opt.value"
              :label="t(opt.label)"
              :value="opt.value"
            />
          </el-select>
        </div>

        <ElDivider />

        <!-- 语言设置 -->
        <div class="form-row">
          <div class="form-row-label">{{ t('偏好.language') }}</div>
          <el-radio-group v-model="userPrefs.language">
            <el-radio-button
              v-for="opt in languageOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ t(opt.label) }}
            </el-radio-button>
          </el-radio-group>
        </div>
      </ElCard>

      <!-- 底部操作栏 -->
      <div class="action-bar">
        <ElButton :loading="loading" plain @click="handleLoadFromBackend">
          {{ t('偏好.loadFromBackend') }}
        </ElButton>
        <ElButton plain @click="handleReset">
          {{ t('偏好.reset') }}
        </ElButton>
        <ElButton :loading="saving" type="primary" @click="handleSave">
          {{ t('偏好.save') }}
        </ElButton>
      </div>
    </ElForm>
  </div>
</template>

<style lang="scss" scoped>
.preference-page {
  max-width: 800px;
  padding: 16px;
  margin: 0 auto;
}

.preference-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  gap: 12px;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.card-desc {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.form-row {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 8px 0;
}

.form-row-label {
  flex-shrink: 0;
  width: 100px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.color-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.color-swatch {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  cursor: pointer;
  border-radius: 8px;
  transition: transform 0.15s;

  &:hover {
    transform: scale(1.15);
  }

  &.is-active {
    box-shadow: 0 0 0 2px var(--el-color-white), 0 0 0 4px var(--el-color-primary);
  }
}

.check-icon {
  width: 16px;
  height: 16px;
  font-weight: 700;
  color: #fff;
}

.action-bar {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 24px 0;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
