/* dialog.js - 对话框功能 */


// 复制文本到粘贴板
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            // 使用现代的 Clipboard API
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // 回退到传统方法
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            const result = document.execCommand('copy');
            document.body.removeChild(textArea);
            return result;
        }
    } catch (err) {
        console.error('复制到粘贴板失败:', err);
        return false;
    }
}

// 显示复制成功/失败的提示
function showCopyNotification(success, message) {
    const notification = document.createElement('div');
    notification.className = `copy-notification ${success ? 'success' : 'error'}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${success ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;

    document.body.appendChild(notification);

    // 动画显示
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);

    // 3秒后自动消失
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 创建简单的对话框
function createDialog(title, content, buttons) {
    return new Promise((resolve) => {
        // 创建背景遮罩
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        document.body.appendChild(overlay);

        // 创建对话框元素
        const dialog = document.createElement('div');
        dialog.className = 'dialog';

        // 标题
        const titleEl = document.createElement('h3');
        titleEl.className = 'dialog-title';
        titleEl.textContent = title;
        dialog.appendChild(titleEl);

        // 内容
        const contentEl = document.createElement('div');
        contentEl.className = 'dialog-content';

        if (typeof content === 'string') {
            contentEl.innerHTML = content;
        } else {
            contentEl.appendChild(content);
        }

        dialog.appendChild(contentEl);

        // 按钮区域
        const buttonsEl = document.createElement('div');
        buttonsEl.className = 'dialog-buttons';

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.textContent = btn.text;
            button.className = `btn-${btn.type || 'secondary'} dialog-button`;

            button.addEventListener('click', () => {
                document.body.removeChild(overlay);
                resolve(btn.value);
            });

            buttonsEl.appendChild(button);
        });

        dialog.appendChild(buttonsEl);
        overlay.appendChild(dialog);

        // ESC键关闭
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(overlay);
                document.removeEventListener('keydown', handleEsc);
                resolve(null);
            }
        };

        document.addEventListener('keydown', handleEsc);
    });
}

// 导出对话框
function showExportDialog() {
    const content = document.createElement('div');
    content.innerHTML = `
        <p>请选择要导出的事件格式:</p>
        <div class="mt-4 space-y-3">
            <div class="flex items-center">
                <div class="flex-1">
                    <div class="text-teal-300 font-medium">复制到粘贴板</div>
                    <div class="text-xs text-slate-400">适合之后直接使用运行</div>
                </div>
            </div>
            <div class="flex items-center mt-2">
                <div class="flex-1">
                    <div class="text-teal-300 font-medium">导出为json</div>
                    <div class="text-xs text-slate-400">导出为Json，适合之后编辑</div>
                </div>
            </div>
        </div>
    `;

    return createDialog(
        "导出事件序列",
        content,
        [
            { text: "复制到粘贴板", value: "copy", type: "primary" },
            { text: "导出为json", value: "export", type: "warning" },
            { text: "取消", value: "cancel", type: "secondary" }
        ]
    );
}

export {
    createDialog,
    showExportDialog,
    copyToClipboard,
    showCopyNotification
};