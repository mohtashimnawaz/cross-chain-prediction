const fs = require('fs');
const path = require('path');
const solc = require('solc');

const CONTRACT = 'PredictionMarketAdapter.sol';
const SRC = fs.readFileSync(path.join(__dirname, '..', CONTRACT), 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    [CONTRACT]: {
      content: SRC,
    }
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode']
      }
    }
  }
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
if (output.errors) {
  for (const e of output.errors) {
    console.error(e.formattedMessage || e.message || e);
  }
}

const contractName = 'PredictionMarketAdapter';
const artifact = output.contracts[CONTRACT][contractName];
if (!artifact) {
  console.error('Compilation failed');
  process.exit(1);
}

const artifactsDir = path.join(__dirname, '..', 'artifacts', 'contracts', CONTRACT);
fs.mkdirSync(artifactsDir, { recursive: true });
const out = {
  abi: artifact.abi,
  bytecode: artifact.evm.bytecode.object,
};
const outPath = path.join(artifactsDir, `${contractName}.json`);
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log('Wrote artifact to', outPath, 'exists=', fs.existsSync(outPath));
