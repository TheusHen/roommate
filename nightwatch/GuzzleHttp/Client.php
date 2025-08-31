<?php

namespace GuzzleHttp;

class Client
{
    public function post($url, $options = [])
    {
        // Mock response
        return new class {
            public function getBody() {
                return '{"status":"received","id":"test-123"}';
            }
        };
    }
}