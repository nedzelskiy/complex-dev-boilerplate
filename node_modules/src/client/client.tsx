'use strict';

import * as React from 'react';
import store from './store';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import Root from 'Root/src';

ReactDOM.render(
    <Provider store = {store}>
        <Root />
    </Provider>,
    document.querySelector('#root')
);