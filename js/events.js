// events.js - 事件编排管理功能

import { eventTypeParams, modKeySet } from './config.js';
import { addLog, getEventIcon, getEventTypeName, getEventParamsText, sleep } from './utils.js';
import { sendControlCommand, getWebsocketState } from './websocket.js';

let events = [];
let isExecuting = false;
let executionIndex = 0;
let executionTimer = null;
let directControlEnabled = true;

// 初始化事件参数输入区域
function updateEventParams(eventParamsData = null) {
    const eventType = document.getElementById('eventType');
    const eventParams = document.getElementById('eventParams');
    const selectedType = eventType.value;
    const params = eventTypeParams[selectedType] || [];
    eventParams.innerHTML = '';

    if (params.length === 0) {
        eventParams.innerHTML = '<p class="text-slate-500 text-sm py-2 text-center">该事件类型无需额外参数</p>';
        return;
    }

    params.forEach(param => {
        const div = document.createElement('div');
        div.className = 'flex flex-col';
        const label = document.createElement('label');
        label.textContent = param.label + (param.required ? ' *' : '');
        label.className = 'text-xs text-slate-400 mb-1';

        if (param.type === 'select') {
            const select = document.createElement('select');
            select.id = `param_${param.name}`;
            select.className = 'input-field text-sm p-2';
            select.required = param.required;

            param.options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option.value;
                opt.textContent = option.text;
                select.appendChild(opt);
            });

            if (eventParamsData && eventParamsData[param.name] !== undefined) {
                select.value = eventParamsData[param.name];
            }

            div.appendChild(label);
            div.appendChild(select);
        } else {
            const input = document.createElement('input');
            input.type = param.type;
            input.id = `param_${param.name}`;
            input.placeholder = param.placeholder || '';
            input.className = 'input-field text-sm p-2';
            input.required = param.required;

            if (eventParamsData && eventParamsData[param.name] !== undefined) {
                input.value = eventParamsData[param.name];
            }

            div.appendChild(label);
            div.appendChild(input);
        }

        eventParams.appendChild(div);
    });
}

// 获取事件参数值
function getEventParams() {
    const eventType = document.getElementById('eventType');
    const selectedType = eventType.value;
    const params = eventTypeParams[selectedType] || [];
    const result = {};

    params.forEach(param => {
        const element = document.getElementById(`param_${param.name}`);
        if (element) {
            let value = element.value;
            if (param.type === 'number' && value !== '') {
                value = parseInt(value, 10);
                if (isNaN(value)) value = undefined;
            }
            result[param.name] = value;
        }
    });

    return result;
}

// 添加或更新事件
function addEvent() {
    const eventType = document.getElementById('eventType');
    const addEventBtn = document.getElementById('addEventBtn');
    const type = eventType.value;
    const params = getEventParams();

    // 验证必填参数
    const typeParams = eventTypeParams[type] || [];
    for (const param of typeParams) {
        if (param.required && (params[param.name] === '' || params[param.name] === undefined)) {
            alert(`请填写${param.label}`);
            return;
        }
    }

    const event = {
        id: Date.now() + Math.random(),
        type: type,
        params: params
    };

    // 如果是编辑现有事件，则替换该位置的事件
    if (editingEventIndex >= 0 && editingEventIndex < events.length) {
        events[editingEventIndex] = event;
        addLog(`已更新事件 #${editingEventIndex + 1}: ${getEventTypeName(event.type)}`, 'success');
        // 重置编辑状态
        editingEventIndex = -1;
        addEventBtn.innerHTML = '<i class="fas fa-plus mr-2"></i>添加';
        addEventBtn.classList.remove('editing');
    } else {
        // 否则添加新事件
        events.push(event);
        addLog(`添加事件: ${getEventTypeName(event.type)}`, 'success');
    }

    updateEventList();
    updateEventCount();

    // 重置参数区
    updateEventParams();
}

