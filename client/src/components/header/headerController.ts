import { listFoldersCannyMod, listFolders } from './listFolders';
import { header } from './header';
import { tradeWs, serverCalls } from '../../tradeWs';
import { eventHandler } from '../../eventHandler';
import { auth } from "../auth/auth";
import { folderNav } from "./folderNav";
import { newFolder } from "./newFolder";
import { FolderItem } from '../../model/Folder';

const listFoldersCannyModInstance = listFoldersCannyMod();
let loading = false;

async function initializeHoverMenu() {
    try {
        const result = await tradeWs.request<FolderItem[]>(serverCalls.getDirectoryTree, location.pathname);
        listFolders(result);
    } catch (error) {
        console.error('Unable to load folders:', error);
    }
}

function reeInit() {
    if (!loading) {
        loading = true;
        listFoldersCannyModInstance.render(() => {
            initializeHoverMenu().finally(() => { loading = false; });
        });
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