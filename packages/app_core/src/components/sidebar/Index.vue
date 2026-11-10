<script setup lang="ts">
import { AppWindow, Component, Download, Globe, Moon, RefreshCcw, Smartphone, Sun } from "@lucide/vue"
import dayjs from "dayjs"
import { useRouter, useRoute } from "vue-router"

import { openUrl, setStatusBar } from "@app/core/adapters/utils"
import { formatAppArch } from "@app/core/apis/app/arch"
import { AppLatestVersion } from "@app/core/apis/app/type"
import AppSidebar from "@app/core/components/sidebar/components/AppSideBar.vue"
import useDevice from "@app/core/hooks/useDevice"
import useSystem from "@app/core/hooks/useSystem"
import useTheme from "@app/core/hooks/useTheme"
import { ThemeMode } from "@app/core/types/system"
import { refreshPage } from "@app/core/utils/common"
import { formatByte } from "@app/core/utils/download"
import { openWebsite } from "@app/core/utils/platform"
import { applyDarkClass } from "@app/core/utils/theme"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@shadcn/ui/breadcrumb"
import { Separator } from "@shadcn/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@shadcn/ui/sidebar/index"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shadcn/ui/tabs"
const { isWeb, isMobile, isDesktop, isTauri } = useDevice()
const route = useRoute()

// 主题与背景图的真值来源：themeMode / backgroundImage 持久化在设置项中，isDark 含 auto 跟随系统
const { themeMode, backgroundImage, isDark: targetDark } = useTheme()
const { changeBG, restoreBG, removeBG, getLatestVersion } = useSystem()

const pageRouteList = computed(() => {
  const list = route.matched
    // 1. 过滤掉没有配置 title 或明确设置了 hide: true 的路由
    .filter((record) => record.meta.title && !record.meta.hide)
    // 2. 映射为面包屑组件需要的数据格式
    .map((record) => ({
      label: String(record.meta.title),
      name: record.name ?? "", // 或者使用 record.fullPath
    }))

  // 父子路由使用同一标题时（/settings 与其默认子路由均为「设置」）只保留最后一级，避免出现「设置 > 设置」
  return list.filter((item, index) => item.label !== list[index + 1]?.label)
})

const jumpTo = (routeName: symbol | string) => {
  const router = useRouter()
  if (routeName) router.push({ name: routeName })
  else console.log("无法跳转到指定路由", routeName)
}

/** 上次已应用的外观，避免仅背景设置变化就重复写 <html> 与调用原生状态栏 */
let lastDark: boolean | undefined

/**
 * 背景任务的兜底日志；具体错误提示由 changeBG 的 toast 负责
 * @param err 捕获到的异常
 */
const onBackgroundError = (err: unknown) => {
  console.warn("背景同步失败", err instanceof Error ? err.message : "未知错误")
}

/**
 * 统一的主题 / 背景编排点。
 * - 深浅色与背景图设置任一变化都会重跑，保证 auto 下系统翻转、设置页按钮操作即时生效
 * - 外观写入是同步的，避免首屏 FOUC；<html> 的 dark class 是 useSystem 判定浅色的真值来源，必须先写
 * - 已存 URL 的重复还原由 useSystem 的 appliedUrl 去重，不会重复预加载或重复请求随机接口
 * @param dark 解析后的目标深色
 * @param bg 持久化的背景图三态（null 从未设置 / "" 主动清除 / URL 已设置）
 */
const applyTheme = (dark: boolean, bg: string | null) => {
  if (dark !== lastDark) {
    lastDark = dark
    // <html> 的 dark class 是 useSystem 判定浅色的真值来源，必须先写
    applyDarkClass(dark)
    setStatusBar(!dark)
  }

  // 深色或用户主动清除过：保持无背景，但不清空 store（切回浅色仍要还原）
  if (dark || bg === "") {
    removeBG()
    return
  }
  // 已有背景图：直接还原，不再请求随机接口
  if (bg) {
    void restoreBG(bg).catch(onBackgroundError)
    return
  }
  // 从未设置：沿用原有随机壁纸流程，成功后由 changeBG 写回 store 并持久化
  void changeBG(true).catch(onBackgroundError)
}

watch([targetDark, backgroundImage], ([dark, bg]) => applyTheme(dark, bg), { immediate: true })

/** 页头按钮：始终翻转「当前生效外观」；auto 态点击即脱离 auto 落到手动模式 */
const toggleDark = () => {
  themeMode.value = targetDark.value ? ThemeMode.light : ThemeMode.dark
}

