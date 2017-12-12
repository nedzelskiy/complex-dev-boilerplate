'use strict';

import store from './store';
import * as React from 'react';
import { render } from 'react-dom';
import Root from 'containers/Root/src';
import { Provider } from 'react-redux';

render(
    <Provider store = {store}>
        <Root />
    </Provider>,
    document.querySelector('#root')
);