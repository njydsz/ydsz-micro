#!/usr/bin/env python3
"""
修复 components/*/index.ts 中的 from './xxx.vue' 路径，使其匹配重命名后的文件名
"""

import os
import re

BASE = "D:/Code/open/ydsz-micro/comm/@core/ui-kit/shadcn-ui/src/components"

def fix_index_ts(subdir):
    index_path = os.path.join(BASE, subdir, 'index.ts')
    if not os.path.exists(index_path):
        return False, "no index.ts"
    
    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    def replace_from_path(match):
        prefix = match.group(1)  # "export { default as YdXxx } "
        export_name = match.group(2)  # YdXxx
        path = match.group(3)  # ./xxx.vue
        
        # 期望文件名: YdXxx.vue (PascalCase)
        expected_file = f"{export_name}.vue"
        if path == f"./{expected_file}":
            return match.group(0)  # 已经是正确的
        
        # 检查文件是否存在
        full_path = os.path.join(BASE, subdir, expected_file)
        if os.path.exists(full_path):
            new_path = f"./{expected_file}"
            print(f"    {subdir}: {path} → {new_path}")
            return f"{prefix}{export_name} from '{new_path}'"
        
        return match.group(0)
    
    # 匹配: from './xxx.vue' 或 from "./xxx.vue"
    pattern = r"(export\s*\{\s*default\s+as\s+(\w+)\s*\}\s*from\s*['\"])\.\/([^'\"]+\.vue)(['\"])"
    content = re.sub(pattern, lambda m: replace_from_path(m) if False else (
        # 手动处理
        (lambda export_name, path: (
            m.group(1) + "./" + f"{export_name}.vue" + m.group(4)
            if os.path.exists(os.path.join(BASE, subdir, f"{export_name}.vue")) and path != f"./{export_name}.vue"
            else m.group(0)
        ))(m.group(2), m.group(3))
    ), content)
    
    # 也处理 export type { Xxx } from './yyy.vue'
    pattern2 = r"(export\s+type\s*\{[^}]*\}\s+from\s*['\"])\.\/([^'\"]+\.vue)(['\"])"
    
    if content != original:
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True, "fixed"
    return False, "no change needed"

def main():
    fixed = 0
    for subdir in sorted(os.listdir(BASE)):
        subdir_path = os.path.join(BASE, subdir)
        if not os.path.isdir(subdir_path):
            continue
        
        result, msg = fix_index_ts(subdir)
        if result:
            fixed += 1
            print(f"  FIXED: {subdir}/index.ts")
    
    print(f"\n修复了 {fixed} 个 index.ts 文件")

if __name__ == '__main__':
    main()
