'use strict';

const path = require('path');
const FILENAME = path.basename(__filename).replace(path.extname(path.basename(__filename)), '');

const CONSTANTS = {
    SERVER__SRC_FOLDER:                         process.env.SERVER__SRC_FOLDER,
    SERVER__BUILD_FOLDER:                       process.env.SERVER__BUILD_FOLDER,
    SERVER_STATIC_WATCHER__PORT:                process.env.SERVER_STATIC_WATCHER__PORT,
    SERVER_STATIC_WATCHER__COLOR:               process.env.SERVER_STATIC_WATCHER__COLOR || 'yellow',
    SERVER_STATIC_WATCHER__SUCCESS_CALLBACK:    process.env.SERVER_STATIC_WATCHER__SUCCESS_CALLBACK
};

for (let key in CONSTANTS) {
    if (!CONSTANTS[key]) {
        console.error(`${FILENAME}: You must set ${key} env!`);
        process.exit(1);
        return false;
    }
}

CONSTANTS.SERVER__SRC_FOLDER = path.normalize(CONSTANTS.SERVER__SRC_FOLDER);
CONSTANTS.SERVER__BUILD_FOLDER = path.normalize(CONSTANTS.SERVER__BUILD_FOLDER);

const types = {};
const fs = require('fs');
const http = require('http');
const fse = require('fs-extra');
const request = require('request');
const server = http.createServer();
const { exec } = require('child_process');
const Watcher = require('watch-fs').Watcher;
const util = require('./microservices-utils');
const recursive = require("recursive-readdir");


const ctx = {
    'name': FILENAME,
    'color': CONSTANTS.SERVER_STATIC_WATCHER__COLOR,
    'port': CONSTANTS.SERVER_STATIC_WATCHER__PORT,
    'types': types,
    'process': process
};
const io = require('socket.io')(server);
const sendConsoleText = util.sendConsoleText.bind(ctx);
server.on('request', util.httpServerHandler.bind(ctx));
server.listen(CONSTANTS.SERVER_STATIC_WATCHER__PORT);

const watcher = new Watcher({
    paths: [ CONSTANTS.SERVER__SRC_FOLDER ],
    filters: {
        includeFile: function(name) {
            return !/\.tsx?/.test(name);
        }
    }
});


watcher.on('create', (name) => {
    sendConsoleText(`file ${name} created`);
    types['copy-server-static'](name);
});

watcher.on('change', (name) => {
    sendConsoleText(`file ${name} changed`);
    types['copy-server-static'](name);
});

watcher.on('delete', (name) => {
    sendConsoleText(`file ${name} deleted`);
    deleteFile(name);
});

watcher.start((err, failed) => {});

io.on('connection', (socket) => {

    socket.on('message', (message, cb) => {
        types[message.type] &&
        types[message.type]()
            .then(() => {
                cb && ('function' === typeof cb) && cb();
            })
            .catch((err) => sendConsoleText(err, 'error'));
    });
});

const blockedExt = [
    'ts',
    'tsx'
];

const deleteFile = (fileName) => {
    fse.remove(fileName.replace(CONSTANTS.SERVER__SRC_FOLDER, CONSTANTS.SERVER__BUILD_FOLDER))
        .catch(err => {
            sendConsoleText(err, 'error');
        });
};

const copyFile = (fileName) => {
    let ext = fileName.split('.').pop();
    fse.outputFileSync(fileName.replace(CONSTANTS.SERVER__SRC_FOLDER, CONSTANTS.SERVER__BUILD_FOLDER), fs.readFileSync(fileName, 'utf-8'));
    return Promise.resolve([fileName]);
};

const copyAllFiles = () => {
    return new Promise((resolve, reject) => {
        recursive(
            CONSTANTS.SERVER__SRC_FOLDER,
            [
                (fileName, stats) => {
                    let ext = fileName.split('.').pop();
                    return !stats.isDirectory() && blockedExt.reduce((bool, extension) => {
                        return extension === ext ? !!(++bool) : !!bool
                    }, false);
                }
            ],
            (err, files) => {
                if (err) {
                    reject(err);
                    return false;
                }
                files.forEach(fileName => {
                    fse.outputFileSync(fileName.replace(CONSTANTS.SERVER__SRC_FOLDER, CONSTANTS.SERVER__BUILD_FOLDER), fs.readFileSync(fileName, 'utf-8'));
                });
                resolve(files);
            }
        );
    });
};

sendConsoleText(`started on ${CONSTANTS.SERVER_STATIC_WATCHER__PORT}`);

types['copy-server-static'] = (fileName) => {
    if (!types['copy-server-static'].promise) {
        types['copy-server-static'].promise =
        new Promise((resolve, reject) => {
            let promise_ = (fileName) ? copyFile(fileName) : copyAllFiles();
            promise_
                .then((files)=> {
                    setTimeout(() => {
                        delete types['copy-server-static'].promise
                    }, 0);
                    sendConsoleText(`static files copied! ${files.toString()}`);
                    if (CONSTANTS.SERVER_STATIC_WATCHER__SUCCESS_CALLBACK) {
                        sendConsoleText(`starting callback task "${CONSTANTS.SERVER_STATIC_WATCHER__SUCCESS_CALLBACK}" ...`);
                        exec(CONSTANTS.SERVER_STATIC_WATCHER__SUCCESS_CALLBACK, (error, stdout, stderr) => {
                            if (error) {
                                reject(error);
                                return;
                            }
                            resolve();
                        });
                    } else {
                        resolve();
                    }
                })
                .catch(err => {
                    setTimeout(() => {
                        delete types['copy-server-static'].promise
                    }, 0);
                    reject(err);
                });
        });
    }
    return types['copy-server-static'].promise;
};

types['get-commands'] = () => {
    return Promise.resolve(Object.keys(types).filter(command => command !== 'get-commands' ));
};

types['copy-server-static']();
