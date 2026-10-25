const fs = require('fs');

const files = [
  'main/src/components/global-search.vue',
  'main/src/components/network-alert.vue',
  'main/src/components/subapp-progress.vue',
  'main/src/widgets/global-search/global-search.vue',
  'main/src/widgets/global-search/search-panel.vue',
];

for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  let count = 0;
  src = src.replace(/<LucideIcon\b([\s\S]*?)\/>/g, (_, attrs) => {
    count++;
    const converted = attrs
      .replace(/:name=/g, ':icon=')
      .replace(/\bname=/g, 'icon=')
      .replace(/:size="(\d+)"/g, 'width="$1" height="$1"');
    return `<YdIcon${converted}/>`;
  });
  if (!count) {
    console.log(`skip ${file}`);
    continue;
  }
  if (!src.includes("from '@ydsz-core/ydsz-ui'") && !src.includes('from "@ydsz-core/ydsz-ui"')) {
    src = src.replace(
      /(import \{[^}]*\} from ['"]vue['"];?)/,
      "$1\nimport { YdIcon } from '@ydsz-core/ydsz-ui';",
    );
  }
  fs.writeFileSync(file, src);
  console.log(`updated ${file} (${count} icons)`);
}
