/**
 * vxe-table 适配器 —— generator-web 表格配置。
 *
 * @path apps/generator-web/src/adapter/vxe-table.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { VxeTableGridOptions } from '@ydsz/plugins/vxe-table';

import { h } from 'vue';

import { setupYDSZVxeTable, useYDSZVxeGrid } from '@ydsz/plugins/vxe-table';

import { Button } from '@ydsz-core/ui-kit/shadcn-ui';
// TODO: ElImage 暂无 shadcn-ui 等效组件，保留 element-plus 导入
import { ElImage } from 'element-plus';

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

    vxeUI.renderer.add('CellImage', {
      renderTableDefault(_renderOpts, params) {
        const { column, row } = params;
        const src = row[column.field];
        return h(ElImage, { src, previewSrcList: [src] });
      },
    });

    vxeUI.renderer.add('CellLink', {
      renderTableDefault(renderOpts) {
        const { props } = renderOpts;
        return h(
          Button,
          { size: 'sm', variant: 'link' },
          { default: () => props?.text },
        );
      },
    });
  },
  useYDSZForm,
});

export { useYDSZVxeGrid };

export type * from '@ydsz/plugins/vxe-table';
