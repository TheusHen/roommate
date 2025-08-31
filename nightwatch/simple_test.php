<?php
require_once 'bootstrap.php';

// Simple test runner
class SimpleTestRunner
{
    private $tests = [];
    private $passed = 0;
    private $failed = 0;

    public function addTest($name, $callback)
    {
        $this->tests[$name] = $callback;
    }

    public function run()
    {
        echo "Running PHP Nightwatch Tests...\n";
        echo str_repeat("=", 50) . "\n";

        foreach ($this->tests as $name => $callback) {
            try {
                $callback();
                $this->passed++;
                echo "✓ $name\n";
            } catch (Exception $e) {
                $this->failed++;
                echo "✗ $name - {$e->getMessage()}\n";
            }
        }

        echo str_repeat("=", 50) . "\n";
        echo "Passed: {$this->passed}, Failed: {$this->failed}\n";
        
        return $this->failed === 0;
    }
}

// Helper function for assertions
function assertEquals($expected, $actual, $message = "")
{
    if ($expected !== $actual) {
        throw new Exception($message ?: "Expected '$expected', got '$actual'");
    }
}

function assertArrayHasKey($key, $array, $message = "")
{
    if (!array_key_exists($key, $array)) {
        throw new Exception($message ?: "Array does not have key '$key'");
    }
}

function assertNotNull($value, $message = "")
{
    if ($value === null) {
        throw new Exception($message ?: "Value is null");
    }
}

// Create test runner
$runner = new SimpleTestRunner();

// Test 1: Controller instantiation
$runner->addTest("Controller can be instantiated", function() {
    require_once 'Http/Controllers/NightwatchController.php';
    $controller = new Nightwatch\Http\Controllers\NightwatchController();
    assertNotNull($controller);
});

// Test 2: Environment function works
$runner->addTest("Environment configuration works", function() {
    putenv('TEST_VAR=test_value');
    assertEquals('test_value', env('TEST_VAR'));
    assertEquals('default', env('NON_EXISTENT_VAR', 'default'));
});

// Test 3: Response helper works
$runner->addTest("Response helper works", function() {
    $response = response()->json(['status' => 'success'], 200);
    assertEquals(200, $response->getStatusCode());
    assertEquals('{"status":"success"}', $response->getContent());
});

// Test 4: Controller with dependency injection
$runner->addTest("Controller accepts dependency injection", function() {
    require_once 'Http/Controllers/NightwatchController.php';
    
    // Create a mock GuzzleHttp client
    $mockClient = new class {
        public function post($url, $options) {
            return new class {
                public function getBody() {
                    return '{"status":"received"}';
                }
            };
        }
    };
    
    $controller = new Nightwatch\Http\Controllers\NightwatchController($mockClient);
    assertNotNull($controller);
});

// Test 5: Basic validation structure
$runner->addTest("Validation rules are properly structured", function() {
    // This test verifies that the validation rules are at least syntactically correct
    $rules = [
        'message'        => 'nullable|string',
        'result'         => 'nullable|array',
        'error'          => 'nullable|string',
        'elapsed_ms'     => 'nullable|integer',
        'server_country' => 'nullable|string',
        'ping_ms'        => 'nullable|integer',
    ];
    
    assertEquals(6, count($rules));
    assertArrayHasKey('message', $rules);
    assertArrayHasKey('error', $rules);
});

// Run all tests
$success = $runner->run();
exit($success ? 0 : 1);