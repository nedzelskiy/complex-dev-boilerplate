'use strict';

import './styles.scss';
import * as React from 'react';
import { connect } from 'react-redux';
import { getCurrentDate } from './actions';
import Counter from 'Counter/src';
import { Dispatch } from 'redux';
import { bindActionCreators, ActionCreator } from 'redux';


export class Root extends React.Component<any, any> {
    render() {
        let { message,date } = this.props;
        return (
            <div className={ this.constructor.name }>
                <img src="assets/react.png" />
                <h4>{ message }</h4>
                <div>{ date.toString() }</div>
                <Counter props = {{}}/>
            </div>
        )
    }
}

const mapDispatchToProps = (dispatch: any) => ({
    getCurrentDate: getCurrentDate
});

const mapStateToProps = (state: any) => ({
    message: 'And this is a counter for React boilerplate presentation',
    date: state.Root,
});

export default connect(mapStateToProps, mapDispatchToProps)(Root);