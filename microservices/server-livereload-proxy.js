'use strict';

/*
 * Added developer code into response body,
 * such as socket.io code for live reload
 */


const path = require('path');
const FILENAME = path.basename(__filename).replace(path.extname(path.basename(__filename)), '');

const CONSTANTS = {
    SERVER__URL:                    process.env.SERVER__URL,
    SERVER_BROWSER_RESTARTER__URL:  process.env.SERVER_BROWSER_RESTARTER__URL,
    SERVER_LIVERELOAD_PROXY__URL:   process.env.SERVER_LIVERELOAD_PROXY__URL,
    SERVER_LIVERELOAD_PROXY__PORT:  process.env.SERVER_LIVERELOAD_PROXY__PORT,
    SERVER_LIVERELOAD_PROXY__COLOR: process.env.SERVER_LIVERELOAD_PROXY__COLOR || 'green'
};

for (let key in CONSTANTS) {
    if (!CONSTANTS[key]) {
        console.log(`${FILENAME}: You must set ${key} env!`);
        process.exit(1);
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
    let ext = req.url.split('.').pop().toLowerCase();
    if (
            ext !== '/'
        &&  ext !== 'js'
        &&  ext !== 'html'
        &&  ext !== 'css'
    ) {
        request.get({
            uri: `${CONSTANTS.SERVER__URL}${req.url}`,
            proxy: ''
        }).pipe(res);
        return;
    }
    request(
        {
            uri: `${CONSTANTS.SERVER__URL}${req.url}`,
            proxy: ''
        },
        (error, response, body) => {
            if (error) {
                sendConsoleText(error, 'warn');
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
            if (/<html/i.test(body) || /<!DOCTYPE/i.test(body)) {
                const preactScriptHtml = `<script> ${ fs.readFileSync('./node_modules/preact/dist/preact.js', 'utf-8') } </script>`;
                const preactDevToolsScriptHtml = `<script> ${ fs.readFileSync('./node_modules/preact/devtools.js', 'utf-8') } </script>`;
                body = body + buildHtmlScript() + preactScriptHtml + preactDevToolsScriptHtml;
                res.setHeader('content-length', body.length);
            } else if (response.headers['content-length']){
                res.setHeader('content-length', response.headers['content-length']);
            }
            res.end(body);
        }
    );

}).listen(CONSTANTS.SERVER_LIVERELOAD_PROXY__PORT, () => {
    sendConsoleText(`Proxy server is running on ${CONSTANTS.SERVER_LIVERELOAD_PROXY__URL} ${new Date()}`);
});