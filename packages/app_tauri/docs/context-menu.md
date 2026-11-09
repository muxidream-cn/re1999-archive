# 右键菜单

Windows 上 Tauri 使用 WebView2，默认会在右键时弹出原生上下文菜单（重新加载 / 另存为 / 打印 / 检查）。本项目在原生层关闭该菜单，并在前端用 shadcn-vue 的 ContextMenu 渲染自己的菜单。

## 原生层（Windows）

Tauri 没有提供关闭原生菜单的配置项，只能调用 WebView2 的 COM 接口：

- `packages/app_tauri/Cargo.toml`
  - 新增 `[target.'cfg(target_os = "windows")'.dependencies] webview2-com`。
  - **版本必须与 tauri 依赖树中的 `webview2-com` 一致**，否则 `webview.controller()` 返回的 COM 类型不兼容，编译期报 mismatched types。查询方式：

    ```powershell
    cargo tree --manifest-path packages/app_tauri/Cargo.toml -i webview2-com
    ```

- `packages/app_tauri/src/lib.rs`
  - `disable_native_context_menu()` 在 `setup` 里对 `main` 窗口调用：
    `with_webview` → `controller.CoreWebView2()` → `Settings()` → `SetAreDefaultContextMenusEnabled(false)`。
  - 注意 `Settings` 挂在 `ICoreWebView2` 上，`ICoreWebView2Controller` 上没有该方法。
  - 失败只 `log::warn!`，不影响启动。

### devtools 策略

- `Cargo.toml` 中 tauri **不启用** `devtools` feature：Tauri 2 在 debug 构建默认放行 devtools，release 不带该 feature 时打包产物中不再包含调试面板。
- `tauri.conf.json` 中不再设置 `app.windows[].devtools`，避免配置与 feature 语义冲突。
- 开发期调试：`setup` 的 debug 分支会调用 `window.open_devtools()`（也可用 `Ctrl+Shift+I`）。**发布版刻意不提供调试入口**，这是预期行为，不是回归。

## 前端层（app_core，三端共享）

实现位置：`packages/app_core/src/components/custom/context-menu/`

| 文件 | 职责 |
| --- | --- |
| `contextMenuConfig.ts` | 分组定义、`data-context-*` 属性名、`resolveContext()` 上下文解析 |
| `useContextActions.ts` | 动作实现（复制/粘贴/全选/复制图片地址/图片另存为/复制链接/浏览器打开/刷新）与分组解析 |
| `AppContextMenu.vue` | 全局 `ContextMenuTrigger` + 捕获监听 + 分组渲染 |

`App.vue` 用 `<AppContextMenu>` 包裹根节点，因此 web / Windows / Android 三端同时生效。

> `AppContextMenu.vue` 使用 reka-ui 的 `ContextMenuTrigger` 原语，而不是 `@shadcn/ui/context-menu/ContextMenuTrigger`：后者写死 `select-none`，包裹全应用会让文字无法选中，直接破坏“复制选中文本”。

### 元素标识

按优先级从最近的标识元素上读取（会向上冒泡到祖先）：

| 属性 | 说明 |
| --- | --- |
| `data-context-menu` | 空格分隔的分组名：`edit` / `image` / `link` / `page`；`none` 表示该区域禁用菜单 |
| `data-context-actions` | 动作白名单，空格或逗号分隔；存在时只显示列出的动作（仍按动作所属分组归组），优先于分组默认项 |
| `data-context-src` | 覆盖图片地址（用于 div 背景图、canvas、虚拟列表卡片） |
| `data-context-name` | 覆盖图片文件名（另存为时使用） |
| `data-context-href` | 覆盖链接地址 |

示例：

```vue
<!-- 卡片整体声明图片组，并把数据源显式传给菜单 -->
<div
  class="card"
  data-context-menu="image"
  :data-context-src="image.img_url"
  :data-context-name="image.name"
>
  <picture class="card-bg">...</picture>
</div>
```

分组与默认动作：

| 分组 | 默认动作 |
| --- | --- |
| `edit` | 复制、粘贴、全选 |
| `image` | 复制图片地址、图片另存为 |
| `link` | 复制链接地址、在浏览器打开 |
| `page` | 刷新页面 |

### 无标识时的兜底

未命中 `data-context-menu` 时按标签推断：

1. 输入框 / textarea / contenteditable → `edit`
2. 有非空选中文本 → `edit`
3. 图片（`img`，支持祖先元素）→ `image`
4. 链接（`a[href]`）→ `link`
5. 其余位置 → `page`

图片位于链接内时额外追加 `link` 分组，因此“复制图片 + 打开链接”可以同时出现。

### 交互约定

- 动作不可用时保留为禁用态（用户能看见能力存在），不做隐藏。
- 只有一个分组时不显示分组标题，多组时显示并插入分隔线。
- 粘贴使用 `document.execCommand("insertText")`，会派发原生 `input` 事件，`v-model` 可同步且保留撤销栈。
- 读取剪贴板被拒时提示改用 `Ctrl+V`，不新增剪贴板插件。

## 验证清单

1. `cargo check --manifest-path packages/app_tauri/Cargo.toml`
2. `pnpm -F app_windows check:type`、`pnpm -F @app/core check`
3. 运行 `pnpm -F app_tauri tauri dev`：
   - 任意位置右键只出现自定义菜单，不再出现“重新加载 / 另存为 / 打印 / 检查”；
   - 图片卡片右键出现图片组，`图片另存为` 能拉起保存框；
   - 输入框右键可粘贴，`v-model` 同步；
   - `data-context-menu="none"` 的区域不弹菜单。
4. `pnpm -F app_tauri tauri build`：发布版按 `F12` / `Ctrl+Shift+I` 不应打开调试面板。

## 已知缺口

- vistaview 画廊的主图由第三方库创建，未注入 `data-context-*`。当前画廊内右键依赖标签兜底（`img`），若后续需要精确取原图或文件名，需要扩展画廊在切换图片时同步写入 `data-context-src`。
- Android 端长按是否触发 `contextmenu` 事件需真机验证；菜单本身已三端可用，但移动端手势表现未在本次改动中验证。
