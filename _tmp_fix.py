import os, re

components_dir = 'comm/@core/ui-kit/shadcn-ui/src/components'

smart_to_primitive = {
    'YdAvatarSmart': 'YdAvatar',
    'YdButtonSmart': 'YdButton',
    'YdCheckboxSmart': 'YdCheckbox',
    'YdDropdownMenuSmart': 'YdDropdownMenu',
    'YdHoverCardSmart': 'YdHoverCard',
    'YdPinInputSmart': 'YdPinInput',
    'YdPopoverSmart': 'YdPopover',
    'YdSelectSmart': 'YdSelect',
    'YdScrollbarSmart': 'YdScrollbar',
    'YdTooltipSmart': 'YdTooltip',
}

for root_dir, dirs, files in os.walk(components_dir):
    parent = os.path.basename(root_dir)
    for f in files:
        if not f.endswith('.vue'):
            continue
        if f.endswith('Smart.vue'):
            wrapper_name = f[:-4]
            prim_name = smart_to_primitive.get(wrapper_name)
            if not prim_name:
                continue
            
            fpath = os.path.join(root_dir, f)
            with open(fpath, encoding='utf-8') as fh:
                content = fh.read()
            
            # Check if this file imports from primitives WITH wrapper name in the import list
            lines = content.split('\n')
            changed = False
            for i, line in enumerate(lines):
                if 'from \'../../primitives\'' in line or ('from \'../../primitives/' in line):
                    # Replace wrapper name with primitive name
                    new_line = re.sub(r'\b' + re.escape(wrapper_name) + r'\b', prim_name, line)
                    if new_line != line:
                        lines[i] = new_line
                        changed = True
                        print(f"  LINE: {line.strip()}")
                        print(f"    -> {new_line.strip()}")
                elif '</' + wrapper_name in line or '<' + wrapper_name in line:
                    # In template, replace wrapper ref with primitive
                    new_line = re.sub(r'\b' + re.escape(wrapper_name) + r'\b', prim_name, line)
                    if new_line != line:
                        lines[i] = new_line
                        changed = True
                        print(f"  TMPL: {line.strip()[:80]}")
            
            if changed:
                with open(fpath, 'w', encoding='utf-8') as fh:
                    fh.write('\n'.join(lines))
                print(f"FIXED: {parent}/{f}")

print("\nDone")
