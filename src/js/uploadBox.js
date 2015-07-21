(function(){

    var uploadBox = document.getElementById('dropzone'),
        uploadLabel = document.getElementById('dropzone-label'),
        uploadButton = document.querySelector('.upload-button'),
        overClass = 'over',
        droppedClass = 'file-dropped',
        alreadyOver = false;


    // First thing, hide the upload button
    uploadButton.style.display = 'none';


    function fileHandler(evt){
        evt.preventDefault();
        var eventType = evt.type.toString(); //UGLY
        if( events.hasOwnProperty(eventType) ){
            events[eventType](evt);
        }
    }

    function triggerDropFile(files){
        var newLabel = '',
            icon,
            fr,
            fileToUpload,
            button;
        // Edit label to show file name and icon (optional)
        files.forEach(function(file){
            if(file.hasOwnProperty('type')){
                icon = fileTypes[file.type] || '';
                // TODO implement mini preview
                newLabel += file.name + '<br><span class="'+icon+'"></span>';
                fileToUpload = file; // TODO currently only supports 1 file
            }
        });
        // Show upload button and change dropzone label
        uploadButton.style.display = 'block';
        uploadLabel.classList.add(droppedClass);
        uploadLabel.innerHTML = newLabel;

        // Pass file to original input for upload
        console.debug(fileToUpload);
    }

    var fileTypes = {
        'image/jpeg': 'image'
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
            var filesList = Object.keys(evt.dataTransfer.files).map(function(key){
                return evt.dataTransfer.files[key];
            });
            triggerDropFile(filesList);
            this.dragleave();
        }
    }

    uploadLabel.addEventListener("dragover", fileHandler, false);
    uploadLabel.addEventListener("dragleave", fileHandler, false);
    uploadLabel.addEventListener("drop", fileHandler, false);

})()