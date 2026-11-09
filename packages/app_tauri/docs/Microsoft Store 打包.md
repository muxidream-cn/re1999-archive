# Microsoft Store 打包

本文记录 `1999WallpaperArchive` 使用 Tauri 2 构建 Microsoft Store 安装包时的环境要求、构建流程和已遇到的商店验证问题。

## 打包目标

- 仅支持 Windows 桌面端，不包含 Android 等移动端。
- 同时支持 `x64` 和 `ARM64`。
- 最终上传文件为包含两个架构 MSIX 的 `MSIXBundle`。
- Tauri CLI 当前仅原生生成 `MSI` 或 `NSIS`，不能直接生成 `MSIXBundle`。项目通过 Windows SDK 的 `MakeAppx.exe` 封装 Tauri 可执行文件。

## 前置环境

### Rust 和 Node.js

- 安装项目要求的 Node.js、pnpm 和 Rust stable 工具链。
- 安装两个 Windows Rust target：

  ```powershell
  rustup target add x86_64-pc-windows-msvc
  rustup target add aarch64-pc-windows-msvc
  ```

- 可使用以下命令检查：

  ```powershell
  rustup target list --installed
  pnpm --version
  rustc --version
  ```

### Visual Studio 2026

本机实测使用 Visual Studio Community 2026，安装目录为：

```text
C:\Program Files\Microsoft Visual Studio\18\Community
```

需要在 Visual Studio Installer 中安装以下工作负载或单个组件：

- 使用 C++ 的桌面开发。
- MSVC x64/x86 构建工具。
- MSVC ARM64/ARM64EC 构建工具。
- C++ Clang tools for Windows / LLVM Clang toolset。
- Windows 10 或 Windows 11 SDK。

本机成功构建时使用：

- MSVC `14.51` ARM64 工具集。
- LLVM/Clang `22.1.3`。
- Windows SDK `10.0.26100` 系列的 `MakeAppx.exe`。

关键文件应存在：

```text
<VS安装目录>\VC\Auxiliary\Build\vcvarsall.bat
<VS安装目录>\VC\Tools\MSVC\<版本>\bin\Hostx64\arm64\cl.exe
<VS安装目录>\VC\Tools\MSVC\<版本>\bin\Hostx64\arm64\lib.exe
<VS安装目录>\VC\Tools\Llvm\x64\bin\clang.exe
<Windows Kits>\10\bin\<SDK版本>\x64\makeappx.exe
```

检查 PATH：

```powershell
where.exe vswhere.exe
where.exe clang.exe
where.exe clang-cl.exe
clang.exe --version
```

注意：同时安装多个 MSVC 工具集时，最新版本不一定安装了 ARM64 组件。打包脚本会扫描全部工具集，选择实际包含 `Hostx64\arm64\cl.exe` 的最高版本，并通过
`vcvarsall.bat -vcvars_ver=<版本>` 加载与之匹配的头文件和库。

`ring` 等 Rust 原生依赖在 Windows ARM64 构建时还需要 Clang。仅安装 ARM64 `cl.exe` 不够；如果日志提示找不到 `clang`，需安装 Visual
Studio 的 LLVM/Clang 组件并刷新 PATH。

### Windows SDK

Windows SDK 必须包含 `MakeAppx.exe`。脚本会从 PATH 或以下目录中选择最新 x64 版本：

```text
C:\Program Files (x86)\Windows Kits\10\bin
```

## Microsoft Store 产品身份

当前产品身份来自 Partner Center，不能自行修改或使用 Tauri 默认 identifier 代替：

| 字段                                    | 值                                             |
| --------------------------------------- | ---------------------------------------------- |
| Package/Identity/Name                   | `muxidream.1999WallpaperArchive`               |
| Package/Identity/Publisher              | `CN=21C7B139-325F-40DD-A212-9EAC8106A008`      |
| Package/Properties/PublisherDisplayName | `默默(muxidream)`                              |
| Package Family Name                     | `muxidream.1999WallpaperArchive_4zf03h9ncn0jy` |
| Store ID                                | `9N8XNCQ311S5`                                 |

商店地址：<https://apps.microsoft.com/detail/9N8XNCQ311S5>

## 项目配置

Microsoft Store 专用 Tauri 配置：

```text
packages/app_tauri/tauri.microsoftstore.conf.json
```

该配置用于：

