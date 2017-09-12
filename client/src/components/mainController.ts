/**
 * This is the main handler to load and prepare the incomming module config.
 * If some datas are needed to set for default or a guide doesn't exists but it should be then do it in this file.
 */
import { tradeWs, serverCalls } from '../tradeWs';
import { eventHandler } from '../eventHandler';
import { getStyleFromURL } from '../utils';

function getParentNameFromFile(fileName): string {
    // not very save
    return fileName.split('/').pop().split('.')[1];
}

export const mainController = function () {
    eventHandler.on({
        loadModuleConfig : function (file) {
            tradeWs.request(serverCalls.loadModuleConfig, file, function (result) {
                const styleguideParam = getStyleFromURL();
                const parentName = getParentNameFromFile(file);
                if (result) {
                    if (styleguideParam && styleguideParam.name === parentName) {
                        // make sure that the requested properties are existing in the object - so we have the possibility to create new ones
                        result[styleguideParam.name] = result[styleguideParam.name] || {};
                        if (styleguideParam.child) result[styleguideParam.child] = result[styleguideParam.child] || {}
                    }
                    if (!result.hasOwnProperty(parentName)) {
                        result[parentName] = {};
                    }
                    eventHandler.fire('moduleConfigLoaded', file, result);
                    console.log('mainController: module config found for', file);
                } else {
                    // if there is no config found we create a dummy form
                    const JSON = {timeStamp : 0};
                    JSON[parentName] = {};
                    if (styleguideParam.child) {
                        JSON[styleguideParam.child] = {};
                    }
                    eventHandler.fire('moduleConfigLoaded', file, JSON);
                }
            });
        }
    });
}