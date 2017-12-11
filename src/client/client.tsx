'use strict';

import Root from 'Root/src';
import store from './store';
import * as React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

render(
    <Provider store = {store}>
        <Root />
    </Provider>,
    document.querySelector('#root')
);