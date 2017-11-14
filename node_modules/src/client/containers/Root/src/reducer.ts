'use strict';

export interface IAction {
    readonly type: 'GET_CURRENT_DATE';
}

export default (state = [], action: any) => {
    if (action.type === 'GET_CURRENT_DATE') {
        return [new Date()];
    }
    return state;
};