#!/usr/bin/env node
/**
 * ydsz-init —— 一键创建 ydsz-ui 项目脚手架
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\cli\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScaffoldOptions {
  name: string
  template: 'vue' | 'nuxt'
  ts: boolean
  icon: 'lucide' | 'heroicons'
  install: boolean
}

// ---------------------------------------------------------------------------
// Argument parser (lightweight, no external deps)
// ---------------------------------------------------------------------------

interface RawArg {
  key: string
  value: string | boolean
}

function parseArgs(argv: string[]): RawArg[] {
  const result: RawArg[] = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=')
      if (eqIdx !== -1) {
        result.push({ key: arg.slice(2, eqIdx), value: arg.slice(eqIdx + 1) })
      } else if (i + 1 < argv.length && !argv[i + 1].startsWith('-')) {
        result.push({ key: arg.slice(2), value: argv[++i] })
      } else {
        result.push({ key: arg.slice(2), value: true })
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      if (i + 1 < argv.length && !argv[i + 1].startsWith('-')) {
        result.push({ key: arg.slice(1), value: argv[++i] })
      } else {
        result.push({ key: arg.slice(1), value: true })
      }
    } else if (arg !== '') {
      result.push({ key: '_', value: arg })
    }
  }
  return result
}

function getArg(args: RawArg[], keys: string[]): string | boolean | undefined {
  for (const key of keys) {
    const found = args.find((a) => a.key === key)
    if (found !== undefined) return found.value
  }
  return undefined
}

function showHelp(): void {
  console.log(`
ydsz-init —— 一键创建 ydsz-ui 项目脚手架

用法:
  ydsz-init <项目名> [选项]

选项:
  --template, -t    模板类型: vue | nuxt   (默认: vue)
  --ts, -T          使用 TypeScript         (默认: true)
  --js, -J          使用 JavaScript         (覆盖 --ts)
  --icon, -i        图标库: lucide | heroicons (默认: lucide)
  --no-install      跳过 npm install
  --help, -h        显示帮助
  --version, -v     显示版本

示例:
  ydsz-init my-app
  ydsz-init my-app --template nuxt --icon heroicons
  ydsz-init my-app --js --no-install
`)
}

function showVersion(): void {
  console.log('ydsz-init v1.0.0')
}

// ---------------------------------------------------------------------------
// Scaffold implementation
// ---------------------------------------------------------------------------

function exec(cmd: string, cwd?: string): void {
  execSync(cmd, { stdio: 'inherit', cwd })
}

function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true })
  }
}

function writeProjectFile(path: string, content: string): void {
  writeFileSync(path, content, 'utf-8')
  console.log(`  created ${path}`)
}

function generatePackageJson(name: string, ts: boolean, icon: 'lucide' | 'heroicons'): string {
  return JSON.stringify(
    {
      name,
      version: '0.0.1',
      private: true,
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vue-tsc --noEmit && vite build',
        preview: 'vite preview',
      },
      dependencies: {
        vue: '^3.5.13',
        '@ydsz-core/ydsz-ui': '^5.5.0',
        'class-variance-authority': '^0.7.1',
        [icon === 'heroicons' ? '@heroicons/vue' : 'lucide-vue-next']:
          icon === 'heroicons' ? '^2.1.5' : '^0.460.0',
      },
      devDependencies: {
        '@vitejs/plugin-vue': '^5.2.1',
        vite: '^6.0.0',
        typescript: '^5.6.0',
        'vue-tsc': '^2.1.10',
        tailwindcss: '^4.0.0',
        '@tailwindcss/vite': '^4.0.0',
      },
    },
    null,
    2,
  )
}

function generateViteConfig(ts: boolean): string {
  return `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
`
}

function generateTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ESNext',
        module: 'ESNext',
        moduleResolution: 'bundler',
        strict: true,
        jsx: 'preserve',
        resolveJsonModule: true,
        isolatedModules: true,
        esModuleInterop: true,
        lib: ['ESNext', 'DOM', 'DOM.Iterable'],
        skipLibCheck: true,
        noEmit: true,
        baseUrl: '.',
        paths: {
          '@/*': ['./src/*'],
        },
      },
      include: ['src/**/*.ts', 'src/**/*.vue', 'env.d.ts'],
      exclude: ['node_modules', 'dist'],
    },
    null,
    2,
  )
}

function generateEnvDts(): string {
  return `/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
`
}

