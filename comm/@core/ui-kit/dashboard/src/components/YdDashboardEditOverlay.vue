<!--
 * YdDashboardEditOverlay — 仪表盘编辑模式下的卡片悬浮操作层。
 *
 * <p>仅在编辑态（config.isEditable = true）时显示，提供删除操作入口。
 *
 * @path comm\@core\ui-kit\dashboard\src\components\YdDashboardEditOverlay.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
defineProps<{
  cardId: string;
}>();

const emit = defineEmits<{
  remove: [id: string];
}>();
</script>

<template>
  <div class="absolute inset-0 z-10 flex items-start justify-end rounded-lg p-1 opacity-0 transition-opacity hover:opacity-100">
    <div class="rounded-md border bg-background/90 backdrop-blur-sm p-0.5 shadow-sm">
      <button
        type="button"
        class="rounded p-1 text-destructive hover:bg-destructive/10"
        aria-label="删除卡片"
        @click.stop="emit('remove', cardId)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  </div>
</template>
