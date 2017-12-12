'use strict';
/*
 * This is a config file for watcher and runner microservice built on fs-watcher lib
 * Here you can define folders and files that will be watched and define a callbacks
 * that will be run if in those folders or files change smth
 *
 * Example structure for options see more for 'node-watch' npm package manual
 *
        options[<serve url>] = {
            options: {             // optionally = options for node-watch
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
 * You can build this file with any rules and also without process env variables
*/

const path = require('path');
const FILENAME = path.basename(__filename).replace(path.extname(path.basename(__filename)), '');

const CONSTANTS = {
    SERVER__SRC_FOLDER:             process.env.SERVER__SRC_FOLDER,
    SERVER__BUILD_FOLDER:           process.env.SERVER__BUILD_FOLDER,
    CONFIGS_SERVICES__DIR:          process.env.CONFIGS_SERVICES__DIR,
    SERVER__SRC_TEST_FOLDER:        process.env.SERVER__SRC_TEST_FOLDER,
    CONCURRENTLY_WRAPPER__PORT:     process.env.CONCURRENTLY_WRAPPER__PORT
};

CONSTANTS.SERVER__SRC_FOLDER = path.normalize(CONSTANTS.SERVER__SRC_FOLDER);
CONSTANTS.SERVER__BUILD_FOLDER = path.normalize(CONSTANTS.SERVER__BUILD_FOLDER);
CONSTANTS.SERVER__SRC_TEST_FOLDER = path.normalize(CONSTANTS.SERVER__SRC_TEST_FOLDER);

for (let key in CONSTANTS) {
    if (!CONSTANTS[key]) {
        console.log(`${FILENAME}: You must set ${key} env!`);
        process.exit(1);
    }
}

const options =  {};
const fs = require('fs');
const fse = require('fs-extra');
const utils = require('./utils');
const imagemin = require('imagemin');
const CleanCSS = require('clean-css');
const UglifyJS = require("uglify-js");
const terminate = require('terminate');
const exec = require('child_process').exec;
const recursive = require("recursive-readdir");
const imageminOptipng = require('imagemin-optipng');
const imageminJpegtran = require('imagemin-jpegtran');


let localConfigs = {
    sendConsoleText: utils.sendConsoleText,
    logInfo: () => {}
};

const cleanCSSS = new CleanCSS({
    sourceMap: true
});
const deniedFilesToCopyFromServerSrcToBuild = [
    'ts',
    'tsx'
];

const copyAllFileFromServerToBuild = () => {
    return new Promise((resolve, reject) => {
        recursive(
            CONSTANTS.SERVER__SRC_FOLDER,
            [
                (fileName, stats) => {
                    let ext = fileName.split('.').pop().toLowerCase();
                    return !stats.isDirectory() && deniedFilesToCopyFromServerSrcToBuild.reduce((bool, extension) => {
                            return extension === ext ? !!(++bool) : !!bool
                        }, false);
                }
            ],
            (err, files) => {
                if (err) {
                    reject(err);
                    return false;
                }
                let promises = [];
                files.forEach(fileName => {
                    promises.push(
                        copyFilesWithFilters(fileName.replace(CONSTANTS.SERVER__SRC_FOLDER, CONSTANTS.SERVER__BUILD_FOLDER), fileName)
                    );
                });
                Promise.all(promises)
                    .then(() => {
                        resolve(files);
                    })
                    .catch(reject);
            }
        );
    });
};

const copyFilesWithFilters = (to, from, options) => {
    let ext = from.split('.').pop().toLowerCase()
        ,file = fs.readFileSync(from)
        ,filePath = to.split('.', to.split('.').length - 1).join('.')
        ,fileName = filePath.split(path.sep).pop()
        ;
    if (
            ext === 'jpg'
        ||  ext === 'png'
        ||  ext === 'gif'
        ||  ext === 'jpeg'
        ||  ext === 'bmp'
        ||  ext === 'tiff'
        ||  ext === 'jfif'
        ||  ext === 'jpe'
    ) {
        return new Promise((resolve, reject) => {
            imagemin.buffer(file, {
                plugins: [
                    imageminJpegtran(),
                    imageminOptipng()
                ]
            })
            .then((buffer) => {
                fse.outputFileSync(to, buffer);
                resolve();
            })
            .catch(err => {
                localConfigs.sendConsoleText(`Error imagemin: ${err}`, 'err');
                localConfigs.logInfo(JSON.stringify(err, null, 4), 'error');
                imagemin.buffer(file)
                .then((buffer) => {
                    fse.outputFileSync(to, buffer);
                    resolve();
                })
                .catch(reject);
            });
        });
    } else if ( ext === 'css' ) {
        fse.outputFileSync(to, file);
        let result = cleanCSSS.minify(file);
        fse.outputFileSync(`${ filePath }.min.css`, result.styles + `/*# sourceMappingURL=${fileName}.min.css.map*/`);
        fse.outputFileSync(`${ filePath }.min.css.map`, result.sourceMap);
        return Promise.resolve();
    } else if ( ext === 'js' ) {
        let res = UglifyJS.minify(file.toString('utf-8'), {
            compress: {
                keep_fnames: true
            },
            mangle: {
                keep_fnames: true
            },
            sourceMap: true
        });
        if (res.error) {
            localConfigs.sendConsoleText(`Error while trying minify js file ${ fileName }.${ ext}! ${ JSON.stringify(res.error, null, 4)}` , 'err');
            return Promise.resolve();
        }
        fse.outputFileSync(to, file);
        fse.outputFileSync(`${ filePath }.min.js`, res.code + `/*# sourceMappingURL=${fileName}.min.js.map*/`);
        fse.outputFileSync(`${ filePath }.min.js.map`, res.map);
        return Promise.resolve();
    } else {
        fse.outputFileSync(to, file);
        return Promise.resolve();
    }
};


