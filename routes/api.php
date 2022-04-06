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

Route::get('/app/settings', [AppController::class, 'settings'])->middleware('cors');
Route::post('/app/{mode}', [AppController::class, 'index'])->where(['mode' => '(enable|disable)'])->middleware('cors');

Route::get('/storefront/products', [StorefrontController::class, 'products'])->middleware('cors');
