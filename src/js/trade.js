
function callEventsQueue(queue) {
    var args = [].slice.call(arguments, 1 ,arguments.length);
    queue.forEach(function(fc) {
        fc.apply(null, args);
    });
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
        deleteFile : []
    },
    doCalls = {
        getFiles : getFiles,
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