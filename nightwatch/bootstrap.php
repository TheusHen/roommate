<?php
// Minimal bootstrap for testing

// Mock the Laravel framework functions that are needed
if (!function_exists('env')) {
    function env($key, $default = null) {
        $value = getenv($key);
        return $value !== false ? $value : $default;
    }
}

if (!function_exists('response')) {
    function response() {
        return new class {
            public function json($data, $status = 200) {
                return new class($data, $status) {
                    private $data;
                    private $status;
                    
                    public function __construct($data, $status) {
                        $this->data = $data;
                        $this->status = $status;
                    }
                    
                    public function getContent() {
                        return json_encode($this->data);
                    }
                    
                    public function getStatusCode() {
                        return $this->status;
                    }
                };
            }
        };
    }
}

// Mock minimal validation exception
if (!class_exists('Illuminate\Validation\ValidationException')) {
    class ValidationException extends Exception {}
    class_alias('ValidationException', 'Illuminate\Validation\ValidationException');
}

// Load our mock classes
require_once 'PHPUnit/Framework/MockObject/MockObject.php';
require_once 'Illuminate/Http/Request.php';
require_once 'Illuminate/Routing/Controller.php';
require_once 'GuzzleHttp/Client.php';

// Load the actual controller
require_once 'Http/Controllers/NightwatchController.php';

// Simple autoloader for our classes
spl_autoload_register(function ($class) {
    $prefix = 'Nightwatch\\';
    $base_dir = __DIR__ . '/';
    
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    
    if (file_exists($file)) {
        require $file;
    }
});