// 更新事件列表显示
function updateEventList() {
    const eventList = document.getElementById('eventList');
    
    if (events.length === 0) {
        eventList.innerHTML = `
            <div class="text-center py-10 text-slate-500">
                <i class="fas fa-inbox text-3xl mb-2"></i>
                <p>暂无事件，请添加事件到序列</p>
            </div>
        `;
        return;
    }

    eventList.innerHTML = '';

    events.forEach((event, index) => {
        const div = document.createElement('div');
        div.className = 'event-item bg-slate-800 p-4 rounded-lg flex items-center justify-between';
        div.setAttribute('data-index', index);
        div.setAttribute('draggable', 'true');

        const content = document.createElement('div');
        content.className = 'flex-1 flex items-center';

        // 序号
        const indexSpan = document.createElement('span');
        indexSpan.textContent = `${index + 1}.`;
        indexSpan.className = 'text-teal-400 font-bold mr-3 w-6 text-center';
        content.appendChild(indexSpan);

        // 图标
        const icon = document.createElement('div');
        icon.className = 'text-blue-400 mr-3';
        icon.innerHTML = getEventIcon(event.type);
        content.appendChild(icon);

        // 事件信息
        const infoDiv = document.createElement('div');
        infoDiv.className = 'flex-1';
        const typeName = getEventTypeName(event.type);
        const paramsText = getEventParamsText(event.type, event.params);

        infoDiv.innerHTML = `
            <div class="text-sm font-medium text-slate-200">${typeName}</div>
            <div class="text-xs text-slate-400 mt-1">${paramsText}</div>
        `;
        content.appendChild(infoDiv);

        // 控制按钮
        const controls = document.createElement('div');
        controls.className = 'flex items-center space-x-2';

        const dragHandle = document.createElement('span');
        dragHandle.className = 'drag-handle text-slate-500 px-2 py-1';
        dragHandle.innerHTML = '<i class="fas fa-grip-lines"></i>';

        const editBtn = document.createElement('button');
        editBtn.className = 'text-slate-300 hover:text-blue-400 transition';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.title = '编辑';
        editBtn.onclick = () => editEvent(index);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'text-slate-300 hover:text-red-400 transition';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.title = '删除';
        deleteBtn.onclick = () => deleteEvent(index);

        controls.appendChild(dragHandle);
        controls.appendChild(editBtn);
        controls.appendChild(deleteBtn);

        div.appendChild(content);
        div.appendChild(controls);
        eventList.appendChild(div);
    });

    makeEventListSortable();
}

// 拖拽排序实现
function makeEventListSortable() {
    const eventList = document.getElementById('eventList');
    let dragSrcIndex = null;
    const items = eventList.querySelectorAll('.event-item');

    items.forEach((item, idx) => {
        item.ondragstart = (e) => {
            dragSrcIndex = idx;
            e.dataTransfer.effectAllowed = 'move';
            item.classList.add('opacity-50', 'bg-slate-700');
        };

        item.ondragend = () => {
            items.forEach(i => i.classList.remove('opacity-50', 'bg-slate-700', 'border-t-2', 'border-b-2', 'border-teal-400'));
        };

        item.ondragover = (e) => {
            e.preventDefault();
            if (dragSrcIndex === null || dragSrcIndex === idx) return;

            const rect = item.getBoundingClientRect();
            if (e.clientY < rect.top + rect.height / 2) {
                item.classList.add('border-t-2', 'border-teal-400');
                item.classList.remove('border-b-2');
            } else {
                item.classList.add('border-b-2', 'border-teal-400');
                item.classList.remove('border-t-2');
            }
        };

        item.ondragleave = () => {
            item.classList.remove('border-t-2', 'border-b-2', 'border-teal-400');
        };

        item.ondrop = (e) => {
            e.preventDefault();
            if (dragSrcIndex === null || dragSrcIndex === idx) return;

            const targetIdx = idx;
            const moved = events.splice(dragSrcIndex, 1)[0];
            events.splice(targetIdx, 0, moved);

            updateEventList();
            updateEventCount();
            addLog(`重新排序事件序列`, 'info');
        };
    });
}

// 保存要编辑的事件索引
let editingEventIndex = -1;

// 编辑事件
function editEvent(index) {
    const eventType = document.getElementById('eventType');
    const addEventBtn = document.getElementById('addEventBtn');
    const event = events[index];
    eventType.value = event.type;
    updateEventParams(event.params);

    // 设置当前正在编辑的事件索引
    editingEventIndex = index;
    
    // 更改按钮文本为"更新"
    addEventBtn.innerHTML = '<i class="fas fa-edit mr-2"></i>更新';
    addEventBtn.classList.add('editing');
    
    // 高亮被编辑的事件
    const eventItems = document.querySelectorAll('.event-item');
    eventItems.forEach((item, idx) => {
        if (idx === index) {
            item.classList.add('editing-item');
        } else {
            item.classList.remove('editing-item');
        }
    });
    
    addLog(`正在编辑事件 #${index + 1}: ${getEventTypeName(event.type)}`, 'info');
}

