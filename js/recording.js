// recording.js - 录制功能

import { addLog } from './utils.js';
import { sendControlCommand } from './websocket.js';

let isRecording = false;

// 开始录制
function startRecording() {
    if (isRecording) return;
    
    isRecording = true;
    sendControlCommand({ recordType: "RecordStart" });
    document.getElementById('startRecordingBtn').classList.add('hidden');
    document.getElementById('stopRecordingBtn').classList.remove('hidden');
    addLog('开始录制用户操作...', 'success');
}

// 结束录制
function stopRecording() {
    if (!isRecording) return;

    isRecording = false;
    sendControlCommand({ recordType: "RecordEnd" });
    document.getElementById('startRecordingBtn').classList.remove('hidden');
    document.getElementById('stopRecordingBtn').classList.add('hidden');
    addLog('结束录制，等待服务器返回操作序列...', 'info');
}

// 处理录制结果
function handleRecordingResult(data) {
    console.log('接收到录制结果:', data);
    if (!data || !Array.isArray(data)) {
        addLog('收到无效的录制数据', 'error');
        return;
    }

    // 将录制结果保存为JSON文件
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `remote_desktop_recording_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
    addLog(`录制操作已保存，包含 ${data.length} 个操作`, 'success');
}

// 导出模块
export {
    startRecording,
    stopRecording,
    handleRecordingResult
};
