export const RoleGroup = {
  race: "race",
  camp: "camp",
} as const

export type RoleGroupType = (typeof RoleGroup)[keyof typeof RoleGroup]
