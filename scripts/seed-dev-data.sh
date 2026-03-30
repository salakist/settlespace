#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${1:-http://localhost:5279/api}"

api_call() {
  local method="$1"
  local url="$2"
  local token="${3:-}"
  local body="${4:-}"

  if [[ -n "$body" ]]; then
    if [[ -n "$token" ]]; then
      curl -sS -X "$method" "$url" -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d "$body"
    else
      curl -sS -X "$method" "$url" -H "Content-Type: application/json" -d "$body"
    fi
  else
    if [[ -n "$token" ]]; then
      curl -sS -X "$method" "$url" -H "Authorization: Bearer $token"
    else
      curl -sS -X "$method" "$url"
    fi
  fi
}

ensure_session() {
  local first_name="$1"
  local last_name="$2"
  local password="$3"
  local username
  username="$(echo "$first_name.$last_name" | tr '[:upper:]' '[:lower:]')"

  local login_payload
  login_payload="{\"username\":\"$username\",\"password\":\"$password\"}"

  if ! response="$(api_call POST "$API_BASE_URL/auth/login" "" "$login_payload")"; then
    local register_payload
    register_payload="{\"firstName\":\"$first_name\",\"lastName\":\"$last_name\",\"password\":\"$password\",\"email\":\"$username@example.com\",\"addresses\":[]}"
    api_call POST "$API_BASE_URL/auth/register" "" "$register_payload" >/dev/null
    response="$(api_call POST "$API_BASE_URL/auth/login" "" "$login_payload")"
  fi

  echo "$response" | jq -r '.token'
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_cmd curl
require_cmd jq

echo "[seed] Starting data seeding against $API_BASE_URL"

john_token="$(ensure_session "John" "Doe" "Seed@Pass1")"
jane_token="$(ensure_session "Jane" "Smith" "Seed@Pass2")"

persons_json="$(api_call GET "$API_BASE_URL/persons" "$john_token")"

ensure_person() {
  local first_name="$1"
  local last_name="$2"
  local password="$3"
  local email="$4"

  local exists
  exists="$(echo "$persons_json" | jq -r --arg fn "$first_name" --arg ln "$last_name" '.[] | select(.firstName==$fn and .lastName==$ln) | .id' | head -n1)"
  if [[ -n "$exists" ]]; then
    return
  fi

  local payload
  payload="{\"firstName\":\"$first_name\",\"lastName\":\"$last_name\",\"password\":\"$password\",\"email\":\"$email\",\"addresses\":[]}"
  api_call POST "$API_BASE_URL/persons" "$john_token" "$payload" >/dev/null
  persons_json="$(api_call GET "$API_BASE_URL/persons" "$john_token")"
}

ensure_person "Alice" "Walker" "Seed@Pass3" "alice.walker@example.com"
ensure_person "Bob" "Taylor" "Seed@Pass4" "bob.taylor@example.com"

person_id() {
  local first_name="$1"
  local last_name="$2"
  echo "$persons_json" | jq -r --arg fn "$first_name" --arg ln "$last_name" '.[] | select(.firstName==$fn and .lastName==$ln) | .id' | head -n1
}

cleanup_seed_transactions() {
  local token="$1"
  local tx_ids
  tx_ids="$(api_call GET "$API_BASE_URL/transactions/me" "$token" | jq -r '.[] | select(.category=="SeedData") | .id')"
  while IFS= read -r tx_id; do
    [[ -z "$tx_id" ]] && continue
    api_call DELETE "$API_BASE_URL/transactions/$tx_id" "$token" >/dev/null
  done <<< "$tx_ids"
}

cleanup_seed_transactions "$john_token"
cleanup_seed_transactions "$jane_token"

john_id="$(person_id "John" "Doe")"
jane_id="$(person_id "Jane" "Smith")"
alice_id="$(person_id "Alice" "Walker")"
bob_id="$(person_id "Bob" "Taylor")"

now_iso() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

api_call POST "$API_BASE_URL/transactions" "$john_token" "{\"payerPersonId\":\"$john_id\",\"payeePersonId\":\"$jane_id\",\"amount\":18.5,\"currencyCode\":\"EUR\",\"transactionDateUtc\":\"$(now_iso)\",\"description\":\"Lunch split\",\"category\":\"SeedData\",\"status\":\"Completed\"}" >/dev/null
api_call POST "$API_BASE_URL/transactions" "$john_token" "{\"payerPersonId\":\"$john_id\",\"payeePersonId\":\"$alice_id\",\"amount\":42.0,\"currencyCode\":\"EUR\",\"transactionDateUtc\":\"$(now_iso)\",\"description\":\"Concert tickets\",\"category\":\"SeedData\",\"status\":\"Pending\"}" >/dev/null
api_call POST "$API_BASE_URL/transactions" "$jane_token" "{\"payerPersonId\":\"$jane_id\",\"payeePersonId\":\"$bob_id\",\"amount\":12.75,\"currencyCode\":\"EUR\",\"transactionDateUtc\":\"$(now_iso)\",\"description\":\"Taxi share\",\"category\":\"SeedData\",\"status\":\"Completed\"}" >/dev/null

john_count="$(api_call GET "$API_BASE_URL/transactions/me" "$john_token" | jq 'length')"
jane_count="$(api_call GET "$API_BASE_URL/transactions/me" "$jane_token" | jq 'length')"

echo "[seed] Persons available: $(echo "$persons_json" | jq 'length')"
echo "[seed] John involved transactions: $john_count"
echo "[seed] Jane involved transactions: $jane_count"
echo "[seed] Done"