const buttonLists = computed(() => [
  {
    icon: Sun,
    label: "日间模式",
    // 当前为深色（含 auto 且系统深色）时，显示「切到日间」
    isShow: targetDark.value,
    onClick: toggleDark,
  },
  {
    icon: Moon,
    label: "夜间模式",
    // 当前为浅色（含 auto 且系统浅色）时，显示「切到夜间」
    isShow: !targetDark.value,
    onClick: toggleDark,
  },
  {
    icon: Globe,
    label: "网站",
    isShow: isTauri.value,
    onClick: openWebsite,
  },
  // {
  //   icon: Download,
  //   label: "桌面程序",
  //   isShow: isWeb.value && isDesktop.value,
  //   onClick: refreshPage,
  // },
  // {
  //   icon: Download,
  //   label: "安卓程序",
  //   isShow: isWeb.value && isMobile.value,
  //   onClick: refreshPage,
  // },
  {
    icon: RefreshCcw,
    label: "刷新",
    isShow: isTauri.value,
    onClick: refreshPage,
  },
])

/** 最新的程序版本信息 */
const versionList = ref<AppLatestVersion[]>([])

/** 按平台聚合的版本信息，同一平台的多个架构分别展示，避免出现重复页签 */
const platformVersions = computed(() => {
  const grouped = new Map<string, AppLatestVersion[]>()
  for (const item of versionList.value) {
    const list = grouped.get(item.platform)
    if (list) list.push(item)
    else grouped.set(item.platform, [item])
  }
  return [...grouped].map(([platform, items]) => ({ platform, items }))
})

const open = ref(false)

onMounted(async () => {
  // 组件透明度 / 容器颜色由 App.vue 的 applyStartupSettings() 在首屏同步写回，此处不再重复
  if (isWeb.value) versionList.value = await getLatestVersion()
})
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header
        class="flex shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
        style="height: var(--header-height)"
      >
        <div class="flex items-center gap-2 px-4">
          <SidebarTrigger class="-ml-1" />
          <Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <template v-for="(page, index) in pageRouteList" :key="page.name">
                <BreadcrumbItem v-if="index === pageRouteList.length - 1" @click="jumpTo(page.name)">
                  <BreadcrumbPage>{{ page.label }}</BreadcrumbPage>
                </BreadcrumbItem>
                <template v-else>
                  <BreadcrumbItem class="hidden md:block">
                    <BreadcrumbLink href="#">{{ page.label }}</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator class="hidden md:block" />
                </template>
              </template>
            </BreadcrumbList>
          </Breadcrumb>
          <div class="absolute right-4 flex items-center justify-between">
            <Dialog v-model:open="open">
              <DialogTrigger as-child>
                <Button v-if="isWeb" variant="ghost" size="icon">
                  <Download />
                </Button>
              </DialogTrigger>

              <DialogContent :show-close-button="false" class="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle class="text-center">下载</DialogTitle>
                </DialogHeader>

                <Tabs :default-value="isDesktop ? 'windows' : 'android'" class="text-center">
                  <TabsList class="mx-auto">
                    <TabsTrigger value="windows"> <AppWindow class="mr-2 h-4 w-4" /> Windows </TabsTrigger>
                    <TabsTrigger value="android"> <Smartphone class="mr-2 h-4 w-4" /> Android </TabsTrigger>
                  </TabsList>

                  <TabsContent v-for="group in platformVersions" :key="group.platform" :value="group.platform">
                    <div
                      v-for="item in group.items"
                      :key="`${item.platform}_${item.architecture}`"
                      class="flex flex-col items-center justify-center gap-1 opacity-50"
                    >
                      <Label>版本信息：{{ item.platform }}_{{ formatAppArch(item.architecture) }}_V{{ item.version }}</Label>
                      <Label>发布时间：{{ dayjs(item.publish_time).format("YY-MM-DD HH:mm:ss") }}</Label>
                      <Label>文件大小：{{ formatByte(Number(item.file_size), "MB") }}</Label>
                      <Label class="text-red-500">APP暂未备案，暂不提供分发</Label>
                      <Button :disabled="true" class="m-2" @click="openUrl(item.download_url)">
                        <Download />
                        下载
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
            <template v-for="item in buttonLists" :key="item.label">
              <Button v-if="item.isShow" variant="ghost" size="icon" @click="item.onClick">
                <component :is="item.icon" />
              </Button>
            </template>
          </div>
        </div>
      </header>
      <div class="flex flex-col gap-4 pt-0 pr-1 pl-2 md:pr-3 md:pl-4" style="height: calc(100vh - var(--header-height) - var(--status-bar-height))">
        <RouterView v-slot="{ Component: RouteComponent }">
          <component
            :is="RouteComponent"
            v-motion-slide-visible-bottom
            class="flex-1"
            :class="{
              'page-container': false,
            }"
          />
        </RouterView>
        <!-- <div class="grid auto-rows-min gap-4 md:grid-cols-3">
          <div class="bg-muted/50 aspect-video rounded-xl" />
          <div class="bg-muted/50 aspect-video rounded-xl" />
          <div class="bg-muted/50 aspect-video rounded-xl" />
        </div>
        <div class="bg-muted/50 min-h-screen flex-1 rounded-xl md:min-h-min" /> -->
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
