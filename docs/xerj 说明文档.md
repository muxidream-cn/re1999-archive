# xerj 说明文档

## 一、说明

XERJ 是一个极轻量的本地代码语义索引引擎，能为 AI 编码助手提供精准的代码搜索与定义跳转，大幅提升开发效率。

## 二、配置 xerj 环境

1. 用户变量添加 PATH 变量，添加 xerj 可执行文件所在的路径，如存在于`D:\xerj\xerj.exe`，则设置 `D:\xerj`。
2. 在用户变量创建 `XERJ_DISABLE_FEEDBACK` 文件，设置值为 `true` ，关闭数据反馈收集

## 三、启动服务并创建索引

设置索引路径，启动服务。注意不要把目录设置在需要索引的项目内，否则会循环索引。

```shell
# 启动服务，例如：xerj --insecure --data-dir "D:\xerj\data-dir"
xerj --insecure --data-dir "<索引数据存放路径>"
```

创建索引

``` shell
# 创建索引，例如：xerj autoindex "E:\projects\example-project"
xerj autoindex "<项目路径>"
```

## 四、接入 Agent

打开项目根路径，进行初始化

``` shell
# 初始化
xerj init
```

删除根路径下的 `AGENTS.md` 中 `XERJ (code search)` 下的 “After using xerj ......  ” 到最后的部分，这部分是数据反馈收集的提示词

在 agent 聊天窗口输入 `/mcp list` 查看当前 MCP 服务是否已开启，看到返回 `xerj (connected)` 之类的字样即可

## 五、注意

- 每次开机都需要手动启动 xerj 服务，或者设置你的任务计划程序来自动启动。 `xerj --insecure --data-dir "<索引数据存放路径>"`
- 默认情况下会占用本地的 9200 端口,打开`http://localhost:9200/_xerj-console/login`可登录 web 控制台(可忽略)
- 不要把 --data-dir 设置在需要索引的项目内，否则会循环索引。
- --insecure 完全关闭了安全防护（TLS 加密和密码验证）。任何能连上这个端口的人，都拥有最高权限，能随意读取、删除索引数据。它默认只允许本机（127.0.0.1）访问；如果尝试暴露到局域网（明文绑定其他网卡），程序会直接拒绝启动，防止你误将裸奔的服务暴露给外网。因此仅限本机单人开发使用。

[Xerj 项目Github地址](https://github.com/xerj-org/xerj)
