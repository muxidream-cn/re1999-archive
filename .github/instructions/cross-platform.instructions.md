---
description: "Use when changing web, Windows, or Android platform behavior, Vite platform configuration, platform-specific imports, or vite-plugin-region-ifdef conditional compilation."
---

# 跨端差异处理

- web / Windows / Android 的差异优先使用运行时判断（`useDevice()`、`import.meta.env.VITE_APP_DEVICE`）；只有运行时判断无法满足时，才使用 `vite-plugin-region-ifdef` 构建期条件编译。
- 需要静态导入平台专属插件（如 `@tauri-apps/plugin-updater`、`tauri-plugin-status-bar-api`）或从产物中剔除平台代码/依赖时，使用条件编译。仅分支逻辑、文案或布局差异不要使用。
- 平台条件由各应用自己的 `vite.config.ts` 声明：app_web=`web`、app_windows=`windows`、app_android=`android`；`app_core` 不感知具体平台。新增平台时同步检查依赖、`plugins`、类型声明与条件取值。
- 条件标识符必须完整声明。插件会将未声明的标识符静默判为 false 并删除对应代码。
- 不要用 `process.env.TAURI_ENV_PLATFORM` 判断平台；它不会是 `web`。
- 条件编译的完整用法、语法和注意事项见 `packages/app_core/docs/conditional-compile.md`。
