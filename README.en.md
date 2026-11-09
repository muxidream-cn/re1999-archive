# re1999-archive

Game wallpaper archive monorepo

<a href="./README.md"><kbd>简体中文</kbd></a> | <kbd>English</kbd>

> ⚠️ Notice: This project contains a private submodule (backend). Running `git submodule update --init` will fail if you don't have access.

## Installation

```bash
git clone https://github.com/muxidream-cn/re1999-archive.git
cd re1999-archive
pnpm install
```

Initialize the submodules you need; without backend access, initialize the docs site only:

```bash
git submodule update --init packages/re1999-docs
```

## Directory Structure

| Path                                           | Description                                             |
| ---------------------------------------------- | ------------------------------------------------------- |
| `.github/`                                     | Workflows and on-demand project rules (instructions)    |
| `.husky/`                                      | Git hooks configuration (commit-msg, pre-commit)        |
| `docs/`                                        | Project documentation                                   |
| `packages/`                                    | Monorepo sub-projects                                   |
| `packages/app_android/`                        | Android app code                                        |
| `packages/app_core/`                           | Shared frontend core package                            |
| `packages/app_server/`                         | Server application (private submodule, access required) |
| `packages/app_tauri/`                          | Tauri desktop/mobile application                        |
| `packages/app_web/`                            | Web application                                         |
| `packages/app_windows/`                        | Windows app code                                        |
| `packages/app_plugins/`                        | Workspace plugin packages                               |
| `packages/app_plugins/tauri_plugin_statusbar/` | Status bar Tauri plugin                                 |
| `packages/re1999-docs/`                        | Documentation site (submodule, CC-BY-4.0)               |
| `schema/`                                      | Data / API schemas                                      |
| `scripts/`                                     | Maintenance scripts (e.g. version bump)                 |
| `types/`                                       | Shared type definitions                                 |
| `package.json`                                 | Root dependencies, scripts and workflow config          |
| `pnpm-workspace.yaml`                          | pnpm monorepo workspace config                          |
| `pnpm-lock.yaml`                               | pnpm lockfile                                           |
| `Cargo.toml`                                   | Rust workspace config                                   |
| `Cargo.lock`                                   | Rust lockfile                                           |
| `eslint.config.js`                             | ESLint config                                           |
| `.prettierrc.cjs`                              | Prettier config                                         |
| `commitlint.config.cjs`                        | commitlint and cz-git config                            |
| `README.md`                                    | Chinese documentation                                   |
| `README.en.md`                                 | English documentation (this file)                       |

## Project Docs

### Main Project (`docs/`)

| Document                                                                       | Description                                                  |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| [Project overview](<./docs/项目相关.md>)                                       | Monorepo structure and how to add a sub-project              |
| [Cloning and Globally Installing a Skill over SSH](<./docs/skills安装教程.md>) | Pulling a skill repository and installing it globally        |
| [xerj Documentation](<./docs/xerj 说明文档.md>)                                | Local code search and public resource lookup                 |

### Shared Frontend Package (`packages/app_core/docs/`)

| Document                                                                                                                              | Description                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [Cross-Platform Differences: Runtime Checks First, Conditional Compilation Second](<./packages/app_core/docs/conditional-compile.md>) | Selection priority and implementation of cross-platform differences |
| [UI Framework: shadcn-vue](<./packages/app_core/docs/shadcn-vue.md>)                                                                  | Theme switching and component usage                                 |

### Tauri App (`packages/app_tauri/docs/`)

| Document                                                                         | Description                                                   |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [tauri2](<./packages/app_tauri/docs/tauri2.md>)                                  | Tauri dependency installation and Android build configuration |
| [Context Menu](<./packages/app_tauri/docs/context-menu.md>)                      | Disabling the native context menu and rendering a custom one  |
| [Microsoft Store Packaging](<./packages/app_tauri/docs/Microsoft Store 打包.md>) | MSIX packaging flow and Store validation issues               |
| [Local Update Testing](<./packages/app_tauri/docs/本地测试程序更新.md>)          | Local backend and client update flow                          |

## Submodules

| Path                    | Remote URL                                          | Notes                                   |
| ----------------------- | --------------------------------------------------- | --------------------------------------- |
| `packages/re1999-docs/` | <https://github.com/muxidream-cn/re1999-docs.git>   | Docs site, open source, CC-BY-4.0       |
| `packages/app_server/`  | <https://github.com/muxidream-cn/re1999-server.git> | Backend, closed source, requires access |

Without backend access, initialize the docs site only:

```bash
git submodule update --init packages/re1999-docs
```

### Submodule Scripts

| Submodule     | Script                | Description                                          |
| ------------- | --------------------- | ---------------------------------------------------- |
| `re1999-docs` | `docs:dev`            | Start the docs dev server (port 8080 by default)     |
| `re1999-docs` | `docs:build`          | Build the static docs site                           |
| `re1999-docs` | `docs:clean-dev`      | Clear cache and start the dev server                 |
| `re1999-docs` | `docs:update-package` | Upgrade VuePress-related dependencies                |
| `app_server`  | `start`               | Start the backend in dev mode (root `dev:server`)    |
| `app_server`  | `start:prod`          | Start the backend in production (root `prod:server`) |

