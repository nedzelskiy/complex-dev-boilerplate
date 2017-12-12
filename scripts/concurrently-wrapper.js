const path_ = require('path');
const FILENAME = path_.basename(__filename).replace(path_.extname(path_.basename(__filename)), '') + ` pid[${process.pid}]`;
const terminate = require('terminate'); // kill process with child process!

const exitWithNonZeroCode = () => {
    terminate(process.pid, err => {
        if (err) {
            console.log(err);
        }
    });
};

process.on('uncaughtException', (err) => {
    console.log('========== uncaughtException =============');
    console.log(err);
    console.log('==========================================');
    setTimeout(exitWithNonZeroCode, 100);
});

const net = require('net');
const utils = require('./utils');
const parse = require('shell-quote').parse;

const server = net.createServer(function(socket) {
    socket.on('data', (data) => {
        let message = JSON.parse(data.toString('utf-8'));
        if (message && message.command && '@getActiveProcessList' === message.command) {
            socket.write(JSON.stringify(getActiveProcessList()));
        } else if (message && message.command && '@restartProcessByPid' === message.command && message.pid) {
            if (childrenInfoKeeper && childrenInfoKeeper[message.pid] && childrenInfoKeeper[message.pid].command) {
                setTimeout(() => {
                    availableCommands['k'].run(message.pid)
                    .then(() => {
                        availableCommands['add'].run(
                            `'${ childrenInfoKeeper[message.pid].command }'`,
                            childrenInfoKeeper[message.pid].index ? childrenInfoKeeper[message.pid].index : null
                        );
                    })
                    .catch(err => {
                        console.log(`${FILENAME}: ERROR`, `${ JSON.stringify(err, null, 4) }\r\n`, err);
                    });
                }, 0);
                socket.write('OK!');
            } else {
                console.log(`${FILENAME} ERROR: Can't find process with pid ${message.pid} for "@restartProcessByPid" command`);
            }
        } else if (message && message.command && message.commandLine && availableCommands[message.command]) {
            availableCommands[message.command].run.apply(null, parse(message.commandLine).slice(1));
            socket.write('OK!');
        }
    });
}).listen(process.env.CONCURRENTLY_WRAPPER__PORT);
console.log(`${FILENAME}: listen ${process.env.CONCURRENTLY_WRAPPER__PORT} port`);

const fs = require('fs');
const exec = require('child_process').exec;
const argv = require('minimist')(process.argv.slice(2));

let file = fs
    .readFileSync('./node_modules/concurrently/src/main.js', 'utf-8')
    .replace('main();' , '')
    .replace('#!/usr/bin/', '//');
eval(file);

let maxIndex = 0;
let childrenInfoKeeper = {};

// override run func from concurrently
run = function (commands /* added */, oldIndex) {
    var childrenInfo = {};
    var lastPrefixColor = _.get(chalk, chalk.gray.dim);
    var prefixColors = config.prefixColors.split(',');
    var names = config.names.split(config.nameSeparator);
    var children = _.map(commands, function(cmd, index) {
        // Remove quotes.
        cmd = stripCmdQuotes(cmd);

        var spawnOpts = config.raw ? {stdio: 'inherit'} : {};
        if (IS_WINDOWS) {
            spawnOpts.detached = false;
        }
        if (supportsColor) {
            spawnOpts.env = Object.assign({FORCE_COLOR: supportsColor.level}, process.env)
        }

        var child = spawnChild(cmd, spawnOpts);
        if (index < prefixColors.length) {
            var prefixColorPath = prefixColors[index];
            lastPrefixColor = _.get(chalk, prefixColorPath, chalk.gray.dim);
        }

        var name = index < names.length ? names[index] : '';
        childrenInfo[child.pid] = {
            command: cmd,
            index: /* added */ oldIndex ? oldIndex: index,
            name: name,
            options: spawnOpts,
            restartTries: config.restartTries,
            prefixColor: lastPrefixColor
        };
        // ===================================== ADDED ============================
        childrenInfoKeeper[child.pid] = {
            command: cmd,
            index: oldIndex ? oldIndex: index,
            name: name,
            options: spawnOpts,
            restartTries: config.restartTries,
            prefixColor: lastPrefixColor
        };
        if (childrenInfoKeeper[child.pid].index * 1 > maxIndex) {
            maxIndex = childrenInfoKeeper[child.pid].index * 1;
        }
        child.on('exit', (signal) => {
            delete childrenInfoKeeper[child.pid];
        });
        // ===================================== FINISH ADDED ============================
        return child;
    });

    var streams = toStreams(children);

    handleChildEvents(streams, children, childrenInfo);
    // ================= DELETED OTHER CODE FROM HERE ============================
};

