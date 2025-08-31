<?php

namespace Illuminate\Http;

class Request
{
    public function validate(array $rules)
    {
        // Simple validation mock - just return the input data
        return [];
    }
}