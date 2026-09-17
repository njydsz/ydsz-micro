import os, re

primitives_dir = 'comm/@core/ui-kit/shadcn-ui/src/primitives'
components_dir = 'comm/@core/ui-kit/shadcn-ui/src/components'
shadcn_src = 'comm/@core/ui-kit/shadcn-ui/src'

# ============================================================================
# Step 1: 列出 components/ 中导出的 Yd 名称（这些将被改名以避让 primitive）
# ============================================================================
def get_exports_from_index(filepath):
    """Parse export names from index.ts"""
    names = set()
    with open(filepath, encoding='utf-8') as f:
        content = f.read()
    # export { default as YdName } from ...
    for m in re.finditer(r'export\s*\{\s*default\s+as\s+(Yd[A-Za-z0-9_]+)', content):
        names.add(m.group(1))
    # export { YdName } from ...
    for m in re.finditer(r'export\s*\{\s*(?!default)(Yd[A-Za-z0-9_]+)\s*', content):
        names.add(m.group(1))
    # export * from './X' - recurse
    for m in re.finditer(r'export\s*\*\s*from\s*[\'"]\./([A-Za-z0-9_\-]+)', content):
        subdir = m.group(1)
        sub_index = os.path.join(os.path.dirname(filepath), subdir, 'index.ts')
        if os.path.exists(sub_index):
            names |= get_exports_from_index(sub_index)
    return names

comp_index = os.path.join(components_dir, 'index.ts')
prim_index = os.path.join(primitives_dir, 'index.ts')

comp_exports = get_exports_from_index(comp_index)
prim_exports = get_exports_from_index(prim_index)

# Current primitive exports with "Root" suffix that should be reverted
prim_with_root = {n for n in prim_exports if n.endswith('Root')}
# Names that currently have "Root" but conflict with components
prim_root_names = {n[:-4] for n in prim_with_root}  # name without "Root"

# Components that need renaming (they use the name that primitive should have)
components_to_rename = sorted(comp_exports & prim_root_names)
print(f"Rename conflicts (wrapper → primitive name):")
for c in components_to_rename:
    print(f"  {c} (wrapper) → {c}Smart (keep primitive name)")

# ============================================================================
# Step 2: 重命名 primitives 文件（移除 Root 后缀）
# ============================================================================
# Compound roots: YdAvatarRoot → YdAvatar, YdPopoverRoot → YdPopover, etc.
# Single primitives: YdButtonRoot → YdButton, YdCheckboxRoot → YdCheckbox, etc.
primitive_root_to_simple = {}
for root_dir, dirs, files in os.walk(primitives_dir):
    for f in files:
        if not f.endswith('.vue'):
            continue
        if 'Root' not in f:
            continue
        # YdAvatarRoot.vue → YdAvatar.vue, YdDropdownMenuRoot.vue → YdDropdownMenu.vue
        new_f = f.replace('Root', '')
        old_path = os.path.join(root_dir, f)
        new_path = os.path.join(root_dir, new_f)
        
        # Check target doesn't already exist
        if os.path.exists(new_path):
            print(f"SKIP (exists): {os.path.relpath(new_path, primitives_dir)}")
            continue
        
        os.rename(old_path, new_path)
        rel = os.path.relpath(old_path, primitives_dir)
        print(f"PRIMITIVE RENAME: {f} → {new_f} ({os.path.basename(root_dir)}/)")
        primitive_root_to_simple[f[:-4]] = new_f[:-4]  # YdAvatarRoot → YdAvatar

# ============================================================================
# Step 3: 重命名 components/ 中的冲突 wrapper（加 Smart 后缀）
# ============================================================================
# Name mapping for wrappers: old → new
wrapper_rename_map = {}
for name in components_to_rename:
    wrapper_rename_map[name] = f"{name}Smart"

print(f"\nWrapper renames: {wrapper_rename_map}")

