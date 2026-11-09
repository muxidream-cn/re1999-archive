---
description: "Use when writing or modifying TypeScript, TSX, or Vue files. Covers enum usage, value-derived types, refs, reverse mappings, and persisted enum values."
applyTo: "**/*.ts, **/*.tsx, **/*.vue"
---

# TypeScript 约定

- 禁止使用 TypeScript `enum`，统一使用 `as const` 对象：

  ```ts
  export const UpdateStatus = {
    checking: 0,
    downloaded: 3,
  } as const
  ```

- 不要导出与值同名的 `type`，以免触发 ESLint `no-redeclare`。需要类型时按取值方式选择：
  - 键名与值相同（常见于字符串值）：使用 `keyof typeof Xxx`。
  - 键名与值不同（常见于数字值）：使用 `type XxxValue = (typeof Xxx)[keyof typeof Xxx]`，需要对外提供时导出 `XxxValue`。
- 将数字枚举迁移为 `as const` 对象时，`ref(Xxx.member)` 可能被推断成字面量类型，必要时显式声明 `ref<XxxValue>(Xxx.member)`；反向映射（如 `Xxx[0]`）不再存在，需一并改写。
- `z.enum(...)` 是 Zod 校验 API，不受禁止 TypeScript `enum` 的约定限制。
- 若枚举值参与接口返回或持久化，迁移前后必须保持值和类型完全一致，不得借机改值。
