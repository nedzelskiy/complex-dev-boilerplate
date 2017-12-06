'use strict';

const path = require('path');
const FILENAME = path.basename(__filename).replace(path.extname(path.basename(__filename)), '');

const CONSTANTS = {
    WATCHER_AND_RUNNER__PORT:           process.env.WATCHER_AND_RUNNER__PORT,
    WATCHER_AND_RUNNER__COLOR:          process.env.WATCHER_AND_RUNNER__COLOR || 'gray',
    WATCHER_AND_RUNNER__WAY_TO_CONFIG:  process.env.WATCHER_AND_RUNNER__WAY_TO_CONFIG
};

for (let key in CONSTANTS) {
    if (!CONSTANTS[key]) {
        console.log(`${FILENAME}: You must set ${key} env!`);
        process.exit(1);
    }
}

const ctx = {
    'name': FILENAME,
    'color': CONSTANTS.WATCHER_AND_RUNNER__COLOR,
    'port': CONSTANTS.WATCHER_AND_RUNNER__PORT,
    'process': process
};

let config = null;
const watch = require('node-watch');
const util = require('./microservices-utils');
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
try {
    for (let url in config) {
        let watcherOptions = {
            persistent: true,
            recursive: true,
            encoding: 'utf8'
        };
        if (config[url].includeDir && typeof config[url].includeDir === 'function') {
            watcherOptions.filters.includeDir = config[url].includeDir;
        }
        if (config[url].includeFile && typeof config[url].includeFile === 'function') {
            watcherOptions.filters.includeFile = config[url].includeFile;
        }
        if (config[url].runImmediately && typeof config[url].runImmediately === 'function') {
            config[url].runImmediately.savedUrl = url;
            immediatelyTasks.push(config[url].runImmediately);
        }
        if (!config[url].callbacks.update || typeof config[url].callbacks.update !== 'function' ) {
            throw new Error(`You must define callback for "update" action`);
        }
        if (!config[url].callbacks.remove || typeof config[url].callbacks.remove !== 'function' ) {
            throw new Error(`You must define callback for "remove" action`);
        }
        if (config[url].options) {
            watcherOptions = config[url].options;
        }
        if (config[url].filter) {
            watcherOptions.filter = config[url].filter;
        }
        watch(url, watcherOptions, (evt, fullNamePath) => {
            if (evt === 'update') {
                // on create or modify
                sendConsoleText(`created or modified file: ${fullNamePath}`);
                config[url].callbacks.update(fullNamePath);
            }
            if (evt === 'remove') {
                // on delete
                sendConsoleText(`removed file: ${fullNamePath}`);
                config[url].callbacks.remove(fullNamePath);
            }
        });
    }
    immediatelyTasks.forEach(task => {
        if (typeof task === 'function') {
            task(task.savedUrl);
        }
    });
    sendConsoleText(`started on ${CONSTANTS.WATCHER_AND_RUNNER__PORT}`);
} catch(err) {
    sendConsoleText(err, 'err');
}


