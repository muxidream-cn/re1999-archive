# 跨端差异处理：先运行时判断，后条件编译

## 结论：选型优先级

1. **优先运行时判断**：`useDevice()` 暴露的布尔量，或直接读 `import.meta.env.VITE_APP_DEVICE`。
2. **只有运行时判断做不到时**，才用 `vite-plugin-region-ifdef` 做构建期条件编译。

判断标准不是「哪端跑的」，而是「这段差异能不能在运行时安全地存在」。运行时不安全的差异（静态 import 跨端模块、需要从产物剔除的代码）才属于条件编译的领域。

## 现有运行时能力

`packages/app_core/src/hooks/useDevice.ts` 返回：

| 字段 | 依据 | 说明 |
| --- | --- | --- |
| `isMobile` / `isDesktop` | UA（Android/iPhone/iPad/iPod）+ Tailwind `md` 断点 | 设备形态，不是平台 |
| `isWeb` / `isTauri` | `import.meta.env.VITE_APP_DEVICE` | 平台大类 |

`VITE_APP_DEVICE` 由各应用 `.env.*` 固定注入：`app_web=web`、`app_windows=windows`、`app_android=android`。

**已知缺口**：`useDevice` 目前只把 `VITE_APP_DEVICE` 折叠成 `isWeb` / `isTauri`，**无法区分 windows 与 android**。需要平台粒度时，先在 `useDevice` 里补一个暴露原始值的字段（例如 `platform: computed(() => import.meta.env.VITE_APP_DEVICE)`），而不是直接跳到条件编译。运行时能解决就补运行时，这是本节的前提。

## 必须用条件编译的三个场景

1. **静态 import 跨端不可用**。例如桌面专属的 `@tauri-apps/plugin-updater`、`window-state`，安卓专属的 `tauri-plugin-status-bar-api`。`import` 是静态语句，运行时 `if` 拦不住模块解析，Web 构建会直接报模块不存在。
2. **需要把代码或依赖从产物中剔除**。运行时 `if` 即使被 DCE，`import` 仍会把依赖打进 bundle——体积、商店审核、缺失依赖这几类问题只能靠构建期剔除。
3. **整块模板 / 样式需要剔除**，且 `v-if` 无法避免另一端相关依赖被打包。

## 不要用条件编译的场景

- 仅分支逻辑差异：接口地址、默认值、文案、数值常量。
- 仅布局/交互差异：优先 `isMobile`、响应式 CSS、`v-if`。
- 需要在运行时动态切换：条件编译是编译期常量，切不了。

## 条件在哪里声明

由各应用自己的 `vite.config.ts` 声明，`app_core` 不感知平台：

| 应用 | 声明 |
| --- | --- |
| `packages/app_web` | `regionIfdef({ android: false, web: true, windows: false })` |
| `packages/app_windows` | `regionIfdef({ android: false, web: false, windows: true })` |
| `packages/app_android` | `regionIfdef({ android: true, web: false, windows: false })` |

新增平台时需同步四处：`package.json` 装依赖、`vite.config.ts` 的 `plugins`、`src/vite-env.d.ts` 类型声明、条件取值。

## 语法

```ts
// #ifdef windows
console.log("condition windows")
// #endif

// #ifndef windows
console.log("非 windows")
// #endif

// #region ifdef version>=1.2
// #endregion endif
```

- `.vue` 的 `template`：`<!-- #ifdef web -->` … `<!-- #endif -->`
- `style` / CSS：`/* #ifdef web */` … `/* #endif */`
- 支持 `#ifndef`、`#region` 折叠、表达式（`&&`、`>=` 等）
- 标记必须整行独占：行首缩进允许，行尾不能再跟代码，否则整对标记匹配失败、两块都不处理

## 已知坑

1. **条件必须写全**。插件用 `new Function(...条件名, 表达式)` 求值，未声明的标识符抛 `ReferenceError` 并被吞成 `false`，结果是静默删代码，不报错。
2. **不要用 `process.env.TAURI_ENV_PLATFORM` 判断平台**。它只在 Tauri CLI（`tauri dev` / `build`）的钩子命令中注入，取值是 `windows` / `darwin` / `linux` / `android` / `ios`，**永远不会是 `web`**；直接 `vite` 启动时该变量为空。
3. **条件在 vite 配置加载时求值一次**。改平台条件或换标记变量后必须重启 dev server，异常时清 `node_modules/.vite`。
4. **生产包看不到 `console`**。三端配置都有 `esbuild.drop: ["console", "debugger"]`，验证分支是否命中请用 `document.title` 之类的非 console 标记，或只在 dev 模式验证。
5. **`vue-tsc` 不认识 `#ifdef`**，被剔除的分支照样按普通代码做类型检查，不要在里面引用另一平台独有的类型或模块；构建期剔除不等于类型检查期豁免。
