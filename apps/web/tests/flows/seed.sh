#!/usr/bin/env bash
# Flow test seed — provisions Stripe test fixtures and matching DB rows.
# Run once before the flow runner. Outputs a JSON fixtures file.
#
# Usage: ./seed.sh
# Requires: stripe CLI (authenticated in test mode), psql, DATABASE_URL
#
# Creates:
#   - A test user + workspace (if not exists)
#   - A Stripe customer linked to the workspace
#   - A Pro subscription (active) for upgrade/downgrade/cancel tests
#   - An invoice via the subscription for invoice pagination tests
#
# Outputs: fixtures.json with IDs for use by flow tests

set -euo pipefail
cd "$(dirname "$0")"

APP_DIR="$(cd ../../.. && pwd)"

# Load env
if [[ -f "${APP_DIR}/.env.local" ]]; then
  set -a
  source <(grep -v '^\s*#' "${APP_DIR}/.env.local" | grep -v '^\s*$')
  set +a
fi

DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:54329/saasy}"
FIXTURES_FILE="$(pwd)/fixtures.json"

# ─── Config ────────────────────────────────────────────────

SEED_EMAIL="billing-test@example.com"
SEED_USER_NAME="Billing Test User"
SEED_WORKSPACE_NAME="billing-test-ws"
SEED_WORKSPACE_SLUG="billing-test-ws"

>&2 echo "=== Flow Test Seed ==="
>&2 echo "  db:     $DATABASE_URL"
>&2 echo "  email:  $SEED_EMAIL"
>&2 echo ""

# ─── Helpers ───────────────────────────────────────────────

sql() {
  psql "$DATABASE_URL" -t -A -c "$1"
}

sql_single() {
  local result
  result=$(psql "$DATABASE_URL" -t -A --no-align -c "$1" 2>/dev/null | head -1)
  if [[ -z "$result" ]]; then
    return 1
  fi
  echo "$result"
}

# ─── Ensure user ──────────────────────────────────────────

>&2 echo "[seed] ensuring test user..."
USER_ID=$(sql_single "SELECT id FROM auth.users WHERE email = '${SEED_EMAIL}';" 2>/dev/null || true)

