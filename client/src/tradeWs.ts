// TODO rename file
import * as canny from 'canny';
import { forSessionCookie } from './cookieManager';
import * as shoe from 'shoe';
import * as dnode from 'dnode';
import { FolderItem } from './model/Folder'
import { fileFilter } from './utils'

interface RemoteServer {
    loadModuleConfig: (file:string, callback:() => void) => void;
    saveFile: (fileName:string, content: string, callback: (result:any) => {}) => void;
    saveModuleConfig: (filePath:string, obj: object, callback: (result:any) => {}) => void;
    init: (path: any, callback: (obj: any) => void) => void;
    getDirectoryTree: (path: string, callback: (folderItems:Array<FolderItem>) => void) => void;
}
interface OnListener {
    loadModuleConfig?: () => void;
    getDirectoryTree?: (folderItems:Array<FolderItem>) => void;
    init?: (config: any) => void;
}
export enum serverCalls {
    loadModuleConfig,
    saveFile,
    getDirectoryTree,
    saveModuleConfig
}

const eventQueue = {
        init : [],
        getDirectoryTree : []
    },
    readyQueue:Array<()=>void> = [];

let remoteServer: RemoteServer,
    ready:boolean = false;

canny.ready(function () {

    let stream = shoe('/dnode'),
        d = dnode();

    d.on('remote', function (remote: RemoteServer) {
        remoteServer = remote;
        remoteServer.init({
            path : location.pathname,
            session : forSessionCookie('translatron_session').getValues()
        }, function (con) {
            console.log('tradeWs:message', con.message);
            console.log('tradeWs:user', con.user);
            con.hey('back from client');
            eventQueue.init.forEach(function (fc) {
                fc(con);
            });
            ready = true;
            while (readyQueue.length > 0) {
                readyQueue.pop()();
            }

        });
    });
    d.pipe(stream).pipe(d);
});

function request(name: serverCalls, ...args: any[]) {
    const argsList = [].slice.call(arguments, 1);
    if (remoteServer.hasOwnProperty(serverCalls[name])) {
        // each function which needs to have callbacks via the eventQueue needs to be handled separately
        // this is an call optimisation so we don't need to call the server again for the same information
        switch(serverCalls[name]) {
            case 'getDirectoryTree':
                remoteServer.getDirectoryTree(args[0], (folderItems:(Array<FolderItem>|boolean)) => {
                    if (folderItems === false) {return;}
                    const filteredItems = fileFilter(<Array<FolderItem>>folderItems);
                    args[1](filteredItems);
                    eventQueue.getDirectoryTree.forEach((fc) => {
                        fc(filteredItems);
                    });
                });
                break;
            default:
                remoteServer[serverCalls[name]].apply(null, argsList);
        }

    } else {
        console.log('tradeWs:request with name', name, 'doesn\'t exists');
    }
}

/**
 *
 * @type {{on: ((obj:OnListener)=>any); request: ((name:serverCalls, ...args:any[])=>void)}}
 */
export const tradeWs = {
    on : function (obj: OnListener) {
        Object.keys(obj).forEach(function (key) {
            if (eventQueue.hasOwnProperty(key)) {
                eventQueue[key].push(obj[key]);
            } else {
                console.error('tradeWs:on - doesn\'t support event listener for', key);
            }
        })
    },
    /**
     *
     * @param {serverCalls} name - the name of remoteServer action
     * @param {object} args
     */
    request : function (name: serverCalls, ...args: any[]): void {
        const arg = arguments;
        if (ready) {
              request.apply(null, arguments);
        } else {
            readyQueue.push(() => {
                request.apply(null, arg);
            });
        }
    }
};