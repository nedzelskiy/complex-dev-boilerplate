'use strict';

import { IAction } from './reducer'

interface IDispatch {
    (param: IAction): void;
}

export const getCurrentDate: Function = (): Function => (dispatch: IDispatch): void => {
    dispatch({type: "GET_CURRENT_DATE"});
};
