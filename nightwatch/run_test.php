<?php
require_once 'bootstrap.php';

// Load PHPUnit-style test
require_once 'tests/NightwatchControllerTest.php';

// Simple test runner
class SimpleTestRunner
{
    private $tests = [];
    private $passed = 0;
    private $failed = 0;

    public function runTestClass($className)
    {
        $reflection = new ReflectionClass($className);
        $methods = $reflection->getMethods(ReflectionMethod::IS_PUBLIC);
        
        echo "Running {$className} Tests...\n";
        echo str_repeat("=", 50) . "\n";

        $instance = new $className();
        
        // Run setUp if it exists
        if (method_exists($instance, 'setUp')) {
            $method = $reflection->getMethod('setUp');
            if ($method->isPublic() || $method->isProtected()) {
                $method->setAccessible(true);
                $method->invoke($instance);
            }
        }

        foreach ($methods as $method) {
            if (strpos($method->getName(), 'test') === 0) {
                $this->runTestMethod($instance, $method->getName());
            }
        }

        echo str_repeat("=", 50) . "\n";
        echo "Passed: {$this->passed}, Failed: {$this->failed}\n";
        
        return $this->failed === 0;
    }
    
    private function runTestMethod($instance, $methodName)
    {
        try {
            $instance->$methodName();
            $this->passed++;
            echo "✓ $methodName\n";
        } catch (Exception $e) {
            $this->failed++;
            echo "✗ $methodName - {$e->getMessage()}\n";
        }
    }
}

// Create test runner and run the test class
$runner = new SimpleTestRunner();
$success = $runner->runTestClass('NightwatchControllerTest');
exit($success ? 0 : 1);