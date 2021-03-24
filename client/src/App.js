import React, { Component } from "react";
import HagoromoContract from "./contracts/HagoromoV1.json";
import getWeb3 from "./getWeb3";

import "./App.css";

class App extends Component {
  state = { tokenBalance: 0, web3: null, accounts: null, contract: null };

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

    // Update state with the result.
    this.setState({ tokenBalance: response });
  };

  render() {
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
      </div>
    );
  }
}

export default App;
