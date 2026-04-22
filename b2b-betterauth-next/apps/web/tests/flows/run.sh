#!/usr/bin/env bash
# Flow test runner — spawns one Claude agent per flow file
# Outputs JSON results to stdout. Exit code 0 = all pass, 1 = any fail.
# Usage: ./run.sh [file.yaml ...]
# If no files given, runs all *.yaml in this directory.

set -euo pipefail
cd "$(dirname "$0")"

FLOW_DIR="$(pwd)"
APP_DIR="$(cd ../../../.. && pwd)"
MAX_CONCURRENT=4

# Load env from .env.local (same vars the app uses)
if [[ -f "${APP_DIR}/.env.local" ]]; then
  set -a
  eval "$(grep -v '^\s*#' "${APP_DIR}/.env.local" | grep -v '^\s*$')"
  set +a
fi

BASE_URL="${BASE_URL:-http://localhost:3000}"
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:54329/saasy}"

# ─── Seed fixtures ─────────────────────────────────────────
FIXTURES_FILE="${FLOW_DIR}/fixtures.json"

if [[ ! -f "$FIXTURES_FILE" ]] || [[ "${SEED:-1}" == "1" ]]; then
  >&2 echo "[seed] running seed.sh..."
  bash "${FLOW_DIR}/seed.sh"
  >&2 echo ""
fi

FIXTURES=$(cat "$FIXTURES_FILE" 2>/dev/null || echo "{}")

RESULT_SCHEMA='{
  "type": "object",
  "properties": {
    "file": { "type": "string" },
    "results": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "pass": { "type": "boolean" },
          "reason": { "type": "string" },
          "screenshot": { "type": "string" }
        },
        "required": ["path", "pass"]
      }
    }
  },
  "required": ["file", "results"]
}'

