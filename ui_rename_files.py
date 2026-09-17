#!/usr/bin/env python3
"""
批量重命名 .vue/.ts 文件，匹配 Yd 前缀规范，并修复 index.ts 路径引用
"""

import os
import re

BASE = "D:/Code/open/ydsz-micro"

# (子目录绝对路径, 旧文件名, 新文件名)
FILE_RENAMES = [
    # form-ui
    (f"{BASE}/comm/@core/ui-kit/form-ui/src", "use-ydsz-form.ts", "use-Yd-form.ts"),
    (f"{BASE}/comm/@core/ui-kit/form-ui/src", "ydsz-form.vue", "Yd-form.vue"),
    (f"{BASE}/comm/@core/ui-kit/form-ui/src", "ydsz-use-form.vue", "Yd-use-form.vue"),
    # popup-ui
    (f"{BASE}/comm/@core/ui-kit/popup-ui/src/modal", "modal.vue", "YdModal.vue"),
    (f"{BASE}/comm/@core/ui-kit/popup-ui/src/drawer", "drawer.vue", "YdDrawer.vue"),
    (f"{BASE}/comm/@core/ui-kit/popup-ui/src/alert", "alert.vue", "YdAlert.vue"),
    # layout-ui
    (f"{BASE}/comm/@core/ui-kit/layout-ui/src", "ydsz-layout.ts", "YdLayout.ts"),
    (f"{BASE}/comm/@core/ui-kit/layout-ui/src", "ydsz-layout.vue", "YdAdminLayout.vue"),
    # tiptap
    (f"{BASE}/comm/@core/ui-kit/tiptap/src", "YDSZ-tiptap-editor.vue", "YdTipTapEditor.vue"),
    # menu-ui
    (f"{BASE}/comm/@core/ui-kit/menu-ui/src", "menu.vue", "YdMenu.vue"),
    (f"{BASE}/comm/@core/ui-kit/menu-ui/src/components/normal-menu", "normal-menu.vue", "YdNormalMenu.vue"),
    # tabs-ui
    (f"{BASE}/comm/@core/ui-kit/tabs-ui/src", "tabs-view.vue", "YdTabsView.vue"),
]

# index.ts 路径修复: (目录, 旧路径, 新路径)
PATH_FIXES = [
    (f"{BASE}/comm/@core/ui-kit/form-ui/src", "./use-YDSZ-form", "./use-Yd-form"),
    (f"{BASE}/comm/@core/ui-kit/form-ui/src", "./YDSZ-form.vue", "./Yd-form.vue"),
    (f"{BASE}/comm/@core/ui-kit/layout-ui/src", "./YDSZ-layout", "./YdLayout"),
    (f"{BASE}/comm/@core/ui-kit/layout-ui/src", "./YDSZ-layout.vue", "./YdAdminLayout.vue"),
    (f"{BASE}/comm/@core/ui-kit/popup-ui/src/modal", "./modal.vue", "./YdModal.vue"),
    (f"{BASE}/comm/@core/ui-kit/popup-ui/src/drawer", "./drawer.vue", "./YdDrawer.vue"),
    (f"{BASE}/comm/@core/ui-kit/popup-ui/src/alert", "./alert.vue", "./YdAlert.vue"),
    (f"{BASE}/comm/@core/ui-kit/tiptap/src", "./YDSZ-tiptap-editor.vue", "./YdTipTapEditor.vue"),
    (f"{BASE}/comm/@core/ui-kit/menu-ui/src", "./menu.vue", "./YdMenu.vue"),
    (f"{BASE}/comm/@core/ui-kit/menu-ui/src/components/normal-menu", "./normal-menu.vue", "./YdNormalMenu.vue"),
    (f"{BASE}/comm/@core/ui-kit/tabs-ui/src", "./tabs-view.vue", "./YdTabsView.vue"),
]

def main():
    # Step 1: Rename files
    print("=== Step 1: 重命名文件 ===")
    for dirpath, old_name, new_name in FILE_RENAMES:
        old_path = os.path.join(dirpath, old_name)
        new_path = os.path.join(dirpath, new_name)
        if os.path.exists(old_path) and not os.path.exists(new_path):
            os.rename(old_path, new_path)
            print(f"  OK: {os.path.basename(dirpath)}/{old_name} → {new_name}")
        elif os.path.exists(new_path):
            print(f"  SKIP: {os.path.basename(dirpath)}/{new_name} (已存在)")
        else:
            print(f"  MISS: {os.path.basename(dirpath)}/{old_name}")
    
    # Step 2: Fix index.ts paths
    print("\n=== Step 2: 修复 index.ts 路径 ===")
    for dirpath, old_path, new_path in PATH_FIXES:
        index_file = os.path.join(dirpath, 'index.ts')
        if not os.path.exists(index_file):
            continue
        with open(index_file, 'r', encoding='utf-8') as f:
            content = f.read()
        if old_path in content:
            content = content.replace(old_path, new_path)
            with open(index_file, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  FIXED: {os.path.basename(dirpath)}/index.ts: {old_path} → {new_path}")

if __name__ == '__main__':
    main()
    print("\n完成!")
