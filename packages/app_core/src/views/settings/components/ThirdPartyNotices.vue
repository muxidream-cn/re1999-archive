<script setup lang="ts">
import { ChevronDown, ExternalLink } from "@lucide/vue"

import { cn } from "@app/core/lib/utils"
import { Button } from "@shadcn/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@shadcn/ui/collapsible"
import { Separator } from "@shadcn/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shadcn/ui/table"

type Library = {
  name: string
  license: string
  url: string
  note?: string
}

type LibraryGroup = {
  title: string
  entries: Library[]
  notes?: string[]
}

/** 外部链接打开函数由设置页按平台注入（Web 用 window.open，Tauri 用 plugin-opener） */
defineProps<{
  openUrl: (url: string) => void
}>()

/** 前端运行时依赖；许可证以已安装包 package.json 的 license 字段为基础，并按各项目官方授权说明校正 */
const groups: LibraryGroup[] = [
  {
    title: "框架与状态",
    entries: [
      { name: "Vue", license: "MIT", url: "https://vuejs.org/", note: "UI 框架" },
      { name: "Vue Router", license: "MIT", url: "https://router.vuejs.org", note: "路由" },
      { name: "Pinia", license: "MIT", url: "https://pinia.vuejs.org", note: "状态管理" },
      {
        name: "pinia-plugin-persistedstate",
        license: "MIT",
        url: "https://praz.codeberg.page/pinia-plugin-persistedstate",
        note: "Web 端状态持久化",
      },
      {
        name: "@tauri-store/pinia",
        license: "MIT",
        url: "https://tb.dev.br/tauri-store/plugin-pinia/guide/getting-started",
        note: "桌面端状态持久化",
      },
    ],
  },
  {
    title: "UI 组件与样式",
    entries: [
      { name: "reka-ui", license: "MIT", url: "https://github.com/unovue/reka-ui", note: "无样式组件基础" },
      { name: "shadcn-vue", license: "MIT", url: "https://github.com/unovue/shadcn-vue", note: "组件集合" },
      { name: "@lucide/vue", license: "ISC", url: "https://lucide.dev", note: "图标" },
      { name: "@hugeicons/vue", license: "MIT", url: "https://hugeicons.com", note: "图标" },
      { name: "@hugeicons/core-free-icons", license: "MIT", url: "https://www.npmjs.com/package/@hugeicons/core-free-icons" },
      {
        name: "class-variance-authority",
        license: "Apache-2.0",
        url: "https://github.com/joe-bell/cva",
        note: "组件变体样式",
      },
      { name: "cn", license: "MIT", url: "https://github.com/shadcn-ui/cn", note: "类名合并" },
      { name: "tailwindcss-animate", license: "MIT", url: "https://www.npmjs.com/package/tailwindcss-animate" },
      { name: "tw-animate-css", license: "MIT", url: "https://github.com/Wombosvideo/tw-animate-css" },
    ],
  },
  {
    title: "图片浏览与动画",
    entries: [
      { name: "vistaview", license: "MIT", url: "https://github.com/juji/vistaview", note: "图片灯箱" },
      { name: "@lhlyu/vue-virtual-waterfall", license: "MIT", url: "https://github.com/lhlyu/vue-virtual-waterfall", note: "虚拟瀑布流" },
      {
        name: "gsap",
        license: 'GSAP Standard "no charge" license',
        url: "https://gsap.com/standard-license",
        note: "动画；不属于本项目 MIT 授权范围，详见 README「许可证」",
      },
    ],
    notes: [],
  },
  {
    title: "工具与数据",
    entries: [
      { name: "@vueuse/core", license: "MIT", url: "https://github.com/vueuse/vueuse" },
      { name: "@vueuse/components", license: "MIT", url: "https://github.com/vueuse/vueuse/tree/main/packages/components" },
      { name: "@vueuse/motion", license: "MIT", url: "https://github.com/vueuse/motion", note: "入场动画" },
      { name: "vue-sonner", license: "MIT", url: "https://github.com/xiaoluoboding/vue-sonner", note: "消息提示" },
      { name: "dayjs", license: "MIT", url: "https://day.js.org", note: "日期处理" },
      { name: "semver", license: "ISC", url: "https://github.com/npm/node-semver", note: "版本号比较" },
      { name: "zod", license: "MIT", url: "https://zod.dev" },
      { name: "jwt-decode", license: "MIT", url: "https://github.com/auth0/jwt-decode" },
      { name: "axios", license: "MIT", url: "https://axios-http.com", note: "HTTP 客户端（Web 端）" },
      { name: "iconv-lite", license: "MIT", url: "https://github.com/pillarjs/iconv-lite", note: "字符编码转换" },
    ],
  },
  {
    title: "Tauri 平台 API",
    entries: [
      { name: "@tauri-apps/api", license: "Apache-2.0 OR MIT", url: "https://github.com/tauri-apps/tauri" },
      { name: "@tauri-apps/plugin-fs", license: "MIT OR Apache-2.0", url: "https://github.com/tauri-apps/plugins-workspace" },
      { name: "@tauri-apps/plugin-http", license: "MIT OR Apache-2.0", url: "https://github.com/tauri-apps/plugins-workspace" },
      { name: "@tauri-apps/plugin-opener", license: "MIT OR Apache-2.0", url: "https://github.com/tauri-apps/plugins-workspace" },
      {
        name: "@tauri-apps/plugin-process",
        license: "MIT OR Apache-2.0",
        url: "https://github.com/tauri-apps/plugins-workspace",
        note: "仅 Windows",
      },
      {
        name: "@tauri-apps/plugin-updater",
        license: "MIT OR Apache-2.0",
        url: "https://github.com/tauri-apps/plugins-workspace",
        note: "仅 Windows 更新",
      },
    ],
    notes: ["以上为 Windows / Android 端按需引入的 JS 侧包；Rust 侧 crate 与服务端依赖不在本表范围内。"],
  },
]

