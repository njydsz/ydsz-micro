import os, re

primitives_dir = 'comm/@core/ui-kit/shadcn-ui/src/primitives'
components_dir = 'comm/@core/ui-kit/shadcn-ui/src/components'

# The correct mapping for PRIMITIVES (simple names, no Smart suffix)
primitive_files = {
    'avatar': ['YdAvatar', 'YdAvatarFallback', 'YdAvatarImage'],
    'button': ['YdButton'],
    'checkbox': ['YdCheckbox'],
    'context-menu': ['YdContextMenu', 'YdContextMenuCheckboxItem', 'YdContextMenuContent', 
                     'YdContextMenuGroup', 'YdContextMenuItem', 'YdContextMenuLabel',
                     'YdContextMenuRadioGroup', 'YdContextMenuRadioItem', 'YdContextMenuSeparator',
                     'YdContextMenuShortcut', 'YdContextMenuSub', 'YdContextMenuSubContent',
                     'YdContextMenuSubTrigger', 'YdContextMenuTrigger'],
    'dropdown-menu': ['YdDropdownMenu', 'YdDropdownMenuCheckboxItem', 'YdDropdownMenuContent',
                      'YdDropdownMenuGroup', 'YdDropdownMenuItem', 'YdDropdownMenuLabel',
                      'YdDropdownMenuRadioGroup', 'YdDropdownMenuRadioItem', 'YdDropdownMenuSeparator',
                      'YdDropdownMenuShortcut', 'YdDropdownMenuSub', 'YdDropdownMenuSubContent',
                      'YdDropdownMenuSubTrigger', 'YdDropdownMenuTrigger'],
    'hover-card': ['YdHoverCard', 'YdHoverCardContent', 'YdHoverCardTrigger'],
    'pin-input': ['YdPinInput', 'YdPinInputGroup', 'YdPinInputInput', 'YdPinInputSeparator'],
    'popover': ['YdPopover', 'YdPopoverContent', 'YdPopoverTrigger'],
    'scroll-area': ['YdScrollArea', 'YdScrollBar'],
    'select': ['YdSelect', 'YdSelectContent', 'YdSelectGroup', 'YdSelectItem', 'YdSelectItemText',
               'YdSelectLabel', 'YdSelectScrollDownButton', 'YdSelectScrollUpButton', 'YdSelectSeparator',
               'YdSelectTrigger', 'YdSelectValue'],
    'tooltip': ['YdTooltip', 'YdTooltipContent', 'YdTooltipProvider', 'YdTooltipTrigger'],
}

# Fix 1: Restore correct exports in primitives/*/index.ts
for root_dir, dirs, files in os.walk(primitives_dir):
    for f in files:
        if f != 'index.ts':
            continue
        fpath = os.path.join(root_dir, f)
        with open(fpath, encoding='utf-8') as fh:
            content = fh.read()
        
        original = content
        
        # Remove all "Smart" references in primitives index files
        # Replace "Smart" with empty string in identifier names
        content = re.sub(r'\b(Yd[A-Za-z0-9_]+)Smart\b', r'\1', content)
        
        # Also fix Smart.vue paths
        content = content.replace('Smart.vue', '.vue')
        
        # Fix any YdVeeVee issues (if double Yd was introduced)
        content = content.replace('YdYd', 'Yd')
        
        if content != original:
            with open(fpath, 'w', encoding='utf-8') as fh:
                fh.write(content)
            print(f"FIXED: {os.path.relpath(fpath, primitives_dir)}")

# Fix 2: Check all primitives .ts and .vue files for Smart references (shouldn't have any)
smart_refs = []
for root_dir, dirs, files in os.walk(primitives_dir):
    for f in files:
        if not (f.endswith('.ts') or f.endswith('.vue')):
            continue
        if f.endswith('.test.ts'):
            continue
        fpath = os.path.join(root_dir, f)
        with open(fpath, encoding='utf-8') as fh:
            content = fh.read()
        
        original = content
        # Check for Smart references and remove them
        new_content = re.sub(r'\b(Yd[A-Za-z0-9_]+)Smart\b', r'\1', content)
        new_content = new_content.replace('YdYd', 'Yd')
        
        if new_content != original:
            smart_refs.append(os.path.relpath(fpath, primitives_dir))
            with open(fpath, 'w', encoding='utf-8') as fh:
                fh.write(new_content)

if smart_refs:
    print(f"\nFixed Smart refs in {len(smart_refs)} files:")
    for r in smart_refs[:10]:
        print(f"  {r}")
else:
    print("\nNo Smart refs found in primitives files (good)")

# Fix 3: Verify all primitives/ .vue files exist and match index exports
print("\n--- Verifying primitives ---")
for subdir, expected_names in primitive_files.items():
    subdir_path = os.path.join(primitives_dir, subdir)
    index_path = os.path.join(subdir_path, 'index.ts')
    
    if not os.path.exists(index_path):
        print(f"MISSING index: {subdir}/index.ts")
        continue
    
    with open(index_path, encoding='utf-8') as fh:
        content = fh.read()
    
    # Check that each expected name is exported
    for name in expected_names:
        if name not in content:
            print(f"MISSING export: {name} in {subdir}/index.ts")

# Fix 4: Now check for any leftover primitive refs to old "Root" names in components/
print("\n--- Checking components for old Root refs ---")
root_refs = []
for root_dir, dirs, files in os.walk(components_dir):
    for f in files:
        if not (f.endswith('.ts') or f.endswith('.vue')):
            continue
        if f.endswith('.test.ts') or f.endswith('.stories.ts'):
            continue
        fpath = os.path.join(root_dir, f)
        with open(fpath, encoding='utf-8') as fh:
            content = fh.read()
        
        # Look for YdAvatarRoot, YdPopoverRoot etc references that should now be YdAvatar, YdPopover
        matches = re.findall(r'\b(Yd[A-Za-z0-9]+Root)\b', content)
        if matches:
            root_refs.append((os.path.relpath(fpath, components_dir), matches))

if root_refs:
    print("Remaining Root refs in components:")
    for f, refs in root_refs[:15]:
        print(f"  {f}: {refs}")
else:
    print("No remaining Root refs (good)")

# Fix 5: Check the old-style YdAvatar (wrapper) refs in components that should now be YdAvatarSmart
# The wrapper files were renamed to YdAvatarSmart, so references to YdAvatar (as a component in templates) 
# should now be YdAvatarSmart
print("\n--- Checking for correct Smart refs in components ---")
for root_dir, dirs, files in os.walk(components_dir):
    for f in files:
        if not (f.endswith('.ts') or f.endswith('.vue')):
            continue
        if f.endswith('.test.ts') or f.endswith('.stories.ts'):
            continue
        fpath = os.path.join(root_dir, f)
        with open(fpath, encoding='utf-8') as fh:
            content = fh.read()
        
        # Look for leftover old names that should have been Smart-replaced
        # e.g., referring to YdAvatar instead of YdAvatarSmart
        # Hmm, this should only happen in templates where the wrapper is used

print("\nDone verification!")
