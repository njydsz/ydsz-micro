/**
 * index 配置模块
 *
 * @path conf\tailwind-config\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Config } from "tailwindcss";

import path from "node:path";

import { addDynamicIconSelectors } from "@iconify/tailwind";
import { getPackagesSync } from "@manypkg/get-packages";
import typographyPlugin from "@tailwindcss/typography";
import animate from "tailwindcss-animate";

import { enterAnimationPlugin } from "./plugins/entry";

const { packages } = getPackagesSync(process.cwd());

const tailwindPackages: string[] = [];

packages.forEach((pkg) => {
  tailwindPackages.push(pkg.dir);
});

/**
 * 生成 Tailwind 颜色调色板工具类。
 * 将 50~700 阶梯以及语义色映射到 CSS 变量。
 */
function createColorsPalette(name: string) {
  return {
    50: `hsl(var(--${name}-50))`,
    100: `hsl(var(--${name}-100))`,
    200: `hsl(var(--${name}-200))`,
    300: `hsl(var(--${name}-300))`,
    400: `hsl(var(--${name}-400))`,
    500: `hsl(var(--${name}-500))`,
    600: `hsl(var(--${name}-600))`,
    700: `hsl(var(--${name}-700))`,
    active: `hsl(var(--${name}-700))`,
    "background-light": `hsl(var(--${name}-200))`,
    "background-lighter": `hsl(var(--${name}-100))`,
    "background-lightest": `hsl(var(--${name}-50))`,
    border: `hsl(var(--${name}-400))`,
    "border-light": `hsl(var(--${name}-300))`,
    foreground: `hsl(var(--${name}-foreground))`,
    hover: `hsl(var(--${name}-600))`,
    text: `hsl(var(--${name}-500))`,
    "text-active": `hsl(var(--${name}-700))`,
    "text-hover": `hsl(var(--${name}-600))`,
  };
}

// Shadcn UI colors (向后兼容)
const shadcnUiColors = {
  accent: {
    DEFAULT: "hsl(var(--accent))",
    foreground: "hsl(var(--accent-foreground))",
    hover: "hsl(var(--accent-hover))",
    lighter: "hsl(var(--accent-lighter))",
  },
  background: {
    deep: "hsl(var(--background-deep))",
    DEFAULT: "hsl(var(--background))",
  },
  border: {
    DEFAULT: "hsl(var(--border))",
  },
  card: {
    DEFAULT: "hsl(var(--card))",
    foreground: "hsl(var(--card-foreground))",
  },
  destructive: {
    ...createColorsPalette("destructive"),
    DEFAULT: "hsl(var(--destructive))",
  },
  foreground: {
    DEFAULT: "hsl(var(--foreground))",
  },
  input: {
    background: "hsl(var(--input-background))",
    DEFAULT: "hsl(var(--input))",
  },
  muted: {
    DEFAULT: "hsl(var(--muted))",
    foreground: "hsl(var(--muted-foreground))",
  },
  popover: {
    DEFAULT: "hsl(var(--popover))",
    foreground: "hsl(var(--popover-foreground))",
  },
  primary: {
    ...createColorsPalette("primary"),
    DEFAULT: "hsl(var(--primary))",
  },
  ring: "hsl(var(--ring))",
  secondary: {
    DEFAULT: "hsl(var(--secondary))",
    desc: "hsl(var(--secondary-desc))",
    foreground: "hsl(var(--secondary-foreground))",
  },
};

