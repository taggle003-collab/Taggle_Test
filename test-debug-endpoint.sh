#!/bin/bash

# Test script for the debug endpoint
# Usage: ./test-debug-endpoint.sh [base_url] [country] [category]
#
# Examples:
#   ./test-debug-endpoint.sh http://localhost:3000 USA Tech
#   ./test-debug-endpoint.sh https://yourapp.vercel.app USA "Real Estate"

BASE_URL="${1:-http://localhost:3000}"
COUNTRY="${2:-USA}"
CATEGORY="${3:-Tech}"

echo "=========================================="
echo "Testing Debug Endpoint"
echo "=========================================="
echo "Base URL: $BASE_URL"
echo "Country: $COUNTRY"
echo "Category: $CATEGORY"
echo "=========================================="
echo ""

# Build the URL with query parameters
URL="$BASE_URL/api/leads/debug-search?country=$(echo "$COUNTRY" | jq -sRr @uri)&category=$(echo "$CATEGORY" | jq -sRr @uri)"

echo "Calling: $URL"
echo ""
echo "Response:"
echo "=========================================="

# Make the request with pretty-printed JSON
curl -s "$URL" | jq '.' || curl -s "$URL"

echo ""
echo "=========================================="
echo "Test complete!"
echo ""
echo "Next steps:"
echo "1. Review the diagnostic output above"
echo "2. Check for any errors in the response"
echo "3. Compare with regular endpoint: $BASE_URL/api/leads/search?country=$COUNTRY&category=$CATEGORY"
echo "=========================================="
