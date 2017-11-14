'use strict';

import './styles.scss';
import * as React from 'react';

interface IProps {
    readonly increment: () => void;
    readonly decrement: () => void;
    readonly incrementAsync: () => void;
    readonly decrementAsync: () => void;
}

export default class Counter extends React.PureComponent<IProps, any> {
    render() {
        let { increment, incrementAsync, decrement, decrementAsync } = (this as any).props as IProps;
        return (
            <div className = { this.constructor.name }>
                <button onClick={ increment } className="increment">+</button>
                <button onClick={ incrementAsync } className="incrementAsync">+ (∞)</button>
                <button onClick={ decrement } className="decrement">−</button>
                <button onClick={ decrementAsync} className="decrementAsync">− (∞)</button>
            </div>
        )
    }
}