<?php

namespace PHPUnit\Framework;

class TestCase {
    protected function setUp(): void {}
    
    protected function assertTrue($condition, $message = '') {
        if (!$condition) {
            throw new \Exception($message ?: 'Assertion failed: expected true');
        }
    }
    
    protected function assertEquals($expected, $actual, $message = '') {
        if ($expected !== $actual) {
            throw new \Exception($message ?: "Expected '$expected', got '$actual'");
        }
    }
    
    protected function assertArrayHasKey($key, $array, $message = '') {
        if (!array_key_exists($key, $array)) {
            throw new \Exception($message ?: "Array does not have key '$key'");
        }
    }
    
    protected function assertIsArray($value, $message = '') {
        if (!is_array($value)) {
            throw new \Exception($message ?: 'Expected array');
        }
    }
    
    protected function assertIsString($value, $message = '') {
        if (!is_string($value)) {
            throw new \Exception($message ?: 'Expected string');
        }
    }
    
    protected function assertIsInt($value, $message = '') {
        if (!is_int($value)) {
            throw new \Exception($message ?: 'Expected integer');
        }
    }
    
    protected function assertCount($expectedCount, $haystack, $message = '') {
        $actual = count($haystack);
        if ($actual !== $expectedCount) {
            throw new \Exception($message ?: "Expected count $expectedCount, got $actual");
        }
    }
    
    protected function assertStringStartsWith($prefix, $string, $message = '') {
        if (strpos($string, $prefix) !== 0) {
            throw new \Exception($message ?: "String '$string' does not start with '$prefix'");
        }
    }
    
    protected function assertInstanceOf($expected, $actual, $message = '') {
        if (!($actual instanceof $expected)) {
            throw new \Exception($message ?: "Expected instance of $expected");
        }
    }
    
    protected function createMock($className) {
        return new \stdClass();
    }
}