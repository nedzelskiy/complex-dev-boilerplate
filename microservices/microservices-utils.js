'use strict';

/*
* Common code for all microservices
*/

const fse = require("fs-extra");
const chalkInstance = require('chalk');
const chalk = new chalkInstance.constructor({enabled:true});

let microservices = {};

const utils = {
    sendConsoleText: function (text, level) {
        const   color = this.color
                ,name = this.name
                ,port = this.port
                ,process = this.process
                ;
        let textColor = '',
            type = level || 'info';

        (type === 'info') && (textColor = 'gray');
        (type === 'warn') && (textColor = 'yellow');
        (type === 'error' || type === 'err') && (textColor = 'red');
        console[(type === 'error') ? 'error': 'log'](
            chalk[color](`${name}:${port}`) +
            chalk[color](`--PID[${process.pid}]`) +
            chalk[textColor](`[${ type }]:`),
            chalk[textColor]((type === 'error' || type === 'err') ? JSON.stringify(text, null, 4) : text)
        );
        if (process.env.LOG_FOLDER) {
            const d = (new Date()).toLocaleString("ru", {
                day: 'numeric',
                weekday: 'short',
                month: 'long',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric'
            });
            const message = `${ d } [${ type.toUpperCase() }]   ${ text }\r\n`;
            if (microservices[name]) {
                fse.appendFile(`${ process.env.LOG_FOLDER }/microservices/${name}.log`, message);
            } else {
                fse.outputFileSync(`${ process.env.LOG_FOLDER }/microservices/${name}.log`, message);
                microservices[name] = name;
            }
        }
    },
    getChalkInstance: function() {
        return chalkInstance;
    },
    httpServerHandler: function (req, res) {
        if  (!!~req.url.indexOf('socket.io')) {
            return false;
        }
        if ('/' !== req.url) {
            res.statusCode = 400;
            res.end('only url "/" allowed');
            return false;
        }
        const name = this.name,
            types = this.types,
            header = req.headers['socket-control-command'];

        if (!header || !types[header]) {
            res.statusCode = 400;
            res.end(`Hello form microservice: ${name}. Error: Control command Header not found or wrong value!

                Send Header 'socket-control-command' with 'get-commands' value for view list of possible values`);
            return false;
        }
        res.statusCode = 200;
        types[header] && types[header]()
            .then(result => {
                res.end(result ? JSON.stringify(result) : 'ok!');
            })
            .catch((err) => {
                utils.sendConsoleText.call(this, err, 'error');
                res.end(JSON.stringify(err));
            });
    }

};

module.exports = utils;