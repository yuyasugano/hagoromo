import React, { Component } from "react";
import Masonry from "react-masonry-css";
import HagoromoContract from "./contracts/HagoromoV1.json";
import getWeb3 from "./getWeb3";

import "./App.css";
import BigNumber from 'bignumber.js';
import jpycContract from './contracts/JPYC.json';

class App extends Component {

  state = {
    web3: null,
    accounts: null,
    contract: null,
    contractAddress: null,
    contract2: null,
    contract2Address: null,
    duration: '',
    url: '',
    funds: '',
    desc: '',
    tokenBalance: 0,
    allowance: 0,
    approvedAmount: 0,
    propNonce: 0,
    proposal: [],
    jpyc: 0,
    fundRights: 0,
    withFunds: 0 };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();

      const HagoromoNetwork = HagoromoContract.networks[networkId];
      // console.log(HagoromoNetwork.address);

      const jpycNetwork = jpycContract.networks[networkId];
      // console.log(jpycNetwork.address);

      const instance = new web3.eth.Contract(
        HagoromoContract.abi,
        HagoromoNetwork && HagoromoNetwork.address,
      );
      // console.log(instance.methods);

      const instance2 = await new web3.eth.Contract(
        jpycContract.abi,
        jpycNetwork && jpycNetwork.address,
      );
      // console.log(instance2.methods);

