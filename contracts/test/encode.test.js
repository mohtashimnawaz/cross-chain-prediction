const { expect } = require('chai');
const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

// Ensure artifact exists; if not, compile it using the bundled compile script (solc-js fallback)
const artPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'PredictionMarketAdapter.sol', 'PredictionMarketAdapter.json');
if (!fs.existsSync(artPath)) {
  console.log('artifact not found, running compile script to generate it...');
  const execSync = require('child_process').execSync;
  execSync(`node ${path.join(__dirname, '..', 'scripts', 'compile_solc.js')}`, { stdio: 'inherit' });
}


describe('PredictionMarketAdapter encoding', function () {
  it('encodes composeMsg correctly', async function () {
    const [owner, user] = await ethers.getSigners();

    const path = require('path');
    const artifact = require(path.join(__dirname, '..', 'artifacts', 'contracts', 'PredictionMarketAdapter.sol', 'PredictionMarketAdapter.json'));
    const Factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, owner);
    const adapter = await Factory.deploy(ethers.constants.AddressZero, ethers.constants.AddressZero);
    await adapter.deployed();

    const marketId = 55;
    const outcome = 1;

    // call the encoding helper
    const encoded = await adapter.connect(user).encodeComposeMsg(user.address, marketId, outcome);

    // decode using ethers
    const decoded = ethers.utils.defaultAbiCoder.decode(['address','uint64','uint8'], encoded);
    expect(decoded[0]).to.equal(user.address);
    const marketVal = (decoded[1].toNumber) ? decoded[1].toNumber() : Number(decoded[1]);
    const outcomeVal = (decoded[2].toNumber) ? decoded[2].toNumber() : Number(decoded[2]);
    expect(marketVal).to.equal(marketId);
    expect(outcomeVal).to.equal(outcome);
  });

  it('placeBetCrossChain emits composeMsg matching helper', async function () {
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
    expect(event.args.marketId.toNumber()).to.equal(marketId);
    expect(event.args.outcome).to.equal(outcome);

    // decode compose msg from event and verify
    const encoded = event.args.composeMsg;
    const decoded = ethers.utils.defaultAbiCoder.decode(['address','uint64','uint8'], encoded);
    const marketVal = (decoded[1].toNumber) ? decoded[1].toNumber() : Number(decoded[1]);
    const outcomeVal = (decoded[2].toNumber) ? decoded[2].toNumber() : Number(decoded[2]);
    expect(marketVal).to.equal(marketId);
    expect(outcomeVal).to.equal(outcome);
  });
});