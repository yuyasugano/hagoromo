import React, { Component } from "react";
import HagoromoContract from "./contracts/HagoromoV1.json";
import getWeb3 from "./getWeb3";

import "./App.css";
import BigNumber from 'bignumber.js';
import jpycContract from './contracts/JPYC.json';

const PARAMS = {
  'RINKEBY': {
    chainId: "0x4",
  },
  'MATIC': {
    chainId: "0x89",
    chainName: "Matic",
    nativeCurrency: {
      name: "Matic",
      symbol: "MATIC",
      decimals: 18,
    },
    rpcUrls: ["https://rpc-mainnet.matic.quiknode.pro"], // ['https://matic-mainnet.chainstacklabs.com/'],
    blockExplorerUrls: ["https://explorer-mainnet.maticvigil.com"],
  },
};

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
    jpycBalance: 0,
    allowance: 0,
    approvedAmount: 0,
    propNonce: 0,
    proposal: [],
    jpyc: 0,
    fundRights: 0,
    withFunds: 0,
    networkId: 0,
    isInitialLoad: true,
  };


  componentDidMount = async () => {
    this.RINKEBY_NETWORK_ID = 4;
    this.MATIC_NETWORK_ID = 137;
    // configure default network id when you deploy the code
    this.DEFAULT_NETWORK_ID = this.MATIC_NETWORK_ID;
    // this.DEFAULT_NETWORK_ID = this.RINKEBY_NETWORK_ID;

    let web3;
    try {
      web3 = await getWeb3();
    } catch {
      // A user does not signed up even though metamask is installed.
      return this.setState({isInitialLoad: false})
    }

    this.setState({ web3, jpyc: jpycContract }, this.setUserInfo);
  }

  setUserInfo = async () => {
    const { web3, isInitialLoad }= this.state

    let networkId;
    let accounts;

    if(isInitialLoad) {
      this.setState({isInitialLoad: false});

      try {
        accounts = await web3.eth.getAccounts();
        networkId = await web3.eth.net.getId();
      } catch (e) {
        // Do nothing at the initial load.
        return
      }

      // Do nothing at the initial load.
      if(networkId !== this.DEFAULT_NETWORK_ID) return;
    } else {
      try {
        accounts = await web3.eth.getAccounts();
        networkId = await web3.eth.net.getId();
      } catch (e) {
        return alert("Available Ethereum wallet was not found on your browser.");
      }

      if(networkId !== this.DEFAULT_NETWORK_ID) return this.switchNetwork();
    }

    this.setState({ accounts, networkId }, this.setInstances);
  }

  setInstances = () => {
    const { web3, networkId } = this.state;
    const HagoromoNetwork = HagoromoContract.networks[networkId];
    const jpycNetwork = jpycContract.networks[networkId];
    const instance = new web3.eth.Contract(
      HagoromoContract.abi,
      HagoromoNetwork && HagoromoNetwork.address,
    );
    const instance2 = new web3.eth.Contract(
      jpycContract.abi,
      jpycNetwork && jpycNetwork.address,
    );

    let contractAddress;
    let contract2Address;
    try {
      contractAddress = HagoromoNetwork.address;
      contract2Address = jpycNetwork.address;
    } catch {
      return alert('ERROR: Network of the contract and defined DEFAULT_NETWORK_ID are different. Please contact to dev.');
    }

    this.setState({ contract: instance, contract2: instance2, contractAddress, contract2Address }, this.getProposals);
  }

  switchNetwork = async () => {
    const { web3 } = this.state;
    const getParams = () => {
      switch(this.DEFAULT_NETWORK_ID) {
        case (this.MATIC_NETWORK_ID): {
          return {method: 'wallet_addEthereumChain', params: [PARAMS.MATIC]};
        }
        case (this.RINKEBY_NETWORK_ID): {
          return {method: 'wallet_switchEthereumChain', params: [PARAMS.RINKEBY]};
        }
        default: throw new Error("Invalid Network is assigned to DEFAULT_NETWORK_ID");
      }
    };

    const params = getParams();

    try {
      await window.ethereum.request(params)
    } catch (e) {
      console.error('Could not add Ethereum chain')
    }

    const accounts = await web3.eth.getAccounts();
    const networkId = await web3.eth.net.getId();
    this.setState({ accounts, networkId }, this.setInstances);
  }

  createContract = async () => {
    const { accounts, contract } = this.state;
    const funds = await new BigNumber(this.state.funds).shiftedBy(18).toFixed();
    const duration = await  new BigNumber(this.state.duration);
    const end = await duration.multipliedBy(86400);

    const func = contract.methods.initializeProposal(
      this.state.web3.utils.utf8ToHex(this.state.desc),
      this.state.web3.utils.utf8ToHex(this.state.url),
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
      const func = await contract.methods.requestFundingRights(funds);
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
      const func = await contract.methods.withdrawFundingRights(funds);
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
    const { contract, contractAddress, contract2, contract2Address, approvedAmount, accounts, jpycBalance } = this.state;
    if (approvedAmount <= 0) { // zero means nothing
      alert("Enter more than 1 JPYC.");
    } else if (approvedAmount > jpycBalance) { // avoid an input more than JPYC balance
      alert("Enter less than your JPYC balance");
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

    // Get the jpyc balance for the caller from the contract
    const jp = new BigNumber(await contract2.methods.balanceOf(accounts[0]).call({ from: accounts[0] }));
    const jpyc = jp.shiftedBy(-18).toString();
    // console.log(jpyc);

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

    this.setState({ proposal: arr, tokenBalance: balance, jpycBalance: jpyc, propNonce: nonce, allowance: allowed });
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
    const { web3, networkId } = this.state;
    const projectDetailTable = {
        'word-break': 'break-all'
    }

    const getNetwork = () => {
      switch(this.DEFAULT_NETWORK_ID) {
        case(this.MATIC_NETWORK_ID): {
          return 'Matic'
        }
        case(this.RINKEBY_NETWORK_ID):
        default: {
          return 'Rinkeby'
        }
      }
    }

    const networkButton = networkId === this.DEFAULT_NETWORK_ID ? (
      <div className="header_rinkeby" onClick={() => this.setUserInfo()}>
        <p className="header_rinkeby_p">{getNetwork()}</p>
      </div>
    ) : (
      <div className="header_not_connected" onClick={() => this.setUserInfo()}>
        <p className="header_not_connected_p">Connect Wallet</p>
      </div>
    );

    return (
      <div className="App">
        <header className="section_header">
          <div className="header_left">
            <img className="hagoromo_logo_header" src="img/logo_symbol.svg" alt="logo" />
          </div>
          <div className="header_right">
            {networkButton}
            <a className="header_help" href="https://yuyasugano.medium.com/%E3%81%AF%E3%81%94%E3%82%8D%E3%82%82%E3%83%95%E3%82%A1%E3%83%B3%E3%83%87%E3%82%A3%E3%83%B3%E3%82%B0-matic%E3%83%A1%E3%82%A4%E3%83%B3%E3%83%8D%E3%83%83%E3%83%88-%E5%88%86%E6%95%A3%E5%9E%8B%E3%82%AF%E3%83%A9%E3%82%A6%E3%83%89%E3%83%95%E3%82%A1%E3%83%B3%E3%83%87%E3%82%A3%E3%83%B3%E3%82%B0-fa4f1ac310" target="_blank" rel="noopener noreferrer">はごろもの使い方</a>
          </div>
        </header>

        <section className="section_title">
          <h1 className="title_h1">
            <img className="hagoromo_logo_h1" src="img/logo.svg" alt="はごろもファンディング" />
          </h1>
          <h2 className="title_h2">Welcome to Hagoromo Funding!</h2>
          <p className="title_p">1 JPYC = 1円で使用できる JPYC を使用したクラウドファンディングサイトです。<br /> 分散型で誰でもプロジェクトの作成や、プロジェクトへのファンディングが行えます。</p>
          <p className="title_s">Connect Walletをクリックして支援プロジェクトを表示しましょう</p>
        </section>

        <section className="section_deposit">
          <div className="deposit_container">
            <h2 className="h2_sectiontitle">JPYCをウォレットからはごろもに移す</h2>
            <div className="deposit_adress_container">
              <p className="deposit_adress_label">アカウント:</p>
              <p className="deposit_adress">{ this.state.accounts && this.state.accounts[0] }</p>
            </div>
            <div className="input_container">
              <div className="label_container">
                <label htmlFor="name1">承認金額（JPYC）</label>
                <p className="label_p">{ this.state.allowance }</p>
              </div>
              <div className="input_with_unit">
                <input type="number" className="input_main no-spin" placeholder="0" onChange={(e) => this.setState({ approvedAmount: e.target.value })} />
                <span className="input_unit">JPYC</span>
              </div>
              <button className="button_main" type="button" onClick={() => {this.approveJPYC()}}>許可する</button>
            </div>
            <div className="divider"></div>
            <div className="deposit_swap_container">
              <div className="input_container">
                <div className="label_container">
                  <label htmlFor="name1">ウォレット</label>
                  <p className="label_p">{ this.state.jpycBalance }</p>
                </div>
                <div className="input_with_unit">
                  <input type="number" className="input_main no-spin" placeholder="0" onChange={(e) => this.setState({ fundRights: e.target.value })} />
                  <span className="input_unit">JPYC</span>
                </div>
                <button className="button_main" type="button" onClick={() => {this.reqFunds()}}>はごろもに移す</button>
              </div>
              <img className="deposit_swap_img" src="img/icon_sawp.svg" alt="arrow" width="24px" height="24px" />
              <div className="input_container">
                <div className="label_container">
                  <label htmlFor="name1">はごろも</label>
                  <p className="label_p">{ this.state.tokenBalance }</p>
                </div>
                <div className="input_with_unit">
                  <input type="number" className="input_main no-spin" placeholder="0" onChange={(e) => this.setState({ withFunds: e.target.value })} />
                  <span className="input_unit">JPYC</span>
                </div>
                  <button className="button_main" type="button" onClick={() => {this.withFunds()}}>ウォレットに戻す</button>
              </div>
            </div>
            <p className="p_small">※支援を行うには、まずウォレットからはごろもにJPYCを移動する必要があります</p>
          </div>
        </section>

        <section className="section_project-create">
          <div className="project-create_container">
            <h2 className="h2_sectiontitle">新しいプロジェクトを作成する</h2>
            <div className="input_container">
              <label htmlFor="name1">プロジェクト名</label>
                <input type="text" className="input_main" placeholder="○○○プロジェクト" onChange={(e) => this.setState({ desc: e.target.value })} />
            </div>
            <div className="input_container">
              <label htmlFor="name1">Webサイト</label>
                <input type="text" className="input_main" placeholder="https://new-project.com" onChange={(e) => this.setState({ url: e.target.value })} />
            </div>
            <div className="input_container">
              <label htmlFor="name1">支援締め切り期限</label>
              <div className="input_with_unit">
                <input type="number" className="input_main no-spin" placeholder="30" onChange={(e) => this.setState({ duration: e.target.value })} />
                <span className="input_unit">日間</span>
              </div>
            </div>
            <div className="input_container">
              <label htmlFor="name1">目標金額</label>
              <div className="input_with_unit">
                <input type="number" className="input_main no-spin" placeholder="100000" onChange={(e) => this.setState({ funds: e.target.value })} />
                <span className="input_unit">JPYC</span>
              </div>
            </div>
            {
              this.state.desc === '' || this.state.url === '', this.state.funds === '' || this.state.duration === '' ?
              <button disabled={true} type="button" className="button_main">情報を入力してください</button>
                :
              <button className="button_main" type="button" onClick={() => {this.createContract()}}>作成する</button>
            }
          </div>
        </section>

        <section className="section_project">
          <h2 className="h2_sectiontitle">プロジェクトを支援する</h2>

          <div className="project_container">
          {
            // keys are not identified for mapped items
            this.state.proposal.map((prop, index) => {
              return (
                <div className="project_card">
                  <div className="project_title_container">
                    <h3 className="project_title">{ web3.utils.hexToUtf8(prop['0']) }</h3>
                  </div>
                  <div className="project_tag_container">
                    <p className="tag_complete">{ prop['5'] ? "達成" : "未達成" }</p>
                  </div>
                  <div className="project_amount_container">
                    <div className="amount_list">
                      <h4 className="amountarea_title">支援総額</h4>
                        <p className="amountarea_number">{ BigNumber(prop['3']).shiftedBy(-18).toString() } <span className="amountarea_unit">JPYC</span></p>
                    </div>
                    <div className="amount_slash">
                      <p className="amount_slash_p">/</p>
                    </div>
                    <div className="amount_list color_sub">
                      <h4 className="amountarea_title">目標額</h4>
                      <p className="amountarea_number">{ BigNumber(prop['4']).shiftedBy(-18).toString() } <span className="amountarea_unit">JPYC</span></p>
                    </div>
                  </div>
                  <div className="project_detail_container">
                    <table className="project_detail_table" style={projectDetailTable}>
                      <tr>
                        <th>支援締切日</th>
                        <td>{ new Date(prop['2']*1000).toString() } <span className="gmt_text"></span></td>
                      </tr>
                      <tr>
                        <th>Webサイト</th>
                        <td>
                          { prop['1'] !== null &&
                          <a href={web3.utils.hexToUtf8(prop['1'])} target="_blank"
                          rel="noopener noreferrer">{ web3.utils.hexToUtf8(prop['1']) }</a>
                          }
                        </td>
                      </tr>
                      <tr>
                        <th>資金引き出し</th>
                        <td>{ prop['6'] ? "引き出し" : "未引き出し" }</td>
                      </tr>
                    </table>
                  </div>

                  { prop['5'] === false && prop['6'] === false && (new Date() < new Date(prop['2']*1000)) &&
                  <div className="project_input_container">
                    <div className="input_container">
                      <div className="input_with_unit">
                        <input type="number" className="input_main no-spin" placeholder="100000" onChange={(e) => this.setState({ jpyc: e.target.value })} />
                            <span className="input_unit">JPYC</span>
                        </div>
                        <button className="button_main" onClick={() => {this.addFund(index+1)}}>支援する</button>
                    </div>
                  </div>
                  }
                  { prop['5'] === true && prop['6'] === false &&
                  <div className="project_input_container">
                    <div className="input_container">
                      <div className="input_with_unit">
                        <button className="button_main" onClick={() => {this.withTokens(index+1)}}>プロジェクトを終了する</button>
                      </div>
                    </div>
                  </div>
                  }
                  { prop['5'] === false && prop['6'] === false && (new Date(prop['2']*1000) < new Date()) &&
                  <div className="project_input_container">
                    <div className="input_container">
                      <div className="input_with_unit">
                        <button className="button_main" onClick={() => {this.resFunds(index+1)}}>支援を引き揚げる</button>
                      </div>
                    </div>
                  </div>
                  }
                </div>
              )
            })
          }

          <div className="project_card_spacer"></div>
          <div className="project_card_spacer"></div>
          <div className="project_card_spacer"></div>
          </div>
        </section>

        <footer className="section_footer">
          <p className="footer_copy">&copy; 2021 HagoromoFunding</p>
        </footer>
      </div>
    );
  }
};

export default App;
