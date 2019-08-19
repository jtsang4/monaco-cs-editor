import * as ws from 'ws';
import * as http from 'http';
import * as url from 'url';
import * as net from 'net';
import express from 'express';
import * as rpc from 'vscode-ws-jsonrpc';
import * as server from 'vscode-ws-jsonrpc/lib/server';
import * as lsp from 'vscode-languageserver';

function launch(socket: rpc.IWebSocket) {
  // 1. 创建 reader
  const reader = new rpc.WebSocketMessageReader(socket);

  // 2. 创建 writer
  const writer = new rpc.WebSocketMessageWriter(socket);

  // 3. 处理服务端连接
  const socketConnection = server.createConnection(reader, writer, () => socket.dispose());

  // 4. 转发连接到 LSPS(language-server-protocol server) 上
  const connectionForwarder = server.createServerProcess('python3', 'pyls');
  server.forward(socketConnection, connectionForwarder, (message: any): any => {
    console.log('message:', message);
    if (rpc.isRequestMessage(message)) {
      if (message.method === lsp.InitializeRequest.type.method) {
        const initializeParams = message.params as lsp.InitializeParams;
        initializeParams.processId = process.pid;
      }
    }
  })
}

// 处理出错
process.on('uncaughtException', (err: any) => {
  console.error('Uncaught Exception:', err.toString());
  if (err.stack) {
    console.error(err.stack);
  }
});

// 创建 HTTP 服务器
const PORT = '3001';
const app = express();
const HTTPServer = app.listen(PORT, () => {
  console.log(`LSP server is listening at port: ${PORT}`)
});

// 创建 websocket server
const wss = new ws.Server({
  noServer: true,
  perMessageDeflate: false,
});

// 在 HTTP 服务器进行 'upgrade' 的时候利用 websocket 启用处理 rpc
HTTPServer.on('upgrade', (request: http.IncomingMessage, socket: net.Socket, head: Buffer) => {
  const pathname = request.url ? url.parse(request.url).pathname : undefined;
  console.log('A request coming:', pathname, '\n');

  if (pathname === '/lsp/python') {
    wss.handleUpgrade(request, socket, head, (websocket: any) => {
      // rpc 配置
      const websocketRPC: rpc.IWebSocket = {
        send: (content: string) => websocket.send(content, (error: Error) => {
          if (error) {
            throw error;
          }
        }),
        onMessage(cb: (data: any) => void): void {
          websocket.on('message', cb);
        },
        onError(cb: (reason: any) => void): void {
          websocket.on('error', cb);
        },
        onClose(cb: (code: number, reason: string) => void): void {
          websocket.on('close', cb);
        },
        dispose(): void {
          websocket.close();
        }
      };

      // 根据当前 websocket 的状态决定何时启动 rpc 连接
      if (websocket.readyState === websocket.OPEN) {
        launch(websocketRPC);
      } else {
        websocket.on('open', () => launch(websocketRPC));
      }
    });
  }
});