# Rename files
for root_dir, dirs, files in os.walk(components_dir):
    parent = os.path.basename(root_dir)
    for f in list(files):
        if not f.endswith('.vue'):
            continue
        comp_name = f[:-4]  # YdAvatar.vue → YdAvatar
        if comp_name not in wrapper_rename_map:
            continue
        
        new_name = wrapper_rename_map[comp_name]
        new_f = f"{new_name}.vue"
        old_path = os.path.join(root_dir, f)
        new_path = os.path.join(root_dir, new_f)
        
        os.rename(old_path, new_path)
        print(f"WRAPPER RENAME: {parent}/{f} → {new_f}")

# ============================================================================
# Step 4: 更新 primitives 内部的 import 和 references
# ============================================================================
# 4a. 更新所有 primitives index.ts 中的 export 名称
for root_dir, dirs, files in os.walk(primitives_dir):
    for f in files:
        if f != 'index.ts':
            continue
        fpath = os.path.join(root_dir, f)
        with open(fpath, encoding='utf-8') as fh:
            content = fh.read()
        
        original = content
        
        # Update export names based on file renames
        # e.g., "YdAvatarRoot" → "YdAvatar" in export statements
        for old_name, new_name in primitive_root_to_simple.items():
            content = re.sub(
                r'\b' + re.escape(old_name) + r'\b',
                new_name,
                content
            )
        
        # Update path references
        content = content.replace("Root.vue", ".vue")
        
        if content != original:
            with open(fpath, encoding='utf-8') as fh_orig:
                orig_content = fh_orig.read()
            # Re-read to compare properly
            pass
        
        if content != original:
            with open(fpath, 'w', encoding='utf-8') as fh:
                fh.write(content)
            print(f"UPDATE: {os.path.relpath(fpath, primitives_dir)}")

# 4b. Update all primitives internal file content (references in templates, defineOptions, etc.)
for root_dir, dirs, files in os.walk(primitives_dir):
    for f in files:
        if not (f.endswith('.ts') or f.endswith('.vue')):
            continue
        if f.endswith('.stories.ts') or f.endswith('.test.ts'):
            continue
        
        fpath = os.path.join(root_dir, f)
        with open(fpath, encoding='utf-8') as fh:
            content = fh.read()
        
        original = content
        
        # Update all primitive names (Root → simple)
        for old_name, new_name in primitive_root_to_simple.items():
            content = re.sub(
                r'\b' + re.escape(old_name) + r'\b',
                new_name,
                content
            )
        
        if content != original:
            with open(fpath, 'w', encoding='utf-8') as fh:
                fh.write(content)

# ============================================================================
# Step 5: 更新 components/ 中的 wrapper 名称引用（旧名 → Smart 名）
# ============================================================================
for root_dir, dirs, files in os.walk(components_dir):
    for f in files:
        if not (f.endswith('.ts') or f.endswith('.vue')):
            continue
        if f.endswith('.stories.ts') or f.endswith('.test.ts'):
            continue
        
        fpath = os.path.join(root_dir, f)
        with open(fpath, encoding='utf-8') as fh:
            content = fh.read()
        
        original = content
        
        # Update wrapper references
        for old_name, new_name in wrapper_rename_map.items():
            content = re.sub(
                r'\b' + re.escape(old_name) + r'\b',
                new_name,
                content
            )
        
        # Fix any double-Yd issues (e.g., YdYdAvatarSmart → YdAvatarSmart)
        content = content.replace('YdYd', 'Yd')
        
        # Fix path references in imports
        for old_name, new_name in wrapper_rename_map.items():
            content = content.replace(f"{old_name}.vue", f"{new_name}.vue")
        
        if content != original:
            with open(fpath, 'w', encoding='utf-8') as fh:
                fh.write(content)

# ============================================================================
# Step 6: 更新 components/index.ts 中的导出名称
# ============================================================================
comp_index_path = os.path.join(components_dir, 'index.ts')
with open(comp_index_path, encoding='utf-8') as f:
    content = f.read()

original = content
for old_name, new_name in wrapper_rename_map.items():
    content = re.sub(
        r'\b' + re.escape(old_name) + r'\b',
        new_name,
        content
    )
content = content.replace('YdYd', 'Yd')

