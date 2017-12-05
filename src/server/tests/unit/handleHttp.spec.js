'use strict';

const path = require('path');
const mock = require('mock-require');
const assert = require('chai').assert;
const expect = require('chai').expect;

mock('fs', {
    readFileSync: (str) => {
        if (!!~str.indexOf('file.404')) {
            throw new Error();
        }
        return JSON.stringify(str);
    }
});
mock('mime', {
    getType: (str) => {
        return str;
    }
});
let params = {};
mock('ejs', {
    render: (str, param) => {
        params = param;
        return str;
    }
});

let serverJSCounter = false;
mock('md5-file', {
    sync: (str) => {
        if (!!~str.indexOf('server-js.min.js')) {
            if (serverJSCounter) {
                throw Error();
            }
            serverJSCounter = true;
        }
        return str;
    }
});

const FILENAME = path.basename(__filename).replace(path.extname(path.basename(__filename)), '');
const handleHttp = require(path.normalize(`${process.env.PWD}/${process.env.SERVER__BUILD_FOLDER}/handleHttp`))['default'];

const mockRes = {
    body: '',
    setHeader: (key, value) => {
        mockRes.setHeader[key] = value;
    },
    setStatus: 200,
    end: (str) => {
        if (str) {
            mockRes.body = str.replace(/[\s\t\r\n]+/, ' ');
        }
    }
};

let consoleLogSave = console.log;

describe(`${FILENAME}`, () => {
    beforeAll(() => {
        console.log = (str) => {
            if (!~str.indexOf('server-js.min.js')) {
                consoleLogSave(str);
            }
        };
    });

    afterAll(() => {
        console.log = consoleLogSave;
    });

    beforeEach(() => {
        mockRes.body = '';
        params = {};
    });

    it(`should give index.ejs on url "/"`, next => {
        handleHttp({
            url: '/'
        }, mockRes);
        expect(mockRes.setStatus).to.be.equal(200);
        assert.isTrue(!!~mockRes.body.indexOf('index.ejs'));
        next();
    });
    it(`should give file if request not on "/"`, next => {
        handleHttp({
            url: '/file.test'
        }, mockRes);
        assert.isFalse(!!~mockRes.body.indexOf('file.test'));
        next();
    });
    it(`should return 404 if file not found` , next => {
        handleHttp({
            url: '/file.404'
        }, mockRes);
        expect(mockRes.setStatus).to.be.equal(404);
        next();
    });
    it(`should allows added static files without hash if couldn't find it` , next => {
        handleHttp({
            url: '/'
        }, mockRes);
        assert.isTrue(typeof params.jsServerHash === 'undefined');
        next();
    });
});