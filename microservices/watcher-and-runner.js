'use strict';

const path = require('path');
const FILENAME = path.basename(__filename).replace(path.extname(path.basename(__filename)), '');

const CONSTANTS = {
    WATCHER_AND_RUNNER__PORT:           process.env.WATCHER_AND_RUNNER__PORT,
    WATCHER_AND_RUNNER__COLOR:          process.env.WATCHER_AND_RUNNER__COLOR || 'magenta',
    WATCHER_AND_RUNNER__WAY_TO_CONFIG:  process.env.WATCHER_AND_RUNNER__WAY_TO_CONFIG
};

for (let key in CONSTANTS) {
    if (!CONSTANTS[key]) {
        console.log(`${FILENAME}: You must set ${key} env!`);
        process.exit(1);
    }
}

const ctx = {
    'types': {},
    'name': FILENAME,
    'color': CONSTANTS.WATCHER_AND_RUNNER__COLOR,
    'port': CONSTANTS.WATCHER_AND_RUNNER__PORT,
    'process': process
};

ctx.types['get-commands'] = () => {
    return Promise.resolve(`Not specified!`);
};

let config = null;
const http = require('http');
const server = http.createServer();
const watch = require('node-watch');
const io = require('socket.io')(server);
const util = require('./microservices-utils');

server.on('request', util.httpServerHandler.bind(ctx));
server.listen(CONSTANTS.WATCHER_AND_RUNNER__PORT);

const sendConsoleText = util.sendConsoleText.bind(ctx);
/*
 * Example structure for options see more for 'node-watch' npm package manual
 *
    options[<serve url>] = {
        options: {            // optionally = options for node-watch
            persistent: <Boolean> default = true
            recursive: <Boolean> default = true
            encoding: <String> default = 'utf8'
        },
        callbacks: {
             update: () => {}, // included create and change events
             remove: () => {}
        },
        runImmediately: () => {},       // optionally task will be run Immediately
        filter: (fullNamePath) => {},   // optionally filter watching files
    };

    module.exports = options;
 *
 */
try {
    config = require(`../${CONSTANTS.WATCHER_AND_RUNNER__WAY_TO_CONFIG}`);
} catch(err) {
    sendConsoleText(`Some problems with microservice configuration file! ${err}`, 'err');
    process.exit(1);
}

let immediatelyTasks = [];
const options = config.options;
config.localConfigs.sendConsoleText = sendConsoleText;
config.localConfigs.logInfo = util.logInfo.bind(ctx, FILENAME);

try {
    for (let url in options) {
        let watcherOptions = {
            persistent: true,
            recursive: true,
            encoding: 'utf8'
        };
        if (options[url].includeDir && typeof options[url].includeDir === 'function') {
            watcherOptions.filters.includeDir = options[url].includeDir;
        }
        if (options[url].includeFile && typeof options[url].includeFile === 'function') {
            watcherOptions.filters.includeFile = options[url].includeFile;
        }
        if (options[url].runImmediately && typeof options[url].runImmediately === 'function') {
            options[url].runImmediately.savedUrl = url;
            immediatelyTasks.push(options[url].runImmediately);
        }
        if (!options[url].callbacks.update || typeof options[url].callbacks.update !== 'function' ) {
            throw new Error(`You must define callback for "update" action`);
        }
        if (!options[url].callbacks.remove || typeof options[url].callbacks.remove !== 'function' ) {
            throw new Error(`You must define callback for "remove" action`);
        }
        if (options[url].options) {
            watcherOptions = options[url].options;
        }
        if (options[url].filter) {
            watcherOptions.filter = options[url].filter;
        }
        watch(url, watcherOptions, (evt, fullNamePath) => {
            if (evt === 'update') {
                // on create or modify
                sendConsoleText(`created or modified file: ${fullNamePath}`);
                options[url].callbacks.update(fullNamePath);
            }
            if (evt === 'remove') {
                // on delete
                sendConsoleText(`removed file: ${fullNamePath}`);
                options[url].callbacks.remove(fullNamePath);
            }
        });
    }
    sendConsoleText(`started on ${CONSTANTS.WATCHER_AND_RUNNER__PORT}`);
    immediatelyTasks.forEach(task => {
        if (typeof task === 'function') {
            task(task.savedUrl);
        }
    });
} catch(err) {
    sendConsoleText(err, 'err');
}


