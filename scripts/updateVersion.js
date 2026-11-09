// 自动更新多个项目 package.json
// 以及 src-tauri/tauri.conf.json 的版本号
// 以 tauri.conf.json 的版本号作为唯一基准
// 支持按三段式（x.y.z）选择递增位：--major / --minor / --patch，缺省递增 patch

import fs from "fs"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"

import { InvalidArgumentError, program } from "commander"
import dotenv from "dotenv"
import semver from "semver"

const __dirname = dirname(fileURLToPath(import.meta.url))

/** 支持递增的版本位（按高位到低位排列） */
const VERSION_PARTS = ["major", "minor", "patch"]

/** 版本号必须为三段式纯数字，tauri / Windows 打包均不接受 prerelease */
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/

program
  .version("1.0.0")
  .option("-v, --version-tag <version>", "指定目标版本号（优先级高于递增选项）", (value) => {
    // 使用 semver 校验并清理版本号（例如 'v1.2.0' 会被转为 '1.2.0'）
    const cleanVersion = semver.clean(value)
    if (!cleanVersion || !VERSION_PATTERN.test(cleanVersion)) {
      throw new InvalidArgumentError(`版本号格式不合法: "${value}"，版本号必须是 x.y.z 三段式数字（如 1.0.0）`)
    }
    return cleanVersion // 返回校验通过后的值，后续获取到的就是干净的版本号
  })
  .option("--major", "递增主版本号（0.2.3 -> 1.0.0）")
  .option("--minor", "递增次版本号（0.2.3 -> 0.3.0）")
  .option("--patch", "递增修订号（0.2.3 -> 0.2.4），不传递增选项时的默认行为")
  .option("--dry-run", "仅预览将写入的版本号，不修改任何文件")
  .parse(process.argv)

const options = program.opts()

/**
 * 输出错误信息并以非零码退出
 * @param message - 错误描述
 */
function fail(message) {
  console.error(`[updateVersion] ❌ ${message}`)
  process.exit(1)
}

/**
 * 解析递增位：--major / --minor / --patch 最多只能选择一个
 * @returns 递增位名称，未指定时为 patch
 */
function resolveVersionPart() {
  const selectedParts = VERSION_PARTS.filter((part) => options[part])

  if (selectedParts.length > 1) {
    fail(`--major / --minor / --patch 只能选择一个，当前同时传入: ${selectedParts.map((part) => `--${part}`).join(" ")}`)
  }

  return selectedParts[0] ?? "patch"
}

/**
 * 校验版本号是否为三段式纯数字
 * @param version - 待校验的版本号
 * @param source - 版本号来源，用于错误提示
 * @returns 校验通过的版本号
 */
function validateVersion(version, source) {
  if (typeof version !== "string" || !VERSION_PATTERN.test(version)) {
    fail(`版本号格式不合法: "${version}"（来自 ${source}），版本号必须是 x.y.z 三段式数字`)
  }

  return version
}

/**
 * 读取 JSON 文件
 * @param filePath - 文件路径
 * @returns JSON 对象
 */
function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"))
}

/**
 * 写入 JSON 文件，格式化为 2 个空格缩进
 * @param filePath - 文件路径
 * @param data - 数据对象
 */
