import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Style from './style.css'

import DataCircle from 'Components/datacircle'
import Actions from 'Actions';

class NetworkStatusBar extends Component {
    constructor(props) {
        localStorage.clear()
        super(props);
        this.state = {
            data: {},
            header: {},
            getData: props.getData || {},
            getHeader: (props.getData) ? props.getData.header || {} : {},
            id: props.id || '',
            lastpoablock: [null, ""],
            nodes: [null, ""],
            masternodes: [null, ""],
        }
        this.lift = props.lift || ((state) => { })
        Actions.subscribeToNetworkStats((err, stats) => this.setState({ 
            lastpoablock: (stats.lastpoablock != null && stats.lastpoablock != "") ? [stats.lastpoablock, ""] : [null, "Red"] ,
            nodes: (stats.nodes != null && stats.nodes != "") ?  [stats.nodes, "Green"] : [null, "Red"],
            masternodes: (stats.masternodes != null && stats.masternodes != "") ? [stats.masternodes, "Green"] : [null, "Red"],
        }));
    }

    render() {
        return (<div id={this.state.id} className={"StatusBar " + Style.Column}>
            {!(this.state.lastpoablock[0] == null && this.state.lastpoablock[1] == "") &&
                <DataCircle data={{ header: "LAST POA BLOCK", item: this.state.lastpoablock }} class={"StatusBarHeader " + Style.Header} header={true} />}
            {!(this.state.nodes[0] == null && this.state.nodes[1] == "") &&
                <DataCircle data={{ header: "NODES", item: this.state.nodes }} class={"StatusBarItem " + Style.Item} />}
            {!(this.state.masternodes[0] == null && this.state.masternodes[1] == "") &&
                <DataCircle data={{ header: "MASTER NODES", item: this.state.masternodes }} class={"StatusBarItem " + Style.Item} />}
        </div>);
    }
}

export default NetworkStatusBar;