'use strict';
const path = require('path');
const FILENAME = path.basename(__filename).replace(path.extname(path.basename(__filename)), '');

const CONSTANTS = {
    SERVER__URL:                    process.env.SERVER__URL,
    SERVER_APP_RESTARTER__URL:      process.env.SERVER_APP_RESTARTER__URL,
    SERVER_LIVERELOAD_PROXY__URL:   process.env.SERVER_LIVERELOAD_PROXY__URL,
    SERVER_BROWSER_RESTARTER__URL:  process.env.SERVER_BROWSER_RESTARTER__URL
};

for (let key in CONSTANTS) {
    if (!CONSTANTS[key]) {
        console.error(`${FILENAME}: You must set ${key} env!`);
        process.exit(1);
        return false;
    }
}
const fs = require('fs');
const request = require('request');

const handleResponse = (resolve, reject, error, response, body) => {
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
};

new Promise((resolve, reject) => {
    request(
        {
            uri: CONSTANTS.SERVER_APP_RESTARTER__URL,
            headers: {'socket-control-command': 'restart-app-server'},
            proxy: ''
        },
        handleResponse.bind(this, resolve, reject)
    );
})
.then(() => {
    return new Promise((resolve, reject) => {
        request(
            {
                uri: CONSTANTS.SERVER_BROWSER_RESTARTER__URL,
                headers: {'socket-control-command': 'browser-refresh'},
                proxy: ''
            },
            handleResponse.bind(this, resolve, reject)
        );
    });
})
.then(() => {
    console.log('');
    console.log('=======================================');
    console.log(`SERVER RUNS ON: ${CONSTANTS.SERVER__URL}`);
    console.log(`LIVERELOAD SERVER RUNS ON: ${CONSTANTS.SERVER_LIVERELOAD_PROXY__URL}`);
    console.log('=======================================');
    console.log('');

})
.catch(err => console.error(`${FILENAME}:`, err));