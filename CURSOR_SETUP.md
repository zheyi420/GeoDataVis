# Cursor IDE 配置说明

本文档说明如何配置 Cursor IDE 以使用本项目的规则和技能文件。

## 目录结构

```
.claude/
├── rules/          # Cursor 规则文件 (.mdc)
└── skills/         # Cursor 技能文件

.cursor/
└── rules/          # 软链接 → .claude/rules/
```

## 配置步骤

### 1. Skills 配置（无需额外操作）

Cursor 设置中搜索并开启 **"Include third-party Plugins, Skills, and other configs"**，Cursor 即可自动识别 `.claude/skills/` 目录下的技能文件。

### 2. Rules 配置（需手动创建软链接）

`.cursor/rules/` 是指向 `.claude/rules/` 的软链接，**不随 Git 提交**，clone 后需手动创建。

**以管理员身份运行 PowerShell**，在项目根目录执行：

```powershell
# 如 .cursor/rules 目录已存在（Git clone 有时会自动创建空目录），先删除
Remove-Item -Recurse -Force .cursor\rules -ErrorAction SilentlyContinue

# 创建软链接
New-Item -ItemType SymbolicLink -Path ".cursor\rules" -Target ".claude\rules"
```

### 3. 验证安装

执行以下命令验证软链接创建成功（Mode 列含 `l` 即为软链接）：

```powershell
Get-Item .cursor\rules
```

预期输出：
```
    目录: D:\dev\project\GeoDataVis\.cursor

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d----l         2026/3/25      4:51                rules
```

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| 创建软链接时报错 | 确保以管理员身份运行 PowerShell |
| `.cursor/rules` 已存在 | 先删除现有目录再创建软链接 |
| Rules 未生效 | 重启 Cursor IDE 或检查软链接路径是否正确 |
