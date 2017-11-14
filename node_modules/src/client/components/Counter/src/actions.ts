'use strict';

import { IAction } from './reducer'

export interface IDispatch {
    (param: IAction): void;
}

export const increment = function (): void {
    let dispatch: IDispatch = this.dispatch;
    dispatch({ type: 'INCREMENT'});
};

export const decrement = function (): void {
    let dispatch: IDispatch = this.dispatch;
    dispatch({ type: 'DECREMENT'});
};

