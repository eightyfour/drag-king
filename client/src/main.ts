import { tradeWs } from './tradeWs';
import * as trade from './trade';
import { authController } from './components/auth/authController';
import { historyController } from './components/history/historyController';
import { mainController } from './components/mainController';
import * as canny from 'canny';
import * as url from 'canny/mod/url';
import * as toast from 'message-toast';
import { showOnDropOver } from './showOnDropOver';
import { pageEnvironment } from './pageEnvironment';
import { fileViewer } from './components/fileViewer/fileViewer'
import { headerController } from './components/header/headerController';
import { fileSearchController } from './components/fileSearch/fileSearchController';
import { sliderController } from './components/slider/sliderController';
import { viewControl } from './components/viewControl/viewControl';
import { folderDescriptionController } from './components/folderDescription/folderDescriptionController';
import { icons } from './misc/icons';

export function main() {

    const fileViewerFilter = fileViewer().filter;

    headerController();
    fileSearchController();
    authController();
    sliderController();
    historyController();
    mainController();
    folderDescriptionController({});

    canny.add('viewControl', viewControl());
    canny.add('icons', icons);
    canny.add('showOnDropOver', showOnDropOver);

    trade.on({
        getFiles : function (files) {
            console.log('main:new files loaded', files);
        },
        deleteFile : function (err, xhr, file) {
            if (!err) {
                console.log('main:files was deleted', file);
            } else {
                console.log('main:deleteFile', xhr);
                toast.showMessage('Can\'t delete file - Permissions denied!');
            }
        },
        fileSend : function (err, file) {
            if (!err) {
                console.log('main:file has been added', file);
            } else {
                toast.showMessage('Can\'t upload file - Permissions denied!');
            }
        }
    });

    (function () {
        const allowAll = url.getURLParameter('admin') !== false;

        function getFileName(name) {
            return name.split('/').splice(-1);
        }

        // register file filter to filter out the [project].json files from the gallery overview.
        fileViewerFilter(function (name) {
            if (allowAll && (pageEnvironment.config.name === 'anonymous' || pageEnvironment.config.isAdmin)) {
                return name;
            }
            // exclude .json files from gallery
            //  exclude hidden files started with a dot from view
            return  /.*\.json/.test(name) || /^\./.test(getFileName(name)) ? undefined : name
        });
        // if admin is set in URL we need to wait for the user config to know if the user is really an admin
        if (!allowAll) {
            canny.ready(function () {
                // load initial files
                trade.doCall('getFiles')(location.pathname);
            });
        }

        tradeWs.on({
            init : function (config) {
                pageEnvironment.config = config.user;
                if (allowAll) {
                    trade.doCall('getFiles')(location.pathname);
                }
            }
        });
    }());
}