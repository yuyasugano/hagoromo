# Hagoromo Funding with JPYCoin (JPYC)
  
## Overview
 
`JPYC` is a JPY-pegged stablecoin, legally treated as a prepaid payment instrument in Japan. With this said the stablecoin enables us to purchase goods as a medium of exchange. `JPYC` is a simple ERC-20 based token so that we can implement and integrate this token in Ethereum DApps ecosystem. Here is the reason JPYC Rinkeby takes place for testing purpose.
 
To know details about `JPYC`, visit https://jpyc.jp/white-paper-en.pdf
 
`Hagoromo` is an open source social project of decentralized crowdfunding written for Ethereum and Polygon network, everyone can participate in each project as a proposal creator or a fundraiser. Crowdfunding is widely known as a form of crowdsourcing and alternative finance. 
 
To get insights about `Crowdfunding`, visit https://en.wikipedia.org/wiki/Crowdfunding
 
## HagoromoV1
 
`HagoromoV1` has been prototyped with simple functions that were required to achieve features for decentralized crowdfunding. It supports the one of the three primary types of crowdfunding donation-based in which there is no financial return to the investors or contributors. It's said that common donation-based crowdfunding
initiatives include fundraising for disaster relief, charities, nonprofits, and medical bills. 
 
It is deployed at the address [0x9c84b6413D8A859EB071a5db5525262f72E443A6][hagoromor] for Rinkeby test network. 
It is deployed at the address [0x0E30E8A64093758ee2000E1011a62D9bA29CB79D][hagoromom] for Polygon(Matic) main network. 
 
## Use of JPYC Rinkeby
 
`JPYC Rinkeby` is a ERC-20 based contract that was deployed at the address [0xbd9c419003a36f187daf1273fce184e1341362c0][jpycr]. Here is the explanation how JPYC Rinkeby works if you want to get some.
 
1. Obtain Rinkeby Eth from one of the faucets to exchange it with JPYC Rinkeby
2. Send Rinkeby Eth to the `JPYC Rinkeby` contract address from your wallet
3. The contract computes how much JPYC should be returned with off-chain data from Chainlink Oracle
4. The contract sends equivalent JPYC to your wallet address at the current rate of ETH/JPY
5. It's time to use JPYC for your testing purpose!! Viola.
 
## Use of JPYC Polygon
 
`JPYC` in Polygon(Matic) is a ERC-20 based contract that was deployed at the address[0x6AE7Dfc73E0dDE2aa99ac063DcF7e8A63265108c][jpycm]. To buy JPYC in Polygon(Matic), visit https://jpyc.jp/
 
## Testing
  
The test scripts are stored under the tests directory, currently work in progress.
  
```sh
$ truffle development
> compile
> test
```
  
[jpycr]: https://rinkeby.etherscan.io/address/0xbd9c419003a36f187daf1273fce184e1341362c0 "JPYC Rinkeby"
[jpycm]: https://polygonscan.com/address/0x6AE7Dfc73E0dDE2aa99ac063DcF7e8A63265108c "JPYC Polygon"
[hagoromor]: https://rinkeby.etherscan.io/address/0x4A2164a1a93d6CaD9cb2994962dc0EC25C1d8E9E "HagoromoV1 Rinkeby"
[hagoromom]: https://polygonscan.com/address/0x0E30E8A64093758ee2000E1011a62D9bA29CB79D "HagoromoV1 Polygon" 
