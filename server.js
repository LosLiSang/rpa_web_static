// 简单的本地开发服务器
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3456;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
};

const server = http.createServer((request, response) => {
    console.log(`请求: ${request.url}`);

    // 规范化请求的URL路径
    let filePath = '.' + request.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    // 获取文件扩展名
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // 读取文件
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // 文件不存在
                console.error(`文件不存在: ${filePath}`);
                response.writeHead(404);
                response.end('404 - 文件不存在');
            } else {
                // 服务器错误
                console.error(`服务器错误: ${error.code}`);
                response.writeHead(500);
                response.end(`服务器错误: ${error.code}`);
            }
        } else {
            // 成功响应
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`服务器运行在: http://localhost:${PORT}`);
    console.log(`请在浏览器中打开上面的地址来访问您的应用`);
});
