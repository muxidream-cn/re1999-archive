<script setup lang="ts">
import type { SliderRootEmits, SliderRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { SliderRange, SliderRoot, SliderTrack, SliderThumb, useForwardPropsEmits } from "reka-ui"

import { cn } from "@app/core/lib/utils"

const props = withDefaults(
  defineProps<
    SliderRootProps & {
      class?: HTMLAttributes["class"]
    }
  >(),
  {
    disabled: false,
    orientation: "horizontal",
  },
)

const emits = defineEmits<SliderRootEmits>()

const delegatedProps = reactiveOmit(props, "class")
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <SliderRoot
    v-bind="forwarded"
    data-slot="slider"
    :class="
      cn(
        'relative flex w-full touch-none select-none items-center data-[orientation=vertical]:flex-col data-[orientation=horizontal]:data-[disabled]:opacity-50',
        props.class,
      )
    "
  >
    <SliderTrack
      data-slot="slider-track"
      class="bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full"
    >
      <SliderRange data-slot="slider-range" class="bg-primary absolute data-[orientation=horizontal]:h-full" />
    </SliderTrack>

    <SliderThumb
      v-for="(_, index) in modelValue"
      :key="index"
      data-slot="slider-thumb"
      class="border-primary bg-background ring-ring/50 block size-4 shrink-0 rounded-full border shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:outline-hidden focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50"
    />
  </SliderRoot>
</template>
