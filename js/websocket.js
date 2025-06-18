// websocket.js - WebSocket连接和通信功能

import { addLog } from './utils.js';

let websocket;
let connectIntentional = false;
let imageObjectUrl = null;

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
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify(command));
        console.log('Sent command:', command);
    } else {
        console.warn('WebSocket not connected. Command not sent:', command);
    }
}

// 连接到WebSocket服务器
function connectWebSocket(onConnected, onMessageHandler, addControlListeners, removeControlListeners) {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        console.log('WebSocket is already open.');
        return;
    }

    const connectButton = document.getElementById('connectButton');
    const websocketUrlInput = document.getElementById('websocketUrlInput');
    const remoteDesktopImage = document.getElementById('remoteDesktopImage');

    setStatus('正在连接...', 'connecting');
    connectButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>正在连接...';
    connectButton.disabled = true;
    connectIntentional = true;

    const websocketUrl = websocketUrlInput.value;
    websocket = new WebSocket(websocketUrl);

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
        if (typeof event.data === 'string') {
            if (event.data.startsWith('data:image/')) {
                remoteDesktopImage.src = event.data;
            } else {
                try {
                    // 尝试解析JSON消息
                    const arrayObject = JSON.parse(event.data);
                    if (onMessageHandler) onMessageHandler(arrayObject);
                } catch (e) {
                    // 普通文本消息
                    // console.log('接收到文本消息:', event.data);
                }
            }
        } else if (event.data instanceof Blob) {
            // 释放之前的URL
            if (imageObjectUrl) {
                URL.revokeObjectURL(imageObjectUrl);
            }

            imageObjectUrl = URL.createObjectURL(event.data);
            remoteDesktopImage.src = imageObjectUrl;
        } else {
            console.warn('接收到未知格式的数据:', event.data);
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
        if (connectIntentional && !event.wasClean && event.code !== 1000) {
            setStatus('连接丢失，请重试', 'disconnected');
        } else {
            setStatus('已断开', 'disconnected');
        }

        connectButton.innerHTML = '<i class="fas fa-plug mr-2"></i>连接到服务器';
        connectButton.disabled = false;

        if (!connectIntentional || (event.code !== 1000 && event.code !== 1005)) {
            remoteDesktopImage.alt = '远程桌面图像流将在此显示';
            remoteDesktopImage.src = '';
        }

        removeControlListeners();
    };
}

// 断开WebSocket连接
function disconnectWebSocket() {
    const connectButton = document.getElementById('connectButton');

    if (websocket && (websocket.readyState === WebSocket.OPEN || websocket.readyState === WebSocket.CONNECTING)) {
        connectIntentional = false;
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

// 导出模块
export {
    connectWebSocket,
    disconnectWebSocket,
    sendControlCommand,
    getWebsocketState,
    setStatus
};
