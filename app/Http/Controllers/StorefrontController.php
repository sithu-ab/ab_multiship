<?php

namespace App\Http\Controllers;

use App\Models\Session;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Shopify\Clients\Rest;
use Shopify\Clients\Storefront;

class StorefrontController extends Controller
{
    /**
     * @param Request $request
     * @throws \Shopify\Exception\HttpRequestException
     * @throws \Shopify\Exception\MissingArgumentException
     */
    public function products(Request $request)
    {
        $shop = $request->get('shop', Config::get('shopify.shop'));

        // The Storefront client takes in the shop url and the Storefront Access Token for that shop.
        $storefrontClient = new Storefront($shop, config('shopify.storefront_token'));

        // Call query and pass your query as `data`
        $products = $storefrontClient->query(
            <<<QUERY
            {
                products (first: 3) {
                    edges {
                        node {
                            id
                            title
                        }
                    }
                }
            }
            QUERY,
        );

        return response($products->getDecodedBody()['data']['products']['edges']);
    }

    private function getStorefrontAccessToken()
    {
        // Create a REST client from your offline session
        $client = $this->getClient();

        // Create a new access token
        $response = $client->post(
            'storefront_access_tokens',
            [
                "storefront_access_token" => [
                    "title" => "This is my test access token",
                ]
            ],
        );

        if ($response->getStatusCode() == 200) {
            return $response->getDecodedBody()['storefront_access_token']['access_token'];
        }

        dd($response->getDecodedBody());
    }

    /**
     * Get Rest Client
     * @param string|null $shop
     * @return Rest
     * @throws \Shopify\Exception\MissingArgumentException
     */
    private function getClient(string $shop = null): Rest
    {
        $shop = $shop ?: Config::get('shopify.shop');

        $session = Session::where('shop', $shop)
            ->where('is_online', true)
            ->whereNotNull('user_id')
            ->orderBy('created_at', 'desc')
            ->first();

        return new Rest($session->shop, $session->access_token);
    }
}
