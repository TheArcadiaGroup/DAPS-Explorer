import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Style from './style.css'

import DataCircle from 'Components/datacircle'
import Actions from 'Actions';

class BlockStatusBar extends Component {
    constructor(props) {
        localStorage.clear()
        super(props);
        this._isMounted = false;

        this.state = {
            id: props.id || '',
            blockcount: [null, ""],
            supply: [null, ""],
            difficulty: [null, ""],
            hashrate: [null, ""],
            networkstatus: [null, ""],
        }
        
    }
    componentDidMount() {
        this._isMounted = true;
        this._isMounted && 
            Actions.subscribeToBlockStats((err, stats) => this.setState({ 
                blockcount: stats.blockcount != null && stats.blockcount != "" ? [stats.blockcount, ""] : [null, "Red"] ,
                supply: stats.supply != null && stats.supply != "" ? [Math.ceil(stats.supply), "Green"] : [null, "Red"],
                hashrate: stats.hashrate != null && stats.hashrate != "" ? [stats.hashrate, "Green"] : [null, "Red"],
                difficulty: stats.difficulty != null && stats.difficulty != "" ? [Number(stats.difficulty).toFixed(), "Green"] : [null, "Red"],
                networkstatus: stats.connections != null && stats.connections > 0 ? ["GOOD", "Green"] : ["CHAIN ERROR", "Red"]
            }));
    }
    componentWillUnmount() {
        this._isMounted = false;
    }
    render() {
        return (<div id={this.state.id} className={"StatusBar " + Style.Column}>
            {!(this.state.blockcount[0] == null && this.state.blockcount[1] == "") &&
                <DataCircle data={{ header: "BLOCK HEIGHT", item: this.state.blockcount }} class={"StatusBarHeader " + Style.Header} header={true} />}
            {!(this.state.supply[0] == null && this.state.supply[1] == "") &&
                <DataCircle data={{ header: "SUPPLY", item: this.state.supply }} class={"StatusBarItem " + Style.Item} />}
            {!(this.state.hashrate[0] == null && this.state.hashrate[1] == "") &&
                <DataCircle data={{ header: "HASHRATE", item: this.state.hashrate }} class={"StatusBarItem " + Style.Item} />}
            {!(this.state.difficulty[0] == null && this.state.difficulty[1] == "") &&
                <DataCircle data={{ header: "DIFFICULTY", item: this.state.difficulty }} class={"StatusBarItem " + Style.Item} />}
            {!(this.state.networkstatus[0] == null && this.state.networkstatus[1] == "") &&
                <DataCircle data={{ header: "NETWORK STATUS", item: this.state.networkstatus }} class={"StatusBarItem " + Style.Item} />}
        </div>);
    }
}

export default BlockStatusBar;