---
description: "Use when querying or changing Apifox endpoints, schemas, environments, mocks, branches, imports, exports, test cases, scenarios, or automation."
---

# Apifox 项目约定

- 默认项目 ID 从 `.apifox/settings.json` 读取，不要硬编码或猜测其他项目。
- Apifox 是可直接维护的接口定义资源。实际代码优先；代码与文档不一致时，先询问用户以确定哪个为准。
- 查询接口优先使用 `apifox endpoint list --project <projectId>`；查看详情使用 `apifox endpoint get <endpointId> --project <projectId>`。
- 以 CLI 的 `--help`、`cli-schema` 和实际读取的资源定义为准，不要凭记忆构造写入 payload。
- 更新前获取完整资源，并基于完整资源修改；保留未要求变更的参数、示例、响应、目录、状态和请求体字段。
- 所有 CLI 写入前，先执行 `apifox cli-schema get endpoint-update`（或对应 schema），准备数据文件并运行 `apifox cli-schema validate`。校验通过后再写入，并在写入后回读验证。
- CLI 更新嵌套对象或数组时会整体替换相应字段，不会按数组项 ID 自动合并；提交前仔细核对完整字段内容。
- 接口文档应准确描述真实 Content-Type、字段、鉴权、响应和错误行为；示例不得包含本机绝对路径或真实签名等敏感信息。
- 保留 Apifox 调试界面中的表单参数；除非用户明确要求并确认，不要清空或随意修改。
- 修改接口时同时核对 handler/schema、鉴权路由、文档和客户端约定，确保接口响应与字段精确一致。
