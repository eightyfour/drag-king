import { renderDescription, onInputChange } from './folderDescription';
import * as trade from '../../trade';
import { tradeWs, serverCalls } from '../../tradeWs';

const descriptionFileName = '.description.html';

let currentDescriptionFileURL = location.pathname + '/' + descriptionFileName;
/**
 *
 * @param fileName
 * @returns {Promise<Response>}
 */
function loadHistoryFromServer(fileName: string): Promise<any> {
    return fetch(fileName)
        .then((response) => response.text())
        .then((html) => renderDescription(html))
        .catch((err) => console.error('folderDescription:onSuccess render history failed!', err))
}

trade.on({
    getFiles : function (files) {
        files.forEach(function (file) {
            if (file.name === descriptionFileName) {
                loadHistoryFromServer(currentDescriptionFileURL = file.file);
            }
        });
    }
});

export function folderDescriptionController (config) {
    console.log('folderDescriptionController:folderDescriptionController', config);
    onInputChange(function (htmlContent:string) {
        console.log('folderDescriptionController: TODO send the changes to server', htmlContent);
        tradeWs.request(serverCalls.saveFile, currentDescriptionFileURL, htmlContent, function (result) {
            console.log('folderDescriptionController:save done', result);
        });
    })
}