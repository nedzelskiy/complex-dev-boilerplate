'use strict';
// TODO run only if exists changes

const execSync = require('child_process').execSync;
let historyMessage = execSync(`git log -1 --pretty=oneline`).toString();
execSync(`cd build && echo ${ (new Date()).getTime() } > version.manifest `);
execSync(`cd build && git add . `);
execSync(`cd build && git commit -m "${ historyMessage }"`);
execSync(`cd build && git pull origin master -s recursive -X ours`);
execSync(`cd build && git push origin master`);

process.exit(0);