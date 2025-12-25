#!/bin/bash

# Script to compare actual test names between MapML source and Stencil gcds-map
# Compares test descriptions only, not file structure

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=================================="
echo "Test Name Comparison"
echo "=================================="
echo ""

# Create temp directory for output files
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo "Step 1: Listing all Stencil tests (including skipped)..."
npx playwright test --list 2>&1 | \
  grep "›" | \
  sed 's/.*› //' | \
  sed 's/^[[:space:]]*//' | \
  sort > "$TEMP_DIR/stencil-raw-tests.txt"

echo "Step 2: Listing all MapML source tests (including skipped)..."
cd src/mapml-source
npx playwright test --list 2>&1 | \
  grep "›" | \
  sed 's/.*› //' | \
  sed 's/^[[:space:]]*//' | \
  sort > "$TEMP_DIR/mapml-raw-tests.txt"
cd ../..

echo "Step 3: Filtering out web-map tests from MapML..."
# Keep only tests that don't mention web-map or "Tests for map"
grep -v "web-map" "$TEMP_DIR/mapml-raw-tests.txt" | \
  grep -v "Tests for map" > "$TEMP_DIR/mapml-filtered.txt" || true

echo "Step 4: Normalizing test names..."

# Normalize by removing element-specific prefixes
# This makes "mapml-viewer should zoom" and "gcds-map should zoom" comparable
normalize_test_name() {
  sed 's/mapml-viewer/MAP_ELEMENT/g' | \
  sed 's/gcds-map/MAP_ELEMENT/g' | \
  sed 's/<mapml-viewer>/<MAP_ELEMENT>/g' | \
  sed 's/<gcds-map>/<MAP_ELEMENT>/g' | \
  sed 's/map-viewer/MAP_ELEMENT/g'
}

cat "$TEMP_DIR/stencil-raw-tests.txt" | normalize_test_name | sort -u > "$TEMP_DIR/stencil-normalized.txt"
cat "$TEMP_DIR/mapml-filtered.txt" | normalize_test_name | sort -u > "$TEMP_DIR/mapml-normalized.txt"

echo "Step 5: Comparing test names..."
echo ""

TOTAL_MAPML=$(wc -l < "$TEMP_DIR/mapml-normalized.txt")
TOTAL_STENCIL=$(wc -l < "$TEMP_DIR/stencil-normalized.txt")
COMMON=$(comm -12 "$TEMP_DIR/mapml-normalized.txt" "$TEMP_DIR/stencil-normalized.txt" | wc -l)
MISSING=$(comm -23 "$TEMP_DIR/mapml-normalized.txt" "$TEMP_DIR/stencil-normalized.txt" | wc -l)
NEW=$(comm -13 "$TEMP_DIR/mapml-normalized.txt" "$TEMP_DIR/stencil-normalized.txt" | wc -l)

echo "=================================="
echo "SUMMARY"
echo "=================================="
echo "Total MapML viewer test cases: $TOTAL_MAPML"
echo "Total Stencil gcds-map test cases: $TOTAL_STENCIL"
echo "Common tests (ported): $COMMON"
echo "Tests missing in Stencil: $MISSING"
echo "New tests in Stencil: $NEW"
if [ $TOTAL_MAPML -gt 0 ]; then
  echo "Coverage: $(awk "BEGIN {printf \"%.1f\", ($COMMON/$TOTAL_MAPML)*100}")%"
fi
echo ""

# Generate detailed report
cat > test-names-comparison.txt << EOF
Test Name Comparison Report
Generated: $(date)
================================

SUMMARY:
--------
MapML viewer test cases: $TOTAL_MAPML
Stencil gcds-map test cases: $TOTAL_STENCIL
Tests ported: $COMMON
Tests missing in Stencil: $MISSING
New tests in Stencil: $NEW
Coverage: $(awk "BEGIN {printf \"%.1f\", ($COMMON/$TOTAL_MAPML)*100}")%

COMMON TESTS (Already Ported):
-------------------------------
EOF

comm -12 "$TEMP_DIR/mapml-normalized.txt" "$TEMP_DIR/stencil-normalized.txt" >> test-names-comparison.txt

cat >> test-names-comparison.txt << EOF

TESTS MISSING IN STENCIL (Need to Port):
-----------------------------------------
EOF

comm -23 "$TEMP_DIR/mapml-normalized.txt" "$TEMP_DIR/stencil-normalized.txt" >> test-names-comparison.txt

cat >> test-names-comparison.txt << EOF

NEW TESTS IN STENCIL (Not in MapML):
-------------------------------------
EOF

comm -13 "$TEMP_DIR/mapml-normalized.txt" "$TEMP_DIR/stencil-normalized.txt" >> test-names-comparison.txt

# Also save the raw lists for manual inspection
cat > test-names-raw-lists.txt << EOF
Raw Test Lists for Manual Inspection
=====================================

MAPML VIEWER TESTS (normalized):
---------------------------------
EOF
cat "$TEMP_DIR/mapml-normalized.txt" >> test-names-raw-lists.txt

cat >> test-names-raw-lists.txt << EOF

STENCIL GCDS-MAP TESTS (normalized):
-------------------------------------
EOF
cat "$TEMP_DIR/stencil-normalized.txt" >> test-names-raw-lists.txt

echo "=================================="
if [ $MISSING -gt 0 ]; then
    echo "SAMPLE: Tests Missing in Stencil"
    echo "=================================="
    comm -23 "$TEMP_DIR/mapml-normalized.txt" "$TEMP_DIR/stencil-normalized.txt" | head -20
    if [ $MISSING -gt 20 ]; then
        echo "... and $((MISSING - 20)) more"
    fi
    echo ""
fi

if [ $NEW -gt 0 ]; then
    echo "=================================="
    echo "SAMPLE: New Tests in Stencil"
    echo "=================================="
    comm -13 "$TEMP_DIR/mapml-normalized.txt" "$TEMP_DIR/stencil-normalized.txt" | head -20
    if [ $NEW -gt 20 ]; then
        echo "... and $((NEW - 20)) more"
    fi
    echo ""
fi

echo "=================================="
echo "Reports saved:"
echo "  - test-names-comparison.txt (summary + categorized lists)"
echo "  - test-names-raw-lists.txt (full raw lists for manual review)"
echo ""
echo "Done!"
