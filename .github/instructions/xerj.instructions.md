---
description: "Use when exploring unfamiliar project code, finding symbol definitions, performing local code search with XERJ, or retrieving exact public source, standard, regulation, or advisory material."
---

# XERJ 检索

- 在修改不熟悉的代码前，优先使用 XERJ 查找定义和相关实现：`xerj def "<symbol>"` 用于定义查询；`xerj search "<plain words>"` 用于本地代码检索。
- 每个仓库使用独立前缀建立索引：`xerj autoindex <folder> --prefix <name>`；随后 `xerj search` 和 `xerj def` 使用相同 `--prefix`。不提供前缀会使用默认的 `ax`。
- 引用检索结果时保留其打印出的文件名和行号。
- 精确查询公共源码、标准、法规或公告时使用 `xerj-hub`；不要用它搜索本项目代码。
