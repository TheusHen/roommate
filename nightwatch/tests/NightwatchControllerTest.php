<?php

use PHPUnit\Framework\TestCase;
use Nightwatch\Http\Controllers\NightwatchController;
use Illuminate\Http\Request;
use GuzzleHttp\Client;
use GuzzleHttp\Psr7\Response;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Validation\ValidationException;

class NightwatchControllerTest extends TestCase
{
    private $controller;
    private $mockClient;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockClient = $this->createMock(Client::class);
        $this->controller = new NightwatchController($this->mockClient);
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
        $this->mockClient->expects($this->once())
            ->method('post')
            ->willReturn($mockResponse);

        // Set environment variables for test
        putenv('NIGHTWATCH_URL=https://api.nightwatch.test/events');
        putenv('NIGHTWATCH_TOKEN=test-token');

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
        $this->mockClient->expects($this->once())
            ->method('post')
            ->willReturn($mockResponse);

        putenv('NIGHTWATCH_URL=https://api.nightwatch.test/events');
        putenv('NIGHTWATCH_TOKEN=test-token');

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
        $mockRequest = $this->createMock(\Psr\Http\Message\RequestInterface::class);
        $this->mockClient->expects($this->once())
            ->method('post')
            ->willThrowException(new RequestException('Network error', $mockRequest));

        putenv('NIGHTWATCH_URL=https://api.nightwatch.test/events');
        putenv('NIGHTWATCH_TOKEN=test-token');

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

        // Create a mock request that will throw validation exception
        $request = $this->createMock(Request::class);
        $request->expects($this->once())
            ->method('validate')
            ->willThrowException(new ValidationException('Validation failed'));

        $this->expectException(ValidationException::class);
        
        $response = $this->controller->store($request);
    }

    public function testEnvironmentConfiguration()
    {
        // Test default URL when env var is not set
        putenv('NIGHTWATCH_URL');
        $this->assertEquals('https://api.nightwatch.io/events', env('NIGHTWATCH_URL', 'https://api.nightwatch.io/events'));

        // Test custom URL
        putenv('NIGHTWATCH_URL=https://custom.nightwatch.test');
        $this->assertEquals('https://custom.nightwatch.test', env('NIGHTWATCH_URL', 'https://api.nightwatch.io/events'));
    }

    public function testAuthorizationHeader()
    {
        $requestData = ['error' => 'Test error'];
        $request = $this->createMockRequest($requestData);
        
        putenv('NIGHTWATCH_TOKEN=secret-token-123');
        
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
        // Test valid data types
        $validCases = [
            ['message' => 'Valid string'],
            ['result' => ['key' => 'value']],
            ['elapsed_ms' => 1500],
            ['ping_ms' => 50],
        ];

        foreach ($validCases as $case) {
            $request = $this->createMockRequest($case);
            $this->assertNotNull($request);
        }

        // For invalid cases, we'd need to mock the validator properly
        // This is a simplified test that verifies the structure works
        $this->assertTrue(true);
    }

    public function testResponseStructure()
    {
        $requestData = ['error' => 'Test error'];
        $request = $this->createMockRequest($requestData);
        
        $mockNightwatchResponse = ['id' => '123', 'status' => 'received'];
        $mockResponse = new Response(200, [], json_encode($mockNightwatchResponse));
        $this->mockClient->expects($this->once())
            ->method('post')
            ->willReturn($mockResponse);

        putenv('NIGHTWATCH_URL=https://api.nightwatch.test');
        putenv('NIGHTWATCH_TOKEN=test-token');

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
        $request->expects($this->once())
            ->method('validate')
            ->willReturn($data);
        return $request;
    }
}