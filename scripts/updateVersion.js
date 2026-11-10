// 按端更新版本号
// 无参数且为交互终端时进入向导；带参数时保持命令行模式
// 安装包版本由 tauri.windows.conf.json / tauri.android.conf.json 承载，tauri.conf.json 仅作为 Tauri 2 壳版本

import fs from "fs"
import { dirname, relative, resolve } from "path"
import { fileURLToPath } from "url"

import { InvalidArgumentError, program } from "commander"
import dotenv from "dotenv"
import semver from "semver"

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, "..")
const tauriDir = resolve(rootDir, "packages/app_tauri")

/** 支持递增的版本位（按高位到低位排列） */
const VERSION_PARTS = ["major", "minor", "patch"]

/** 版本号必须为三段式纯数字，tauri / Windows 打包均不接受 prerelease */
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/

/** 默认发布的端；tauri 为壳版本，需显式选择 */
const DEFAULT_TARGETS = ["windows", "android", "web"]

/**
 * 将绝对路径转换为仓库相对路径，便于日志阅读
 * @param filePath - 绝对路径
 * @returns 以 / 分隔的相对路径
 */
const displayPath = (filePath) => relative(rootDir, filePath).replaceAll("\\", "/")

/*
 * 发布目标注册表：以数据描述每个可独立发版的端。
 * writers 中每项形如 { path, kind: "json" | "env", key }，
 * 同一端的所有 writers 始终写入同一个版本号，新增端只需追加一条配置。
 */
const VERSION_TARGETS = [
  {
    id: "windows",
    label: "Windows 桌面端",
    hint: "安装包 / updater / 设置页",
    defaultSelected: true,
    writers: [
      { path: resolve(rootDir, "packages/app_windows/.env"), kind: "env", key: "VITE_APP_VERSION" },
      { path: resolve(rootDir, "packages/app_windows/package.json"), kind: "json", key: "version" },
      { path: resolve(tauriDir, "tauri.windows.conf.json"), kind: "json", key: "version" },
    ],
  },
  {
    id: "android",
    label: "Android 端",
    hint: "安装包 / 应用内更新",
    defaultSelected: true,
    writers: [
      { path: resolve(rootDir, "packages/app_android/.env"), kind: "env", key: "VITE_APP_VERSION" },
      { path: resolve(rootDir, "packages/app_android/package.json"), kind: "json", key: "version" },
      { path: resolve(tauriDir, "tauri.android.conf.json"), kind: "json", key: "version" },
    ],
  },
  {
    id: "web",
    label: "Web 端",
    hint: "设置页展示版本",
    defaultSelected: true,
    writers: [
      { path: resolve(rootDir, "packages/app_web/.env"), kind: "env", key: "VITE_APP_VERSION" },
      { path: resolve(rootDir, "packages/app_web/package.json"), kind: "json", key: "version" },
    ],
  },
  {
    id: "tauri",
    label: "Tauri 2 壳版本",
    hint: "仅底层框架变动时升级，不参与各端安装包",
    defaultSelected: false,
    writers: [{ path: resolve(tauriDir, "tauri.conf.json"), kind: "json", key: "version" }],
  },
]

const TARGET_IDS = VERSION_TARGETS.map((target) => target.id)

/**
 * 输出错误信息并以非零码退出
 * @param message - 错误描述
 */
