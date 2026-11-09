<script setup lang="ts">
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Database,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Wallpaper,
} from "@lucide/vue"
import { toast } from "vue-sonner"

import NavMain from "@app/core/components/sidebar/components/NavMain.vue"
import NavProjects from "@app/core/components/sidebar/components/NavProjects.vue"
import NavUser from "@app/core/components/sidebar/components/NavUser.vue"
import TeamSwitcher from "@app/core/components/sidebar/components/TeamSwitcher.vue"
import { visibleSections } from "@app/core/views/settings/config"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, type SidebarProps } from "@shadcn/ui/sidebar"

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: "icon",
})

/** 设置子菜单：由设置页配置驱动，隐藏的分区（如“账户”）不会出现在菜单里 */
const settingsNavItems = visibleSections.map((section) => ({
  title: section.title,
  url: `/settings?section=${section.id}`,
}))

// This is sample data.
const data = {
  user: {
    name: "MoMo",
    email: "muxidream_1999@qq.com",
    avatar: "/avatar.webp",
  },
  teams: [
    {
      name: "MuxiDream",
      logo: GalleryVerticalEnd,
      plan: "云端数据库",
    },
    {
      name: "Test Corp.",
      logo: AudioWaveform,
      plan: "Test",
    },
    {
      name: "Test2 Corp.",
      logo: Command,
      plan: "Test2",
    },
  ],
  navMain: [
    {
      title: "壁纸",
      url: "/wallpaper",
      icon: Wallpaper,
      isActive: true,
      items: [
        {
          title: "检索&下载",
          url: "/wallpaper/home",
        },
        {
          title: "角色管理",
          disabled: true,
          url: "#",
        },
        {
          title: "版本管理",
          disabled: true,
          url: "#",
        },
        {
          title: "壁纸管理",
          disabled: true,
          url: "#",
        },
      ],
    },
    {
      title: "数据库", //改到顶部菜单
      url: "#",
      disabled: true,
      icon: Database,
      items: [
        {
          title: "云端(默认)",
          url: "#",
        },
        {
          title: "本地1",
          url: "#",
        },
        {
          title: "本地2",
          url: "#",
        },
        {
          title: "新建",
          url: "#",
        },
      ],
    },
    {
      title: "文档信息",
      url: "#",
      disabled: true,
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
      ],
    },
    {
      title: "设置",
      url: "/settings",
      icon: Settings2,
      items: settingsNavItems,
    },
  ],
  projects: [
    // {
    //   name: "Design Engineering",
    //   url: "#",
    //   icon: Frame,
    // },
    // {
    //   name: "Sales & Marketing",
    //   url: "#",
    //   icon: PieChart,
    // },
    // {
    //   name: "Travel",
    //   url: "#",
    //   icon: Map,
    // },
  ],
}
</script>

<template>
  <Sidebar v-bind="props" collapsible="offcanvas">
    <SidebarHeader class="pointer-events-none opacity-50">
      <TeamSwitcher :teams="data.teams" />
    </SidebarHeader>
    <SidebarContent>
      <NavMain :items="data.navMain" />
      <!-- <NavProjects :projects="data.projects"  /> -->
    </SidebarContent>
    <SidebarFooter>
      <NavUser :user="data.user" class="pointer-events-none opacity-50" />
    </SidebarFooter>
    <!-- 侧边栏的拖拽调整分隔线 -->
    <SidebarRail />
  </Sidebar>
</template>
