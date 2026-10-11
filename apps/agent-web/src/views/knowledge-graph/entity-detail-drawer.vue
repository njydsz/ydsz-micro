<!--
 * 实体详情抽屉
 *
 * 右侧抽屉展示实体基本信息、子图可视化和关系列表。
 * 消费 querySubgraph 和 queryRelations API。
 *
 * @path apps/agent-web/src/views/knowledge-graph/entity-detail-drawer.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 实体详情抽屉组件
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { YdAlert, YdButton, YdDescriptions, YdDescriptionsItem, YdDrawer, YdEmptyState, YdTable, YdTableColumn, YdTag } from '@ydsz-core/ydsz-ui';
import { useI18n } from '@ydsz/common-ui';
import { computed, ref, watch } from 'vue';

import { Info, Link, RefreshCw } from 'lucide-vue-next';
import { querySubgraph, queryRelations } from '#/api/knowledgeGraph';

const props = defineProps<{
  /** v-model 控制抽屉显示 */
  modelValue: boolean;
  /** 当前查看的实体 ID */
  entityId: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const { t } = useI18n();

// 内部可见性双向绑定
const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
});

// 子图数据
const subgraphLoading = ref<boolean>(false);
const subgraphData = ref<unknown>(null);
const subgraphError = ref<string>('');
const subgraphDepth = ref<number>(2);

// 关系数据
const relationsLoading = ref<boolean>(false);
const relationsData = ref<Record<string, unknown>[]>([]);
const relationsError = ref<string>('');

// 类型化收窄：subgraph 响应结构
interface SubgraphNode {
  entityId?: string;
  name?: string;
  type?: string | null;
  description?: string | null;
}

interface SubgraphRelation {
  relationId?: string;
  sourceEntity?: string;
  targetEntity?: string;
  relationType?: string;
  weight?: number;
  properties?: Record<string, unknown> | null;
}

interface SubgraphResponse {
  center?: SubgraphNode;
  nodes?: SubgraphNode[];
  relations?: SubgraphRelation[];
}

/**
 * 类型守卫：判断 unknown 是否为 SubgraphResponse
 */
function isSubgraphResponse(data: unknown): data is SubgraphResponse {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return 'nodes' in d || 'relations' in d || 'center' in d;
}

// 从 subgraph 响应中提取节点列表
const subgraphNodes = computed<SubgraphNode[]>(() => {
  if (!subgraphData.value) return [];
  if (!isSubgraphResponse(subgraphData.value)) return [];
  const nodes = subgraphData.value.nodes;
  return Array.isArray(nodes) ? nodes : [];
});

// 从 subgraph 响应中提取关系列表
const subgraphRelations = computed<SubgraphRelation[]>(() => {
  if (!subgraphData.value) return [];
  if (!isSubgraphResponse(subgraphData.value)) return [];
  const rels = subgraphData.value.relations;
  return Array.isArray(rels) ? rels : [];
});

// 中心节点信息
const centerNode = computed<SubgraphNode | null>(() => {
  if (!subgraphData.value) return null;
  if (!isSubgraphResponse(subgraphData.value)) return null;
  return subgraphData.value.center ?? null;
});

/**
 * 加载子图数据
 */
async function loadSubgraph(): Promise<void> {
  if (!props.entityId) return;
  subgraphLoading.value = true;
  subgraphError.value = '';
  try {
    const data = await querySubgraph({ entityId: props.entityId }, { depth: subgraphDepth.value });
    subgraphData.value = data ?? null;
  } catch {
    subgraphError.value = t('knowledgeGraph.detail.subgraphFailed') || '加载子图失败';
    subgraphData.value = null;
  } finally {
    subgraphLoading.value = false;
  }
}

/**
 * 加载关系列表
 */
async function loadRelations(): Promise<void> {
  if (!props.entityId) return;
  relationsLoading.value = true;
  relationsError.value = '';
  try {
    const data = await queryRelations({ entityId: props.entityId });
    relationsData.value = (data ?? []) as Record<string, unknown>[];
  } catch {
    relationsError.value = t('knowledgeGraph.detail.relationsFailed') || '加载关系列表失败';
    relationsData.value = [];
  } finally {
    relationsLoading.value = false;
  }
}

/**
 * 监听 entityId 变化，加载数据
 */
