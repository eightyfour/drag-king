import * as canny from 'canny';
import { FolderItem } from './model/Folder';
import { fileFilter } from './utils';

export enum serverCalls {
    loadModuleConfig,
    saveFile,
    getDirectoryTree,
    saveModuleConfig,
    copy,
    move,
    remove,
    rename
}

interface OnListener {
    init?: (config: { path: string; user: {
        name?: string; alias?: string; isMaintainer?: boolean; isAdmin?: boolean
    } }) => void;
    getDirectoryTree?: (items: FolderItem[]) => void;
    copy?: (from: string, to: string) => void;
    move?: (from: string, to: string) => void;
    remove?: (file: string) => void;
    rename?: (from: string, to: string) => void;
}

interface Response {
    id: number;
    result?: unknown;
    error?: { code: string; message: string };
}

const listeners: { [key: string]: Function[] } = {};
const pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
let nextId = 0;
let socket: WebSocket;
let connected: Promise<void>;

function emit(name: string, ...args: unknown[]) {
    (listeners[name] || []).forEach((listener) => listener(...args));
}

function send<T>(method: string, args: unknown[]): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const id = ++nextId;
        const timer = setTimeout(() => {
            pending.delete(id);
            reject(new Error(`${method} timed out`));
        }, 15000);
        pending.set(id, { resolve: resolve as (value: unknown) => void, reject, timer });
        socket.send(JSON.stringify({ id, method, args }));
    });
}

function connect(): Promise<void> {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    socket = new WebSocket(`${protocol}//${location.host}/ws`);
    return new Promise<void>((resolve, reject) => {
        socket.onopen = async () => {
            try {
                const config = await send<{ path: string; user: object }>('init', [location.pathname]);
                emit('init', config);
                resolve();
            } catch (error) {
                reject(error);
                socket.close();
            }
        };
        socket.onmessage = (event) => {
            try {
                const message: Response = JSON.parse(event.data);
                const request = pending.get(message.id);
                if (!request) return;
                pending.delete(message.id);
                clearTimeout(request.timer);
                if (message.error) {
                    const error = new Error(message.error.message);
                    error.name = message.error.code;
                    request.reject(error);
                } else {
                    request.resolve(message.result);
                }
            } catch (error) {
                console.error('Invalid WebSocket message:', error);
            }
        };
        socket.onerror = () => console.error('WebSocket connection error');
        socket.onclose = () => {
            const error = new Error('WebSocket connection closed');
            pending.forEach((request) => {
                clearTimeout(request.timer);
                request.reject(error);
            });
            pending.clear();
            reject(error);
            connected = undefined;
            setTimeout(() => {
                if (!connected) {
                    connected = connect();
                    connected.catch((error) => console.error('WebSocket reconnect failed:', error));
                }
            }, 1000);
        };
    });
}

canny.ready(() => {
    if (!connected) {
        connected = connect();
        connected.catch((error) => console.error('WebSocket initialization failed:', error));
    }
});

export const tradeWs = {
    on(obj: OnListener) {
        Object.keys(obj).forEach((name) => {
            if (!['init', 'getDirectoryTree', 'copy', 'move', 'remove', 'rename'].includes(name)) {
                throw new Error(`Unsupported event: ${name}`);
            }
            (listeners[name] ||= []).push(obj[name]);
        });
    },
    async request<T = unknown>(name: serverCalls, ...args: unknown[]): Promise<T> {
        if (!connected) connected = connect();
        await connected;
        const method = serverCalls[name];
        if (!method) throw new Error(`Unsupported operation: ${name}`);
        const result = await send<T>(method, args);
        if (method === 'getDirectoryTree') {
            const filtered = fileFilter(result as FolderItem[]);
            emit(method, filtered);
            return filtered as T;
        }
        if (method === 'remove') emit(method, (result as { file: string }).file);
        if (['copy', 'move', 'rename'].includes(method)) {
            const { from, to } = result as { from: string; to: string };
            emit(method, from, to);
        }
        return result;
    }
};
