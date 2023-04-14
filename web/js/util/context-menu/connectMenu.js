/* eslint-disable */
import React, { Component } from 'react';

import ContextMenuTrigger from './ContextMenuTrigger';
import listener from './globalEventListener';

// collect ContextMenuTrigger's expected props to NOT pass them on as part of the context
const ignoredTriggerProps = [...Object.keys(ContextMenuTrigger.propTypes), 'children'];

// expect the id of the menu to be responsible for as outer parameter
export default function (menuId) {
    // expect menu component to connect as inner parameter
    // <Child/> is presumably a wrapper of <ContextMenu/>
    return function connect(Child) {
        // return wrapper for <Child/> that forwards the ContextMenuTrigger's additional props
        return class ConnectMenu extends Component {
            constructor(props) {
                super(props);
                this.state = { trigger: null };
            }

            componentDidMount() {
                this.listenId = listener.register(this.handleShow, this.handleHide);
            }

            componentWillUnmount() {
                if (this.listenId) {
                    listener.unregister(this.listenId);
                }
            }

            handleShow = (e) => {
                if (e.detail.id !== menuId) return;

                // the onShow event's detail.data object holds all ContextMenuTrigger props
                const { data } = e.detail;
                const filteredData = {};

                for (const key in data) {
                    // exclude props the ContextMenuTrigger is expecting itself
                    if (!ignoredTriggerProps.includes(key)) {
                        filteredData[key] = data[key];
                    }
                }
                this.setState({ trigger: filteredData });
            }

            handleHide = () => {
                this.setState({ trigger: null });
            }

            render() {
                return <Child {...this.props} id={menuId} trigger={this.state.trigger} />;
            }
        };
    };
}
