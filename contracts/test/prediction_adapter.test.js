const { expect } = require('chai');
const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

const artPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'PredictionMarketAdapter.sol', 'PredictionMarketAdapter.json');
if (!fs.existsSync(artPath)) {
  console.log('artifact not found, running compile script to generate it...');
  require('child_process').execSync(`node ${path.join(__dirname, '..', 'scripts', 'compile_solc.js')}`, { stdio: 'inherit' });
}


describe('PredictionMarketAdapter', function () {
  it('emits CrossChainBetSent with correct params', async function () {
    const [owner, user] = await ethers.getSigners();

    const path = require('path');
    const artifact = require(path.join(__dirname, '..', 'artifacts', 'contracts', 'PredictionMarketAdapter.sol', 'PredictionMarketAdapter.json'));
    const Factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, owner);
    const adapter = await Factory.deploy(ethers.constants.AddressZero, ethers.constants.AddressZero);
    await adapter.deployed();

    const dstEid = 101;
    const amount = 1000;
    const marketId = 55;
    const outcome = 1;
    const toPda = ethers.utils.hexZeroPad(ethers.utils.hexlify(ethers.utils.randomBytes(32)), 32);

    const tx = await adapter.connect(user).placeBetCrossChain(dstEid, amount, marketId, outcome, toPda);
    const rcpt = await tx.wait();
    const event = rcpt.events.find(e => e.event === 'CrossChainBetSent');
    expect(event.args.dstChainId).to.equal(dstEid);
    expect(event.args.to).to.equal(toPda);
    const marketVal = (event.args.marketId.toNumber) ? event.args.marketId.toNumber() : Number(event.args.marketId);
    expect(marketVal).to.equal(marketId);
    const outcomeVal = (event.args.outcome.toNumber) ? event.args.outcome.toNumber() : Number(event.args.outcome);
    expect(outcomeVal).to.equal(outcome);
    const amountVal = (event.args.amount.toNumber) ? event.args.amount.toNumber() : Number(event.args.amount);
    expect(amountVal).to.equal(amount);
    // ensure composeMsg exists and decodes correctly
    const decoded = ethers.utils.defaultAbiCoder.decode(['address','uint64','uint8'], event.args.composeMsg);
    const decodedMarket = (decoded[1].toNumber) ? decoded[1].toNumber() : Number(decoded[1]);
    expect(decodedMarket).to.equal(marketId);
  });
});