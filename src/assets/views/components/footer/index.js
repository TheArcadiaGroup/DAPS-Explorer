import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Style from './style.css'
import Actions from 'Actions'
import ListBox from 'Components/listbox'

class Footer extends Component {
    constructor(props) {
        super(props);
        this._isMounted = false;
        this.state = {
            masternode_reward_ratio: 0,
            masternode_count: 0
        }
        
        this.Links = {
            headers: ["Company", "Learn", "Contact Us"],
            '0': [
                <a key="About" href='https://officialdapscoin.com/roadmap/' target="_blank">About</a>,
                <a key="Team" href='https://officialdapscoin.com/team/' target="_blank">Team</a>,
                // <a href='google.com'>Careers</a>,
            ],
            "1": [
                <a key="Getting Started" href='https://officialdapscoin.com/roadmap/' target="_blank">Getting Started</a>,
                <a key="DAPS Blog" href='https://officialdapscoin.com/daps-project-blog/' target="_blank">DAPS Blog</a>,
                <a key="What is DAPS" href='https://officialdapscoin.com/info/' target="_blank">What is DAPS?</a>,
            ],
            "2": [
                // <a href='google.com'>Press</a>,
                <a key="Support" href='https://officialdapscoin.com/contact/' target="_blank">Support</a>,
                // <a href='google.com'>Status</a>,
            ],
            // "3": [<a href='google.com'>Local</a>],
        }
        this.SocialLinks = {
            "headers": [],
            "0": [
                <a key="discord" href='https://discord.gg/w898czA' id='discordlink' className='SocialLink' target="_blank" ><div id='discord' /></a>,
                <a key="facebook" href='https://www.facebook.com/dapscoinofficial/' id='facebooklink' className='SocialLink' target="_blank" ><div id='facebook' /></a>,
                <a key="reddit" href='https://www.reddit.com/r/DAPSCoin/' id='redditlink' className='SocialLink' target="_blank"><div id='reddit' /></a>,
                <a key="telegram" href='https://t.me/dapscoin' id='telegramlink' className='SocialLink' target="_blank" ><div id='telegram' /></a>,
                <a key="linkedin" href='https://www.linkedin.com/company/daps-coin/' id='linkedinlink' className='SocialLink' target="_blank"><div id='linkedin' /></a>,
                <a key="twitter" href='https://twitter.com/DAPScoin' id='twitterlink' className='SocialLink' target="_blank" ><div id='twitter' /></a>,
            ]
        }
    }
     
    componentDidMount() {
        this._isMounted = true;
        this._isMounted && 
            Actions.subscribeToRewardStats((err, stats) => this.setState({ 
                masternode_reward_ratio: stats.masternoderewardratio != null && stats.masternoderewardratio != "" ? stats.masternoderewardratio : 0,
                masternode_count: stats.masternodeconnections != null && stats.masternodeconnections != "" ? stats.masternodeconnections : 0
            }));
    }
    componentWillUnmount() {
        this._isMounted = false;
    }

    render() {
        if (this.state.masternode_reward_ratio == 0)
            return (<div className="Footer">
                        <div id="FooterInfo">
                        <ListBox id="FooterLinks" data={this.Links}/>
                        <div id="SocialLinksContainer">{this.SocialLinks[0]}</div>
                        <div id="CR">
                            <h2>Version: Beta</h2>
                            <br />
                            <h3>&copy; 2019 DAPScoin All Rights Reserved</h3>
                        </div>
                    </div>
                   </div>
            );
        
        let masterPercent = this.state.masternode_reward_ratio;
        let stakingPercent = 100 - this.state.masternode_reward_ratio;

        let stakingStyle = {
            width: "calc(190px + " + String(stakingPercent) + "%" + " - 380px / 100 * " + String(stakingPercent) + ")" 
        };
        let masterStyle = {
            width: "calc(190px + " + String(masterPercent) + "%" + " - 380px / 100 * " + String(masterPercent) + ")" 
        };

        return (<div className="Footer">
            <div id="FooterBar" className={`${Style.FooterBar}`}>
                <div id="RewardState" className={`${Style.RewardState}`}>
                    <div id="StakingState" className={`${Style.StakingState}`} style={stakingStyle}>
                        <span id="StakingTitle" className={`${Style.StakingTitle}`}>
                            STAKING NODES
                        </span>
                        <span id="StakingCount" className={`${Style.StakingCount}`}>
                            ??
                        </span>
                        <span id="StakingPercent" className={`${Style.StakingPercent}`}>
                            {String(stakingPercent.toFixed(0)) + '%'}
                        </span>
                    </div>
                    <div id="MasterState" className={`${Style.MasterState}`} style={masterStyle}>
                        <span id="MasterPercent" className={`${Style.MasterPercent}`}>
                            {masterPercent + '%'}
                        </span>
                        <span id="MasterCount" className={`${Style.MasterCount}`}>
                            {this.state.masternode_count}
                        </span>
                        <span id="MasterTitle" className={`${Style.MasterTitle}`}>
                            MASTER NODES
                        </span>
                    </div>
                </div>
            </div>
            <div id="FooterInfo">
                <ListBox id="FooterLinks" data={this.Links}/>
                <div id="SocialLinksContainer">{this.SocialLinks[0]}</div>
                <div id="CR">
                    <h2>Version: Beta</h2>
                    <br />
                    <h3>&copy; 2019 DAPScoin All Rights Reserved</h3>
                </div>
            </div>
        </div>
        )
    }
}

export default Footer;
