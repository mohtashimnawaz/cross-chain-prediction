#!/usr/bin/env bash
set -euo pipefail

# e2e_dev.sh - convenience script to run a local E2E flow:
# 1) Start Hardhat node (background) unless already running
# 2) Deploy adapter to localhost
# 3) Generate compose.json
# 4) Run Anchor tests
# 5) Cleanup (stop node if we started it)

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HH_LOG="/tmp/hardhat-e2e.log"
HH_PID=""
STARTED_HH=false
RPC_URL="http://127.0.0.1:8545"
TIMEOUT=60

function cleanup() {
  if [ "$STARTED_HH" = true ] && [ -n "$HH_PID" ]; then
    echo "Stopping hardhat node (pid $HH_PID)..."
    kill "$HH_PID" || true
    wait "$HH_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# Check if Hardhat RPC is up
if curl -sSf "$RPC_URL" >/dev/null 2>&1; then
  echo "Hardhat RPC already running at $RPC_URL"
else
  echo "Starting Hardhat node (logs -> $HH_LOG)..."
  # Start hardhat node in background
  (cd "$REPO_ROOT/contracts" && npx hardhat node > "$HH_LOG" 2>&1) &
  HH_PID=$!
  STARTED_HH=true

  echo -n "Waiting for RPC to become available"
  SECONDS_WAITED=0
  until curl -sSf "$RPC_URL" >/dev/null 2>&1; do
    sleep 1
    SECONDS_WAITED=$((SECONDS_WAITED+1))
    echo -n "."
    if [ "$SECONDS_WAITED" -ge "$TIMEOUT" ]; then
      echo
      echo "Timed out waiting for Hardhat RPC at $RPC_URL. See $HH_LOG for details."
      exit 1
    fi
  done
  echo
  echo "Hardhat RPC is available. (logs in $HH_LOG)"
fi

# Deploy adapter to localhost
echo "Deploying PredictionMarketAdapter to localhost..."
(cd "$REPO_ROOT/contracts" && npm run deploy:localhost)

# Generate compose.json using the deployed adapter
echo "Generating compose message (compose.json)..."
(cd "$REPO_ROOT/contracts" && npx hardhat run --network localhost scripts/generate_compose.js)

# Run Anchor tests (this includes the e2e_from_evm.test which consumes compose.json)
echo "Running Anchor tests..."
(cd "$REPO_ROOT" && anchor test)

echo "E2E run completed successfully ✅"

# Normal exit will trigger cleanup trap which stops the hardhat node if started
