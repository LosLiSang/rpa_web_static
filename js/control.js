// control.js - 鼠标键盘控制功能

import { MOUSE_MOVE_INTERVAL_MS, MOUSE_MOVE_THRESHOLD_PX, MOUSE_MOVE_THROTTLE_MS } from './config.js';
import { sendControlCommand } from './websocket.js';
import { getMouseButton, mapKeyToCode, getModifiers } from './utils.js';
import { getDirectControlStatus } from './events.js';

let latestMouseEvent = null;
let mouseMoveInterval = null;
let mouseCoordDisplay;

// 缓存 DOM 相关属性
let cachedNaturalWidth = 0;
let cachedNaturalHeight = 0;
let cachedDisplayWidth = 0;
let cachedDisplayHeight = 0;
let needUpdateCache = true;

// 记录上一次发送的鼠标坐标（用于变化检测）
let lastSentX = null;
let lastSentY = null;

// 记录实际按下的键和鼠标按钮
let activeKeys = new Set();
let activeButtons = new Set();

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 初始化控制相关功能
function initControl() {
    mouseCoordDisplay = document.getElementById('mouseCoordDisplay');

    // 监听图像尺寸变化，更新缓存
    const remoteDesktopImage = document.getElementById('remoteDesktopImage');
    if (remoteDesktopImage) {
        const observer = new ResizeObserver(() => {
            needUpdateCache = true;
        });
        observer.observe(remoteDesktopImage);
    }
}

// 处理鼠标移动
function handleMouseMove(event) {
    if (!getDirectControlStatus()) return;

    const remoteDesktopImage = document.getElementById('remoteDesktopImage');

    // 更新缓存（如果需要）
    if (needUpdateCache) {
        cachedNaturalWidth = remoteDesktopImage.naturalWidth;
        cachedNaturalHeight = remoteDesktopImage.naturalHeight;
        const rect = remoteDesktopImage.getBoundingClientRect();
        cachedDisplayWidth = rect.width;
        cachedDisplayHeight = rect.height;
        needUpdateCache = false;
    }

    // 如果图像还没有加载完成，直接返回
    if (cachedNaturalWidth === 0 || cachedNaturalHeight === 0) {
        mouseCoordDisplay.style.display = 'none';
        return;
    }

    let showX = 0, showY = 0;
    let visible = false;

    // 计算图像的实际宽高比和显示区域的宽高比
    const imageAspectRatio = cachedNaturalWidth / cachedNaturalHeight;
    const displayAspectRatio = cachedDisplayWidth / cachedDisplayHeight;

    let renderedWidth = cachedDisplayWidth, renderedHeight = cachedDisplayHeight, offsetX = 0, offsetY = 0;

    // 根据宽高比调整渲染尺寸
    if (imageAspectRatio > displayAspectRatio) {
        // 图像更宽，以宽度为准
        renderedWidth = cachedDisplayWidth;
        renderedHeight = cachedDisplayWidth / imageAspectRatio;
        offsetX = 0;
        offsetY = (cachedDisplayHeight - renderedHeight) / 2;
    } else {
        // 图像更高，以高度为准
        renderedWidth = cachedDisplayHeight * imageAspectRatio;
        renderedHeight = cachedDisplayHeight;
        offsetX = (cachedDisplayWidth - renderedWidth) / 2;
        offsetY = 0;
    }

    // 获取鼠标相对于图像的位置
    const rect = remoteDesktopImage.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const relativeToContentX = mouseX - offsetX;
    const relativeToContentY = mouseY - offsetY;

    // 检查鼠标是否在实际图像内容区域内
    if (relativeToContentX >= 0 && relativeToContentX <= renderedWidth &&
        relativeToContentY >= 0 && relativeToContentY <= renderedHeight) {

        const scaleX = cachedNaturalWidth / renderedWidth;
        const scaleY = cachedNaturalHeight / renderedHeight;
        const realX = relativeToContentX * scaleX;
        const realY = relativeToContentY * scaleY;

        // 确保坐标在有效范围内
        const boundedRealX = Math.max(0, Math.min(cachedNaturalWidth - 1, Math.floor(realX)));
        const boundedRealY = Math.max(0, Math.min(cachedNaturalHeight - 1, Math.floor(realY)));

        // 检查坐标是否变化超过阈值
        const distance = Math.sqrt(
            Math.pow(boundedRealX - lastSentX, 2) +
            Math.pow(boundedRealY - lastSentY, 2)
        );

        if (lastSentX === null || distance >= MOUSE_MOVE_THRESHOLD_PX) {
            latestMouseEvent = { x: boundedRealX, y: boundedRealY };
            showX = boundedRealX;
            showY = boundedRealY;
            visible = true;
        } else {
            // 坐标变化小于阈值，但更新显示
            showX = boundedRealX;
            showY = boundedRealY;
            visible = true;
        }
    } else {
        // 鼠标在图像区域外
        visible = false;
    }

    // 更新坐标显示
    if (visible) {
        mouseCoordDisplay.textContent = `(${showX}, ${showY})`;
        mouseCoordDisplay.style.display = 'flex';
    } else {
        mouseCoordDisplay.style.display = 'none';
    }
}

