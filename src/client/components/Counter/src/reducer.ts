'use strict';

export interface IAction {
    readonly type: 'INCREMENT' | 'DECREMENT' | 'INCREMENT_ASYNC' | 'DECREMENT_ASYNC';
}

export interface IState {
    value: number,
    asyncTasks: number
}

const initialState = {
    value: 0,
    asyncTasks: 0
};

export default (state = initialState, action: IAction): any => {
    if (action.type === 'INCREMENT') {
        return {
            ...state,
            value: state.value + 1
        };
    } else if (action.type === 'DECREMENT') {
        return {
            ...state,
            value: state.value - 1
        };
    } else if (action.type === 'INCREMENT_ASYNC') {
        return {
            ...state,
            asyncTasks: state.asyncTasks + 1
        };
    } else if (action.type === 'DECREMENT_ASYNC') {
        return {
            ...state,
            asyncTasks: state.asyncTasks - 1
        };
    }
    return state;
};