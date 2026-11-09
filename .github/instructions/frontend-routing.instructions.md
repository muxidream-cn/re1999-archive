---
description: "Use when changing Vue Router setup, routes, navigation, breadcrumbs, shared frontend dependencies, or debugging duplicate Vue Router instances and resolve.dedupe."
---

# 路由与共享依赖

- 路由表和路由实例统一由 `packages/app_core/src/router`（`routes.ts` 与 `createAppRouter()`）维护。各端 `src/router/index.ts` 只做薄封装，用于传入 history 等跨端差异。
- 应用包不要直接 `import "vue-router"`。路由上下文通过模块内 Symbol（`routerViewLocationKey`）传递；如果应用包与 `app_core` 解析到不同物理副本，`useRoute()` 会返回 `undefined`，导致生产构建中的侧边导航和面包屑消失，而开发环境可能因依赖预构建为单份而不复现。
- 凡依赖模块内 Symbol、模块级单例状态、`app.use()` 注册或全局注册表的库，跨包使用前应加入 `packages/app_core/vite.shared.ts` 的 `resolve.dedupe`。
- 排查依赖副本时，检查 `pnpm ls -r <包名> --depth 0` 是否出现 `(N variations)`，以及 `node_modules/.pnpm` 下是否存在多个同版本目录。
- 生产构建不要设置 `esbuild.drop: ["console"]`。Vue 生产环境的渲染异常可能只通过 `console.error` 上报而不 rethrow；删掉日志会让组件异常难以诊断。
