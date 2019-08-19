"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ws = __importStar(require("ws"));
var url = __importStar(require("url"));
var express_1 = __importDefault(require("express"));
var rpc = __importStar(require("vscode-ws-jsonrpc"));
var server = __importStar(require("vscode-ws-jsonrpc/lib/server"));
var lsp = __importStar(require("vscode-languageserver"));
function launch(socket) {
    // 1. 创建 reader
    var reader = new rpc.WebSocketMessageReader(socket);
    // 2. 创建 writer
    var writer = new rpc.WebSocketMessageWriter(socket);
    // 3. 处理服务端连接
    var socketConnection = server.createConnection(reader, writer, function () { return socket.dispose(); });
    // 4. 转发连接到 LSPS(language-server-protocol server) 上
    var connectionForwarder = server.createServerProcess('python3', 'pyls');
    server.forward(socketConnection, connectionForwarder, function (message) {
        console.log('message:', message);
        if (rpc.isRequestMessage(message)) {
            if (message.method === lsp.InitializeRequest.type.method) {
                var initializeParams = message.params;
                initializeParams.processId = process.pid;
            }
        }
    });
}
// 处理出错
process.on('uncaughtException', function (err) {
    console.error('Uncaught Exception:', err.toString());
    if (err.stack) {
        console.error(err.stack);
    }
});
// 创建 HTTP 服务器
var PORT = '3001';
var app = express_1.default();
var HTTPServer = app.listen(PORT, function () {
    console.log("LSP server is listening at port: " + PORT);
});
// 创建 websocket server
var wss = new ws.Server({
    noServer: true,
    perMessageDeflate: false,
});
// 在 HTTP 服务器进行 'upgrade' 的时候利用 websocket 启用处理 rpc
HTTPServer.on('upgrade', function (request, socket, head) {
    var pathname = request.url ? url.parse(request.url).pathname : undefined;
    console.log('A request coming:', pathname, '\n');
    if (pathname === '/lsp/python') {
        wss.handleUpgrade(request, socket, head, function (websocket) {
            // rpc 配置
            var websocketRPC = {
                send: function (content) { return websocket.send(content, function (error) {
                    if (error) {
                        throw error;
                    }
                }); },
                onMessage: function (cb) {
                    websocket.on('message', cb);
                },
                onError: function (cb) {
                    websocket.on('error', cb);
                },
                onClose: function (cb) {
                    websocket.on('close', cb);
                },
                dispose: function () {
                    websocket.close();
                }
            };
            // 根据当前 websocket 的状态决定何时启动 rpc 连接
            if (websocket.readyState === websocket.OPEN) {
                launch(websocketRPC);
            }
            else {
                websocket.on('open', function () { return launch(websocketRPC); });
            }
        });
    }
});
//# sourceMappingURL=server.js.map