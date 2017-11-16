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
// create tsconfig-server.json
let tsconfigServer = {
    "compilerOptions": {
        "noImplicitAny": true,
        "moduleResolution": "node",
        "module": "commonjs",
        "removeComments": true,
        "target": "es6",
        "allowJs": true,
        "outDir": `../${CONSTANTS.SERVER__BUILD_FOLDER}`,
        "sourceMap": true,
        "strictNullChecks": true,
        "typeRoots": [
            "../node_modules/@types",
            "../@types"
        ],
        "lib": [
            "dom",
            "es2015",
            "es5",
            "es6"
        ]
    },
    "include": [
        `../${ CONSTANTS.SERVER__SRC_FOLDER }/**/*.ts`
    ]
};
// create tsconfig-client.json
let tsconfigClient = {
    "compilerOptions": {
        "sourceMap": true,
        "noImplicitAny": true,
        "moduleResolution": "node",
        "module": "commonjs",
        "removeComments": true,
        "target": "es5",
        "jsx" :  "react",
        "allowJs": true,
        "strictNullChecks": true,
        "types": [
            "node"
        ],
        "typeRoots": [
            "../node_modules/@types",
            "../@types"
        ],
        "lib": [
            "dom",
            "es2015",
            "es5",
            "es6"
        ]
    },
    "include": [
        `../${ CONSTANTS.CLIENT__SRC_FOLDER }/**/*.ts`
    ]
};

fs.writeFileSync(`${CONSTANTS.CONFIGS_SERVICES__DIR}/tsconfig-client.json`, JSON.stringify(tsconfigClient, null, 4));
fs.writeFileSync(`${CONSTANTS.CONFIGS_SERVICES__DIR}/tsconfig-server.json`, JSON.stringify(tsconfigServer, null, 4));

console.log(`${FILENAME}: configs created!`);
