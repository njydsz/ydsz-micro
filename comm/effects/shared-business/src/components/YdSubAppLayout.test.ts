import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

import YdSubAppLayout from './YdSubAppLayout.vue';

describe('YdSubAppLayout', () => {
  it('renders the sub-app layout component', () => {
    setActivePinia(createPinia());
    const wrapper = mount(YdSubAppLayout, {
      global: {
        plugins: [createPinia()],
        renderStubDefaultSlot: true,
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