if content != original:
    with open(comp_index_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"UPDATE: components/index.ts")

# ============================================================================
# Step 7: 更新 shadcn-ui 顶级 index.ts 中的路径（已做）和注释
# ============================================================================
shadcn_index = os.path.join(shadcn_src, 'index.ts')
with open(shadcn_index, encoding='utf-8') as f:
    content = f.read()

original = content
# Update old name references
for old_name, new_name in wrapper_rename_map.items():
    content = re.sub(
        r'\b' + re.escape(old_name) + r'\b',
        new_name,
        content
    )
for old_name, new_name in primitive_root_to_simple.items():
    content = re.sub(
        r'\b' + re.escape(old_name) + r'\b',
        new_name,
        content
    )
content = content.replace('YdYd', 'Yd')

if content != original:
    with open(shadcn_index, 'w', encoding='utf-8') as f:
        f.write(content)

# ============================================================================
# Step 8: 重新扫描全项目，替换 primitives 名称引用
# ============================================================================
# The full project search-and-replace for any remaining references
print("\n--- Full project scan for remaining references ---")

# Compose full rename map
full_rename = {}
full_rename.update(primitive_root_to_simple)  # primitive YdAvatarRoot → YdAvatar
full_rename.update(wrapper_rename_map)       # wrapper YdAvatar → YdAvatarSmart

# Also add sub-component renames that we did earlier (already correct)
# e.g., YdAvatarFallback (was YdAvatarFallbackBase)

# Files to scan - the full shadcn-ui package
for root_dir, dirs, files in os.walk(shadcn_src):
    for f in files:
        if not (f.endswith('.ts') or f.endswith('.vue')):
            continue
        if f.endswith('.test.ts'):
            continue
        
        fpath = os.path.join(root_dir, f)
        with open(fpath, encoding='utf-8') as fh:
            content = fh.read()
        
        original = content
        
        # Apply all renames
        for old_name, new_name in full_rename.items():
            content = re.sub(
                r'\b' + re.escape(old_name) + r'\b',
                new_name,
                content
            )
        
        # Fix .vue path references
        for old_name, new_name in full_rename.items():
            content = content.replace(f"{old_name}.vue", f"{new_name}.vue")
        
        # Fix any double-Yd
        content = content.replace('YdYd', 'Yd')
        
        if content != original:
            with open(fpath, 'w', encoding='utf-8') as fh:
                fh.write(content)

# Also scan the unified entry package
ui_pkg = 'comm/@core/ui-kit/ui/src'
for root_dir, dirs, files in os.walk(ui_pkg):
    for f in files:
        if not f.endswith('.ts'):
            continue
        fpath = os.path.join(root_dir, f)
        with open(fpath, encoding='utf-8') as fh:
            content = fh.read()
        
        original = content
        
        for old_name, new_name in full_rename.items():
            content = re.sub(
                r'\b' + re.escape(old_name) + r'\b',
                new_name,
                content
            )
        content = content.replace('YdYd', 'Yd')
        
        if content != original:
            with open(fpath, 'w', encoding='utf-8') as fh:
                fh.write(content)

# Also scan common-ui since it re-exports shadcn
common_ui_src = 'comm/effects/common-ui/src'
for root_dir, dirs, files in os.walk(common_ui_src):
    for f in files:
        if not (f.endswith('.ts') or f.endswith('.vue')):
            continue
        if 'ui/' in root_dir.replace('\\', '/'):  # skip common-ui's own ui/ dir
            continue
        fpath = os.path.join(root_dir, f)
        try:
            with open(fpath, encoding='utf-8') as fh:
                content = fh.read()
        except:
            continue
        
        original = content
        
        for old_name, new_name in full_rename.items():
            content = re.sub(
                r'\b' + re.escape(old_name) + r'\b',
                new_name,
                content
            )
        content = content.replace('YdYd', 'Yd')
        
        if content != original:
            with open(fpath, 'w', encoding='utf-8') as fh:
                fh.write(content)
            print(f"UPDATE common-ui: {os.path.relpath(fpath, common_ui_src)}")

print("\nDone!")
