'use strict';

import './styles.scss';
import * as React from 'react';
import { connect} from 'react-redux';
import Counter, { IProps as ICounterProps } from 'components/Counter/src';
import { increment, decrement, incrementAsync, decrementAsync } from 'components/Counter/src/actions';

type IProps = ICounterProps & {
    readonly message: string;
}

export class Root extends React.PureComponent<IProps, {}> {
    render() {
        let { message } = this.props;
        let counterProps: any = {};
        let componentsPropsNames: string[] = [
            'counter'
        ];
        for (let prop in this.props) {
            componentsPropsNames.forEach(componentPropsName => {
                let replaceName: string = `${ componentPropsName }_`;
                if (new RegExp(`^${replaceName}`).test(prop)) {
                    counterProps[prop.replace(`${ replaceName }`, '')] = (this.props as any)[prop];
                }
            });
        }
        return (
            <div className={ this.constructor.name }>
                <img src="assets/react.png" />
                <h4>{ message }</h4>
                <Counter { ...counterProps as ICounterProps } />
            </div>
        )
    }
}

const mapDispatchToProps = {
    counter_increment: increment,
    counter_decrement: decrement,
    counter_incrementAsync: incrementAsync,
    counter_decrementAsync: decrementAsync
};

const mapStateToProps = (state: any) => ({
    message: 'And this is a counter for React boilerplate presentation!',
    counter_state: state.Counter
});

export default connect<any,any,any>(mapStateToProps, mapDispatchToProps)(Root);