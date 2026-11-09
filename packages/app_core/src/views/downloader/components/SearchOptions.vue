<script setup lang="ts">
import { RotateCcw } from "@lucide/vue"
import { storeToRefs } from "pinia"

import Tag from "@app/core/components/custom/Tag.vue"
import useSelect from "@app/core/hooks/select/useSelect"
import { useSelectStore } from "@app/core/stores/useSelectStore"
import { RoleGroup } from "@app/core/types/role"
import Button from "@shadcn/ui/button/Button.vue"
import Label from "@shadcn/ui/label/Label.vue"

import SearchRoles from "./SearchRoles.vue"
import SelectRolesGroup from "./SelectRolesGroup.vue"
import SelectTags from "./SelectTags.vue"
import SelectVersion from "./SelectVersion.vue"
import ToggleSelects from "./ToggleSelects.vue"

const selectStore = useSelectStore()
const { remove, reset, getLabel } = useSelect()

const { isAdvanced, roleSelect, versionSelect, orderToggle, orderOptions, sortToggle, sortOptions, modeToggle, modeOptions } =
  storeToRefs(selectStore)
</script>

<template>
  <div class="grid grid-cols-12 gap-x-5 gap-y-2">
    <!-- 版本 -->
    <SelectVersion class="tran col-span-6 md:col-span-4 xl:col-span-3" :class="isAdvanced ? '2xl:col-span-2' : '2xl:col-span-4'" />
    <!-- 角色 -->
    <SearchRoles class="col-span-6 md:col-span-4 xl:col-span-3 2xl:col-span-2" :class="isAdvanced ? '2xl:col-span-2' : '2xl:col-span-4'" />
    <!-- 阵营 -->
    <SelectRolesGroup
      v-if="isAdvanced"
      v-motion-slide-left
      class="col-span-6 md:col-span-4 xl:col-span-3 2xl:col-span-2"
      :delay="50"
      :type="RoleGroup.camp"
      name="(角色)阵营"
    />
    <!-- 种族 -->
    <SelectRolesGroup
      v-if="isAdvanced"
      v-motion-slide-left
      class="col-span-6 md:col-span-4 xl:col-span-3 2xl:col-span-2"
      :type="RoleGroup.race"
      name="(角色)种族"
    />
    <!-- 分类 -->
    <ToggleSelects v-model="sortToggle" class="col-span-4 md:col-span-3 xl:col-span-2" label="图片类型" :options="sortOptions" />
    <!-- 模式 -->
    <ToggleSelects v-model="modeToggle" class="col-span-4 md:col-span-3 xl:col-span-2 2xl:col-span-1" label="查询模式" :options="modeOptions" />
    <!-- 排序 -->
    <ToggleSelects
      v-model="orderToggle"
      class="col-span-4 2xl:col-span-1"
      :class="isAdvanced ? 'md:col-span-2 xl:col-span-1' : 'md:col-span-3 xl:col-span-2'"
      label="排序"
      :options="orderOptions"
    />
  </div>
  <Card class="tags-box mt-2 flex flex-row flex-wrap items-center gap-0 p-1 md:p-2">
    <Label class="text-lg">当前已选：</Label>
    <!-- 版本 -->
    <SelectTags default-label="不限版本" :tag-class="'bg-tag-version text-tag-foreground'" :list="versionSelect" :remove="remove.version" />
    <!-- 角色 -->
    <SelectTags default-label="不限角色" :tag-class="'bg-tag-role text-tag-foreground'" :list="roleSelect" :remove="remove.role" />
    <!-- 类型 -->
    <Tag v-motion-slide-left class="bg-tag-type text-tag-foreground" :label="getLabel.sort() ?? ''" @delete="reset.sort()" />
    <!-- 排序 -->
    <Tag v-motion-slide-left class="bg-tag-order text-tag-foreground" :label="getLabel.order() ?? ''" @delete="reset.order()" />
    <!-- 重置按钮 -->
    <Button class="ml-auto" variant="ghost" @click="reset.all()"><RotateCcw /> 清空 </Button>
  </Card>
</template>

<style lang="css" scoped></style>
