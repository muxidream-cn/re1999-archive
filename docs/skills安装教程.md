
# 通过 SSH 克隆并全局安装 Skill 教程

本教程适用于将 GitHub 上的 Skill 仓库拉取到本地，并通过命令行安装为全局 Skill（以 `vuejs-ai/skills` 为例）。

## 前提条件

1. 已安装 Git。
2. 已安装 Node.js（需使用 npx）。
3. GitHub 账号已配置 SSH 公钥（可通过 `ssh -T git@github.com` 测试）。

## 第一步：通过 SSH 克隆仓库到本地

打开终端，进入你期望存放代码的目录，执行以下命令：

```bash
# 进入目标文件夹（请根据实际情况修改路径）
cd test

# 通过 SSH 克隆仓库
git clone git@github.com:vuejs-ai/skills.git
```

## 第二步：使用本地路径作为源进行全局安装

在终端中，使用 `npx skills` 命令，将刚才下载的本地文件夹路径指定为源，并加上 `-g` 参数安装到全局：

```bash
# 指定本地绝对路径（Windows 路径建议加引号）
npx skills add "E:\test\skills" -g
```

> **注意**：如果要安装特定技能，可加 `-s` 参数，例如 `npx skills add "E:\test\skills" -s vue-best-practices -g`。

## 第三步：验证与重启

1. 安装完成后，终端会提示安装成功。
2. **重启你的 AI 编码工具**（如 Cursor、Claude Code 等），让全局 Skill 生效。

## 常见问题排查

- **报错 `Permission denied (publickey)`**：SSH 密钥未配置，请重新生成并添加到 GitHub。
- **报错找不到 Skill**：确保本地 `skills` 文件夹（或其子文件夹）内包含有效的 `SKILL.md` 文件。
