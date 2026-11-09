<script setup lang="ts">
import { ChevronRight, type LucideIcon } from "@lucide/vue"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@shadcn/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@shadcn/ui/sidebar/index"

interface NavSubItem {
  title: string
  disabled?: boolean
  url: string
}

interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  disabled?: boolean
  items?: NavSubItem[]
}

const props = defineProps<{
  items: NavItem[]
}>()

const route = useRoute()
const router = useRouter()

/**
 * 拆分站内地址，得到路径与查询参数
 * @param url 站内地址，如 /settings?section=update
 */
const splitUrl = (url: string) => {
  const [path, search = ""] = url.split("?")
  return { path, query: new URLSearchParams(search) }
}

/**
 * 判断一级菜单是否命中当前路由（前缀匹配，命中则高亮并自动展开）
 * @param item 一级菜单项
 */
const isItemActive = (item: NavItem) => {
  if (!item.url.startsWith("/")) return Boolean(item.isActive)
  const { path } = splitUrl(item.url)
  return route.path === path || route.path.startsWith(`${path}/`)
}

/**
 * 判断二级菜单是否命中当前路由（路径一致且 url 上的查询参数全部匹配）
 * @param subItem 二级菜单项
 */
const isSubItemActive = (subItem: NavSubItem) => {
  if (!subItem.url.startsWith("/")) return false
  const { path, query } = splitUrl(subItem.url)
  if (route.path !== path) return false

  for (const [key, value] of query.entries()) {
    const current = route.query[key]
    const currentValue = Array.isArray(current) ? current[0] : (current ?? "")
    if (String(currentValue) !== value) return false
  }

  return true
}

/** 折叠面板的展开状态：手动操作优先，未操作过时跟随当前路由 */
const openState = reactive<Record<string, boolean>>({})
const isOpen = (item: NavItem) => openState[item.title] ?? isItemActive(item)
const setOpen = (item: NavItem, value: boolean) => {
  openState[item.title] = value
}

// 路由切换后，命中当前页面的分组自动展开
watch(
  () => route.fullPath,
  () => {
    for (const item of props.items) {
      if (isItemActive(item)) openState[item.title] = true
    }
  },
  { immediate: true }
)

/**
 * 子项点击：以 "/" 开头的 url 视为站内路由跳转（阻止冒泡，避免触发侧边栏的兜底 toast）；
 * 其余保持 <a> 默认行为
 * @param event 鼠标点击事件
 * @param subItem 子菜单项
 */
const onSubItemClick = (event: MouseEvent, subItem: NavSubItem) => {
  if (subItem.url?.startsWith("/")) {
    event.preventDefault()
    event.stopPropagation()
    router.push(subItem.url)
  }
}
</script>

<template>
  <SidebarGroup>
    <SidebarGroupLabel>导航</SidebarGroupLabel>
    <SidebarMenu>
      <Collapsible
        v-for="item in items"
        :key="item.title"
        as-child
        :open="isOpen(item)"
        class="group/collapsible"
        @update:open="setOpen(item, $event)"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger as-child :disabled="item.disabled">
            <SidebarMenuButton :tooltip="item.title" :is-active="isItemActive(item)">
              <component :is="item.icon" v-if="item.icon" />
              <span>{{ item.title }}</span>
              <ChevronRight class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              <SidebarMenuSubItem v-for="subItem in item.items" :key="subItem.title">
                <SidebarMenuSubButton
                  as-child
                  :is-active="isSubItemActive(subItem)"
                  :class="subItem.disabled ? 'pointer-events-none opacity-50' : ''"
                >
                  <a :href="subItem.url" @click="onSubItemClick($event, subItem)">
                    <span>{{ subItem.title }}</span>
                  </a>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    </SidebarMenu>
  </SidebarGroup>
</template>
