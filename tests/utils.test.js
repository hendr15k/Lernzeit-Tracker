/**
 * @fileoverview Unit tests for utils functions
 * Run with: node tests/utils.test.js
 */

const fs = require('fs');
const path = require('path');

// Read and evaluate utils.js to make functions available in global scope
const utilsPath = path.join(__dirname, '../js/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');
eval(utilsCode);

const tests = {
    passed: 0,
    failed: 0,

    assert(condition, message) {
        if (condition) {
            console.log(`✅ PASS: ${message}`);
            this.passed++;
        } else {
            console.error(`❌ FAIL: ${message}`);
            this.failed++;
        }
    },

    assertEqual(actual, expected, message) {
        if (actual === expected) {
            console.log(`✅ PASS: ${message}`);
            this.passed++;
        } else {
            console.error(`❌ FAIL: ${message}\n   Expected: ${expected}\n   Actual:   ${actual}`);
            this.failed++;
        }
    },

    summary() {
        console.log(`\n${this.passed} passed, ${this.failed} failed`);
        return this.failed === 0;
    }
};

function runTests() {
    console.log('\n=== Utils Unit Tests ===\n');

    console.log('--- safeJsonParse ---');

    // Temporarily mock console.error to avoid spamming the test output with expected errors
    const originalConsoleError = console.error;
    console.error = () => {};

    try {
        // Valid JSON
        const validJsonStr = '{"key": "value", "num": 123}';
        const parsedValid = safeJsonParse(validJsonStr);
        tests.assertEqual(parsedValid.key, 'value', 'Should correctly parse valid JSON string');
        tests.assertEqual(parsedValid.num, 123, 'Should correctly parse valid JSON string numbers');

        // Invalid JSON without fallback
        const invalidJsonStr = '{invalid json}';
        const parsedInvalid = safeJsonParse(invalidJsonStr);
        tests.assertEqual(parsedInvalid, null, 'Should return null for invalid JSON when no fallback provided');

        // Invalid JSON with fallback
        const fallbackObj = { error: true, message: 'fallback' };
        const parsedInvalidFallback = safeJsonParse(invalidJsonStr, fallbackObj);
        tests.assertEqual(parsedInvalidFallback.error, true, 'Should return fallback object for invalid JSON');
        tests.assertEqual(parsedInvalidFallback.message, 'fallback', 'Should return fallback object for invalid JSON');

        // Empty string without fallback
        const parsedEmpty = safeJsonParse('');
        tests.assertEqual(parsedEmpty, null, 'Should return null for empty string when no fallback provided');

        // Null input without fallback
        const parsedNull = safeJsonParse(null);
        tests.assertEqual(parsedNull, null, 'Should return null for null input when no fallback provided');

        // Number input (should handle primitive correctly if stringified or if valid json)
        const parsedNum = safeJsonParse('42');
        tests.assertEqual(parsedNum, 42, 'Should return primitive number');

        // Array input
        const parsedArray = safeJsonParse('[1, 2, 3]');
        tests.assert(Array.isArray(parsedArray), 'Should return array');
        tests.assertEqual(parsedArray.length, 3, 'Array should have correct length');
        tests.assertEqual(parsedArray[0], 1, 'Array element should be correct');

    } finally {
        // Restore console.error
        console.error = originalConsoleError;
    }

    console.log('\n=== Test Summary ===');
    return tests.summary();
}

if (typeof module !== 'undefined' && require.main === module) {
    const success = runTests();
    process.exit(success ? 0 : 1);
}

module.exports = { runTests };
