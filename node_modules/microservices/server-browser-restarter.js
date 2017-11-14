'use strict';
const path = require('path');
const FILENAME = path.basename(__filename).replace(path.extname(path.basename(__filename)), '');

const CONSTANTS = {
    SERVER_BROWSER_RESTARTER__PORT:   process.env.SERVER_BROWSER_RESTARTER__PORT,
    SERVER_BROWSER_RESTARTER__COLOR:  process.env.SERVER_BROWSER_RESTARTER__COLOR || 'cyan'
};

for (let key in CONSTANTS) {
    if (!CONSTANTS[key]) {
        console.error(`${FILENAME}: You must set ${key} env!`);
        process.exit(1);
        return false;
    }
}

const types = {};
const http = require('http');
const server = http.createServer();
const util = require('./microservices-utils');
const ctx = {
    'name': FILENAME,
    'color': CONSTANTS.SERVER_BROWSER_RESTARTER__COLOR,
    'port': CONSTANTS.SERVER_BROWSER_RESTARTER__PORT,
    'types': types,
    'process': process
};
const io = require('socket.io')(server);
const sendConsoleText = util.sendConsoleText.bind(ctx);
server.on('request', util.httpServerHandler.bind(ctx));
server.listen(CONSTANTS.SERVER_BROWSER_RESTARTER__PORT);

let socketsToBrowsers = {};

const setSocketToBrowser = (socket) => {
    socketsToBrowsers[socket.id] = socket;
};

const isThisSocketToBrowser = (socket) => {
    return (socket.handshake.headers.origin &&
                ('node-XMLHttpRequest' !== socket.handshake.headers['user-agent'])
            ) ? true : false;
};

// TODO i don't see 'connected to socked browser!'
io.on('connection', (socket) => {
    if (isThisSocketToBrowser(socket)) {
        setSocketToBrowser(socket);
        sendConsoleText(`connected to socked browser[${socket.id}]!`);
    }

    socket.on('message', (message, cb) => {
        types[message.type] &&
        types[message.type]()
        .then(() => {
            cb && ('function' === typeof cb) && cb();
        })
        .catch((err) => sendConsoleText(err, 'error'));
    });
    socket.on('close', () => {
        delete socketsToBrowsers[socket.id];
        sendConsoleText(`closed! browser connection[${socket.id}]`);
    });
    socket.on('disconnect', () => {
        delete socketsToBrowsers[socket.id];
        sendConsoleText(`closed! browser connection[${socket.id}]`);
    });
});

sendConsoleText(`started on ${CONSTANTS.SERVER_BROWSER_RESTARTER__PORT}`);

types['browser-refresh'] = () => {
    if (!types['browser-refresh'].promise) {
        types['browser-refresh'].promise = new Promise((resolve, reject) => {
            let isAnySocketsExists = false;
            for (let key in socketsToBrowsers) {
                if (!socketsToBrowsers[key] || !socketsToBrowsers.hasOwnProperty(key)) {
                    continue;
                }
                isAnySocketsExists = true;
                socketsToBrowsers[key].send({ type: 'browser-refresh' });
                sendConsoleText(`refreshed browser [${key}] on ${ new Date() }`);
            }
            setTimeout(() => {
                types['browser-refresh'].promise = null;
            }, 0);
            isAnySocketsExists ? resolve() : reject('socketToBrowser doesn\'t exists yet!');
        });
    }
    return types['browser-refresh'].promise;
};

types['get-commands'] = () => {
    return Promise.resolve(Object.keys(types).filter(command => command !== 'get-commands' ));
};
