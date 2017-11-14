'use strict';

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
            <div>
                <h4>{ message }</h4>
                <div>{ date.toString() }</div>
                <Counter {...this.props} />
            </div>
        )
    }
}

const mapDispatchToProps = (dispatch: any) => ({
    getCurrentDate: getCurrentDate
});

const mapStateToProps = (state: any) => ({
    message: 'And this is a counter for present React boilerplate!',
    date: state.Root,
});

export default connect(mapStateToProps, mapDispatchToProps)(Root);