const HagoromoV1 = artifacts.require("./HagoromoV1.sol");

contract("HagoromoV1", accounts => {
  it("...should set the token JPYC.", async () => {
    const hagoromoInstance = await HagoromoV1.deployed();

    // Initialize the instance
    await hagoromoInstance.init("0xbD9c419003A36F187DAf1273FCe184e1341362C0", { from: accounts[0] });

    // Get token value
    const tokenAddress = await hagoromoInstance.token.call();

    assert.equal(tokenAddress, "0xbD9c419003A36F187DAf1273FCe184e1341362C0", "JPYC address was not initialized.");
  });
}); 