function generateIndexHtml(name: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
  </head>
  <body class="min-h-screen bg-background text-foreground">
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`
}

function generateMainTs(): string {
  return `import { createApp } from 'vue'
import App from './App.vue'
import '@ydsz-core/ydsz-ui/styles.css'
import './styles/main.css'

const app = createApp(App)
app.mount('#app')
`
}

function generateAppVue(): string {
  return `<script setup lang="ts">
import { ref } from 'vue'
import {
  YdConfigProvider,
  YdButton,
  YdInput,
  YdCard,
  YdCardHeader,
  YdCardTitle,
  YdCardContent,
} from '@ydsz-core/ydsz-ui'

const count = ref(0)
const inputValue = ref('')

function handleClick() {
  count.value++
}
</script>

<template>
  <YdConfigProvider>
    <div class="flex min-h-screen items-center justify-center bg-background p-8">
      <YdCard class="w-full max-w-md">
        <YdCardHeader>
          <YdCardTitle>ydsz-ui 脚手架</YdCardTitle>
        </YdCardHeader>
        <YdCardContent class="space-y-4">
          <div class="flex items-center gap-2">
            <YdButton @click="handleClick">
              点击次数: {{ count }}
            </YdButton>
          </div>
          <YdInput
            v-model="inputValue"
            placeholder="输入一些文字..."
          />
          <p class="text-sm text-muted-foreground">
            输入内容: {{ inputValue || '（空）' }}
          </p>
        </YdCardContent>
      </YdCard>
    </div>
  </YdConfigProvider>
</template>
`
}

function generateCss(): string {
  return `@import "tailwindcss";

@theme {
  --color-background: #ffffff;
  --color-foreground: #0a0a0a;
  --color-muted: #f5f5f5;
  --color-muted-foreground: #737373;
  --color-border: #e5e5e5;
  --color-primary: #171717;
  --color-primary-foreground: #fafafa;
  --color-secondary: #f5f5f5;
  --color-secondary-foreground: #171717;
  --color-accent: #f5f5f5;
  --color-accent-foreground: #171717;
  --color-destructive: #ef4444;
  --color-ring: #171717;
  --radius: 0.5rem;
}

@media (prefers-color-scheme: dark) {
  @theme {
    --color-background: #0a0a0a;
    --color-foreground: #fafafa;
    --color-muted: #262626;
    --color-muted-foreground: #a3a3a3;
    --color-border: #404040;
    --color-primary: #fafafa;
    --color-primary-foreground: #171717;
    --color-secondary: #262626;
    --color-secondary-foreground: #fafafa;
    --color-accent: #262626;
    --color-accent-foreground: #fafafa;
    --color-destructive: #7f1d1d;
    --color-ring: #d4d4d4;
  }
}
`
}

function generateReadme(name: string): string {
  return `# ${name}

基于 ydsz-ui + Vite + Vue 3 + TypeScript + Tailwind CSS 的项目脚手架。

## 开发

\`\`\`bash
npm run dev
\`\`\`

## 构建

\`\`\`bash
npm run build
\`\`\`
`
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const raw = parseArgs(process.argv.slice(2))

  // Help / version
  if (getArg(raw, ['h', 'help']) !== undefined) {
    showHelp()
    return
  }
  if (getArg(raw, ['v', 'version']) !== undefined) {
    showVersion()
    return
  }

  // Project name
  const nameArg = raw.find((a) => a.key === '_')
  const name = typeof nameArg?.value === 'string' ? nameArg.value : ''

  if (!name) {
    console.error('错误: 请提供项目名称')
    console.error('')
    showHelp()
    process.exit(1)
  }

  // Options
  const templateRaw = getArg(raw, ['t', 'template'])
  const template: 'vue' | 'nuxt' =
    templateRaw === 'nuxt' ? 'nuxt' : 'vue'

  const tsArg = getArg(raw, ['T', 'ts'])
  const jsArg = getArg(raw, ['J', 'js'])
  const ts: boolean = jsArg !== undefined ? false : tsArg !== false

  const iconRaw = getArg(raw, ['i', 'icon'])
  const icon: 'lucide' | 'heroicons' =
    iconRaw === 'heroicons' ? 'heroicons' : 'lucide'

  const noInstall = getArg(raw, ['no-install']) !== undefined

  const options: ScaffoldOptions = { name, template, ts, icon, install: !noInstall }

  console.log('')
  console.log(`  项目名称: ${options.name}`)
  console.log(`  模板类型: ${options.template}`)
  console.log(`  语言类型: ${options.ts ? 'TypeScript' : 'JavaScript'}`)
  console.log(`  图标库:   ${options.icon}`)
  console.log(`  自动安装: ${options.install ? '是' : '否'}`)
  console.log('')

  const projectDir = resolve(process.cwd(), name)

  if (existsSync(projectDir)) {
    console.error(`错误: 目录已存在 ${projectDir}`)
    process.exit(1)
  }

  console.log(`创建项目 ${name} ...\n`)

  // Directory structure
  ensureDir(resolve(projectDir, 'src'))
  ensureDir(resolve(projectDir, 'src/styles'))
  ensureDir(resolve(projectDir, 'public'))

  // package.json
  writeProjectFile(resolve(projectDir, 'package.json'), generatePackageJson(name, ts, icon))

  // vite.config
  writeProjectFile(resolve(projectDir, `vite.config.${ts ? 'ts' : 'js'}`), generateViteConfig(ts))

  // tsconfig.json + env.d.ts
  if (ts) {
    writeProjectFile(resolve(projectDir, 'tsconfig.json'), generateTsConfig())
    writeProjectFile(resolve(projectDir, 'env.d.ts'), generateEnvDts())
  }

  // index.html
  writeProjectFile(resolve(projectDir, 'index.html'), generateIndexHtml(name))

  // src/main.ts
  writeProjectFile(resolve(projectDir, 'src/main.ts'), generateMainTs())

  // src/App.vue
  writeProjectFile(resolve(projectDir, 'src/App.vue'), generateAppVue())

  // src/styles/main.css
  writeProjectFile(resolve(projectDir, 'src/styles/main.css'), generateCss())

  // README.md
  writeProjectFile(resolve(projectDir, 'README.md'), generateReadme(name))

  // npm install
  if (options.install) {
    console.log('\n正在安装依赖...')
    exec('npm install', projectDir)
  }

  console.log(`\n项目 ${name} 创建完成！`)
  console.log('')
  console.log(`  cd ${name}`)
  console.log(`  npm run dev`)
  console.log('')
}

main()
