# Hagoromo Funding with JPYCoin (JPYC)
  
## Overview
 
`JPYC` is a JPY-pegged stablecoin, legally treated as a prepaid payment instrument in Japan. With this said the stablecoin enables us to purchase goods as a medium of exchange. `JPYC` is a simple ERC-20 based token so that we can implement and integrate this token in Ethereum DApps ecosystem. Here is the reason JPYC Rinkeby takes place for testing purpose.
 
To know details about `JPYC`, visit https://jpyc.jp/white-paper-en.pdf
 
`Hagoromo` is an exprimental project of decentralized crowdfunding written for Ethereum network, everyone can participate in each proposal as a proposal creator or a fundraiser. Crowdfunding is widely known as a form of crowdsourcing and alternative finance.
 
To get insights about `Crowdfunding`, visit https://en.wikipedia.org/wiki/Crowdfunding
 
## HagoromoV1
 
`HagoromoV1` has been prototyped with simple functions that were required to achieve features for decentralized crowdfunding. Details will come soon.  
 
## Use of JPYC Rinkeby
 
`JPYC Rinkeby` is a ERC-20 based contract that was deployed at the address [0xbd9c419003a36f187daf1273fce184e1341362c0][jpyc]. Here is the explanation how JPYC Rinkeby works if you want to get some.
 
1. Obtain Rinkeby Eth from one of the faucets to exchange it with JPYC Rinkeby
2. Send Rinkeby Eth to the `JPYC Rinkeby` contract address from your wallet
3. The contract computes how much JPYC should be returned with off-chain data from Chainlink Oracle
4. The contract sends equivalent JPYC to your wallet address at the current rate of ETH/JPY
5. It's time to use JPYC for your testing purpose!! Viola.
 
## Testing
  
The test scripts are stored under the tests directory, currently work in progress.
  
```sh
$ truffle development
> compile
> test
```
  
[jpyc]: https://rinkeby.etherscan.io/address/0xbd9c419003a36f187daf1273fce184e1341362c0 "JPYC Rinkeby"