const copyFileFromServerToBuild = (fullNamePath) => {
    return new Promise((resolve, reject) => {
        copyFilesWithFilters(fullNamePath.replace(CONSTANTS.SERVER__SRC_FOLDER, CONSTANTS.SERVER__BUILD_FOLDER), fullNamePath)
            .then(() => {
                resolve([fullNamePath]);
            })
            .catch(reject);

    });
};

const copyServerFilesFromSrcToBuild = (fullNamePath) => {
    let promise_ = (fullNamePath) ? copyFileFromServerToBuild(fullNamePath) : copyAllFileFromServerToBuild();
    promise_
    .then((files)=> {
        localConfigs.sendConsoleText(`static files copied to ${ process.env.PWD }/${ CONSTANTS.SERVER__BUILD_FOLDER }:\r\n${ files.join('\r\n') }`);
        exec(`node scripts/request-refresh-browser-script.js`, (error, stdout, stderr) => {
            if (error) {
                localConfigs.sendConsoleText(`Error copyServerFilesFromSrcToBuild! ${ error } ${ stdout } ${ stderr }`, 'err');
            }
        });
    })
    .catch(err => {
        localConfigs.sendConsoleText(`ERROR: Something went wrong in copyServerFilesFromSrcToBuild` + "\r\n" + JSON.stringify(err, null, 4) + "\r\n", 'err');
    });
};

const deleteFilesInBuildServerFolder = (fullNamePath) => {
    fse.remove(fullNamePath.replace(CONSTANTS.SERVER__SRC_FOLDER, CONSTANTS.SERVER__BUILD_FOLDER)).then(() => {
        localConfigs.sendConsoleText(`files deleted! ${ fullNamePath.toString() }`);
    });
};

const makeConfigs = () => {
    return new Promise((resolve, reject) => {
        exec(`node scripts/make-server-configs.js`, (error, stdout, stderr) => {
            if (error) {
                localConfigs.sendConsoleText(`Error makeConfigs! ${ error } ${ stdout } ${ stderr }`, 'err');
                reject(error);
            } else {
                localConfigs.sendConsoleText(`${stdout} ${stderr}`);
                resolve();
            }
        });
    });
};

const getTCPResponse = (port, message, domen) => {
    let domen_ = domen || 'localhost';
    return new Promise((resolve, reject) => {
        let client = new require('net').Socket();
        client.connect(port, domen_, () => {
            client.write(JSON.stringify(message));
        });
        client.on('data', data => {
            client.destroy();
            resolve(data);
        });
        client.on('close', () => {
            client.destroy();
            reject('Server suddenly closed connection before sent data');
        });
        client.on('error', err => {
            client.destroy();
            reject(err);
        });
    });
};


const restartConcurrentlyWrapperProcess = (strCommand) => {
     return new Promise((resolve, reject) => {
        getTCPResponse(CONSTANTS.CONCURRENTLY_WRAPPER__PORT, {
            'command': '@getActiveProcessList',
            'commandLine': ''
        })
        .then(data => {
            let message = JSON.parse(data.toString('utf-8'));
            for (let cmd in message) {
                if (!~cmd.indexOf(strCommand)) continue;
                getTCPResponse(CONSTANTS.CONCURRENTLY_WRAPPER__PORT, {
                    'command': '@restartProcessByPid',
                    'pid': message[cmd].pid
                }).catch(err => {
                    throw err;
                });
            }
            resolve();
        })
        .catch(err => {
            localConfigs.sendConsoleText(`ERROR: Something went wrong in restartConcurrentlyWrapperProcess` + "\r\n" + JSON.stringify(err, null, 4) + "\r\n", 'err');
            reject(err);
        });
    });
};

const copyOneFile = (fullNamePathFile, fullPathTo) => {
    const fileName = path.normalize(fullNamePathFile).split(path.sep).pop();
    const file = fs.readFileSync(path.normalize(fullNamePathFile));
    fse.outputFileSync(path.normalize(`${ fullPathTo }/${fileName}`), file);
    localConfigs.sendConsoleText(`Copied file "${ fileName }" to ${ fullPathTo }`);
};

