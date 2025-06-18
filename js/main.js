// main.js - 主程序入口，初始化和事件绑定

import { eventTypeParams } from './config.js';
import { addLog } from './utils.js';
import { connectWebSocket, disconnectWebSocket, getWebsocketState } from './websocket.js';
import { updateEventParams, addEvent, clearEvents, executeEvents, stopExecution, exportAtomicJson, exportJson, importJson } from './events.js';
import { initControl, addControlListeners, removeControlListeners } from './control.js';
import { startRecording, stopRecording, handleRecordingResult } from './recording.js';
import { showExportDialog } from './dialog.js';

// 初始化函数
function init() {
    // 获取DOM元素引用
    const connectButton = document.getElementById('connectButton');
    const addEventBtn = document.getElementById('addEventBtn');
    const eventType = document.getElementById('eventType');
    const clearEventsBtn = document.getElementById('clearEventsBtn');
    const executeEventsBtn = document.getElementById('executeEventsBtn');
    const stopExecutionBtn = document.getElementById('stopExecutionBtn');
    const startRecordingBtn = document.getElementById('startRecordingBtn');
    const stopRecordingBtn = document.getElementById('stopRecordingBtn');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const exportAtomicJsonBtn = document.getElementById('exportAtomicJsonBtn');
    const importJsonInput = document.getElementById('importJsonInput');
    
    // 初始化控制功能
    initControl();
    
    // 初始化事件参数
    updateEventParams();
    
    // WebSocket连接事件监听
    connectButton.addEventListener('click', () => {
        if (getWebsocketState() === WebSocket.CLOSED || getWebsocketState() === WebSocket.CLOSING) {
            connectWebSocket(null, handleRecordingResult, addControlListeners, removeControlListeners);
        } else if (getWebsocketState() === WebSocket.OPEN) {
            disconnectWebSocket();
        }
    });
    
    // 添加事件按钮
    addEventBtn.addEventListener('click', addEvent);
    
    // 事件类型变更监听
    eventType.addEventListener('change', () => updateEventParams());
    
    // 清空事件按钮
    clearEventsBtn.addEventListener('click', clearEvents);
    
    // 执行事件按钮
    executeEventsBtn.addEventListener('click', () => executeEvents(removeControlListeners));
    
    // 停止执行按钮
    stopExecutionBtn.addEventListener('click', stopExecution);
    
    // 录制按钮
    startRecordingBtn.addEventListener('click', startRecording);
    stopRecordingBtn.addEventListener('click', stopRecording);
    
    // 导入导出按钮
    exportJsonBtn.addEventListener('click', async () => {
        const result = await showExportDialog();
        if (result === "high") {
            exportJson();
        } else if (result === "atomic") {
            exportAtomicJson();
        }
    });
    exportAtomicJsonBtn.addEventListener('click', exportAtomicJson);
    
    // 导入JSON
    importJsonInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            importJson(file);
            this.value = ''; // 清空input，方便连续导入
        }
    });
    
    // 添加初始日志
    addLog('远程桌面事件编排控制台已启动', 'success');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
