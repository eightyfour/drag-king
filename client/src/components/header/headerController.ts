import { listFoldersCannyMod, listFolders } from './listFolders';
import { header } from './header';
import { tradeWs, serverCalls } from '../../tradeWs';
import { eventHandler } from '../../eventHandler';
import { auth } from "../auth/auth";
import { folderNav } from "./folderNav";
import { newFolder } from "./newFolder";

export function headerController () {
    tradeWs.request(serverCalls.getDirectoryTree, location.pathname, function (result) {
        if (result) {
            listFolders(result);
        } else {
            console.log('headerController:there are no sub folders :(');
        }
    });
    header({
        auth: auth,
        listFolders : listFoldersCannyMod(),
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