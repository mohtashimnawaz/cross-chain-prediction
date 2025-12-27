// scripts/generate_compose.js
// Usage: Run on a local Hardhat node
// cd contracts && npx hardhat run --network localhost scripts/generate_compose.js

const fs = require('fs');
const path = require('path');
const hre = require('hardhat');

async function main() {
  const [deployer, user] = await hre.ethers.getSigners();
  // Read artifact produced by solc fallback (or normal Hardhat artifacts)
  const artifactPath = path.join(process.cwd(), 'artifacts', 'contracts', 'PredictionMarketAdapter.sol', 'PredictionMarketAdapter.json');
  let artifact = null;
  console.log('artifactPath', artifactPath);
  console.log('existsSync', fs.existsSync(artifactPath));
  if (fs.existsSync(artifactPath)) {
    artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  } else {
    try {
      artifact = await hre.artifacts.readArtifact('PredictionMarketAdapter');
    } catch (err) {
      console.error('Could not locate contract artifact via local fallback or Hardhat artifacts. Falling back to solc compile.');
      // fallback: compile the contract with solc-js directly
      const solc = require('solc');
      const CONTRACT = 'PredictionMarketAdapter.sol';
      const SRC = fs.readFileSync(path.join(process.cwd(), CONTRACT), 'utf8');

      const input = {
        language: 'Solidity',
        sources: {
          [CONTRACT]: { content: SRC }
        },
        settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } } }
      };

      function findImports(dependency) {
        try {
          const depPath = require.resolve(dependency, { paths: [process.cwd()] });
          const content = fs.readFileSync(depPath, 'utf8');
          return { contents: content };
        } catch (e) {
          return { error: 'File import callback not supported or file not found: ' + dependency };
        }
      }

      const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
      if (output.errors) {
        for (const e of output.errors) console.warn(e.formattedMessage || e.message || e);
      }
      const contractName = 'PredictionMarketAdapter';
      const compiled = output.contracts[CONTRACT][contractName];
      artifact = {
        abi: compiled.abi,
        bytecode: compiled.evm.bytecode.object,
      };
    }
  }

  // Deploy the adapter using the artifact ABI/bytecode
  const PredictionMarketAdapterFactory = new hre.ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
  const adapter = await PredictionMarketAdapterFactory.deploy(hre.ethers.constants.AddressZero, hre.ethers.constants.AddressZero);
  await adapter.deployed();

  const marketId = 42;
  const outcome = 1;

  // Use the adapter helper to encode composeMsg
  const encoded = await adapter.encodeComposeMsg(user.address, marketId, outcome);

  const outDir = path.resolve(__dirname, '..', '..', 'e2e', 'out');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'compose.json');

  const obj = {
    composeHex: encoded.toString(),
    marketId: marketId,
    outcome: outcome,
    user: user.address,
    adapterAddress: adapter.address,
  };

  fs.writeFileSync(outPath, JSON.stringify(obj, null, 2));
  console.log('Wrote compose message to', outPath);
  console.log(obj);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});