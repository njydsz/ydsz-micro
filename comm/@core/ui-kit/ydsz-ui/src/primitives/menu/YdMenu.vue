<!--
 * 导航菜单 —— 便利性封装（Convenience Wrapper）。
 *
 * 侧边栏 / 顶栏导航的配置式菜单封装，对齐 Ant Design Menu / Element Plus ElMenu。
 * 支持嵌套子菜单、分组、禁用、图标等。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\menu\YdMenu.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
/**
 * 导航菜单便利性封装。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@ydsz-core/ydsz-vue';

/** 菜单项配置 */
export interface MenuItemOption {
  /** 唯一标识 */
  key: string;
  /** 显示文本 */
  label: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 类型：item（默认）/ group（分组标题）/ divider（分隔线）/ sub（子菜单） */
  type?: 'item' | 'group' | 'divider' | 'sub';
  /** 子菜单项 */
  children?: MenuItemOption[];
  /** 自定义点击回调 */
  onClick?: () => void;
}

const props = withDefaults(defineProps<{
  /** 菜单项列表 */
  items: MenuItemOption[];
  /** 当前选中项 */
  modelValue?: string;
  /** 展开模式：horizontal / vertical */
  mode?: 'horizontal' | 'vertical';
}>(), {
  mode: 'vertical',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'select', key: string): void;
}>();

function handleSelect(item: MenuItemOption): void {
  if (item.disabled || item.type === 'divider' || item.type === 'group') return;
  emit('update:modelValue', item.key);
  emit('select', item.key);
  item.onClick?.();
}
</script>

<template>
  <!--
    导航菜单便利性封装 —— 配置式 options 用法。

    用法：
    ```html
    <YdMenu
      v-model="activeKey"
      :items="[
        { key: 'dashboard', label: '仪表盘' },
        { key: 'settings', label: '系统设置', type: 'group' },
        { key: 'users', label: '用户管理', type: 'sub', children: [
          { key: 'users-list', label: '用户列表' },
          { key: 'users-roles', label: '角色管理' },
        ]},
        { key: 'divider-1', label: '', type: 'divider' },
        { key: 'logs', label: '操作日志' },
      ]"
      mode="vertical"
    />
    ```
  -->
  <DropdownMenu>
    <DropdownMenuContent
      :class="[
        'min-w-[180px]',
        mode === 'horizontal' ? 'flex-row' : 'flex-col',
      ]"
    >
      <template
        v-for="item in items"
        :key="item.key"
      >
        <!-- 分组标题 -->
        <div
          v-if="item.type === 'group'"
          class="px-2 py-1.5 text-xs font-semibold text-muted-foreground"
        >
          {{ item.label }}
        </div>
        <!-- 分隔线 -->
        <DropdownMenuSeparator v-else-if="item.type === 'divider'" />
        <!-- 子菜单 -->
        <DropdownMenuSub v-else-if="item.type === 'sub' && item.children?.length">
          <DropdownMenuSubTrigger :disabled="item.disabled">
            {{ item.label }}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              v-for="sub in item.children"
              :key="sub.key"
              :disabled="sub.disabled"
              @click="handleSelect(sub)"
            >
              {{ sub.label }}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <!-- 普通菜单项 -->
        <DropdownMenuItem
          v-else
          :disabled="item.disabled"
          :class="modelValue === item.key ? 'bg-accent' : ''"
          @click="handleSelect(item)"
        >
          {{ item.label }}
        </DropdownMenuItem>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
