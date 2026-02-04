# AGENTS.md - 远程桌面事件编排控制台

此文件包含代理编码助手在此代码库中工作时所需的关键信息。

## 构建命令

```bash
# 运行开发服务器 (端口 34567)
npm start

# 构建项目 (TypeScript 编译)
npm run build

# 监视模式编译 TypeScript
npm run watch

# 开发模式 (监视 + 运行服务器)
npm run dev
```

注意：虽然 package.json 包含 TypeScript 构建命令，但当前代码库使用原生 JavaScript (ES6 模块)。

## 项目结构

```tree
rpa_web_static/
├── index.html          # 主页面
├── styles.css          # 样式表 (Tailwind CSS + 自定义样式)
├── server.js           # 本地开发服务器
├── js/                 # JavaScript 模块目录
│   ├── main.js         # 应用程序入口点，初始化和事件绑定
│   ├── config.js       # 配置和常量定义
│   ├── utils.js        # 工具函数和辅助方法
│   ├── websocket.js    # WebSocket 连接和通信
│   ├── events.js       # 事件编排管理功能
│   ├── control.js      # 鼠标键盘控制实现
│   ├── recording.js    # 录制和回放功能
│   └── dialog.js       # 对话框功能
```

## 代码风格指南

### 导入顺序和语法

- 使用 ES6 模块语法 (`import`/`export`)
- 导入顺序：配置模块 → 工具函数 → 功能模块
- 示例：
```javascript
import { eventTypeParams, modKeySet } from './config.js';
import { addLog, getEventIcon } from './utils.js';
import { sendControlCommand } from './websocket.js';
```

### 命名约定

- 文件名：kebab-case (`control.js`, `websocket.js`)
- 函数名：camelCase (`addEvent`, `updateEventParams`)
- 常量：UPPER_SNAKE_CASE (`MOUSE_MOVE_INTERVAL_MS`, `maxReconnectAttempts`)
- DOM 元素变量：camelCase (`connectButton`, `eventParams`)
- 事件类型：camelCase (`singleKeyEnter`, `mouseClick`, `combindKeyEnter`)
- 模块级变量：camelCase 或 PascalCase（私有状态）

### 格式化

- 缩进：4 个空格
- 最大行宽：约 100 字符
- 文件头部注释说明文件用途
- 函数之间空一行分隔

### 类型系统

项目使用原生 JavaScript，无类型注解。关键映射关系：

- 事件类型参数定义在 `config.js` 的 `eventTypeParams` 对象
- 键码映射在 `utils.js` 的 `mapKeyToCode` 函数，基于服务器端 Rust 代码定义
- 修饰键集合定义在 `config.js` 的 `modKeySet`

### 错误处理

- 使用 `try-catch` 捕获异步操作错误
- 错误信息通过 `addLog(message, 'error')` 记录到终端
- 使用 `alert()` 进行关键错误提示
- WebSocket 连接错误在 `onerror` 回调中处理

### DOM 操作

- 使用标准 DOM API：`document.getElementById`, `addEventListener`
- 在初始化函数中获取 DOM 元素引用（见 `main.js` 的 `init` 函数）
- 事件处理函数使用箭头函数以避免 `this` 绑定问题
- 动态创建元素时设置合适的类名和属性

### WebSocket 通信

- 使用 `sendControlCommand(command)` 发送控制命令
- 消息格式：JSON 对象，包含操作类型和参数
- 消息处理在 `websocket.js` 的 `onmessage` 回调中
- 支持的消息类型：
  - Base64 图像数据
  - Blob 二进制图像数据
  - JSON 消息（错误、通知、录制数据）

### 事件处理

- 使用 `addEventListener` 注册事件
- 提供配对的添加/移除函数（`addControlListeners`/`removeControlListeners`）
- 事件处理函数使用 `event.preventDefault()` 阻止默认行为
- 焦点管理：远程桌面图像使用 `focus()` 接收键盘事件

### 状态管理

- 使用模块级变量存储状态（如 `events`, `isExecuting`, `websocket`）
- 状态更新后调用相应的 UI 更新函数
- 关键状态变量：
  - `events`: 事件序列数组
  - `isExecuting`: 是否正在执行
  - `websocket`: WebSocket 连接实例
  - `controlEnabled`: 控制功能是否启用

### 异步操作

- 使用 `async/await` 处理 Promise
- 使用 `sleep(ms)` 辅助函数延迟执行
- 文件读取使用 `FileReader`
- HTTP 请求使用 `fetch` API

### 日志和通知

- 使用 `addLog(message, type)` 记录操作日志
- 日志类型：`info`, `success`, `warning`, `error`
- 通知通过 `showCopyNotification` 显示
- 终端日志会自动滚动到底部

## 关键注意事项

1. **事件序列格式**：支持两种格式
   - 高级事件格式：`{ type, params }`
   - 原子事件格式：扁平化的操作对象数组

2. **坐标映射**：鼠标坐标从显示尺寸映射到实际图像尺寸（见 `control.js`）

3. **修饰键处理**：根据 `event.location` 区分左右修饰键

4. **拖拽排序**：仅在非选择模式下启用

5. **WebSocket 重连**：自动重连机制，最多 3 次

6. **服务器地址持久化**：使用 `localStorage` 保存最后连接的 URL

## 外部依赖

- Tailwind CSS 2.2.19 (CDN)
- Font Awesome 6.4.0 (CDN)
- Node.js (仅用于开发服务器)

## 开发建议

- 修改代码后刷新浏览器查看效果
- 使用浏览器开发者工具调试 WebSocket 消息
- 日志终端显示在页面左下角，便于实时查看
- 保持函数单一职责，避免过长函数
- 遵循现有的模块化设计模式
