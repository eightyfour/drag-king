# drag-king

Web application for uploading and managing files on a server.

### Installation

Requires Node.js 26 (tested with 26.5.0) and npm.

```sh
git clone https://github.com/eightyfour/drag-king.git
cd drag-king
npm ci
npm run build
npm start
```

Navigate to http://localhost:8001 in development (`config.port.development` in
`package.json`). Production uses port 80 by default. The build generates the
JavaScript and CSS assets referenced by `index.html` and `auth.html` under
`dist/`; it must run before starting the server.
TypeScript's intermediate JavaScript and source maps are emitted into
`.build/client/`, not alongside files in `client/src/`. Run `npm run rebuild`
to recompile and rebundle the browser client after a source or template change.

Run `npm test` for the Node.js built-in test runner. The browser uses its native
WebSocket API to communicate with the server at `/ws`, which uses `ws`. File
uploads and downloads continue to use HTTP; thumbnails are generated with
`sharp` and do not require ImageMagick. Thumbnails honor image EXIF orientation;
older cached thumbnails are replaced when their images are next requested.
Sessions are held in memory by default,
so restarting the server logs users out.

### permissions

The server supports also permission for user.

**.allowedUsers.json**

```json
{
  "max" : {
    "pw" : "c8bd0177e53c5d2fec5d7e8cba43c505", // 'ente'
    "fullName" : "Max Mustermann"
  }
}
```

`pw` is the MD5 digest of the password (in this example, `ente`). Place these
files in the `files/` directory. Create it before logging in, and use
`config.auth` in `package.json` to configure authentication. Set
`DRAG_KING_SESSION_SECRET` to a unique secret in production; without it the
standalone entry point uses a fixed development secret.

**.user-permission.json**
It exists three roles default, maintainers and admins. All users which are allowed to login
and not in the following group have default permissions.

```
{
  "admins" : ["fred"],
  "maintainers": ["max", "bob"]
}
```

### Use as a dependency with external authentication
`require('@eightyfour/drag-king')(opts, lifecycle)` starts the server. Register
the bundled `server/lib/auth` or your own authentication (e.g. LDAP) in
`lifecycle.phase1`, either as `auth(app, config)` or `app.use(auth(app, config))`.
External authentication must set `req.session.authId`, `isAdmin` and
`isMaintainer`, and use the `translatron_session` cookie signed with
`opts.secret`. If sessions are stored as `<sid>.json` files, pass their folder
as `opts.sessionStoragePath` so WebSocket requests see the same user.

Login and permissions are enforced by default (`config.auth`). `opts.auth: false`
only signals that authentication is handled externally; pass
`opts.requireAuth: false` to disable access control.


### REST interface
For some console tools the dragKing support also a REST interface with
the following REST endpoints:

The most of the REST endpoint supporting BASIC auth. It gives permission
to the user which are listed in the ".allowedUsers.json"

#### /uploadFile
Upload a file

The **data** are the file content and a request param **folder** to specify the folder location

> curl -F data=@fileName.json http://name:password@dragKing.de/uploadFile?folder=/tmp/someFiles

#### /deleteFile
Delete a file

The request param **filename** to specify the file to delete

> curl -d '' http://name:password@dragKing.de/deleteFile?filename=/tmp/text.txt

#### /getFiles
Lists all files inside a specific folder.

> curl -H "Content-Type: application/text" -d '/path/to/folder' http://dragKing.de/getFiles

#### /getFolders
Lists all folders inside a specific folder.

> curl -H "Content-Type: application/text" -d '/path/to/folder' http://dragKing.de/getFolders

## Release notes
**0.0.4**
 * deliver image preview as thumbnail 
 
**0.1.0**

complete refactoring of the application 
 * adding typescript files (client)
 * ui redesign
 * feature improvements
   * folder description
   * file search
   * upload progress
   * login
   * ...

**0.1.1**
 * provide default 404 file (configurable via fourOFourFile property)

**0.1.3**
 * support folder names with a dot inside

**0.1.4**
 * support /_/ls/
 ** add following a path the server result will be a JSON array with
 all containing files
 ** support request parameter ?ext=jpg to filter for jpg files

**0.2.0**
 * allow and support basic auth for REST deleteFiles and uploadFiles
 * improve error handling for POST calls
