/**
 * Simple progress bar which is shown as notification.
 *
 * @param fileName
 * @returns {{update: ((value:any, max:any)=>undefined), destroy: (()=>undefined)}}
 * @constructor
 */
export function ProgressToast(fileName) {
    let progress = document.createElement('progress');
    let li = document.createElement('li');
    let span = document.createElement('span');
    let main = document.getElementById('progressToast-wrap');

    if (!main) {
        main = document.createElement('ul');
        main.id = 'progressToast-wrap';
        main.className = 'progressToast-wrap';
        document.body.appendChild(main);
    }

    progress.setAttribute('value', '0');
    li.className = 'fileUploadProgress';
    span.appendChild(document.createTextNode(fileName));
    li.appendChild(span);
    li.appendChild(progress);
    main.appendChild(li);

    return {
        update : (value, max) => {
            progress.setAttribute('value', value);
            progress.setAttribute('max', max);
        },
        destroy : ()=>{
            li.remove();
            li = undefined;
            progress = undefined;
        }
    }
}