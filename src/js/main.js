var canny = require('canny');
// main js will be generated from browserify to one
canny.add('upload', require('./c-upload.js'));

var uploadBox = document.getElementById('dropzone'),
    overClass = 'over',
    alreadyOver = false;

uploadBox.addEventListener("dragover", FileSelectHandler, false);
uploadBox.addEventListener("dragleave", FileSelectHandler, false);
uploadBox.addEventListener("drop", FileSelectHandler, false);

function FileSelectHandler(evt){
    var eventType = evt.type.toString(); //UGLY
    if( events.hasOwnProperty(eventType) ){
        events[eventType]();
    }
}

var events = {
    dragover: function(){
        if(!alreadyOver){
            uploadBox.classList.add(overClass);
            alreadyOver = true;
        }
    },
    dragleave: function(){
        uploadBox.classList.remove(overClass);
        alreadyOver = false;
    }
}