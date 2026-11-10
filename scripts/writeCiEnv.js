// 为 CI 生成前端环境变量文件
// packages/app_windows、packages/app_android 的 .env / .env.production 全部不入库，
// 打包前必须按平台从环境变量重建，否则产物里接口地址为空
//
// 用法：node scripts/writeCiEnv.js <windows|android>

import { appendFileSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, "..")
const tauriDir = resolve(rootDir, "packages/app_tauri")

/** 平台到前端目录名的映射 */
const PLATFORMS = { windows: "app_windows", android: "app_android" }

/** 构建期必须存在的公共变量，缺失时产物会指向空地址 */
const REQUIRED_VARS = ["VITE_APP_BASE_API", "VITE_OSS_URL", "VITE_OSS_THUMBNAIL_URL", "VITE_OSS_1999_PREVIEW_URL"]

/**
 * 输出错误信息并以非零码退出
 * @param message - 错误描述
 */
const fail = (message) => {
  console.error(`[writeCiEnv] ❌ ${message}`)
  process.exit(1)
}

/**
 * 读取 tauri 平台配置里的安装包版本号
 * 版本号以 tauri.<platform>.conf.json 为准，避免 VITE_APP_VERSION 与安装包版本不一致导致更新比对出错
 * @param platform - 平台标识
 * @returns 三段式版本号
 */
const readVersion = (platform) => {
  const configPath = resolve(tauriDir, `tauri.${platform}.conf.json`)
  const { version } = JSON.parse(readFileSync(configPath, "utf8"))
  if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) fail(`${relative(rootDir, configPath)} 中的 version 不是三段式版本号: ${version}`)
  return version
}

const platform = process.argv[2]
if (!PLATFORMS[platform]) fail(`缺少或未知的平台参数: ${platform ?? "(空)"}，可选: ${Object.keys(PLATFORMS).join(" / ")}`)

const version = readVersion(platform)

// tag 发布时校验 tag 与安装包版本一致，版本没 bump 就发布会让更新链路拿到错误版本
const tag = process.env.GITHUB_REF_TYPE === "tag" ? (process.env.GITHUB_REF_NAME ?? "") : ""
if (tag && tag !== `v${version}`) {
  fail(`tag ${tag} 与 ${platform} 安装包版本 v${version} 不一致，先执行 pnpm updateVersion 再打 tag`)
}

const missing = REQUIRED_VARS.filter((name) => !process.env[name])
if (missing.length) fail(`缺少环境变量: ${missing.join(", ")}`)

const storeVersion = process.env.VITE_STORE_VERSION ?? ""
const targetDir = resolve(rootDir, "packages", PLATFORMS[platform])

// .env：模式无关的版本信息，对应 .env.template
const baseEnv = ["# 由 CI 生成，勿手工编辑", `VITE_APP_VERSION=${version}`, `VITE_STORE_VERSION=${storeVersion}`, ""].join("\n")

// .env.production：生产环境接口与设备类型，对应 .env.production.template
const productionEnv = [
  "# 由 CI 生成，勿手工编辑",
  "",
  "# 主要IP地址",
  `VITE_APP_BASE_API=${process.env.VITE_APP_BASE_API}`,
  "# 存储基地址",
  `VITE_OSS_URL=${process.env.VITE_OSS_URL}`,
  "# 缩略图存储地址",
  `VITE_OSS_THUMBNAIL_URL=${process.env.VITE_OSS_THUMBNAIL_URL}`,
  "# 以影像之缩略图存储地址",
  `VITE_OSS_1999_PREVIEW_URL=${process.env.VITE_OSS_1999_PREVIEW_URL}`,
  "# 设备类型",
  `VITE_APP_DEVICE='${platform}'`,
  "",
].join("\n")

writeFileSync(join(targetDir, ".env"), baseEnv, "utf8")
writeFileSync(join(targetDir, ".env.production"), productionEnv, "utf8")

// 供后续步骤给产物命名使用（GitHub Actions 的 $GITHUB_ENV 文件）
if (process.env.GITHUB_ENV) appendFileSync(process.env.GITHUB_ENV, `APP_VERSION=${version}\n`, "utf8")

console.log(`[writeCiEnv] ✅ ${PLATFORMS[platform]} 版本 ${version}，接口 ${process.env.VITE_APP_BASE_API}`)
