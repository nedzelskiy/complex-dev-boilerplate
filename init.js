'use strict';

const fs = require('fs-extra');
const prompt = require('prompt');
const endOfLine = require('os').EOL;
const nodeYaml = require('node-yaml');
const execSync = require('child_process').execSync;
const envFile = fs.readFileSync('sh/env.sh').toString();

let checkParam = [];
let buildFolderName = '';
let srcTestFolderName = '';
let srcClientFolderName = '';
let srcServerFolderName = '';
let isAllGood = true;


checkParam = /(SERVER__BUILD_FOLDER=["]([^"]+)["]|SERVER__BUILD_FOLDER=[']([^']+)['])/ig.exec(envFile);
checkParam[2] && (buildFolderName = checkParam[2].trim());

checkParam = /(SERVER__SRC_FOLDER=["]([^"]+)["]|SERVER__SRC_FOLDER=[']([^']+)['])/ig.exec(envFile);
checkParam[2] && (srcServerFolderName = checkParam[2].trim());

checkParam = /(SERVER__SRC_TEST_FOLDER=["]([^"]+)["]|SERVER__SRC_TEST_FOLDER=[']([^']+)['])/ig.exec(envFile);
checkParam[2] && (srcTestFolderName = checkParam[2].trim());

checkParam = /(CLIENT__SRC_FOLDER=["]([^"]+)["]|CLIENT__SRC_FOLDER=[']([^']+)['])/ig.exec(envFile);
checkParam[2] && (srcClientFolderName = checkParam[2].trim());

if (
    buildFolderName === '' || srcTestFolderName === '' || srcClientFolderName === '' || srcServerFolderName === ''
) {
    console.log(`
Something wrong with env.sh script:
SERVER__SRC_FOLDER: ${srcServerFolderName}
SERVER__SRC_TEST_FOLDER: ${srcTestFolderName}
CLIENT__SRC_FOLDER: ${srcClientFolderName}
SERVER__BUILD_FOLDER: ${buildFolderName}
`);
    process.exit(0);
}

console.log(`This is a master that will help you configure boilerplate system:\r\n`);
prompt.start();
const schema = {
    properties: {
        srcServerFolderName: {
            pattern: /^[-_a-zA-Z0-9\/]+$/,
            message: 'Only letters, digits, dashes, underline and /',
            required: true,
            description: 'Enter name of folder contains server sources',
            default: srcServerFolderName
        },
        srcTestFolderName: {
            pattern: /^[-_a-zA-Z0-9\/]+$/,
            message: 'Only letters, digits, dashes, underline and /',
            required: true,
            description: 'Enter name of folder contains server tests',
            default: srcTestFolderName
        },
        srcClientFolderName: {
            pattern: /^[-_a-zA-Z0-9\/]+$/,
            message: 'Only letters, digits, dashes, underline and /',
            required: true,
            description: 'Enter name of folder contains client sources',
            default: srcClientFolderName
        },
        buildFolderName: {
            pattern: /^[-_a-zA-Z0-9\/]+$/,
            message: 'Only letters, digits, dashes, underline and /',
            required: true,
            description: 'Enter name of build folder',
            default: buildFolderName
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
${ schema.properties.srcServerFolderName.description }: "${ tmpValues.srcServerFolderName_ }"
${ schema.properties.srcTestFolderName.description }: "${ tmpValues.srcTestFolderName_ }"
${ schema.properties.srcClientFolderName.description }: "${ tmpValues.srcClientFolderName_ }"
${ schema.properties.buildFolderName.description }: "${ tmpValues.buildFolderName_ }"
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
    process.stdout.write(`Writing sh/env.sh ...`);
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
    fs.outputFileSync('sh/env.sh', file);
    process.stdout.write("OK\r\n");

    process.stdout.write(`Making build folder: "${result.tmpValues.buildFolderName_}" ...`);
    fs.mkdirsSync(result.tmpValues.buildFolderName_);
    process.stdout.write("OK\r\n");

    let command;
    if (result.tmpValues.prodGit_) {
        if (!fs.pathExistsSync(`${ result.tmpValues.buildFolderName_ }/.git`)) {
            command = `cd ${ result.tmpValues.buildFolderName_ } && git init`;
            process.stdout.write(`Executing the command: "${command}" ...`);
            execSync(command);
            process.stdout.write("OK\r\n");
        }
        try {
            command = `cd ${ result.tmpValues.buildFolderName_ } && git remote remove origin`;
            process.stdout.write(`Executing the command: "${command}" ...`);
            execSync(command);
            process.stdout.write("OK\r\n");
        } catch (err) {}

        command = `cd ${ result.tmpValues.buildFolderName_ } && git remote add origin ${ result.tmpValues.prodGit_ }`;
        process.stdout.write(`Executing the command: "${command}" ...`);
        execSync(command);
        process.stdout.write("OK\r\n");

        command = `cd ${ result.tmpValues.buildFolderName_ } && git pull origin master`;
        process.stdout.write(`Executing the command: "${command}" ...\r\n`);
        execSync(command);
        process.stdout.write("OK\r\n");

        process.stdout.write(`Creating pre-push git hook ...`);
        const hookFile = fs.readFileSync('.git/hooks/pre-push.sample').toString();
        const hookLines = hookFile.split("\n");
        if (hookLines[hookLines.length - 1] && !!~hookLines[hookLines.length - 1].indexOf('exit')) {
            hookLines[hookLines.length - 1] = 'eval `grep "^export " ./sh/env.sh` && node ./scripts/pre-push-hook.js && exit 0';
            fs.outputFileSync('.git/hooks/pre-push', hookLines.join("\n"));
            process.stdout.write("OK\r\n");
        } else  if (hookLines[hookLines.length - 2] && !!~hookLines[hookLines.length - 2].indexOf('exit')) {
            hookLines[hookLines.length - 2] = 'eval `grep "^export " ./sh/env.sh` && node ./scripts/pre-push-hook.js && exit 0';
            fs.outputFileSync('.git/hooks/pre-push', hookLines.join("\n"));
            process.stdout.write("OK\r\n");
        } else {
            process.stdout.write("FAIL!\r\n");
            isAllGood = false;
        }
    }
    process.stdout.write(`Writing .travis.yml ...`);
    const travisConf = nodeYaml.readSync('.travis.yml');
    travisConf['before_script'].forEach((script, index) => {
        if (!!~script.indexOf('git') && !!~script.indexOf('clone') && !!~script.indexOf(buildFolderName)) {
            travisConf['before_script'][index] = `git clone $PRODUCTION_REPOSITORY ${ result.tmpValues.buildFolderName_ }`;
        }
    });
    travisConf['before_deploy'].forEach((script, index) => {
        if (!!~script.indexOf('cd') && !!~script.indexOf(buildFolderName)) {
            travisConf['before_deploy'][index] = `cd ${ result.tmpValues.buildFolderName_ }`;
        }
    });
    nodeYaml.writeSync('.travis.yml', travisConf);
    process.stdout.write("OK\r\n");

    process.stdout.write(`Writing .gitignore ...`);
    const gitIgnoreFile = fs.readFileSync('.gitignore').toString();
    const gitIgnoreConf = gitIgnoreFile.split("\n");
    gitIgnoreConf.forEach((line, index) => {
        if (!!~line.indexOf(buildFolderName)) {
            gitIgnoreConf[index] = `${ result.tmpValues.buildFolderName_ }/`;
        }
    });
    fs.outputFileSync('.gitignore', gitIgnoreConf.join("\n"));
    process.stdout.write("OK\r\n");
    console.log(`\r\nInitialisation finished!`);
    if (isAllGood) {
        console.log(`Now you can run "npm run dev" for start developing!`);
    } else {
        console.log(`There are exists some errors. See console from above.`);
    }
})
.catch(err => {
    console.log(JSON.stringify(err, null, 4));
    process.exit(1);
});


