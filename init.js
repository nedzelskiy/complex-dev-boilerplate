'use strict';

const fs = require('fs-extra');
const prompt = require('prompt');
const execSync = require('child_process').execSync;
const envFile = fs.readFileSync('sh/env.sh').toString();

let checkParam = [];
let buildFolderName = '';
let srcTestFolderName = '';
let srcClientFolderName = '';
let srcServerFolderName = '';


checkParam = /(SERVER__BUILD_FOLDER=["]([^"]+)["]|SERVER__BUILD_FOLDER=[']([^']+)['])/ig.exec(envFile);
checkParam[2] && (buildFolderName = checkParam[2]);

checkParam = /(SERVER__SRC_FOLDER=["]([^"]+)["]|SERVER__SRC_FOLDER=[']([^']+)['])/ig.exec(envFile);
checkParam[2] && (srcServerFolderName = checkParam[2]);

checkParam = /(SERVER__SRC_TEST_FOLDER=["]([^"]+)["]|SERVER__SRC_TEST_FOLDER=[']([^']+)['])/ig.exec(envFile);
checkParam[2] && (srcTestFolderName = checkParam[2]);

checkParam = /(CLIENT__SRC_FOLDER=["]([^"]+)["]|CLIENT__SRC_FOLDER=[']([^']+)['])/ig.exec(envFile);
checkParam[2] && (srcClientFolderName = checkParam[2]);

console.log(`This is a master that will help you configure boilerplate system:\r\n`);
prompt.start();
const schema = {
    properties: {
        buildFolderName: {
            pattern: /^[-_a-zA-Z0-9\/]+$/,
            message: 'Only letters, digits, dashes, underline and /',
            required: true,
            description: 'Enter name of build folder',
            default: buildFolderName
        },
        srcTestFolderName: {
            pattern: /^[-_a-zA-Z0-9\/]+$/,
            message: 'Only letters, digits, dashes, underline and /',
            required: true,
            description: 'Enter name of folder contains server tests',
            default: srcTestFolderName
        },
        srcServerFolderName: {
            pattern: /^[-_a-zA-Z0-9\/]+$/,
            message: 'Only letters, digits, dashes, underline and /',
            required: true,
            description: 'Enter name of folder contains server sources',
            default: srcServerFolderName
        },
        srcClientFolderName: {
            pattern: /^[-_a-zA-Z0-9\/]+$/,
            message: 'Only letters, digits, dashes, underline and /',
            required: true,
            description: 'Enter name of folder contains client sources',
            default: srcClientFolderName
        },
        prodGit: {
            pattern: /^[-_a-zA-Z0-9:\/@.]+$/,
            message: 'Only letters, digits, dashes, underline,:,.,/,@',
            required: false,
            description: 'Enter origin repository for production build files'
        }
    }
};
new Promise((resolve, reject) => {
    prompt.get(schema, function (err, result) {
        if (err) {
            reject(err);
        }
        resolve(result);
    });
})
.then(result => {
    const tmpValues = {
        buildFolderName_: result.buildFolderName.trim(),
        srcTestFolderName_: result.srcTestFolderName.trim(),
        srcClientFolderName_: result.srcClientFolderName.trim(),
        srcServerFolderName_: result.srcServerFolderName.trim(),
        prodGit_: result.prodGit ? result.prodGit.trim() : false
    };



    console.log(`
Your answers are:
${ schema.properties.buildFolderName.description }: "${ tmpValues.buildFolderName_ }"
${ schema.properties.srcTestFolderName.description }: "${ tmpValues.srcTestFolderName_ }"
${ schema.properties.srcClientFolderName.description }: "${ tmpValues.srcClientFolderName_ }"
${ schema.properties.srcServerFolderName.description }: "${ tmpValues.srcServerFolderName_ }"
${ schema.properties.prodGit.description }: ${ tmpValues.prodGit_ ? '"' + tmpValues.prodGit_ + '"' : 'not specified!' }

Looks good ? (y/N)
`);
    return new Promise((resolve, reject) => {
        prompt.get(['answer'], function (err, res) {
            if (err) {
                reject(err);
            }
            res.tmpValues = tmpValues;
            resolve(res);
        });
    });
})
.then(result => {
    if (result.answer.toLowerCase() !== 'y') {
        console.log(`\r\nInitialization canceled!`);
        process.exit(0);
    }
    let file;
    file = envFile.replace(/(SERVER__BUILD_FOLDER=["]([^"]+)["]|SERVER__BUILD_FOLDER=[']([^']+)['])/ig, (a,b,c) => {
        return a.replace(c, result.tmpValues.buildFolderName_);
    });
    file = file.replace(/(SERVER__SRC_FOLDER=["]([^"]+)["]|SERVER__SRC_FOLDER=[']([^']+)['])/ig, (a,b,c) => {
        return a.replace(c, result.tmpValues.srcServerFolderName_);
    });
    file = file.replace(/(SERVER__SRC_TEST_FOLDER=["]([^"]+)["]|SERVER__SRC_TEST_FOLDER=[']([^']+)['])/ig, (a,b,c) => {
        return a.replace(c, result.tmpValues.srcTestFolderName_);
    });
    file = file.replace(/(CLIENT__SRC_FOLDER=["]([^"]+)["]|CLIENT__SRC_FOLDER=[']([^']+)['])/ig, (a,b,c) => {
        return a.replace(c, result.tmpValues.srcClientFolderName_);
    });
    // fs.outputFileSync('11111111111111.js', file);
    fs.outputFileSync('sh/env.sh', file);
    fs.mkdirsSync(result.tmpValues.buildFolderName_);
    if (!fs.pathExistsSync(`${ result.tmpValues.buildFolderName_ }/.git`) && result.tmpValues.prodGit_) {
        fs.mkdirsSync(`${ result.tmpValues.buildFolderName_ }/.git`);
        execSync(`cd ${ result.tmpValues.buildFolderName_ } && git remote remove origin`);
        execSync(`cd ${ result.tmpValues.buildFolderName_ } && git remote add origin ${ result.tmpValues.prodGit_ }`);
        execSync(`cd ${ result.tmpValues.buildFolderName_ } && git pull origin master`);
    }
})
.catch(err => {
    console.log(JSON.stringify(err, null, 4));
    process.exit(1);
});


