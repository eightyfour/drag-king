import { ProgressToast } from './ProgressToast';

const events = {
    getFiles: [],
    deleteFile: [],
    fileSend: []
};

function emit(name: keyof typeof events, ...args: unknown[]) {
    events[name].forEach((listener) => listener(...args));
}

function uploadRequest(file: File): Promise<{ file: string; name: string; type: string }> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const progress = ProgressToast(file.name);
        xhr.upload.onprogress = (event) => progress.update(event.loaded / 1000, event.total / 1000);
        xhr.onloadend = () => progress.destroy();
        xhr.onload = () => {
            if (xhr.status !== 200) {
                reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
                return;
            }
            try {
                resolve(JSON.parse(xhr.responseText));
            } catch (error) {
                reject(error);
            }
        };
        xhr.onerror = () => reject(new Error('Upload network error'));
        xhr.onabort = () => reject(new Error('Upload cancelled'));
        xhr.open('POST', `/uploadFile?folder=${encodeURIComponent(location.pathname)}&filename=${encodeURIComponent(file.name)}`);
        const body = new FormData();
        body.append('myFile', file);
        xhr.send(body);
    });
}

async function sendFile(file: File) {
    try {
        emit('fileSend', null, await uploadRequest(file));
    } catch (error) {
        console.error('Upload failed:', error);
        emit('fileSend', error, null);
    }
}

async function deleteFile(file: string, callback?: (error: Error | null, file: string) => void) {
    try {
        const response = await fetch(`/deleteFile?filename=${encodeURIComponent(file)}`, { method: 'POST' });
        if (!response.ok) throw new Error(`Delete failed (${response.status}): ${await response.text()}`);
        callback?.(null, file);
        emit('deleteFile', null, file);
    } catch (error) {
        console.error('Delete failed:', error);
        callback?.(error, file);
        emit('deleteFile', error, file);
    }
}

async function getFiles(pathName?: string) {
    try {
        const response = await fetch('/getFiles', { method: 'POST', body: pathName || location.pathname });
        if (!response.ok) throw new Error(`File list failed (${response.status}): ${await response.text()}`);
        emit('getFiles', await response.json());
    } catch (error) {
        console.error('Unable to load files:', error);
    }
}

export function on(eventObj) {
    Object.keys(eventObj).forEach((name) => {
        if (!Object.hasOwn(events, name)) throw new Error(`Unknown event: ${name}`);
        events[name].push(eventObj[name]);
    });
}

const calls = { getFiles, sendFile, deleteFile };
export function doCall(name: 'getFiles'): typeof getFiles;
export function doCall(name: 'sendFile'): typeof sendFile;
export function doCall(name: 'deleteFile'): typeof deleteFile;
export function doCall(name: keyof typeof calls) {
    return calls[name];
}
