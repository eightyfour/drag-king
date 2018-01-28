# drag-king

Web application with to upload images to a server.

### Installation

```sh
git clone https://github.com/alextrastero/drag-king.git
cd drag-king
npm install
npm start
```

Navigate to http://YOUR_IP:8000 to see the action.

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

**.user-permission.json**
It exists three roles default, maintainers and admins. All users which are allowed to login
and not in the following group have default permissions.

```
{
  "admins" : ["fred"],
  "maintainers": ["max", "bob"]
}
```


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

TODO: server side code needs to be refactored ...comming soon
