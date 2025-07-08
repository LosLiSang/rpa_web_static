// main.js - 主程序入口，初始化和事件绑定

import { addLog } from './utils.js';
import { connectWebSocket, disconnectWebSocket, getWebsocketState, initWebsocketUrl, captureScreenshot, toggleControlEnabled, toggleCoordinateDisplay } from './websocket.js';
import { updateEventParams, addEvent, clearEvents, executeEvents, stopExecution, exportAtomicJson, importJson, batchImportJson, toggleSelectMode, batchDeleteEvents } from './events.js';
import { initControl, addControlListeners, removeControlListeners } from './control.js';
import { startRecording, stopRecording, handleRecordingResult } from './recording.js';
import { showExportDialog } from './dialog.js';
import { copyAtomicEventsToClipboard } from './events.js';



// 初始化函数
function init() {
    // 初始化WebSocket URL
    initWebsocketUrl();

    // 获取DOM元素引用
    const connectButton = document.getElementById('connectButton');
    const captureBtn = document.getElementById('captureBtn');
    const controlToggleBtn = document.getElementById('controlToggleBtn');
    const coordToggleBtn = document.getElementById('coordToggleBtn');
    const addEventBtn = document.getElementById('addEventBtn');
    const eventType = document.getElementById('eventType');
    const clearEventsBtn = document.getElementById('clearEventsBtn');
    const executeEventsBtn = document.getElementById('executeEventsBtn');
    const stopExecutionBtn = document.getElementById('stopExecutionBtn');
    const startRecordingBtn = document.getElementById('startRecordingBtn');
    const stopRecordingBtn = document.getElementById('stopRecordingBtn');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const importJsonInput = document.getElementById('importJsonInput');
    const batchImportJsonInput = document.getElementById('batchImportJsonInput');

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
    
    // 截图按钮事件监听
    captureBtn.addEventListener('click', () => {
        captureScreenshot();
    });
    
    // 控制切换按钮事件监听
    controlToggleBtn.addEventListener('click', () => {
        toggleControlEnabled();
    });
    
    // 坐标显示切换按钮事件监听
    coordToggleBtn.addEventListener('click', () => {
        toggleCoordinateDisplay();
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



    // 更新导出按钮事件处理
    exportJsonBtn.addEventListener('click', async () => {
        const result = await showExportDialog();

        switch (result) {
            case 'copy':
                await copyAtomicEventsToClipboard();
                break;
            case 'export':
                exportAtomicJson();
                break;
            case 'cancel':
            default:
                // 用户取消或其他情况
                break;
        }
    });

    // 导入单个JSON
    importJsonInput.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            importJson(file);
            this.value = ''; // 清空input，方便连续导入
        }
    });

    // 批量导入JSON
    batchImportJsonInput.addEventListener('change', function () {
        const files = this.files;
        if (files && files.length > 0) {
            batchImportJson(files);
            this.value = ''; // 清空input，方便连续导入
        }
    });

    // 批量选择模式切换
    const selectModeToggleBtn = document.getElementById('selectModeToggleBtn');
    selectModeToggleBtn.addEventListener('click', toggleSelectMode);

    // 批量删除按钮
    const batchDeleteBtn = document.getElementById('batchDeleteBtn');
    batchDeleteBtn.addEventListener('click', batchDeleteEvents);

    // 添加初始日志
    addLog('远程桌面事件编排控制台已启动', 'success');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
