# 项目协作约定

## 通用工作方式

- 先核实需求和前提；发现逻辑跳跃或信息缺失时，说明依据、风险和更合适的解释。
- 遵守用户指定的目录范围。修改前检查并保留暂存区和工作区现状；不要覆盖、暂存、提交、重置或回滚用户的改动。
- 涉及多个阶段或外部服务时，先说明计划与待确认事项；重要写入前确认。
- 修改 API 契约前核对实现和文档；不确定时先询问，不要默默改变参数、Content-Type、响应、鉴权或空结果行为。
- 遵循同级代码风格，验证实际需求，并说明验证范围和未验证事项。

## 子项目结构

- 前端应用：`packages/app_web`、`packages/app_android`、`packages/app_windows`。
- `packages/app_core`：前端共享逻辑、UI 和业务组件；修改时注意多端适配。
- `packages/app_server`：应用服务端。
- `packages/app_tauri`：基于 Tauri 2 的桌面端 Rust 部分及插件。
- `packages/re1999-docs`：计划中的文档站点。项目文档位于各项目的 `docs` 文件夹。

## 按需加载的项目规范

专项规则位于 `.github/instructions/`，按任务或文件类型加载：

- Vue Router、共享依赖和 `resolve.dedupe`：`frontend-routing.instructions.md`
- web / Windows / Android 差异与条件编译：`cross-platform.instructions.md`
- TypeScript 编码约定：`typescript.instructions.md`
- Apifox 接口与资源维护：`apifox.instructions.md`
- XERJ 本地代码搜索与公共资料检索：`xerj.instructions.md`

按任务加载环境提供的相关技能；Vue 任务先加载 `vue-best-practices`。其他常用技能包括 `shadcn-vue`、`create-adaptable-composable`、`dotenv`、`dotenvx`、`apifox-cli` 及其专项技能、`xerj` 和 `xerj-hub`。不要假设技能位于固定的用户目录。
