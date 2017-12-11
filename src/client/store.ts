'use strict';

/// <reference path="/node_modules/@types/webpack-env/index.d.ts" />
/// <reference path="/node_modules/@types/webpack-env/index.d.ts" />
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import { createStore, applyMiddleware, combineReducers, ReducersMapObject, Reducer } from 'redux';

// dynamic load reducers from components
let reducers: ReducersMapObject = {};
const reducersHandler = (v: string): void => {
    let reducer: Reducer<{}> = req(v)['default'];
    let reducerName : string = v.split('/')[1];
    reducers[reducerName] = reducer;
};

let req = require.context('./components/', true, /reducer\.tsx?$/);
req.keys().forEach(reducersHandler);
req = require.context('./containers/', true, /reducer\.tsx?$/);
req.keys().forEach(reducersHandler);

export default createStore(combineReducers(reducers), composeWithDevTools(applyMiddleware(thunk)));
