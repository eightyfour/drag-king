import * as trade from '../../trade';
import * as stringToColor from 'string-to-color';

import { initHistoryList, HistoryItem } from './historyRenderer'
import {tradeWs} from "../../tradeWs";

function formatDate(d: Date): string {
    return  ("0" + d.getDate()).slice(-2) + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" +
        d.getFullYear() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
}

/**
 * controller part:
 *
 * @param {Object} obj
 * @returns {Array<HistoryItem>}
 */
function convertHistoryItem(obj: any): Array<HistoryItem> {
    const historyItemList: Array<HistoryItem> = [];
    Object.keys(obj).sort().reverse().forEach(function (key) {
        let o: HistoryItem = obj[key];
        o.timestamp = formatDate(new Date(parseInt(key)));
        o.color = stringToColor.toHex(obj[key].alias);
        historyItemList.push(o);
    });
    return historyItemList;
}
/**
 *
 * @param fileName
 * @returns {Promise<Response>}
 */
function loadHistoryFromServer(fileName: string): Promise<any> {
    return fetch(fileName)
        .then((response) => response.json())
        .then((data) => initHistoryList(convertHistoryItem(data)))
        .catch((err) => console.error('historyRenderer:onSuccess render history failed!', err))
}



export const historyController = function () {
    let fileName;

    /**
     * Return the path of the .history.json - or generates this from the actual URL
     *
     * There should be a .history.json file created on server side - better would be a push notification via ws
     * @returns {string}
     */
    function getHistoryFile() {
        return  fileName ? fileName : fileName = location.pathname + '/.history.json';
    }

    tradeWs.on({
        copy : (from, to) => {if (from !== null)  setTimeout(() => loadHistoryFromServer(getHistoryFile()), 1500);},
        move : (from, to) => {if (from !== null)  setTimeout(() => loadHistoryFromServer(getHistoryFile()), 1500);},
        rename : (from, to) => {if (from !== null)  setTimeout(() => loadHistoryFromServer(getHistoryFile()), 1500);},
        remove : (file) => {if (file !== null)  setTimeout(() => loadHistoryFromServer(getHistoryFile()), 1500);}
    })

    trade.on({
        deleteFile : function (err) {
            if (!err) {
                setTimeout(() => loadHistoryFromServer(getHistoryFile()), 1500);
            }
        },
        fileSend : function (err) {
            // the delay is required because the history is saved on server side with a delay
            // TODO A better solution would be a push from server
            if (!err) {
                setTimeout(() => loadHistoryFromServer(getHistoryFile()), 1500);
            }
        },
        getFiles : function (files) {
            files.forEach(function (file) {
                if (file.name === '.history.json') {
                    fileName = file.file;
                    loadHistoryFromServer(fileName);
                }
            });
        }
    });
};
