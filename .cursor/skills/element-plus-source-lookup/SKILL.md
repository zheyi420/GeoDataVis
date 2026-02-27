---
name: element-plus-source-lookup
description: Locate Element-Plus component source code in pnpm projects for troubleshooting. Use when finding any el-* component source, debugging element-plus behavior, or when the user asks to look up element-plus dependency source.
---

# Element-Plus 源码查询

在 pnpm 项目中定位 Element-Plus 组件源码，用于排查 el-* 组件行为异常、查阅 props/emits 定义。

**前置**：需查找 element-plus 源码时，先读取 [reference.md](reference.md) 获取版本转换规则、目录结构及通用追踪模式。

## 执行步骤

**1. 获取版本**

在 `pnpm-lock.yaml` 中定位 element-plus 的 version：

- **单包项目**：`importers` 下 `.:` 的 `dependencies.element-plus`
- **Monorepo**：根据业务文件所属包，在 `importers` 下找到对应 key 的 `dependencies.element-plus`；若项目有 `pnpm-workspace.yaml` 且含 `catalog`，可作备选

**2. 版本转目录名**

将 version 中 `(` `)` 替换为 `_`，连续 `_` 合并为一个，得到目录名。
当 version 中的 `)` 只有一个时，且上面得到的目录名中最后一个字符为 `_` 时，移除该字符，得到最终的目录名。

**3. 拼源码根路径**

```
node_modules/.pnpm/element-plus@{目录名}/node_modules/element-plus/
```

**4. 定位组件入口**

`el-{X}` 对应 `lib/components/{X}/index.js`，其中 `{X}` 为去掉 `el-` 前缀的组件标识。

**5. 追踪实现**

读取入口 `index.js`，按 [reference.md](reference.md) 中的通用模式追踪：

- 传入 `withInstall(...)` 的参数 → 主实现文件
- `exports.xxxProps` 来源 → Props/Emits 定义
- 需 hooks 时查 `lib/hooks/use-{功能名}/index.js`

## 快速参考

| 目标 | 路径 |
|------|------|
| 组件入口 | `lib/components/{组件标识}/index.js` |
| 主实现 | 入口中 `withInstall()` 的参数来源 |
| Props/Emits | 入口中 `exports.xxxProps` 来源 |
| Hooks | `lib/hooks/use-{功能名}/index.js` |

## 组件名映射

`el-{X}` → 目录 `{X}`（去掉 `el-` 前缀）

## 禁止事项

- **禁止**使用 glob 搜索查找 element-plus 组件源码
- 应通过 `pnpm-lock.yaml` 获取 version，按转换规则得到目录名，直接拼接路径
- 见上方「执行步骤」与 [reference.md](reference.md)

## 注意事项

- 不要修改 node_modules 内源码
- 优先通过 props/slots/events 实现需求
- 不同版本实现可能不同，确认当前版本

## 详细说明

必须参考 [reference.md](reference.md)，内含版本转换规则、目录结构及组件入口与实现追踪说明。
