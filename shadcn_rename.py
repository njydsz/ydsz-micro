#!/usr/bin/env python3
"""
shadcn-ui 组件 Yd 前缀批量重命名脚本

策略:
1. components/ 业务组件: YDSZ→Yd 前缀, 无前缀的加 Yd 前缀
2. ui/ 原子组件: 保持 shadcn 标准命名不变（避免命名冲突）
"""

import json
import os
import re
import sys

BASE_DIR = "D:/Code/open/ydsz-micro"
MAP_FILE = os.path.join(BASE_DIR, "shadcn-rename-map.json")

# 文件类型扩展名
EXTS = {'.ts', '.tsx', '.vue'}

def load_map():
    with open(MAP_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    # 去掉 _description 等非映射键
    return {k: v for k, v in data.items() if not k.startswith('_')}

def should_process_file(filepath):
    """判断是否需要处理的文件（在 shadcn-ui 目录或引用了这些组件）"""
    if 'node_modules' in filepath or 'dist' in filepath or '.git' in filepath:
        return False
    ext = os.path.splitext(filepath)[1]
    return ext in EXTS

def find_all_source_files(base_dir):
    """找到所有源文件"""
    result = []
    for root, dirs, files in os.walk(base_dir):
        # 跳过不需要的目录
        dirs[:] = [d for d in dirs if d not in ('node_modules', 'dist', '.git', '.next', '.nuxt', '.cache')]
        for f in files:
            filepath = os.path.join(root, f)
            if should_process_file(filepath):
                result.append(filepath)
    return result

def replace_in_file(filepath, rename_map):
    """在文件中执行替换"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except (UnicodeDecodeError, PermissionError):
        return False, 0
    
    original = content
    count = 0
    
    # 按长度降序排列，避免短名称匹配到长名称中
    sorted_items = sorted(rename_map.items(), key=lambda x: -len(x[0]))
    
    for old_name, new_name in sorted_items:
        # 匹配完整的标识符（不在另一个标识符中间）
        # 使用负向前瞻和后顾
        pattern = r'(?<![A-Za-z0-9_])' + re.escape(old_name) + r'(?![A-Za-z0-9_])'
        matches = re.findall(pattern, content)
        if matches:
            content = re.sub(pattern, new_name, content)
            count += len(matches)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True, count
    return False, 0

def main():
    rename_map = load_map()
    print(f"加载映射表: {len(rename_map)} 个组件")
    
    # 打印映射关系
    for old, new in sorted(rename_map.items()):
        print(f"  {old} → {new}")
    
    # 找到所有源文件
    all_files = find_all_source_files(BASE_DIR)
    print(f"\n扫描到 {len(all_files)} 个源文件")
    
    # 执行替换
    modified_files = []
    total_replacements = 0
    
    for filepath in all_files:
        modified, count = replace_in_file(filepath, rename_map)
        if modified:
            modified_files.append(filepath)
            total_replacements += count
            print(f"  [{count:3d}] {filepath}")
    
    print(f"\n完成! 修改了 {len(modified_files)} 个文件, 共 {total_replacements} 处替换")

if __name__ == '__main__':
    main()
