# 远程桌面事件编排控制台

本项目是一个远程桌面事件编排控制台，用于控制远程计算机的鼠标和键盘操作，并支持录制和回放功能。

## 文件结构

项目采用了模块化的JavaScript结构，主要包含以下文件：

- `index.html` - 主页面
- `styles.css` - 样式表
- `js/` - JavaScript模块目录
  - `main.js` - 应用程序入口点，负责初始化和事件绑定
  - `config.js` - 配置和常量定义
  - `utils.js` - 工具函数和辅助方法
  - `websocket.js` - WebSocket连接和通信
  - `events.js` - 事件编排管理功能
  - `control.js` - 鼠标键盘控制实现
  - `recording.js` - 录制和回放功能

## 模块功能说明

### main.js

- 应用程序入口点
- 初始化UI组件
- 绑定所有事件处理函数
- 协调各个模块之间的交互

### config.js

- 定义事件类型参数配置
- 定义修饰键集合
- 定义常量配置

### utils.js

- 提供日志记录功能
- 事件信息格式化和转换
- 键盘和鼠标事件映射工具

### websocket.js

- 管理WebSocket连接建立和断开
- 处理服务器通信
- 发送控制命令

### events.js

- 管理事件编排逻辑
- 提供事件添加、删除和编辑功能
- 执行事件序列
- 导入导出事件JSON

### control.js

- 处理鼠标和键盘输入
- 计算坐标映射
- 管理实时控制功能

### recording.js

- 管理录制功能
- 处理录制数据
- 保存录制结果

## 使用方法

1. 打开 `index.html`
2. 输入WebSocket服务器地址并连接
3. 可以开始添加控制事件或直接通过远程桌面图像控制
4. 使用录制功能可以自动创建事件序列

## Docker 部署

本项目支持使用 Docker 和 Nginx 进行部署，提供了更轻量、更高性能的生产环境解决方案。

### 构建镜像

```bash
docker build -t rpa-web-static .
```

### 运行容器

#### 使用默认端口 (34567)

```bash
docker run -d -p 34567:34567 --name rpa-web rpa-web-static
```

#### 使用自定义端口

通过环境变量 `PORT` 配置端口：

```bash
docker run -d -p 8080:8080 -e PORT=8080 --name rpa-web rpa-web-static
```

### 容器管理

```bash
# 查看日志
docker logs rpa-web

# 停止容器
docker stop rpa-web

# 删除容器
docker rm rpa-web

# 删除镜像
docker rmi rpa-web-static
```

### 上传到服务器

```bash
docker save rpa-web-static | gzip > rpa-web-static.tar.gz
scp rpa-web-static.tar.gz user@server:/path/to/upload
ssh user@server
gunzip -c /path/to/upload/rpa-web-static.tar.gz | docker load
```

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| PORT | 34567 | 服务监听端口 |

### 功能特性

- ✅ 默认端口 34567
- ✅ 通过环境变量 PORT 配置端口
- ✅ Gzip 压缩优化传输
- ✅ 静态资源缓存
- ✅ 安全头设置
- ✅ 轻量级 alpine 镜像
- ✅ 功能等效于 Node.js 服务器，性能更优
