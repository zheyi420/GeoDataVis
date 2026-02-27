# Element-Plus 源码查询 - 参考

## 版本与路径转换

### lock 格式与目录名对应

| 来源 | 格式 |
|------|------|
| pnpm-lock.yaml | `element-plus@{version}(peer@...)` |
| 实际 .pnpm 目录名 | `element-plus@{version}_peer@..._` |

**转换规则**：
- `(` `)` 替换为 `_`，连续多个 `_` 合并为一个。
- 当 `)` 只有一个时，且上面得到的目录名中最后一个字符为 `_` 时，移除该字符，得到最终的目录名。

括号表示 peer dependencies 嵌套，可在 element-plus 的 `package.json` → `peerDependencies` 确认。

### 完整路径格式

```
node_modules/.pnpm/element-plus@{dirName}/node_modules/element-plus/
```

其中 `{dirName}` 由 version 按上述转换规则得到。

## 组件目录结构

```
lib/components/{组件标识}/
├── index.js           # 入口，追踪 from here
├── index.d.ts         # 类型定义
└── src/
    ├── *.js           # 实现与 props/emits 定义
    └── use-*.js       # 组合式函数
```

**入口引用模式**：

- `require('./src/xxx.js')` → 实现文件
- `install.withInstall(xxx["default"])` → 主组件
- `exports.xxxProps` / `exports.xxxEmits` → 定义来源

## 组件入口与实现追踪

`lib/components/{组件标识}/index.js` 典型结构：

- `require('./src/xxx.js')` → 实现或 props 定义
- `install.withInstall(xxx["default"])` → 主组件
- `exports.xxxProps` → 若为 `...other.otherProps`，则需追溯被引用组件以获取完整 props

主实现与 props 可能在同一或不同 src 文件中，按入口的 require 与 exports 追踪即可。

## package.json 关键字段

```json
{
  "main": "lib/index.js",
  "module": "es/index.mjs",
  "types": "es/index.d.ts",
  "exports": {
    ".": { "types": "./es/index.d.ts", "import": "./es/index.mjs", "require": "./lib/index.js" },
    "./lib/components/*/": "./lib/components/*/"
  }
}
```

## 禁止事项

- **禁止**使用 glob 搜索（如 `**/element-plus/**/组件标识/**/index.js`）查找 element-plus 源码
- 应直接按路径公式拼接，见上方「版本与路径转换」和「完整路径格式」

## 通用查询策略

1. **行为异常**：主实现文件搜索功能关键词，必要时查 `lib/hooks/use-{功能名}/`
2. **Props/Emits**：入口中 `exports.xxxProps` 来源文件
3. **事件**：主实现中 `ctx.emit` / `emit(`
4. **DOM**：主实现的 `render` 或 `setup` 返回
