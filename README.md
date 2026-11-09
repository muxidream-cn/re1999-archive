# re1999-archive

游戏壁纸归档站 Monorepo 项目说明

<kbd>简体中文</kbd> | <a href="./README.en.md"><kbd>English</kbd></a>

## 安装

拉取项目，在根目录下执行 `pnpm i` 安装依赖

## 目录结构说明

| 路径                                       | 说明                                       |
| ------------------------------------------ | ------------------------------------------ |
| `.github/`                                 | 工作流与按需加载的项目规范（instructions） |
| `.husky/`                                  | Git Hooks 配置（commit-msg、pre-commit）   |
| `docs/`                                    | 项目文档                                   |
| `packages/`                                | monorepo 子项目                            |
| `packages/app_android/`                    | Android 应用相关代码                       |
| `packages/app_core/`                       | 前端公共核心包                             |
| `packages/app_server/`                     | 服务端应用                                 |
| `packages/app_tauri/`                      | Tauri 桌面/移动端应用                      |
| `packages/app_web/`                        | Web 应用                                   |
| `packages/app_windows/`                    | Windows 应用相关代码                       |
| `packages/plugins/`                        | 工作区插件包                               |
| `packages/plugins/tauri_plugin_statusbar/` | 状态栏 Tauri 插件                          |
| `packages/re1999-docs/`                    | 文档站点（规划中）                         |
| `schema/`                                  | 数据或接口 schema                          |
| `scripts/`                                 | 项目维护脚本（如版本更新）                 |
| `types/`                                   | 公共类型定义                               |
| `package.json`                             | 根项目依赖、脚本和工作流配置               |
| `pnpm-workspace.yaml`                      | pnpm monorepo 工作区配置                   |
| `pnpm-lock.yaml`                           | pnpm 依赖锁文件                            |
| `Cargo.toml`                               | Rust workspace 配置                        |
| `Cargo.lock`                               | Rust 依赖锁文件                            |
| `eslint.config.js`                         | ESLint 配置                                |
| `.prettierrc.cjs`                          | Prettier 配置                              |
| `commitlint.config.cjs`                    | commitlint 和 cz-git 配置                  |
| `README.md`                                | 本说明文档                                 |
| `README.en.md`                             | 英文说明文档（占位模板，待完善）           |

## 项目文档

### 主项目（`docs/`）

| 文档                                                             | 说明                             |
| ---------------------------------------------------------------- | -------------------------------- |
| [项目相关](<./docs/项目相关.md>)                                 | Monorepo 结构与新建子项目流程    |
| [通过 SSH 克隆并全局安装 Skill 教程](<./docs/skills安装教程.md>) | Skill 仓库拉取与全局安装教程     |
| [xerj 说明文档](<./docs/xerj 说明文档.md>)                       | 本地代码搜索与公共资料检索说明   |

### 前端公共包（`packages/app_core/docs/`）

| 文档                                                                                        | 说明                             |
| ------------------------------------------------------------------------------------------- | -------------------------------- |
| [跨端差异处理：先运行时判断，后条件编译](<./packages/app_core/docs/conditional-compile.md>) | 跨端差异的选型优先级与实现方式   |
| [UI框架：shadcn-vue](<./packages/app_core/docs/shadcn-vue.md>)                              | 主题更换与组件使用说明           |

### Tauri 应用（`packages/app_tauri/docs/`）

| 文档                                                                        | 说明                                 |
| --------------------------------------------------------------------------- | ------------------------------------ |
| [tauri2](<./packages/app_tauri/docs/tauri2.md>)                             | Tauri 依赖安装与安卓打包配置         |
| [右键菜单](<./packages/app_tauri/docs/context-menu.md>)                     | 关闭原生右键菜单并渲染自定义菜单     |
| [Microsoft Store 打包](<./packages/app_tauri/docs/Microsoft Store 打包.md>) | MSIX 打包流程与商店验证问题          |
| [本地测试程序更新](<./packages/app_tauri/docs/本地测试程序更新.md>)         | 本地后端与客户端联调更新链路         |

## 脚本说明

