import { ProgressToast } from './ProgressToast'
/**
 * These file handles the REST calls to the server
 */
const events = {
        getFiles : [],
        deleteFile : [],
        fileSend : []
    },
    doCalls = {
        getFiles : getFiles,
        sendFile : sendFile,
        deleteFile : deleteFile
    };

/**
 * Call the given function queue with arguments
 * @param queue
 * @param any - some arguments which will be passed through the function call
 */
function callEventsQueue(queue:Array<()=>{}>, ...any) {
    const args = [].slice.call(arguments, 1, arguments.length);
    queue.forEach(function(fc) {
        fc.apply(null, args);
    });
}

/**
 * Call this for each file - will call a call back with the server answer
 * @param file
 */
function sendFile(file, directCallback) {
    const uri = "/uploadFile?folder=" + location.pathname + '&filename=' + file.name,
        xhr = new XMLHttpRequest(),
        fd = new FormData(),
        progressBar = ProgressToast(file.name);

    xhr.upload.onprogress = function (e) {
        progressBar.update(e.loaded / 1000, e.total / 1000)
    };
    xhr.upload.onloadend = function (e) {
        progressBar.destroy()
    };

    xhr.open("POST", uri, true);
    xhr.onreadystatechange = function() {
        let data;
        if (xhr.readyState == 4) {
            // Handle response.
            data = xhr.status == 200 ? JSON.parse(xhr.responseText) : xhr.responseText;
            directCallback && directCallback(xhr.status == 200 ? null : xhr, data); // handle response.
            callEventsQueue(events.fileSend, xhr.status == 200 ? null : xhr, data);
        }
    };
    fd.append('myFile', file);
    // Initiate a multipart/form-data upload
    xhr.send(fd);
}

function deleteFile(path, directCallback) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/deleteFile?filename=" + path, true);
    xhr.onload = function (e) {
        if (xhr.readyState === 4) {
            directCallback && directCallback(xhr.status == 200 ? null : xhr, path);
            callEventsQueue(events.deleteFile, xhr.status == 200 ? null : xhr, path);
        }
    };
    xhr.send(null);
}

function getFiles(pathName) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/getFiles", true);
    xhr.onload = function (e) {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                callEventsQueue(events.getFiles, JSON.parse(xhr.responseText));
            } else {
                console.error(xhr.statusText);
            }
        }
    };
    xhr.onerror = function (e) {
        console.error(xhr.statusText);
    };
    xhr.send(pathName || location.pathname);
}

/**
 * register a on listener object
 * @param eventObj
 */
export function on(eventObj) {
        Object.keys(eventObj).forEach(function (eventName) {
            if (events.hasOwnProperty(eventName)) {
                events[eventName].push(eventObj[eventName]);
            } else {
                console.log('trade:event not exists', eventName);
            }
        })
    }
/**
 * returns a function
 * @param name
 * @returns {*}
 */
export function doCall(name) {
    return doCalls[name];
}