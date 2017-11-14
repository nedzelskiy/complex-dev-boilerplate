'use strict';

const path = require('path');
const FILENAME = path.basename(__filename).replace(path.extname(path.basename(__filename)), '');

const CONSTANTS = {
    SERVER_BROWSER_RESTARTER__URL:  process.env.SERVER_BROWSER_RESTARTER__URL
};

for (let key in CONSTANTS) {
    if (!CONSTANTS[key]) {
        console.error(`${FILENAME}: You must set ${key} env!`);
        process.exit(1);
        return false;
    }
}

const request = require('request');

new Promise((resolve, reject) => {
    request(
        {
            uri: CONSTANTS.SERVER_BROWSER_RESTARTER__URL,
            headers: {'socket-control-command': 'browser-refresh'},
            proxy: ''
        },
        (error, response, body) => {
            if (error) {
                reject(error);
                return;
            }
            if (response.statusCode !== 200) {
                reject({
                    body: body,
                    response: response
                });
                return;
            }
            resolve();
        }
    );
})
.catch(err => console.error(`${FILENAME}:`, err));