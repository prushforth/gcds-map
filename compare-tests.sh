#!/bin/bash

# Script to compare test coverage between MapML source and Stencil gcds-map
# This helps identify which tests have been ported and which are missing

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=================================="
echo "Test Coverage Comparison"
echo "=================================="
echo ""

# Create temp directory for output files
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo "Step 1: Listing Stencil tests..."
npx playwright test --list --reporter=line 2>&1 | \
  grep -E "\.e2e\.ts:" | \
  sed 's/^[[:space:]]*//' | \
  sort > "$TEMP_DIR/stencil-raw.txt"

echo "Step 2: Listing MapML source tests..."
cd src/mapml-source
npx playwright test --list --reporter=line 2>&1 | \
  grep -E "\.test\.js:" | \
  sed 's/^[[:space:]]*//' | \
  sort > "$TEMP_DIR/mapml-raw.txt"
cd ../..

echo "Step 3: Filtering mapml-viewer tests (excluding web-map)..."
grep -v "web-map" "$TEMP_DIR/mapml-raw.txt" | \
  grep -v "Tests for map" > "$TEMP_DIR/mapml-viewer.txt" || true

echo "Step 4: Extracting test file names..."

# Extract just the test file names without paths
sed 's/.*\/\([^/]*\)\.e2e\.ts:.*/\1/' "$TEMP_DIR/stencil-raw.txt" | \
  sort -u > "$TEMP_DIR/stencil-files.txt"

sed 's/.*\/\([^/]*\)\.test\.js:.*/\1/' "$TEMP_DIR/mapml-viewer.txt" | \
  sort -u > "$TEMP_DIR/mapml-files.txt"

echo "Step 5: Analyzing coverage..."
echo ""

TOTAL_MAPML=$(wc -l < "$TEMP_DIR/mapml-files.txt")
TOTAL_STENCIL=$(wc -l < "$TEMP_DIR/stencil-files.txt")
COMMON=$(comm -12 "$TEMP_DIR/mapml-files.txt" "$TEMP_DIR/stencil-files.txt" | wc -l)
MISSING=$(comm -23 "$TEMP_DIR/mapml-files.txt" "$TEMP_DIR/stencil-files.txt" | wc -l)

echo "=================================="
echo "SUMMARY"
echo "=================================="
echo "Total mapml-viewer test files: $TOTAL_MAPML"
echo "Total gcds-map test files: $TOTAL_STENCIL"
echo "Tests ported: $COMMON"
echo "Tests missing in Stencil: $MISSING"
echo "Coverage: $(awk "BEGIN {printf \"%.1f\", ($COMMON/$TOTAL_MAPML)*100}")%"
echo ""

if [ $MISSING -gt 0 ]; then
    echo "=================================="
    echo "TESTS MISSING IN STENCIL"
    echo "=================================="
    comm -23 "$TEMP_DIR/mapml-files.txt" "$TEMP_DIR/stencil-files.txt" | \
      while read test; do
        # Find the full path in mapml source
        grep "$test\.test\.js" "$TEMP_DIR/mapml-viewer.txt" | head -1 | \
          sed 's/test\/e2e\///' | sed 's/\.test\.js.*//'
      done
    echo ""
fi

NEW_TESTS=$(comm -13 "$TEMP_DIR/mapml-files.txt" "$TEMP_DIR/stencil-files.txt" | wc -l)
if [ $NEW_TESTS -gt 0 ]; then
    echo "=================================="
    echo "NEW TESTS IN STENCIL (not in MapML)"
    echo "=================================="
    comm -13 "$TEMP_DIR/mapml-files.txt" "$TEMP_DIR/stencil-files.txt"
    echo ""
fi

echo "=================================="
echo "DETAILED TEST COMPARISON"
echo "=================================="
echo "Generating detailed comparison files..."

# Generate detailed comparison
cat > test-comparison-report.txt << EOF
Test Coverage Comparison Report
Generated: $(date)
================================

SUMMARY:
--------
MapML viewer tests: $TOTAL_MAPML
Stencil gcds-map tests: $TOTAL_STENCIL
Tests ported: $COMMON ($((COMMON*100/TOTAL_MAPML))%)
Tests missing: $MISSING

TESTS ALREADY PORTED:
---------------------
EOF

comm -12 "$TEMP_DIR/mapml-files.txt" "$TEMP_DIR/stencil-files.txt" >> test-comparison-report.txt

cat >> test-comparison-report.txt << EOF

TESTS MISSING IN STENCIL (need to port):
-----------------------------------------
EOF

comm -23 "$TEMP_DIR/mapml-files.txt" "$TEMP_DIR/stencil-files.txt" >> test-comparison-report.txt

cat >> test-comparison-report.txt << EOF

NEW TESTS IN STENCIL (not in MapML):
-------------------------------------
EOF

comm -13 "$TEMP_DIR/mapml-files.txt" "$TEMP_DIR/stencil-files.txt" >> test-comparison-report.txt

echo ""
echo "Full report saved to: test-comparison-report.txt"
echo ""
echo "Done!"
