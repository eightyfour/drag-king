import { listFoldersCannyMod, listFolders } from './listFolders';
import { header } from './header';
import { tradeWs, serverCalls } from '../../tradeWs';
import { eventHandler } from '../../eventHandler';
import { auth } from "../auth/auth";
import { folderNav } from "./folderNav";
import { newFolder } from "./newFolder";

const listFoldersCannyModInstance = listFoldersCannyMod();
let loading = false;

function initializeHoverMenu(cb?) {
    tradeWs.request(serverCalls.getDirectoryTree, location.pathname, function (result) {
        if (result) {
            listFolders(result);
        } else {
            console.log('headerController:there are no sub folders :(');
        }
        cb && cb();
    });
}

function reeInit() {
    if (!loading) {
        loading = true;
        listFoldersCannyModInstance.render(() => initializeHoverMenu(() => {
            loading = false;
        }))
    }
}

export function headerController () {
    initializeHoverMenu();
    tradeWs.on({
        copy : (from, to) => {if (from !== null) reeInit()},
        move : (from, to) => {if (from !== null) reeInit()},
        rename : (from, to) => {if (from !== null) reeInit()},
        remove : (file) => {if (file !== null) reeInit()}
    });
    header({
        auth: auth,
        listFolders : listFoldersCannyModInstance,
        folderNav : folderNav(),
        newFolder : newFolder,
        search : {
            add : (node) => {
                node.addEventListener('click', () => {
                    eventHandler.fire('showFileSearch');
                })
            }
        }
    });
}