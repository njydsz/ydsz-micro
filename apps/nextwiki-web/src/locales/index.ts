/**
 * 国际化配置入口 — 通过 @remi/shared-auth 的 createSubAppI18n 工厂装配。
 *
 * @path apps\nextwiki-web\src\locales\index.ts
 * @author remi-team
 * @since 1.0.0
 */
import { createSubAppI18n } from '@remi/shared-auth';

const modules = import.meta.glob('./langs/**/*.json');

export const { $t, elementLocale, setupI18n } = createSubAppI18n({ modules });
