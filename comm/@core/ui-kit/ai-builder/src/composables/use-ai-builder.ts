/**
 * useAiBuilder — AI 生成器组合式 API。
 *
 * <p>封装了自然语言→页面骨架的完整交互状态机：
 * <ol>
 *   <li>用户输入自然语言描述</li>
 *   <li>调用引擎解析意图并生成骨架</li>
 *   <li>支持增量编辑（增删改字段）</li>
 *   <li>输出最终 {@link GeneratedPage} 供表单/列表渲染使用</li>
 * </ol>
 *
 * @path comm\@core\ui-kit\ai-builder\src\composables\use-ai-builder.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { computed, ref } from 'vue';

import type {
  AiGenerationOptions,
  FieldSuggestion,
  GeneratedPage,
  PageIntent,
} from '../types';

import {
  DEFAULT_AI_GENERATION_OPTIONS,
} from '../types';
import { generatePage, parseIntent } from '../engine';

/**
 * useAiBuilder 组合式 API 选项。
 */
export interface UseAiBuilderOptions {
  /** 生成配置（可选，使用默认值） */
  generationOptions?: Partial<AiGenerationOptions>;
  /** 初始描述文字 */
  initialDescription?: string;
  /** 生成成功后的回调 */
  onGenerated?: (page: GeneratedPage) => void;
}

/**
 * AI 生成器组合式 API。
 *
 * @param options 配置选项
 * @return 生成器状态和操作方法
 */
export function useAiBuilder(options: UseAiBuilderOptions = {}) {
  const {
    initialDescription = '',
    onGenerated,
  } = options;

  // 合并配置
  const generationOptions = ref<AiGenerationOptions>({
    ...DEFAULT_AI_GENERATION_OPTIONS,
    ...options.generationOptions,
  });

  // 输入态
  const description = ref<string>(initialDescription);
  const isGenerating = ref<boolean>(false);
  const error = ref<string | null>(null);

  // 输出态
  const generatedPage = ref<GeneratedPage | null>(null);

  // 编辑态 — 增量修改生成结果
  const editedFields = ref<FieldSuggestion[]>([]);

  /**
   * 计算属性：当前生效的字段列表（编辑态优先）。
   */
  const fields = computed<FieldSuggestion[]>(() => {
    if (editedFields.value.length > 0) {
      return editedFields.value;
    }
    return generatedPage.value?.fields ?? [];
  });

  /**
   * 计算属性：-confidence.
   */
  const confidence = computed<number>(() => generatedPage.value?.confidence ?? 0);

  /**
   * 计算属性：是否已生成。
   */
  const hasGenerated = computed<boolean>(() => generatedPage.value !== null);

  /**
   * 执行页面生成。
   *
   * @param overrideDescription 可覆盖描述（可选，默认取 description.value）
   * @return 生成的页面骨架
   */
  async function generate(overrideDescription?: string): Promise<GeneratedPage | null> {
    const input = overrideDescription ?? description.value;
    if (!input.trim()) {
      error.value = '请输入页面描述';
      return null;
    }

    isGenerating.value = true;
    error.value = null;

    try {
      const intent: PageIntent = parseIntent(input);
      const page: GeneratedPage = generatePage(intent, generationOptions.value);
      generatedPage.value = page;
      editedFields.value = [...page.fields];
      onGenerated?.(page);
      return page;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '生成失败，请检查输入';
      return null;
    } finally {
      isGenerating.value = false;
    }
  }

  /**
   * 添加字段。
   *
   * @param field 新字段
   */
  function addField(field: FieldSuggestion): void {
    const maxSort = editedFields.value.reduce(
      (max, f) => Math.max(max, f.sort),
      0,
    );
    editedFields.value = [
      ...editedFields.value,
      { ...field, sort: field.sort > 0 ? field.sort : maxSort + 10 },
    ];
  }

  /**
   * 移除字段。
   *
   * @param fieldName 字段名
   */
  function removeField(fieldName: string): void {
    editedFields.value = editedFields.value.filter((f) => f.name !== fieldName);
  }

  /**
   * 更新字段。
   *
   * @param fieldName 字段名
   * @param updates 待更新的属性
   */
  function updateField(
    fieldName: string,
    updates: Partial<FieldSuggestion>,
  ): void {
    editedFields.value = editedFields.value.map((f) => {
      if (f.name !== fieldName) {
        return f;
      }
      return { ...f, ...updates };
    });
  }

  /**
   * 上移字段。
   *
   * @param fieldName 字段名
   */
  function moveFieldUp(fieldName: string): void {
    const sorted = [...editedFields.value].sort((a, b) => a.sort - b.sort);
    const idx = sorted.findIndex((f) => f.name === fieldName);
    if (idx <= 0) {
      return;
    }
    const temp = sorted[idx].sort;
    sorted[idx] = { ...sorted[idx], sort: sorted[idx - 1].sort };
    sorted[idx - 1] = { ...sorted[idx - 1], sort: temp };
    editedFields.value = sorted;
  }

  /**
   * 下移字段。
   *
   * @param fieldName 字段名
   */
  function moveFieldDown(fieldName: string): void {
    const sorted = [...editedFields.value].sort((a, b) => a.sort - b.sort);
    const idx = sorted.findIndex((f) => f.name === fieldName);
    if (idx < 0 || idx >= sorted.length - 1) {
      return;
    }
    const temp = sorted[idx].sort;
    sorted[idx] = { ...sorted[idx], sort: sorted[idx + 1].sort };
    sorted[idx + 1] = { ...sorted[idx + 1], sort: temp };
    editedFields.value = sorted.sort((a, b) => a.sort - b.sort);
  }

  /**
   * 重置所有状态。
   */
  function reset(): void {
    description.value = initialDescription;
    generatedPage.value = null;
    editedFields.value = [];
    error.value = null;
    isGenerating.value = false;
  }

  return {
    // 输入态
    description,
    isGenerating,
    error,
    generationOptions,

    // 输出态
    generatedPage,
    fields,
    confidence,
    hasGenerated,

    // 操作
    generate,
    addField,
    removeField,
    updateField,
    moveFieldUp,
    moveFieldDown,
    reset,
  };
}