const runServerTests = (fullNamePath) => {
    localConfigs.sendConsoleText(`Change detected with ${fullNamePath}`);
    localConfigs.sendConsoleText(`run build server script...`);
    exec(`node scripts/build-server-script.js`, (error, stdout, stderr) => {
        if (error) {
            localConfigs.sendConsoleText(`ERROR ${error} ${stdout} ${stderr}`, 'err');
        } else {
            localConfigs.sendConsoleText(`${stdout} ${stderr}`);
        }
    });
};


options['scripts/make-server-configs.js'] = {
    callbacks: {
        update: () => {
            restartConcurrentlyWrapperProcess('ts-server');
        },
        remove: (fullNamePath) => {
            localConfigs.sendConsoleText(`\r\n\r\nAttention file ${fullNamePath} was removed!!`);
        }
    }
};
options['scripts/make-client-configs.js'] = {
    callbacks: {
        update: () => {
            restartConcurrentlyWrapperProcess('webpack-client');
        },
        remove: (fullNamePath) => {
            localConfigs.sendConsoleText(`\r\n\r\nAttention file ${fullNamePath} was removed!!`);
        }
    }
};
options[`${CONSTANTS.CONFIGS_SERVICES__DIR}/webpack-client.conf.js`] = {
    callbacks: {
        update: () => {
            restartConcurrentlyWrapperProcess('webpack-client');
        },
        remove: (fullNamePath) => {
            localConfigs.sendConsoleText(`\r\n\r\nAttention file ${fullNamePath} was removed!!`);
        }
    }
};
options[`${ process.env.PWD }/${ CONSTANTS.SERVER__SRC_FOLDER }`] = {
    callbacks: {
        update: copyServerFilesFromSrcToBuild,
        remove: deleteFilesInBuildServerFolder
    },
    runImmediately: () => {
        copyServerFilesFromSrcToBuild()
    },
    filter: function (fullNamePath) {
        try {
            let ext = fullNamePath.split('.').pop().toLowerCase();
            return (
                    ![
                        'ts',
                        'tsx',
                        'crdownload'
                    ].reduce((bool, extension) => {
                        return extension === ext ? !!(++bool) : !!bool
                    }, false)

                && !fs.statSync(fullNamePath).isDirectory()
            );
        } catch (err) {
            if (err.code.toUpperCase() !== 'ENOENT') {
                localConfigs.sendConsoleText(`ERR: ${err}`, 'err');
                return false;
            }
            return true;
        }
    }
};

options[`${ process.env.PWD }/${ CONSTANTS.SERVER__SRC_TEST_FOLDER }`] = {
    callbacks: {
        update: runServerTests,
        remove: runServerTests,
    },
    filter: function (fullNamePath) {
        try {
            return /[sS]pec\.[a-zA-Z]+$/.test(fullNamePath) && !fs.statSync(fullNamePath).isDirectory();
        } catch (err) {
            if (err.code.toUpperCase() !== 'ENOENT') {
                localConfigs.sendConsoleText(`ERR: ${ err }`, 'err');
                return false;
            }
            return true;
        }
    }
};

options[`${ process.env.PWD }/package.json`] = {
    callbacks: {
        update: (fullNamePath) => {
            copyOneFile(fullNamePath, `${process.env.PWD}/${ CONSTANTS.SERVER__BUILD_FOLDER }`);
        },
        remove: (fullNamePath) => {
            localConfigs.sendConsoleText(`\r\n\r\nAttention file ${fullNamePath} was removed!!`);
        }
    },
    runImmediately: (fullNamePath) => {
        copyOneFile(fullNamePath, `${process.env.PWD}/${ CONSTANTS.SERVER__BUILD_FOLDER }`);
    }
};

options[`${ process.env.PWD }/process.yml`] = {
    callbacks: {
        update: (fullNamePath) => {
            copyOneFile(fullNamePath, `${process.env.PWD}/${ CONSTANTS.SERVER__BUILD_FOLDER }`);
        },
        remove: (fullNamePath) => {
            localConfigs.sendConsoleText(`\r\n\r\nAttention file ${fullNamePath} was removed!!`);
        }
    },
    runImmediately: (fullNamePath) => {
        copyOneFile(fullNamePath, `${process.env.PWD}/${ CONSTANTS.SERVER__BUILD_FOLDER }`);
    }
};

options[`${ process.env.PWD }/tsconfig.json`] = {
    callbacks: {
        update: (fullNamePath) => {
            restartConcurrentlyWrapperProcess('webpack-client')
            .then(() => {
                restartConcurrentlyWrapperProcess('ts-server');
            });
        },
        remove: (fullNamePath) => {
            localConfigs.sendConsoleText(`\r\n\r\nAttention file ${fullNamePath} was removed!!`);
        }
    }
};

options[__filename] = {
    callbacks: {
        update: (fullNamePath) => {
            restartConcurrentlyWrapperProcess('watcher-and-runner');
        },
        remove: (fullNamePath) => {
            localConfigs.sendConsoleText(`\r\n\r\nAttention file ${fullNamePath} was removed!!`);
        }
    }
};


module.exports = {
    options: options,
    localConfigs: localConfigs
};