// 删除事件
function deleteEvent(index) {
    const event = events[index];
    if (confirm(`确认删除事件: ${getEventTypeName(event.type)}?`)) {
        events.splice(index, 1);
        updateEventList();
        updateEventCount();
        updateEventParams();
        addLog(`删除事件: ${getEventTypeName(event.type)}`, 'warning');
    }
}

// 清空所有事件
function clearEvents() {
    if (events.length === 0) return;

    if (confirm('确认清空所有事件？')) {
        events = [];
        updateEventList();
        updateEventCount();
        updateEventParams();
        addLog(`已清空所有事件`, 'warning');
    }
}

// 更新事件计数
function updateEventCount() {
    document.getElementById('eventCount').textContent = `${events.length} 个事件`;
}

// 执行编排事件
async function executeEvents(removeControlListeners) {
    if (events.length === 0) {
        alert('没有事件可执行');
        return;
    }

    if (getWebsocketState() !== WebSocket.OPEN) {
        alert('请先连接到WebSocket服务器');
        return;
    }

    isExecuting = true;
    executionIndex = 0;
    directControlEnabled = false;
    addLog(`开始执行事件序列 (共 ${events.length} 个事件)`, 'success');

    // 更新UI
    const executeEventsBtn = document.getElementById('executeEventsBtn');
    const stopExecutionBtn = document.getElementById('stopExecutionBtn');
    const executionStatus = document.getElementById('executionStatus');
    const executionStatusText = document.getElementById('executionStatusText');
    const executionProgress = document.getElementById('executionProgress');
    const eventProgressText = document.getElementById('eventProgressText');
    
    executeEventsBtn.classList.add('hidden');
    stopExecutionBtn.classList.remove('hidden');
    executionStatus.classList.remove('hidden');
    executionStatusText.textContent = '执行中...';
    eventProgressText.textContent = `0/${events.length}`;
    executionProgress.style.width = '0%';

    // 移除右侧图像的控制监听器
    removeControlListeners();

    try {
        await executeNextEvent();
    } catch (error) {
        console.error('执行事件时出错:', error);
        addLog(`执行事件时出错: ${error.message}`, 'error');
        stopExecution();
    }
}

// 执行下一个事件
async function executeNextEvent() {
    const executionStatusText = document.getElementById('executionStatusText');
    const executionProgress = document.getElementById('executionProgress');
    const eventProgressText = document.getElementById('eventProgressText');
    const eventList = document.getElementById('eventList');
    
    if (!isExecuting || executionIndex >= events.length) {
        stopExecution();
        return;
    }

    const event = events[executionIndex];
    const progress = ((executionIndex + 1) / events.length) * 100;

    // 更新进度
    executionProgress.style.width = progress + '%';
    executionStatusText.textContent = `执行中...`;
    eventProgressText.textContent = `${executionIndex + 1}/${events.length}`;

    // 高亮当前执行的事件
    const eventItems = eventList.querySelectorAll('.event-item');
    eventItems.forEach((item, index) => {
        if (index === executionIndex) {
            item.classList.add('event-executing');
        } else {
            item.classList.remove('event-executing');
        }
    });

    try {
        addLog(`执行事件 #${executionIndex + 1}: ${getEventTypeName(event.type)}`, 'info');
        await executeEventAtomically(event);
        executionIndex++;

        // 继续执行下一个事件
        if (isExecuting) {
            executionTimer = setTimeout(() => executeNextEvent(), 100);
        }
    } catch (error) {
        throw error;
    }
}