// 创建节流版本的 handleMouseMove
const throttledHandleMouseMove = throttle(handleMouseMove, MOUSE_MOVE_THROTTLE_MS);

function handleKeyDown(event) {
    if (!getDirectControlStatus()) return;
    event.preventDefault();

    // 优先使用event.code获取物理键位信息，特别是对修饰键
    // 如果code不可用或无法映射，则回退到event.key
    let key;
    if (event.code && (event.code.startsWith('Control') ||
                       event.code.startsWith('Shift') ||
                       event.code.startsWith('Alt') ||
                       event.code.startsWith('Meta'))) {
        key = mapKeyToCode(event.code);
        console.log(`修饰键按下 - 使用code: ${event.code} -> ${key}`);
    } else {
        key = mapKeyToCode(event.key);
    }

    const modKeys = getModifiers(event);

    // 记录按下的键
    activeKeys.add(key);
    modKeys.forEach(modKey => activeKeys.add(modKey));

    // 过滤掉key数组中属于modKey的内容 - 确保与config.js中定义一致
    const modKeySet = new Set([
        "lctrl", "lshift", "lalt", "lwin",
        "rctrl", "rshift", "ralt", "rwin",
        // 兼容性名称
        "alt", "meta"
    ]);

    // 如果是修饰键被按下，需要特殊处理
    if (modKeySet.has(key)) {
        // 直接发送修饰键按下命令
        console.log(`修饰键按下: ${key}`, event);
        sendControlCommand({
            "keyPress": {
                "modKey": [key],  // 将按下的修饰键放入modKey数组
                "key": []
            }
        });
    } else {
        // 非修饰键正常处理
        console.log(`普通键按下: ${key}，修饰键状态:`, modKeys);
        sendControlCommand({
            "keyPress": {
                "modKey": modKeys,
                "key": [key]
            }
        });
    }
}

function handleKeyUp(event) {
    if (!getDirectControlStatus()) return;
    event.preventDefault();

    // 优先使用event.code获取物理键位信息，特别是对修饰键
    // 如果code不可用或无法映射，则回退到event.key
    let key;
    if (event.code && (event.code.startsWith('Control') ||
                       event.code.startsWith('Shift') ||
                       event.code.startsWith('Alt') ||
                       event.code.startsWith('Meta'))) {
        key = mapKeyToCode(event.code);
        console.log(`修饰键松开 - 使用code: ${event.code} -> ${key}`);
    } else {
        key = mapKeyToCode(event.key);
    }

    const modKeys = getModifiers(event);

    // 移除松开的键
    activeKeys.delete(key);
    modKeys.forEach(modKey => activeKeys.delete(modKey));

    // 过滤掉key数组中属于modKey的内容 - 确保与config.js中定义一致
    const modKeySet = new Set([
        "lctrl", "lshift", "lalt", "lwin",
        "rctrl", "rshift", "ralt", "rwin",
        // 兼容性名称
        "alt", "meta"
    ]);

    // 如果是修饰键被松开，需要特殊处理
    if (modKeySet.has(key)) {
        // 直接发送修饰键松开命令
        console.log(`修饰键松开: ${key}`, event);
        sendControlCommand({
            "keyRelease": {
                "modKey": [key],  // 将松开的修饰键放入modKey数组
                "key": []
            }
        });
    } else {
        // 非修饰键正常处理
        console.log(`普通键松开: ${key}，修饰键状态:`, modKeys);
        sendControlCommand({
            "keyRelease": {
                "modKey": modKeys,
                "key": [key]
            }
        });
    }
}