- 禁用 Tauri 的 NSIS/MSI bundle。
- 禁用 updater artifacts。
- 跳过 WebView2 安装器封装。

MSIXBundle 构建脚本：

```text
packages/app_tauri/scripts/build-microsoft-store.ps1
```

脚本会：

1. 将 Tauri 三段版本转换为 MSIX 四段版本，例如 `0.1.9` 转为 `0.1.9.0`。
2. 分别构建 `x86_64-pc-windows-msvc` 和 `aarch64-pc-windows-msvc`。
3. 为两个架构生成独立 MSIX。
4. 解包并自检每个 MSIX 的语言、发布者显示名称和图像资源。
5. 将两个 MSIX 合并为一个 MSIXBundle。

## 构建命令与产物

在仓库根目录运行：

```powershell
pnpm run build:desktop:microsoft-store
```

默认产物：

```text
packages/app_tauri/target/microsoft-store/1999WallpaperArchive_<四段版本>_x64_arm64.msixbundle
```

例如：

```text
packages/app_tauri/target/microsoft-store/1999WallpaperArchive_0.1.9.0_x64_arm64.msixbundle
```

上传前必须确认版本号高于 Partner Center 中已提交的版本。Microsoft Store 不允许使用相同或更低的包版本覆盖已提交版本。

## AppxManifest 必填内容

每个架构的 manifest 必须包含：

- Partner Center 分配的 `Identity Name` 和 `Publisher`。
- 四段数字版本号。
- 正确的 `ProcessorArchitecture`：`x64` 或 `arm64`。
- `PublisherDisplayName`，并与 Partner Center 完全一致。
- 至少一种受支持语言：

  ```xml
  <Resources>
    <Resource Language="zh-CN" />
  </Resources>
  ```

- 仅声明桌面设备系列：

  ```xml
  <TargetDeviceFamily Name="Windows.Desktop" ... />
  ```

- 桌面应用入口：`Windows.FullTrustApplication`。
- `runFullTrust` 能力。
- 实际存在于包内的 Logo 文件。

## 已遇到的商店验证问题

### 找不到 Logo、PublisherDisplayName 为空、默认语言无效

曾同时出现以下错误：

- 找不到 `Assets\StoreLogo.png`、`Square44x44Logo.png`、`Square150x150Logo.png`。
- `PublisherDisplayName` 被商店解析为空。
- 没有声明受支持语言，默认语言不受支持。

实际 MSIX 中已经包含三个 PNG。根因是 manifest 没有声明语言，商店无法正确建立资源上下文，进而连带导致发布者名称和图像资源解析失败。

修复方式是在 manifest 中增加 `zh-CN` 的 `<Resources>` 声明。构建脚本现已在生成 Bundle 前解包两个 MSIX，并验证：

- `PublisherDisplayName` 等于 `默默(muxidream)`。
- 语言等于 `zh-CN`。
- 三个 Logo 文件实际存在。

### runFullTrust 警告

`runFullTrust` 是 Tauri Win32 桌面应用正常运行所需的受限能力。商店提示需要申请批准属于警告，但仍需要在 Partner Center 中填写用途说明。

建议说明：

> 本应用是使用 Tauri 构建的 Windows 桌面壁纸档案管理和下载应用，需要以完全信任的 Win32 桌面进程运行，以执行桌面窗口、文件保存和网络下载等核心功能。

不要从 manifest 中删除 `runFullTrust`；删除后应用入口与 Tauri 桌面进程模型不匹配。

## 其他注意事项

- 商店包通常交由 Microsoft Store 签名，本地生成的上传包无需使用个人证书签名。
- 不要把普通 NSIS/MSI 配置误当成 MSIXBundle 配置；Tauri CLI 的 Windows bundle target 目前只提供 `msi` 和 `nsis`。
- Logo 的路径、大小写和文件名必须与 manifest 完全一致。
- `PublisherDisplayName` 包含中文，脚本需以 UTF-8 写入 manifest；当前脚本使用无 BOM UTF-8。
- 构建 Windows 前端时，自动组件声明文件可能被生成器改写。不要把与商店打包无关的生成差异混入提交，应先检查 `git status` 和 `git diff`。
- 上传前保留最终构建日志，重点确认两个单架构 MSIX 均显示 `Package creation succeeded`，最后显示 `Bundle creation succeeded`。