      // Set web3, accounts, jpyc and Hagoromo contract to the state firstly
      this.setState({ web3, accounts, jpyc: jpycContract, contract: instance, contract2: instance2, contractAddress: HagoromoNetwork.address, contract2Address: jpycNetwork.address }, this.getProposals);

    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  }

  componentWillUnmount = async () => {
  }

  createContract = async () => {
    const { accounts, contract } = this.state;
    const funds = await new BigNumber(this.state.funds).shiftedBy(18).toFixed();
    const duration = await  new BigNumber(this.state.duration);
    const end = await duration.multipliedBy(86400);

    const func = contract.methods.initializeProposal(
      this.state.web3.utils.asciiToHex(this.state.desc),
      this.state.web3.utils.asciiToHex(this.state.url),
      end.toString(),
      funds,
    );
    // const func = contract.methods.initializeProposal(this.state.desc, this.state.url, end.toString(), funds.shiftedBy(18).toString());
    await func.estimateGas({ from: accounts[0] })
    .then((gasAmount) => {
      const res = func.send({ from:accounts[0], gas: gasAmount });
    })
    .catch((error) => {
      alert(
        `Failed to create a new proposal. Check console for details.`
      );
      console.error(error);
    });

    const nonce = await contract.methods.getPropNonce().call();

    this.setState({ propNonce: nonce });
    this.getProposals();
  }

  reqFunds = async() => {
    const { contract, fundRights, accounts } = this.state;
    if (fundRights < 0) {
      alert("Enter a valid amount.");
    } else {
      const funds = new BigNumber(fundRights).shiftedBy(18).toFixed();
      const func = contract.methods.requestFundingRights(funds)
      await func.estimateGas({ from: accounts[0] })
      .then((gasAmount) => {
        const res = func.send({ from: accounts[0], gas: gasAmount});
      })
      .catch((error) => {
        alert(
          `Failed to request funds. Check console for details.`
        );
        console.error(error);
      });

      this.getProposals();
    }
  }

  withFunds = async() => {
    const { contract, withFunds, accounts } = this.state;
    if (withFunds < 0) {
      alert("Enter a valid amount.");
    } else {
      const funds= new BigNumber(withFunds).shiftedBy(18).toFixed();
      const func = contract.methods.withdrawFundingRights(funds);
      await func.estimateGas({ from: accounts[0] })
      .then((gasAmount) => {
        const res = func.send({from: accounts[0], gas: gasAmount});
      })
      .catch((error) => {
        alert(
          `Failed to withdraw funds. Check console for details.`
        );
        console.error(error);
      });

      this.getProposals();
    }
  }

  withTokens = async(index) => {
    const { web3, contract, accounts } = this.state;
    const func = contract.methods.withdrawTokens(index);
    await func.estimateGas({ from: accounts[0] })
    .then((gasAmount) => {
      const res = func.send({from: accounts[0], gas: gasAmount});
    })
    .catch((error) => {
      alert(
        `Failed to withdraw tokens. Check console for details.`
      );
      console.error(error);
    });

    this.getProposals();
  }

  resFunds = async(index) => {
    const { web3, contract, accounts } = this.state;
    const func = contract.methods.rescueTokens(index);
    await func.estimateGas({ from: accounts[0] })
    .then((gasAmount) => {
      const res = func.send({from: accounts[0], gas: gasAmount});
    })
    .catch((error) => {
      alert(
        `Failed to rescue tokens. Check console for details.`
      );
      console.error(error);
    });

    this.getProposals();
  }

  approveJPYC = async() => {
    const { contract, contractAddress, contract2, contract2Address, approvedAmount, accounts } = this.state;
    if (approvedAmount <= 0) { // zero means nothing
      alert("Enter more than 1 JPYC.");
    } else {
      const amount = new BigNumber(approvedAmount).shiftedBy(18).toFixed();
      const func = contract2.methods.approve(contractAddress, amount);
      await func.estimateGas({ from: accounts[0] })
      .then((gasAmount) => {
        const res = func.send({from: accounts[0], gas: gasAmount});
      })
      .catch((error) => {
        alert(
          `Failed to approve amount. Check console for details.`
        );
        console.error(error);
      });

      this.getProposals();
    }
  }

  getProposals = async() => {
    const { contract, contractAddress, contract2, contract2Address, propNonce, accounts } = this.state;

    // Get the current nonce number
    const nonce = await contract.methods.getPropNonce().call();
    // console.log(nonce);

    // Get the token balance for the caller from the contract
    const res = new BigNumber(await contract.methods.tokenBalance().call({ from: accounts[0] }));
    const balance = res.shiftedBy(-18).toString();
    // console.log(balance);

    // Get the allowance of the JPYC token for the caller
    const ret = new BigNumber(await contract2.methods.allowance(accounts[0], contractAddress).call({ from: accounts[0] }));
    const allowed = ret.shiftedBy(-18).toString();
    // console.log(allowed);

    const arr = [];
    for (let i=1; i<=nonce; ++i) {
      const res = await contract.methods.getProposal(i).call();
      arr.push(res);
    }
    // console.log(arr);

    this.setState({ proposal: arr, tokenBalance: balance, propNonce: nonce, allowance: allowed });
  }

  addFund = async(index) => {
    const { web3, contract, accounts } = this.state;
    if (this.state.jpyc < 0) {
      alert("Enter more than 1 JPYC.");
    } else {
      const jpyc = new BigNumber(this.state.jpyc).shiftedBy(18).toFixed();
      const func = contract.methods.fundRaising(index, jpyc);
      await func.estimateGas({ from: accounts[0] })
      .then((gasAmount) => {
        const res = func.send({ from:accounts[0] });
      })
      .catch((error) => {
        alert(
          `Failed to add funds. Check console for details.`
        );
        console.error(error);
      });

      this.getProposals();
    }
  }

  render() {
    const { web3 } = this.state;
    const h3margin = {
      'margin-top': '30px'
    }
    const limargin = {
      'margin-top': '20px'
    }
    const footermargin = {
      'margin-top': '30px',
      'margin-bottom': '50px',
      'display': 'inline-block'
    }
    const breakpointColumnsObj = {
      'default': 3,
      '1350': 3,
      '1048': 2,
      '576': 1,
    }

    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (

      <div className="App">
        <h1>はごろもファンディング -Rinkeby-</h1>
        <h2>Welcome to Hagoromo Funding!</h2>
        <p>
          1 JPYC = 1円で使用できる JPYC を使用したクラウドファンディングサイトです。<br />
          分散型で誰でもプロジェクトの作成や、プロジェクトへのファンディングが行えます。
        </p>
        <p>
          使い方はこちら。
        </p>
        <div>
          <p>
            Your account is: {this.state.accounts[0]}.
          </p>
        </div>
        <div>
          ファンディング可能額: {this.state.tokenBalance} JPYC
        </div>
        <div>
          <p>
            Approved JPYC: {this.state.allowance} JPYC
          </p>
          <input type="number" placeholder="JPYC" onChange={(e) => this.setState({ approvedAmount: e.target.value })} />
          <button type="button" className="prbutton" onClick={() => {this.approveJPYC()}}>Approve JPYC</button>
        </div>

        <div>
          <p>
            <input type="number" placeholder="JPYC" onChange={(e) => this.setState({ fundRights: e.target.value })} />
            <button type="button" className="prbutton" onClick={() => {this.reqFunds()}}>指定金額をはごろもに移す</button>
          </p>
          <p>
            <input type="number" placeholder="JPYC" onChange={(e) => this.setState({ withFunds: e.target.value })} />
            <button type="button" className="prbutton" onClick={() => {this.withFunds()}}>指定金額をはごろもから戻す</button>
          </p>
        </div>

        <div>
          <h3 style={h3margin}>新しいプロジェクトを作成する</h3>
          <table className="tg">
            <thead>
              <tr>
                <th className="tg-0lax"><input placeholder="Description" onChange={(e) => this.setState({ desc: e.target.value })} /></th>
                <th className="tg-0lax"><input placeholder="URL" onChange={(e) => this.setState({ url: e.target.value })} /></th>
                <th className="tg-0lax" rowSpan="2">
                  {
                    this.state.desc==='' || this.state.url==='', this.state.funds==='' || this.state.duration===''?
                    <button disabled={true} type="button" className="prbutton">入力してください</button>
                      :
                    <button type="button" className="prbutton" onClick={() => {this.createContract()}}>新規作成</button>
                  }
                </th>
              </tr>
              <tr>
                <td className="tg-0lax"><input type="number" min={0} placeholder="Duration (in days)" onChange={(e) => this.setState({ duration: e.target.value })} /></td>
                <td className="tg-0lax"><input type="number" min={0} placeholder="Target Funds (in JPYC)" onChange={(e) => this.setState({ funds: e.target.value })} /></td>
              </tr>
            </thead>
          </table>

          <h3 style={h3margin}>プロジェクトを支援する</h3>
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
          >
            {
              this.state.proposal.map((prop, index) => {
                return (
                  <div className='event-card' style={limargin}>
                    <div>
                      プロジェクト概要: { web3.utils.hexToAscii(prop['0']) }<br />
                      プロジェクトURL: { web3.utils.hexToAscii(prop['1']) }<br />
                      支援締切日: { new Date(prop['2']*1000).toString() }<br />
                      支援額: { parseFloat(prop['3'], 10)/Math.pow(10, 18) } JPYC<br />
                      目標額: { parseFloat(prop['4'], 10)/Math.pow(10, 18) } JPYC<br />
                      ステータス: { prop['5'] ? "達成" : "未達成" }<br />
                      資金ステータス: { prop['6'] ? "Withdrawn" : "In place" }<br />
                      {prop['5'] === false && (new Date() < new Date(prop['2']*1000)) &&
                        <div>
                          <input type="number" min={0} placeholder="JPYC" onChange={(e) => this.setState({ jpyc: e.target.value })} />
                          <button type="button" className="prbutton" onClick={() => {this.addFund(index+1)}}>支援する</button>
                        </div>
                      }
                    </div>
                    <div>
                      {prop['5'] === true && prop['6'] === false && (new Date(prop['2']*1000) < new Date()) &&  
                          <button type="button" className="prbutton" onClick={() => {this.withTokens(index+1)}}>プロジェクトを終了する</button>
                      }
                      {prop['5'] === false && prop['6'] === false && (new Date(prop['2']*1000) < new Date()) && 
                          <button type="button" className="prbutton" onClick={() => {this.resFunds(index+1)}}>支援を引き揚げる</button>
                      }
                    </div>
                  </div>
                )
              })
            }
          </Masonry>
        </div>
        <footer className='footer'>
          <small style={footermargin}>&copy; 2021 HagoromoFunding</small>
        </footer>
      </div>
    );
  }
};

export default App;
