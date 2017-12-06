'use strict';
/*
*  rename file ./git/hooks/pre-push.sample -> ./git/hooks/pre-push
*  change last line exit 0 -> eval `grep "^export " ./sh/env.sh` && node ./scripts/pre-push-hook.js && exit 0
*/
console.log("\r\nAttention! Running pre-push git hook!\r\n");

const CONSTANTS = {
    SERVER__BUILD_FOLDER: process.env.SERVER__BUILD_FOLDER
};

for (let key in CONSTANTS) {
    if (!CONSTANTS[key]) {
        console.log(`ERROR: You must set ${key} env!`);
        process.exit(1);
    }
}


const execSync = require('child_process').execSync;
execSync(`git fetch origin`);
let lastCurrentHash = execSync(`git rev-parse HEAD`).toString().trim();
let lastRemoteHash = execSync('git ls-remote origin | awk "/master/ {print \$1}"').toString().trim();

if (lastCurrentHash === lastRemoteHash) {
    console.log('First commit your changes!');
    process.exit(0);
}

let historyMessage =  `[${ lastCurrentHash.substr(0,6) }] ${ execSync(`git log -1 --pretty=%B`).toString() }`;
execSync(`cd ${ CONSTANTS.SERVER__BUILD_FOLDER } && echo ${ (new Date()).getTime() } > version.manifest `);
execSync(`cd ${ CONSTANTS.SERVER__BUILD_FOLDER } && git add . `);
execSync(`cd ${ CONSTANTS.SERVER__BUILD_FOLDER } && git commit -m "${ historyMessage }"`);
execSync(`cd ${ CONSTANTS.SERVER__BUILD_FOLDER } && git pull origin master -s recursive -X ours`);
execSync(`cd ${ CONSTANTS.SERVER__BUILD_FOLDER } && git push origin master`);

process.exit(0);