if [[ -z "$USER_ID" ]]; then
  USER_ID=$(sql_single "
    INSERT INTO auth.users (name, email, email_verified)
    VALUES ('${SEED_USER_NAME}', '${SEED_EMAIL}', true)
    RETURNING id;
  ")
  >&2 echo "  created user: $USER_ID"
else
  >&2 echo "  exists: $USER_ID"
fi

# ─── Ensure workspace ────────────────────────────────────

>&2 echo "[seed] ensuring test workspace..."
WORKSPACE_ID=$(sql_single "SELECT id FROM auth.workspaces WHERE slug = '${SEED_WORKSPACE_SLUG}';" 2>/dev/null || true)

if [[ -z "$WORKSPACE_ID" ]]; then
  WORKSPACE_ID=$(sql_single "
    INSERT INTO auth.workspaces (name, slug, metadata)
    VALUES ('${SEED_WORKSPACE_NAME}', '${SEED_WORKSPACE_SLUG}', '{}')
    RETURNING id;
  ")
  >&2 echo "  created workspace: $WORKSPACE_ID"

  # Add user as admin (owner role)
  sql "
    INSERT INTO auth.memberships (user_id, workspace_id, role)
    VALUES ('${USER_ID}', '${WORKSPACE_ID}', 'admin')
    ON CONFLICT DO NOTHING;
  " >/dev/null
  >&2 echo "  added user as admin"
else
  >&2 echo "  exists: $WORKSPACE_ID"
fi

# ─── Stripe customer ─────────────────────────────────────

>&2 echo "[seed] ensuring Stripe customer..."
STRIPE_CUSTOMER_ID=$(sql_single "
  SELECT provider_customer_id FROM billing.customers
  WHERE workspace_id = '${WORKSPACE_ID}' AND provider = 'stripe';
" 2>/dev/null || true)

if [[ -z "$STRIPE_CUSTOMER_ID" ]]; then
  STRIPE_CUSTOMER_ID=$(stripe customers create \
    --name "$SEED_WORKSPACE_NAME" \
    --metadata[workspaceId]="$WORKSPACE_ID" \
    --metadata[slug]="$SEED_WORKSPACE_SLUG" \
    -d "idempotency_key=seed:${WORKSPACE_ID}" \
    2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")

  sql "
    INSERT INTO billing.customers (workspace_id, provider, provider_customer_id)
    VALUES ('${WORKSPACE_ID}', 'stripe', '${STRIPE_CUSTOMER_ID}')
    ON CONFLICT DO NOTHING;
  " >/dev/null
  >&2 echo "  created: $STRIPE_CUSTOMER_ID"
else
  >&2 echo "  exists: $STRIPE_CUSTOMER_ID"
fi

# ─── Stripe subscription (Pro) ───────────────────────────

>&2 echo "[seed] ensuring Pro subscription..."

# Check if there's already an active subscription in Stripe for this customer
EXISTING_SUB_ID=$(stripe subscriptions list \
  --customer "$STRIPE_CUSTOMER_ID" \
  --status active \
  --limit 1 \
  2>/dev/null | python3 -c "
import json, sys
data = json.load(sys.stdin)['data']
print(data[0]['id'] if data else '')
" 2>/dev/null || true)

if [[ -z "$EXISTING_SUB_ID" ]]; then
  # Cancel any non-active subs first
  stripe subscriptions list \
    --customer "$STRIPE_CUSTOMER_ID" \
    --limit 10 \
    2>/dev/null | python3 -c "
import json, sys
for s in json.load(sys.stdin)['data']:
    if s['status'] not in ('canceled',):
        print(s['id'])
" 2>/dev/null | while read -r sid; do
    stripe subscriptions cancel "$sid" 2>/dev/null >/dev/null || true
  done

  # Create a new Pro subscription
  SUB_JSON=$(stripe subscriptions create \
    --customer "$STRIPE_CUSTOMER_ID" \
    -d "items[0][price]=${STRIPE_PRICE_PRO}" \
    2>/dev/null)

  SUB_ID=$(echo "$SUB_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
  >&2 echo "  created: $SUB_ID"
else
  SUB_ID="$EXISTING_SUB_ID"
  >&2 echo "  exists: $SUB_ID"
fi

# Sync subscription to local DB
SUB_DATA=$(stripe subscriptions retrieve "$SUB_ID" 2>/dev/null)
python3 -c "
import json, sys, subprocess

sub = json.load(sys.stdin)
item = sub['items']['data'][0]

sql = '''
INSERT INTO billing.subscriptions (
  workspace_id, customer_id, provider, provider_subscription_id,
  provider_price_id, plan, plan_version, status, interval,
  current_period_start, current_period_end, cancel_at_period_end
)
SELECT
  '${WORKSPACE_ID}',
  c.id,
  'stripe',
  '{sid}',
  '{price_id}',
  'pro',
  1,
  '{status}',
  '{interval}',
  to_timestamp({period_start}),
  to_timestamp({period_end}),
  {cancel}
FROM billing.customers c
WHERE c.workspace_id = '${WORKSPACE_ID}' AND c.provider = 'stripe'
ON CONFLICT (provider_subscription_id)
DO UPDATE SET
  provider_price_id = EXCLUDED.provider_price_id,
  plan = EXCLUDED.plan,
  status = EXCLUDED.status,
  current_period_start = EXCLUDED.current_period_start,
  current_period_end = EXCLUDED.current_period_end,
  cancel_at_period_end = EXCLUDED.cancel_at_period_end,
  updated_at = now();
'''.format(
    sid=sub['id'],
    price_id=item['price']['id'],
    status=sub['status'],
    interval=item['price'].get('recurring', {}).get('interval', 'month'),
    period_start=item['current_period_start'],
    period_end=item['current_period_end'],
    cancel='true' if sub['cancel_at_period_end'] else 'false',
)

subprocess.run(['psql', '${DATABASE_URL}', '-c', sql], capture_output=True, check=True)
" <<< "$SUB_DATA"
>&2 echo "  synced to DB"

# ─── Write fixtures ──────────────────────────────────────

python3 -c "
import json
fixtures = {
    'user': {
        'id': '${USER_ID}',
        'email': '${SEED_EMAIL}',
        'name': '${SEED_USER_NAME}',
    },
    'workspace': {
        'id': '${WORKSPACE_ID}',
        'name': '${SEED_WORKSPACE_NAME}',
        'slug': '${SEED_WORKSPACE_SLUG}',
    },
    'stripe': {
        'customerId': '${STRIPE_CUSTOMER_ID}',
        'subscriptionId': '${SUB_ID}',
        'plan': 'pro',
    },
}
print(json.dumps(fixtures, indent=2))
" > "$FIXTURES_FILE"

>&2 echo ""
>&2 echo "[done] fixtures written to $FIXTURES_FILE"
>&2 echo ""
cat "$FIXTURES_FILE" >&2
