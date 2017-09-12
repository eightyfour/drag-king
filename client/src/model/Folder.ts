
export interface FolderItem {
    extension? : string; // ".jpg"
    name : string; // "image.jpg"
    path : string; // "/directory/image.jpg"
    type : string; // "file/directory",
    children : Array<FolderItem>
}