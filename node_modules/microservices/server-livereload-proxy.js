'use strict';
const path = require('path');
const FILENAME = path.basename(__filename).replace(path.extname(path.basename(__filename)), '');

const CONSTANTS = {
    SERVER__URL:                    process.env.SERVER__URL,
    SERVER_BROWSER_RESTARTER__URL:  process.env.SERVER_BROWSER_RESTARTER__URL,
    SERVER_LIVERELOAD_PROXY__URL:   process.env.SERVER_LIVERELOAD_PROXY__URL,
    SERVER_LIVERELOAD_PROXY__PORT:  process.env.SERVER_LIVERELOAD_PROXY__PORT,
    SERVER_LIVERELOAD_PROXY__COLOR: process.env.SERVER_LIVERELOAD_PROXY__COLOR || 'magentaBright'
};

for (let key in CONSTANTS) {
    if (!CONSTANTS[key]) {
        console.error(`${FILENAME}: You must set ${key} env!`);
        process.exit(1);
        return false;
    }
}

const util = require('./microservices-utils');

const ctx = {
    'name': FILENAME,
    'color': CONSTANTS.SERVER_LIVERELOAD_PROXY__COLOR,
    'port': CONSTANTS.SERVER_LIVERELOAD_PROXY__PORT,
    'process': process
};
const sendConsoleText = util.sendConsoleText.bind(ctx);

const http = require('http');
const request = require('request');
const fs = require('fs');

const buildHtmlScript = () => {
    const libClient = fs.readFileSync('./node_modules/socket.io-client/dist/socket.io.js', 'utf-8');
    const clientReloadCode = fs.readFileSync('./scripts/client-browser-restarter-script.js', 'utf-8');
    return (`
        <script>${ libClient }</script> 
        <script>${ clientReloadCode.replace("[serverUrl]", CONSTANTS.SERVER_BROWSER_RESTARTER__URL) }</script>
    `);
};

http.createServer(function(req, res) {
    request(
        {
            uri: `${CONSTANTS.SERVER__URL}${req.url}`,
            proxy: ''
        },
        (error, response, body) => {
            if (error) {
                sendConsoleText(error, 'error');
                return false;
            }
            if (response && response.headers) {
                for (let key in response.headers) {
                    if (key === 'content-length' || key === 'connection') continue;
                    res.setHeader(key, response.headers[key]);
                }
            }
            if (response && response.statusCode) {
                res.statusCode = response.statusCode;
            }
            if (!!~body.indexOf('<html')) {
                body = body + buildHtmlScript();
                res.setHeader('content-length', body.length);
            }
            res.end(body);
        }
    );
}).listen(CONSTANTS.SERVER_LIVERELOAD_PROXY__PORT, () => {
    sendConsoleText(`Proxy server is running on ${CONSTANTS.SERVER_LIVERELOAD_PROXY__URL} ${new Date()}`);
});