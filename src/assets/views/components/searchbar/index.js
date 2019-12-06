import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Style from './style.css'
import { Link, Router } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server'

import Actions from 'Actions'

class SearchBar extends Component {
    constructor(props) {
        super(props)
        this.state = {
            string: '',
            lib: props.lib || new Map(),
            match: new Map(),
            // links: new Map(),
            visible: false,
        }
    }

    makeLink(entry) {
        let isblock = (entry.minetype || entry.height)
        let type = isblock ? 'block' : 'tx'
        return <Link to={`/explorer/${type}/${isblock ? entry.hash : entry.txid}`}>
            {`${type.toUpperCase()}        ${
                isblock ?
                    `${entry.height} ${entry.minetype}`
                    : `${(entry.vout && entry.vout.length) ?
                        entry.vout[0].value : false || 'amount hidden'
                    } DAPS`
                }`}
            <br />
            {`${isblock ?
                entry.hash
                : entry.txid}`}
            <br />
        </Link>
    }

    async getData(string) {
        if (string.length) {
            let res = await Actions.getSearchPromises(string, this.props.url)
            this.state.match.clear()
            if (res) {
                if (res.tx && res.tx.length > 0 && res.tx[0].status == 200) 
                    res.tx[0].data.map(async (item) => {
                        
                        this.state.match.set(item.txid, item)
                        
                        let formattedtx = await Actions.getTxDetail(item)
                        this.state.lib.set(item.txid, formattedtx)
                    });
                if (res.block && res.block.length > 0 && res.block[0].status == 200) 
                    res.block[0].data.forEach(async (item) => {
                        this.state.match.set(item.hash, item)
                        let formattedblock = await Actions.getBlockDetail(block)
                        this.state.lib.set(item.hash, formattedblock)
                    });
                
            } 
            this.setState({})
        }
    }

    // filterResults() {
    //     let newmatch = new Map()
    //     console.log("Match =======", this.state.match);
    //     if (Array.from(this.state.match.keys()).length) {
    //         this.state.match.forEach((entry, id) => {
    //             if (
    //                 ((id.indexOf(this.state.string) != -1) ? true : false)
    //                 || (entry.height ? (`${entry.height}`.indexOf(this.state.string) != -1) : false)
    //             )
    //                 newmatch.set(id, entry)
    //         })
    //         this.state.match.clear()
    //         newmatch.forEach((v, k) =>
    //             this.state.match.set(k, v))
    //         this.state.match.forEach((entry, id) => {
    //             if (!this.state.links.has(id)) {
    //                 this.state.links.set(id, this.makeLink(entry))
    //             }
    //         })
    //         this.setState({})
    //     }
    // }

    handleChange = (e) => {
        this.setState({ string: e.target.value },
            () => this.getData(this.state.string))
    }

    handleFocus = (e) => {
        const type = e.type
        setTimeout(() => {
            this.setState({ visible: (type != 'blur') })
        }, 250)
    }

    render() {
        let keys = Array.from(this.state.match.keys())
        console.log("keys:", keys, keys.length);
        return (
            <div id="SearchBox" className={"SearchBox " + Style.SearchBox}>
                <input type="text" id="searchBar" className={"SearchBar " + Style.SearchBar}
                    onChange={this.handleChange}
                    onFocus={this.handleFocus}
                    onBlur={this.handleFocus}
                />
                <div id="SearchIcon" />
                {(this.state.string.length != 0) ?
                    <div id="SearchResult" style={{ visibility: this.state.visible ? 'visible' : 'hidden' }}>
                        {(keys.length) ? Array.from(this.state.match.keys()).map(key =>
                            <div key={key}>{this.makeLink(this.state.match.get(key))}<br /></div>) : 
                            "No Results Found (Could your block or transaction ID still be processing on the blockchain? Wait a minute or two, then try again.)"}
                    </div> : ""
                 }
                 
            </div>
        )
    }
}

//SearchBar.proptypes = {  }

export default SearchBar;