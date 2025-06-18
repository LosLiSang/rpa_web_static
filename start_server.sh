#!/bin/bash

# 设置终端标题
echo -e "\033]0;RPA Web Static Server\007"

# 打印启动信息
echo "==============================================="
echo "         RPA Web Static Server 启动器"
echo "==============================================="

# 检查是否安装了 Node.js
check_and_install_node() {
    if ! command -v node >/dev/null 2>&1; then
        echo "未检测到 Node.js 环境，准备安装..."
        
        # 检测操作系统
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command -v brew >/dev/null 2>&1; then
                echo "使用 Homebrew 安装 Node.js..."
                brew install node
            else
                echo "未检测到 Homebrew，请先安装 Homebrew："
                echo "在终端执行：/bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
                echo "然后重新运行此脚本。"
                exit 1
            fi
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            if command -v apt >/dev/null 2>&1; then
                echo "使用 apt 安装 Node.js..."
                sudo apt update
                sudo apt install -y nodejs npm
            elif command -v yum >/dev/null 2>&1; then
                echo "使用 yum 安装 Node.js..."
                sudo yum install -y nodejs npm
            else
                echo "无法确定包管理器，请手动安装 Node.js 后重试。"
                echo "访问 https://nodejs.org/en/download/ 获取安装指南"
                exit 1
            fi
        else
            echo "无法检测操作系统类型，请手动安装 Node.js 后重试。"
            echo "访问 https://nodejs.org/en/download/ 获取安装指南"
            exit 1
        fi
        
        # 检查 Node.js 是否成功安装
        if ! command -v node >/dev/null 2>&1; then
            echo "Node.js 安装失败，请手动安装后重试。"
            exit 1
        else
            echo "Node.js 安装成功！"
        fi
    else
        NODE_VERSION=$(node -v)
        echo "检测到 Node.js 版本: $NODE_VERSION"
    fi
}

# 检查必需的 npm 包是否已安装
check_and_install_packages() {
    # 当前目录下应该已有 package.json
    if [ -f "package.json" ]; then
        echo "正在检查依赖包..."
        npm install --no-fund --no-audit --loglevel=error
    else
        echo "警告：未找到 package.json 文件，跳过依赖检查。"
    fi
}

# 执行检查并安装
check_and_install_node
check_and_install_packages

echo "正在启动本地服务器..."
echo "服务器将在 http://localhost:3456 上运行"
echo "请在浏览器中打开此地址访问应用"
echo "-----------------------------------------------"

# 运行Node.js服务器
node server.js

# 脚本结束时暂停
echo "服务器已停止。按回车键退出..."
read
