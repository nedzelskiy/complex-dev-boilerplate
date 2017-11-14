'use strict';

import thunk from 'redux-thunk';
import * as rExt from 'redux-devtools-extension';
import { createStore, applyMiddleware, combineReducers, ReducersMapObject, Reducer } from 'redux';

// dynamic load reducers from components
let reducers: ReducersMapObject = {};
const reducersHandler = (v: any) => {
    let reducer: Reducer<{}> = (req(v) as any)['default'];
    let reducerName : string = v.split('/')[1];
    reducers[reducerName] = reducer;
};

let req = (require as any).context('./components/', true, /reducer\.tsx?$/);
req.keys().forEach(reducersHandler);
req = (require as any).context('./containers/', true, /reducer\.tsx?$/);
req.keys().forEach(reducersHandler);

export default createStore(combineReducers(reducers), rExt.composeWithDevTools(applyMiddleware(thunk)));
