<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { ref } from 'vue';
import {
  ContextMenuArrow,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuItemIndicator,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '../';

const checkboxOne = ref(false);
const checkboxTwo = ref(false);
const person = ref('pedro');

function handleClick() {
  alert('hello!');
}
</script>

<template>
  <ContextMenuRoot :modal="true">
    <ContextMenuTrigger
      class="block w-[300px] select-none rounded border-2 border-dashed border-white py-[45px] text-center text-[15px] text-white"
    >
      Right click here.
    </ContextMenuTrigger>

    <ContextMenuPortal>
      <ContextMenuContent
        class="data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade min-w-[220px] rounded-md bg-white p-[5px] shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform]"
        :side-offset="5"
      >
        <ContextMenuItem
          value="New Tab"
          class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 group relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
          @click="handleClick"
        >
          New Tab
          <div
            class="text-mauve11 group-data-[disabled]:text-mauve8 ml-auto pl-[20px] group-data-[highlighted]:text-white"
          >
            ⌘+T
          </div>
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger
            value="more toolsz"
            class="text-violet11 data-[state=open]:bg-violet4 data-[state=open]:text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 data-[highlighted]:data-[state=open]:bg-violet9 data-[highlighted]:data-[state=open]:text-violet1 group relative flex h-[25px] w-full select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
          >
            More Tools
            <div
              class="text-mauve11 group-data-[disabled]:text-mauve8 ml-auto pl-[20px] group-data-[highlighted]:text-white"
            >
              <Icon icon="radix-icons:chevron-right" />
            </div>
          </ContextMenuSubTrigger>
          <ContextMenuPortal>
            <ContextMenuSubContent
              class="data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade min-w-[220px] rounded-md bg-white p-[5px] shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform]"
              :side-offset="2"
              :align-offset="-5"
            >
              <ContextMenuItem
                class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 group relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
              >
                Save Page As…
                <div
                  class="text-mauve11 group-data-[disabled]:text-mauve8 ml-auto pl-[20px] group-data-[highlighted]:text-white"
                >
                  ⌘+S
                </div>
              </ContextMenuItem>
              <ContextMenuItem
                class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
              >
                Create Shortcut…
              </ContextMenuItem>
              <ContextMenuItem
                class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
              >
                Name Window…
              </ContextMenuItem>
              <ContextMenuSeparator class="bg-violet6 m-[5px] h-[1px]" />
              <ContextMenuItem
                class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
              >
                Developer Tools
              </ContextMenuItem>

              <ContextMenuArrow class="fill-white" />
            </ContextMenuSubContent>
          </ContextMenuPortal>
        </ContextMenuSub>
        <ContextMenuItem
          value="New Window"
          class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 group relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
        >
          New Window
          <div
            class="text-mauve11 group-data-[disabled]:text-mauve8 ml-auto pl-[20px] group-data-[highlighted]:text-white"
          >
            ⌘+N
          </div>
        </ContextMenuItem>
        <ContextMenuItem
          value="New Private Window"
          class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 group relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
          disabled
        >
          New Private Window
          <div
            class="text-mauve11 group-data-[disabled]:text-mauve8 ml-auto pl-[20px] group-data-[highlighted]:text-white"
          >
            ⇧+⌘+N
          </div>
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger
            value="more tools"
            class="text-violet11 data-[state=open]:bg-violet4 data-[state=open]:text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 data-[highlighted]:data-[state=open]:bg-violet9 data-[highlighted]:data-[state=open]:text-violet1 group relative flex h-[25px] w-full select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
          >
            More Tools
            <div
              class="text-mauve11 group-data-[disabled]:text-mauve8 ml-auto pl-[20px] group-data-[highlighted]:text-white"
            >
              <Icon icon="radix-icons:chevron-right" />
            </div>
          </ContextMenuSubTrigger>
          <ContextMenuPortal>
            <ContextMenuSubContent
              class="data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade min-w-[220px] rounded-md bg-white p-[5px] shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform]"
              :side-offset="2"
              :align-offset="-5"
            >
              <ContextMenuItem
                class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 group relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
              >
                Save Page As…
                <div
                  class="text-mauve11 group-data-[disabled]:text-mauve8 ml-auto pl-[20px] group-data-[highlighted]:text-white"
                >
                  ⌘+S
                </div>
              </ContextMenuItem>
              <ContextMenuItem
                class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
              >
                Create Shortcut…
              </ContextMenuItem>
              <ContextMenuItem
                class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
              >
                Name Window…
              </ContextMenuItem>
              <ContextMenuSeparator class="bg-violet6 m-[5px] h-[1px]" />
              <ContextMenuItem
                class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
              >
                Developer Tools
              </ContextMenuItem>
              <ContextMenuSub>
                <ContextMenuSubTrigger
                  value="more toolsz"
                  class="text-violet11 data-[state=open]:bg-violet4 data-[state=open]:text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 data-[highlighted]:data-[state=open]:bg-violet9 data-[highlighted]:data-[state=open]:text-violet1 group relative flex h-[25px] w-full select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
                >
                  More Tools
                  <div
                    class="text-mauve11 group-data-[disabled]:text-mauve8 ml-auto pl-[20px] group-data-[highlighted]:text-white"
                  >
                    <Icon icon="radix-icons:chevron-right" />
                  </div>
                </ContextMenuSubTrigger>
                <ContextMenuPortal>
                  <ContextMenuSubContent
                    class="data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade min-w-[220px] rounded-md bg-white p-[5px] shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform]"
                    :side-offset="2"
                    :align-offset="-5"
                  >
                    <ContextMenuItem
                      class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 group relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
                    >
                      Save Page As…
                      <div
                        class="text-mauve11 group-data-[disabled]:text-mauve8 ml-auto pl-[20px] group-data-[highlighted]:text-white"
                      >
                        ⌘+S
                      </div>
                    </ContextMenuItem>
                    <ContextMenuItem
                      class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
                    >
                      Create Shortcut…
                    </ContextMenuItem>
                    <ContextMenuItem
                      class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
                    >
                      Name Window…
                    </ContextMenuItem>
                    <ContextMenuSeparator class="bg-violet6 m-[5px] h-[1px]" />
                    <ContextMenuItem
                      class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
                    >
                      Developer Tools
                    </ContextMenuItem>
                    <ContextMenuSub>
                      <ContextMenuSubTrigger
                        value="more toolsz"
                        class="text-violet11 data-[state=open]:bg-violet4 data-[state=open]:text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 data-[highlighted]:data-[state=open]:bg-violet9 data-[highlighted]:data-[state=open]:text-violet1 group relative flex h-[25px] w-full select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
                      >
                        More Tools
                        <div
                          class="text-mauve11 group-data-[disabled]:text-mauve8 ml-auto pl-[20px] group-data-[highlighted]:text-white"
                        >
                          <Icon icon="radix-icons:chevron-right" />
                        </div>
                      </ContextMenuSubTrigger>
                      <ContextMenuPortal>
                        <ContextMenuSubContent
                          class="data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade min-w-[220px] rounded-md bg-white p-[5px] shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform]"
                          :side-offset="2"
                          :align-offset="-5"
                        >
                          <ContextMenuItem
                            class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 group relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
                          >
                            Save Page As…
                            <div
                              class="text-mauve11 group-data-[disabled]:text-mauve8 ml-auto pl-[20px] group-data-[highlighted]:text-white"
                            >
                              ⌘+S
                            </div>
                          </ContextMenuItem>
                          <ContextMenuItem
                            class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
                          >
                            Create Shortcut…
                          </ContextMenuItem>
                          <ContextMenuItem
                            class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
                          >
                            Name Window…
                          </ContextMenuItem>
                          <ContextMenuSeparator class="bg-violet6 m-[5px] h-[1px]" />
                          <ContextMenuItem
                            class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
                          >
                            Developer Tools
                          </ContextMenuItem>
                        </ContextMenuSubContent>
                      </ContextMenuPortal>
                    </ContextMenuSub>
                  </ContextMenuSubContent>
                </ContextMenuPortal>
              </ContextMenuSub>
              <ContextMenuItem
                class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
              >
                Developer Tools
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuPortal>
        </ContextMenuSub>
        <ContextMenuSeparator class="bg-violet6 m-[5px] h-[1px]" />
        <ContextMenuCheckboxItem
          v-model:checked="checkboxOne"
          class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 group relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
          @select.prevent
        >
          <ContextMenuItemIndicator
            class="absolute left-0 inline-flex w-[25px] items-center justify-center"
          >
            <Icon icon="radix-icons:check" />
          </ContextMenuItemIndicator>
          Show Bookmarks
          <div
            class="text-mauve11 group-data-[disabled]:text-mauve8 ml-auto pl-[20px] group-data-[highlighted]:text-white"
          >
            ⌘+B
          </div>
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem
          v-model:checked="checkboxTwo"
          class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
          @select.prevent
        >
          <ContextMenuItemIndicator
            class="absolute left-0 inline-flex w-[25px] items-center justify-center"
          >
            <Icon icon="radix-icons:check" />
          </ContextMenuItemIndicator>
          Show Full URLs
        </ContextMenuCheckboxItem>
        <ContextMenuSeparator class="bg-violet6 m-[5px] h-[1px]" />

        <ContextMenuLabel class="text-mauve11 pl-[25px] text-xs leading-[25px]">
          People
        </ContextMenuLabel>
        <ContextMenuRadioGroup v-model="person">
          <ContextMenuRadioItem
            class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
            value="pedro"
          >
            <ContextMenuItemIndicator
              class="absolute left-0 inline-flex w-[25px] items-center justify-center"
            >
              <Icon icon="radix-icons:dot-filled" />
            </ContextMenuItemIndicator>
            Pedro Duarte
          </ContextMenuRadioItem>
          <ContextMenuRadioItem
            class="text-violet11 data-[disabled]:text-mauve8 data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1 relative flex h-[25px] select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none outline-none data-[disabled]:pointer-events-none"
            value="colm"
          >
            <ContextMenuItemIndicator
              class="absolute left-0 inline-flex w-[25px] items-center justify-center"
            >
              <Icon icon="radix-icons:dot-filled" />
            </ContextMenuItemIndicator>
            Colm Tuite
          </ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>
