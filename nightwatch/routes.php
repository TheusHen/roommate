<?php

use Illuminate\Support\Facades\Route;
use Nightwatch\Http\Controllers\NightwatchController;

Route::post('/nightwatch', [NightwatchController::class, 'store']);