// override handleClose func from concurrently
handleClose = function(streams, children, childrenInfo) {
    // deleted var aliveChildren = _.clone(children);
    var exitCodes = [];
    var closeStreams = _.map(streams, 'close');
    var closeStream = Rx.Observable.merge.apply(this, closeStreams);

    // deleted var othersKilled = false;

    closeStream.subscribe(function(event) {
        var exitCode = event.data;
        // deleted var nonSuccess = exitCode !== 0;
        exitCodes.push(exitCode);

        var prefix = getPrefix(childrenInfo, event.child);
        var childInfo = childrenInfo[event.child.pid];
        var prefixColor = childInfo.prefixColor;
        var command = childInfo.command;
        logEvent(prefix, prefixColor, command + ' exited with code ' + exitCode);

        // ================= DELETED OTHER CODE FROM HERE ============================
    });
};


config.allowRestart = false;
config.killOthers = false;
config.restartAfter = 0;
config.prefix = "[{index}]-pid:[{pid}]";
run(argv['_']);

const exitWithZeroCode = () => {
    let promises = [];
    for (let pid in childrenInfoKeeper) {
        if (!childrenInfoKeeper.hasOwnProperty(pid)) continue;
        promises.push(new Promise((resolve, reject) => {
            terminate(pid, 'SIGTERM', err => {
                resolve();
            });
        }));
    }
    Promise.all(promises).then(() => {
        process.exit(0);
    }).catch(err => {
        console.log(`${FILENAME} ERROR: Process can't exit with "0" code! \r\n ${JSON.stringify(err, null, 4)}`);
        setTimeout(exitWithNonZeroCode, 100);
    });
};

const getActiveProcessList = () => {
    let listOfActiveProcess = {};

    for (let pid in childrenInfoKeeper) {
        listOfActiveProcess[childrenInfoKeeper[pid].command] = {
            pid: pid,
            index: childrenInfoKeeper[pid].index
        };
    }
    return listOfActiveProcess;
};

const availableCommands = {
    'k':{
        run: function(pid, signal) {
            let signal_ = signal || 'SIGKILL';
            return new Promise((resolve, reject) => {
                terminate(pid, signal_, err => {
                    if (err) {
                        console.log(`${FILENAME} ERROR: Can't terminate process ${ pid } with signal ${ signal_ }. Maybe this process already died!`);
                        reject(err);
                    } else {
                        resolve();
                    }
                });

            });
        },
        usage: 'k [PID [SIGNAL]] <> kill concurrently task by pid with signal'
    },
    'r': {
        run: function(pid) {
            if (!pid || !/^\d+$/.test(pid)) {
                console.log(`${FILENAME} ERROR: Wrong argument pid for command r - restart by pid, type "help" command`);
                return false;
            }
            availableCommands['k'].run(pid, 'SIGTERM')
            .then(() => {
                if (
                    'undefined' !== typeof childrenInfoKeeper
                    && 'undefined' !== typeof childrenInfoKeeper[pid]
                    && 'undefined' !== typeof childrenInfoKeeper[pid].index
                    && 'undefined' !== typeof childrenInfoKeeper[pid].command
                ) {
                    run([childrenInfoKeeper[pid].command], childrenInfoKeeper[pid].index);
                } else {
                    console.log(`${FILENAME} ERROR: Can't restart command by pid "${pid}", maybe this process already died!`);
                    if ('undefined' !== typeof childrenInfoKeeper[pid]) {
                        delete childrenInfoKeeper[pid];
                    }
                }
            })
            .catch(err => {
                console.log(`${FILENAME} ERROR: ${ JSON.stringify(err, null, 4) }`, err);
            });
        },
        usage: 'r [PID] <> restart concurrently task by pid'
    },
    'add': {
        run: (command, index) => {
            let newIndex = index || maxIndex;
            console.log(`${FILENAME}: added command: ${command} with index ${newIndex}`);
            run([command], newIndex);
        },
        usage: 'add [command, [index]] <> add a new command to concurrently spawn'
    },
    'list': {
        run: () => {
            let listOfActiveProcess = getActiveProcessList();
            console.log(`\r\n\r\n ${ JSON.stringify(listOfActiveProcess, null, 4)}\r\n`);
        },
        usage: 'list <> show information of all running child process'
    },
    'exit': {
        run: exitWithZeroCode,
        usage: 'exit <> stop watching for commands and exit script'
    }
};


const execConsole = require('js_console_command_executor')(availableCommands);

execConsole.actions.doExit = exitWithZeroCode;
execConsole();