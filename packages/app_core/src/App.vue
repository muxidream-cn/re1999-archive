<template>
  <AppContextMenu>
    <div>
      <Toaster />
      <div id="app-container">
        <AppSidebar />
      </div>
    </div>
  </AppContextMenu>
</template>

<script setup lang="ts">
import { getCurrentInstance } from "vue"

import AppContextMenu from "@app/core/components/custom/context-menu/AppContextMenu.vue"
import { initUpdateDialog } from "@app/core/components/custom/updater"
import AppSidebar from "@app/core/components/sidebar/Index.vue"
import useSettings from "@app/core/hooks/useSettings"
import { Toaster } from "@shadcn/ui/sonner"

// 启动时把持久化的组件透明度 / 容器颜色同步写回 CSS 变量，避免首屏闪烁
useSettings().applyStartupSettings()
// 载入更新弹窗组件并及进行一次更新
initUpdateDialog(getCurrentInstance()?.appContext)
</script>

<style scoped>
#app-container {
  position: relative;
  text-align: center;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

/* 实际背景层 */
#app-container::before {
  content: "";
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;

  /* 继承上层背景 */
  background-image: inherit;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;

  /* 模糊 */
  /* filter: blur(1px); */
}

.page-container::before {
  content: "";
  position: absolute;
  height: 100%;
  width: 100%;
  background-color: transparent;
  z-index: 999;
}
</style>
