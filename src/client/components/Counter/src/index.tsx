'use strict';

import './styles.scss';
import * as React from 'react';
import { IState } from './reducer'


export interface IProps {
    readonly increment: () => void;
    readonly decrement: () => void;
    readonly incrementAsync: () => void;
    readonly decrementAsync: () => void;
    readonly state: IState;
}

export default class Counter extends React.PureComponent<IProps, {}> {
    render() {
        let { increment, incrementAsync, decrement, decrementAsync, state } = this.props;
        return (
            <div className = { this.constructor.name }>
                <button onClick={ increment }>{ '+' }</button>
                <button onClick={ incrementAsync }>{ '+ (∞)' }</button>
                <button onClick={ decrement }>{ '–' }</button>
                <button onClick={ decrementAsync }>{ '- (∞)' }</button>
                <div className="value">{ state.value }</div>
                <div>{ `Async tasks in queue: ${ state.asyncTasks }` }</div>
            </div>
        )
    }
}