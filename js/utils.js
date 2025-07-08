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
        singleKeyEnter: '<i class="fas fa-key"></i>',
        combindKeyEnter: '<i class="fas fa-keyboard"></i>',
        mouseClick: '<i class="fas fa-mouse-pointer"></i>',
        stringEnter: '<i class="fas fa-edit"></i>',
        stringEnterGb2312: '<i class="fas fa-language"></i>',
        mouseMove: '<i class="fas fa-arrows-alt"></i>',
        mouseScroll: '<i class="fas fa-mouse"></i>',
        delay: '<i class="fas fa-hourglass-half"></i>'
    };
    return icons[type] || '<i class="fas fa-question-circle"></i>';
}

// 获取事件类型的中文名称
function getEventTypeName(type) {
    const names = {
        singleKeyEnter: '按下单个按键',
        combindKeyEnter: '执行组合按键',
        mouseClick: '鼠标单击',
        stringEnter: '输入字符串',
        stringEnterGb2312: '输入中文字符串',
        mouseMove: '鼠标移动',
        mouseScroll: '鼠标滚轮',
        delay: '延迟'
    };
    return names[type] || type;
}

// 获取事件参数的文本描述
function getEventParamsText(type, params) {
    // 鼠标按钮映射 - 基于服务器端Rust代码定义，确保一致性
    const buttonNames = { mleft: '左键', mright: '右键', mmiddle: '中键' };

    switch (type) {
        case 'singleKeyEnter':
            return `按键: ${params.key}`;
        case 'combindKeyEnter':
            return `按键: ${params.key}` + 
                (params.modKey ? `，修饰键: ${params.modKey}` : '');
        case 'mouseClick':
            return `按钮: ${buttonNames[params.button] || params.button}` +
                (params.x !== undefined && params.y !== undefined ? `，坐标: (${params.x}, ${params.y})` : '');
        case 'stringEnter':
            return `输入内容: ${params.text}`;
        case 'stringEnterGb2312':
            return `输入中文: ${params.text}`;
        case 'mouseMove':
            return `坐标: (${params.x}, ${params.y})`;
        case 'mouseScroll':
            return `滚动值: ${params.delta}`;
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

// 鼠标按钮映射 - 基于服务器端Rust代码定义
function getMouseButton(buttonCode) {
    // 按照Rust代码中的定义: mleft=0x00, mright=0x01, mmiddle=0x02
    // 但浏览器API中 event.button: 0=左键, 1=中键, 2=右键
    if (buttonCode === 0) return "mleft";   // 浏览器左键 -> Rust mleft
    if (buttonCode === 2) return "mright";  // 浏览器右键 -> Rust mright
    if (buttonCode === 1) return "mmiddle"; // 浏览器中键 -> Rust mmiddle
    return null;
}

// 键盘按键映射 - 基于服务器端Rust代码中的键码定义
function mapKeyToCode(key) {
    // 完整的按键映射表，与服务器端一致
    // 映射基于 KEYCODES: [(&'static str, u8); 110] 
    const keyMap = {
        // 鼠标按钮 (mleft=0x00, mright=0x01, mmiddle=0x02)
        'MouseLeft': 'mleft',
        'MouseRight': 'mright',
        'MouseMiddle': 'mmiddle',
        
        // 字母键 (a=0x04 至 z=0x1d)
        'a': 'a', 'b': 'b', 'c': 'c', 'd': 'd', 'e': 'e', 'f': 'f', 'g': 'g', 'h': 'h',
        'i': 'i', 'j': 'j', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'o': 'o', 'p': 'p',
        'q': 'q', 'r': 'r', 's': 's', 't': 't', 'u': 'u', 'v': 'v', 'w': 'w', 'x': 'x',
        'y': 'y', 'z': 'z',
        'A': 'a', 'B': 'b', 'C': 'c', 'D': 'd', 'E': 'e', 'F': 'f', 'G': 'g', 'H': 'h',
        'I': 'i', 'J': 'j', 'K': 'k', 'L': 'l', 'M': 'm', 'N': 'n', 'O': 'o', 'P': 'p',
        'Q': 'q', 'R': 'r', 'S': 's', 'T': 't', 'U': 'u', 'V': 'v', 'W': 'w', 'X': 'x',
        'Y': 'y', 'Z': 'z',
        
        // 数字键 (1=0x1e 至 0=0x27)
        '1': '1', '2': '2', '3': '3', '4': '4', '5': '5',
        '6': '6', '7': '7', '8': '8', '9': '9', '0': '0',
        
        // 特殊键
        'Enter': 'enter',         // 0x28
        'Escape': 'esc',          // 0x29
        'Backspace': 'backspace', // 0x2a
        'Tab': 'tab',             // 0x2b
        ' ': 'space',             // 0x2c
        '-': 'minus',             // 0x2d
        '=': 'equal',             // 0x2e
        '[': 'leftbracket',       // 0x2f
        ']': 'rightbracket',      // 0x30
        '\\': 'backslash',        // 0x31
        '#': 'hashtilde',         // 0x32
        '~': 'hashtilde',         // 0x32
        ';': 'semicolon',         // 0x33
        "'": 'apostrophe',        // 0x34
        '`': 'grave',             // 0x35
        ',': 'comma',             // 0x36
        '.': 'dot',               // 0x37
        '/': 'slash',             // 0x38
        'CapsLock': 'capslock',   // 0x39
        
        // 功能键 (f1=0x3a 至 f12=0x45)
        'F1': 'f1', 'F2': 'f2', 'F3': 'f3', 'F4': 'f4', 'F5': 'f5', 'F6': 'f6',
        'F7': 'f7', 'F8': 'f8', 'F9': 'f9', 'F10': 'f10', 'F11': 'f11', 'F12': 'f12',
        
        // 系统键
        'PrintScreen': 'printscreen', // 0x46
        'ScrollLock': 'scrolllock',   // 0x47
        'Pause': 'pause',             // 0x48
        'Insert': 'insert',           // 0x49
        'Home': 'home',               // 0x4a
        'PageUp': 'pageup',           // 0x4b
        'Delete': 'delete',           // 0x4c
        'End': 'end',                 // 0x4d
        'PageDown': 'pagedown',       // 0x4e
        'ArrowRight': 'right',        // 0x4f
        'ArrowLeft': 'left',          // 0x50
        'ArrowDown': 'down',          // 0x51
        'ArrowUp': 'up',              // 0x52
        'NumLock': 'numlock',         // 0x53
        
        // 小键盘 (kpslash=0x54 至 kpdot=0x63)
        'NumpadDivide': 'kpslash',       // 0x54
        'NumpadMultiply': 'kpasterisk',  // 0x55
        'NumpadSubtract': 'kpminus',     // 0x56
        'NumpadAdd': 'kpplus',           // 0x57
        'NumpadEnter': 'kpenter',        // 0x58
        'Numpad1': 'kp1',                // 0x59
        'Numpad2': 'kp2',                // 0x5a
        'Numpad3': 'kp3',                // 0x5b
        'Numpad4': 'kp4',                // 0x5c
        'Numpad5': 'kp5',                // 0x5d
        'Numpad6': 'kp6',                // 0x5e
        'Numpad7': 'kp7',                // 0x5f
        'Numpad8': 'kp8',                // 0x60
        'Numpad9': 'kp9',                // 0x61
        'Numpad0': 'kp0',                // 0x62
        'NumpadDecimal': 'kpdot',        // 0x63
        
        // 修饰键 (lctrl=0x80 至 rwin=0x87)
        // 处理 event.key 的情况
        'Control': 'lctrl',       // 0x80
        'Shift': 'lshift',        // 0x81
        'Alt': 'lalt',            // 0x82
        'Meta': 'lwin',           // 0x83

        // 处理 event.code 的情况
        'ControlLeft': 'lctrl',   // 0x80
        'ShiftLeft': 'lshift',    // 0x81
        'AltLeft': 'lalt',        // 0x82
        'MetaLeft': 'lwin',       // 0x83
        'ControlRight': 'rctrl',  // 0x84
        'ShiftRight': 'rshift',   // 0x85
        'AltRight': 'ralt',       // 0x86
        'MetaRight': 'rwin',      // 0x87
        
        // 其他可能形式
        'Left Control': 'lctrl',  // 0x80
        'Right Control': 'rctrl', // 0x84
        'Left Shift': 'lshift',   // 0x81
        'Right Shift': 'rshift',  // 0x85
        'Left Alt': 'lalt',       // 0x82
        'Right Alt': 'ralt',      // 0x86
        'Left Meta': 'lwin',      // 0x83
        'Right Meta': 'rwin',     // 0x87
        
        // 电源键
        'WakeUp': 'wakeup',       // 0xc2
        'Sleep': 'sleep',         // 0xc1
        'Power': 'power'          // 0xc3
    };

    // 检查直接映射
    if (keyMap[key]) {
        return keyMap[key];
    }
    
    // 小键盘数字处理 (兼容性处理)
    if (/^Numpad[0-9]$/.test(key)) {
        return 'kp' + key.slice(-1);
    }
    
    // 字母键处理 (兼容性处理)
    if (/^[a-zA-Z]$/.test(key)) {
        return key.toLowerCase();
    }
    
    // 数字键处理 (兼容性处理)
    if (/^[0-9]$/.test(key)) {
        return key;
    }
    
    // 功能键处理 (兼容性处理)
    if (/^F[1-9][0-2]?$/.test(key)) {
        return key.toLowerCase();
    }
    
    // 未知键，返回小写形式并记录日志
    console.warn('未映射的按键:', key);
    return key.toLowerCase();
}

// 获取修饰键 - 基于服务器端Rust代码定义
function getModifiers(event) {
    const modKeys = [];
    
    // 修饰键的映射，确保与Rust代码中KEYCODES定义的完全一致
    // lctrl=0x80, lshift=0x81, lalt=0x82, lwin=0x83, rctrl=0x84, rshift=0x85, ralt=0x86, rwin=0x87
    if (event.ctrlKey) {
        // KeyboardEvent.location: 0=标准键, 1=左侧键, 2=右侧键, 3=数字键盘
        modKeys.push(event.location === 2 ? "rctrl" : "lctrl");
    }
    if (event.altKey) {
        modKeys.push(event.location === 2 ? "ralt" : "lalt");
    }
    if (event.shiftKey) {
        modKeys.push(event.location === 2 ? "rshift" : "lshift");
    }
    if (event.metaKey) {
        modKeys.push(event.location === 2 ? "rwin" : "lwin");
    }
    
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