function handleMouseDown(event) {
    if (!getDirectControlStatus()) return;

    event.preventDefault();
    const button = getMouseButton(event.button);
    if (button) {
        activeButtons.add(button);
        sendControlCommand({ "mousePress": [button] });
    }
}

function handleMouseUp(event) {
    if (!getDirectControlStatus()) return;

    event.preventDefault();
    const button = getMouseButton(event.button);
    if (button) {
        activeButtons.delete(button);
        sendControlCommand({ "mouseRelease": [button] });
    }
}

function handleMouseWheel(event) {
    if (!getDirectControlStatus()) return;

    event.preventDefault();
    const delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail || -event.deltaY)));
    sendControlCommand({ "mouseScroll": delta });
}

function handleContextMenu(event) {
    event.preventDefault();
}

// 创建一个处理失去焦点事件的函数
function handleBlur() {
    if (!getDirectControlStatus()) return;

    console.log('远程桌面图像失去焦点，释放实际按下的键和按钮');

    // 只释放实际按下的键
    if (activeKeys.size > 0) {
        activeKeys.forEach(key => {
            sendControlCommand({
                "keyRelease": {
                    "modKey": [],
                    "key": [key]
                }
            });
        });
        activeKeys.clear();
    }

    // 只释放实际按下的鼠标按钮
    if (activeButtons.size > 0) {
        activeButtons.forEach(button => {
            sendControlCommand({ "mouseRelease": [button] });
        });
        activeButtons.clear();
    }
}

function addControlListeners() {
    const remoteDesktopImage = document.getElementById('remoteDesktopImage');
    remoteDesktopImage.addEventListener('mousemove', throttledHandleMouseMove);
    remoteDesktopImage.addEventListener('mousedown', handleMouseDown);
    remoteDesktopImage.addEventListener('mouseup', handleMouseUp);
    remoteDesktopImage.addEventListener('wheel', handleMouseWheel, { passive: false });
    remoteDesktopImage.addEventListener('contextmenu', handleContextMenu);

    remoteDesktopImage.addEventListener('mouseenter', () => remoteDesktopImage.focus());
    remoteDesktopImage.addEventListener('keydown', handleKeyDown);
    remoteDesktopImage.addEventListener('keyup', handleKeyUp);
    remoteDesktopImage.addEventListener('blur', handleBlur);

    // 鼠标离开时隐藏坐标
    remoteDesktopImage.addEventListener('mouseleave', () => {
        if (mouseCoordDisplay) mouseCoordDisplay.style.display = 'none';
    });

    if (mouseMoveInterval) {
        clearInterval(mouseMoveInterval);
    }

    // 使用 setInterval 定期发送鼠标位置（保持 10fps）
    mouseMoveInterval = setInterval(() => {
        if (latestMouseEvent && getDirectControlStatus()) {
            sendControlCommand({ "mouseMove": latestMouseEvent });
            lastSentX = latestMouseEvent.x;
            lastSentY = latestMouseEvent.y;
            latestMouseEvent = null;
        }
    }, MOUSE_MOVE_INTERVAL_MS);
}

function removeControlListeners() {
    const remoteDesktopImage = document.getElementById('remoteDesktopImage');
    remoteDesktopImage.removeEventListener('mousemove', throttledHandleMouseMove);
    remoteDesktopImage.removeEventListener('mousedown', handleMouseDown);
    remoteDesktopImage.removeEventListener('mouseup', handleMouseUp);
    remoteDesktopImage.removeEventListener('wheel', handleMouseWheel);
    remoteDesktopImage.removeEventListener('contextmenu', handleContextMenu);

    remoteDesktopImage.removeEventListener('mouseenter', () => remoteDesktopImage.focus());
    remoteDesktopImage.removeEventListener('keydown', handleKeyDown);
    remoteDesktopImage.removeEventListener('keyup', handleKeyUp);
    remoteDesktopImage.removeEventListener('blur', handleBlur);

    // 在移除监听器时，确保释放所有按键
    handleBlur();

    if (mouseMoveInterval) {
        clearInterval(mouseMoveInterval);
        mouseMoveInterval = null;
    }

    // 重置状态
    latestMouseEvent = null;
    lastSentX = null;
    lastSentY = null;
    activeKeys.clear();
    activeButtons.clear();
}

// 导出模块
export {
    initControl,
    addControlListeners,
    removeControlListeners
};