function fail(message) {
  console.error(`[updateVersion] ❌ ${message}`)
  process.exit(1)
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
 * 校验并清理命令行传入的目标版本号
 * @param value - 原始输入
 * @returns 清理后的三段式版本号
 */
function parseVersionTag(value) {
  const cleanVersion = semver.clean(value)
  if (!cleanVersion || !VERSION_PATTERN.test(cleanVersion)) {
    throw new InvalidArgumentError(`版本号格式不合法: "${value}"，版本号必须是 x.y.z 三段式数字（如 1.0.0）`)
  }
  return cleanVersion
}

/**
 * 收集 --platform，可重复传入
 * @param value - 端标识
 * @param previous - 已收集的端标识
 * @returns 累加后的端标识数组
 */
function collectPlatform(value, previous) {
  if (!TARGET_IDS.includes(value)) {
    throw new InvalidArgumentError(`未知的发布端: "${value}"，可选: ${TARGET_IDS.join(" / ")}`)
  }
  return [...previous, value]
}

program
  .version("1.0.0")
  .option("-v, --version-tag <version>", "指定目标版本号（优先级高于递增选项）", parseVersionTag)
  .option("--major", "递增主版本号（0.2.3 -> 1.0.0）")
  .option("--minor", "递增次版本号（0.2.3 -> 0.3.0）")
  .option("--patch", "递增修订号（0.2.3 -> 0.2.4），不传递增选项时的默认行为")
  .option("-p, --platform <id>", `指定要发布的端，可重复传入（${TARGET_IDS.join(" / ")}），默认 ${DEFAULT_TARGETS.join(",")}`, collectPlatform, [])
  .option("--dry-run", "仅预览将写入的版本号，不修改任何文件")
  .parse(process.argv)

const options = program.opts()

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
 * @param dryRun - 为 true 时不落盘
 */
function writeJson(filePath, data, dryRun) {
  if (dryRun) {
    return
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8")
}

/**
 * 读取某个写入目标的当前值；文件不存在或字段缺失时返回 undefined
 * @param writer - 写入目标描述
 * @returns 当前值，缺失时为 undefined
 */
function readWriterValue(writer) {
  if (!fs.existsSync(writer.path)) {
    return undefined
  }

  if (writer.kind === "json") {
    return readJson(writer.path)[writer.key]
  }

  return dotenv.parse(fs.readFileSync(writer.path, "utf-8"))[writer.key]
}

/**
 * 只替换 .env 中指定键所在行，保留其余行、注释、BOM 与换行风格
 * key 来自受控常量，不含正则元字符
 * @param filePath - .env 文件路径
 * @param key - 环境变量名
 * @param version - 目标版本号
 * @returns 替换后的完整文件内容
 */
function buildEnvContent(filePath, key, version) {
  const original = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8") : ""
  const bom = original.startsWith("\uFEFF") ? "\uFEFF" : ""
  const body = bom ? original.slice(1) : original
  const newline = body.includes("\r\n") ? "\r\n" : "\n"
  const lines = body.split(/\r?\n/)
  const pattern = new RegExp(`^\\s*(?:export\\s+)?${key}\\s*=`)
  let replaced = false

  const nextLines = lines.map((line) => {
    if (replaced || !pattern.test(line)) {
      return line
    }

    replaced = true
    return `${key}=${version}`
  })

  if (!replaced) {
    const insertAt = nextLines.length > 0 && nextLines[nextLines.length - 1] === "" ? nextLines.length - 1 : nextLines.length
    nextLines.splice(insertAt, 0, `${key}=${version}`)
  }

  let content = bom + nextLines.join(newline)
  if (!replaced && !content.endsWith("\n")) {
    content += newline
  }

  return content
}

/**
 * 检查某个端的所有版本记录，供向导展示与一致性校验
 * @param target - 发布目标
 * @returns 已找到的记录、去重后的版本列表、以及唯一版本号（冲突时为 null）
 */
function inspectTarget(target) {
  const found = []
  for (const writer of target.writers) {
    const value = readWriterValue(writer)
    if (value !== undefined && String(value).trim() !== "") {
      found.push({ path: displayPath(writer.path), value: String(value) })
    }
  }

  const versions = [...new Set(found.map((item) => item.value))]
  const current = versions.length === 1 ? versions[0] : null

  return { found, versions, current }
}

/**
 * 按动作计算各目标的新版本号；patch 分端独立，其余动作全局对齐
 * @param targetIds - 选中的端标识
 * @param action - 版本动作
 * @param currentOf - 读取指定端当前版本的回调
 * @param customVersion - action 为 custom 时的目标版本号
 * @returns 以端标识为键、新版本号为值的映射
 */
function resolveTargetVersions(targetIds, action, currentOf, customVersion) {
  const result = {}

  if (action === "custom") {
    for (const id of targetIds) {
      result[id] = customVersion
    }
    return result
  }

  if (action === "patch") {
    for (const id of targetIds) {
      const next = semver.inc(currentOf(id), "patch")
      if (!next) {
        fail(`无法基于 ${currentOf(id)} 递增 patch，请检查版本号`)
      }
      result[id] = next
    }
    return result
  }

  const baseline = targetIds.map(currentOf).reduce((max, version) => (semver.gt(version, max) ? version : max), "0.0.0")
  const next = semver.inc(baseline, action)
  if (!next) {
    fail(`无法基于 ${baseline} 递增 ${action}，请检查版本号`)
  }

  for (const id of targetIds) {
    result[id] = next
  }
  return result
}

/**
 * 解析命令行模式的选项
 * @returns 归一化后的选项对象
 */
function resolveCliOptions() {
  const selectedParts = VERSION_PARTS.filter((part) => options[part])

  if (selectedParts.length > 1) {
    fail(`--major / --minor / --patch 只能选择一个，当前同时传入: ${selectedParts.map((part) => `--${part}`).join(" ")}`)
  }

  const part = selectedParts[0]
  if (options.versionTag && part) {
    console.warn(`[updateVersion] 已指定目标版本号，忽略递增选项 --${part}`)
  }

  return {
    action: options.versionTag ? "custom" : (part ?? "patch"),
    customVersion: options.versionTag,
    targetIds: options.platform.length > 0 ? [...new Set(options.platform)] : [...DEFAULT_TARGETS],
    dryRun: Boolean(options.dryRun),
  }
}

/**
 * 生成「当前 → 目标」对照文本
 * @param targetIds - 选中的端标识
 * @param inspection - 各端版本记录
 * @param newVersions - 各端目标版本号
 * @returns 多行对照文本
 */
function formatPlan(targetIds, inspection, newVersions) {
  return targetIds
    .map((id) => {
      const target = VERSION_TARGETS.find((item) => item.id === id)
      return `  ${target.label.padEnd(14, " ")} ${inspection[id].current} → ${newVersions[id]}`
    })
    .join("\n")
}

/**
 * 交互式向导：选择端、版本动作、预览模式，并在写入前确认
 * @param inspection - 各端版本记录
 * @returns 归一化后的选项对象
 */
async function runWizard(inspection) {
  const p = await import("@clack/prompts")

  /**
   * 统一处理向导取消
   * @param value - 向导返回值
   * @returns 非取消时的值
   */
  const guard = (value) => {
    if (p.isCancel(value)) {
      p.cancel("已取消，未写入任何文件")
      process.exit(0)
    }
    return value
  }

  p.intro("[updateVersion] 版本号发布向导")

  const describe = (id) => {
    const info = inspection[id]
    if (info.current) {
      return `当前 ${info.current}`
    }
    return info.versions.length > 0 ? `版本冲突: ${info.versions.join(" / ")}` : "未设置版本号"
  }

  const targetIds = guard(
    await p.multiselect({
      message: "选择本次要发布的端（空格切换，回车确认）",
      options: VERSION_TARGETS.map((target) => ({
        value: target.id,
        label: target.label,
        hint: `${describe(target.id)} · ${target.hint}`,
      })),
      initialValues: VERSION_TARGETS.filter((target) => target.defaultSelected).map((target) => target.id),
      required: true,
    })
  )

  const action = guard(
    await p.select({
      message: "选择版本动作",
      options: [
        { value: "patch", label: "递增修订号 patch", hint: "各端基于自身版本独立递增，适合分端修复" },
        { value: "minor", label: "递增次版本号 minor", hint: "取选中端最高版本统一对齐，适合功能发布" },
        { value: "major", label: "递增主版本号 major", hint: "取选中端最高版本统一对齐，适合大版本发布" },
        { value: "custom", label: "指定目标版本号", hint: "手动输入 x.y.z，写入所有选中端" },
      ],
      initialValue: "patch",
    })
  )

  let customVersion
  if (action === "custom") {
    const input = guard(
      await p.text({
        message: "输入目标版本号（x.y.z 三段式数字）",
        placeholder: "0.3.0",
        validate: (value) => {
          const cleaned = semver.clean(value ?? "")
          return cleaned && VERSION_PATTERN.test(cleaned) ? undefined : "版本号必须是 x.y.z 三段式数字，如 0.3.0"
        },
      })
    )
    customVersion = parseVersionTag(input)
  }

  const dryRun = guard(
    await p.confirm({
      message: "仅预览而不写入文件？",
      initialValue: false,
    })
  )

  return { action, customVersion, targetIds, dryRun, wizard: p }
}

/**
 * 主流程：选项采集 → 版本计算 → 预览确认 → 写入
 */
async function main() {
  const inspection = Object.fromEntries(VERSION_TARGETS.map((target) => [target.id, inspectTarget(target)]))
  const hasCliArgs = process.argv.slice(2).length > 0
  const useWizard = !hasCliArgs && Boolean(process.stdin.isTTY)

  if (!hasCliArgs && !process.stdin.isTTY) {
    fail("非交互终端且未提供参数，请显式指定 --platform / --patch / -v 等参数（可用 --dry-run 预览）")
  }

  const choices = useWizard ? await runWizard(inspection) : resolveCliOptions()
  const { action, customVersion, targetIds, dryRun } = choices

  for (const id of targetIds) {
    const info = inspection[id]
    if (!info.current) {
      const detail = info.found.map((item) => `    ${item.path} = ${item.value}`).join("\n")
      fail(`发布端 ${id} 的版本记录不一致或未设置：\n${detail || "    未找到任何版本记录"}\n` + "请先用 -v 指定目标版本号统一，或手动对齐后重试")
    }
    validateVersion(info.current, `发布端 ${id} 的版本记录`)
  }

  const newVersions = resolveTargetVersions(targetIds, action, (id) => inspection[id].current, customVersion)
  const planText = formatPlan(targetIds, inspection, newVersions)

  if (choices.wizard) {
    choices.wizard.note(planText, dryRun ? "预览（不会写入任何文件）" : "即将写入以下版本号")
    const answer = await choices.wizard.confirm({ message: dryRun ? "生成预览？" : "确认写入以上版本号？", initialValue: false })
    if (choices.wizard.isCancel(answer) || !answer) {
      choices.wizard.cancel("已取消，未写入任何文件")
      return
    }
  } else {
    console.log(`[updateVersion] 版本动作: ${action}`)
    console.log(`[updateVersion] 发布端: ${targetIds.join(", ")}`)
    console.log(`[updateVersion] ${dryRun ? "预览" : "写入"}计划:\n${planText}`)
    if (dryRun) {
      console.log("[updateVersion] 当前为 --dry-run 预览模式，不会修改任何文件")
    }
  }

  const written = []
  for (const id of targetIds) {
    const target = VERSION_TARGETS.find((item) => item.id === id)
    const version = validateVersion(newVersions[id], `发布端 ${id} 的目标版本号`)

    for (const writer of target.writers) {
      if (writer.kind === "json") {
        if (!fs.existsSync(writer.path)) {
          fail(`未找到文件: ${displayPath(writer.path)}`)
        }
        const data = readJson(writer.path)
        data[writer.key] = version
        writeJson(writer.path, data, dryRun)
      } else {
        const content = buildEnvContent(writer.path, writer.key, version)
        if (!dryRun) {
          fs.writeFileSync(writer.path, content, "utf-8")
        }
      }

      written.push({ path: displayPath(writer.path), key: writer.key, version })
      console.log(`[updateVersion] ${displayPath(writer.path)} 的 ${writer.key} ${dryRun ? "将" : "已"}更新为: ${version}`)
    }
  }

  if (dryRun) {
    console.log(`\n[updateVersion] 🔍 预览完成，未写入任何文件，共 ${written.length} 处待更新`)
  } else {
    console.log(`\n[updateVersion] ✅ 已完成 ${targetIds.length} 个发布端、${written.length} 处版本号更新`)
  }

  if (targetIds.includes("android")) {
    console.log(
      "[updateVersion] 提示: gen/android/app/tauri.properties 由 Tauri CLI 生成，下次 tauri android build 会重算 versionName / versionCode，请核对 versionCode 递增"
    )
  }

  if (choices.wizard) {
    choices.wizard.outro(dryRun ? "预览完成" : "版本号更新完成")
  }
}

await main()
