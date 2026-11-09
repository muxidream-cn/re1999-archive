/**查询信息的字段枚举*/
export const QueryModeEnum = {
  /**获取所有信息*/
  all: "all",
  /**获取部分信息*/
  diff: "diff",
} as const

/** 排序方式 */
export type OrderByEnum = {
  /** 升序 */
  asc: "ASC"
  /** 降序 */
  desc: "DESC"
}
