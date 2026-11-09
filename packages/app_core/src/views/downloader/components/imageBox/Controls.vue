<script setup lang="ts">
import { Grid2X2, Grid2X2X, Grid2X2Plus, Trash } from "@lucide/vue"

import useSearch from "@app/core/hooks/select/useSearch"
import useWaterfallColumn from "@app/core/hooks/select/useWaterfallColumn"

const { clearResult } = useSearch()

const { reduceColumnCount, resetColumnCount, addColumnCount } = useWaterfallColumn()
</script>

<template>
  <div class="controls-bar flex w-full justify-between">
    <ButtonGroup>
      <Button size="lg" variant="secondary" title="减少列数" @click="reduceColumnCount"> <Grid2X2X /> 列数减 </Button>
      <Button size="lg" variant="secondary" title="自动列数" @click="resetColumnCount"> <Grid2X2 /> 自动 </Button>
      <Button size="lg" variant="secondary" title="增加列数" @click="addColumnCount"> <Grid2X2Plus /> 列数加 </Button>
    </ButtonGroup>
    <Button size="lg" variant="secondary" title="清空搜索结果" @click="clearResult"> <Trash /> 清空 </Button>
  </div>
</template>

<style scoped>
/*
 * 工具条只让按钮可点，空白区域穿透到下面的内容
 * 这条栏是满宽 + sticky + 固定高度，横跨在瀑布流上方，
 */
.controls-bar {
  pointer-events: none;
}

.controls-bar :deep(button),
.controls-bar :deep(a),
.controls-bar :deep(input),
.controls-bar :deep(select),
.controls-bar :deep(textarea),
.controls-bar :deep([role="button"]) {
  pointer-events: auto;
}
</style>
