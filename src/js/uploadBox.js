(function(){

    var uploadInput = document.getElementById('dropzone-input'),
        dropzoneBox = document.getElementById('dropzone-box'),
        fileNamePreview = document.getElementById('fileNamePreview'),
        overClass = 'over',
        droppedClass = 'file-dropped',
        alreadyOver = false,
        removeDropLabelTimer;

    function fileHandler(evt){
        if( events.hasOwnProperty(evt.type) ){
            events[evt.type](evt);
        }
    }

    function triggerDropFile(files){
        var i, li, liList = [].slice.call(fileNamePreview.children);
        if (removeDropLabelTimer) {
            clearTimeout(removeDropLabelTimer);
        }
        // Edit label to show file name and icon (optional)
        for (i = 0; i < files.length; i++) {
            if (files[i].type) {
                li = document.createElement('li');
                li.appendChild(document.createTextNode(files[i].name));
                fileNamePreview.appendChild(li);
                liList.push(li);
            }
        }
        dropzoneBox.classList.add(droppedClass);

        removeDropLabelTimer = setTimeout(function () {
            dropzoneBox.classList.remove(droppedClass);
            setTimeout(function () {
                liList.forEach(function(n) {
                    if ( n.parentNode) {
                        n.parentNode.removeChild(n);
                    }
                });
            }, 1000);
        }, 4000);

    }

    var events = {
        dragover: function(){
            if(!alreadyOver){
                dropzoneBox.classList.add(overClass);
                alreadyOver = true;
            }
        },
        dragleave: function(){
            dropzoneBox.classList.remove(overClass);
            alreadyOver = false;
        },
        drop: function(evt){
            triggerDropFile(evt.dataTransfer.files);
            this.dragleave();
        }
    }

    uploadInput.addEventListener("dragover", fileHandler, false);
    uploadInput.addEventListener("dragleave", fileHandler, false);
    uploadInput.addEventListener("drop", fileHandler, false);

})()