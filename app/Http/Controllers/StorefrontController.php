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
        $storefrontClient = $this->getStorefrontClient($request->get('shop'));

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

    /**
     * Creates a new checkout.
     * https://shopify.dev/api/storefront/2022-04/mutations/checkoutCreate
     *
     * @param Request $request
     * @return \Illuminate\Contracts\Foundation\Application|\Illuminate\Contracts\Routing\ResponseFactory|\Illuminate\Http\Response
     * @throws \Shopify\Exception\HttpRequestException
     * @throws \Shopify\Exception\MissingArgumentException
     */
    public function createCheckout(Request $request)
    {
        $data = $request->post();
        $storefrontClient = $this->getStorefrontClient($request->get('shop'));

        $data['lineItems'][0]['variantId'] = (int) $data['lineItems'][0]['variantId'];
        $data['lineItems'][0]['quantity'] = (int) $data['lineItems'][0]['quantity'];

        // Call query and pass your query as `data`
        $result = $storefrontClient->query(
            'mutation checkoutCreate($input: CheckoutCreateInput!) {
              checkoutCreate(input: $input) {
                checkout {
                    id
                    webUrl
                    customAttributes {
                        key
                        value
                    }
                    lineItems(first: 5) {
                       edges {
                         node {
                           id
                           title
                           quantity
                         }
                       }
                    }
                    note
                }
                checkoutUserErrors {
                    code
                    field
                    message
                }
                queueToken
              }
            }',
            [
                'variables' => [
                    'input' => $data
                ]
            ]
        );

        return response($result->getDecodedBody());
    }

    private function getStorefrontClient($shop = null)
    {
        $shop = $shop ?: Config::get('shopify.shop');

        // The Storefront client takes in the shop url and the Storefront Access Token for that shop.
        return new Storefront($shop, config('shopify.storefront_token'));
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
