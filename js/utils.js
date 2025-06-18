// utils.js - 工具函数

// 添加日志函数
function addLog(message, type = 'info') {
    const terminal = document.getElementById('terminal');
    const line = document.createElement('div');
    line.className = `terminal-line terminal-${type}`;

    const now = new Date();
    const timestamp = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;

    line.innerHTML = `<span class="text-slate-500">${timestamp}</span> ${message}`;
    terminal.appendChild(line);

    // 滚动到底部
    terminal.scrollTop = terminal.scrollHeight;
}

// 获取事件图标
function getEventIcon(type) {
    const icons = {
        keySingle: '<i class="fas fa-key"></i>',
        keyCombo: '<i class="fas fa-keyboard"></i>',
        mouseClick: '<i class="fas fa-mouse-pointer"></i>',
        mouseDoubleClick: '<i class="fas fa-mouse"></i>',
        mouseDown: '<i class="fas fa-hand-pointer"></i>',
        mouseUp: '<i class="fas fa-hand-point-up"></i>',
        mouseMove: '<i class="fas fa-arrows-alt"></i>',
        mouseScroll: '<i class="fas fa-mouse"></i>',
        mouseDrag: '<i class="fas fa-arrows-alt-h"></i>',
        delay: '<i class="fas fa-hourglass-half"></i>'
    };
    return icons[type] || '<i class="fas fa-question-circle"></i>';
}

// 获取事件类型的中文名称
function getEventTypeName(type) {
    const names = {
        keySingle: '按下单个按键',
        keyCombo: '执行组合按键',
        mouseClick: '鼠标单击',
        mouseDoubleClick: '鼠标双击',
        mouseDown: '鼠标按下',
        mouseUp: '鼠标松开',
        mouseMove: '鼠标移动',
        mouseScroll: '鼠标滚轮',
        mouseDrag: '鼠标拖拽',
        delay: '延迟'
    };
    return names[type] || type;
}

// 获取事件参数的文本描述
function getEventParamsText(type, params) {
    const buttonNames = { mleft: '左键', mright: '右键', mmiddle: '中键' };

    switch (type) {
        case 'keySingle':
            return `按键: ${params.key}`;
        case 'keyCombo':
            return `组合键: ${params.keys}`;
        case 'mouseClick':
        case 'mouseDoubleClick':
        case 'mouseDown':
            return `按钮: ${buttonNames[params.button] || params.button}` +
                (params.x !== undefined && params.y !== undefined ? `，坐标: (${params.x}, ${params.y})` : '');
        case 'mouseUp':
            return `按钮: ${buttonNames[params.button] || params.button}`;
        case 'mouseMove':
            return `坐标: (${params.x}, ${params.y})`;
        case 'mouseScroll':
            return `滚动值: ${params.delta}`;
        case 'mouseDrag':
            return `按钮: ${buttonNames[params.button] || params.button}` +
                (params.startX !== undefined && params.startY !== undefined ? `，起点: (${params.startX}, ${params.startY})` : '') +
                (params.endX !== undefined && params.endY !== undefined ? `，终点: (${params.endX}, ${params.endY})` : '') +
                (params.duration ? `，持续: ${params.duration}ms` : '');
        case 'delay':
            return `延迟: ${params.ms || 100}ms`;
        default:
            return JSON.stringify(params);
    }
}

// Promise化的sleep函数
function sleep(ms) { 
    return new Promise(r => setTimeout(r, ms)); 
}

// 鼠标按钮映射
function getMouseButton(buttonCode) {
    if (buttonCode === 0) return "mleft";
    if (buttonCode === 1) return "mmiddle";
    if (buttonCode === 2) return "mright";
    return null;
}

// 键盘按键映射
function mapKeyToCode(key) {
    const keyMap = {
        'Enter': 'enter',
        'Escape': 'esc',
        'Backspace': 'backspace',
        'Tab': 'tab',
        ' ': 'space',
        '-': 'minus',
        '=': 'equal',
        '[': 'leftbracket',
        ']': 'rightbracket',
        '\\': 'backslash',
        '#': 'hashtilde',
        '~': 'hashtilde',
        ';': 'semicolon',
        "'": 'apostrophe',
        '`': 'grave',
        ',': 'comma',
        '.': 'dot',
        '/': 'slash',
        'CapsLock': 'capslock',
        'PrintScreen': 'printscreen',
        'ScrollLock': 'scrolllock',
        'Pause': 'pause',
        'Insert': 'insert',
        'Home': 'home',
        'PageUp': 'pageup',
        'Delete': 'delete',
        'End': 'end',
        'PageDown': 'pagedown',
        'ArrowRight': 'right',
        'ArrowLeft': 'left',
        'ArrowDown': 'down',
        'ArrowUp': 'up',
        'NumLock': 'numlock',
        'F1': 'f1', 'F2': 'f2', 'F3': 'f3', 'F4': 'f4', 'F5': 'f5', 'F6': 'f6',
        'F7': 'f7', 'F8': 'f8', 'F9': 'f9', 'F10': 'f10', 'F11': 'f11', 'F12': 'f12',
        '/': 'kpslash', '*': 'kpasterisk', '-': 'kpminus', '+': 'kpplus', 'Enter': 'kpenter',
        '.': 'kpdot'
    };

    // 小键盘数字
    if (/^Numpad[0-9]$/.test(key)) return 'kp' + key.slice(-1);
    // 主键盘数字
    if (/^[0-9]$/.test(key)) return key;
    // 字母
    if (/^[a-zA-Z]$/.test(key)) return key.toLowerCase();
    // 功能键
    if (/^F[1-9][0-2]?$/.test(key)) return key.toLowerCase();
    // 其它映射
    return keyMap[key] || key.toLowerCase();
}

// 获取修饰键
function getModifiers(event) {
    const modKeys = [];
    if (event.ctrlKey) modKeys.push(event.location === 2 ? "rctrl" : "lctrl");
    if (event.altKey) modKeys.push(event.location === 2 ? "ralt" : "lalt");
    if (event.shiftKey) modKeys.push(event.location === 2 ? "rshift" : "lshift");
    if (event.metaKey) modKeys.push(event.location === 2 ? "rwin" : "lwin");
    return modKeys;
}

// 导出工具函数
export {
    addLog,
    getEventIcon,
    getEventTypeName,
    getEventParamsText,
    sleep,
    getMouseButton,
    mapKeyToCode,
    getModifiers
};