// 原子事件拆解与执行
async function executeEventAtomically(event) {
    switch (event.type) {
        case 'keySingle':
            sendControlCommand({ keyPress: { key: [event.params.key], modKey: [] } });
            await sleep(100);
            sendControlCommand({ keyRelease: { key: [event.params.key], modKey: [] } });
            break;

        case 'keyCombo':
            {
                const keys = event.params.keys.split(',').map(k => k.trim()).filter(Boolean);
                const modKey = keys.filter(k => modKeySet.has(k));
                const filteredKey = keys.filter(k => !modKeySet.has(k));

                sendControlCommand({ keyPress: { modKey: modKey, key: filteredKey } });
                await sleep(100);
                sendControlCommand({ keyRelease: { modKey: modKey, key: filteredKey } });
            }
            break;

        case 'mouseClick':
            if (event.params.x !== undefined && event.params.y !== undefined)
                sendControlCommand({ mouseMove: { x: Number(event.params.x), y: Number(event.params.y) } });
            sendControlCommand({ mousePress: [event.params.button] });
            await sleep(100);
            sendControlCommand({ mouseRelease: [event.params.button] });
            break;

        case 'mouseDoubleClick':
            for (let i = 0; i < 2; i++) {
                if (event.params.x !== undefined && event.params.y !== undefined)
                    sendControlCommand({ mouseMove: { x: Number(event.params.x), y: Number(event.params.y) } });
                sendControlCommand({ mousePress: [event.params.button] });
                await sleep(100);
                sendControlCommand({ mouseRelease: [event.params.button] });
                await sleep(100);
            }
            break;

        case 'mouseDown':
            if (event.params.x !== undefined && event.params.y !== undefined)
                sendControlCommand({ mouseMove: { x: Number(event.params.x), y: Number(event.params.y) } });
            sendControlCommand({ mousePress: [event.params.button] });
            break;

        case 'mouseUp':
            sendControlCommand({ mouseRelease: [event.params.button] });
            break;

        case 'mouseMove':
            sendControlCommand({ mouseMove: { x: Number(event.params.x), y: Number(event.params.y) } });
            break;

        case 'mouseScroll':
            sendControlCommand({ mouseScroll: Number(event.params.delta) });
            break;

        case 'mouseDrag':
            {
                const duration = Number(event.params.duration) || 100;
                if (event.params.startX !== undefined && event.params.startY !== undefined)
                    sendControlCommand({ mouseMove: { x: Number(event.params.startX), y: Number(event.params.startY) } });
                sendControlCommand({ mousePress: [event.params.button] });
                if (event.params.endX !== undefined && event.params.endY !== undefined) {
                    await sleep(duration);
                    sendControlCommand({ mouseMove: { x: Number(event.params.endX), y: Number(event.params.endY) } });
                }
                sendControlCommand({ mouseRelease: [event.params.button] });
            }
            break;

        case 'delay':
            const delayTime = Number(event.params.ms) || 100;
            addLog(`等待 ${delayTime} 毫秒`, 'info');
            await sleep(delayTime);
            break;
    }
}

// 停止执行
function stopExecution() {
    isExecuting = false;
    executionIndex = 0;

    if (executionTimer) {
        clearTimeout(executionTimer);
        executionTimer = null;
    }
    
    const executeEventsBtn = document.getElementById('executeEventsBtn');
    const stopExecutionBtn = document.getElementById('stopExecutionBtn');
    const executionStatusText = document.getElementById('executionStatusText');
    const eventList = document.getElementById('eventList');

    executionStatusText.textContent = '已停止';
    executeEventsBtn.classList.remove('hidden');
    stopExecutionBtn.classList.add('hidden');
    directControlEnabled = true;

    // 取消高亮
    const eventItems = eventList.querySelectorAll('.event-item');
    eventItems.forEach(item => item.classList.remove('event-executing'));

    addLog(`事件执行已停止`, 'warning');
}

