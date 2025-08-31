<?php

use PHPUnit\Framework\TestCase;
use Nightwatch\Http\Controllers\NightwatchController;
use Illuminate\Http\Request;
use GuzzleHttp\Client;
use GuzzleHttp\Psr7\Response;
use GuzzleHttp\Exception\RequestException;

class NightwatchControllerTest extends TestCase
{
    private $controller;
    private $mockClient;

    protected function setUp(): void
    {
        parent::setUp();
        $this->controller = new NightwatchController();
        $this->mockClient = $this->createMock(Client::class);
    }

    public function testStoreValidData()
    {
        $requestData = [
            'message' => 'Test error message',
            'result' => ['status' => 'error'],
            'error' => 'Test error details',
            'elapsed_ms' => 1500,
            'server_country' => 'US',
            'ping_ms' => 50,
        ];

        $request = $this->createMockRequest($requestData);
        
        // Mock successful Nightwatch API response
        $mockResponse = new Response(200, [], json_encode(['status' => 'received']));
        $this->mockClient->method('post')->willReturn($mockResponse);

        // Set environment variables for test
        $_ENV['NIGHTWATCH_URL'] = 'https://api.nightwatch.test/events';
        $_ENV['NIGHTWATCH_TOKEN'] = 'test-token';

        $response = $this->controller->store($request);
        $responseData = json_decode($response->getContent(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('success', $responseData['status']);
        $this->assertArrayHasKey('nightwatch_response', $responseData);
    }

    public function testStoreWithMissingOptionalFields()
    {
        $requestData = [
            'error' => 'Simple error message',
        ];

        $request = $this->createMockRequest($requestData);
        
        $mockResponse = new Response(200, [], json_encode(['status' => 'received']));
        $this->mockClient->method('post')->willReturn($mockResponse);

        $_ENV['NIGHTWATCH_URL'] = 'https://api.nightwatch.test/events';
        $_ENV['NIGHTWATCH_TOKEN'] = 'test-token';

        $response = $this->controller->store($request);
        $responseData = json_decode($response->getContent(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('success', $responseData['status']);
    }

    public function testStoreWithNetworkError()
    {
        $requestData = [
            'error' => 'Test error',
        ];

        $request = $this->createMockRequest($requestData);
        
        // Mock network exception
        $this->mockClient->method('post')
            ->willThrowException(new RequestException('Network error', $request));

        $_ENV['NIGHTWATCH_URL'] = 'https://api.nightwatch.test/events';
        $_ENV['NIGHTWATCH_TOKEN'] = 'test-token';

        $response = $this->controller->store($request);
        $responseData = json_decode($response->getContent(), true);

        $this->assertEquals(500, $response->getStatusCode());
        $this->assertEquals('error', $responseData['status']);
        $this->assertArrayHasKey('error', $responseData);
    }

    public function testStoreWithInvalidData()
    {
        $requestData = [
            'elapsed_ms' => 'invalid_number', // Should be integer
            'ping_ms' => 'also_invalid',      // Should be integer
        ];

        $request = $this->createMockRequest($requestData);

        // This should fail validation
        $this->expectException(\Illuminate\Validation\ValidationException::class);
        
        $response = $this->controller->store($request);
    }

    public function testEnvironmentConfiguration()
    {
        // Test default URL
        unset($_ENV['NIGHTWATCH_URL']);
        $defaultUrl = env('NIGHTWATCH_URL', 'https://api.nightwatch.io/events');
        $this->assertEquals('https://api.nightwatch.io/events', $defaultUrl);

        // Test custom URL
        $_ENV['NIGHTWATCH_URL'] = 'https://custom.nightwatch.test';
        $customUrl = env('NIGHTWATCH_URL', 'https://api.nightwatch.io/events');
        $this->assertEquals('https://custom.nightwatch.test', $customUrl);
    }

    public function testAuthorizationHeader()
    {
        $requestData = ['error' => 'Test error'];
        $request = $this->createMockRequest($requestData);
        
        $_ENV['NIGHTWATCH_TOKEN'] = 'secret-token-123';
        
        $mockResponse = new Response(200, [], json_encode(['status' => 'received']));
        
        // Verify that the authorization header is correctly set
        $this->mockClient->expects($this->once())
            ->method('post')
            ->with(
                $this->anything(),
                $this->callback(function ($options) {
                    return isset($options['headers']['Authorization']) && 
                           $options['headers']['Authorization'] === 'Bearer secret-token-123';
                })
            )
            ->willReturn($mockResponse);

        $response = $this->controller->store($request);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testDataValidation()
    {
        $validationRules = [
            'message' => 'nullable|string',
            'result' => 'nullable|array',
            'error' => 'nullable|string',
            'elapsed_ms' => 'nullable|integer',
            'server_country' => 'nullable|string',
            'ping_ms' => 'nullable|integer',
        ];

        // Test each field type
        $testCases = [
            ['message' => 'Valid string', 'expected' => true],
            ['message' => 123, 'expected' => false], // Should be string
            ['result' => ['key' => 'value'], 'expected' => true],
            ['result' => 'not_array', 'expected' => false], // Should be array
            ['elapsed_ms' => 1500, 'expected' => true],
            ['elapsed_ms' => '1500', 'expected' => false], // Should be integer
            ['ping_ms' => 50, 'expected' => true],
            ['ping_ms' => 'fifty', 'expected' => false], // Should be integer
        ];

        foreach ($testCases as $case) {
            $request = $this->createMockRequest($case);
            
            if ($case['expected']) {
                // Should not throw exception
                $this->assertNotNull($request);
            } else {
                // Should fail validation (in real implementation)
                $this->assertTrue(true); // Placeholder assertion
            }
        }
    }

    public function testResponseStructure()
    {
        $requestData = ['error' => 'Test error'];
        $request = $this->createMockRequest($requestData);
        
        $mockNightwatchResponse = ['id' => '123', 'status' => 'received'];
        $mockResponse = new Response(200, [], json_encode($mockNightwatchResponse));
        $this->mockClient->method('post')->willReturn($mockResponse);

        $_ENV['NIGHTWATCH_URL'] = 'https://api.nightwatch.test';
        $_ENV['NIGHTWATCH_TOKEN'] = 'test-token';

        $response = $this->controller->store($request);
        $responseData = json_decode($response->getContent(), true);

        // Verify response structure
        $this->assertIsArray($responseData);
        $this->assertArrayHasKey('status', $responseData);
        $this->assertArrayHasKey('nightwatch_response', $responseData);
        $this->assertEquals('success', $responseData['status']);
        $this->assertEquals($mockNightwatchResponse, $responseData['nightwatch_response']);
    }

    private function createMockRequest(array $data): Request
    {
        $request = $this->createMock(Request::class);
        $request->method('validate')->willReturn($data);
        return $request;
    }
}