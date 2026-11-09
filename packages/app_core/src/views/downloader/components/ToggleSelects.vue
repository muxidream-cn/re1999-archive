<template>
  <div>
    <Label class="mb-2 text-sm">{{ label }}</Label>
    <ToggleGroup v-model="currentValue" type="single">
      <template v-for="item in options" :key="item.value">
        <ToggleGroupItem :value="item.value" :disabled="currentValue === item.value">
          <Label>{{ item.label }}</Label>
        </ToggleGroupItem>
      </template>
    </ToggleGroup>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  /** 分类标签名 */
  label: {
    type: String,
    default: "",
  },
  /** 单选项数组 */
  options: {
    type: Array as PropType<SelectOptionType[]>,
    required: true,
  },
})

const currentValue = defineModel<string | number>({
  type: [String, Number],
  required: true,
})
</script>
