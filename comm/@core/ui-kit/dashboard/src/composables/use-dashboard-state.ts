/**
 * useDashboardState — 仪表盘状态管理组合式 API。
 *
 * <p>集中管理仪表盘的卡片集合、编辑模式和卡片 CRUD。
 *
 * @path comm\@core\ui-kit\dashboard\src\composables\use-dashboard-state.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { computed, ref } from 'vue';

import type { DashboardCard, DashboardConfig, StatCard } from '../types';

import { createDefaultConfig } from '../types';

let cardCounter = 0;

function generateCardId(): string {
  return `card_${Date.now()}_${cardCounter++}`;
}

/**
 * 仪表盘状态组合式 API。
 *
 * @param initialConfig 初始配置（可选）
 * @return 仪表盘状态和操作方法
 */
export function useDashboardState(initialConfig?: Partial<DashboardConfig>) {
  const config = ref<DashboardConfig>({
    ...createDefaultConfig('新仪表盘'),
    ...initialConfig,
    cards: initialConfig?.cards ?? [],
  });

  /** 卡片数量 */
  const cardCount = computed<number>(() => config.value.cards.length);

  /** 是否可导出 */
  const canExport = computed<boolean>(() => config.value.cards.length > 0);

  /**
   * 添加一张 KPI 统计卡片。
   */
  function addStatCard(params: Partial<StatCard> & { title: string }): StatCard {
    const card: StatCard = {
      id: generateCardId(),
      type: 'simple-stat',
      title: params.title,
      subtitle: params.subtitle,
      value: params.value ?? 0,
      compareValue: params.compareValue,
      unit: params.unit,
      prefix: params.prefix,
      suffix: params.suffix,
      precision: params.precision,
      icon: params.icon,
      color: params.color ?? 'primary',
      span: params.span ?? 4,
      sort: config.value.cards.length * 10,
    };
    config.value.cards = [...config.value.cards, card];
    return card;
  }

  /**
   * 添加一张图表卡片。
   */
  function addChartCard(params: {
    title: string;
    type: 'chart-line' | 'chart-bar' | 'chart-pie' | 'chart-area';
    option: import('echarts').EChartsOption;
    span?: number;
    subtitle?: string;
  }): DashboardCard {
    const card: DashboardCard = {
      id: generateCardId(),
      type: params.type,
      title: params.title,
      subtitle: params.subtitle,
      option: params.option,
      span: params.span ?? 6,
      sort: config.value.cards.length * 10,
    };
    config.value.cards = [...config.value.cards, card];
    return card;
  }

  /**
   * 移除卡片。
   */
  function removeCard(id: string): void {
    config.value.cards = config.value.cards.filter((c) => c.id !== id);
  }

  /**
   * 更新卡片。
   */
  function updateCard(id: string, updates: Partial<DashboardCard>): void {
    config.value.cards = config.value.cards.map((c) => {
      if (c.id !== id) {
        return c;
      }
      return { ...c, ...updates } as DashboardCard;
    });
  }

  /**
   * 切换编辑模式。
   */
  function toggleEditMode(): void {
    config.value.isEditable = !config.value.isEditable;
  }

  /**
   * 导出配置。
   */
  function exportConfig(): DashboardConfig {
    return JSON.parse(JSON.stringify(config.value)) as DashboardConfig;
  }

  /**
   * 导入配置。
   */
  function importConfig(imported: DashboardConfig): void {
    config.value = { ...imported };
  }

  /**
   * 清空所有卡片。
   */
  function clearAll(): void {
    config.value.cards = [];
  }

  return {
    config,
    cardCount,
    canExport,
    addStatCard,
    addChartCard,
    removeCard,
    updateCard,
    toggleEditMode,
    exportConfig,
    importConfig,
    clearAll,
  };
}
