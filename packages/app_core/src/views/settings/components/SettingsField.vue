<script setup lang="ts">
import { toast } from "vue-sonner"

import { getUpdater } from "@app/core/adapters/updater"
import useDevice from "@app/core/hooks/useDevice"
import useSettings from "@app/core/hooks/useSettings"
import { settingMeta, type SettingApplyMode, type SettingKey } from "@app/core/views/settings/schema"
import { applyFieldChange, type SettingsFieldConfig } from "@app/core/views/settings/types"
import { Button } from "@shadcn/ui/button"
import { Input } from "@shadcn/ui/input"
import { Label } from "@shadcn/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shadcn/ui/select"
import { Slider } from "@shadcn/ui/slider"
import { Switch } from "@shadcn/ui/switch"

const props = defineProps<{
  field: SettingsFieldConfig
}>()

const { isTauri, isDesktop } = useDevice()
const settings = useSettings()

/** 非 action 字段一定绑定 Schema 的 key，action 字段不对应任何设置项 */
const settingKey = computed<SettingKey | null>(() => (props.field.type === "action" ? null : (props.field.key as SettingKey)))

/** 当前值：有 valueSource 时直接读写数据源，否则走设置存储（默认值来自 Schema） */
const value = computed({
  get: () => {
    if (props.field.valueSource) return props.field.valueSource.get()
    return settingKey.value ? settings.getValue(settingKey.value) : undefined
  },
  set: (newValue: any) => {
    if (props.field.valueSource) props.field.valueSource.set(newValue)
    else if (settingKey.value) settings.setValue(settingKey.value, newValue)
    // 统一保留联动调用；副作用（CSS 变量等）已由 Schema 的 applyValue 承担，此处通常为空操作
    applyFieldChange(props.field, newValue)
  },
})

/** 生效方式：live 立即生效 / reload 需刷新 / restart 需重启 */
const applyMode = computed<SettingApplyMode | null>(() => (settingKey.value ? settingMeta(settingKey.value).apply : null))

/** 非立即生效时的提示文案 */
const applyHint = computed(() => {
  if (applyMode.value === "reload") return "修改后需刷新页面"
  if (applyMode.value === "restart") return "修改后需重启应用"
  return ""
})

/** 重启能力只在桌面端可用（安卓由系统安装器接管，web 端没有该能力） */
const canRestart = computed(() => applyMode.value === "restart" && isTauri.value && isDesktop.value)

const restarting = ref(false)

/** 调用平台适配器重启应用 */
const restartApp = async () => {
  const updater = getUpdater()
  if (!updater) {
    toast.error("当前平台不支持重启")
    return
  }
  restarting.value = true
  try {
    await updater.relaunch()
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "重启失败，请手动重启应用")
  } finally {
    restarting.value = false
  }
}

const isBoolean = (field: SettingsFieldConfig): field is Extract<SettingsFieldConfig, { type: "switch" }> => field.type === "switch"

/** action 按钮的禁用态：函数形式在渲染期求值，可跟随主题等响应式状态变化 */
const actionDisabled = computed(() => {
  const field = props.field
  if (field.type !== "action") return false
  return typeof field.disabled === "function" ? field.disabled() : !!field.disabled
})

/** 仅在 action 按钮被禁用时展示的提示文案 */
const actionHint = computed(() => (props.field.type === "action" && actionDisabled.value ? props.field.disabledHint : undefined))

/** color 字段：传给原生取色器的合法 hex；文本框输入中间态的非法值回退为白色，避免取色器跳黑 */
const colorValue = computed(() => {
  const raw = typeof value.value === "string" ? value.value : ""
  return /^#[\da-fA-F]{6}$/.test(raw) ? raw : "#ffffff"
})

/**
 * 原生取色器选色
 * @param event input 事件
 */
const onColorInput = (event: Event) => {
  value.value = (event.target as HTMLInputElement).value
}

/**
 * hex 文本框输入（允许不完整输入，非法值由颜色应用函数忽略）
 * @param raw 文本框当前值
 */
const onColorTextChange = (raw: string | number | undefined) => {
  value.value = String(raw ?? "")
}

/**
 * Slider 以数组形式维护多滑块值，这里只取单值
 * @param v 滑块值数组（可能为 undefined）
 */
const onSliderChange = (v: number[] | undefined) => {
  if (v?.length) value.value = v[0]
}
</script>

<template>
  <div class="flex items-center justify-between gap-6 py-4 first:pt-0 last:pb-0">
    <!-- 左侧：标题与状态提示；description 仅作为悬浮说明，不占用版面 -->
    <div class="flex min-w-10 flex-col gap-1">
      <Label class="text-sm" :title="field.description">{{ field.label }}</Label>
      <p v-if="applyHint || actionHint" class="text-muted-foreground text-xs">{{ applyHint }}{{ actionHint }}</p>
    </div>

    <!-- 右侧：控件 -->
    <div class="flex shrink-0 items-center gap-2">
      <Button v-if="canRestart" variant="outline" size="sm" :disabled="restarting" @click="restartApp">
        {{ restarting ? "重启中..." : "重启应用" }}
      </Button>

      <Switch v-if="isBoolean(field)" v-model="value" :disabled="field.disabled" />

      <Select v-else-if="field.type === 'select'" v-model="value" :disabled="field.disabled">
        <SelectTrigger class="w-40">
          <SelectValue placeholder="请选择" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in field.options" :key="option.value" :value="option.value" :disabled="option.disabled">
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>

      <Input
        v-else-if="field.type === 'input'"
        v-model="value"
        class="w-64"
        type="text"
        :placeholder="field.placeholder"
        :disabled="field.disabled"
      />

      <div v-else-if="field.type === 'color'" class="flex items-center gap-2">
        <Input
          :model-value="value"
          class="w-24 font-mono text-xs uppercase"
          maxlength="7"
          :disabled="field.disabled"
          @update:model-value="onColorTextChange"
        />
        <input
          type="color"
          :value="colorValue"
          :disabled="field.disabled"
          class="border-input h-7 w-10 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          @input="onColorInput"
        />
      </div>

      <div v-else-if="field.type === 'slider'" class="flex w-64 items-center gap-3">
        <Slider :model-value="[value]" :min="field.min" :max="field.max" :step="field.step" class="flex-1" @update:model-value="onSliderChange" />
        <span class="text-muted-foreground w-12 text-right text-xs tabular-nums">
          {{ field.format ? field.format(value) : value }}
        </span>
      </div>

      <Button v-else-if="field.type === 'action'" variant="outline" size="sm" :disabled="actionDisabled" :title="actionHint" @click="field.action()">
        {{ field.buttonLabel }}
      </Button>
    </div>
  </div>
</template>
