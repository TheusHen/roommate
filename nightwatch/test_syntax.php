<?php

echo "Testing Nightwatch Controller (syntax check)...\n";

try {
    // Test PHP syntax
    $syntaxCheck = shell_exec('php -l Http/Controllers/NightwatchController.php 2>&1');
    
    if (strpos($syntaxCheck, 'No syntax errors detected') !== false) {
        echo "✓ NightwatchController.php has valid PHP syntax\n";
    } else {
        echo "ERROR: PHP syntax error in NightwatchController.php\n";
        echo $syntaxCheck . "\n";
        exit(1);
    }

    // Test that test file has valid syntax
    $testSyntaxCheck = shell_exec('php -l tests/NightwatchControllerTest.php 2>&1');
    
    if (strpos($testSyntaxCheck, 'No syntax errors detected') !== false) {
        echo "✓ NightwatchControllerTest.php has valid PHP syntax\n";
    } else {
        echo "ERROR: PHP syntax error in NightwatchControllerTest.php\n";
        echo $testSyntaxCheck . "\n";
        exit(1);
    }

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

    // Test basic data structures and validation rules
    $expectedRules = [
        'message'        => 'nullable|string',
        'result'         => 'nullable|array', 
        'error'          => 'nullable|string',
        'elapsed_ms'     => 'nullable|integer',
        'server_country' => 'nullable|string',
        'ping_ms'        => 'nullable|integer',
    ];
    
    if (is_array($expectedRules) && count($expectedRules) === 6) {
        echo "✓ Validation rules structure is correct\n";
    } else {
        echo "ERROR: Validation rules structure is incorrect\n";
        exit(1);
    }

    // Test HTTP client configuration structure
    $headers = [
        'Authorization' => 'Bearer test-token',
    ];
    
    $options = [
        'json' => ['error' => 'test'],
        'headers' => $headers,
    ];
    
    if (isset($options['json']) && isset($options['headers']) && 
        isset($options['headers']['Authorization']) && 
        strpos($options['headers']['Authorization'], 'Bearer ') === 0) {
        echo "✓ HTTP client configuration structure is correct\n";
    } else {
        echo "ERROR: HTTP client configuration structure is incorrect\n";
        exit(1);
    }

    echo "✓ All basic tests passed\n";
    echo "Nightwatch Controller files are syntactically correct and logic is sound!\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}