<?php

use App\Http\Controllers\AppController;
use App\Http\Controllers\StorefrontController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::get('/', function () {
    return "Hello API";
});

Route::get('/app/settings', [AppController::class, 'settings']);
Route::post('/app/{mode}', [AppController::class, 'index'])->where(['mode' => '(enable|disable)']);
Route::get('/app/checkout/{token}', [AppController::class, 'checkout']);
Route::get('/app/checkout/{token}/shipping-rates', [AppController::class, 'checkoutShippingRates']);
Route::get('/app/shipping-zones', [AppController::class, 'shippingZones']);

Route::get('/storefront/products', [StorefrontController::class, 'products']);
