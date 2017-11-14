'use strict';

// kill process with child process by pid with optional signal (default=SIGKILL)
const path = require('path');
const args = require('minimist')(process.argv.slice(2));
const terminate = require('terminate');
const FILENAME = path.basename(__filename).replace(path.extname(path.basename(__filename)), '');

if (args.k && /^[0-9]+$/.test(args.k)) {
    let signal = 'SIGKILL';
    if (args.s && /^[a-zA-Z]+$/.test(args.s)) {
        signal = args.s;
    }
    terminate(args.k, 'SIGINT', (err) => {
        if (err) {
            console.error(`${FILENAME} ERROR:`, err);
        } else {
            console.log(`${FILENAME}: Executed!`);
        }
    });
}