| 脚本                            | 说明                                                                             |
| ------------------------------- | -------------------------------------------------------------------------------- |
| `build:app`                     | 构建 Android 应用                                                                |
| `build:desktop`                 | 构建 Windows 桌面应用                                                            |
| `build:desktop:microsoft-store` | 构建 Microsoft Store 安装包                                                      |
| `build:web`                     | 构建 Web 应用                                                                    |
| `check`                         | 执行全仓 ESLint 检查                                                             |
| `check:prettier`                | 检查 Prettier 格式                                                               |
| `commit`                        | 暂存区检查并进入引导式提交                                                       |
| `dev:app`                       | 启动 Android 开发环境                                                            |
| `dev:desktop`                   | 启动桌面端开发环境                                                               |
| `dev:docs`                      | 启动文档站开发服务器                                                             |
| `dev:server`                    | 启动服务端开发环境                                                               |
| `dev:web`                       | 启动 Web 开发服务器                                                              |
| `lint`                          | ESLint 检查并自动修复                                                            |
| `lint:commitlint`               | 校验 commit 信息                                                                 |
| `lint:prettier`                 | Prettier 自动格式化                                                              |
| `lint-staged`                   | 检查并修复暂存区文件                                                             |
| `prepare`                       | 初始化 Husky Git Hooks                                                           |
| `preview:web`                   | 预览 Web 构建产物                                                                |
| `prod:server`                   | 启动服务端生产环境                                                               |
| `updateVersion`                 | 更新各子项目版本号（`--major` / `--minor` / `--patch` 选择递增位，默认 `patch`） |

## Git 提交规范

项目内已配置引导式提交工具，运行`commit`脚本,例如`npm run commit`，即可触发，大致步骤如下。

### 一、引导式提交

**需要全局安装`pnpm add -g commitizen`**

1、代码格式化和检查：

每次执行时会先将被修改的代码添加到暂存区，然后进行代码检查。如果检查出错，注意看报错信息，会提醒是否可自动修复。

如果可以**自动修复就使用`lint:diff`脚本**将文件添加到暂存区再自动修复，这仅会修复本次修改的代码(如果你使用`lint:fix`脚本会检查并修改整个项目的代码)，如果无法自动修复则前往错误文件手动修改(`Ctrl键+鼠标左键`可以快速跳转)。

代码检查通过之后才会进行引导式提交。

2、开始引导式提交：

在引导式提交中，会依次要求选择类型( type )、范围( scope )、主题( subject )和其他信息，依照提醒一步步完成即可（具体格式要求可阅下方自行提交第3步）。

3、commit 信息格式校验：

commit 信息输入完成之后会触发格式检查，检查无误才会将代码提交到本地仓库。（**如果试错多次仍无法过校验，有可能是配置问题**）

4、将本地仓库代码提交到远程仓库【可选】配置用户名和邮箱，以便提交代码时能够识别身份：

`git config --global user.name 你的名字`

`git config --global user.email 你的邮箱`

如果你没有关联仓库，运行命令`git remote add origin <远程地址>`

运行命令`git push -u origin master`可将本地仓库代码提交到远程仓库

### 二、自行提交

如果不需要引导式提交，可执行命令`git add . && npm exec lint-staged && git commit`进行提交，命令说明如下：

1、`git add  .`：先将被修改的代码添加到暂存区；

2、`npm exec lint-staged`：引导式提交中的第1步，代码格式化和检查；

3、`git commit`：原版提交方式；

提交信息详细规则在`commitlint.config.cjs`中可以查看，大致格式如`{type}({scope,scope}): {subject}`。

**其中 type 和 subject 为必填项，scope 可不填，也可填多个，用英文逗号分隔，仅支持中文、英文小写、数字和下划线。冒号后需要加空格**。

4、引导式提交中的第3步和第4步

> 此工作流程详细介绍可查看：[代码审查和 git commit 引导、校验工作流](https://mp.weixin.qq.com/s/ta7lt3-BZvkLyjyLW934BA)

## 许可证

本仓库中原创代码采用 **MIT**，详见 [LICENSE](./LICENSE)。
`packages/app_server`不在本次授权范围内，将作为独立项目另行处理；`packages/re1999-docs` 文档站按 CC-BY-4.0 授权。第三方依赖、字体、图片、游戏素材及商标不由本许可证重新授权，应遵守各自的许可证或权利人授权。

`packages/app_core/src/components/template` 下的组件是用法参考，其中引用了 lightGallery（GPLv3）、v-viewer、anime.js 等第三方库，
**不要直接引入构建**：它们仅作代码示例保留，未作为依赖安装，不参与打包与分发，其授权归各自的第三方库，不在本项目 MIT 覆盖范围内。

### GSAP 许可声明

本项目使用的 GSAP 遵循其官方
[Standard "no charge" License](https://gsap.com/standard-license)，该许可**不属于**上述 MIT 授权的一部分，也不由 [LICENSE](./LICENSE)
重新授权。GSAP 的使用、修改、再分发以及商业场景限制一律以其官方许可条款为准；复制或再分发包含 GSAP 的代码前，请自行确认符合该许可要求。
