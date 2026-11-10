/** 受支持的设备架构，与后端 AppArchitectureEnum 保持一致 */
export const AppArch = {
  /** 64 位 x86：PC / Intel Mac / x64 模拟器 */
  X86_64: "x86_64",
  /** 32 位 x86：老 PC / x86 模拟器 */
  I686: "i686",
  /** 64 位 ARM：手机、Apple Silicon / arm64-v8a */
  AARCH64: "aarch64",
  /** 32 位 ARM：老设备 */
  ARMV7: "armv7",
} as const

/** 设备架构取值 */
export type AppArchValue = (typeof AppArch)[keyof typeof AppArch]

/** 无架构平台（如 web）使用的占位值 */
export const APP_ARCH_UNIVERSAL = "universal"

/** 架构别名到项目架构值的映射，兼容 plugin-os、Node 与打包工具链的不同命名 */
const ARCH_ALIASES: Record<string, AppArchValue> = {
  amd64: AppArch.X86_64,
  x64: AppArch.X86_64,
  "x86-64": AppArch.X86_64,
  x86_64: AppArch.X86_64,
  x86: AppArch.I686,
  i386: AppArch.I686,
  i686: AppArch.I686,
  ia32: AppArch.I686,
  arm64: AppArch.AARCH64,
  "arm64-v8a": AppArch.AARCH64,
  aarch64: AppArch.AARCH64,
  arm: AppArch.ARMV7,
  armv7: AppArch.ARMV7,
  armv7l: AppArch.ARMV7,
  "armeabi-v7a": AppArch.ARMV7,
}

/** 架构展示文案，与 Android ABI 口径对齐，便于对照安装包文件名 */
const ARCH_LABELS: Record<AppArchValue | typeof APP_ARCH_UNIVERSAL, string> = {
  [AppArch.X86_64]: "x86_64",
  [AppArch.I686]: "x86（i686）",
  [AppArch.AARCH64]: "arm64-v8a（aarch64）",
  [AppArch.ARMV7]: "armeabi-v7a（armv7）",
  [APP_ARCH_UNIVERSAL]: APP_ARCH_UNIVERSAL,
}

/**
 * 归一化运行期架构取值
 * @param raw - plugin-os 等来源返回的原始架构
 * @returns 项目架构值；无法识别时返回 null，由调用方提示暂未支持
 */
export const normalizeAppArch = (raw: string): AppArchValue | null => ARCH_ALIASES[raw.trim().toLowerCase()] ?? null

/**
 * 架构展示文案
 * @param arch - 接口返回或本地归一化后的架构值
 * @returns 展示文案；未知取值原样返回
 */
export const formatAppArch = (arch: string): string => ARCH_LABELS[arch as AppArchValue] ?? arch
