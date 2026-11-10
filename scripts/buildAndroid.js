// 构建 Android 安装包并按架构归档
// 每次 tauri android build 都会重建同一个 gradle 变体目录，后一次构建会清掉前一次的 APK，
// 因此构建完成后立即把产物复制到 packages/app_tauri/target/android 保留

import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, "..")
const tauriDir = resolve(rootDir, "packages/app_tauri")

/** 支持的构建目标，与 tauri android build 的 --target 取值一致 */
const SUPPORTED_TARGETS = ["aarch64", "armv7", "i686", "x86_64"]

/** gradle 输出的 release APK 所在目录 */
const apkOutputDir = resolve(tauriDir, "gen/android/app/build/outputs/apk/universal/release")

/** 归档目录，避免被下一次构建清理 */
const archiveDir = resolve(tauriDir, "target/android")

/**
 * 输出错误信息并以非零码退出
 * @param message - 错误描述
 */
const fail = (message) => {
  console.error(`[buildAndroid] ❌ ${message}`)
  process.exit(1)
}

/**
 * 解析 --target 参数
 * @param argv - 进程参数
 * @returns 目标架构
 */
const parseTarget = (argv) => {
  const index = argv.indexOf("--target")
  const value = index >= 0 ? argv[index + 1] : undefined
  if (!value) fail(`缺少 --target 参数，可选: ${SUPPORTED_TARGETS.join(" / ")}`)
  if (!SUPPORTED_TARGETS.includes(value)) fail(`未知的构建目标: ${value}，可选: ${SUPPORTED_TARGETS.join(" / ")}`)
  return value
}

/**
 * 计算文件 MD5，上传 release 时作为 file_hash
 * @param filePath - 文件路径
 * @returns 小写 MD5
 */
const md5Of = (filePath) => createHash("md5").update(readFileSync(filePath)).digest("hex")

/**
 * 找到本次构建产出的 APK：gradle 变体目录内最新的 .apk
 * @returns APK 绝对路径
 */
const findBuiltApk = () => {
  if (!existsSync(apkOutputDir)) fail(`未找到构建输出目录: ${relative(rootDir, apkOutputDir)}`)

  const apks = readdirSync(apkOutputDir)
    .filter((name) => name.toLowerCase().endsWith(".apk"))
    .map((name) => join(apkOutputDir, name))
    .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs)

  if (!apks.length) fail(`构建输出目录中没有 APK: ${relative(rootDir, apkOutputDir)}`)
  return apks[0]
}

const target = parseTarget(process.argv.slice(2))

console.log(`[buildAndroid] 构建目标: ${target}`)
// --apk：只出安装包。不加时 tauri 会同时构建 AAB，而本项目分发走自有更新接口，AAB 用不到
const build = spawnSync(
  "pnpm",
  ["-F", "app_tauri", "tauri", "android", "build", "--config", "tauri.android.conf.json", "--target", target, "--apk"],
  {
    cwd: rootDir,
    stdio: "inherit",
    shell: true,
  }
)
if (build.status !== 0) fail(`tauri android build 失败，退出码 ${build.status ?? "unknown"}`)

const apkPath = findBuiltApk()
mkdirSync(archiveDir, { recursive: true })
const archivedPath = join(archiveDir, apkPath.split(/[\\/]/).pop())
copyFileSync(apkPath, archivedPath)

const { size } = statSync(archivedPath)
console.log(`[buildAndroid] ✅ ${relative(rootDir, archivedPath)}`)
console.log(`[buildAndroid] 目标架构: ${target}，文件大小: ${size} 字节，MD5: ${md5Of(archivedPath)}`)
