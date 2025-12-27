const fs = require('fs');
const path = require('path');
const hre = require('hardhat');

async function waitForRpc(url, timeoutMs = 15000) {
  const fetch = require('node-fetch');
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'POST', body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 }), headers: { 'Content-Type': 'application/json' } });
      if (res.ok) return true;
    } catch (e) {
      // continue
    }
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

async function main() {
  // Wait for localhost node if targeting it
  const network = hre.network.name;
  if (network === 'localhost') {
    const url = (hre.network.config && hre.network.config.url) || 'http://127.0.0.1:8545';
    console.log(`Waiting for local node at ${url}...`);
    const ok = await waitForRpc(url);
    if (!ok) {
      throw new Error(`Timeout waiting for local Hardhat node at ${url}`);
    }
    console.log('Local node is responsive');
  }

  await hre.run('compile');
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  // Prefer Hardhat artifacts/deployment; if unavailable, compile with solc-js and deploy
  let adapter = null;
  try {
    const Adapter = await hre.ethers.getContractFactory('PredictionMarketAdapter');
    adapter = await Adapter.deploy(hre.ethers.constants.AddressZero, hre.ethers.constants.AddressZero);
    await adapter.deployed();
  } catch (err) {
    console.warn('Hardhat artifact/deploy failed, falling back to solc compile and deploy:', err.message || err);

    const solc = require('solc');
    const CONTRACT = 'PredictionMarketAdapter.sol';
    const SRC = fs.readFileSync(path.join(__dirname, '..', CONTRACT), 'utf8');

    const input = {
      language: 'Solidity',
      sources: { [CONTRACT]: { content: SRC } },
      settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } } }
    };

    function findImports(dependency) {
      try {
        const depPath = require.resolve(dependency, { paths: [path.join(__dirname, '..')] });
        const content = fs.readFileSync(depPath, 'utf8');
        return { contents: content };
      } catch (e) {
        return { error: 'File import callback not supported or file not found: ' + dependency };
      }
    }

    const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
    if (output.errors) output.errors.forEach(e => console.warn(e.formattedMessage || e.message || e));
    const artifact = output.contracts[CONTRACT]['PredictionMarketAdapter'];
    const factory = new hre.ethers.ContractFactory(artifact.abi, artifact.evm.bytecode.object, deployer);
    adapter = await factory.deploy(hre.ethers.constants.AddressZero, hre.ethers.constants.AddressZero);
    await adapter.deployTransaction.wait();
  }

  console.log('PredictionMarketAdapter deployed to:', adapter.address);

  // Write address to frontend .env.local for NEXT_PUBLIC_ADAPTER_ADDRESS
  const frontendEnvPath = path.resolve(__dirname, '..', '..', 'apps', 'frontend', '.env.local');
  fs.writeFileSync(frontendEnvPath, `NEXT_PUBLIC_ADAPTER_ADDRESS=${adapter.address}\n`);
  console.log('Wrote', frontendEnvPath);

  // Also write a public JSON used at runtime so the dev server doesn't need a restart
  const publicDir = path.resolve(__dirname, '..', '..', 'apps', 'frontend', 'public');
  fs.mkdirSync(publicDir, { recursive: true });
  const publicPath = path.join(publicDir, 'deployed.json');
  fs.writeFileSync(publicPath, JSON.stringify({ adapterAddress: adapter.address }, null, 2));
  console.log('Wrote', publicPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});