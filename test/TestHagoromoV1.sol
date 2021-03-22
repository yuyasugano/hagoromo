// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.2 <0.8.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/HagoromoV1.sol";

contract TestHagoromoV1 {

    function testInitializeHagoromoV1() public {
        HagoromoV1 hagoromo = HagoromoV1(DeployedAddresses.HagoromoV1());
        
        hagoromo.init(0xbD9c419003A36F187DAf1273FCe184e1341362C0);
        address expected = 0xbD9c419003A36F187DAf1273FCe184e1341362C0;
        Assert.equal(hagoromo.token(), expected, "It should set the token JPYC.");
    }
}