// 自定义颜色（green 使用 --success-* 变量以统一语义色）
const customColors = {
  green: {
    50: "hsl(var(--success-50))",
    100: "hsl(var(--success-100))",
    200: "hsl(var(--success-200))",
    300: "hsl(var(--success-300))",
    400: "hsl(var(--success-400))",
    500: "hsl(var(--success-500))",
    600: "hsl(var(--success-600))",
    700: "hsl(var(--success-700))",
    active: "hsl(var(--success-700))",
    "background-light": "hsl(var(--success-200))",
    "background-lighter": "hsl(var(--success-100))",
    "background-lightest": "hsl(var(--success-50))",
    border: "hsl(var(--success-400))",
    "border-light": "hsl(var(--success-300))",
    foreground: "hsl(var(--success-foreground))",
    hover: "hsl(var(--success-600))",
    text: "hsl(var(--success-500))",
    "text-active": "hsl(var(--success-700))",
    "text-hover": "hsl(var(--success-600))",
  },
  header: {
    DEFAULT: "hsl(var(--header))",
  },
  heavy: {
    DEFAULT: "hsl(var(--heavy))",
    foreground: "hsl(var(--heavy-foreground))",
  },
  main: {
    DEFAULT: "hsl(var(--main))",
  },
  overlay: {
    content: "hsl(var(--overlay-content))",
    DEFAULT: "hsl(var(--overlay))",
  },
  red: {
    ...createColorsPalette("red"),
    foreground: "hsl(var(--destructive-foreground))",
  },
  sidebar: {
    deep: "hsl(var(--sidebar-deep))",
    DEFAULT: "hsl(var(--sidebar))",
  },
  success: {
    ...createColorsPalette("success"),
    DEFAULT: "hsl(var(--success))",
  },
  warning: {
    ...createColorsPalette("warning"),
    DEFAULT: "hsl(var(--warning))",
  },
  yellow: {
    ...createColorsPalette("yellow"),
    foreground: "hsl(var(--warning-foreground))",
  },
};

// 语义化背景色
const semanticColors = {
  canvas: "hsl(var(--bg-canvas))",
  "surface-1": "hsl(var(--bg-surface-1))",
  "surface-2": "hsl(var(--bg-surface-2))",
  "surface-3": "hsl(var(--bg-surface-3))",
};

// 语义化文本色
const semanticTextColors = {
  primary: "hsl(var(--txt-primary))",
  secondary: "hsl(var(--txt-secondary))",
  tertiary: "hsl(var(--txt-tertiary))",
  disabled: "hsl(var(--txt-disabled))",
  inverse: "hsl(var(--txt-inverse))",
};

// 语义化边框色
const semanticBorderColors = {
  DEFAULT: "hsl(var(--border-default))",
  strong: "hsl(var(--border-strong))",
  subtle: "hsl(var(--border-subtle))",
};

// 品牌色
const brandColors = {
  ...createColorsPalette("brand"),
  subtle: "hsl(var(--primary-subtle))",
  "subtle-foreground": "hsl(var(--primary-subtle-foreground))",
};

// 状态色
const statusColors = {
  success: createColorsPalette("success"),
  warning: createColorsPalette("warning"),
  error: createColorsPalette("destructive"),
};

