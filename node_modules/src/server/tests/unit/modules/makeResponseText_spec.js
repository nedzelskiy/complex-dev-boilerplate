'use strict';

const path = require('path');
const moduleWay = path.normalize(`/${process.env.SERVER__BUILD_FOLDER}/modules/makeResponseText`);
console.log(moduleWay);
const makeResponseText = require('../../../../../build/modules/makeResponseText');

const strResponse = 'Server render: It works!';

console.log(makeResponseText);