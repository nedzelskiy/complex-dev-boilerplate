'use strict';

export interface IAction {
    readonly type: 'INCREMENT' | 'DECREMENT';
}

const initialState = 0;

export default (state = initialState, action: any) => {
    if (action.type === 'INCREMENT') {
        return state + 1;
    } else if (action.type === 'DECREMENT') {
        return state - 1;
    }
    return state;
};