watch(
  () => props.entityId,
  (newId) => {
    if (newId && visible.value) {
      void loadSubgraph();
      void loadRelations();
    }
  },
  { immediate: true },
);

/**
 * 监听抽屉打开
 */
watch(visible, (val) => {
  if (val && props.entityId) {
    void loadSubgraph();
    void loadRelations();
  }
});
</script>

<template>
  <YdDrawer
    v-model="visible"
    :title="$t('knowledgeGraph.detail.title') || '实体详情'"
    size="50%"
  >
    <div class="space-y-6">
      <!-- 实体基本信息 -->
      <div>
        <h3 class="mb-3 flex items-center gap-2 text-base font-medium text-text-primary">
          <Info :size="16" class="text-brand-500" />
          {{ $t('knowledgeGraph.detail.basicInfo') || '基本信息' }}
        </h3>
        <YdDescriptions
          :column="2"
          border
          size="sm"
        >
          <YdDescriptionsItem :label="$t('knowledgeGraph.detail.entityId') || 'EntityID'">
            {{ entityId }}
          </YdDescriptionsItem>
          <YdDescriptionsItem :label="$t('knowledgeGraph.detail.name') || '名称'">
            {{ centerNode?.name || subgraphNodes[0]?.name || '-' }}
          </YdDescriptionsItem>
          <YdDescriptionsItem :label="$t('knowledgeGraph.detail.type') || '类型'">
            <YdTag
              v-if="centerNode?.type || subgraphNodes[0]?.type"
              size="sm"
              variant="primary"
            >
              {{ centerNode?.type || subgraphNodes[0]?.type }}
            </YdTag>
            <span v-else>-</span>
          </YdDescriptionsItem>
          <YdDescriptionsItem :label="$t('knowledgeGraph.detail.description') || '描述'">
            {{ centerNode?.description || subgraphNodes[0]?.description || '-' }}
          </YdDescriptionsItem>
        </YdDescriptions>
      </div>

      <!-- 子图可视化 -->
      <div>
        <h3 class="mb-3 flex items-center justify-between">
          <span class="flex items-center gap-2 text-base font-medium text-text-primary">
            <Link :size="16" class="text-brand-500" />
            {{ $t('knowledgeGraph.detail.subgraph') || '子图结构' }}
          </span>
          <YdButton
            size="sm"
            variant="ghost"
            :loading="subgraphLoading"
            @click="loadSubgraph"
          >
            <RefreshCw v-if="!subgraphLoading" :size="14" />
            {{ $t('common.refresh') || '刷新' }}
          </YdButton>
        </h3>

        <!-- 加载态 -->
        <div
          v-if="subgraphLoading"
          class="flex h-32 items-center justify-center"
        >
          <RefreshCw class="animate-spin text-brand-500" :size="16" />
          <span class="ml-2 text-sm text-text-secondary">
            {{ $t('common.loading') || '加载中...' }}
          </span>
        </div>

        <!-- 错误态 -->
        <YdAlert
          v-else-if="subgraphError"
          :title="subgraphError"
          type="error"
          :closable="false"
        />

        <!-- 空态 -->
        <YdEmptyState
          v-else-if="subgraphNodes.length === 0"
          :description="$t('knowledgeGraph.detail.emptySubgraph') || '暂无子图数据'"
        />

        <!-- 子图内容 -->
        <div
          v-else
          class="space-y-4"
        >
          <!-- 节点统计 -->
          <div class="flex gap-5 text-sm">
            <span class="rounded-md bg-primary/10 px-2 py-1 text-primary">
              {{ $t('knowledgeGraph.detail.nodeCount') || '节点数' }}: {{ subgraphNodes.length }}
            </span>
            <span class="rounded-md bg-purple/10 px-2 py-1 text-purple">
              {{ $t('knowledgeGraph.detail.relationCount') || '关系数' }}: {{ subgraphRelations.length }}
            </span>
          </div>

          <!-- 节点列表 -->
          <YdTable
            :data="subgraphNodes"
            size="sm"
            border
            stripe
          >
            <YdTableColumn
              prop="entityId"
              :label="$t('knowledgeGraph.detail.nodeId') || '节点ID'"
              width="180"
              show-overflow-tooltip
            />
            <YdTableColumn
              prop="name"
              :label="$t('knowledgeGraph.detail.nodeName') || '节点名称'"
              min-width="140"
              show-overflow-tooltip
            />
            <YdTableColumn
              prop="type"
              :label="$t('knowledgeGraph.detail.nodeType') || '节点类型'"
              width="120"
            >
              <template #default="{ row }">
                <YdTag
                  v-if="row.type"
                  size="sm"
                  variant="info"
                >
                  {{ row.type }}
                </YdTag>
                <span v-else>-</span>
              </template>
            </YdTableColumn>
          </YdTable>

          <!-- 关系边列表 -->
          <div v-if="subgraphRelations.length > 0">
            <h4 class="mb-2 text-sm font-medium text-text-secondary">
              {{ $t('knowledgeGraph.detail.edges') || '关系边' }}
            </h4>
            <YdTable
              :data="subgraphRelations"
              size="sm"
              border
              stripe
            >
              <YdTableColumn
                prop="relationType"
                :label="$t('knowledgeGraph.detail.relationType') || '关系类型'"
                width="140"
              >
                <template #default="{ row }">
                  <YdTag
                    v-if="row.relationType"
                    size="sm"
                    variant="primary"
                  >
                    {{ row.relationType }}
                  </YdTag>
                  <span v-else>-</span>
                </template>
              </YdTableColumn>
              <YdTableColumn
                prop="sourceEntity"
                :label="$t('knowledgeGraph.detail.sourceEntity') || '源实体'"
                width="160"
                show-overflow-tooltip
              />
              <YdTableColumn
                prop="targetEntity"
                :label="$t('knowledgeGraph.detail.targetEntity') || '目标实体'"
                width="160"
                show-overflow-tooltip
              />
              <YdTableColumn
                prop="weight"
                :label="$t('knowledgeGraph.detail.weight') || '权重'"
                width="100"
              />
            </YdTable>
          </div>
        </div>
      </div>

      <!-- 关系列表 -->
      <div>
        <h3 class="mb-3 flex items-center justify-between">
          <span class="flex items-center gap-2 text-base font-medium text-text-primary">
            <Link :size="16" class="text-brand-500" />
            {{ $t('knowledgeGraph.detail.allRelations') || '关联关系' }}
          </span>
          <YdButton
            size="sm"
            variant="ghost"
            :loading="relationsLoading"
            @click="loadRelations"
          >
            <RefreshCw v-if="!relationsLoading" :size="14" />
            {{ $t('common.refresh') || '刷新' }}
          </YdButton>
        </h3>

        <!-- 加载态 -->
        <div
          v-if="relationsLoading"
          class="flex h-32 items-center justify-center"
        >
          <RefreshCw class="animate-spin text-brand-500" :size="16" />
          <span class="ml-2 text-sm text-text-secondary">
            {{ $t('common.loading') || '加载中...' }}
          </span>
        </div>

        <!-- 错误态 -->
        <YdAlert
          v-else-if="relationsError"
          :title="relationsError"
          type="error"
          :closable="false"
        />

        <!-- 空态 -->
        <YdEmptyState
          v-else-if="relationsData.length === 0"
          :description="$t('knowledgeGraph.detail.emptyRelations') || '暂无关联关系'"
        />

        <!-- 关系数据表 -->
        <YdTable
          v-else
          :data="relationsData"
          size="sm"
          border
          stripe
        >
          <YdTableColumn
            prop="relationType"
            :label="$t('knowledgeGraph.detail.relationType') || '关系类型'"
            width="140"
          >
            <template #default="{ row }">
              <YdTag
                v-if="row.relationType"
                size="sm"
                variant="primary"
              >
                {{ row.relationType }}
              </YdTag>
              <span v-else>-</span>
            </template>
          </YdTableColumn>
          <YdTableColumn
            prop="sourceEntity"
            :label="$t('knowledgeGraph.detail.sourceEntity') || '源实体'"
            width="160"
            show-overflow-tooltip
          />
          <YdTableColumn
            prop="targetEntity"
            :label="$t('knowledgeGraph.detail.targetEntity') || '目标实体'"
            width="160"
            show-overflow-tooltip
          />
          <YdTableColumn
            prop="weight"
            :label="$t('knowledgeGraph.detail.weight') || '权重'"
            width="100"
          />
        </YdTable>
      </div>
    </div>
  </YdDrawer>
</template>
