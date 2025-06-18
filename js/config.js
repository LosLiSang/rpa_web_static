// config.js - 配置和常量定义

// 事件类型参数配置
const eventTypeParams = {
    keySingle: [
        { name: 'key', type: 'text', label: '按键', placeholder: '如: a, enter, esc', required: true }
    ],
    keyCombo: [
        { name: 'keys', type: 'text', label: '组合键（逗号分隔）', placeholder: '如: lctrl,c', required: true }
    ],
    mouseClick: [
        {
            name: 'button', type: 'select', label: '按钮', options: [
                { value: 'mleft', text: '左键' },
                { value: 'mmiddle', text: '中键' },
                { value: 'mright', text: '右键' }
            ], required: true
        },
        { name: 'x', type: 'number', label: 'X坐标（可选）', placeholder: '', required: false },
        { name: 'y', type: 'number', label: 'Y坐标（可选）', placeholder: '', required: false }
    ],
    mouseDoubleClick: [
        {
            name: 'button', type: 'select', label: '按钮', options: [
                { value: 'mleft', text: '左键' },
                { value: 'mmiddle', text: '中键' },
                { value: 'mright', text: '右键' }
            ], required: true
        },
        { name: 'x', type: 'number', label: 'X坐标（可选）', placeholder: '', required: false },
        { name: 'y', type: 'number', label: 'Y坐标（可选）', placeholder: '', required: false }
    ],
    mouseDown: [
        {
            name: 'button', type: 'select', label: '按钮', options: [
                { value: 'mleft', text: '左键' },
                { value: 'mmiddle', text: '中键' },
                { value: 'mright', text: '右键' }
            ], required: true
        },
        { name: 'x', type: 'number', label: 'X坐标（可选）', placeholder: '', required: false },
        { name: 'y', type: 'number', label: 'Y坐标（可选）', placeholder: '', required: false }
    ],
    mouseUp: [
        {
            name: 'button', type: 'select', label: '按钮', options: [
                { value: 'mleft', text: '左键' },
                { value: 'mmiddle', text: '中键' },
                { value: 'mright', text: '右键' }
            ], required: true
        }
    ],
    mouseMove: [
        { name: 'x', type: 'number', label: 'X坐标', placeholder: '', required: true },
        { name: 'y', type: 'number', label: 'Y坐标', placeholder: '', required: true }
    ],
    mouseScroll: [
        { name: 'delta', type: 'number', label: '滚动值', placeholder: '正负整数', required: true }
    ],
    mouseDrag: [
        {
            name: 'button', type: 'select', label: '按钮', options: [
                { value: 'mleft', text: '左键' },
                { value: 'mmiddle', text: '中键' },
                { value: 'mright', text: '右键' }
            ], required: true
        },
        { name: 'startX', type: 'number', label: '起始X（可选）', placeholder: '', required: false },
        { name: 'startY', type: 'number', label: '起始Y（可选）', placeholder: '', required: false },
        { name: 'endX', type: 'number', label: '终点X（可选）', placeholder: '', required: false },
        { name: 'endY', type: 'number', label: '终点Y（可选）', placeholder: '', required: false },
        { name: 'duration', type: 'number', label: '持续时间(ms)', placeholder: '默认100', required: false }
    ],
    delay: [
        { name: 'ms', type: 'number', label: '延迟时间(毫秒)', placeholder: '100', required: false }
    ]
};

// 修饰键字符串集合
const modKeySet = new Set([
    "lctrl", "lshift", "lalt", "lwin", "alt",
    "rctrl", "rshift", "ralt", "rwin", "meta"
]);

// 鼠标移动间隔时间配置
const MOUSE_MOVE_INTERVAL_MS = 100;

// 导出模块
export { eventTypeParams, modKeySet, MOUSE_MOVE_INTERVAL_MS };
