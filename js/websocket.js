// websocket.js - WebSocket连接和通信功能

import { addLog } from './utils.js';

let websocket;
let connectIntentional = false;
let imageObjectUrl = null;
let reconnectTimeout = null;
let reconnectAttempts = 0;
let maxReconnectAttempts = 3;
let reconnectInterval = 2000; // 2秒
let controlEnabled = true; // 控制是否向远程发送键鼠信号
let capturedImageUrl = null; // 保存捕获的单张图片
let coordinateDisplayEnabled = false; // 控制是否显示坐标

// 设置连接状态显示
function setStatus(message, connectedStatus) {
    const statusText = document.getElementById('statusText');
    const statusDot = document.getElementById('statusDot');
    const controlNote = document.getElementById('controlNote');
    const connectButton = document.getElementById('connectButton');
    const executeEventsBtn = document.getElementById('executeEventsBtn');
    const startRecordingBtn = document.getElementById('startRecordingBtn');
    const remoteDesktopImage = document.getElementById('remoteDesktopImage');

    statusText.textContent = `状态: ${message}`;
    statusDot.className = 'status-dot';

    if (connectedStatus === 'connected') {
        statusDot.classList.add('status-connected');
        controlNote.textContent = '控制功能已激活。点击图像区域以发送鼠标和键盘事件。';
        executeEventsBtn.disabled = false;
        startRecordingBtn.classList.remove('hidden');
        addLog(`已连接到服务器`, 'success');
    } else if (connectedStatus === 'disconnected') {
        statusDot.classList.add('status-disconnected');
        controlNote.textContent = '请输入 WebSocket 服务器地址并连接。如果使用默认地址，请确保服务器在该地址运行。';
        executeEventsBtn.disabled = true;
        startRecordingBtn.classList.add('hidden');
        document.getElementById('stopRecordingBtn').classList.add('hidden');
        addLog(`已断开连接`, 'warning');
    } else if (connectedStatus === 'connecting') {
        statusDot.classList.add('status-connecting');
        addLog(`正在连接到服务器...`, 'info');
    }
}

// 发送控制命令
function sendControlCommand(command) {
    if (!controlEnabled) {
        console.log('控制功能已禁用，命令未发送:', command);
        return;
    }
    
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify(command));
        console.log('Sent command:', command);
    } else {
        console.warn('WebSocket not connected. Command not sent:', command);
    }
}

// 捕获单张图片
function captureScreenshot() {
    const websocketUrlInput = document.getElementById('websocketUrlInput');
    const websocketUrl = websocketUrlInput.value;
    
    if (!websocketUrl) {
        addLog('请先设置WebSocket服务器地址', 'error');
        return;
    }

    try {
        // 从WebSocket URL提取主机和端口
        const wsUrl = new URL(websocketUrl);
        const host = wsUrl.hostname;
        const port = wsUrl.port || (wsUrl.protocol === 'wss:' ? '443' : '80');
        
        // 构建截图API URL
        const captureUrl = `http://${host}:${port}/api/capture/MJPG`;
        
        addLog('正在请求截图...', 'info');
        
        // 发送截图请求
        fetch(captureUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.blob();
            })
            .then(blob => {
                // 创建图像URL
                if (capturedImageUrl) {
                    URL.revokeObjectURL(capturedImageUrl);
                }
                
                capturedImageUrl = URL.createObjectURL(blob);
                const remoteDesktopImage = document.getElementById('remoteDesktopImage');
                remoteDesktopImage.src = capturedImageUrl;
                
                addLog('截图成功，图像已更新', 'success');
            })
            .catch(error => {
                console.error('截图请求失败:', error);
                addLog(`截图失败: ${error.message}`, 'error');
            });
            
    } catch (error) {
        console.error('解析WebSocket URL失败:', error);
        addLog(`无法解析服务器地址: ${error.message}`, 'error');
    }
}

