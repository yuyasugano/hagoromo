import React, { Component } from "react";
import HagoromoContract from "./contracts/HagoromoV1.json";
import getWeb3 from "./getWeb3";

import "./App.css";
import BigNumber from 'bignumber.js';
import jpyc from './contracts/JPYC.json';

class App extends Component {
  state = {
    tokenBalance: 0,
    web3: null,
    accounts: null,
    contract: null,
    contract2: null,
    duration: '',
    url: '',
    funds: '',
    desc: '',
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

      const deployedNetwork = HagoromoContract.networks[networkId];
      // console.log(deployedNetwork.address)

      const instance = new web3.eth.Contract(
        HagoromoContract.abi,
        deployedNetwork && deployedNetwork.address,
      );
      console.log(instance.methods);

      const instance2 = await new web3.eth.Contract(
        jpyc.abi,
        '0xbD9c419003A36F187DAf1273FCe184e1341362C0'
      )
      console.log(instance2.methods);

      // Set web3, accounts, jpyc and Hagoromo contract to the state firstly
      this.setState({ web3, accounts, jpyc, contract: instance, contract2: instance2 }, this.runInitialization);

    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  runInitialization = async () => {
    const { web3, accounts, contract, contract2 } = this.state;
    // let num = 0;
    // const amount = new BigNumber(0.2);

    // Get the value from the contract to prove it worked.
    const res = new BigNumber(await contract.methods.tokenBalance().call({ from:accounts[0] }));
    const balance = res.shiftedBy(-18).toString();
    // console.log(balance);

    //const res = await contract2.methods.approve('0xf4119DdA50E6201093c057Af274874b7400060f3',amount.shiftedBy(18).toString()).send({from:accounts[0]})
    // const res = await contract.methods.init(accounts[0]).call()

    const nonce = await contract.methods.getPropNonce().call();
    // await web3.eth.getBalance(accounts[0]).then((bal)=>{
    //   num = bal/Math.pow(10,18)
    // })

    this.setState({ tokenBalance: balance, propNonce: nonce });
    this.getProposals();
  };

  createContract = async () => {
    const { accounts, contract } = this.state;
    const funds = await new BigNumber(this.state.funds);
    const duration = await  new BigNumber(this.state.duration);
    const end = await duration.multipliedBy(86400);
    const tok = await contract.methods.initializeProposal(this.state.web3.utils.asciiToHex(this.state.desc), this.state.web3.utils.asciiToHex(this.state.url), end.toString(), funds.shiftedBy(18).toString()).send({ from:accounts[0] });
    const nonce = await contract.methods.getPropNonce().call();

    this.setState({ propNonce: nonce });
    this.getProposals();
  }

  reqFunds = async() => {
    const { contract, fundRights, accounts } = this.state;
    if (fundRights <= 0) {
      alert("Enter a valid amount.");
    } else {
      const funds = new BigNumber(fundRights);
      await contract.methods.requestFundingRights(funds.shiftedBy(18).toString()).estimateGas({ from: accounts[0] })
      .then((gasAmount) => {
        const res = contract.methods.requestFundingRights(funds.shiftedBy(18).toString()).send({ from: accounts[0], gas: gasAmount});
      })
      .catch((error) => {
        alert(
          `Failed to load web3, accounts, or contract. Check console for details.`
        );
        console.error(error);
      });

      this.runInitialization();
    }
  }

  withFunds = async() => {
    const { contract, withFunds, accounts } = this.state;
    if (withFunds <= 0) {
      alert("Enter a valid amount.");
    } else {
      const funds= new BigNumber(withFunds);
      await contract.methods.withdrawFundingRights(funds.shiftedBy(18).toString()).estimateGas({ from: accounts[0] })
      .then((gasAmount) => {
        const res = contract.methods.withdrawFundingRights(funds.shiftedBy(18).toString()).send({from: accounts[0], gas: gasAmount});
      })
      .catch((error) => {
        alert(
          `Failed to load web3, accounts, or contract. Check console for details.`
        );
        console.error(error);
      });

      this.runInitialization();
    }
  }

  getProposals = async() => {
    const { contract, propNonce, accounts } = this.state;
    const arr = [];
    for (let i=1; i<=propNonce; ++i) {
      const res = await contract.methods.getProposal(i).call();
      arr.push(res);
    }
    // console.log(arr)
    const res = new BigNumber(await contract.methods.tokenBalance().call({ from:accounts[0] }));
    const balance = res.shiftedBy(-18).toString();

    this.setState({ proposal: arr, tokenBalance: balance });
  }

  addFund = async(index) => {
    const { web3, contract, accounts} = this.state;
    if (this.state.jpyc <= 0) {
      alert("Enter valid funding amount.");
    } else {
      const jpyc = new BigNumber(this.state.jpyc);
      const code = new BigNumber(index);
      const res = await contract.methods.fundRaising(index, jpyc.shiftedBy(18).toString()).send({ from:accounts[0] });
      this.getProposals();
    }
  }

  render() {
    const {web3} = this.state;
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h1>Hagoromo Funding!</h1>
        <h2>Test Example</h2>
        <p>
          If your contracts compiled and migrated successfully, below will show
          a tokenBalance that was transferred to the contract.
        </p>
        <div>
          Your account is: {this.state.accounts[0]}.
        </div>
        <div>Your tokenBalance is: {this.state.tokenBalance}</div>
        <div>

        <table className="tg" style={{ marginTop:'1%' }}>
          <thead>
            <tr>
              <th className="tg-0lax"><input type="number" placeholder="JPYC" onChange={(e) => this.setState({ fundRights: e.target.value })}/></th>
              <th className="tg-0lax" rowSpan="2">
                <button type="button" className="prbutton" onClick={() => {this.reqFunds()}}>Request Fund Right</button>
              </th>
            </tr>
          </thead>
        </table>

        <table className="tg" style={{marginTop:'1%'}}>
          <thead>
            <tr>
              <th className="tg-0lax"><input type="number" placeholder="JPYC" onChange={(e) => this.setState({ withFunds: e.target.value })}/></th>
              <th className="tg-0lax" rowSpan="2">
                <button type="button" className="prbutton" onClick={() => {this.withFunds()}}>Withdraw Fund Right</button>
              </th>
            </tr>
          </thead>
        </table>

        <h3 style={{textAlign:'left'}}>Create a proposal</h3>
        <table className="tg">
          <thead>
            <tr>
              <th className="tg-0lax"><input placeholder="Description" onChange={(e) => this.setState({ desc: e.target.value })}/></th>
              <th className="tg-0lax"><input type="number" min={0} placeholder="Duration (In days)" onChange={(e) => this.setState({ duration: e.target.value })}/></th>
              <th className="tg-0lax" rowSpan="2">
                {
                  this.state.desc==='' || this.state.url==='', this.state.funds==='' || this.state.duration===''?
                  <button disabled={true} type="button" className="prbutton">Create a proposal</button>
                    :
                  <button type="button" className="prbutton" onClick={()=>{this.createContract()}}>Create a proposal</button>
                }
              </th>
            </tr>
            <tr>
              <td className="tg-0lax"><input placeholder="URL" onChange={(e) => this.setState({ url: e.target.value })}/></td>
              <td className="tg-0lax"><input type="number" min={0} placeholder="Target Funds" onChange={(e) => this.setState({funds: e.target.value })}/></td>
            </tr>
          </thead>
        </table>

        <h3 style={{textAlign:'left'}}>List Proposals</h3>
          {
            this.state.proposal.map((prop, index) => {
              return(
                <table class="tg2">
                  <thead>
                    <tr>
                      <th class="tg2-ikqu">Description: { web3.utils.hexToAscii(prop['0']) }</th>
                      <th class="tg2-ikqu">End Date: { new Date(prop['2']*1000).toString() }</th>
                      <th class="tg2-ikqu"><input type="number" min={0} placeholder="JPYC" onChange={(e) => this.setState({ jpyc: e.target.value })}/></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="tg2-ikqu">Url: <a href={prop['1']}>{ web3.utils.hexToAscii(prop['1']) }</a></td>
                      <td class="tg2-ikqu">Required Funds: { parseFloat(prop['4'], 10)/Math.pow(10, 18) } JPYC</td>
                      <td class="tg2-ikqu">
                        <button type="button" className="prbutton" onClick={() => {this.addFund(index+1)}}>Fund</button></td>
                    </tr>
                    <tr>
                      <td class="tg2-ikqu">Raised Funds: { parseFloat(prop['3'], 10)/Math.pow(10, 18) } JPYC</td>
                      <td class="tg2-ikqu">Status: { prop['5'] ? "Ended" : "Open" }</td>
                      <td class="tg2-ikqu"></td>
                    </tr>
                  </tbody>
                </table>
              )
            })
          }
        </div>
      </div>
    );
  }
};

export default App;
