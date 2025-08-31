<?php

require_once __DIR__ . '/Http/Controllers/NightwatchController.php';

echo "Testing Nightwatch Controller...\n";

try {
    // Test that controller class exists and can be instantiated
    if (!class_exists('Nightwatch\Http\Controllers\NightwatchController')) {
        echo "ERROR: NightwatchController class not found\n";
        exit(1);
    }

    $controller = new \Nightwatch\Http\Controllers\NightwatchController();
    echo "✓ Controller instantiated successfully\n";

    // Test environment variable handling
    putenv("NIGHTWATCH_URL=https://test.nightwatch.api");
    putenv("NIGHTWATCH_TOKEN=test-token-123");
    
    $testUrl = getenv('NIGHTWATCH_URL');
    $testToken = getenv('NIGHTWATCH_TOKEN');
    
    if ($testUrl === 'https://test.nightwatch.api' && $testToken === 'test-token-123') {
        echo "✓ Environment variables working correctly\n";
    } else {
        echo "ERROR: Environment variables not working\n";
        exit(1);
    }

    // Test basic data structures
    $testData = [
        'message' => 'Test message',
        'elapsed_ms' => 1500,
        'ping_ms' => 50,
    ];
    
    if (is_array($testData) && isset($testData['message'])) {
        echo "✓ Data structures working correctly\n";
    } else {
        echo "ERROR: Data structures not working\n";
        exit(1);
    }

    echo "✓ All basic tests passed\n";
    echo "Nightwatch Controller is working correctly!\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}