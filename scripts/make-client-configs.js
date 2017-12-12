'use strict';

/*
 *  this file create configs files
 *  such as typescript configs and etc
 *  according to env variables in env.sh
 *
 */
process.on('uncaughtException', (err) => {
    console.log('========== uncaughtException =============');
    console.log(err);
    console.log('==========================================');
    setTimeout(() => {
        process.exit(1);
    }, 100);
});

const path = require('path');
const FILENAME = path.basename(__filename).replace(path.extname(path.basename(__filename)), '');

const CONSTANTS = {
    CLIENT__SRC_FOLDER:     process.env.CLIENT__SRC_FOLDER,
    SERVER__SRC_FOLDER:     process.env.SERVER__SRC_FOLDER,
    SERVER__BUILD_FOLDER:   process.env.SERVER__BUILD_FOLDER,
    CONFIGS_SERVICES__DIR:  process.env.CONFIGS_SERVICES__DIR
};

for (let key in CONSTANTS) {
    if (!CONSTANTS[key]) {
        console.log(`${FILENAME}: You must set ${key} env!`);
        process.exit(1);
    }
}

const fs = require('fs');
// create tsconfig-client.json
let tsconfigClient = {
    "extends": `${ process.env.PWD }/tsconfig.json`,
    "include": [
        `${ process.env.PWD }/${ CONSTANTS.CLIENT__SRC_FOLDER }/**/*`
    ]
};

fs.writeFileSync(`${ CONSTANTS.CONFIGS_SERVICES__DIR }/tsconfig-client.json`, JSON.stringify(tsconfigClient, null, 4));

console.log(`${FILENAME}: configs created!`);
