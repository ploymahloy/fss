import * as path from 'node:path';
import { LanguageClient, TransportKind } from 'vscode-languageclient/lib/node/main.js';
let client;
export function activate(context) {
    const serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'));
    const serverOptions = {
        run: {
            command: process.execPath,
            args: [serverModule],
            transport: TransportKind.ipc
        },
        debug: {
            command: process.execPath,
            args: [serverModule],
            transport: TransportKind.ipc
        }
    };
    const clientOptions = {
        documentSelector: [{ scheme: 'file', language: 'fss' }]
    };
    client = new LanguageClient('fssLanguageServer', 'FSS Language Server', serverOptions, clientOptions);
    client.start();
    context.subscriptions.push(client);
}
export function deactivate() {
    return client?.stop();
}
