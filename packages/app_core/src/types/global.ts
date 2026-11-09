//el-table表格排序，handleSortChange传参声明
export interface Sort<T> {
  column?: T
  prop: string
  order: "ascending" | "descending"
}

/** el-table筛选的类型声明 */
export type TableFilterItem<T> = {
  text: string
  value: T
}

/**树节点结构*/
export type TreeItem = {
  label: string
  value: any
  children?: TreeItem[]
}

/**路由*/
export type Route = {
  name: string
  path: string
  label: string
}
