var app = require('./main')({
        dirName: __dirname + '/',
        fileStorageName: __dirname + '/files'
    }),
    port = process.env.npm_package_config_port || 8000;

if (port !== undefined) {
    app.listen(port, function () {
        console.log('server started on port %d', port);
    });
} else {
    console.log('Server not started! - Please check the config or use "npm start" to start the server.');

}