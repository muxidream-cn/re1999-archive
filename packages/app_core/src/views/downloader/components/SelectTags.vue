<template>
  <template v-for="(item, index) in list" :key="item.label">
    <Tag v-motion-slide-left :class="tagClass" :label="item.label" @delete="remove(index)" />
  </template>
  <Tag v-if="!list.length && showDefaultTag" v-motion-slide-left :class="tagClass" :label="defaultLabel" />
</template>

<script setup lang="ts">
import Tag from "@app/core/components/custom/Tag.vue"
const props = defineProps({
  /** list为空时显示的默认标签名 */
  defaultLabel: {
    type: String,
    default: "",
  },
  /** list为空时显示默认标签 */
  showDefaultTag: {
    type: Boolean,
    default: true,
  },
  /** 标签的class类 */
  tagClass: {
    type: String,
    default: "",
  },
  /** 标签数组 */
  list: {
    type: Array as PropType<SelectOptionType[]>,
    default: () => [],
  },
  /** 标签移除函数 */
  remove: {
    type: Function as PropType<(index: number) => void>,
    required: true,
  },
})
</script>
