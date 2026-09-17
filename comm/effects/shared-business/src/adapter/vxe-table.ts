/**
 * vxe-table 适配器模块（公共包）
 *
 * 由各子应用 @ydsz/shared-business 统一复用，消除 9 份重复代码。
 * 子应用如需扩展自定义 renderer，可在此文件内补充，或复制为应用级 adapter。
 *
 * 使用原生 img/button 标签替代 EP ElImage / ElButton，零 element-plus 依赖。
 *
 * @path comm/effects/shared-business/src/adapter/vxe-table.ts
 * @author ydsz-team
 * @since 1.1.0
 */
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';

import { h } from 'vue';

import { setupYDSZVxeTable, useYDSZVxeGrid } from '@ydsz/plugins/vxe-table';

import { useYDSZForm } from './form';

setupYDSZVxeTable({
  configVxeTable: (vxeUI) => {
    vxeUI.setConfig({
      grid: {
        align: 'center',
        border: false,
        columnConfig: {
          resizable: true,
        },
        minHeight: 180,
        formConfig: {
          // 全局禁用vxe-table的表单配置，使用formOptions
          enabled: false,
        },
        proxyConfig: {
          autoLoad: true,
          response: {
            result: 'items',
            total: 'total',
            list: 'items',
          },
          showActiveMsg: true,
          showResponseMsg: false,
        },
        round: true,
        showOverflow: true,
        size: 'small',
      } as VxeTableGridOptions,
    });

    // 表格配置项可以用 cellRender: { name: 'CellImage' },
    vxeUI.renderer.add('CellImage', {
      renderTableDefault(_renderOpts, params) {
        const { column, row } = params;
        const src = row[column.field];
        return h('img', {
          src,
          alt: '',
          style: {
            maxWidth: '60px',
            maxHeight: '40px',
            objectFit: 'cover',
            borderRadius: '4px',
            cursor: 'pointer',
          },
          onClick: () => {
            // 简易 preview：在新窗口打开
            if (src) window.open(src, '_blank');
          },
        });
      },
    });

    // 表格配置项可以用 cellRender: { name: 'CellLink' },
    // 使用原生 button（link 样式）替代 EP ElButton
    vxeUI.renderer.add('CellLink', {
      renderTableDefault(renderOpts) {
        const { props } = renderOpts;
        return h(
          'button',
          {
            type: 'button',
            style: {
              background: 'transparent',
              border: 'none',
              color: 'hsl(var(--brand-500, #3b82f6))',
              cursor: 'pointer',
              fontSize: 'inherit',
              padding: 0,
            },
            onClick: () => {
              if (props?.handler && typeof props.handler === 'function') {
                props.handler(props?.row);
              } else if (props?.url) {
                window.open(props.url, '_blank');
              }
            },
          },
          props?.text ?? '',
        );
      },
    });

    // 这里可以自行扩展 vxe-table 的全局配置，比如自定义格式化
    // vxeUI.formats.add
  },
  useYDSZForm,
});

export { useYDSZVxeGrid };

export type * from '@ydsz/plugins/vxe-table';