export default {
  content: [
    "./index.html",
    ...tailwindPackages.map((item) =>
      path.join(item, "src/**/*.{vue,js,ts,jsx,tsx,svelte,astro,html}"),
    ),
  ],
  darkMode: "selector",
  plugins: [
    animate,
    typographyPlugin,
    addDynamicIconSelectors(),
    enterAnimationPlugin,
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // 动画配置
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "collapsible-down": "collapsible-down 0.2s ease-in-out",
        "collapsible-up": "collapsible-up 0.2s ease-in-out",
        float: "float 5s linear 0ms infinite",
        "fade-in": "fade-in 0.2s var(--ease-out)",
        "fade-out": "fade-out 0.15s var(--ease-in)",
        "slide-up": "slide-up 0.2s var(--ease-spring)",
        "slide-down": "slide-down 0.2s var(--ease-spring)",
        "scale-in": "scale-in 0.15s var(--ease-out)",
        "scale-out": "scale-out 0.1s var(--ease-in)",
        "lock-bounce": "lock-bounce 0.3s var(--ease-spring)",
        shimmer: "shimmer 2s linear infinite",
      },

      animationDuration: {
        "2000": "2000ms",
        "3000": "3000ms",
      },

      // 圆角系统
      borderRadius: {
        lg: "var(--radius-lg, var(--radius))",
        md: "var(--radius-md, calc(var(--radius) - 2px))",
        sm: "var(--radius-sm, calc(var(--radius) - 4px))",
        xl: "var(--radius-xl, calc(var(--radius) + 4px))",
        "2xl": "var(--radius-2xl, calc(var(--radius) + 8px))",
        full: "var(--radius-full, 9999px)",
        xs: "var(--radius-xs, 0.25rem)",
      },

      // 阴影系统
      boxShadow: {
        raised: "var(--shadow-raised-100)",
        "raised-md": "var(--shadow-raised-200)",
        "raised-lg": "var(--shadow-raised-300)",
        overlay: "var(--shadow-overlay-100)",
        "overlay-lg": "var(--shadow-overlay-200)",
        "direction-left": "var(--shadow-direction-left)",
        "direction-right": "var(--shadow-direction-right)",
        float: `0 6px 16px 0 rgb(0 0 0 / 8%),
          0 3px 6px -4px rgb(0 0 0 / 12%),
          0 9px 28px 8px rgb(0 0 0 / 5%)`,
        none: "none",
      },

      // 颜色系统 (合并所有颜色)
      colors: {
        ...customColors,
        ...shadcnUiColors,
        // 语义化颜色
        canvas: semanticColors.canvas,
        "surface-1": semanticColors["surface-1"],
        "surface-2": semanticColors["surface-2"],
        "surface-3": semanticColors["surface-3"],
        // 语义化文本色
        "text-primary": semanticTextColors.primary,
        "text-secondary": semanticTextColors.secondary,
        "text-tertiary": semanticTextColors.tertiary,
        "text-disabled": semanticTextColors.disabled,
        "text-inverse": semanticTextColors.inverse,
        // 语义化边框
        "border-strong": semanticBorderColors.strong,
        "border-subtle": semanticBorderColors.subtle,
        // 品牌色
        brand: brandColors,
        // 状态色
        success: statusColors.success,
        warning: statusColors.warning,
        error: statusColors.error,
      },

      // 字体系统
      fontFamily: {
        sans: ["var(--font-family)"],
        code: ["var(--font-family-code, var(--font-family))"],
      },

      // 字号系统
      fontSize: {
        "2xs": "var(--text-10)",
        xs: "var(--text-12)",
        sm: "var(--text-13)",
        base: "var(--text-14)",
        md: "var(--text-15)",
        lg: "var(--text-17)",
        xl: "var(--text-18)",
        "2xl": "var(--text-20)",
        "3xl": "var(--text-24)",
        "4xl": "var(--text-28)",
        "5xl": "var(--text-32)",
        h1: "var(--h1-size)",
        h2: "var(--h2-size)",
        h3: "var(--h3-size)",
        h4: "var(--h4-size)",
        h5: "var(--h5-size)",
        h6: "var(--h6-size)",
      },

      // 行高
      lineHeight: {
        tight: "var(--text-line-height-tight)",
        default: "var(--text-line-height-default)",
        relaxed: "var(--text-line-height-relaxed)",
      },

      // 字间距
      letterSpacing: {
        tight: "var(--tracking-tight)",
        default: "var(--tracking-default)",
        wide: "var(--tracking-wide)",
      },

      // 间距
      spacing: {
        header: "var(--height-header)",
        sidebar: "var(--width-sidebar)",
        "sidebar-collapsed": "var(--width-sidebar-collapsed)",
        "card-padding": "var(--padding-card)",
      },

      // 关键帧
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "collapsible-down": {
          from: { height: "0" },
          to: { height: "var(--radix-collapsible-content-height)" },
        },
        "collapsible-up": {
          from: { height: "var(--radix-collapsible-content-height)" },
          to: { height: "0" },
        },
        float: {
          "0%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
          "100%": { transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "scale-out": {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.95)" },
        },
        "lock-bounce": {
          "0%": { transform: "scale(1)" },
          "30%": { transform: "scale(1.2) rotate(-10deg)" },
          "60%": { transform: "scale(0.95) rotate(5deg)" },
          "100%": { transform: "scale(1) rotate(0deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },

      zIndex: {
        "100": "100",
        "1000": "1000",
      },
    },
  },
  safelist: ["dark"],
} as Config;
