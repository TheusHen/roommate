<?php

namespace Nightwatch;

use Illuminate\Support\ServiceProvider;

class NightwatchServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot()
    {
        $this->loadRoutesFrom(__DIR__ . '/routes.php');
    }

    /**
     * Register any application services.
     */
    public function register()
    {
        //
    }
}