function writeJson(filePath, data) {
  if (options.dryRun) {
    return
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8")
}

/**
 * ============================================================
 * 配置
 * ============================================================
 */

// Tauri 配置文件
const tauriConfPath = resolve(__dirname, "../packages/app_tauri/tauri.conf.json")

// 需要同步版本号的 package.json
const packageJsonPaths = [
  resolve(__dirname, "../packages/app_android/package.json"),
  resolve(__dirname, "../packages/app_windows/package.json"),
  resolve(__dirname, "../packages/app_web/package.json"),
]

/**
 * .env
 */
const envPaths = [
  resolve(__dirname, "../packages/app_android/.env"),
  resolve(__dirname, "../packages/app_windows/.env"),
  resolve(__dirname, "../packages/app_web/.env"),
]

const targetVersion = options.versionTag
const versionPart = resolveVersionPart()

if (targetVersion) {
  console.log(`[updateVersion] 接收到的目标版本号是: ${targetVersion}`)

  if (versionPart !== "patch") {
    console.warn(`[updateVersion] 已指定目标版本号，忽略递增选项 --${versionPart}`)
  }
} else {
  console.log("[updateVersion] 可通过 -v 或 --version-tag 传入目标版本号")
  console.log("[updateVersion] 未接收到传入版本号，将基于 tauri.conf.json 的版本号递增")
}

if (options.dryRun) {
  console.log("[updateVersion] 当前为 --dry-run 预览模式，不会修改任何文件")
}

/**
 * ============================================================
 * 1. 读取 Tauri 版本号
 * ============================================================
 */

if (!fs.existsSync(tauriConfPath)) {
  fail(`未找到 tauri.conf.json: ${tauriConfPath}`)
}

const tauriConf = readJson(tauriConfPath)

// Tauri 2 一般直接使用 version
const currentVersion = validateVersion(tauriConf.version ?? tauriConf.package?.version, "tauri.conf.json 的 version")

console.log(`[updateVersion] 当前 Tauri 版本: ${currentVersion}`)

/**
 * ============================================================
 * 2. 计算新版本号
 * ============================================================
 */

let newVersion = targetVersion

if (!newVersion) {
  // semver.inc 天然满足 SemVer 语义：递增高位时低位归零，且段内不限位数（0.2.9 -> 0.2.10）
  newVersion = semver.inc(currentVersion, versionPart)

  if (!newVersion) {
    fail(`无法基于 ${currentVersion} 递增 ${versionPart}，请检查版本号`)
  }

  console.log(`[updateVersion] 递增位: ${versionPart}`)
}

console.log(`[updateVersion] 新版本号: ${newVersion}${options.dryRun ? "（预览）" : ""}`)

/**
 * ============================================================
 * 3. 更新 tauri.conf.json
 * ============================================================
 */

if (tauriConf.version !== undefined) {
  tauriConf.version = newVersion
} else if (tauriConf.package) {
  tauriConf.package.version = newVersion
} else {
  fail(`tauri.conf.json 中不存在 version 字段`)
}

writeJson(tauriConfPath, tauriConf)

console.log(`[updateVersion] tauri.conf.json 版本号${options.dryRun ? "将" : "已"}更新为: ${newVersion}`)

/**
 * ============================================================
 * 4. 更新所有 package.json
 * ============================================================
 */

for (const packageJsonPath of packageJsonPaths) {
  if (!fs.existsSync(packageJsonPath)) {
    console.warn(`[updateVersion] 未找到 package.json，跳过: ${packageJsonPath}`)

    continue
  }

  const packageJson = readJson(packageJsonPath)

  packageJson.version = newVersion

  writeJson(packageJsonPath, packageJson)

  console.log(`[updateVersion] ${packageJsonPath} 版本号${options.dryRun ? "将" : "已"}更新为: ${newVersion}`)
}

/**
 * ============================================================
 * 5. 更新 .env 中的 VITE_APP_VERSION
 * ============================================================
 */

for (const envPath of envPaths) {
  let envConfig = {}

  if (fs.existsSync(envPath)) {
    const envFileContent = fs.readFileSync(envPath, "utf-8")

    envConfig = dotenv.parse(envFileContent)
  }

  envConfig.VITE_APP_VERSION = newVersion

  if (!options.dryRun) {
    const updatedEnvContent = Object.entries(envConfig)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n")

    fs.writeFileSync(envPath, updatedEnvContent + "\n", "utf-8")
  }

  console.log(`[updateVersion] ${envPath} 的 VITE_APP_VERSION ${options.dryRun ? "将" : "已"}更新为: ${newVersion}`)
}

if (options.dryRun) {
  console.log(`\n[updateVersion] 🔍 预览完成，未写入任何文件，目标版本号为 ${newVersion}`)
} else {
  console.log(`\n[updateVersion] ✅ 所有项目版本号已更新为 ${newVersion}`)
}
