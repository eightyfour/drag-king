import { FolderItem } from '../../model/Folder'

export interface SearchResultItem extends FolderItem{
    url : string; // "/directory/image.jpg"
    cuttedUrl : string; // "/directory/image.jpg"
    action : (node:HTMLElement) => void; // "/directory/image.jpg"

}