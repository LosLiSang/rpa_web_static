// config.js - 配置和常量定义

// 事件类型参数配置
const eventTypeParams = {
    singleKeyEnter: [
        { name: 'key', type: 'text', label: '按键', placeholder: '如: a, enter, esc', required: true }
    ],
    combindKeyEnter: [
        { name: 'key', type: 'text', label: '普通按键（空格分割）', placeholder: '如: a, enter, esc', required: true },
        { name: 'modKey', type: 'text', label: '魔法键（空格分割）', placeholder: '如: lctrl lalt', required: true }
    ],
    mouseClick: [
        {
            name: 'button', type: 'select', label: '按钮', options: [
                { value: 'mleft', text: '左键' },
                { value: 'mmiddle', text: '中键' },
                { value: 'mright', text: '右键' }
            ], required: true
        }
    ],
    stringEnter: [
        {
            name: 'text', type: 'text', label: '输入内容', placeholder: '请输入Ascii可打印字符串', required: true
        }
    ],
    stringEnterGb2312: [
        {
            name: 'text', type: 'text', label: '输入内容', placeholder: '请输入GB2312编码的字符串（如: 中文）', required: true
        }
    ],
    mouseMove: [
        { name: 'x', type: 'number', label: 'X坐标', placeholder: '', required: true },
        { name: 'y', type: 'number', label: 'Y坐标', placeholder: '', required: true }
    ],
    mouseScroll: [
        { name: 'delta', type: 'number', label: '滚动值', placeholder: '正负整数', required: true }
    ],
    delay: [
        { name: 'ms', type: 'number', label: '延迟时间(毫秒)', placeholder: '100', required: false }
    ]
};

// 修饰键字符串集合 - 基于服务器端Rust代码定义
// lctrl=0x80, lshift=0x81, lalt=0x82, lwin=0x83, rctrl=0x84, rshift=0x85, ralt=0x86, rwin=0x87
const modKeySet = new Set([
    "lctrl", "lshift", "lalt", "lwin",
    "rctrl", "rshift", "ralt", "rwin",
    // 兼容性名称
    "alt", "meta"
]);

// 鼠标移动间隔时间配置
const MOUSE_MOVE_INTERVAL_MS = 100;

// 导出模块
export { eventTypeParams, modKeySet, MOUSE_MOVE_INTERVAL_MS };
