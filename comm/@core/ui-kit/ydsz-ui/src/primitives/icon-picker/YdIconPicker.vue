<script lang="ts" setup>
import { computed, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  Bell,
  Bookmark,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  CreditCard,
  Database,
  Eye,
  File,
  Filter,
  Flag,
  Folder,
  Globe,
  Heart,
  Home,
  Image,
  Layers,
  Link,
  Lock,
  type LucideIcon,
  Mail,
  MapPin,
  Search,
  Settings,
  Shield,
  ShoppingCart,
  Star,
  Tag,
  Trash2,
  Users,
  Zap,
  X,
} from 'lucide-vue-next';

interface Props {
  class?: any;
  disabled?: boolean;
  modelValue?: string;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  placeholder: '选择图标',
});

const emit = defineEmits<{
  'update:modelValue': [val: string];
}>();

const isOpen = ref(false);
const query = ref('');

/** 内置图标库 */
const iconRegistry: Array<{ Icon: LucideIcon; name: string }> = [
  { Icon: Home, name: 'home' },
  { Icon: Search, name: 'search' },
  { Icon: Settings, name: 'settings' },
  { Icon: Bell, name: 'bell' },
  { Icon: Mail, name: 'mail' },
  { Icon: Calendar, name: 'calendar' },
  { Icon: Clock, name: 'clock' },
  { Icon: Users, name: 'users' },
  { Icon: Star, name: 'star' },
  { Icon: Heart, name: 'heart' },
  { Icon: Bookmark, name: 'bookmark' },
  { Icon: Archive, name: 'archive' },
  { Icon: Flag, name: 'flag' },
  { Icon: Tag, name: 'tag' },
  { Icon: Folder, name: 'folder' },
  { Icon: File, name: 'file' },
  { Icon: Image, name: 'image' },
  { Icon: Link, name: 'link' },
  { Icon: Copy, name: 'copy' },
  { Icon: Filter, name: 'filter' },
  { Icon: Trash2, name: 'trash' },
  { Icon: Shield, name: 'shield' },
  { Icon: Lock, name: 'lock' },
  { Icon: Eye, name: 'eye' },
  { Icon: Globe, name: 'globe' },
  { Icon: MapPin, name: 'mapPin' },
  { Icon: CreditCard, name: 'creditCard' },
  { Icon: ShoppingCart, name: 'shoppingCart' },
  { Icon: Database, name: 'database' },
  { Icon: Zap, name: 'zap' },
  { Icon: Layers, name: 'layers' },
  { Icon: CheckCircle2, name: 'checkCircle' },
  { Icon: X, name: 'x' },
  { Icon: AlertTriangle, name: 'alertTriangle' },
  { Icon: ArrowRight, name: 'arrowRight' },
];

const filteredIcons = computed(() => {
  if (!query.value) return iconRegistry;
  const q = query.value.toLowerCase();
  return iconRegistry.filter((i) => i.name.toLowerCase().includes(q));
});

const selectedIconObj = computed(() =>
  iconRegistry.find((i) => i.name === props.modelValue),
);

function select(name: string): void {
  emit('update:modelValue', name);
  isOpen = false;
}
</script>

<template>
  <div :class="cn('relative inline-block', props.class)">
    <!-- 触发器 -->
    <button
      :aria-label="'图标选择器'"
      :class="
        cn(
          'flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-background px-3 text-sm transition-colors hover:border-muted-foreground/50',
        )
      "
      :disabled="props.disabled"
      type="button"
      @click="isOpen = !isOpen"
    >
      <span class="flex items-center gap-2">
        <component :is="selectedIconObj?.Icon" v-if="selectedIconObj" class="size-4" />
        <span :class="cn(!props.modelValue && 'text-muted-foreground')">
          {{ selectedIconObj?.name ?? props.placeholder }}
        </span>
      </span>
      <ChevronDown :class="cn('size-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')" />
    </button>

    <!-- 下拉面板 -->
    <div
      v-if="isOpen"
      class="bg-background absolute left-0 top-full z-50 mt-1 flex h-64 w-72 flex-col rounded-lg border shadow-xl"
    >
      <div class="border-b p-2">
        <div class="relative">
          <Search class="text-muted-foreground absolute left-2 top-1/2 size-3.5 -translate-y-1/2" />
          <input
            v-model="query"
            :aria-label="'搜索图标'"
            class="w-full rounded border bg-transparent py-1 pl-7 pr-2 text-sm outline-none focus:border-primary"
            placeholder="搜索图标..."
            type="text"
          />
        </div>
      </div>
      <div class="grid grid-cols-6 gap-1 overflow-y-auto p-2">
        <button
          v-for="item in filteredIcons"
          :key="item.name"
          :aria-label="item.name"
          :class="cn(
            'flex size-9 items-center justify-center rounded-md transition-colors hover:bg-muted',
            modelValue === item.name && 'bg-primary/10 ring-1 ring-primary',
          )"
          type="button"
          @click="select(item.name)"
        >
          <component :is="item.Icon" class="size-4" />
        </button>
      </div>
    </div>
  </div>
</template>
