<?php

namespace Nightwatch\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use GuzzleHttp\Client;

class NightwatchController extends Controller
{
    private $client;

    public function __construct($client = null)
    {
        $this->client = $client ?: new Client();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'message'        => 'nullable|string',
            'result'         => 'nullable|array',
            'error'          => 'nullable|string',
            'elapsed_ms'     => 'nullable|integer',
            'server_country' => 'nullable|string',
            'ping_ms'        => 'nullable|integer',
        ]);

        $nightwatchUrl = env('NIGHTWATCH_URL', 'https://api.nightwatch.io/events');

        try {
            $response = $this->client->post($nightwatchUrl, [
                'json' => $data,
                'headers' => [
                    'Authorization' => 'Bearer ' . env('NIGHTWATCH_TOKEN', ''),
                ],
            ]);

            return response()->json([
                'status' => 'success',
                'nightwatch_response' => json_decode($response->getBody(), true),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}