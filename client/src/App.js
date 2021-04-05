import React, { Component } from "react";
import HagoromoContract from "./contracts/HagoromoV1.json";
import getWeb3 from "./getWeb3";

import "./App.css";
import BigNumber from 'bignumber.js'
class App extends Component {
  state = { tokenBalance: 0, web3: null, accounts: null, contract: null,duration:'',url:'',funds:'',desc:'',propNonce:0,proposal:[],jpyc:0,fundRights:0,withFunds:0 };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = HagoromoContract.networks[networkId];
      const instance = new web3.eth.Contract(
        HagoromoContract.abi,
        deployedNetwork && deployedNetwork.address,
      );
      console.log(web3)

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.runExample);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  runExample = async () => {
    const { accounts, contract } = this.state;
    // Get the value from the contract to prove it worked.
    const response = await contract.methods.tokenBalance().call();
    // const res = await contract.methods.init(accounts[0]).call()
    const nonce = await contract.methods.getPropNonce().call()
    // Update state with the result.
    this.setState({ tokenBalance: response, propNonce:nonce });
    this.getProposals()
  };

  createContract = async ()=>{

    const { accounts, contract } = this.state
    const num = new BigNumber(this.state.funds)
    const tok = await contract.methods.initializeProposal(this.state.web3.utils.asciiToHex(this.state.desc), this.state.web3.utils.asciiToHex(this.state.url), this.state.duration.toString(), num.shiftedBy(18).toString()).send({
      from:accounts[0]
    }) 
    

    
    const nonce = await contract.methods.getPropNonce().call()
    this.setState({
      propNonce:nonce
    })
    this.getProposals()

  }

  reqFunds=async()=>{
    const {contract,fundRights,accounts} =  this.state
    if(fundRights<=0){
      alert("Enter a valid amount.")
    }
    else{
      const num = new BigNumber(fundRights)
      const res = await contract.methods.requestFundingRights(num.shiftedBy(18).toString()).send({from: accounts[0], gas: 1000000})
      console.log(res)
    }
  }

  withFunds=async()=>{
    const {contract,withFunds,accounts} =  this.state
    if(withFunds<=0){
      alert("Enter a valid amount.")
    }
    else{
      const num = new BigNumber(withFunds)
      const res = await contract.methods.requestFundingRights(num.shiftedBy(18).toString()).send({from: accounts[0], gas: 1000000})
      console.log(res)
    }

  }

  getProposals=async()=>{
    const {contract, propNonce} = this.state;
    const arr=[];
    for(let i=1;i<=propNonce;++i){
      const res = await contract.methods.getProposal(i).call()
      arr.push(res)
    }
    console.log(arr)
    this.setState({
      proposal:arr
    })
  }

  addFund=async(index)=>{
    const {web3,contract,accounts} = this.state
    if(this.state.jpyc<=0){
      alert("Enter valid funding amount.")
    }
    else{
      const num = new BigNumber(this.state.jpyc)
      const code = new BigNumber(index)
      const res = await contract.methods.fundRaising(index,num.shiftedBy(18).toString()).call({from:accounts[0]})
      this.getProposals()
    }
  }


  render() {
    const {web3} = this.state
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
        <table className="tg">
<thead>
  <tr>
    <th className="tg-0lax"><input type="number" placeholder="JPYC" onChange={(e)=>this.setState({
      fundRights:e.target.value
    })}/></th>
    <th className="tg-0lax" rowSpan="2">
      <button type="button" className="prbutton" onClick={()=>{this.reqFunds()}}>Request Fund Right</button>
      </th>
  </tr>
</thead>
</table>        
<table className="tg" style={{marginTop:'1%'}}>
<thead>
  <tr>
    <th className="tg-0lax"><input type="number" placeholder="JPYC" onChange={(e)=>this.setState({
      withFunds:e.target.value
    })}/></th>
    <th className="tg-0lax" rowSpan="2">
      <button type="button" className="prbutton" onClick={()=>{this.withFunds()}}>Withdraw Fund Right</button>
      </th>
  </tr>
</thead>
</table>
          <h3 style={{textAlign:'left'}}>Create a proposal</h3>
          
<table className="tg">
<thead>
  <tr>
    <th className="tg-0lax"><input placeholder="Description" onChange={(e)=>this.setState({
      desc:e.target.value
    })}/></th>
    <th className="tg-0lax"><input type="number" min={0} placeholder="Duration(In days)" onChange={(e)=>this.setState({
      duration:e.target.value
    })}/></th>
    <th className="tg-0lax" rowSpan="2">
      {
        this.state.desc==''||this.state.url=='',this.state.funds==''||this.state.duration==''?
        <button disabled={true} type="button" className="prbutton">Create a proposal</button>
        :
      <button type="button" className="prbutton" onClick={()=>{this.createContract()}}>Create a proposal</button>
      }
      </th>
  </tr>
  <tr>
    <td className="tg-0lax"><input placeholder="URL" onChange={(e)=>this.setState({
      url:e.target.value
    })}/></td>
    <td className="tg-0lax"><input type="number" min={0} placeholder="Target Funds" onChange={(e)=>this.setState({
      funds:e.target.value
    })}/></td>
    
  </tr>
</thead>
</table>
          <h3 style={{textAlign:'left'}}>List Proposals</h3>

{
  this.state.proposal.map((item,index)=>{
    return(
      <table class="tg2">
      <thead>
        <tr>
          <th class="tg2-ikqu">Description: <b>{web3.utils.hexToAscii(item['0'])}</b></th>
          <th class="tg2-ikqu">End Date: {new Date(item['2']*1000).toString()} <b></b></th>
          <th class="tg2-ikqu"><input type="number" min={0} placeholder="JPYC" onChange={(e)=>this.setState({
      jpyc:e.target.value
    })}/></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="tg2-ikqu">Url: <a href={item['1']}><b>{web3.utils.hexToAscii(item['1'])}</b></a></td>
          <td class="tg2-ikqu">Required Funds: <b>{parseFloat(item['4'],10)/Math.pow(10,18)} JPYC(10 ** 18 JPYC)</b></td>
          <td class="tg2-ikqu">
      <button type="button" className="prbutton" onClick={()=>{this.addFund(index+1)}}>Fund</button></td>
        </tr>
        <tr>
          <td class="tg2-ikqu">Raised Funds: <b>{parseFloat(item['3'],10)/Math.pow(10,18)} JPYC(10 ** 18 JPYC)</b></td>
          <td class="tg2-ikqu">Status: <b></b> (Open or Ended)</td>
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
}

export default App;