// 切换控制功能状态
function toggleControlEnabled() {
    controlEnabled = !controlEnabled;
    const controlToggleBtn = document.getElementById('controlToggleBtn');
    
    if (controlEnabled) {
        controlToggleBtn.innerHTML = '<i class="fas fa-mouse-pointer mr-2"></i>控制已启用';
        controlToggleBtn.className = 'btn-secondary py-2';
        addLog('键鼠控制功能已启用', 'success');
    } else {
        controlToggleBtn.innerHTML = '<i class="fas fa-ban mr-2"></i>控制已禁用';
        controlToggleBtn.className = 'btn-warning py-2';
        addLog('键鼠控制功能已禁用', 'warning');
    }
    
    return controlEnabled;
}

// 获取控制功能状态
function getControlEnabled() {
    return controlEnabled;
}

// 切换坐标显示功能
function toggleCoordinateDisplay() {
    coordinateDisplayEnabled = !coordinateDisplayEnabled;
    const coordToggleBtn = document.getElementById('coordToggleBtn');
    const remoteDesktopImage = document.getElementById('remoteDesktopImage');
    
    if (coordinateDisplayEnabled) {
        coordToggleBtn.innerHTML = '<i class="fas fa-crosshairs mr-2"></i>坐标已显示';
        coordToggleBtn.className = 'btn-info font-semibold py-3 px-4 text-lg';
        addLog('坐标显示功能已启用', 'success');
        
        // 添加鼠标移动事件监听
        remoteDesktopImage.addEventListener('mousemove', showCoordinates);
        remoteDesktopImage.addEventListener('mouseleave', hideCoordinates);
    } else {
        coordToggleBtn.innerHTML = '<i class="fas fa-crosshairs mr-2"></i>显示坐标';
        coordToggleBtn.className = 'btn-secondary font-semibold py-3 px-4 text-lg';
        addLog('坐标显示功能已禁用', 'warning');
        
        // 移除鼠标移动事件监听
        remoteDesktopImage.removeEventListener('mousemove', showCoordinates);
        remoteDesktopImage.removeEventListener('mouseleave', hideCoordinates);
        hideCoordinates();
    }
    
    return coordinateDisplayEnabled;
}