## Scripts

| Script                          | Description                                                                                                |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `build:app`                     | Build the Android app                                                                                      |
| `build:desktop`                 | Build the Windows desktop app                                                                              |
| `build:desktop:microsoft-store` | Build the Microsoft Store package                                                                          |
| `build:web`                     | Build the web app                                                                                          |
| `check`                         | Run ESLint across the whole repository                                                                     |
| `check:prettier`                | Check Prettier formatting                                                                                  |
| `commit`                        | Run staged-file checks and start the guided commit                                                         |
| `dev:app`                       | Start the Android dev environment                                                                          |
| `dev:desktop`                   | Start the desktop dev environment                                                                          |
| `dev:docs`                      | Start the docs site dev server (requires the `packages/re1999-docs` submodule)                             |
| `dev:server`                    | Start the server dev environment (requires the private `packages/app_server` submodule)                    |
| `dev:web`                       | Start the web dev server                                                                                   |
| `lint`                          | Run ESLint with auto-fix                                                                                   |
| `lint:commitlint`               | Validate the commit message                                                                                |
| `lint:prettier`                 | Format with Prettier                                                                                       |
| `lint-staged`                   | Run checks and fixes on staged files                                                                       |
| `prepare`                       | Set up Husky Git hooks                                                                                     |
| `preview:web`                   | Preview the web build output                                                                               |
| `prod:server`                   | Start the server in production mode (requires the private `packages/app_server` submodule)                 |
| `updateVersion`                 | Bump versions of all sub-projects (`--major` / `--minor` / `--patch` to pick the part, `patch` by default) |

## Git Commit Convention

A guided commit tool is configured in this project. Run the `commit` script (for example `npm run commit`) to trigger it. The general flow is as follows.

### Part 1 — Guided commit

**Commitizen must be installed globally: `pnpm add -g commitizen`**

1. Code formatting and linting:

Each run first stages the modified code, then lints it. If linting fails, read the error output — it tells you whether the issue can be fixed automatically.

If it **can be fixed automatically, use the `lint:diff` script** to stage the files and fix them; this only fixes the code changed in this commit (the `lint:fix` script lints and fixes the entire project). If it cannot be fixed automatically, edit the offending file manually (`Ctrl` + left click jumps to it).

The guided commit only starts after linting passes.

1. Starting the guided commit:

The guided commit asks you for the type, scope, subject and additional information in turn; follow the prompts step by step (see step 3 of the manual commit section below for the exact format).

1. Commit message validation:

After you finish writing the commit message, a format check runs; only when it passes will the code be committed to the local repository. (**If repeated attempts keep failing, the configuration may be the problem.**)

1. Pushing the local repository to the remote repository [optional]: configure your user name and email so that commits can be identified:

`git config --global user.name YOUR_NAME`

`git config --global user.email YOUR_EMAIL`

If you have not linked a repository, run `git remote add origin <remote-url>`

Running `git push -u origin master` pushes the local repository to the remote repository.

### Part 2 — Manual commit

If you do not need the guided commit, run `git add . && npm exec lint-staged && git commit`. The commands are described below:

1. `git add .`: stage the modified code first;

2. `npm exec lint-staged`: step 1 of the guided commit — code formatting and linting;

3. `git commit`: the plain commit command.

The detailed commit message rules can be found in `commitlint.config.cjs`; the general format is `{type}({scope,scope}): {subject}`.

**`type` and `subject` are required; `scope` is optional and may contain multiple values separated by English commas, supporting only Chinese characters, lowercase English letters, digits and underscores. A space is required after the colon.**

1. Steps 3 and 4 of the guided commit.

> For a detailed walkthrough of this workflow, see: [Code review and git commit guidance/validation workflow](https://blogs.muxidream.cn/technology/commit)

## License

Original code in this repository is licensed under **MIT**; see [LICENSE](./LICENSE) for details.
`packages/app_server` is not covered by this license and will be handled separately as an independent project; the `packages/re1999-docs` documentation site is licensed under CC-BY-4.0. Third-party dependencies, fonts, images, game assets and trademarks are not relicensed by this license and remain subject to their own licenses or the rights holders' terms.

The components under `packages/app_core/src/components/template` are usage references that reference third-party libraries such as lightGallery (GPLv3), v-viewer and anime.js.
**Do not import them into builds**: they are kept as code samples only, are not installed as dependencies, and do not participate in bundling or distribution; their licensing belongs to the respective third-party libraries and is outside the scope of this project's MIT license.

### GSAP License Notice

GSAP used in this project follows its official
[Standard "no charge" License](https://gsap.com/standard-license), which is **not** part of the MIT license above and is not
relicensed by [LICENSE](./LICENSE). Use, modification, redistribution and commercial restrictions of GSAP are governed solely by its official terms; before copying or redistributing code that includes GSAP, verify that you comply with those terms.