# Collect flow files
if [[ $# -gt 0 ]]; then
  FILES=("$@")
else
  FILES=(*.yaml)
fi

RESULTS_DIR=$(mktemp -d)
LOG_DIR="${RESULTS_DIR}/logs"
mkdir -p "$LOG_DIR"
PIDS=()
RUNNING=0

>&2 echo "=== Flow Test Runner ==="
>&2 echo "  base_url:  $BASE_URL"
>&2 echo "  db:        $DATABASE_URL"
>&2 echo "  files:     ${FILES[*]}"
>&2 echo "  results:   $RESULTS_DIR"
>&2 echo ""

prompt_for_file() {
  local flow_file="$1"
  local filename=$(basename "$flow_file" .yaml)

  cat <<PROMPT
You are a flow test runner. Read the flow file at ${FLOW_DIR}/${flow_file} and execute its paths.

## Environment
- Base URL: ${BASE_URL}
- Database: ${DATABASE_URL}

## Test Fixtures
Pre-seeded test data (from seed.sh):
\`\`\`json
${FIXTURES}
\`\`\`
Use the seeded user/workspace for paths that need an existing paid plan.

## Rules
- You are a reporter, not a debugger.
- Walk each path, record what happens, report results.
- Do NOT investigate failures, retry actions, read source code, or attempt fixes.
- On failure: report expected vs actual, screenshot, move to next path.

## Tools
All interaction is via agent-browser CLI through Bash:
- agent-browser open <url> — navigate to URL
- agent-browser snapshot — accessibility tree (use to find @refs and verify elements)
- agent-browser click @ref — click an element
- agent-browser fill @ref "text" — fill an input field
- agent-browser get url — get current URL (use to verify redirects)
- agent-browser screenshot <path> — capture screenshot

Additional tools:
- psql — query or verify database state
- stripe — Stripe CLI for verifying live Stripe state (e.g. stripe subscriptions retrieve <id>)

## Flow-Specific Instructions
$(sed -n '/^instructions: |/,/^[^ ]/{ /^instructions: |/d; /^[^ ]/d; s/^  //; p; }' "${FLOW_DIR}/${flow_file}")

## Auth
To sign in, use OTP flow with email. After requesting OTP, get the code from the DB:
psql "${DATABASE_URL}" -t -A -c "SELECT split_part(value, ':', 1) FROM auth.verifications WHERE identifier = 'sign-in-otp-{email}' ORDER BY created_at DESC LIMIT 1;"
Replace {email} with the actual email used.

## Hygiene
- Run agent-browser close at the end of every test run
- If reusing a browser between paths, run agent-browser close then agent-browser open for a clean session

## Procedure
For each path in the flow file:
1. Set up preconditions (sign in as the fixture user if needed)
2. For each page in the sequence:
   a. If there's an action: execute it (click, fill+click, etc.)
   b. If page is auto: wait up to 5s, check URL with agent-browser get url
   c. If action is direct: use agent-browser open ${BASE_URL}<path>
   d. Run agent-browser snapshot
   e. Check each expects entry exists in the snapshot
   f. If any missing: agent-browser screenshot /tmp/flow-${filename}-{page}.png, record failure
3. After verifying UI state, also verify DB and/or Stripe state where applicable
4. Move to next path

## Variables
- {{run_id}} — generate a short random string (e.g. 6 hex chars) at the start of the run
- {{last_email}} — remember the email used in the most recent sign-up action

## Output
Return results for file "${flow_file}". Each path gets a result with pass/fail and reason if failed.
PROMPT
}

# Run agents
for file in "${FILES[@]}"; do
  while [[ $RUNNING -ge $MAX_CONCURRENT ]]; do
    for i in "${!PIDS[@]}"; do
      if ! kill -0 "${PIDS[$i]}" 2>/dev/null; then
        wait "${PIDS[$i]}" || true
        unset 'PIDS[$i]'
        RUNNING=$((RUNNING - 1))
      fi
    done
    sleep 1
  done

  filename=$(basename "$file" .yaml)
  result_file="${RESULTS_DIR}/${filename}.json"
  log_file="${LOG_DIR}/${filename}.log"
  >&2 echo "[run] $file → log: $log_file"

  prompt_file="${RESULTS_DIR}/${filename}.prompt"
  prompt_for_file "$file" > "$prompt_file"

  if [[ ! -s "$prompt_file" ]]; then
    >&2 echo "[ERROR] $file — prompt generation failed"
    echo "{\"file\": \"${file}\", \"results\": [{\"path\": \"_error\", \"pass\": false, \"reason\": \"Prompt generation failed\"}]}" > "$result_file"
    continue
  fi

  >&2 echo "  prompt: $(wc -c < "$prompt_file") bytes"

  (
    claude --print \
      --output-format json \
      --json-schema "$RESULT_SCHEMA" \
      --allowedTools "Bash(agent-browser:*) Bash(psql:*) Bash(stripe:*) Bash(openssl:*) Bash(python3:*) Read" \
      < "$prompt_file" \
      > "$result_file" 2>"$log_file"
    exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
      >&2 echo "[ERROR] $file — claude exited with code $exit_code"
    fi
  ) &
  PIDS+=($!)
  RUNNING=$((RUNNING + 1))
done

>&2 echo ""
>&2 echo "[wait] all agents running, waiting for completion..."
>&2 echo "       tail -f ${LOG_DIR}/*.log to follow progress"
>&2 echo ""

# Wait for all
for pid in "${PIDS[@]}"; do
  wait "$pid" || true
done

>&2 echo "[done] all agents finished"
>&2 echo ""

# Assemble final JSON array and determine exit code
HAS_FAILURE=0
echo "["
FIRST=1
for file in "${FILES[@]}"; do
  filename=$(basename "$file" .yaml)
  result_file="${RESULTS_DIR}/${filename}.json"

  [[ $FIRST -eq 0 ]] && echo ","
  FIRST=0

  if [[ -s "$result_file" ]]; then
    # --output-format json puts structured data in "structured_output"
    if python3 -c "
import json, sys
data = json.load(open('${result_file}'))
inner = data.get('structured_output', data.get('result', data))
json.dump(inner, sys.stdout, indent=2)
has_fail = not all(r.get('pass', False) for r in inner.get('results', []))
sys.exit(1 if has_fail else 0)
" 2>/dev/null; then
      >&2 echo "[PASS] $file"
    else
      >&2 echo "[FAIL] $file"
      HAS_FAILURE=1
    fi
  else
    echo "{\"file\": \"${file}\", \"results\": [{\"path\": \"_error\", \"pass\": false, \"reason\": \"Agent produced no output\"}]}"
    >&2 echo "[ERROR] $file — no output (see ${LOG_DIR}/${filename}.log)"
    HAS_FAILURE=1
  fi
done
echo ""
echo "]"

exit $HAS_FAILURE
