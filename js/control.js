// control.js - 鼠标键盘控制功能

import { MOUSE_MOVE_INTERVAL_MS } from './config.js';
import { sendControlCommand } from './websocket.js';
import { getMouseButton, mapKeyToCode, getModifiers } from './utils.js';
import { getDirectControlStatus } from './events.js';

let latestMouseEvent = null;
let mouseMoveInterval = null;
let mouseCoordDisplay;

// 初始化控制相关功能
function initControl() {
    mouseCoordDisplay = document.getElementById('mouseCoordDisplay');
}

// 处理鼠标移动
function handleMouseMove(event) {
    if (!getDirectControlStatus()) return;
    const remoteDesktopImage = document.getElementById('remoteDesktopImage');
    const rect = remoteDesktopImage.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    const naturalWidth = remoteDesktopImage.naturalWidth;
    const naturalHeight = remoteDesktopImage.naturalHeight;

    // 如果图像还没有加载完成，直接返回
    if (naturalWidth === 0 || naturalHeight === 0) {
        mouseCoordDisplay.style.display = 'none';
        return;
    }

    let showX = 0, showY = 0;
    let visible = false;

    // 计算图像的实际宽高比和显示区域的宽高比   
    const imageAspectRatio = naturalWidth / naturalHeight;
    const displayAspectRatio = displayWidth / displayHeight;

    let renderedWidth = displayWidth, renderedHeight = displayHeight, offsetX = 0, offsetY = 0;

    // 根据宽高比调整渲染尺寸
    if (imageAspectRatio > displayAspectRatio) {
        // 图像更宽，以宽度为准
        renderedWidth = displayWidth;
        renderedHeight = displayWidth / imageAspectRatio;
        offsetX = 0;
        offsetY = (displayHeight - renderedHeight) / 2;
    } else {
        // 图像更高，以高度为准
        renderedWidth = displayHeight * imageAspectRatio;
        renderedHeight = displayHeight;
        offsetX = (displayWidth - renderedWidth) / 2;
        offsetY = 0;
    }

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const relativeToContentX = mouseX - offsetX;
    const relativeToContentY = mouseY - offsetY;

    // 检查鼠标是否在实际图像内容区域内
    if (relativeToContentX >= 0 && relativeToContentX <= renderedWidth &&
        relativeToContentY >= 0 && relativeToContentY <= renderedHeight) {

        const scaleX = naturalWidth / renderedWidth;
        const scaleY = naturalHeight / renderedHeight;
        const realX = relativeToContentX * scaleX;
        const realY = relativeToContentY * scaleY;

        // 确保坐标在有效范围内
        const boundedRealX = Math.max(0, Math.min(naturalWidth - 1, Math.floor(realX)));
        const boundedRealY = Math.max(0, Math.min(naturalHeight - 1, Math.floor(realY)));

        latestMouseEvent = { x: boundedRealX, y: boundedRealY };
        showX = boundedRealX;
        showY = boundedRealY;
        visible = true;
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

function handleKeyDown(event) {
    if (!getDirectControlStatus()) return;
    event.preventDefault();
    const key = mapKeyToCode(event.key);
    const modKeys = getModifiers(event);

    // 过滤掉key数组中属于modKey的内容
    const modKeySet = new Set(["lctrl", "lshift", "lalt", "lwin", "alt",
    "rctrl", "rshift", "ralt", "rwin", "meta"]);
    const filteredKey = (modKeySet.has(key)) ? [] : [key];

    sendControlCommand({
        "keyPress": {
            "modKey": modKeys,
            "key": filteredKey
        }
    });
}

function handleKeyUp(event) {
    if (!getDirectControlStatus()) return;
    event.preventDefault();
    const key = mapKeyToCode(event.key);
    const modKeys = getModifiers(event);

    // 过滤掉key数组中属于modKey的内容
    const modKeySet = new Set(["lctrl", "lshift", "lalt", "lwin", "alt",
    "rctrl", "rshift", "ralt", "rwin", "meta"]);
    const filteredKey = (modKeySet.has(key)) ? [] : [key];

    sendControlCommand({
        "keyRelease": {
            "modKey": modKeys,
            "key": filteredKey
        }
    });
}

function handleMouseDown(event) {
    if (!getDirectControlStatus()) return;

    event.preventDefault();
    const button = getMouseButton(event.button);
    if (button) {
        sendControlCommand({ "mousePress": [button] });
    }
}

function handleMouseUp(event) {
    if (!getDirectControlStatus()) return;

    event.preventDefault();
    const button = getMouseButton(event.button);
    if (button) {
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

function addControlListeners() {
    const remoteDesktopImage = document.getElementById('remoteDesktopImage');
    remoteDesktopImage.addEventListener('mousemove', handleMouseMove);
    remoteDesktopImage.addEventListener('mousedown', handleMouseDown);
    remoteDesktopImage.addEventListener('mouseup', handleMouseUp);
    remoteDesktopImage.addEventListener('wheel', handleMouseWheel, { passive: false });
    remoteDesktopImage.addEventListener('contextmenu', handleContextMenu);

    remoteDesktopImage.addEventListener('mouseenter', () => remoteDesktopImage.focus());
    remoteDesktopImage.addEventListener('keydown', handleKeyDown);
    remoteDesktopImage.addEventListener('keyup', handleKeyUp);
    
    // 鼠标离开时隐藏坐标
    remoteDesktopImage.addEventListener('mouseleave', () => {
        if (mouseCoordDisplay) mouseCoordDisplay.style.display = 'none';
    });

    if (mouseMoveInterval) {
        clearInterval(mouseMoveInterval);
    }

    mouseMoveInterval = setInterval(() => {
        if (latestMouseEvent && getDirectControlStatus()) {
            sendControlCommand({ "mouseMove": latestMouseEvent });
            latestMouseEvent = null;
        }
    }, MOUSE_MOVE_INTERVAL_MS);
}

function removeControlListeners() {
    const remoteDesktopImage = document.getElementById('remoteDesktopImage');
    remoteDesktopImage.removeEventListener('mousemove', handleMouseMove);
    remoteDesktopImage.removeEventListener('mousedown', handleMouseDown);
    remoteDesktopImage.removeEventListener('mouseup', handleMouseUp);
    remoteDesktopImage.removeEventListener('wheel', handleMouseWheel);
    remoteDesktopImage.removeEventListener('contextmenu', handleContextMenu);

    remoteDesktopImage.removeEventListener('mouseenter', () => remoteDesktopImage.focus());
    remoteDesktopImage.removeEventListener('keydown', handleKeyDown);
    remoteDesktopImage.removeEventListener('keyup', handleKeyUp);
    
    if (mouseMoveInterval) {
        clearInterval(mouseMoveInterval);
        mouseMoveInterval = null;
    }

    latestMouseEvent = null;
}

// 导出模块
export {
    initControl,
    addControlListeners,
    removeControlListeners
};