// 原子事件拆解函数
function flattenToAtomicEvents() {
    const atomicEvents = [];
    function pushDelay(ms) {
        atomicEvents.push({ delay: ms });
    }
    for (const event of events) {
        switch (event.type) {
            case 'keySingle':
                atomicEvents.push({
                    keyPress: { modKey: [], key: [event.params.key] }
                });
                pushDelay(100);
                atomicEvents.push({
                    keyRelease: { modKey: [], key: [event.params.key] }
                });
                break;
            case 'keyCombo': {
                const keys = event.params.keys.split(',').map(k => k.trim()).filter(Boolean);
                const modKey = keys.filter(k => modKeySet.has(k));
                const filteredKey = keys.filter(k => !modKeySet.has(k));
                atomicEvents.push({
                    keyPress: { modKey: modKey, key: filteredKey }
                });
                pushDelay(100);
                atomicEvents.push({
                    keyRelease: { modKey: modKey, key: filteredKey }
                });
                break;
            }
            case 'mouseClick':
                if (event.params.x !== undefined && event.params.y !== undefined)
                    atomicEvents.push({ mouseMove: { x: Number(event.params.x), y: Number(event.params.y) } });
                atomicEvents.push({ mousePress: [event.params.button] });
                pushDelay(100);
                atomicEvents.push({ mouseRelease: [event.params.button] });
                break;
            case 'mouseDoubleClick':
                for (let i = 0; i < 2; i++) {
                    if (event.params.x !== undefined && event.params.y !== undefined)
                        atomicEvents.push({ mouseMove: { x: Number(event.params.x), y: Number(event.params.y) } });
                    atomicEvents.push({ mousePress: [event.params.button] });
                    pushDelay(100);
                    atomicEvents.push({ mouseRelease: [event.params.button] });
                    pushDelay(100);
                }
                break;
            case 'mouseDown':
                if (event.params.x !== undefined && event.params.y !== undefined)
                    atomicEvents.push({ mouseMove: { x: Number(event.params.x), y: Number(event.params.y) } });
                atomicEvents.push({ mousePress: [event.params.button] });
                break;
            case 'mouseUp':
                atomicEvents.push({ mouseRelease: [event.params.button] });
                break;
            case 'mouseMove':
                atomicEvents.push({ mouseMove: { x: Number(event.params.x), y: Number(event.params.y) } });
                break;
            case 'mouseScroll':
                atomicEvents.push({ mouseScroll: { delta: Number(event.params.delta) } });
                break;
            case 'mouseDrag': {
                const duration = Number(event.params.duration) || 100;
                if (event.params.startX !== undefined && event.params.startY !== undefined)
                    atomicEvents.push({ mouseMove: { x: Number(event.params.startX), y: Number(event.params.startY) } });
                atomicEvents.push({ mousePress: [event.params.button] });
                if (event.params.endX !== undefined && event.params.endY !== undefined) {
                    pushDelay(duration);
                    atomicEvents.push({ mouseMove: { x: Number(event.params.endX), y: Number(event.params.endY) } });
                }
                atomicEvents.push({ mouseRelease: [event.params.button] });
                break;
            }
            case 'delay':
                pushDelay(Number(event.params.ms) || 100);
                break;
        }
    }
    return atomicEvents;
}

