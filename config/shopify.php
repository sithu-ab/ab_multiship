<?php

return [
    'api_key' => env('SHOPIFY_API_KEY', ''),
    'api_secret' => env('SHOPIFY_API_SECRET', ''),
    'api_version' => '2022-04',
    'scopes' => env('SCOPES', ['']),
    'host' => env('HOST', ''),
    'shop' => env('SHOP'),
    'storefront_token' => env('STOREFRONT_TOKEN', ''),
    'theme_id' => env('SHOPIFY_THEME_ID', ''),
];
