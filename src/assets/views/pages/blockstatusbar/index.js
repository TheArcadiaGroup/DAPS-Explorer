import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Style from './style.css'

import DataCircle from 'Components/datacircle'
import Actions from 'Actions';

class BlockStatusBar extends Component {
    constructor(props) {
        localStorage.clear()
        super(props);
        this.state = {
            data: {},
            header: {},
            getData: props.getData || {},
            getHeader: (props.getData) ? props.getData.header || {} : {},
            id: props.id || '',
            blockcount: [null, ""],
            supply: [null, ""],
            difficulty: [null, ""],
            hashrate: [null, ""],
            connections: [null, ""],
        }
        this.lift = props.lift || ((state) => { })
        Actions.subscribeToBlockStats((err, stats) => this.setState({ 
            blockcount: stats.blockcount != null && stats.blockcount != "" ? [stats.blockcount, ""] : [null, "Red"] ,
            supply: stats.supply != null && stats.supply != "" ? [Math.ceil(stats.supply), "Green"] : [null, "Red"],
            hashrate: stats.hashrate != null && stats.hashrate != "" ? [stats.hashrate, "Green"] : [null, "Red"],
            difficulty: stats.difficulty != null && stats.difficulty != "" ? [Number(stats.difficulty).toFixed(), "Green"] : [null, "Red"],
            networkstatus: stats.connections != null && stats.connections > 0 ? ["GOOD", "Green"] : ["CHAIN ERROR", "Red"]
          }));
    }

    render() {
        return (<div id={this.state.id} className={"StatusBar " + Style.Column}>
            
            <DataCircle data={{ header: "BLOCK HEIGHT", item: this.state.blockcount }} class={"StatusBarHeader " + Style.Header} header={true} />
            <DataCircle data={{ header: "SUPPLY", item: this.state.supply }} class={"StatusBarItem " + Style.Item} />
            <DataCircle data={{ header: "HASHRATE", item: this.state.hashrate }} class={"StatusBarItem " + Style.Item} />
            <DataCircle data={{ header: "DIFFICULTY", item: this.state.difficulty }} class={"StatusBarItem " + Style.Item} />
            <DataCircle data={{ header: "NETWORK STATUS", item: this.state.networkstatus }} class={"StatusBarItem " + Style.Item} />
        </div>);
    }
}

export default BlockStatusBar;