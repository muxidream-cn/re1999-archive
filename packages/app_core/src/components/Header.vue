<script setup lang="ts">
import { WallpaperIcon, Trash, CircleHelpIcon, CircleIcon, SunIcon, MoonIcon, SunMoonIcon, DeleteIcon } from "@lucide/vue"
import { useColorMode } from "@vueuse/core"

import { Button } from "@shadcn/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@shadcn/ui/dropdown-menu"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@shadcn/ui/navigation-menu"
import { default as ListItem } from "@shadcn/ui/navigation-menu/NavigationMenuItem.vue"

const emit = defineEmits(["change-bg", "remove-bg"])

/** 主题模式 */
const mode = useColorMode()

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Alert Dialog",
    href: "/docs/primitives/alert-dialog",
    description: "A modal dialog that interrupts the user with important content and expects a response.",
  },
  {
    title: "Hover Card",
    href: "/docs/primitives/hover-card",
    description: "For sighted users to preview content available behind a link.",
  },
  {
    title: "Progress",
    href: "/docs/primitives/progress",
    description: "Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
  },
  {
    title: "Scroll-area",
    href: "/docs/primitives/scroll-area",
    description: "Visually or semantically separates content.",
  },
  {
    title: "Tabs",
    href: "/docs/primitives/tabs",
    description: "A set of layered sections of content—known as tab panels—that are displayed one at a time.",
  },
  {
    title: "Tooltip",
    href: "/docs/primitives/tooltip",
    description: "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
  },
]
</script>

<template>
  <NavigationMenu :viewport="false">
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuTrigger>Home</NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul class="grid gap-2 md:w-100 lg:w-125 lg:grid-cols-[.75fr_1fr]">
            <li class="row-span-3">
              <NavigationMenuLink as-child>
                <a
                  class="from-muted/50 to-muted flex h-full w-full flex-col justify-end rounded-md bg-linear-to-b p-6 no-underline outline-hidden select-none focus:shadow-md"
                  href="/"
                >
                  <div class="mt-4 mb-2 text-lg font-medium">shadcn/ui</div>
                  <p class="text-muted-foreground text-sm leading-tight">Beautifully designed components built with Tailwind CSS.</p>
                </a>
              </NavigationMenuLink>
            </li>
            <ListItem to="/docs" title="Introduction"> Re-usable components built using Radix UI and Tailwind CSS. </ListItem>
            <ListItem to="/docs/installation" title="Installation"> How to install dependencies and structure your app. </ListItem>
            <ListItem to="/docs/primitives/typography" title="Typography"> Styles for headings, paragraphs, lists...etc </ListItem>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger>Components</NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul class="grid w-[400px] gap-2 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
            <ListItem v-for="component in components" :key="component.title" :title="component.title" :to="component.href">
              {{ component.description }}
            </ListItem>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger>List</NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul class="grid w-[300px] gap-4">
            <li>
              <NavigationMenuLink as-child>
                <a href="#">
                  <div class="font-medium">Components</div>
                  <div class="text-muted-foreground">Browse all components in the library.</div>
                </a>
              </NavigationMenuLink>
              <NavigationMenuLink as-child>
                <a href="#">
                  <div class="font-medium">Documentation</div>
                  <div class="text-muted-foreground">Learn how to use the library.</div>
                </a>
              </NavigationMenuLink>
              <NavigationMenuLink as-child>
                <a href="#">
                  <div class="font-medium">Blog</div>
                  <div class="text-muted-foreground">Read our latest blog posts.</div>
                </a>
              </NavigationMenuLink>
            </li>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger>主题</NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul class="grid w-[200px] gap-4">
            <li>
              <NavigationMenuLink as-child>
                <a href="#" @click="mode = 'light'">
                  <SunIcon />
                  Light
                </a>
              </NavigationMenuLink>
              <NavigationMenuLink as-child>
                <a href="#" @click="mode = 'dark'">
                  <MoonIcon />
                  Dark
                </a>
              </NavigationMenuLink>
              <NavigationMenuLink as-child>
                <a href="#" @click="mode = 'auto'">
                  <SunMoonIcon />
                  System
                </a>
              </NavigationMenuLink>
            </li>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink as-child :class="navigationMenuTriggerStyle()">
          <a href="#" @click="emit('change-bg')">
            <WallpaperIcon />
            切换背景
          </a>
        </NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink as-child :class="navigationMenuTriggerStyle()">
          <a href="#" @click="emit('remove-bg')">
            <Trash />
            移除背景
          </a>
        </NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</template>
