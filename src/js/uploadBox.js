(function(){

    var uploadInput = document.getElementById('dropzone-input'),
        uploadLabel = document.getElementById('dropzone-label'),
        uploadButton = document.querySelector('.upload-button'),
        overClass = 'over',
        droppedClass = 'file-dropped',
        alreadyOver = false;

    // First thing, hide the upload button
    uploadButton.style.display = 'none';

    function fileHandler(evt){
        if( events.hasOwnProperty(evt.type) ){
            events[evt.type](evt);
        }
    }

    function triggerDropFile(files){
        var i;
        uploadLabel.innerHTML = '';
        // Edit label to show file name and icon (optional)
        for (i = 0; i < files.length; i++) {
            if(files[i].hasOwnProperty('type')){
                uploadLabel.appendChild(document.createTextNode(files[i].name));
                uploadLabel.appendChild(document.createElement('br'));
            }
        };
        // Show upload button and change dropzone label
        uploadButton.style.display = 'block';
        uploadLabel.classList.add(droppedClass);
    }

    var events = {
        dragover: function(){
            if(!alreadyOver){
                uploadLabel.classList.add(overClass);
                alreadyOver = true;
            }
        },
        dragleave: function(){
            uploadLabel.classList.remove(overClass);
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