// 导出为原子event的JSON
function exportAtomicJson() {
    if (events.length === 0) {
        alert('没有事件可导出');
        return;
    }
    const atomicEvents = flattenToAtomicEvents();
    const blob = new Blob([JSON.stringify(atomicEvents, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `remote_desktop_atomic_events_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
    addLog('已导出事件序列为原子JSON文件', 'success');
}

// 导出当前编排事件为JSON
function exportJson() {
    if (events.length === 0) {
        alert('没有事件可导出');
        return;
    }

    const data = {
        version: "1.0",
        events
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `remote_desktop_events_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
    addLog('已导出事件序列为JSON文件', 'success');
}

// 判断是否是原子事件
function isAtomicEvent(event) {
    // 原子事件直接包含键盘、鼠标操作或延迟
    return event && (
        event.keyPress !== undefined ||
        event.keyRelease !== undefined ||
        event.mouseMove !== undefined ||
        event.mousePress !== undefined ||
        event.mouseRelease !== undefined ||
        event.mouseScroll !== undefined ||
        event.delay !== undefined
    );
}

// 原子事件转换为高级事件
function convertAtomicToHighLevelEvents(atomicEvents) {
    if (!Array.isArray(atomicEvents) || atomicEvents.length === 0) {
        return [];
    }
    
    const highLevelEvents = [];
    let i = 0;
    
    while (i < atomicEvents.length) {
        const current = atomicEvents[i];
        
        // 处理键盘事件
        if (current.keyPress && i + 1 < atomicEvents.length && atomicEvents[i+1].keyRelease) {
            // 检查是否是组合键
            if (current.keyPress.modKey && current.keyPress.modKey.length > 0) {
                const keys = [...current.keyPress.modKey, ...(current.keyPress.key || [])].join(',');
                highLevelEvents.push({
                    id: Date.now() + Math.random(),
                    type: 'keyCombo',
                    params: { keys }
                });
            } else if (current.keyPress.key && current.keyPress.key.length === 1) {
                highLevelEvents.push({
                    id: Date.now() + Math.random(),
                    type: 'keySingle',
                    params: { key: current.keyPress.key[0] }
                });
            }
            i += 2; // 跳过press和release
            
            // 跳过延迟
            if (i < atomicEvents.length && atomicEvents[i].delay) i++;
            
            continue;
        }
        
        // 处理鼠标点击
        if (current.mousePress && i + 1 < atomicEvents.length && atomicEvents[i+1].mouseRelease) {
            // 检查是否有之前的mouseMove
            let x, y;
            if (i > 0 && atomicEvents[i-1].mouseMove) {
                x = atomicEvents[i-1].mouseMove.x;
                y = atomicEvents[i-1].mouseMove.y;
            }
            
            highLevelEvents.push({
                id: Date.now() + Math.random(),
                type: 'mouseClick',
                params: { 
                    button: current.mousePress[0],
                    x,
                    y
                }
            });
            
            i += 2; // 跳过press和release
            
            // 跳过延迟
            if (i < atomicEvents.length && atomicEvents[i].delay) i++;
            
            continue;
        }
        
        // 处理鼠标移动
        if (current.mouseMove && 
            (i === 0 || !atomicEvents[i-1].mousePress) && 
            (i === atomicEvents.length-1 || !atomicEvents[i+1].mousePress)) {
            
            highLevelEvents.push({
                id: Date.now() + Math.random(),
                type: 'mouseMove',
                params: { 
                    x: current.mouseMove.x,
                    y: current.mouseMove.y
                }
            });
            
            i++; // 移动到下一个事件
            continue;
        }
        
        // 处理鼠标拖拽
        if (current.mouseMove && i + 2 < atomicEvents.length && 
            atomicEvents[i+1].mousePress && 
            atomicEvents[i+2].mouseMove &&
            i + 3 < atomicEvents.length && atomicEvents[i+3].mouseRelease) {
            
            highLevelEvents.push({
                id: Date.now() + Math.random(),
                type: 'mouseDrag',
                params: { 
                    button: atomicEvents[i+1].mousePress[0],
                    startX: current.mouseMove.x,
                    startY: current.mouseMove.y,
                    endX: atomicEvents[i+2].mouseMove.x,
                    endY: atomicEvents[i+2].mouseMove.y
                }
            });
            
            i += 4; // 跳过这个序列
            continue;
        }
        
        // 处理鼠标滚轮
        if (current.mouseScroll) {
            highLevelEvents.push({
                id: Date.now() + Math.random(),
                type: 'mouseScroll',
                params: { 
                    delta: typeof current.mouseScroll === 'number' 
                        ? current.mouseScroll 
                        : current.mouseScroll.delta
                }
            });
            
            i++; // 下一个事件
            continue;
        }
        
        // 处理延迟
        if (current.delay) {
            highLevelEvents.push({
                id: Date.now() + Math.random(),
                type: 'delay',
                params: { ms: current.delay }
            });
            
            i++; // 下一个事件
            continue;
        }
        
        // 默认情况：无法识别的原子事件，简单跳过
        i++;
    }
    
    return highLevelEvents;
}

// 导入JSON
function importJson(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            let importedEvents = [];
            let isAtomicImport = false;
            
            // 判断数据格式
            if (Array.isArray(data.events)) {
                // 高级事件格式 {version, events}
                importedEvents = data.events;
            } else if (Array.isArray(data)) {
                // 可能是直接的高级事件数组或原子事件数组
                if (data.length > 0 && isAtomicEvent(data[0])) {
                    // 原子事件
                    isAtomicImport = true;
                    importedEvents = convertAtomicToHighLevelEvents(data);
                } else {
                    // 高级事件
                    importedEvents = data;
                }
            } else {
                alert('导入的JSON格式不正确');
                return;
            }
            
            if (confirm('是否要替换当前事件列表？点击"确定"替换，点击"取消"追加。')) {
                events = importedEvents;
            } else {
                events = events.concat(importedEvents);
            }

            updateEventList();
            updateEventCount();
            updateEventParams();
            
            if (isAtomicImport) {
                addLog(`成功导入并转换为高级事件，共 ${importedEvents.length} 个事件`, 'success');
            } else {
                addLog(`成功导入事件序列，共 ${importedEvents.length} 个事件`, 'success');
            }
        } catch (err) {
            alert('导入失败: ' + err.message);
            addLog(`导入失败: ${err.message}`, 'error');
        }
    };

    reader.readAsText(file);
}

// 获取直接控制状态
function getDirectControlStatus() {
    return directControlEnabled;
}

// 导出模块
export {
    updateEventParams,
    addEvent,
    clearEvents,
    executeEvents,
    stopExecution,
    exportAtomicJson,
    exportJson,
    importJson,
    getDirectControlStatus
};
