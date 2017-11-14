'use strict';
const path = require('path');
const FILENAME = path.basename(__filename).replace(path.extname(path.basename(__filename)), '');

const CONSTANTS = {
    SERVER__SRC_TEST_FOLDER: process.env.SERVER__SRC_TEST_FOLDER
};

for (let key in CONSTANTS) {
    if (!CONSTANTS[key]) {
        console.error(`${FILENAME}: You must set ${key} env!`);
        process.exit(1);
        return false;
    }
}

const Jasmine = require('jasmine');
const jasmine = new Jasmine();
// console.log(CONSTANTS.SERVER__SRC_TEST_FOLDER);
const spec_dir = path.normalize(`/${CONSTANTS.SERVER__SRC_TEST_FOLDER}/`);
const spec_files = [
    '**/*_[sS]pec.js'
];

jasmine.loadConfig({
    spec_dir: spec_dir,
    spec_files: spec_files
});

jasmine.execute();


// const cmd = require('node-cmd');

// new Promise((resolve, reject) => {
//     cmd.get(`node node_modules/jasmine/bin/jasmine.js ${CONSTANTS.SERVER__SRC_TEST_FOLDER}`, (mess, err) => {
//         console.log(mess);
//         console.log('++++++++');
//         console.log(err);
//
//     });
// });
//         process.exit(1);


