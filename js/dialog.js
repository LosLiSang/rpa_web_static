/* dialog.js - 对话框功能 */

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
                    <div class="text-teal-300 font-medium">高级事件</div>
                    <div class="text-xs text-slate-400">导出更易读的高级事件格式，更适合人工编辑</div>
                </div>
            </div>
            <div class="flex items-center mt-2">
                <div class="flex-1">
                    <div class="text-teal-300 font-medium">原子事件</div>
                    <div class="text-xs text-slate-400">导出底层原子事件，更适合直接执行</div>
                </div>
            </div>
        </div>
    `;
    
    return createDialog(
        "导出事件序列", 
        content,
        [
            { text: "高级事件", value: "high", type: "primary" },
            { text: "原子事件", value: "atomic", type: "warning" },
            { text: "取消", value: "cancel", type: "secondary" }
        ]
    );
}

export {
    createDialog,
    showExportDialog
};
