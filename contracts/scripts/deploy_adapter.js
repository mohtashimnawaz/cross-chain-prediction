const fs = require('fs');
const path = require('path');
const hre = require('hardhat');

async function main() {
  await hre.run('compile');
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  // Try to use Hardhat artifact; fall back to solc-generated artifact if necessary
  let adapter = null;
  try {
    const Adapter = await hre.ethers.getContractFactory('PredictionMarketAdapter');
    adapter = await Adapter.deploy(hre.ethers.constants.AddressZero, hre.ethers.constants.AddressZero);
    await adapter.deployed();
  } catch (err) {
    console.log('Hardhat artifact unavailable, falling back to solc artifact deployment');
    // Explicitly use the solc fallback artifact path
    const artifactPath = path.resolve(__dirname, '..', 'artifacts', 'contracts', 'PredictionMarketAdapter.sol', 'PredictionMarketAdapter.json');
    console.log('Trying artifactPath', artifactPath, 'exists=', fs.existsSync(artifactPath));
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      const bytecode = artifact.bytecode || (artifact.evm && artifact.evm.bytecode && artifact.evm.bytecode.object);
      const factory = new hre.ethers.ContractFactory(artifact.abi, bytecode, deployer);
      adapter = await factory.deploy(hre.ethers.constants.AddressZero, hre.ethers.constants.AddressZero);
      await adapter.deployTransaction.wait();
    } else {
      console.log('Artifact not found; compiling source with solc-js as fallback');
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