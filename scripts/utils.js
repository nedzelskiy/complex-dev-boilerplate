'use strict';

module.exports = {
    sendConsoleText: (text, type) => {
        if (type === 'error' || type === 'err') {
            console.log(`${FILENAME}: Error sendConsoleText ! ${ JSON.stringify(text, null, 4)}`);
        } else {
            console.log(text);
        }
    }
};