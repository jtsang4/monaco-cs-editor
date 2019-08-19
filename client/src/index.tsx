import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { listen } from 'vscode-ws-jsonrpc';
import {
  createUrl,
  createWebSocket,
  createLanguageClient,
} from './common/editor'
import { LANGUAGE } from './constant/lsp';
import * as serviceWorker from './serviceWorker';

// create the web socket
const url = createUrl(`lsp/${LANGUAGE}`);
const webSocket = createWebSocket(url);
// listen when the web socket is opened
listen({
  webSocket,
  onConnection: connection => {
    // create and start the language client
    const languageClient = createLanguageClient(connection, [LANGUAGE]);
    const disposable = languageClient.start();
    connection.onClose(() => disposable.dispose());
  },
});

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
