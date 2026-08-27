<!--
 * 流程设计器工具栏
 *
 * <p>顶部工具栏，提供保存、撤销、重做、缩放等操作。
 *
 * @path apps\workflow-web\src\views\designer\components\DesignerToolbar.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 流程设计器工具栏
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { ElButton, ElIcon, ElSpace, ElTooltip } from 'element-plus';

interface Props {
  /** 加载状态 */
  loading: boolean;
  /** 保存状态 */
  saving: boolean;
  /** 锁定状态 */
  locked: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  save: [];
}>();
</script>

<template>
  <div class="designer-toolbar">
    <div class="toolbar-left">
      <span class="toolbar-title">流程设计器</span>
    </div>
    <div class="toolbar-right">
      <ElSpace>
        <ElTooltip content="保存 Ctrl+S" placement="bottom">
          <ElButton
            type="primary"
            :loading="saving"
            :disabled="locked || loading"
            @click="emit('save')"
          >
            <ElIcon><span class="icon-save" /></ElIcon>
            保存
          </ElButton>
        </ElTooltip>
      </ElSpace>
    </div>
  </div>
</template>

<style scoped>
.designer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.toolbar-right {
  display: flex;
  align-items: center;
}
</style>
