'use strict';

import { IAction } from './reducer'

export interface IDispatch {
    (param: IAction): void;
}

export const increment: Function = (): Function => (dispatch: IDispatch): void => {
    dispatch({ type: 'INCREMENT'});
};

export const decrement: Function = (): Function => (dispatch: IDispatch): void => {
    dispatch({ type: 'DECREMENT'});
};

export const incrementAsync: Function = (): Function => (dispatch: IDispatch): void => {
    dispatch({ type: 'INCREMENT_ASYNC'});
    setTimeout(() => {
        dispatch({ type: 'INCREMENT'});
        dispatch({ type: 'DECREMENT_ASYNC'});
    }, Math.floor(Math.random() * (5000 - 200 + 1)) + 200);
};

export const decrementAsync: Function = (): Function => (dispatch: IDispatch): void => {
    dispatch({ type: 'INCREMENT_ASYNC'});
    setTimeout(() => {
        dispatch({ type: 'DECREMENT'});
        dispatch({ type: 'DECREMENT_ASYNC'});
    },Math.floor(Math.random() * (5000 - 200 + 1)) + 200);
};