const isOpen = ref(false)
const total = computed(() => groups.reduce((sum, group) => sum + group.entries.length, 0))
</script>

<template>
  <Collapsible v-model:open="isOpen">
    <CollapsibleTrigger as-child>
      <Button variant="outline" size="sm" class="h-10 w-full justify-between">
        <span>第三方开源组件（{{ total }}）</span>
        <ChevronDown :class="cn('transition-transform', isOpen && 'rotate-180')" />
      </Button>
    </CollapsibleTrigger>

    <CollapsibleContent class="mt-3 flex max-h-80 flex-col gap-4 overflow-y-auto overscroll-contain pr-1 select-text">
      <p class="text-muted-foreground text-xs">
        本项目基于 MIT
        许可发布。项目包含或使用了以下第三方软件，各组件仍按其各自的许可证授权。MIT许可证的条款不适用于这些第三方组件；具体许可证文本以各项目仓库或官方许可页面为准。GSAP
        使用其标准“No Charge”许可（非 MIT），详见 README 的「许可证」章节及 GSAP 官方许可页面。
      </p>

      <div v-for="group in groups" :key="group.title" class="flex flex-col gap-2">
        <h4 class="text-base font-semibold">{{ group.title }}</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>组件</TableHead>
              <TableHead>许可证</TableHead>
              <TableHead>项目</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="entry in group.entries" :key="entry.name">
              <TableCell class="text-left">
                <div class="font-medium">{{ entry.name }}</div>
                <div v-if="entry.note" class="text-muted-foreground text-[11px]">{{ entry.note }}</div>
              </TableCell>
              <TableCell class="text-muted-foreground text-left wrap-break-word whitespace-normal">{{ entry.license }}</TableCell>
              <TableCell class="text-left">
                <Button variant="ghost" size="icon" :title="entry.url" @click="openUrl(entry.url)">
                  <ExternalLink />
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <p v-for="note in group.notes" :key="note" class="text-muted-foreground text-[11px]">{{ note }}</p>
      </div>

      <Separator />
      <p class="text-muted-foreground text-[11px]">
        许可证信息以已安装依赖包 package.json 的 license
        字段为基础，并按各项目官方授权说明校正；本清单仅覆盖前端运行时依赖，不含开发/构建工具、服务端依赖与 Rust crates。
      </p>
    </CollapsibleContent>
  </Collapsible>
</template>
