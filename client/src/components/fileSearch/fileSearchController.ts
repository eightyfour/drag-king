import { tradeWs } from '../../tradeWs';
import { eventHandler } from '../../eventHandler';
import { FolderItem } from '../../model/Folder';
import { SearchResultItem } from './SearchResultItem';
import { showSearch, hideSearch, onItemSelect } from './fileSearch';

let folderItems:Array<FolderItem>;

export function fileSearchController() {
    tradeWs.on({
        getDirectoryTree: (result) => {
            console.log('fileSearchController:getDirectoryTree', result);
            folderItems = result;
        }
    });

    eventHandler.on({
        showFileSearch : () => {
            if (folderItems) {
                showSearch(folderItems);
            } else {
                console.log('fileSearchController:showFileSearch there are no folder items loaded - can\'t search for anything :( ');
            }
        },
        hideFileSearch : () => {
            hideSearch();
        }
    });

    // listen to selected item and execute the link
    onItemSelect((item:SearchResultItem) => {
        // console.log('Search item:', item);
        window.location.href = item.url + '?file=' + item.name;
    });

    /**
     * slider key listener:
     *  * open: ctrl + s
     *  * close: ESC
     */
    window.addEventListener('keydown', function(e) {
        if ((e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27)) {
            eventHandler.fire('hideFileSearch');
            e.preventDefault();
            return false;
        } else if ((e.key === 's' || e.keyCode === 83) && e.ctrlKey) {
            eventHandler.fire('showFileSearch');
            e.preventDefault();
            return false;
        }
    }, true);
}