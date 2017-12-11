'use strict';

import * as fs from 'fs';
import * as ejs from 'ejs';
import * as mime from 'mime';
import * as path from 'path';
import * as md5File from 'md5-file';
import { IncomingMessage, ServerResponse } from 'http';
import makeResponseText from './modules/makeResponseText';

const handleHttp = (req: IncomingMessage, res: ServerResponse): void => {
    res.statusCode = 200;
    if ('/' !== req.url && typeof req.url !=='undefined') {
        try {

            let url: string = req.url.toString().split('?')[0],
                file: Buffer = fs.readFileSync(`${ path.normalize (__dirname + url) }`),
                mimeType: string | null = mime.getType(`${ path.normalize (__dirname + url) }`);

            if (mimeType) {
                res.setHeader('Content-Type', mimeType);
            }
            res.end(file);
        } catch (err) {
            res.statusCode = 404;
            res.end('Not found!');
        }
        return;
    }
    res.setHeader('Content-Type', 'text/html');
    let hash: string = 'undefined',
        fileName: string = 'undefined',
        jsServerHash: string = 'undefined',
        jsClientHash: string = 'undefined',
        cssClientHash: string = 'undefined',
        cssServerHash: string = 'undefined';

    try {
        fileName = 'client-bundle.min.css';
        hash = md5File.sync(path.normalize(__dirname + `/client/${fileName}`));
        cssClientHash = hash;

        fileName = 'client-bundle.min.js';
        hash = md5File.sync(path.normalize(__dirname + `/client/${fileName}`));
        jsClientHash = hash;

        fileName = 'server-styles.min.css';
        hash = md5File.sync(path.normalize(__dirname + `/assets/${fileName}`));
        cssServerHash = hash;

        fileName = 'server-js.min.js';
        hash = md5File.sync(path.normalize(__dirname + `/assets/${fileName}`));
        jsServerHash = hash;
    } catch(err) {
        console.log(`SERVER ERROR: Can\'t find ${ fileName } for md5 hash!`);
    }
    let html: string = ejs.render(fs.readFileSync(path.normalize(__dirname + '/index.ejs'), 'utf-8').toString(), {
        serverRenderText: makeResponseText(),
        title: 'Welcome to boilerplate',
        cssClientHash: cssClientHash,
        jsClientHash: jsClientHash,
        cssServerHash: cssServerHash,
        jsServerHash: jsServerHash
    });
    res.end(html);
};

export default handleHttp;