/**
 * Reads the information from the package.json config.
 * E.g.:
 *   "config" : {
 *      "bundle" : "dist/main.gen.js",
 *      "outfile" : ["src/js/upload.js"]
 *   },
 */
var watchify = require('watchify'),
    browserify = require('browserify'),
    fs = require('fs');

/**
 * generates a array from a env config
 *
 * @param name
 * @returns {Array}
 */
function getEnvList(name) {
    var list = [], i = 0, item;
    if (process.env[name]) {
        list.push(process.env[name]);
    } else {
        while(item = process.env[name + '_' + i]) {
            list.push(item);
            i++;
        }
    }
    return list;
}


module.exports = function () {
    // browserify watch task
    (function (output, srcs) {
        var b = browserify(),
            w = watchify(b);
        if (output !== undefined && srcs.length > 0) {

            srcs.forEach(function (file) {
                w.add(__dirname + '/' + file);
            });

            w.on('log', function (msg) {
                console.log('watchify log:', msg);
            });
            // is called if file has changed
            w.on('update', function (ids) {
                console.log('watchify compile:', ids);
                w.bundle().pipe(fs.createWriteStream(__dirname + '/' + output));
            });
            // generate initial once
            w.bundle().pipe(fs.createWriteStream(__dirname + '/' + output));
        } else {
            console.error('watchifyTask: incorrect attributes', output, srcs);
        }
    }(process.env.npm_package_config_bundle, getEnvList("npm_package_config_outfile")));
}
