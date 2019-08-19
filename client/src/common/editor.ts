import * as monaco from 'monaco-editor';
import { editor as Editor } from 'monaco-editor/esm/vs/editor/editor.api';
import { MessageConnection } from 'vscode-ws-jsonrpc';
import {
  MonacoServices,
  MonacoLanguageClient,
  ErrorAction,
  CloseAction,
  createConnection,
} from 'monaco-languageclient';
import normalizeUrl from 'normalize-url';
import ReconnectingWebSocket from '../lib/reconnecting-websocket';
import { LANGUAGE } from '../constant/lsp';

// monaco.languages.register({
//   id: 'python',
//   extensions: ['.py'],
//   aliases: ['Python'],
//   mimetypes: ['application/x-python-code', 'text/x-python'],
// });

export function createLanguageClient(connection: MessageConnection, languageIds: string[]): MonacoLanguageClient {
  return new MonacoLanguageClient({
    name: "Sample Language Client",
    clientOptions: {
      // use a language id as a document selector
      documentSelector: languageIds,
      // disable the default error handler
      errorHandler: {
        error: () => ErrorAction.Continue,
        closed: () => CloseAction.DoNotRestart
      }
    },
    // create a language client connection from the JSON RPC connection on demand
    connectionProvider: {
      get: (errorHandler, closeHandler) => {
        return Promise.resolve(createConnection(connection, errorHandler, closeHandler))
      }
    }
  });
}

export function createUrl(path: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return normalizeUrl(`${protocol}://${window.location.hostname}:3001${window.location.pathname}${path}`);
}

export function createWebSocket(url: string): WebSocket {
  const socketOptions = {
    maxReconnectionDelay: 10000,
    minReconnectionDelay: 1000,
    reconnectionDelayGrowFactor: 1.3,
    connectionTimeout: 10000,
    maxRetries: Infinity,
    debug: false
  };
  return new ReconnectingWebSocket(url, undefined, socketOptions);
}

function createEditor(elem: HTMLElement, value: string): Editor.IStandaloneCodeEditor {
  const editor = monaco.editor.create(elem, {
    model: monaco.editor.createModel(value, LANGUAGE, monaco.Uri.parse('file://demo.py')),
    glyphMargin: true,
    lightbulb: {
      enabled: true,
    },
    theme: 'vs-dark',
  });

  // install Monaco language client services
  MonacoServices.install(editor);

  return editor;
}

export default createEditor;
