'use strict';
const path = require('path');
const FILENAME = path.basename(__filename).replace(path.extname(path.basename(__filename)), '');

const CONSTANTS = {
    SERVER__URL:                    process.env.SERVER__URL,
    SERVER_LIVERELOAD_PROXY__URL:   process.env.SERVER_LIVERELOAD_PROXY__URL
};

for (let key in CONSTANTS) {
    if (!CONSTANTS[key]) {
        console.error(`${FILENAME}: You must set ${key} env!`);
        process.exit(1);
        return false;
    }
}
const { exec } = require('child_process');

new Promise((resolve, reject) => {
    exec(`node scripts/request-refresh-browser-script.js`, (error, stdout, stderr) => {
        if (error) {
            reject(error);
            return;
        }
        resolve();
    });
})
.then(()=>{
    console.log('');
    console.log('=======================================');
    console.log(`SERVER RUNS ON: ${CONSTANTS.SERVER__URL}`);
    console.log(`LIVERELOAD SERVER RUNS ON: ${CONSTANTS.SERVER_LIVERELOAD_PROXY__URL}`);
    console.log('=======================================');
    console.log('');
})
.catch(err => console.error(`${FILENAME}:`, err));