// 显示鼠标坐标
function showCoordinates(event) {
    const remoteDesktopImage = event.target;
    const rect = remoteDesktopImage.getBoundingClientRect();
    
    // 计算相对于图像的坐标
    const relativeX = event.clientX - rect.left;
    const relativeY = event.clientY - rect.top;
    
    // 将坐标映射到1920x1080分辨率
    const mappedX = Math.round((relativeX / rect.width) * 1920);
    const mappedY = Math.round((relativeY / rect.height) * 1080);
    
    // 确保坐标在有效范围内
    const x = Math.max(0, Math.min(1920, mappedX));
    const y = Math.max(0, Math.min(1080, mappedY));
    
    // 获取或创建坐标显示元素
    let coordDisplay = document.getElementById('coordinateDisplay');
    if (!coordDisplay) {
        coordDisplay = document.createElement('div');
        coordDisplay.id = 'coordinateDisplay';
        coordDisplay.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: #00ff00;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-family: monospace;
            pointer-events: none;
            z-index: 1000;
            border: 1px solid #00ff00;
        `;
        document.body.appendChild(coordDisplay);
    }
    
    // 更新坐标显示
    coordDisplay.textContent = `X: ${x}, Y: ${y} (1920x1080)`;
    coordDisplay.style.left = (event.clientX + 10) + 'px';
    coordDisplay.style.top = (event.clientY - 25) + 'px';
    coordDisplay.style.display = 'block';
}

// 隐藏坐标显示
function hideCoordinates() {
    const coordDisplay = document.getElementById('coordinateDisplay');
    if (coordDisplay) {
        coordDisplay.style.display = 'none';
    }
}

// 获取坐标显示状态
function getCoordinateDisplayEnabled() {
    return coordinateDisplayEnabled;
}

// 连接到WebSocket服务器
function connectWebSocket(onConnected, onMessageHandler, addControlListeners, removeControlListeners) {
    // 取消任何可能正在进行的重连尝试
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }

    // 如果已经连接上，则直接返回
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        console.log('WebSocket is already open.');
        return;
    }

    // 如果正在连接中，不重复连接
    if (websocket && websocket.readyState === WebSocket.CONNECTING) {
        console.log('WebSocket is already connecting.');
        return;
    }

    // 如果有旧连接，先关闭
    if (websocket) {
        try {
            websocket.close();
        } catch (e) {
            console.warn('关闭旧WebSocket连接时出错:', e);
        }
    }

    const connectButton = document.getElementById('connectButton');
    const websocketUrlInput = document.getElementById('websocketUrlInput');
    const remoteDesktopImage = document.getElementById('remoteDesktopImage');

    // 保存URL到localStorage以便下次使用
    localStorage.setItem('lastWebsocketUrl', websocketUrlInput.value);

    setStatus('正在连接...', 'connecting');
    connectButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>正在连接...';
    connectButton.disabled = true;
    connectIntentional = true;

    const websocketUrl = websocketUrlInput.value;
    
    try {
        websocket = new WebSocket(websocketUrl);
    } catch (e) {
        console.error('创建WebSocket时出错:', e);
        setStatus('连接错误: ' + (e.message || '无效URL'), 'disconnected');
        connectButton.innerHTML = '<i class="fas fa-plug mr-2"></i>连接到服务器';
        connectButton.disabled = false;
        addLog(`创建WebSocket失败: ${e.message || '未知错误'}`, 'error');
        return;
    }

    websocket.onopen = () => {
        console.log('WebSocket 连接已打开');
        setStatus('已连接', 'connected');
        connectButton.innerHTML = '<i class="fas fa-plug mr-2"></i>断开连接';
        connectButton.disabled = false;
        remoteDesktopImage.alt = '等待图像数据...';
        remoteDesktopImage.src = '';
        
        
        if (onConnected) onConnected();
        addControlListeners();
    };

    websocket.onmessage = (event) => {
        try {
            // 处理不同类型的消息
            if (typeof event.data === 'string') {
                if (event.data.startsWith('data:image/')) {
                    // Base64编码的图像数据
                    remoteDesktopImage.src = event.data;
                } else {
                    try {
                        // 尝试解析JSON消息
                        const jsonData = JSON.parse(event.data);
                        
                        // 处理不同类型的JSON消息
                        if (jsonData.type === "error") {
                            addLog(`服务器错误: ${jsonData.message || '未知错误'}`, 'error');
                        } else if (jsonData.type === "notification") {
                            addLog(`服务器通知: ${jsonData.message}`, 'info');
                        } else if (Array.isArray(jsonData) && onMessageHandler) {
                            // 处理录制数据
                            onMessageHandler(jsonData);
                        }
                    } catch (e) {
                        // JSON解析失败，作为普通文本消息处理
                        console.log('接收到文本消息:', event.data);
                    }
                }
            } else if (event.data instanceof Blob) {
                // 二进制图像数据
                if (imageObjectUrl) {
                    URL.revokeObjectURL(imageObjectUrl);
                }
                
                imageObjectUrl = URL.createObjectURL(event.data);
                remoteDesktopImage.src = imageObjectUrl;
                
                // 图像加载失败时的处理
                remoteDesktopImage.onerror = () => {
                    console.error('图像加载失败');
                    remoteDesktopImage.alt = '图像加载失败';
                };
            } else {
                console.warn('接收到未知格式的数据:', event.data);
            }
        } catch (error) {
            console.error('处理WebSocket消息时出错:', error);
            addLog(`处理消息出错: ${error.message || '未知错误'}`, 'error');
        }
    };

    websocket.onerror = (error) => {
        console.error('WebSocket 错误:', error);
        setStatus('连接错误', 'disconnected');
        connectButton.innerHTML = '<i class="fas fa-plug mr-2"></i>连接到服务器';
        connectButton.disabled = false;
        remoteDesktopImage.alt = '连接错误，无法加载图像。';
        remoteDesktopImage.src = '';
        removeControlListeners();
        addLog(`连接错误: ${error.message || '未知错误'}`, 'error');
    };

    websocket.onclose = (event) => {
        console.log('WebSocket 连接已关闭。 Code:', event.code, 'Reason:', event.reason);
        
        // 处理不同的关闭情况
        if (!connectIntentional) {
            // 非主动关闭，可能是连接断开，尝试重连
            if (reconnectAttempts < maxReconnectAttempts) {
                setStatus(`连接断开，${(reconnectInterval/1000).toFixed(0)}秒后尝试重连...`, 'disconnected');
                addLog(`WebSocket连接断开，准备重连 (${reconnectAttempts+1}/${maxReconnectAttempts})`, 'warning');
                
                // 设置重连计时器
                reconnectTimeout = setTimeout(() => {
                    reconnectAttempts++;
                    connectWebSocket(onConnected, onMessageHandler, addControlListeners, removeControlListeners);
                }, reconnectInterval);
                
                // 每次重连增加等待时间，最多10秒
                reconnectInterval = Math.min(reconnectInterval * 1.5, 10000);
                
                connectButton.innerHTML = '<i class="fas fa-sync fa-spin mr-2"></i>准备重连...';
                connectButton.disabled = false;
            } else {
                // 超过最大重连次数
                setStatus('重连失败，请手动连接', 'disconnected');
                addLog(`重连失败，请检查服务器状态后手动重试`, 'error');
                connectButton.innerHTML = '<i class="fas fa-plug mr-2"></i>连接到服务器';
                connectButton.disabled = false;
            }
        } else {
            // 用户手动断开连接
            setStatus('已断开', 'disconnected');
            connectButton.innerHTML = '<i class="fas fa-plug mr-2"></i>连接到服务器';
            connectButton.disabled = false;
        }

        // 清空显示图像
        remoteDesktopImage.alt = '远程桌面图像流将在此显示';
        remoteDesktopImage.src = '';
        
        // 移除控制监听
        removeControlListeners();
    };
}

// 断开WebSocket连接
function disconnectWebSocket() {
    const connectButton = document.getElementById('connectButton');

    if (websocket && (websocket.readyState === WebSocket.OPEN || websocket.readyState === WebSocket.CONNECTING)) {
        connectIntentional = true; // 设置为主动断开，不会触发重连
        websocket.close(1000, "用户手动断开");
        setStatus('正在断开...', 'connecting');
        connectButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>正在断开...';
        connectButton.disabled = true;
    } else {
        setStatus('未连接', 'disconnected');
        connectButton.innerHTML = '<i class="fas fa-plug mr-2"></i>连接到服务器';
        connectButton.disabled = false;
    }
}

// 获取WebSocket连接状态
function getWebsocketState() {
    if (!websocket) return WebSocket.CLOSED;
    return websocket.readyState;
}

// 初始化WebSocket连接地址
function initWebsocketUrl() {
    const websocketUrlInput = document.getElementById('websocketUrlInput');
    // 从localStorage中获取上次连接的URL
    const lastUrl = localStorage.getItem('lastWebsocketUrl');
    if (lastUrl) {
        websocketUrlInput.value = lastUrl;
    }
}

// 导出模块
export {
    connectWebSocket,
    disconnectWebSocket,
    sendControlCommand,
    getWebsocketState,
    setStatus,
    initWebsocketUrl,
    captureScreenshot,
    toggleControlEnabled,
    getControlEnabled,
    toggleCoordinateDisplay,
    getCoordinateDisplayEnabled
};
