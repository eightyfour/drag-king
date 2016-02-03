
function callEventsQueue(queue) {
    var args = [].slice.call(arguments, 1 ,arguments.length);
    queue.forEach(function(fc) {
        fc.apply(null, args);
    });
}

/**
 * Call this for each file - will call a call back with the server answer
 * @param file
 */
function sendFile(file, directCallback) {
    var uri = "/uploadFile?folder=" + location.pathname,
        xhr = new XMLHttpRequest(),
        fd = new FormData();

    xhr.open("POST", uri, true);
    xhr.onreadystatechange = function() {
        var data;
        if (xhr.readyState == 4 && xhr.status == 200) {
            // Handle response.
            data = JSON.parse(xhr.responseText);
            directCallback && directCallback(data); // handle response.
            callEventsQueue(events.fileSend, data);
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
            if (xhr.status === 200) {
                directCallback && directCallback();
                callEventsQueue(events.deleteFile);
            } else {
                console.error(xhr.statusText);
            }
        }
    };
    xhr.onerror = function (e) {
        console.error(xhr.statusText);
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

var events = {
        getFiles : [],
        deleteFile : [],
        fileSend : []
    },
    doCalls = {
        getFiles : getFiles,
        sendFile : sendFile,
        deleteFile : deleteFile
    };

module.exports = {
    on : function (eventObj) {
        Object.keys(eventObj).forEach(function (eventName) {
            if (events.hasOwnProperty(eventName)) {
                events[eventName].push(eventObj[eventName]);
            } else {
                console.log('trade:event not exists', eventName);
            }
        })
    },
    /**
     * returns a function
     * @param name
     * @returns {*}
     */
    doCall : function (name) {
        return doCalls[name];
    }
}